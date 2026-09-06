param(
    [Parameter(Mandatory=$true)][string]$Source,
    [Parameter(Mandatory=$true)][string]$BaseUrl,
    [Parameter(Mandatory=$true)][string]$Version,
    [string]$Output = "pack/manifest.json"
)
$sourceRoot = (Resolve-Path -LiteralPath $Source).Path
$allowedRoots = @("mods", "config", "defaultconfigs", "shaderpacks", "resourcepacks")
$entries = @()
foreach ($folder in $allowedRoots) {
    $folderPath = Join-Path $sourceRoot $folder
    if (-not (Test-Path -LiteralPath $folderPath)) { continue }
    Get-ChildItem -LiteralPath $folderPath -File -Recurse | ForEach-Object {
        $relative = [IO.Path]::GetRelativePath($sourceRoot, $_.FullName).Replace('\', '/')
        $entries += [ordered]@{
            path = $relative
            url = "$($BaseUrl.TrimEnd('/'))/$Version/$relative"
            sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            size = $_.Length
            mutable = $false
        }
    }
}
$servers = Join-Path $sourceRoot "servers.dat"
if (Test-Path -LiteralPath $servers) {
    $file = Get-Item -LiteralPath $servers
    $entries += [ordered]@{ path="servers.dat"; url="$($BaseUrl.TrimEnd('/'))/$Version/servers.dat"; sha256=(Get-FileHash -LiteralPath $servers -Algorithm SHA256).Hash.ToLowerInvariant(); size=$file.Length; mutable=$true }
}
$manifest = [ordered]@{ schemaVersion=1; packVersion=$Version; minecraft="1.21.1"; neoForge="21.1.249"; server="heyodd.iptime.org"; files=$entries }
$outputPath = Join-Path (Get-Location) $Output
New-Item -ItemType Directory -Force -Path (Split-Path $outputPath) | Out-Null
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $outputPath -Encoding utf8
Write-Host "Created $outputPath with $($entries.Count) files."
