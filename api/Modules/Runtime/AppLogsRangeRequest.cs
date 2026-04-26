using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Runtime;

public sealed class AppLogsRangeRequest
{
    [Required]
    public DateTime FromUtc { get; set; }

    [Required]
    public DateTime ToUtc { get; set; }

    [Range(1, 1000)]
    public int Limit { get; set; } = 200;
}
