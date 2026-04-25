using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;

public sealed class DomainConfiguration : IEntityTypeConfiguration<Domain.Entities.Domain>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Domain> builder)
    {
        builder.ToTable("domains");

        builder.HasKey(domain => domain.Id);

        builder.Property(domain => domain.Hostname).HasMaxLength(253);
        builder.Property(domain => domain.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(domain => domain.CreatedAtUtc).HasColumnType("timestamp with time zone");

        builder.HasIndex(domain => domain.Hostname).IsUnique();
        builder.HasIndex(domain => new { domain.AppId, domain.IsPrimary })
            .HasFilter("\"IsPrimary\" = true");
    }
}
