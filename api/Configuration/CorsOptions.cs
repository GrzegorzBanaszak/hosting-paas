using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    [MinLength(1)]
    public string[] AllowedOrigins { get; set; } = [];
}
