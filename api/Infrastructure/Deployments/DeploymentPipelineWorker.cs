using System.Text.Json;
using Api.Configuration;
using Api.Domain.Entities;
using Api.Domain.Enums;
using Api.Infrastructure.Persistence;
using Api.Infrastructure.Runtime;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure.Deployments;

public sealed class DeploymentPipelineWorker(
    IServiceScopeFactory scopeFactory,
    IDeploymentQueue deploymentQueue,
    DeploymentCommandRunner commandRunner,
    IHostEnvironment hostEnvironment,
    IAppRuntimeService runtimeService,
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
        deployment.ActivatedAtUtc = null;
        deployment.App.Status = AppStatus.Starting;

        AddLog(dbContext, deployment, DeploymentLogSources.Worker, LogEntryLevel.Information, $"Starting deployment attempt {attempt}.");
        await dbContext.SaveChangesAsync(cancellationToken);

        ActivationContext? activationContext = null;

        try
        {
            var sourceContext = await RunSourceAcquisitionStageAsync(dbContext, deployment, cancellationToken);
            await RunProjectDetectionStageAsync(dbContext, deployment, sourceContext.ProjectRootPath, cancellationToken);
            await RunBuildStageAsync(dbContext, deployment, sourceContext.ProjectRootPath, cancellationToken);
            var publishContext = await RunPublishStageAsync(dbContext, deployment, sourceContext.ProjectRootPath, cancellationToken);
            activationContext = await RunActivationStageAsync(dbContext, deployment, publishContext.ReleasePath, cancellationToken);
            await RunRestartStageAsync(dbContext, deployment, cancellationToken);
            await RunVerificationStageAsync(dbContext, deployment, activationContext.CurrentPath, cancellationToken);

            if (!string.IsNullOrWhiteSpace(activationContext.PreviousPath) && Directory.Exists(activationContext.PreviousPath))
            {
                Directory.Delete(activationContext.PreviousPath, recursive: true);
            }

            deployment.Status = DeploymentStatus.Succeeded;
            deployment.FinishedAtUtc = DateTime.UtcNow;
            deployment.App.Status = deployment.DeploymentKind is DeploymentKind.StaticSite or DeploymentKind.FrontendSpa
                ? AppStatus.Running
                : deployment.App.Status;

            AddLog(dbContext, deployment, DeploymentLogSources.Worker, LogEntryLevel.Information, "Deployment pipeline completed successfully.");
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            if (activationContext is not null)
            {
                await TryRollbackActivationAsync(dbContext, deployment, activationContext, cancellationToken);
            }

            throw;
        }
    }

    private async Task<SourceContext> RunSourceAcquisitionStageAsync(AppDbContext dbContext, Deployment deployment, CancellationToken cancellationToken)
    {
        if (deployment.Repository is null)
        {
            throw new DeploymentExecutionException("Deployment does not have a connected repository.");
        }

        AddLog(dbContext, deployment, DeploymentLogSources.SourceAcquisition, LogEntryLevel.Information, "Source acquisition stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        var workspacePath = GetScopedDirectory(options.Value.WorkspaceRootPath, deployment.App.Slug, deployment.Id);
        var workspaceParent = Directory.GetParent(workspacePath)?.FullName
            ?? throw new DeploymentExecutionException("Could not resolve workspace parent directory.");

        if (Directory.Exists(workspacePath))
        {
            Directory.Delete(workspacePath, recursive: true);
        }

        Directory.CreateDirectory(workspaceParent);

        var cloneCommand = $"git clone --branch {Quote(deployment.Branch)} --single-branch {Quote(deployment.Repository.CloneUrl)} {Quote(workspacePath)}";
        var cloneResult = await commandRunner.RunAsync(cloneCommand, workspaceParent, cancellationToken);

        if (cloneResult.ExitCode != 0)
        {
            throw new DeploymentExecutionException($"Repository clone failed with exit code {cloneResult.ExitCode}. {TrimForLog(cloneResult.CombinedOutput)}".Trim());
        }

        if (!string.IsNullOrWhiteSpace(deployment.CommitSha))
        {
            var checkoutResult = await commandRunner.RunAsync($"git checkout {Quote(deployment.CommitSha)}", workspacePath, cancellationToken);

            if (checkoutResult.ExitCode != 0)
            {
                throw new DeploymentExecutionException($"Commit checkout failed with exit code {checkoutResult.ExitCode}. {TrimForLog(checkoutResult.CombinedOutput)}".Trim());
            }
        }
        else
        {
            var headResult = await commandRunner.RunAsync("git rev-parse HEAD", workspacePath, cancellationToken);

            if (headResult.ExitCode != 0)
            {
                throw new DeploymentExecutionException($"Failed to resolve HEAD commit. {TrimForLog(headResult.CombinedOutput)}".Trim());
            }

            deployment.CommitSha = headResult.StandardOutput.Trim();
        }

        deployment.WorkspacePath = workspacePath;

        var projectRootPath = ResolveProjectRootPath(workspacePath, deployment.App.ProjectRootPath);
        AddLog(dbContext, deployment, DeploymentLogSources.SourceAcquisition, LogEntryLevel.Information, $"Repository prepared in workspace '{workspacePath}' for commit '{deployment.CommitSha}'.");
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SourceContext(workspacePath, projectRootPath);
    }

    private async Task RunProjectDetectionStageAsync(AppDbContext dbContext, Deployment deployment, string projectRootPath, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.ProjectDetection, LogEntryLevel.Information, "Project detection stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        var detectedKind = DetectDeploymentKind(projectRootPath, deployment.App.DeploymentKind);
        deployment.DeploymentKind = detectedKind;

        AddLog(dbContext, deployment, DeploymentLogSources.ProjectDetection, LogEntryLevel.Information, $"Detected deployment kind '{detectedKind}'.");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task RunBuildStageAsync(AppDbContext dbContext, Deployment deployment, string projectRootPath, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Build, LogEntryLevel.Information, "Build stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(deployment.App.BuildCommand))
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Build, LogEntryLevel.Information, "Build command is not configured. Skipping build stage.");
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var result = await commandRunner.RunAsync(deployment.App.BuildCommand, projectRootPath, cancellationToken);

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

    private async Task<PublishContext> RunPublishStageAsync(AppDbContext dbContext, Deployment deployment, string projectRootPath, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Publish, LogEntryLevel.Information, "Publish stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        var publishSourcePath = ResolvePublishSourcePath(projectRootPath, deployment);
        var releasePath = GetScopedDirectory(options.Value.ReleaseRootPath, deployment.App.Slug, deployment.Id);

        if (Directory.Exists(releasePath))
        {
            Directory.Delete(releasePath, recursive: true);
        }

        Directory.CreateDirectory(releasePath);
        CopyDirectoryContents(publishSourcePath, releasePath);

        var manifestPath = Path.Combine(releasePath, "manifest.json");
        var manifest = new
        {
            deployment.Id,
            deployment.AppId,
            deployment.Branch,
            deployment.CommitSha,
            deployment.Trigger,
            DeploymentKind = deployment.DeploymentKind.ToString(),
            WorkspacePath = deployment.WorkspacePath,
            PublishSourcePath = publishSourcePath,
            PublishedAtUtc = DateTime.UtcNow,
            deployment.App.BuildCommand,
            deployment.App.StartCommand
        };

        await File.WriteAllTextAsync(
            manifestPath,
            JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);

        deployment.ReleasePath = releasePath;
        deployment.ArtifactReference = Path.GetRelativePath(hostEnvironment.ContentRootPath, manifestPath).Replace('\\', '/');

        AddLog(dbContext, deployment, DeploymentLogSources.Publish, LogEntryLevel.Information, $"Release published from '{publishSourcePath}' to '{releasePath}'.");
        await dbContext.SaveChangesAsync(cancellationToken);

        return new PublishContext(releasePath);
    }

    private async Task<ActivationContext> RunActivationStageAsync(AppDbContext dbContext, Deployment deployment, string releasePath, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Activation, LogEntryLevel.Information, "Activation stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        var currentPath = GetCurrentDirectory(deployment.App.Slug);
        var previousPath = $"{currentPath}.previous";

        if (Directory.Exists(previousPath))
        {
            Directory.Delete(previousPath, recursive: true);
        }

        Directory.CreateDirectory(Path.GetDirectoryName(currentPath)!);

        if (Directory.Exists(currentPath))
        {
            Directory.Move(currentPath, previousPath);
        }

        Directory.CreateDirectory(currentPath);
        CopyDirectoryContents(releasePath, currentPath);

        deployment.App.ActiveReleasePath = currentPath;
        deployment.App.UpdatedAtUtc = DateTime.UtcNow;
        deployment.ActivatedAtUtc = DateTime.UtcNow;

        AddLog(dbContext, deployment, DeploymentLogSources.Activation, LogEntryLevel.Information, $"Activated release '{releasePath}' as current path '{currentPath}'.");
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ActivationContext(currentPath, Directory.Exists(previousPath) ? previousPath : null);
    }

    private async Task RunRestartStageAsync(AppDbContext dbContext, Deployment deployment, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, "Service restart stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        if (deployment.DeploymentKind is DeploymentKind.StaticSite or DeploymentKind.FrontendSpa)
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, $"Skipping runtime restart for deployment kind '{deployment.DeploymentKind}'.");
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        if (!options.Value.ExecuteStartCommandOnRestart)
        {
            AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, "Start command execution is disabled. Marking service restart as simulated.");
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        if (string.IsNullOrWhiteSpace(deployment.App.StartCommand))
        {
            throw new DeploymentExecutionException("Start command is required for runtime deployments.");
        }

        await runtimeService.RestartAsync(deployment.App, cancellationToken);

        AddLog(dbContext, deployment, DeploymentLogSources.Restart, LogEntryLevel.Information, "Service restart stage completed.");
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task RunVerificationStageAsync(AppDbContext dbContext, Deployment deployment, string currentPath, CancellationToken cancellationToken)
    {
        AddLog(dbContext, deployment, DeploymentLogSources.Verification, LogEntryLevel.Information, "Verification stage started.");
        await dbContext.SaveChangesAsync(cancellationToken);

        switch (deployment.DeploymentKind)
        {
            case DeploymentKind.StaticSite:
            case DeploymentKind.FrontendSpa:
            {
                var indexPath = Path.Combine(currentPath, "index.html");
                if (!File.Exists(indexPath))
                {
                    throw new DeploymentExecutionException($"Smoke test failed. Missing entry file '{indexPath}'.");
                }

                AddLog(dbContext, deployment, DeploymentLogSources.Verification, LogEntryLevel.Information, $"Smoke test passed. Found '{indexPath}'.");
                break;
            }
            case DeploymentKind.BackendApi:
            case DeploymentKind.Fullstack:
            {
                if (options.Value.ExecuteStartCommandOnRestart && deployment.App.Port.HasValue)
                {
                    using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                    timeoutCts.CancelAfter(TimeSpan.FromSeconds(options.Value.VerificationTimeoutSeconds));

                    var snapshot = await runtimeService.CheckHealthAsync(deployment.App, timeoutCts.Token);
                    if (snapshot.HealthStatus != RuntimeHealthStatus.Healthy)
                    {
                        throw new DeploymentExecutionException($"Smoke test failed. Healthcheck status is '{snapshot.HealthStatus}'.");
                    }

                    AddLog(dbContext, deployment, DeploymentLogSources.Verification, LogEntryLevel.Information, $"Smoke test passed for '{snapshot.HealthCheckUrl}'.");
                }
                else
                {
                    if (!Directory.EnumerateFileSystemEntries(currentPath).Any())
                    {
                        throw new DeploymentExecutionException("Smoke test failed. Active release directory is empty.");
                    }

                    AddLog(dbContext, deployment, DeploymentLogSources.Verification, LogEntryLevel.Information, "Smoke test passed by validating non-empty active release directory.");
                }

                break;
            }
            default:
                throw new DeploymentExecutionException($"Unsupported deployment kind '{deployment.DeploymentKind}'.");
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task TryRollbackActivationAsync(AppDbContext dbContext, Deployment deployment, ActivationContext activationContext, CancellationToken cancellationToken)
    {
        try
        {
            if (Directory.Exists(activationContext.CurrentPath))
            {
                Directory.Delete(activationContext.CurrentPath, recursive: true);
            }

            if (!string.IsNullOrWhiteSpace(activationContext.PreviousPath) && Directory.Exists(activationContext.PreviousPath))
            {
                Directory.Move(activationContext.PreviousPath, activationContext.CurrentPath);
                deployment.App.ActiveReleasePath = activationContext.CurrentPath;
            }
            else
            {
                deployment.App.ActiveReleasePath = null;
            }

            deployment.App.UpdatedAtUtc = DateTime.UtcNow;
            AddLog(dbContext, deployment, DeploymentLogSources.Activation, LogEntryLevel.Warning, "Rolled back active release after activation or verification failure.");
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to rollback current release for deployment {DeploymentId}.", deployment.Id);
        }
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

    private string GetScopedDirectory(string rootPath, string slug, Guid deploymentId)
    {
        var root = ResolveRootPath(rootPath);
        return Path.Combine(root, slug, deploymentId.ToString("N"));
    }

    private string GetCurrentDirectory(string slug)
    {
        var root = ResolveRootPath(options.Value.CurrentRootPath);
        return Path.Combine(root, slug);
    }

    private string ResolveRootPath(string configuredPath)
    {
        return Path.IsPathRooted(configuredPath)
            ? Path.GetFullPath(configuredPath)
            : Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, configuredPath));
    }

    private static string ResolveProjectRootPath(string workspacePath, string? configuredPath)
    {
        if (string.IsNullOrWhiteSpace(configuredPath) || configuredPath.Trim() == ".")
        {
            return workspacePath;
        }

        var candidate = Path.IsPathRooted(configuredPath)
            ? Path.GetFullPath(configuredPath)
            : Path.GetFullPath(Path.Combine(workspacePath, configuredPath.Trim()));

        if (!candidate.StartsWith(Path.GetFullPath(workspacePath), StringComparison.OrdinalIgnoreCase))
        {
            throw new DeploymentExecutionException("ProjectRootPath must stay within the deployment workspace.");
        }

        if (!Directory.Exists(candidate))
        {
            throw new DeploymentExecutionException($"Project root '{candidate}' does not exist inside the workspace.");
        }

        return candidate;
    }

    private string ResolvePublishSourcePath(string projectRootPath, Deployment deployment)
    {
        if (!string.IsNullOrWhiteSpace(deployment.App.PublishDirectory))
        {
            var candidate = Path.IsPathRooted(deployment.App.PublishDirectory)
                ? Path.GetFullPath(deployment.App.PublishDirectory)
                : Path.GetFullPath(Path.Combine(projectRootPath, deployment.App.PublishDirectory.Trim()));

            if (!candidate.StartsWith(Path.GetFullPath(projectRootPath), StringComparison.OrdinalIgnoreCase))
            {
                throw new DeploymentExecutionException("PublishDirectory must stay within the project root.");
            }

            if (!Directory.Exists(candidate))
            {
                throw new DeploymentExecutionException($"Publish directory '{candidate}' does not exist.");
            }

            return candidate;
        }

        return deployment.DeploymentKind switch
        {
            DeploymentKind.StaticSite => projectRootPath,
            DeploymentKind.FrontendSpa => ResolveFrontendPublishDirectory(projectRootPath),
            DeploymentKind.BackendApi => projectRootPath,
            DeploymentKind.Fullstack => projectRootPath,
            _ => projectRootPath
        };
    }

    private static string ResolveFrontendPublishDirectory(string projectRootPath)
    {
        var candidates = new[]
        {
            "dist",
            "build",
            ".next/out",
            "out",
            "public"
        };

        foreach (var relativeCandidate in candidates)
        {
            var absoluteCandidate = Path.Combine(projectRootPath, relativeCandidate);
            if (Directory.Exists(absoluteCandidate))
            {
                return absoluteCandidate;
            }
        }

        if (File.Exists(Path.Combine(projectRootPath, "index.html")))
        {
            return projectRootPath;
        }

        throw new DeploymentExecutionException("Could not determine publish directory for frontend application. Configure PublishDirectory explicitly.");
    }

    private static DeploymentKind DetectDeploymentKind(string projectRootPath, DeploymentKind fallback)
    {
        var hasIndexHtml = File.Exists(Path.Combine(projectRootPath, "index.html"));
        var hasPackageJson = File.Exists(Path.Combine(projectRootPath, "package.json"));
        var hasFrontendConfig =
            File.Exists(Path.Combine(projectRootPath, "vite.config.ts")) ||
            File.Exists(Path.Combine(projectRootPath, "vite.config.js")) ||
            File.Exists(Path.Combine(projectRootPath, "next.config.js")) ||
            File.Exists(Path.Combine(projectRootPath, "next.config.mjs")) ||
            File.Exists(Path.Combine(projectRootPath, "angular.json"));
        var hasSourceDirectory = Directory.Exists(Path.Combine(projectRootPath, "src"));
        var hasCsproj = Directory.EnumerateFiles(projectRootPath, "*.csproj", SearchOption.AllDirectories).Any();
        var hasFrontendMarkers = hasPackageJson || hasFrontendConfig || hasSourceDirectory;

        if (hasCsproj && hasFrontendMarkers)
        {
            return DeploymentKind.Fullstack;
        }

        if (hasCsproj)
        {
            return DeploymentKind.BackendApi;
        }

        if (hasFrontendMarkers)
        {
            return DeploymentKind.FrontendSpa;
        }

        if (hasIndexHtml)
        {
            return DeploymentKind.StaticSite;
        }

        return fallback;
    }

    private static void CopyDirectoryContents(string sourcePath, string destinationPath)
    {
        Directory.CreateDirectory(destinationPath);

        foreach (var directory in Directory.GetDirectories(sourcePath, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(sourcePath, directory);
            Directory.CreateDirectory(Path.Combine(destinationPath, relativePath));
        }

        foreach (var file in Directory.GetFiles(sourcePath, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(sourcePath, file);
            var destinationFile = Path.Combine(destinationPath, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(destinationFile)!);
            File.Copy(file, destinationFile, overwrite: true);
        }
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

    private static string Quote(string value)
    {
        return $"'{value.Replace("'", "''")}'";
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

    private sealed record SourceContext(string WorkspacePath, string ProjectRootPath);

    private sealed record PublishContext(string ReleasePath);

    private sealed record ActivationContext(string CurrentPath, string? PreviousPath);
}
