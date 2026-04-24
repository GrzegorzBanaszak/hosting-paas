using Api.Configuration;
using Api.Modules.System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Api.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController(IOptions<PlatformOptions> platformOptions) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<SystemInfoResponse>(StatusCodes.Status200OK)]
    public ActionResult<SystemInfoResponse> Get()
    {
        var options = platformOptions.Value;

        return Ok(new SystemInfoResponse(
            options.ServiceName,
            options.EnvironmentName,
            "ok"));
    }
}
