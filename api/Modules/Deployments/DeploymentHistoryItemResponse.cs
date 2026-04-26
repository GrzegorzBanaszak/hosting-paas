namespace Api.Modules.Deployments;

public sealed record DeploymentHistoryItemResponse(
    Guid Id,
    Guid AppId,
    Guid? RepositoryId,
    string Status,
    string Trigger,
    string PipelineStage,
    string Branch,
    string? CommitSha,
    string? ArtifactReference,
    string? FailureReason,
    DateTime CreatedAtUtc,
    DateTime? StartedAtUtc,
    DateTime? FinishedAtUtc);
