#define AppName "영무예다음 Minecraft Launcher"
#define AppVersion "1.0.1"
#define AppExeName "HeyOdd Minecraft.exe"

[Setup]
AppId={{6C6FAB5B-FCDB-4372-A1D4-692DDDB7E598}
AppName={#AppName}
AppVersion={#AppVersion}
DefaultDirName={localappdata}\Programs\HeyOddMinecraftLauncher
DefaultGroupName={#AppName}
OutputDir=..\dist
OutputBaseFilename=영무예다음-Minecraft-Launcher-Setup-1.0.1
Compression=lzma2/max
SolidCompression=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
UninstallDisplayName={#AppName}
[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Tasks]
Name: "desktopicon"; Description: "바탕화면에 바로가기 만들기"; GroupDescription: "추가 작업:"; Flags: unchecked

[Files]
Source: "..\publish\*"; DestDir: "{app}"; Excludes: "*.pdb"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{#AppName} 실행"; Flags: nowait postinstall skipifsilent
