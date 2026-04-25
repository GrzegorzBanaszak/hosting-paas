namespace Api.Modules.Apps;

public sealed record AppDomainResponse(
    Guid Id,
    string Hostname,
    bool IsPrimary,
    string Status,
    DateTime CreatedAtUtc);
