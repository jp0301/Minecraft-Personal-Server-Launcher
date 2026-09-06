using System.Net.Http.Json;
using System.Security.Cryptography;

namespace HeyOddLauncher.Core.Manifest;

public sealed class ManifestClient(HttpClient httpClient)
{
    public async Task<PackManifest> FetchAsync(Uri uri, CancellationToken cancellationToken)
    {
        var manifest = await httpClient.GetFromJsonAsync<PackManifest>(uri, cancellationToken)
            ?? throw new InvalidDataException("Manifest 응답이 비어 있습니다.");
        if (manifest.SchemaVersion != 1)
            throw new InvalidDataException($"지원하지 않는 manifest schema: {manifest.SchemaVersion}");
        if (manifest.Minecraft != "1.21.1" || manifest.NeoForge != "21.1.249")
            throw new InvalidDataException("런처와 호환되지 않는 Minecraft/NeoForge 버전입니다.");
        return manifest;
    }

    public async Task SyncAsync(PackManifest manifest, string instanceRoot,
        IProgress<SyncProgress>? progress = null, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(instanceRoot);
        var root = Path.GetFullPath(instanceRoot) + Path.DirectorySeparatorChar;
        long downloaded = 0;
        var completed = 0;

        foreach (var file in manifest.Files)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var destination = ResolveSafePath(root, file.Path);
            if (file.Mutable && File.Exists(destination))
            {
                progress?.Report(new(file.Path, ++completed, manifest.Files.Count, downloaded));
                continue;
            }
            if (await MatchesAsync(destination, file.Sha256, cancellationToken))
            {
                progress?.Report(new(file.Path, ++completed, manifest.Files.Count, downloaded));
                continue;
            }

            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            var temp = destination + ".download";
            try
            {
                using var response = await httpClient.GetAsync(file.Url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                response.EnsureSuccessStatusCode();
                await using var source = await response.Content.ReadAsStreamAsync(cancellationToken);
                await using var target = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true);
                await source.CopyToAsync(target, cancellationToken);
                downloaded += target.Length;
                await target.FlushAsync(cancellationToken);
                target.Close();

                if (new FileInfo(temp).Length != file.Size || !await MatchesAsync(temp, file.Sha256, cancellationToken))
                    throw new InvalidDataException($"다운로드 검증 실패: {file.Path}");
                File.Move(temp, destination, true);
            }
            finally
            {
                if (File.Exists(temp)) File.Delete(temp);
            }
            progress?.Report(new(file.Path, ++completed, manifest.Files.Count, downloaded));
        }
    }

    private static string ResolveSafePath(string root, string relativePath)
    {
        if (Path.IsPathRooted(relativePath)) throw new InvalidDataException("절대 경로는 허용되지 않습니다.");
        var fullPath = Path.GetFullPath(Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar)));
        if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("Manifest 경로가 인스턴스 폴더를 벗어납니다.");
        return fullPath;
    }

    private static async Task<bool> MatchesAsync(string path, string expected, CancellationToken cancellationToken)
    {
        if (!File.Exists(path) || expected.Length != 64) return false;
        await using var stream = File.OpenRead(path);
        var actual = Convert.ToHexString(await SHA256.HashDataAsync(stream, cancellationToken));
        return actual.Equals(expected, StringComparison.OrdinalIgnoreCase);
    }
}
