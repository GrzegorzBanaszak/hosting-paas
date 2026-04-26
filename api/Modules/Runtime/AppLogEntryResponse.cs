namespace Api.Modules.Runtime;

public sealed record AppLogEntryResponse(
    Guid Id,
    Guid AppId,
    Guid? DeploymentId,
    string Level,
    string Source,
    string Message,
    DateTime TimestampUtc);
