using System.Text.Json;
using System.IO;

namespace HeyOddLauncher;

public sealed record LauncherSettings(string ManifestUrl, string MicrosoftClientId, int MaximumRamMb)
{
    public static LauncherSettings Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "launcher-settings.json");
        return JsonSerializer.Deserialize<LauncherSettings>(File.ReadAllText(path), new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidDataException("launcher-settings.json을 읽지 못했습니다.");
    }
}
