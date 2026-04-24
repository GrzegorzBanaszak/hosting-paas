namespace Api.Modules.System;

public sealed record SystemInfoResponse(
    string ServiceName,
    string Environment,
    string Status);
