using System.ComponentModel.DataAnnotations;
using Api.Domain.Validation;

namespace Api.Modules.Deployments;

public sealed class QueueDeploymentRequest
{
    [Required]
    [StringLength(40, MinimumLength = 7)]
    [RegularExpression(DomainValidationPatterns.CommitSha)]
    public string CommitSha { get; set; } = string.Empty;

    [StringLength(255, MinimumLength = 1)]
    [RegularExpression(DomainValidationPatterns.BranchName)]
    public string? Branch { get; set; }
}
