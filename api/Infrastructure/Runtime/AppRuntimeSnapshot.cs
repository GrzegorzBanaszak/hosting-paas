namespace Api.Infrastructure.Runtime;

public sealed record AppRuntimeSnapshot(
    Guid AppId,
    string State,
    int? ProcessId,
    DateTime? StartedAtUtc,
    DateTime? LastExitedAtUtc,
    int? LastExitCode,
    string? LastError,
    bool IsManaged,
    RuntimeHealthStatus HealthStatus,
    int? HealthStatusCode,
    DateTime? LastHealthCheckAtUtc,
    string? HealthCheckUrl);
