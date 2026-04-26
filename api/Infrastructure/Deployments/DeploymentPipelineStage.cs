namespace Api.Infrastructure.Deployments;

public enum DeploymentPipelineStage
{
    Queued = 0,
    Build = 1,
    Publish = 2,
    Restart = 3,
    Completed = 4,
    Failed = 5,
    Cancelled = 6
}
