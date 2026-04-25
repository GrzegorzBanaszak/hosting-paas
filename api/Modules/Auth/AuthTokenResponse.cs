namespace Api.Modules.Auth;

public sealed record AuthTokenResponse(
    string AccessToken,
    string TokenType,
    DateTime ExpiresAtUtc,
    string Role,
    string Username,
    string DisplayName);
