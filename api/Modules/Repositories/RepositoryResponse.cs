namespace Api.Modules.Repositories;

public sealed record RepositoryResponse(
    Guid Id,
    Guid AppId,
    string Provider,
    string Owner,
    string Name,
    string Branch,
    string CloneUrl,
    string? ExternalRepositoryId,
    bool HasWebhookSecret,
    DateTime ConnectedAtUtc,
    string WebhookPath);
