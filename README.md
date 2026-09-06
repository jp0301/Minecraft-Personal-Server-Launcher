# 영무예다음 Minecraft Launcher

영무예다음 Minecraft 서버를 위한 비상업적 Windows 전용 런처입니다. 친구들이 복잡한 모드 설치 과정을 거치지 않고 정식 Microsoft/Minecraft 계정으로 로그인해 동일한 Vanilla+ 환경을 사용할 수 있도록 개발하고 있습니다.

이 프로젝트는 Mojang 또는 Microsoft의 공식 제품이 아니며, Minecraft를 소유한 정식 계정이 필요합니다.

## 현재 포함된 것

- Microsoft 시스템 브라우저를 통한 OAuth 로그인
- Mojang 게임 파일/Java/NeoForge 자동 설치 어댑터
- SHA-256/크기 검증, 임시 다운로드, 경로 이탈 방지 pack updater
- 친구의 게임 데이터와 바닐라 `.minecraft`를 분리한 전용 인스턴스
- 최초 한 번만 배치할 수 있는 `servers.dat` 지원
- pack manifest 생성 도구와 semantic version 기반 릴리스 구조

## 인증 및 개인정보

- 런처가 Microsoft 계정 비밀번호를 받거나 저장하지 않습니다.
- 로그인은 사용자의 기본 웹 브라우저와 Microsoft의 공식 로그인 페이지에서 처리됩니다.
- 인증 라이브러리의 로컬 보안 캐시는 로그인 유지에 필요한 토큰만 사용자 PC에 보관합니다.
- 텔레메트리, 광고 또는 사용자 추적 기능이 없습니다.
- 현재 Minecraft Services의 신규 앱 등록 검토를 요청하는 단계이며, 승인이 완료되기 전에는 Minecraft 프로필 인증이 `403 Forbidden`으로 제한될 수 있습니다.

자세한 내용은 [개인정보 처리방침](PRIVACY.md)과 [지원 안내](SUPPORT.md)를 확인해 주세요.

## 개발 실행

1. .NET 8 SDK를 설치합니다(런타임만으로는 빌드할 수 없습니다).
2. `src/HeyOddLauncher/launcher-settings.json`에 HTTPS manifest URL과 Microsoft Entra public client ID를 입력합니다.
3. `dotnet restore HeyOddLauncher.sln` 후 `dotnet run --project src/HeyOddLauncher/HeyOddLauncher.csproj`를 실행합니다.

개발 PC에서는 .NET 8 SDK를 사용합니다. 친구에게 전달하는 설치 프로그램은 .NET 런타임을 자체 포함합니다.

## 설치 프로그램 빌드

```powershell
dotnet publish src/HeyOddLauncher/HeyOddLauncher.csproj -c Release -r win-x64 --self-contained true -o publish -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true
iscc installer/HeyOddLauncher.iss
```

## 팩 만들기

완성된 클라이언트 폴더를 소스로 지정합니다.

```powershell
./tools/New-PackManifest.ps1 -Source "C:\path\to\clean-client" -BaseUrl "https://download.your-domain.example/heyodd" -Version "1.0.0"
```

서버 전용 모드는 클라이언트 pack에 그대로 복사하면 안 됩니다. 실제로 접속 검증을 마친 클라이언트 인스턴스가 기준본이어야 합니다. 자세한 배포 규칙은 `ARCHITECTURE.md`를 참고하세요.

## 프로젝트 상태

초기 MVP 개발 및 Microsoft/Minecraft 애플리케이션 검토 단계입니다. 공개 배포용 설치 파일은 검토와 접속 시험이 완료된 뒤 GitHub Releases를 통해 제공할 예정입니다.

## 상표 고지

Minecraft는 Microsoft 및 Mojang Studios의 상표입니다. 이 프로젝트는 Microsoft 또는 Mojang Studios와 제휴하거나 이들로부터 보증받지 않았습니다.
