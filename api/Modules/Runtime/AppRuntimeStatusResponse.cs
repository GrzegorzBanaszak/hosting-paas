namespace Api.Modules.Runtime;

public sealed record AppRuntimeStatusResponse(
    Guid AppId,
    string State,
    int? ProcessId,
    DateTime? StartedAtUtc,
    DateTime? LastExitedAtUtc,
    int? LastExitCode,
    string? LastError,
    bool IsManaged,
    string HealthStatus,
    int? HealthStatusCode,
    DateTime? LastHealthCheckAtUtc,
    string? HealthCheckUrl);
