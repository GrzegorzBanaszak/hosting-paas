namespace Api.Configuration;

public sealed class ObservabilityOptions
{
    public const string SectionName = "Observability";

    public bool LogRequestBodies { get; set; }
}
