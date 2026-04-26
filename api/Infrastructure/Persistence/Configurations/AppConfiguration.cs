using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;

public sealed class AppConfiguration : IEntityTypeConfiguration<App>
{
    public void Configure(EntityTypeBuilder<App> builder)
    {
        builder.ToTable("apps");

        builder.HasKey(app => app.Id);

        builder.Property(app => app.Name).HasMaxLength(100);
        builder.Property(app => app.Slug).HasMaxLength(100);
        builder.Property(app => app.Description).HasMaxLength(500);
        builder.Property(app => app.DeploymentKind).HasConversion<string>().HasMaxLength(32);
        builder.Property(app => app.BuildCommand).HasMaxLength(2000);
        builder.Property(app => app.StartCommand).HasMaxLength(2000);
        builder.Property(app => app.ProjectRootPath).HasMaxLength(500);
        builder.Property(app => app.PublishDirectory).HasMaxLength(500);
        builder.Property(app => app.ActiveReleasePath).HasMaxLength(500);
        builder.Property(app => app.HealthCheckPath).HasMaxLength(255);

        builder.Property(app => app.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(app => app.CreatedAtUtc).HasColumnType("timestamp with time zone");
        builder.Property(app => app.UpdatedAtUtc).HasColumnType("timestamp with time zone");

        builder.HasIndex(app => app.Slug).IsUnique();

        builder.HasOne(app => app.Repository)
            .WithOne(repository => repository.App)
            .HasForeignKey<Repository>(repository => repository.AppId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(app => app.Deployments)
            .WithOne(deployment => deployment.App)
            .HasForeignKey(deployment => deployment.AppId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(app => app.EnvironmentVariables)
            .WithOne(environmentVariable => environmentVariable.App)
            .HasForeignKey(environmentVariable => environmentVariable.AppId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(app => app.Domains)
            .WithOne(domain => domain.App)
            .HasForeignKey(domain => domain.AppId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(app => app.LogEntries)
            .WithOne(logEntry => logEntry.App)
            .HasForeignKey(logEntry => logEntry.AppId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
