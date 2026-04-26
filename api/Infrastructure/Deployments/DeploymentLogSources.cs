namespace Api.Infrastructure.Deployments;

public static class DeploymentLogSources
{
    public const string Queue = "deployment-queue";
    public const string Worker = "deployment-worker";
    public const string Build = "deployment-build";
    public const string Publish = "deployment-publish";
    public const string Restart = "deployment-restart";
}
