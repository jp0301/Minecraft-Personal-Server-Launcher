using System.Text.Json;

namespace HeyOddLauncher.Core.Manifest;

public sealed record LocalState(string PackVersion, DateTimeOffset InstalledAtUtc);

public static class LocalStateStore
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public static async Task WriteAsync(string instanceRoot, LocalState state, CancellationToken token)
    {
        var statePath = Path.Combine(instanceRoot, ".heyodd-state.json");
        await File.WriteAllTextAsync(statePath, JsonSerializer.Serialize(state, JsonOptions), token);
    }

    public static async Task<LocalState?> ReadAsync(string instanceRoot, CancellationToken token)
    {
        var statePath = Path.Combine(instanceRoot, ".heyodd-state.json");
        if (!File.Exists(statePath)) return null;
        return JsonSerializer.Deserialize<LocalState>(await File.ReadAllTextAsync(statePath, token));
    }
}
