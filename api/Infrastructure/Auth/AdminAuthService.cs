using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api.Configuration;
using Api.Modules.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Api.Infrastructure.Auth;

public sealed class AdminAuthService(IOptions<AuthOptions> authOptions) : IAdminAuthService
{
    public AuthTokenResponse? Login(AdminLoginRequest request)
    {
        var options = authOptions.Value;
        var admin = options.BootstrapAdmin;

        if (!string.Equals(request.Username, admin.Username, StringComparison.Ordinal) ||
            !string.Equals(request.Password, admin.Password, StringComparison.Ordinal))
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(options.Jwt.AccessTokenLifetimeMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, admin.Username),
            new(JwtRegisteredClaimNames.UniqueName, admin.Username),
            new(JwtRegisteredClaimNames.Email, admin.Email),
            new("display_name", admin.DisplayName),
            new(ClaimTypes.Name, admin.Username),
            new(ClaimTypes.Role, ApiRoles.Admin)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Jwt.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: options.Jwt.Issuer,
            audience: options.Jwt.Audience,
            claims: claims,
            notBefore: now,
            expires: expiresAt,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthTokenResponse(
            accessToken,
            "Bearer",
            expiresAt,
            ApiRoles.Admin,
            admin.Username,
            admin.DisplayName);
    }
}
