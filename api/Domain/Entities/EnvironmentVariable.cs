using System.ComponentModel.DataAnnotations;
using Api.Domain.Validation;

namespace Api.Domain.Entities;

public sealed class EnvironmentVariable : IValidatableObject
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AppId { get; set; }

    public App App { get; set; } = null!;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    [RegularExpression(DomainValidationPatterns.EnvironmentVariableKey)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Value { get; set; } = string.Empty;

    public bool IsSecret { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Key.StartsWith("HOSTING_PAAS_", StringComparison.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                "Environment variable keys with the HOSTING_PAAS_ prefix are reserved.",
                [nameof(Key)]);
        }
    }
}
