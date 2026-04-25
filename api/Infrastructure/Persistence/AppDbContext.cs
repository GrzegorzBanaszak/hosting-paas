using Api.Domain.Entities;
using Api.Infrastructure.Persistence.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<App> Apps => Set<App>();

    public DbSet<Repository> Repositories => Set<Repository>();

    public DbSet<Deployment> Deployments => Set<Deployment>();

    public DbSet<EnvironmentVariable> EnvironmentVariables => Set<EnvironmentVariable>();

    public DbSet<Domain.Entities.Domain> Domains => Set<Domain.Entities.Domain>();

    public DbSet<LogEntry> LogEntries => Set<LogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySeedData();
    }
}
