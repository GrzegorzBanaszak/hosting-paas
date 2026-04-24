using Api.Configuration;

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

        return services;
    }

    public static IServiceCollection AddApiModules(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        return services;
    }
}
