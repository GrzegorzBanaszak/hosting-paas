using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;

public sealed class LogEntryConfiguration : IEntityTypeConfiguration<LogEntry>
{
    public void Configure(EntityTypeBuilder<LogEntry> builder)
    {
        builder.ToTable("log_entries");

        builder.HasKey(logEntry => logEntry.Id);

        builder.Property(logEntry => logEntry.Level).HasConversion<string>().HasMaxLength(32);
        builder.Property(logEntry => logEntry.Source).HasMaxLength(100);
        builder.Property(logEntry => logEntry.Message).HasMaxLength(4000);
        builder.Property(logEntry => logEntry.TimestampUtc).HasColumnType("timestamp with time zone");

        builder.HasIndex(logEntry => new { logEntry.AppId, logEntry.TimestampUtc });
        builder.HasIndex(logEntry => new { logEntry.DeploymentId, logEntry.TimestampUtc });
    }
}
