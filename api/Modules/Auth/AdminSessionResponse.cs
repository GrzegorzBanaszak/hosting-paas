namespace Api.Modules.Auth;

public sealed record AdminSessionResponse(
    string Username,
    string Role,
    string? Email,
    string? DisplayName);
