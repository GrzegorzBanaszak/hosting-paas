namespace Api.Configuration;

public sealed class PlatformOptions
{
    public const string SectionName = "Platform";

    public string ServiceName { get; set; } = "hosting-paas-api";

    public string EnvironmentName { get; set; } = "Development";
}
