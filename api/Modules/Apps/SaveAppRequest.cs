using System.ComponentModel.DataAnnotations;
using Api.Domain.Validation;

namespace Api.Modules.Apps;

public sealed class SaveAppRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 3)]
    [RegularExpression(DomainValidationPatterns.Slug)]
    public string Slug { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [StringLength(32, MinimumLength = 3)]
    public string Status { get; set; } = "Draft";

    [Range(1, 65535)]
    public int? Port { get; set; }

    [StringLength(2000)]
    public string? BuildCommand { get; set; }

    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string StartCommand { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ProjectRootPath { get; set; }

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public string HealthCheckPath { get; set; } = "/health";

    [StringLength(253, MinimumLength = 3)]
    [RegularExpression(DomainValidationPatterns.Hostname)]
    public string? PrimaryHostname { get; set; }
}
