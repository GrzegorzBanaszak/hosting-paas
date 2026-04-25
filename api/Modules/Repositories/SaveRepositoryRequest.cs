using System.ComponentModel.DataAnnotations;
using Api.Domain.Validation;

namespace Api.Modules.Repositories;

public sealed class SaveRepositoryRequest
{
    [Required]
    [StringLength(32, MinimumLength = 3)]
    public string Provider { get; set; } = "GitHub";

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Owner { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(255, MinimumLength = 1)]
    [RegularExpression(DomainValidationPatterns.BranchName)]
    public string Branch { get; set; } = "main";

    [Required]
    [StringLength(2048)]
    [Url]
    public string CloneUrl { get; set; } = string.Empty;

    [StringLength(200)]
    public string? ExternalRepositoryId { get; set; }

    [StringLength(200)]
    public string? WebhookSecret { get; set; }
}
