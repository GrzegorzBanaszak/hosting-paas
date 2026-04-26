using System.Text.Json;
using Api.Configuration;
using Api.Domain.Entities;
using Api.Domain.Enums;
using Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure.Deployments;

public sealed class DeploymentPipelineWorker(
    IServiceScopeFactory scopeFactory,
    IDeploymentQueue deploymentQueue,
    DeploymentCommandRunner commandRunner,
    IHostEnvironment hostEnvironment,
    IOptions<DeploymentPipelineOptions> options,
    ILogger<DeploymentPipelineWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverPendingDeploymentsAsync(stoppingToken);

        await foreach (var deploymentId in deploymentQueue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                await ProcessDeploymentAsync(deploymentId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Deployment worker crashed while handling deployment {DeploymentId}.", deploymentId);
            }
        }
    }

    private async Task RecoverPendingDeploymentsAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var recoverableDeployments = await dbContext.Deployments
            .Where(deployment =>
                deployment.Status == DeploymentStatus.Queued ||
                (deployment.Status == DeploymentStatus.Running && deployment.FinishedAtUtc == null))
            .OrderBy(deployment => deployment.CreatedAtUtc)
            .Select(deployment => deployment.Id)
            .ToListAsync(cancellationToken);

        foreach (var deploymentId in recoverableDeployments)
        {
            await deploymentQueue.QueueAsync(deploymentId, cancellationToken);
        }
    }

    private async Task ProcessDeploymentAsync(Guid deploymentId, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= options.Value.MaxRetryAttempts; attempt++)
        {
            try
            {
                await ExecuteAttemptAsync(deploymentId, attempt, cancellationToken);
                return;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                var isLastAttempt = attempt >= options.Value.MaxRetryAttempts;
                await MarkAttemptFailureAsync(deploymentId, attempt, isLastAttempt, exception, cancellationToken);

                if (isLastAttempt)
                {
                    return;
                }

                await Task.Delay(TimeSpan.FromSeconds(options.Value.RetryDelaySeconds), cancellationToken);
            }
        }
    }

    private async Task ExecuteAttemptAsync(Guid deploymentId, int attempt, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deployment = await dbContext.Deployments
            .Include(item => item.App)
            .Include(item => item.Repository)
            .FirstOrDefaultAsync(item => item.Id == deploymentId, cancellationToken);

        if (deployment is null)
        {
            logger.LogWarning("Skipping unknown deployment {DeploymentId}.", deploymentId);
            return;
        }

        if (deployment.Status is DeploymentStatus.Succeeded or DeploymentStatus.Cancelled)
        {
            return;
        }

        deployment.Status = DeploymentStatus.Running;
        deployment.StartedAtUtc ??= DateTime.UtcNow;
        deployment.FinishedAtUtc = null;
        deployment.FailureReason = null;
        deployment.App.Status = AppStatus.Starting;

        AddLog(dbContext, deployment, DeploymentLogSources.Worker, LogEntryLevel.Information, $"Starting deployment attempt {attempt}.");
        await dbContext.SaveChangesAsync(cancellationToken);

        await RunBuildStageAsync(dbContext, deployment, cancellationToken);
        await RunPublishStageAsync(dbContext, deployment, cancellationToken);
        await RunRestartStageAsync(dbContext, deployment, cancellationToken);

        deployment.Status = DeploymentStatus.Succeeded;
        deployment.FinishedAtUtc = DateTime.UtcNow;
        deployment.App.Status = AppStatus.Running;

        AddLog(dbContext, deployment, DeploymentLogSources.Worker, LogEntryLevel.Information, "Deployment pipeline completed successfully.");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task RunBuildStageAsync(AppDbContext dbContext, Deployment deployment, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Build, LogEntryLevel.Information, "Build stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(deployment.App.BuildCommand))
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Build, LogEntryLevel.Information, "Build command is not configured. Skipping build stage.");
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var workingDirectory = ResolveWorkingDirectory(deployment.App.ProjectRootPath);
        var result = await commandRunner.RunAsync(deployment.App.BuildCommand, workingDirectory, cancellationToken);

        if (result.ExitCode != 0)
        {
            throw new DeploymentExecutionException($"Build command failed with exit code {result.ExitCode}. {TrimForLog(result.CombinedOutput)}".Trim());
        }

        if (!string.IsNullOrWhiteSpace(result.CombinedOutput))
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Build, LogEntryLevel.Information, $"Build output: {TrimForLog(result.CombinedOutput)}");
        }

        AddLog(dbContext, deployment, DeploymentLogSources.Build, LogEntryLevel.Information, "Build stage completed.");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task RunPublishStageAsync(AppDbContext dbContext, Deployment deployment, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Publish, LogEntryLevel.Information, "Artifact publication stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        var artifactRoot = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, options.Value.ArtifactRootPath));
        var deploymentDirectory = Path.Combine(artifactRoot, deployment.App.Slug, deployment.Id.ToString("N"));
        Directory.CreateDirectory(deploymentDirectory);

        var manifestPath = Path.Combine(deploymentDirectory, "manifest.json");
        var manifest = new
        {
            deployment.Id,
            deployment.AppId,
            deployment.Branch,
            deployment.CommitSha,
            deployment.Trigger,
            PublishedAtUtc = DateTime.UtcNow,
            deployment.App.BuildCommand,
            deployment.App.StartCommand
        };

        await File.WriteAllTextAsync(
            manifestPath,
            JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);

        deployment.ArtifactReference = Path.GetRelativePath(hostEnvironment.ContentRootPath, manifestPath).Replace('\\', '/');

        AddLog(dbContext, deployment, DeploymentLogSources.Publish, LogEntryLevel.Information, $"Artifact manifest saved to '{deployment.ArtifactReference}'.");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task RunRestartStageAsync(AppDbContext dbContext, Deployment deployment, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, "Service restart stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        if (!options.Value.ExecuteStartCommandOnRestart)
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, "Start command execution is disabled. Marking service restart as simulated.");
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var workingDirectory = ResolveWorkingDirectory(deployment.App.ProjectRootPath);
        var result = await commandRunner.RunAsync(deployment.App.StartCommand, workingDirectory, cancellationToken);

        if (result.ExitCode != 0)
        {
            throw new DeploymentExecutionException($"Start command failed with exit code {result.ExitCode}. {TrimForLog(result.CombinedOutput)}".Trim());
        }

        if (!string.IsNullOrWhiteSpace(result.CombinedOutput))
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, $"Restart output: {TrimForLog(result.CombinedOutput)}");
        }

        AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, "Service restart stage completed.");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task MarkAttemptFailureAsync(Guid deploymentId, int attempt, bool isLastAttempt, Exception exception, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deployment = await dbContext.Deployments
            .Include(item => item.App)
            .FirstOrDefaultAsync(item => item.Id == deploymentId, cancellationToken);

        if (deployment is null)
        {
            return;
        }

        deployment.FailureReason = TrimForLog(exception.Message, 1800);

        if (isLastAttempt)
        {
            deployment.Status = DeploymentStatus.Failed;
            deployment.FinishedAtUtc = DateTime.UtcNow;
            deployment.App.Status = AppStatus.Failed;
            AddLog(dbContext, deployment, DeploymentLogSources.Worker, LogEntryLevel.Error, $"Deployment failed after {attempt} attempt(s): {TrimForLog(exception.Message)}");
        }
        else
        {
            deployment.Status = DeploymentStatus.Queued;
            deployment.App.Status = AppStatus.Degraded;
            AddLog(dbContext, deployment, DeploymentLogSources.Worker, LogEntryLevel.Warning, $"Deployment attempt {attempt} failed: {TrimForLog(exception.Message)} Retrying in {options.Value.RetryDelaySeconds} seconds.");
        }

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
            throw new DeploymentExecutionException($"Working directory '{workingDirectory}' does not exist.");
        }

        return workingDirectory;
    }

    private static void AddLog(AppDbContext dbContext, Deployment deployment, string source, LogEntryLevel level, string message)
    {
        dbContext.LogEntries.Add(new LogEntry
        {
            AppId = deployment.AppId,
            DeploymentId = deployment.Id,
            Level = level,
            Source = source,
            Message = TrimForLog(message, 3900),
            TimestampUtc = DateTime.UtcNow
        });
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
}
