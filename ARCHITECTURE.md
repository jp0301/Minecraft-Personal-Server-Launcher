# HeyOdd Minecraft Launcher — architecture

## Fixed product contract

- Windows 10/11 x64, .NET 8 WPF desktop application
- Minecraft Java 1.21.1 and NeoForge 21.1.249
- Isolated instance at `%LOCALAPPDATA%\HeyOdd\Minecraft`
- Official Microsoft/Xbox/Minecraft authentication; no password collection or client secret
- Default direct connection to `heyodd.iptime.org`

## Components

`MainWindow` is a thin state coordinator. `MicrosoftMinecraftAuth` uses MSAL's system-browser public-client flow and Windows-protected MSAL cache. `GameService` delegates Mojang assets, Java, libraries, NeoForge installation, launch arguments, and process creation to CmlLib. `ManifestClient` owns only HeyOdd pack content.

The pack manifest is an immutable release description. Every file has a relative path, HTTPS URL, byte size, and SHA-256. Downloads go to a temporary sibling file, are verified, and then atomically replace the target. Path traversal is rejected. `mutable: true` is reserved for user-owned files such as `servers.dat`, which are seeded once and not overwritten.

## Release flow

1. Prepare a clean, tested client directory containing `mods`, `config`, `defaultconfigs`, `shaderpacks`, optional `resourcepacks`, and `servers.dat`.
2. Upload those files below an immutable URL such as `/heyodd/1.0.0/...`.
3. Run `tools/New-PackManifest.ps1` with the same base URL and semantic version.
4. Publish `manifest.json` at the stable channel URL only after every payload file is available.
5. Configure `launcher-settings.json`, publish a self-contained signed Windows build, then wrap it with MSIX or Inno Setup.

Changing a file means publishing a new version and manifest. Rollback means repointing the stable manifest to an older valid release. A later production milestone should add an Ed25519 signature over canonical manifest bytes so a compromised file host cannot replace both payloads and hashes.

## Authentication prerequisite

Register a Microsoft Entra public/native client supporting personal Microsoft accounts and the `http://localhost` redirect. Put only the public Client ID in settings; never create or ship a client secret. The application ID may also require Minecraft API allowlisting. Until that registration is complete, authentication intentionally fails with a configuration message.
