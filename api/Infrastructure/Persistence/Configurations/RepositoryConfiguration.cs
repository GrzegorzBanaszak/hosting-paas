using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;

public sealed class RepositoryConfiguration : IEntityTypeConfiguration<Repository>
{
    public void Configure(EntityTypeBuilder<Repository> builder)
    {
        builder.ToTable("repositories");

        builder.HasKey(repository => repository.Id);

        builder.Property(repository => repository.Provider).HasConversion<string>().HasMaxLength(32);
        builder.Property(repository => repository.Owner).HasMaxLength(100);
        builder.Property(repository => repository.Name).HasMaxLength(100);
        builder.Property(repository => repository.Branch).HasMaxLength(255);
        builder.Property(repository => repository.CloneUrl).HasMaxLength(2048);
        builder.Property(repository => repository.ExternalRepositoryId).HasMaxLength(200);
        builder.Property(repository => repository.WebhookSecret).HasMaxLength(200);
        builder.Property(repository => repository.ConnectedAtUtc).HasColumnType("timestamp with time zone");

        builder.HasIndex(repository => repository.AppId).IsUnique();
        builder.HasIndex(repository => new { repository.Provider, repository.Owner, repository.Name, repository.Branch });
    }
}
