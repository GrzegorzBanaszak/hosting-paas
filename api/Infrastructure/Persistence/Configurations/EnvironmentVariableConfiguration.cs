using Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Api.Infrastructure.Persistence.Configurations;

public sealed class EnvironmentVariableConfiguration : IEntityTypeConfiguration<EnvironmentVariable>
{
    public void Configure(EntityTypeBuilder<EnvironmentVariable> builder)
    {
        builder.ToTable("environment_variables");

        builder.HasKey(environmentVariable => environmentVariable.Id);

        builder.Property(environmentVariable => environmentVariable.Key).HasMaxLength(100);
        builder.Property(environmentVariable => environmentVariable.Value).HasMaxLength(4000);
        builder.Property(environmentVariable => environmentVariable.CreatedAtUtc).HasColumnType("timestamp with time zone");
        builder.Property(environmentVariable => environmentVariable.UpdatedAtUtc).HasColumnType("timestamp with time zone");

        builder.HasIndex(environmentVariable => new { environmentVariable.AppId, environmentVariable.Key }).IsUnique();
    }
}
