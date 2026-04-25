using System.ComponentModel.DataAnnotations;
using Api.Domain.Enums;
using Api.Domain.Validation;

namespace Api.Domain.Entities;

public sealed class Domain
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AppId { get; set; }

    public App App { get; set; } = null!;

    [Required]
    [StringLength(253, MinimumLength = 3)]
    [RegularExpression(DomainValidationPatterns.Hostname)]
    public string Hostname { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }

    public DomainStatus Status { get; set; } = DomainStatus.Pending;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
