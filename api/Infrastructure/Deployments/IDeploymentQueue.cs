namespace Api.Infrastructure.Deployments;

public interface IDeploymentQueue
{
    ValueTask QueueAsync(Guid deploymentId, CancellationToken cancellationToken);

    IAsyncEnumerable<Guid> DequeueAllAsync(CancellationToken cancellationToken);
}
