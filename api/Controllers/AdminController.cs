using Api.Infrastructure.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = ApiPolicies.AdminAccess)]
[EnableRateLimiting("admin-api")]
public sealed class AdminController : ControllerBase
{
    [HttpGet("access")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<object> GetAccessStatus()
    {
        return Ok(new
        {
            status = "authorized",
            role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value,
            user = User.Identity?.Name
        });
    }
}
