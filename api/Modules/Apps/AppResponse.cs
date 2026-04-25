namespace Api.Modules.Apps;

public sealed record AppResponse(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string Status,
    int? Port,
    string? BuildCommand,
    string StartCommand,
    string? ProjectRootPath,
    string HealthCheckPath,
    string? PrimaryHostname,
    bool HasRepository,
    int DeploymentCount,
    int DomainCount,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyCollection<AppDomainResponse> Domains);
