using Api.Configuration;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure.Runtime;

public sealed class AppRuntimeMonitor(
    IAppRuntimeService runtimeService,
    IOptions<RuntimeOptions> options,
    ILogger<AppRuntimeMonitor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await runtimeService.RefreshExitedProcessesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Runtime monitor iteration failed.");
            }

            await Task.Delay(TimeSpan.FromSeconds(options.Value.MonitorIntervalSeconds), stoppingToken);
        }
    }
}
