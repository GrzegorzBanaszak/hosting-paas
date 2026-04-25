using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    [Required]
    public JwtOptions Jwt { get; set; } = new();

    [Required]
    public BootstrapAdminOptions BootstrapAdmin { get; set; } = new();
}
