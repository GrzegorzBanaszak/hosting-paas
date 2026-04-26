namespace Api.Infrastructure.Deployments;

public sealed class DeploymentExecutionException(string message) : Exception(message);
