using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

public sealed class JwtOptions
{
    [Required]
    [MinLength(32)]
    public string SigningKey { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Issuer { get; set; } = "hosting-paas-api";

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Audience { get; set; } = "hosting-paas-admin";

    [Range(1, 1440)]
    public int AccessTokenLifetimeMinutes { get; set; } = 60;
}
