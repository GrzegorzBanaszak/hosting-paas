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

    [Required]
    [StringLength(260, MinimumLength = 1)]
    public string WorkspaceRootPath { get; set; } = "workspaces";

    [Required]
    [StringLength(260, MinimumLength = 1)]
    public string ReleaseRootPath { get; set; } = "releases";

    [Required]
    [StringLength(260, MinimumLength = 1)]
    public string CurrentRootPath { get; set; } = "current";

    [Range(1, 300)]
    public int VerificationTimeoutSeconds { get; set; } = 30;

    public bool ExecuteStartCommandOnRestart { get; set; }
}
