using System.ComponentModel.DataAnnotations;
using Api.Domain.Enums;
using Api.Domain.Validation;

namespace Api.Domain.Entities;

public sealed class App : IValidatableObject
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 3)]
    [RegularExpression(DomainValidationPatterns.Slug)]
    public string Slug { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public AppStatus Status { get; set; } = AppStatus.Draft;

    public DeploymentKind DeploymentKind { get; set; } = DeploymentKind.StaticSite;

    [Range(1, 65535)]
    public int? Port { get; set; }

    [StringLength(2000)]
    public string? BuildCommand { get; set; }

    [StringLength(2000)]
    public string? StartCommand { get; set; }

    [StringLength(500)]
    public string? ProjectRootPath { get; set; }

    [StringLength(500)]
    public string? PublishDirectory { get; set; }

    [StringLength(500)]
    public string? ActiveReleasePath { get; set; }

    [StringLength(255)]
    public string HealthCheckPath { get; set; } = "/health";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Repository? Repository { get; set; }

    public ICollection<Deployment> Deployments { get; init; } = [];

    public ICollection<EnvironmentVariable> EnvironmentVariables { get; init; } = [];

    public ICollection<Domain> Domains { get; init; } = [];

    public ICollection<LogEntry> LogEntries { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!HealthCheckPath.StartsWith('/'))
        {
            yield return new ValidationResult(
                "HealthCheckPath must start with '/'.",
                [nameof(HealthCheckPath)]);
        }

        if (DeploymentKind is DeploymentKind.BackendApi or DeploymentKind.Fullstack &&
            string.IsNullOrWhiteSpace(StartCommand))
        {
            yield return new ValidationResult(
                "StartCommand is required for runtime deployment kinds.",
                [nameof(StartCommand), nameof(DeploymentKind)]);
        }

        if (Domains.Count(domain => domain.IsPrimary) > 1)
        {
            yield return new ValidationResult(
                "Only one primary domain can be assigned to an app.",
                [nameof(Domains)]);
        }

        var duplicateEnvironmentKeys = EnvironmentVariables
            .GroupBy(variable => variable.Key, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();

        if (duplicateEnvironmentKeys.Length > 0)
        {
            yield return new ValidationResult(
                $"Environment variable keys must be unique. Duplicates: {string.Join(", ", duplicateEnvironmentKeys)}.",
                [nameof(EnvironmentVariables)]);
        }

        var duplicateHostnames = Domains
            .GroupBy(domain => domain.Hostname, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();

        if (duplicateHostnames.Length > 0)
        {
            yield return new ValidationResult(
                $"Domain hostnames must be unique per app. Duplicates: {string.Join(", ", duplicateHostnames)}.",
                [nameof(Domains)]);
        }
    }
}
