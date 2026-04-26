using Api.Configuration;
using Api.Extensions;
using Api.Infrastructure.ErrorHandling;
using Api.Infrastructure.Logging;
using Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables(prefix: "HOSTING_PAAS_");

builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(options =>
{
    options.TimestampFormat = "yyyy-MM-dd HH:mm:ss ";
    options.SingleLine = true;
    options.IncludeScopes = true;
});

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddControllers();
builder.Services.AddApiOptions(builder.Configuration);
builder.Services.AddApiModules();

var app = builder.Build();

await app.Services.InitializeDatabaseAsync();

app.UseExceptionHandler();
app.UseStatusCodePages(async statusCodeContext =>
{
    var problemDetailsService = statusCodeContext.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>();

    await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
    {
        HttpContext = statusCodeContext.HttpContext,
        ProblemDetails =
        {
            Status = statusCodeContext.HttpContext.Response.StatusCode,
            Title = "Request failed",
            Type = $"https://httpstatuses.com/{statusCodeContext.HttpContext.Response.StatusCode}"
        }
    });
});
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
