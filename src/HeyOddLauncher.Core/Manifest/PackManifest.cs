using System.Text.Json.Serialization;

namespace HeyOddLauncher.Core.Manifest;

public sealed record PackManifest(
    [property: JsonPropertyName("schemaVersion")] int SchemaVersion,
    [property: JsonPropertyName("packVersion")] string PackVersion,
    [property: JsonPropertyName("minecraft")] string Minecraft,
    [property: JsonPropertyName("neoForge")] string NeoForge,
    [property: JsonPropertyName("server")] string Server,
    [property: JsonPropertyName("files")] IReadOnlyList<PackFile> Files);

public sealed record PackFile(
    [property: JsonPropertyName("path")] string Path,
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("sha256")] string Sha256,
    [property: JsonPropertyName("size")] long Size,
    [property: JsonPropertyName("mutable")] bool Mutable = false);

public sealed record SyncProgress(string CurrentFile, int Completed, int Total, long DownloadedBytes);
