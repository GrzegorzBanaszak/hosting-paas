using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

public sealed class BootstrapAdminOptions
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Username { get; set; } = "admin";

    [Required]
    [StringLength(200, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "admin@hosting-paas.local";

    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string DisplayName { get; set; } = "Platform Admin";
}
