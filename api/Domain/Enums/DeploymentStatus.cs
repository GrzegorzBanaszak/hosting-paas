namespace Api.Domain.Enums;

public enum DeploymentStatus
{
    Queued = 0,
    Running = 1,
    Succeeded = 2,
    Failed = 3,
    Cancelled = 4
}
