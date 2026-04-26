using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

public sealed class RuntimeOptions
{
    public const string SectionName = "Runtime";

    [Range(1, 3600)]
    public int HealthCheckTimeoutSeconds { get; set; } = 10;

    [Range(1, 3600)]
    public int MonitorIntervalSeconds { get; set; } = 5;

    [Range(1, 500)]
    public int RecentLogsLimit { get; set; } = 100;

    [StringLength(100, MinimumLength = 1)]
    public string LocalHealthCheckHost { get; set; } = "127.0.0.1";
}
