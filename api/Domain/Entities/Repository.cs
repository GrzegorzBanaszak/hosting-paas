using System.ComponentModel.DataAnnotations;
using Api.Domain.Enums;
using Api.Domain.Validation;

namespace Api.Domain.Entities;

public sealed class Repository : IValidatableObject
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AppId { get; set; }

    public App App { get; set; } = null!;

    public RepositoryProvider Provider { get; set; } = RepositoryProvider.GitHub;

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

    public DateTime ConnectedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Deployment> Deployments { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Provider == RepositoryProvider.GitHub &&
            !CloneUrl.Contains("github.com", StringComparison.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                "GitHub repositories must use a github.com clone URL.",
                [nameof(CloneUrl)]);
        }
    }
}
