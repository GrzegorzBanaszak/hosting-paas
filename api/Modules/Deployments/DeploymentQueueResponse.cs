namespace Api.Modules.Deployments;

public sealed record DeploymentQueueResponse(
    Guid Id,
    Guid AppId,
    Guid? RepositoryId,
    string Status,
    string Trigger,
    string Branch,
    string? CommitSha,
    DateTime CreatedAtUtc);
