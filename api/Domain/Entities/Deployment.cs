using System.ComponentModel.DataAnnotations;
using Api.Domain.Enums;
using Api.Domain.Validation;

namespace Api.Domain.Entities;

public sealed class Deployment : IValidatableObject
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AppId { get; set; }

    public App App { get; set; } = null!;

    public Guid? RepositoryId { get; set; }

    public Repository? Repository { get; set; }

    public DeploymentStatus Status { get; set; } = DeploymentStatus.Queued;

    public DeploymentTrigger Trigger { get; set; } = DeploymentTrigger.Manual;

    public DeploymentKind DeploymentKind { get; set; } = DeploymentKind.StaticSite;

    [Required]
    [StringLength(255, MinimumLength = 1)]
    [RegularExpression(DomainValidationPatterns.BranchName)]
    public string Branch { get; set; } = "main";

    [StringLength(40)]
    [RegularExpression(DomainValidationPatterns.CommitSha)]
    public string? CommitSha { get; set; }

    [StringLength(200)]
    public string? ArtifactReference { get; set; }

    [StringLength(500)]
    public string? WorkspacePath { get; set; }

    [StringLength(500)]
    public string? ReleasePath { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? ActivatedAtUtc { get; set; }

    public DateTime? FinishedAtUtc { get; set; }

    [StringLength(2000)]
    public string? FailureReason { get; set; }

    public ICollection<LogEntry> LogEntries { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (FinishedAtUtc.HasValue && StartedAtUtc.HasValue && FinishedAtUtc < StartedAtUtc)
        {
            yield return new ValidationResult(
                "FinishedAtUtc cannot be earlier than StartedAtUtc.",
                [nameof(FinishedAtUtc), nameof(StartedAtUtc)]);
        }

        if (Status == DeploymentStatus.Failed && string.IsNullOrWhiteSpace(FailureReason))
        {
            yield return new ValidationResult(
                "FailureReason is required when deployment status is Failed.",
                [nameof(FailureReason), nameof(Status)]);
        }
    }
}
