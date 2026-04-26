using System.Collections.Concurrent;
using System.Threading.Channels;
using Api.Configuration;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure.Deployments;

public sealed class DeploymentQueue : IDeploymentQueue
{
    private readonly Channel<Guid> channel;
    private readonly ConcurrentDictionary<Guid, byte> scheduled = new();

    public DeploymentQueue(IOptions<DeploymentPipelineOptions> options)
    {
        channel = Channel.CreateBounded<Guid>(new BoundedChannelOptions(options.Value.QueueCapacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public async ValueTask QueueAsync(Guid deploymentId, CancellationToken cancellationToken)
    {
        if (!scheduled.TryAdd(deploymentId, 0))
        {
            return;
        }

        await channel.Writer.WriteAsync(deploymentId, cancellationToken);
    }

    public async IAsyncEnumerable<Guid> DequeueAllAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var deploymentId in channel.Reader.ReadAllAsync(cancellationToken))
        {
            scheduled.TryRemove(deploymentId, out _);
            yield return deploymentId;
        }
    }
}
