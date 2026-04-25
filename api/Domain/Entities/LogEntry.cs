using System.ComponentModel.DataAnnotations;
using Api.Domain.Enums;

namespace Api.Domain.Entities;

public sealed class LogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AppId { get; set; }

    public App App { get; set; } = null!;

    public Guid? DeploymentId { get; set; }

    public Deployment? Deployment { get; set; }

    public LogEntryLevel Level { get; set; } = LogEntryLevel.Information;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Source { get; set; } = "system";

    [Required]
    [StringLength(4000, MinimumLength = 1)]
    public string Message { get; set; } = string.Empty;

    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
