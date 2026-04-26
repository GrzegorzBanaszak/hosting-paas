using Api.Configuration;
using Api.Domain.Entities;
using Api.Infrastructure.Auth;
using Api.Infrastructure.Persistence;
using Api.Infrastructure.Runtime;
using Api.Modules.Runtime;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Api.Controllers;

[ApiController]
[Route("api/apps/{appId:guid}/runtime")]
[Authorize(Policy = ApiPolicies.AdminAccess)]
[EnableRateLimiting("admin-api")]
public sealed class AppRuntimeController(
    AppDbContext dbContext,
    IAppRuntimeService runtimeService,
    IOptions<RuntimeOptions> runtimeOptions) : ControllerBase
{
    [HttpGet("status")]
    [ProducesResponseType<AppRuntimeStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppRuntimeStatusResponse>> GetStatus(Guid appId, CancellationToken cancellationToken)
    {
        var app = await FindAppAsync(appId, cancellationToken);
        if (app is null)
        {
            return NotFound();
        }

        var snapshot = await runtimeService.GetStatusAsync(app, cancellationToken);
        return Ok(MapStatus(snapshot));
    }

    [HttpPost("start")]
    [ProducesResponseType<AppRuntimeStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppRuntimeStatusResponse>> Start(Guid appId, CancellationToken cancellationToken)
    {
        var app = await FindAppAsync(appId, cancellationToken);
        if (app is null)
        {
            return NotFound();
        }

        var snapshot = await runtimeService.StartAsync(app, cancellationToken);
        return Ok(MapStatus(snapshot));
    }

    [HttpPost("stop")]
    [ProducesResponseType<AppRuntimeStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppRuntimeStatusResponse>> Stop(Guid appId, CancellationToken cancellationToken)
    {
        var app = await FindAppAsync(appId, cancellationToken);
        if (app is null)
        {
            return NotFound();
        }

        var snapshot = await runtimeService.StopAsync(app, cancellationToken);
        return Ok(MapStatus(snapshot));
    }

    [HttpPost("restart")]
    [ProducesResponseType<AppRuntimeStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppRuntimeStatusResponse>> Restart(Guid appId, CancellationToken cancellationToken)
    {
        var app = await FindAppAsync(appId, cancellationToken);
        if (app is null)
        {
            return NotFound();
        }

        var snapshot = await runtimeService.RestartAsync(app, cancellationToken);
        return Ok(MapStatus(snapshot));
    }

    [HttpGet("health")]
    [ProducesResponseType<AppRuntimeStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppRuntimeStatusResponse>> Health(Guid appId, CancellationToken cancellationToken)
    {
        var app = await FindAppAsync(appId, cancellationToken);
        if (app is null)
        {
            return NotFound();
        }

        var snapshot = await runtimeService.CheckHealthAsync(app, cancellationToken);
        return Ok(MapStatus(snapshot));
    }

    [HttpGet("logs")]
    [ProducesResponseType<IReadOnlyCollection<AppLogEntryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyCollection<AppLogEntryResponse>>> GetRecentLogs(Guid appId, [FromQuery] int? limit, CancellationToken cancellationToken)
    {
        var appExists = await dbContext.Apps
            .AsNoTracking()
            .AnyAsync(item => item.Id == appId, cancellationToken);

        if (!appExists)
        {
            return NotFound();
        }

        var effectiveLimit = Math.Clamp(limit ?? runtimeOptions.Value.RecentLogsLimit, 1, 1000);

        var logs = await dbContext.LogEntries
            .AsNoTracking()
            .Where(item => item.AppId == appId)
            .OrderByDescending(item => item.TimestampUtc)
            .ThenByDescending(item => item.Id)
            .Take(effectiveLimit)
            .ToListAsync(cancellationToken);

        return Ok(logs.Select(MapLog).ToArray());
    }

    [HttpPost("logs/query")]
    [ProducesResponseType<IReadOnlyCollection<AppLogEntryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyCollection<AppLogEntryResponse>>> QueryLogs(Guid appId, [FromBody] AppLogsRangeRequest request, CancellationToken cancellationToken)
    {
        if (request.ToUtc < request.FromUtc)
        {
            ModelState.AddModelError(nameof(request.ToUtc), "ToUtc must be greater than or equal to FromUtc.");
            return ValidationProblem(ModelState);
        }

        var appExists = await dbContext.Apps
            .AsNoTracking()
            .AnyAsync(item => item.Id == appId, cancellationToken);

        if (!appExists)
        {
            return NotFound();
        }

        var logs = await dbContext.LogEntries
            .AsNoTracking()
            .Where(item =>
                item.AppId == appId &&
                item.TimestampUtc >= request.FromUtc &&
                item.TimestampUtc <= request.ToUtc)
            .OrderByDescending(item => item.TimestampUtc)
            .ThenByDescending(item => item.Id)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        return Ok(logs.Select(MapLog).ToArray());
    }

    private async Task<App?> FindAppAsync(Guid appId, CancellationToken cancellationToken)
    {
        return await dbContext.Apps
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == appId, cancellationToken);
    }

    private static AppRuntimeStatusResponse MapStatus(AppRuntimeSnapshot snapshot)
    {
        return new AppRuntimeStatusResponse(
            snapshot.AppId,
            snapshot.State,
            snapshot.ProcessId,
            snapshot.StartedAtUtc,
            snapshot.LastExitedAtUtc,
            snapshot.LastExitCode,
            snapshot.LastError,
            snapshot.IsManaged,
            snapshot.HealthStatus.ToString(),
            snapshot.HealthStatusCode,
            snapshot.LastHealthCheckAtUtc,
            snapshot.HealthCheckUrl);
    }

    private static AppLogEntryResponse MapLog(LogEntry entry)
    {
        return new AppLogEntryResponse(
            entry.Id,
            entry.AppId,
            entry.DeploymentId,
            entry.Level.ToString(),
            entry.Source,
            entry.Message,
            entry.TimestampUtc);
    }
}
