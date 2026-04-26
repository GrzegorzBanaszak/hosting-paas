using Api.Configuration;
using Api.Infrastructure.Auth;
using Api.Infrastructure.Deployments;
using Api.Infrastructure.Persistence;
using Api.Infrastructure.Runtime;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiOptions(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<PlatformOptions>()
            .Bind(configuration.GetSection(PlatformOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<ObservabilityOptions>()
            .Bind(configuration.GetSection(ObservabilityOptions.SectionName))
            .ValidateOnStart();

        services
            .AddOptions<CorsOptions>()
            .Bind(configuration.GetSection(CorsOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<AuthOptions>()
            .Bind(configuration.GetSection(AuthOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<DeploymentPipelineOptions>()
            .Bind(configuration.GetSection(DeploymentPipelineOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<RuntimeOptions>()
            .Bind(configuration.GetSection(RuntimeOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        var connectionString = configuration.GetConnectionString(DatabaseOptions.ConnectionStringName)
            ?? throw new InvalidOperationException(
                $"Connection string '{DatabaseOptions.ConnectionStringName}' is not configured.");

        var authOptions = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>()
            ?? throw new InvalidOperationException($"Section '{AuthOptions.SectionName}' is not configured.");
        var signingKey = Encoding.UTF8.GetBytes(authOptions.Jwt.SigningKey);

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IAdminAuthService, AdminAuthService>();
        services.AddSingleton<IDeploymentQueue, DeploymentQueue>();
        services.AddSingleton<DeploymentCommandRunner>();
        services.AddHttpClient(nameof(AppRuntimeService));
        services.AddSingleton<IAppRuntimeService, AppRuntimeService>();
        services.AddHostedService<DeploymentPipelineWorker>();
        services.AddHostedService<AppRuntimeMonitor>();
        var corsOptions = configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>()
            ?? throw new InvalidOperationException($"Section '{CorsOptions.SectionName}' is not configured.");

        services.AddCors(options =>
        {
            options.AddPolicy("frontend", policy =>
            {
                policy
                    .WithOrigins(corsOptions.AllowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = authOptions.Jwt.Issuer,
                    ValidAudience = authOptions.Jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(signingKey),
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(ApiPolicies.AdminAccess, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole(ApiRoles.Admin);
            });

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy("auth-login", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    }));

            options.AddPolicy("admin-api", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.User.Identity?.Name
                        ?? context.Connection.RemoteIpAddress?.ToString()
                        ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    }));
        });

        return services;
    }

    public static IServiceCollection AddApiModules(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        return services;
    }
}
