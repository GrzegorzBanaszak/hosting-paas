namespace Api.Domain.Enums;

public enum AppStatus
{
    Draft = 0,
    Stopped = 1,
    Starting = 2,
    Running = 3,
    Degraded = 4,
    Failed = 5,
    Archived = 6
}
