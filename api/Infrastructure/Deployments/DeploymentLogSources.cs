namespace Api.Infrastructure.Deployments;

public static class DeploymentLogSources
{
    public const string Queue = "deployment-queue";
    public const string Worker = "deployment-worker";
    public const string SourceAcquisition = "deployment-source-acquisition";
    public const string ProjectDetection = "deployment-project-detection";
    public const string Build = "deployment-build";
    public const string Publish = "deployment-publish";
    public const string Activation = "deployment-activation";
    public const string Verification = "deployment-verification";
    public const string Restart = "deployment-restart";
}
