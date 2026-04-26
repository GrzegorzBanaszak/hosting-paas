using Api.Domain.Entities;
using Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Api.Infrastructure.Persistence.Extensions;

public static class ModelBuilderExtensions
{
    public static void ApplySeedData(this ModelBuilder modelBuilder)
    {
        var appId = new Guid("11111111-1111-1111-1111-111111111111");
        var repositoryId = new Guid("22222222-2222-2222-2222-222222222222");
        var domainId = new Guid("33333333-3333-3333-3333-333333333333");
        var environmentVariableId = new Guid("44444444-4444-4444-4444-444444444444");
        var deploymentId = new Guid("55555555-5555-5555-5555-555555555555");
        var logEntryId = new Guid("66666666-6666-6666-6666-666666666666");
        var createdAt = new DateTime(2026, 4, 24, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<App>().HasData(new App
        {
            Id = appId,
            Name = "Hosting PaaS Demo",
            Slug = "hosting-paas-demo",
            Description = "Seed app used to validate the initial schema.",
            Status = AppStatus.Draft,
            DeploymentKind = DeploymentKind.BackendApi,
            Port = 8080,
            BuildCommand = "docker build -t hosting-paas-demo .",
            StartCommand = "docker run -p 8080:8080 hosting-paas-demo",
            ProjectRootPath = "/src",
            PublishDirectory = "/src",
            ActiveReleasePath = null,
            HealthCheckPath = "/health",
            CreatedAtUtc = createdAt,
            UpdatedAtUtc = createdAt
        });

        modelBuilder.Entity<Repository>().HasData(new Repository
        {
            Id = repositoryId,
            AppId = appId,
            Provider = RepositoryProvider.GitHub,
            Owner = "example",
            Name = "hosting-paas-demo",
            Branch = "main",
            CloneUrl = "https://github.com/example/hosting-paas-demo.git",
            ExternalRepositoryId = "repo_seed_demo",
            WebhookSecret = "change-me",
            ConnectedAtUtc = createdAt
        });

        modelBuilder.Entity<Domain.Entities.Domain>().HasData(new Domain.Entities.Domain
        {
            Id = domainId,
            AppId = appId,
            Hostname = "demo.hosting-paas.local",
            IsPrimary = true,
            Status = DomainStatus.Pending,
            CreatedAtUtc = createdAt
        });

        modelBuilder.Entity<EnvironmentVariable>().HasData(new EnvironmentVariable
        {
            Id = environmentVariableId,
            AppId = appId,
            Key = "ASPNETCORE_ENVIRONMENT",
            Value = "Production",
            IsSecret = false,
            CreatedAtUtc = createdAt,
            UpdatedAtUtc = createdAt
        });

        modelBuilder.Entity<Deployment>().HasData(new Deployment
        {
            Id = deploymentId,
            AppId = appId,
            RepositoryId = repositoryId,
            Status = DeploymentStatus.Succeeded,
            Trigger = DeploymentTrigger.Manual,
            DeploymentKind = DeploymentKind.BackendApi,
            Branch = "main",
            CommitSha = "abcdef1",
            ArtifactReference = "seed/demo:v1",
            WorkspacePath = "/workspace/hosting-paas-demo/55555555555555555555555555555555",
            ReleasePath = "/releases/hosting-paas-demo/55555555555555555555555555555555",
            CreatedAtUtc = createdAt,
            StartedAtUtc = createdAt,
            ActivatedAtUtc = createdAt.AddMinutes(2),
            FinishedAtUtc = createdAt.AddMinutes(3),
            FailureReason = null
        });

        modelBuilder.Entity<LogEntry>().HasData(new LogEntry
        {
            Id = logEntryId,
            AppId = appId,
            DeploymentId = deploymentId,
            Level = LogEntryLevel.Information,
            Source = "seed",
            Message = "Initial demo deployment seeded for local development.",
            TimestampUtc = createdAt
        });
    }
}
