namespace Api.Infrastructure.Deployments;

public enum DeploymentPipelineStage
{
    Queued = 0,
    SourceAcquisition = 1,
    ProjectDetection = 2,
    Build = 3,
    Publish = 4,
    Activation = 5,
    Verification = 6,
    Restart = 7,
    Completed = 8,
    Failed = 9,
    Cancelled = 10
}
