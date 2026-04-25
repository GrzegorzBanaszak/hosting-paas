using Api.Infrastructure.Auth;
using Api.Modules.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAdminAuthService adminAuthService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<AuthTokenResponse> Login([FromBody] AdminLoginRequest request)
    {
        var token = adminAuthService.Login(request);

        if (token is null)
        {
            return Unauthorized(new ProblemDetails
            {
                Title = "Invalid credentials",
                Detail = "The provided administrator credentials are invalid.",
                Status = StatusCodes.Status401Unauthorized,
                Type = "https://httpstatuses.com/401"
            });
        }

        return Ok(token);
    }

    [HttpGet("me")]
    [Authorize(Policy = ApiPolicies.AdminAccess)]
    [ProducesResponseType<AdminSessionResponse>(StatusCodes.Status200OK)]
    public ActionResult<AdminSessionResponse> Me()
    {
        return Ok(new AdminSessionResponse(
            User.Identity?.Name ?? string.Empty,
            User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty,
            User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value,
            User.FindFirst("display_name")?.Value));
    }
}
