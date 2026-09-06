using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text.Json;
using HeyOddLauncher.Core.Manifest;

namespace HeyOddLauncher.Services;

public sealed class BundledPackService
{
    private const string ZipResource = "HeyOddLauncher.Pack.base-pack.zip";
    private const string ManifestResource = "HeyOddLauncher.Pack.pack-manifest.json";
    private readonly Assembly _assembly = typeof(BundledPackService).Assembly;

    public async Task<PackManifest> LoadManifestAsync(CancellationToken token)
    {
        await using var stream = _assembly.GetManifestResourceStream(ManifestResource)
            ?? throw new InvalidDataException("내장 pack manifest가 없습니다.");
        return await JsonSerializer.DeserializeAsync<PackManifest>(stream, cancellationToken: token)
            ?? throw new InvalidDataException("내장 pack manifest를 읽지 못했습니다.");
    }

    public void SeedSettings(string instanceRoot)
    {
        var marker = Path.Combine(instanceRoot, ".heyodd-base-pack-v1");
        if (File.Exists(marker)) return;
        Directory.CreateDirectory(instanceRoot);

        using var stream = _assembly.GetManifestResourceStream(ZipResource)
            ?? throw new InvalidDataException("내장 기본 설정 팩이 없습니다.");
        using var zip = new ZipArchive(stream, ZipArchiveMode.Read);
        var root = Path.GetFullPath(instanceRoot) + Path.DirectorySeparatorChar;
        foreach (var entry in zip.Entries)
        {
            if (string.IsNullOrEmpty(entry.Name)) continue;
            var destination = Path.GetFullPath(Path.Combine(root, entry.FullName));
            if (!destination.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("기본 설정 팩의 경로가 올바르지 않습니다.");
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            if (!File.Exists(destination)) entry.ExtractToFile(destination);
        }
        File.WriteAllText(marker, DateTimeOffset.UtcNow.ToString("O"));
    }
}
