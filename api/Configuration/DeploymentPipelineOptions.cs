using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

public sealed class DeploymentPipelineOptions
{
    public const string SectionName = "DeploymentPipeline";

    [Range(1, 1000)]
    public int QueueCapacity { get; set; } = 100;

    [Range(1, 10)]
    public int MaxRetryAttempts { get; set; } = 3;

    [Range(0, 3600)]
    public int RetryDelaySeconds { get; set; } = 5;

    [Range(5, 7200)]
    public int CommandTimeoutSeconds { get; set; } = 900;

    [Required]
    [StringLength(260, MinimumLength = 1)]
    public string ArtifactRootPath { get; set; } = "artifacts";

    public bool ExecuteStartCommandOnRestart { get; set; }
}
