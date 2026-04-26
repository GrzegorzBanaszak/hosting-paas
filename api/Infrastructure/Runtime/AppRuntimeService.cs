using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Runtime.InteropServices;
using Api.Configuration;
using Api.Domain.Entities;
using Api.Domain.Enums;
using Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure.Runtime;

public sealed class AppRuntimeService(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    IHostEnvironment hostEnvironment,
    IOptions<RuntimeOptions> options,
    ILogger<AppRuntimeService> logger) : IAppRuntimeService
{
    private readonly ConcurrentDictionary<Guid, ManagedAppProcess> processes = new();
    private readonly ConcurrentDictionary<Guid, AppRuntimeSnapshot> snapshots = new();

    public async Task<AppRuntimeSnapshot> StartAsync(App app, CancellationToken cancellationToken)
    {
        if (app.DeploymentKind is DeploymentKind.StaticSite or DeploymentKind.FrontendSpa)
        {
            throw new InvalidOperationException($"Runtime start is not supported for deployment kind '{app.DeploymentKind}'.");
        }

        if (string.IsNullOrWhiteSpace(app.StartCommand))
        {
            throw new InvalidOperationException("Start command is not configured for this app.");
        }

        if (processes.TryGetValue(app.Id, out var existing) && !existing.Process.HasExited)
        {
            return await GetStatusAsync(app, cancellationToken);
        }

        var workingDirectory = ResolveWorkingDirectory(app.ActiveReleasePath ?? app.ProjectRootPath);
        var startInfo = CreateStartInfo(app.StartCommand, workingDirectory);
        var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };

        process.OutputDataReceived += (_, eventArgs) =>
        {
            if (!string.IsNullOrWhiteSpace(eventArgs.Data))
            {
                _ = WriteRuntimeLogAsync(app.Id, null, RuntimeLogSources.RuntimeStdout, LogEntryLevel.Information, eventArgs.Data, CancellationToken.None);
            }
        };

        process.ErrorDataReceived += (_, eventArgs) =>
        {
            if (!string.IsNullOrWhiteSpace(eventArgs.Data))
            {
                _ = WriteRuntimeLogAsync(app.Id, null, RuntimeLogSources.RuntimeStderr, LogEntryLevel.Error, eventArgs.Data, CancellationToken.None);
            }
        };

        if (!process.Start())
        {
            throw new InvalidOperationException("Failed to start application process.");
        }

        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        var startedAtUtc = DateTime.UtcNow;
        var managedProcess = new ManagedAppProcess(process, startedAtUtc);
        processes.AddOrUpdate(app.Id, managedProcess, (_, previous) =>
        {
            TryKill(previous.Process);
            return managedProcess;
        });

        await UpdateAppStatusAsync(app.Id, AppStatus.Running, cancellationToken);
        await WriteRuntimeLogAsync(app.Id, null, RuntimeLogSources.Runtime, LogEntryLevel.Information, $"Application started with PID {process.Id}.", cancellationToken);
        var snapshot = managedProcess.ToSnapshot(app.Id, "Running", BuildHealthCheckUrl(app));
        snapshots[app.Id] = snapshot;
        return snapshot;
    }

    public async Task<AppRuntimeSnapshot> StopAsync(App app, CancellationToken cancellationToken)
    {
        if (!processes.TryRemove(app.Id, out var managedProcess))
        {
            await UpdateAppStatusAsync(app.Id, AppStatus.Stopped, cancellationToken);
            await WriteRuntimeLogAsync(app.Id, null, RuntimeLogSources.Runtime, LogEntryLevel.Information, "Stop requested but no managed runtime process was active.", cancellationToken);
            var stoppedSnapshot = new AppRuntimeSnapshot(
                app.Id,
                AppStatus.Stopped.ToString(),
                null,
                null,
                DateTime.UtcNow,
                null,
                null,
                false,
                RuntimeHealthStatus.Unknown,
                null,
                null,
                BuildHealthCheckUrl(app));
            snapshots[app.Id] = stoppedSnapshot;
            return stoppedSnapshot;
        }

        TryKill(managedProcess.Process);
        managedProcess.LastExitedAtUtc = DateTime.UtcNow;
        managedProcess.LastExitCode = managedProcess.Process.HasExited ? managedProcess.Process.ExitCode : null;

        await UpdateAppStatusAsync(app.Id, AppStatus.Stopped, cancellationToken);
        await WriteRuntimeLogAsync(app.Id, null, RuntimeLogSources.Runtime, LogEntryLevel.Warning, "Application process stopped.", cancellationToken);

        var snapshot = managedProcess.ToSnapshot(app.Id, "Stopped", BuildHealthCheckUrl(app)) with
        {
            ProcessId = null,
            IsManaged = false
        };
        snapshots[app.Id] = snapshot;
        return snapshot;
    }

    public async Task<AppRuntimeSnapshot> RestartAsync(App app, CancellationToken cancellationToken)
    {
        await StopAsync(app, cancellationToken);
        return await StartAsync(app, cancellationToken);
    }

    public async Task<AppRuntimeSnapshot> GetStatusAsync(App app, CancellationToken cancellationToken)
    {
        if (processes.TryGetValue(app.Id, out var managedProcess))
        {
            if (!managedProcess.Process.HasExited)
            {
                var snapshot = managedProcess.ToSnapshot(app.Id, "Running", BuildHealthCheckUrl(app));
                snapshots[app.Id] = snapshot;
                return snapshot;
            }

            processes.TryRemove(app.Id, out _);
        }

        var status = await GetPersistedAppStatusAsync(app.Id, cancellationToken);
        if (snapshots.TryGetValue(app.Id, out var existingSnapshot))
        {
            return existingSnapshot with
            {
                State = status.ToString(),
                ProcessId = null,
                IsManaged = false,
                HealthCheckUrl = BuildHealthCheckUrl(app)
            };
        }

        return new AppRuntimeSnapshot(
            app.Id,
            status.ToString(),
            null,
            null,
            null,
            null,
            null,
            false,
            RuntimeHealthStatus.Unknown,
            null,
            null,
            BuildHealthCheckUrl(app));
    }

    public async Task<AppRuntimeSnapshot> CheckHealthAsync(App app, CancellationToken cancellationToken)
    {
        var snapshot = await GetStatusAsync(app, cancellationToken);
        var healthCheckUrl = BuildHealthCheckUrl(app);

        if (string.IsNullOrWhiteSpace(healthCheckUrl))
        {
            return snapshot with
            {
                HealthStatus = RuntimeHealthStatus.Unknown,
                LastError = "App does not have a local health check URL."
            };
        }

        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(options.Value.HealthCheckTimeoutSeconds));

            var client = httpClientFactory.CreateClient(nameof(AppRuntimeService));
            using var response = await client.GetAsync(healthCheckUrl, timeoutCts.Token);
            var healthStatus = response.IsSuccessStatusCode
                ? RuntimeHealthStatus.Healthy
                : RuntimeHealthStatus.Unhealthy;

            await WriteRuntimeLogAsync(
                app.Id,
                null,
                RuntimeLogSources.RuntimeHealth,
                response.IsSuccessStatusCode ? LogEntryLevel.Information : LogEntryLevel.Warning,
                $"Healthcheck returned {(int)response.StatusCode} for '{healthCheckUrl}'.",
                cancellationToken);

            var updatedSnapshot = snapshot with
            {
                HealthStatus = healthStatus,
                HealthStatusCode = (int)response.StatusCode,
                LastHealthCheckAtUtc = DateTime.UtcNow,
                HealthCheckUrl = healthCheckUrl,
                LastError = response.IsSuccessStatusCode ? null : $"Healthcheck failed with status {(int)response.StatusCode}."
            };
            snapshots[app.Id] = updatedSnapshot;
            return updatedSnapshot;
        }
        catch (Exception exception)
        {
            await WriteRuntimeLogAsync(
                app.Id,
                null,
                RuntimeLogSources.RuntimeHealth,
                LogEntryLevel.Error,
                $"Healthcheck failed for '{healthCheckUrl}': {TrimForLog(exception.Message)}",
                cancellationToken);

            var updatedSnapshot = snapshot with
            {
                HealthStatus = RuntimeHealthStatus.Unhealthy,
                LastHealthCheckAtUtc = DateTime.UtcNow,
                HealthCheckUrl = healthCheckUrl,
                LastError = exception.Message
            };
            snapshots[app.Id] = updatedSnapshot;
            return updatedSnapshot;
        }
    }

    public async Task RefreshExitedProcessesAsync(CancellationToken cancellationToken)
    {
        foreach (var pair in processes.ToArray())
        {
            if (!pair.Value.Process.HasExited)
            {
                continue;
            }

            if (!processes.TryRemove(pair.Key, out var managedProcess))
            {
                continue;
            }

            managedProcess.LastExitedAtUtc = DateTime.UtcNow;
            managedProcess.LastExitCode = managedProcess.Process.ExitCode;

            var status = managedProcess.Process.ExitCode == 0
                ? AppStatus.Stopped
                : AppStatus.Failed;

            await UpdateAppStatusAsync(pair.Key, status, cancellationToken);
            await WriteRuntimeLogAsync(
                pair.Key,
                null,
                RuntimeLogSources.Runtime,
                managedProcess.Process.ExitCode == 0 ? LogEntryLevel.Warning : LogEntryLevel.Error,
                $"Application process exited with code {managedProcess.Process.ExitCode}.",
                cancellationToken);

            snapshots[pair.Key] = managedProcess.ToSnapshot(pair.Key, status.ToString(), null) with
            {
                ProcessId = null,
                IsManaged = false
            };

            logger.LogInformation("Managed runtime process for app {AppId} exited with code {ExitCode}.", pair.Key, managedProcess.Process.ExitCode);
        }
    }

    private async Task<AppStatus> GetPersistedAppStatusAsync(Guid appId, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var status = await dbContext.Apps
            .AsNoTracking()
            .Where(app => app.Id == appId)
            .Select(app => app.Status)
            .FirstOrDefaultAsync(cancellationToken);

        return status;
    }

    private async Task UpdateAppStatusAsync(Guid appId, AppStatus status, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var app = await dbContext.Apps.FirstOrDefaultAsync(item => item.Id == appId, cancellationToken);

        if (app is null)
        {
            return;
        }

        app.Status = status;
        app.UpdatedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task WriteRuntimeLogAsync(Guid appId, Guid? deploymentId, string source, LogEntryLevel level, string message, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.LogEntries.Add(new LogEntry
        {
            AppId = appId,
            DeploymentId = deploymentId,
            Source = source,
            Level = level,
            Message = TrimForLog(message, 3900),
            TimestampUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private string ResolveWorkingDirectory(string? configuredPath)
    {
        var workingDirectory = string.IsNullOrWhiteSpace(configuredPath)
            ? hostEnvironment.ContentRootPath
            : configuredPath.Trim();

        if (!Path.IsPathRooted(workingDirectory))
        {
            workingDirectory = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, workingDirectory));
        }

        if (!Directory.Exists(workingDirectory))
        {
            throw new InvalidOperationException($"Working directory '{workingDirectory}' does not exist.");
        }

        return workingDirectory;
    }

    private ProcessStartInfo CreateStartInfo(string command, string workingDirectory)
    {
        var startInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? new ProcessStartInfo("powershell")
            : new ProcessStartInfo("/bin/sh");

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            startInfo.ArgumentList.Add("-NoProfile");
            startInfo.ArgumentList.Add("-Command");
            startInfo.ArgumentList.Add(command);
        }
        else
        {
            startInfo.ArgumentList.Add("-lc");
            startInfo.ArgumentList.Add(command);
        }

        startInfo.WorkingDirectory = workingDirectory;
        startInfo.RedirectStandardOutput = true;
        startInfo.RedirectStandardError = true;
        startInfo.UseShellExecute = false;
        startInfo.CreateNoWindow = true;

        return startInfo;
    }

    private string? BuildHealthCheckUrl(App app)
    {
        if (!app.Port.HasValue)
        {
            return null;
        }

        return $"http://{options.Value.LocalHealthCheckHost}:{app.Port.Value}{app.HealthCheckPath}";
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                process.WaitForExit(5000);
            }
        }
        catch
        {
            // Ignore cleanup errors.
        }
    }

    private static string TrimForLog(string? value, int maxLength = 1200)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().Replace(Environment.NewLine, " ").Replace('\n', ' ').Replace('\r', ' ');
        return normalized.Length <= maxLength
            ? normalized
            : $"{normalized[..(maxLength - 3)]}...";
    }

    private sealed class ManagedAppProcess(Process process, DateTime startedAtUtc)
    {
        public Process Process { get; } = process;

        public DateTime StartedAtUtc { get; } = startedAtUtc;

        public DateTime? LastExitedAtUtc { get; set; }

        public int? LastExitCode { get; set; }

        public string? LastError { get; set; }

        public RuntimeHealthStatus HealthStatus { get; set; } = RuntimeHealthStatus.Unknown;

        public int? HealthStatusCode { get; set; }

        public DateTime? LastHealthCheckAtUtc { get; set; }

        public AppRuntimeSnapshot ToSnapshot(Guid appId, string state, string? healthCheckUrl)
        {
            return new AppRuntimeSnapshot(
                appId,
                state,
                Process.Id,
                StartedAtUtc,
                LastExitedAtUtc,
                LastExitCode,
                LastError,
                true,
                HealthStatus,
                HealthStatusCode,
                LastHealthCheckAtUtc,
                healthCheckUrl);
        }
    }
}
