namespace Api.Domain.Enums;

public enum DeploymentTrigger
{
    Manual = 0,
    Push = 1,
    Redeploy = 2,
    Rollback = 3
}
