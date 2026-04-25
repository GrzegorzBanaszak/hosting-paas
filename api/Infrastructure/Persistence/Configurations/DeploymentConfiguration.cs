using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;

public sealed class DeploymentConfiguration : IEntityTypeConfiguration<Deployment>
{
    public void Configure(EntityTypeBuilder<Deployment> builder)
    {
        builder.ToTable("deployments");

        builder.HasKey(deployment => deployment.Id);

        builder.Property(deployment => deployment.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(deployment => deployment.Trigger).HasConversion<string>().HasMaxLength(32);
        builder.Property(deployment => deployment.Branch).HasMaxLength(255);
        builder.Property(deployment => deployment.CommitSha).HasMaxLength(40);
        builder.Property(deployment => deployment.ArtifactReference).HasMaxLength(200);
        builder.Property(deployment => deployment.FailureReason).HasMaxLength(2000);
        builder.Property(deployment => deployment.CreatedAtUtc).HasColumnType("timestamp with time zone");
        builder.Property(deployment => deployment.StartedAtUtc).HasColumnType("timestamp with time zone");
        builder.Property(deployment => deployment.FinishedAtUtc).HasColumnType("timestamp with time zone");

        builder.HasIndex(deployment => new { deployment.AppId, deployment.CreatedAtUtc });
        builder.HasIndex(deployment => deployment.CommitSha);

        builder.HasOne(deployment => deployment.Repository)
            .WithMany(repository => repository.Deployments)
            .HasForeignKey(deployment => deployment.RepositoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(deployment => deployment.LogEntries)
            .WithOne(logEntry => logEntry.Deployment)
            .HasForeignKey(logEntry => logEntry.DeploymentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
