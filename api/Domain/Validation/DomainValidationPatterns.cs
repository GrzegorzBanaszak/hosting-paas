namespace Api.Domain.Validation;

public static partial class DomainValidationPatterns
{
    public const string Slug = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    public const string BranchName = "^[A-Za-z0-9._/-]+$";
    public const string EnvironmentVariableKey = "^[A-Z_][A-Z0-9_]*$";
    public const string CommitSha = "^[a-fA-F0-9]{7,40}$";
    public const string Hostname = "^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\\.)+[a-zA-Z]{2,63}$";
}
