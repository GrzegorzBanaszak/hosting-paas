namespace Api.Modules.Deployments;

public sealed record DeploymentDetailsResponse(
    Guid Id,
    Guid AppId,
    Guid? RepositoryId,
    string Status,
    string Trigger,
    string DeploymentKind,
    string PipelineStage,
    string Branch,
    string? CommitSha,
    string? ArtifactReference,
    string? WorkspacePath,
    string? ReleasePath,
    string? FailureReason,
    DateTime CreatedAtUtc,
    DateTime? StartedAtUtc,
    DateTime? ActivatedAtUtc,
    DateTime? FinishedAtUtc);
