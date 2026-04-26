using Api.Domain.Entities;

namespace Api.Infrastructure.Runtime;

public interface IAppRuntimeService
{
    Task<AppRuntimeSnapshot> StartAsync(App app, CancellationToken cancellationToken);

    Task<AppRuntimeSnapshot> StopAsync(App app, CancellationToken cancellationToken);

    Task<AppRuntimeSnapshot> RestartAsync(App app, CancellationToken cancellationToken);

    Task<AppRuntimeSnapshot> GetStatusAsync(App app, CancellationToken cancellationToken);

    Task<AppRuntimeSnapshot> CheckHealthAsync(App app, CancellationToken cancellationToken);

    Task RefreshExitedProcessesAsync(CancellationToken cancellationToken);
}
