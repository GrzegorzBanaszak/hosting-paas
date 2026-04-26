using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using Api.Configuration;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure.Deployments;

public sealed class DeploymentCommandRunner(IOptions<DeploymentPipelineOptions> options)
{
    public async Task<CommandExecutionResult> RunAsync(string command, string workingDirectory, CancellationToken cancellationToken)
    {
        var timeout = TimeSpan.FromSeconds(options.Value.CommandTimeoutSeconds);
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeout);

        var startInfo = CreateStartInfo(command);

        startInfo.WorkingDirectory = workingDirectory;
        startInfo.RedirectStandardOutput = true;
        startInfo.RedirectStandardError = true;
        startInfo.UseShellExecute = false;
        startInfo.CreateNoWindow = true;

        using var process = new Process { StartInfo = startInfo };

        if (!process.Start())
        {
            throw new DeploymentExecutionException("Failed to start deployment command process.");
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync(timeoutCts.Token);
        var stderrTask = process.StandardError.ReadToEndAsync(timeoutCts.Token);

        try
        {
            await process.WaitForExitAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            TryTerminate(process);
            throw new DeploymentExecutionException($"Command timed out after {timeout.TotalSeconds:0} seconds.");
        }

        var standardOutput = await stdoutTask;
        var standardError = await stderrTask;

        return new CommandExecutionResult(process.ExitCode, standardOutput, standardError);
    }

    private static ProcessStartInfo CreateStartInfo(string command)
    {
        var startInfo = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? new ProcessStartInfo("powershell")
            : new ProcessStartInfo("/bin/sh");

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            startInfo.ArgumentList.Add("-NoProfile");
            startInfo.ArgumentList.Add("-Command");
            startInfo.ArgumentList.Add(command);
        }
        else
        {
            startInfo.ArgumentList.Add("-lc");
            startInfo.ArgumentList.Add(command);
        }

        return startInfo;
    }

    private static void TryTerminate(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch
        {
            // Ignore teardown errors after timeout.
        }
    }
}

public sealed record CommandExecutionResult(int ExitCode, string StandardOutput, string StandardError)
{
    public string CombinedOutput
    {
        get
        {
            var builder = new StringBuilder();

            if (!string.IsNullOrWhiteSpace(StandardOutput))
            {
                builder.AppendLine(StandardOutput.Trim());
            }

            if (!string.IsNullOrWhiteSpace(StandardError))
            {
                if (builder.Length > 0)
                {
                    builder.AppendLine();
                }

                builder.AppendLine(StandardError.Trim());
            }

            return builder.ToString().Trim();
        }
    }
}
