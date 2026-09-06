using CmlLib.Core;
using CmlLib.Core.Auth;
using CmlLib.Core.Installer.NeoForge;
using CmlLib.Core.Installer.NeoForge.Installers;
using CmlLib.Core.ProcessBuilder;
using System.Diagnostics;

namespace HeyOddLauncher.Services;

public sealed class GameService(string instanceRoot)
{
    private readonly MinecraftLauncher _launcher = new(new MinecraftPath(instanceRoot));

    public event EventHandler<string>? StatusChanged;

    public async Task<string> EnsureGameAsync(CancellationToken cancellationToken)
    {
        _launcher.FileProgressChanged += (_, e) => StatusChanged?.Invoke(this, $"{e.Name} ({e.ProgressedTasks}/{e.TotalTasks})");
        var installer = new NeoForgeInstaller(_launcher);
        var progress = new Progress<string>(message => StatusChanged?.Invoke(this, message));
        return await installer.Install("1.21.1", "21.1.249", new NeoForgeInstallOptions
        {
            InstallerOutput = progress,
            CancellationToken = cancellationToken
        });
    }

    public async Task<Process> LaunchAsync(string versionName, MSession session, int maximumRamMb)
    {
        var process = await _launcher.CreateProcessAsync(versionName, new MLaunchOption
        {
            Session = session,
            MaximumRamMb = Math.Clamp(maximumRamMb, 2048, 16384),
            ServerIp = "heyodd.iptime.org",
            GameLauncherName = "HeyOdd Minecraft"
        });
        process.Start();
        return process;
    }
}
