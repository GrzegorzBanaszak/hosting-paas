using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Api.Domain.Enums;
using Api.Infrastructure.Deployments;
using Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/webhooks/github")]
[AllowAnonymous]
public sealed class GitHubWebhooksController(AppDbContext dbContext, ILogger<GitHubWebhooksController> logger) : ControllerBase
{
    [HttpPost]
    [Consumes("application/json")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Post(CancellationToken cancellationToken)
    {
        if (!Request.Headers.TryGetValue("X-GitHub-Event", out var eventHeader))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing event header",
                Detail = "Header 'X-GitHub-Event' is required.",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://httpstatuses.com/400"
            });
        }

        var eventName = eventHeader.ToString();
        var body = await ReadBodyAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(body))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Empty payload",
                Detail = "GitHub webhook body cannot be empty.",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://httpstatuses.com/400"
            });
        }

        if (!TryParseRepositoryInfo(body, out var owner, out var repositoryName, out var branch, out var commitSha, out var defaultBranch))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid payload",
                Detail = "Webhook payload does not include the required GitHub repository fields.",
                Status = StatusCodes.Status400BadRequest,
                Type = "https://httpstatuses.com/400"
            });
        }

        if (!string.Equals(eventName, "push", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("Ignoring unsupported GitHub event {EventName} for repository {Owner}/{Repository}.", eventName, owner, repositoryName);
            return Accepted(new { status = "ignored", reason = "unsupported_event", @event = eventName });
        }

        var repositories = await dbContext.Repositories
            .Include(repository => repository.App)
            .Where(repository =>
                repository.Provider == RepositoryProvider.GitHub &&
                repository.Owner == owner &&
                repository.Name == repositoryName &&
                repository.Branch == branch)
            .ToListAsync(cancellationToken);

        if (repositories.Count == 0)
        {
            logger.LogInformation("Ignoring GitHub push for {Owner}/{Repository} on branch {Branch}; no matching app repository.", owner, repositoryName, branch);
            return Accepted(new { status = "ignored", reason = "repository_or_branch_not_connected", owner, repository = repositoryName, branch });
        }

        if (!Request.Headers.TryGetValue("X-Hub-Signature-256", out var signatureHeader))
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Missing signature",
                Detail = "Header 'X-Hub-Signature-256' is required.",
                Status = StatusCodes.Status401Unauthorized,
                Type = "https://httpstatuses.com/401"
            });
        }

        var matchingRepository = repositories.FirstOrDefault(repository =>
            !string.IsNullOrWhiteSpace(repository.WebhookSecret) &&
            IsValidSignature(body, repository.WebhookSecret!, signatureHeader.ToString()));

        if (matchingRepository is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Invalid signature",
                Detail = "The GitHub webhook signature is invalid for the configured repository.",
                Status = StatusCodes.Status401Unauthorized,
                Type = "https://httpstatuses.com/401"
            });
        }

        var deployment = DeploymentFactory.CreateQueued(
            matchingRepository.App,
            matchingRepository,
            DeploymentTrigger.Push,
            branch,
            commitSha);

        dbContext.Deployments.Add(deployment);
        dbContext.LogEntries.Add(DeploymentFactory.CreateLog(
            matchingRepository.App,
            deployment,
            "github-webhook",
            $"Queued deployment from GitHub push on branch '{branch}' for commit '{commitSha ?? "unknown"}'."));

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Queued deployment {DeploymentId} from GitHub push for app {AppId} ({Owner}/{Repository}) on branch {Branch}.",
            deployment.Id,
            matchingRepository.AppId,
            owner,
            repositoryName,
            branch);

        return Accepted(new
        {
            status = "queued",
            deploymentId = deployment.Id,
            appId = matchingRepository.AppId,
            owner,
            repository = repositoryName,
            branch,
            commitSha,
            defaultBranch
        });
    }

    private async Task<string> ReadBodyAsync(CancellationToken cancellationToken)
    {
        Request.EnableBuffering();
        Request.Body.Position = 0;

        using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync(cancellationToken);
        Request.Body.Position = 0;
        return body;
    }

    private static bool TryParseRepositoryInfo(
        string body,
        out string owner,
        out string repositoryName,
        out string branch,
        out string? commitSha,
        out string? defaultBranch)
    {
        owner = string.Empty;
        repositoryName = string.Empty;
        branch = string.Empty;
        commitSha = null;
        defaultBranch = null;

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;

        if (!root.TryGetProperty("repository", out var repositoryElement))
        {
            return false;
        }

        owner = repositoryElement.TryGetProperty("owner", out var ownerElement) &&
                ownerElement.TryGetProperty("name", out var ownerNameElement)
            ? ownerNameElement.GetString() ?? string.Empty
            : string.Empty;

        repositoryName = repositoryElement.TryGetProperty("name", out var repositoryNameElement)
            ? repositoryNameElement.GetString() ?? string.Empty
            : string.Empty;

        defaultBranch = repositoryElement.TryGetProperty("default_branch", out var defaultBranchElement)
            ? defaultBranchElement.GetString()
            : null;

        var gitRef = root.TryGetProperty("ref", out var refElement)
            ? refElement.GetString()
            : null;

        branch = gitRef is not null && gitRef.StartsWith("refs/heads/", StringComparison.Ordinal)
            ? gitRef["refs/heads/".Length..]
            : string.Empty;

        commitSha = root.TryGetProperty("after", out var afterElement)
            ? afterElement.GetString()
            : null;

        return !string.IsNullOrWhiteSpace(owner) &&
               !string.IsNullOrWhiteSpace(repositoryName) &&
               !string.IsNullOrWhiteSpace(branch);
    }

    private static bool IsValidSignature(string body, string secret, string signatureHeader)
    {
        const string Prefix = "sha256=";

        if (!signatureHeader.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var providedSignature = signatureHeader[Prefix.Length..];
        var payloadBytes = Encoding.UTF8.GetBytes(body);
        var secretBytes = Encoding.UTF8.GetBytes(secret);

        using var hmac = new HMACSHA256(secretBytes);
        var computedHash = hmac.ComputeHash(payloadBytes);
        var computedSignature = Convert.ToHexString(computedHash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedSignature),
            Encoding.UTF8.GetBytes(providedSignature.ToLowerInvariant()));
    }
}
