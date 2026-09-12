# 영무예다음 Minecraft Launcher — Helios rebuild

충북혁신도시 영무예다음 친구들을 위한 비상업적 Minecraft Java 서버 전용 런처입니다.

이 프로젝트는 [Helios Launcher](https://github.com/dscalzi/HeliosLauncher)와 [MRS Launcher](https://github.com/peunsu/MRSLauncher)를 기반으로 재구축했습니다. 원 저작권과 MIT 라이선스는 `LICENSE.txt`에 보존되어 있습니다.

## 목표 구성

- Minecraft Java 1.21.1
- NeoForge 21.1.249
- 서버 `heyodd.iptime.org`
- Microsoft 시스템 브라우저 로그인
- Java, 모드, 설정 및 셰이더 자동 설치/검사
- GitHub 기반 배포 매니페스트와 런처 자동 업데이트
- Windows x64 설치 프로그램

## 현재 상태

- 영무예다음 브랜드 및 데이터 폴더 분리 완료
- Microsoft Entra public client ID 적용 완료
- GitHub 업데이트 및 지원 주소 적용 완료
- 기존 영무예다음 배경 이미지 적용 완료
- 패키지 설치 및 ESLint 검사 완료
- NeoForge 21.1.249 배포 구성 및 필수 라이브러리 연결 완료
- Vanilla+ 모드, 설정, 셰이더 자동 설치 구성 완료
- 로그인 전 `로그인 없이 게임 파일 설치` 기능 완료
- EasyMagic 필수 의존성 Puzzles Lib 21.1.60 포함
- Windows x64 설치 프로그램 생성 확인

Minecraft Services에서 신규 앱 ID 승인이 완료되기 전에는 Microsoft 로그인 마지막 단계에서 HTTP 403이 발생할 수 있습니다.

## 개발 실행

Node.js 22가 권장됩니다.

```powershell
npm install
npm start
```

Windows 설치 파일은 `npm run dist:win`으로 만듭니다. 결과물은 `dist/HeyOdd-Launcher-Setup-<version>.exe`에 생성됩니다.

## 게임 팩 업데이트

런처 프로그램과 게임 팩은 별도로 버전을 관리합니다. 모드, 설정 또는 셰이더만 변경할 때는 런처 설치 파일을 다시 만들지 않습니다.

1. `distribution/pack-manifest.json`에 클라이언트 파일의 공식 다운로드 URL, SHA-256 및 크기를 반영합니다.
2. `packVersion`과 `tools/generate-heyodd-distribution.js`의 배포 버전을 올립니다.
3. 현재 Minecraft 설치를 기준으로 배포 목록을 다시 생성합니다.

```powershell
node tools/generate-heyodd-distribution.js "$env:APPDATA\.minecraft" distribution distribution/pack-manifest.json
npm run lint
```

검증된 변경을 GitHub `main` 브랜치에 올리면 기존 런처가 다음 실행 시 새 `distribution.json`을 읽고 변경된 파일만 다운로드합니다. 타사 모드 JAR는 저장소에 직접 복제하지 않고 CurseForge 또는 Modrinth의 공식 다운로드 URL을 사용합니다. 기존 사용자에게서 제거해야 하는 파일은 서버의 `cleanupFiles` 목록에 추가하면 다음 실행 전에 안전하게 정리됩니다.

## 사용자 설치 흐름

1. Windows 설치 프로그램으로 런처를 설치합니다.
2. Microsoft 승인이 완료되지 않았거나 로그인을 나중에 하려면 `로그인 없이 게임 파일 설치`를 누릅니다.
3. Java 21, Minecraft 1.21.1, NeoForge 21.1.249, 모드와 설정이 설치됩니다.
4. 실제 게임 실행에는 Minecraft Java Edition을 보유한 Microsoft 계정 로그인이 필요합니다.

## 개인정보

Microsoft 계정 비밀번호는 런처가 수집하거나 저장하지 않습니다. 인증 정보는 로그인 유지에 필요한 범위에서 사용자의 로컬 앱 데이터에 저장됩니다.
