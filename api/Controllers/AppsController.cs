using System.ComponentModel.DataAnnotations;
using Api.Domain.Entities;
using Api.Domain.Enums;
using Api.Infrastructure.Auth;
using Api.Infrastructure.Persistence;
using Api.Modules.Apps;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/apps")]
[Authorize(Policy = ApiPolicies.AdminAccess)]
[EnableRateLimiting("admin-api")]
public sealed class AppsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<AppResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AppResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var apps = await dbContext.Apps
            .AsNoTracking()
            .Include(app => app.Domains)
            .Include(app => app.Repository)
            .Include(app => app.Deployments)
            .OrderByDescending(app => app.UpdatedAtUtc)
            .ToListAsync(cancellationToken);

        return Ok(apps.Select(MapResponse).ToArray());
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AppResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var app = await dbContext.Apps
            .AsNoTracking()
            .Include(entity => entity.Domains)
            .Include(entity => entity.Repository)
            .Include(entity => entity.Deployments)
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        if (app is null)
        {
            return NotFound();
        }

        return Ok(MapResponse(app));
    }

    [HttpPost]
    [ProducesResponseType<AppResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppResponse>> Create([FromBody] SaveAppRequest request, CancellationToken cancellationToken)
    {
        if (!TryParseStatus(request.Status, out var status))
        {
            return ValidationProblem(CreateSingleError(nameof(request.Status), "Unsupported app status."));
        }

        if (await SlugExistsAsync(request.Slug, null, cancellationToken))
        {
            return Conflict(CreateProblemDetails("App slug already exists.", $"Slug '{request.Slug}' is already assigned to another app."));
        }

        var normalizedHostname = NormalizeHostname(request.PrimaryHostname);
        if (!string.IsNullOrWhiteSpace(normalizedHostname) &&
            await HostnameExistsAsync(normalizedHostname, null, cancellationToken))
        {
            return Conflict(CreateProblemDetails("Primary hostname already exists.", $"Hostname '{normalizedHostname}' is already assigned to another app."));
        }

        var app = new App();
        ApplyRequest(app, request, status!.Value, normalizedHostname);

        if (!TryValidateEntity(app))
        {
            return ValidationProblem(ModelState);
        }

        dbContext.Apps.Add(app);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = app.Id }, MapResponse(app));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AppResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppResponse>> Update(Guid id, [FromBody] SaveAppRequest request, CancellationToken cancellationToken)
    {
        var app = await dbContext.Apps
            .Include(entity => entity.Domains)
            .Include(entity => entity.Repository)
            .Include(entity => entity.Deployments)
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        if (app is null)
        {
            return NotFound();
        }

        if (!TryParseStatus(request.Status, out var status))
        {
            return ValidationProblem(CreateSingleError(nameof(request.Status), "Unsupported app status."));
        }

        if (await SlugExistsAsync(request.Slug, id, cancellationToken))
        {
            return Conflict(CreateProblemDetails("App slug already exists.", $"Slug '{request.Slug}' is already assigned to another app."));
        }

        var normalizedHostname = NormalizeHostname(request.PrimaryHostname);
        if (!string.IsNullOrWhiteSpace(normalizedHostname) &&
            await HostnameExistsAsync(normalizedHostname, id, cancellationToken))
        {
            return Conflict(CreateProblemDetails("Primary hostname already exists.", $"Hostname '{normalizedHostname}' is already assigned to another app."));
        }

        ApplyRequest(app, request, status!.Value, normalizedHostname);

        if (!TryValidateEntity(app))
        {
            return ValidationProblem(ModelState);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapResponse(app));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var app = await dbContext.Apps.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

        if (app is null)
        {
            return NotFound();
        }

        dbContext.Apps.Remove(app);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static AppResponse MapResponse(App app)
    {
        var domains = app.Domains
            .OrderByDescending(domain => domain.IsPrimary)
            .ThenBy(domain => domain.Hostname)
            .Select(domain => new AppDomainResponse(
                domain.Id,
                domain.Hostname,
                domain.IsPrimary,
                domain.Status.ToString(),
                domain.CreatedAtUtc))
            .ToArray();

        return new AppResponse(
            app.Id,
            app.Name,
            app.Slug,
            app.Description,
            app.Status.ToString(),
            app.Port,
            app.BuildCommand,
            app.StartCommand,
            app.ProjectRootPath,
            app.HealthCheckPath,
            domains.FirstOrDefault(domain => domain.IsPrimary)?.Hostname,
            app.Repository is not null,
            app.Deployments.Count,
            domains.Length,
            app.CreatedAtUtc,
            app.UpdatedAtUtc,
            domains);
    }

    private void ApplyRequest(App app, SaveAppRequest request, AppStatus status, string? normalizedHostname)
    {
        app.Name = request.Name.Trim();
        app.Slug = request.Slug.Trim();
        app.Description = NormalizeNullable(request.Description);
        app.Status = status;
        app.Port = request.Port;
        app.BuildCommand = NormalizeNullable(request.BuildCommand);
        app.StartCommand = request.StartCommand.Trim();
        app.ProjectRootPath = NormalizeNullable(request.ProjectRootPath);
        app.HealthCheckPath = request.HealthCheckPath.Trim();
        app.UpdatedAtUtc = DateTime.UtcNow;

        SyncPrimaryDomain(app, normalizedHostname);
    }

    private static void SyncPrimaryDomain(App app, string? normalizedHostname)
    {
        var primaryDomain = app.Domains.FirstOrDefault(domain => domain.IsPrimary);

        if (string.IsNullOrWhiteSpace(normalizedHostname))
        {
            if (primaryDomain is not null)
            {
                app.Domains.Remove(primaryDomain);
            }

            return;
        }

        if (primaryDomain is null)
        {
            app.Domains.Add(new Api.Domain.Entities.Domain
            {
                AppId = app.Id,
                Hostname = normalizedHostname,
                IsPrimary = true,
                Status = DomainStatus.Pending
            });

            return;
        }

        primaryDomain.Hostname = normalizedHostname;
    }

    private bool TryValidateEntity(App app)
    {
        ModelState.Clear();

        var validationContext = new ValidationContext(app);
        var validationResults = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(app, validationContext, validationResults, validateAllProperties: true);

        foreach (var validationResult in validationResults)
        {
            var members = validationResult.MemberNames.Any()
                ? validationResult.MemberNames
                : [string.Empty];

            foreach (var member in members)
            {
                ModelState.AddModelError(member, validationResult.ErrorMessage ?? "Validation failed.");
            }
        }

        return isValid;
    }

    private async Task<bool> SlugExistsAsync(string slug, Guid? excludedAppId, CancellationToken cancellationToken)
    {
        var normalizedSlug = slug.Trim();

        return await dbContext.Apps.AnyAsync(
            app => app.Slug == normalizedSlug && (!excludedAppId.HasValue || app.Id != excludedAppId.Value),
            cancellationToken);
    }

    private async Task<bool> HostnameExistsAsync(string hostname, Guid? excludedAppId, CancellationToken cancellationToken)
    {
        return await dbContext.Domains.AnyAsync(
            domain => domain.Hostname == hostname && (!excludedAppId.HasValue || domain.AppId != excludedAppId.Value),
            cancellationToken);
    }

    private static bool TryParseStatus(string status, out AppStatus? appStatus)
    {
        if (Enum.TryParse<AppStatus>(status?.Trim(), ignoreCase: true, out var parsedStatus))
        {
            appStatus = parsedStatus;
            return true;
        }

        appStatus = null;
        return false;
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? NormalizeHostname(string? hostname)
    {
        return string.IsNullOrWhiteSpace(hostname) ? null : hostname.Trim().ToLowerInvariant();
    }

    private static ValidationProblemDetails CreateSingleError(string key, string message)
    {
        return new ValidationProblemDetails(new Dictionary<string, string[]>
        {
            [key] = [message]
        });
    }

    private static ProblemDetails CreateProblemDetails(string title, string detail)
    {
        return new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = StatusCodes.Status409Conflict,
            Type = "https://httpstatuses.com/409"
        };
    }
}
