using Api.Domain.Entities;
using Api.Domain.Enums;

namespace Api.Infrastructure.Deployments;

public static class DeploymentFactory
{
    public static Deployment CreateQueued(App app, Repository repository, DeploymentTrigger trigger, string branch, string? commitSha)
    {
        var now = DateTime.UtcNow;

        return new Deployment
        {
            AppId = app.Id,
            RepositoryId = repository.Id,
            Branch = branch,
            CommitSha = commitSha,
            Trigger = trigger,
            Status = DeploymentStatus.Queued,
            CreatedAtUtc = now
        };
    }

    public static LogEntry CreateLog(App app, Deployment deployment, string source, string message)
    {
        return new LogEntry
        {
            AppId = app.Id,
            DeploymentId = deployment.Id,
            Source = source,
            Message = message,
            TimestampUtc = DateTime.UtcNow
        };
    }
}
