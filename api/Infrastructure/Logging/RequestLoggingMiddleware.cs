using System.Diagnostics;

namespace Api.Infrastructure.Logging;

public sealed class RequestLoggingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ILogger<RequestLoggingMiddleware> logger)
    {
        var stopwatch = Stopwatch.StartNew();

        using (logger.BeginScope(new Dictionary<string, object?>
        {
            ["TraceId"] = context.TraceIdentifier
        }))
        {
            await next(context);
        }

        stopwatch.Stop();

        logger.LogInformation(
            "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs} ms",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds);
    }
}
