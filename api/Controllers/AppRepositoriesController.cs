using System.ComponentModel.DataAnnotations;
using Api.Domain.Entities;
using Api.Domain.Enums;
using Api.Infrastructure.Auth;
using Api.Infrastructure.Deployments;
using Api.Infrastructure.Persistence;
using Api.Modules.Deployments;
using Api.Modules.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/apps/{appId:guid}/repository")]
[Authorize(Policy = ApiPolicies.AdminAccess)]
[EnableRateLimiting("admin-api")]
public sealed class AppRepositoriesController(AppDbContext dbContext, IDeploymentQueue deploymentQueue) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<RepositoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RepositoryResponse>> Get(Guid appId, CancellationToken cancellationToken)
    {
        var repository = await dbContext.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.AppId == appId, cancellationToken);

        if (repository is null)
        {
            return NotFound();
        }

        return Ok(MapResponse(repository));
    }

    [HttpPut]
    [ProducesResponseType<RepositoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RepositoryResponse>> Put(Guid appId, [FromBody] SaveRepositoryRequest request, CancellationToken cancellationToken)
    {
        var app = await dbContext.Apps
            .Include(entity => entity.Repository)
            .FirstOrDefaultAsync(entity => entity.Id == appId, cancellationToken);

        if (app is null)
        {
            return NotFound();
        }

        if (!TryParseProvider(request.Provider, out var provider))
        {
            return ValidationProblem(CreateSingleError(nameof(request.Provider), "Unsupported repository provider."));
        }

        var repository = app.Repository ?? new Repository { AppId = appId };
        ApplyRequest(repository, request, provider!.Value);

        if (!TryValidateEntity(repository))
        {
            return ValidationProblem(ModelState);
        }

        var conflictingRepository = await dbContext.Repositories
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Provider == repository.Provider &&
                        item.Owner == repository.Owner &&
                        item.Name == repository.Name &&
                        item.Branch == repository.Branch &&
                        item.AppId != appId,
                cancellationToken);

        if (conflictingRepository is not null)
        {
            return Conflict(CreateProblemDetails(
                "Repository branch already connected.",
                $"Repository '{repository.Owner}/{repository.Name}' on branch '{repository.Branch}' is already assigned to another app."));
        }

        if (app.Repository is null)
        {
            dbContext.Repositories.Add(repository);
            app.Repository = repository;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapResponse(repository));
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid appId, CancellationToken cancellationToken)
    {
        var repository = await dbContext.Repositories.FirstOrDefaultAsync(item => item.AppId == appId, cancellationToken);

        if (repository is null)
        {
            return NotFound();
        }

        dbContext.Repositories.Remove(repository);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("/api/apps/{appId:guid}/deployments")]
    [ProducesResponseType<IReadOnlyCollection<DeploymentHistoryItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<DeploymentHistoryItemResponse>>> GetDeploymentHistory(Guid appId, CancellationToken cancellationToken)
    {
        var appExists = await dbContext.Apps
            .AsNoTracking()
            .AnyAsync(entity => entity.Id == appId, cancellationToken);

        if (!appExists)
        {
            return NotFound();
        }

        var deployments = await dbContext.Deployments
            .AsNoTracking()
            .Where(item => item.AppId == appId)
            .OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var deploymentIds = deployments.Select(item => item.Id).ToArray();
        Dictionary<Guid, string> latestLogSources;

        if (deploymentIds.Length == 0)
        {
            latestLogSources = [];
        }
        else
        {
            var logs = await dbContext.LogEntries
                .AsNoTracking()
                .Where(item => item.DeploymentId.HasValue && deploymentIds.Contains(item.DeploymentId.Value))
                .OrderByDescending(item => item.TimestampUtc)
                .ThenByDescending(item => item.Id)
                .ToListAsync(cancellationToken);

            latestLogSources = logs
                .GroupBy(item => item.DeploymentId!.Value)
                .ToDictionary(group => group.Key, group => group.First().Source);
        }

        return Ok(deployments
            .Select(deployment => MapHistoryResponse(
                deployment,
                latestLogSources.TryGetValue(deployment.Id, out var source) ? source : null))
            .ToArray());
    }

    [HttpPost("/api/apps/{appId:guid}/deployments/redeploy")]
    [ProducesResponseType<DeploymentQueueResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeploymentQueueResponse>> Redeploy(Guid appId, [FromBody] QueueDeploymentRequest request, CancellationToken cancellationToken)
    {
        var app = await dbContext.Apps
            .Include(entity => entity.Repository)
            .FirstOrDefaultAsync(entity => entity.Id == appId, cancellationToken);

        if (app is null)
        {
            return NotFound();
        }

        if (app.Repository is null)
        {
            return ValidationProblem(CreateSingleError("repository", "App does not have a connected repository."));
        }

        var branch = string.IsNullOrWhiteSpace(request.Branch)
            ? app.Repository.Branch
            : request.Branch.Trim();

        if (!string.Equals(branch, app.Repository.Branch, StringComparison.Ordinal))
        {
            return ValidationProblem(CreateSingleError(nameof(request.Branch), "Redeploy branch must match the connected repository branch."));
        }

        var deployment = DeploymentFactory.CreateQueued(app, app.Repository, DeploymentTrigger.Redeploy, branch, request.CommitSha.Trim());

        if (!TryValidateEntity(deployment))
        {
            return ValidationProblem(ModelState);
        }

        dbContext.Deployments.Add(deployment);
        dbContext.LogEntries.Add(DeploymentFactory.CreateLog(
            app,
            deployment,
            DeploymentLogSources.Queue,
            $"Queued redeploy for commit '{deployment.CommitSha}' on branch '{deployment.Branch}'."));

        await dbContext.SaveChangesAsync(cancellationToken);
        await deploymentQueue.QueueAsync(deployment.Id, cancellationToken);

        return Accepted(MapResponse(deployment));
    }

    private static RepositoryResponse MapResponse(Repository repository)
    {
        return new RepositoryResponse(
            repository.Id,
            repository.AppId,
            repository.Provider.ToString(),
            repository.Owner,
            repository.Name,
            repository.Branch,
            repository.CloneUrl,
            repository.ExternalRepositoryId,
            !string.IsNullOrWhiteSpace(repository.WebhookSecret),
            repository.ConnectedAtUtc,
            "/api/webhooks/github");
    }

    private static DeploymentQueueResponse MapResponse(Deployment deployment)
    {
        return new DeploymentQueueResponse(
            deployment.Id,
            deployment.AppId,
            deployment.RepositoryId,
            deployment.Status.ToString(),
            deployment.Trigger.ToString(),
            deployment.Branch,
            deployment.CommitSha,
            deployment.CreatedAtUtc);
    }

    private static DeploymentHistoryItemResponse MapHistoryResponse(Deployment deployment, string? latestLogSource)
    {
        return new DeploymentHistoryItemResponse(
            deployment.Id,
            deployment.AppId,
            deployment.RepositoryId,
            deployment.Status.ToString(),
            deployment.Trigger.ToString(),
            ResolvePipelineStage(deployment, latestLogSource).ToString(),
            deployment.Branch,
            deployment.CommitSha,
            deployment.ArtifactReference,
            deployment.FailureReason,
            deployment.CreatedAtUtc,
            deployment.StartedAtUtc,
            deployment.FinishedAtUtc);
    }

    private void ApplyRequest(Repository repository, SaveRepositoryRequest request, RepositoryProvider provider)
    {
        repository.Provider = provider;
        repository.Owner = request.Owner.Trim();
        repository.Name = request.Name.Trim();
        repository.Branch = request.Branch.Trim();
        repository.CloneUrl = request.CloneUrl.Trim();
        repository.ExternalRepositoryId = NormalizeNullable(request.ExternalRepositoryId);
        repository.WebhookSecret = NormalizeNullable(request.WebhookSecret);

        if (repository.Id == Guid.Empty)
        {
            repository.Id = Guid.NewGuid();
        }

        repository.ConnectedAtUtc = DateTime.UtcNow;
    }

    private bool TryValidateEntity(object entity)
    {
        ModelState.Clear();

        var validationContext = new ValidationContext(entity);
        var validationResults = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(entity, validationContext, validationResults, validateAllProperties: true);

        foreach (var validationResult in validationResults)
        {
            var members = validationResult.MemberNames.Any()
                ? validationResult.MemberNames
                : [string.Empty];

            foreach (var member in members)
            {
                ModelState.AddModelError(member, validationResult.ErrorMessage ?? "Validation failed.");
            }
        }

        return isValid;
    }

    private static bool TryParseProvider(string provider, out RepositoryProvider? repositoryProvider)
    {
        if (Enum.TryParse<RepositoryProvider>(provider?.Trim(), ignoreCase: true, out var parsedProvider))
        {
            repositoryProvider = parsedProvider;
            return true;
        }

        repositoryProvider = null;
        return false;
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ValidationProblemDetails CreateSingleError(string key, string message)
    {
        return new ValidationProblemDetails(new Dictionary<string, string[]>
        {
            [key] = [message]
        });
    }

    private static ProblemDetails CreateProblemDetails(string title, string detail)
    {
        return new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = StatusCodes.Status409Conflict,
            Type = "https://httpstatuses.com/409"
        };
    }

    private static DeploymentPipelineStage ResolvePipelineStage(Deployment deployment, string? latestLogSource)
    {
        return deployment.Status switch
        {
            DeploymentStatus.Queued => DeploymentPipelineStage.Queued,
            DeploymentStatus.Succeeded => DeploymentPipelineStage.Completed,
            DeploymentStatus.Failed => latestLogSource switch
            {
                DeploymentLogSources.Restart => DeploymentPipelineStage.Restart,
                DeploymentLogSources.Publish => DeploymentPipelineStage.Publish,
                DeploymentLogSources.Build => DeploymentPipelineStage.Build,
                _ => DeploymentPipelineStage.Failed
            },
            DeploymentStatus.Cancelled => DeploymentPipelineStage.Cancelled,
            DeploymentStatus.Running => latestLogSource switch
            {
                DeploymentLogSources.Restart => DeploymentPipelineStage.Restart,
                DeploymentLogSources.Publish => DeploymentPipelineStage.Publish,
                DeploymentLogSources.Build => DeploymentPipelineStage.Build,
                _ => DeploymentPipelineStage.Build
            },
            _ => DeploymentPipelineStage.Queued
        };
    }
}
