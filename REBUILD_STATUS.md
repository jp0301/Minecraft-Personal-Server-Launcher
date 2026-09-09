# 재구축 상태

## 완료

- MRS Launcher 3.0.9 계열 소스에서 독립 프로젝트 생성
- MRS 서버/CDN/Discord/Client ID 연결 제거
- 앱 이름, 설치 파일 이름, 데이터 경로와 GitHub 주소 변경
- 영무예다음 Microsoft Entra Client ID 적용
- 영무예다음 배경 이미지 이식
- npm 의존성 설치 및 정적 코드 검사 통과
- NeoForge 21.1.249 배포 매니페스트와 47개 라이브러리 연결
- Vanilla+ 모드, 설정, 셰이더 연결
- 로그인 없는 사전 설치 기능 구현
- Puzzles Lib 21.1.52를 서버/클라이언트 배포에 추가
- Windows x64 설치 프로그램 생성

## 다음 구현

1. 로그인 승인 후 실제 계정 실행 및 서버 자동 접속 시험
2. GitHub Release 자동 업데이트 검증

## 확인된 제약

Helios의 `ForgeHosted` 호환 모듈 구조에 NeoForge 설치 결과와 버전 매니페스트를 연결했습니다. Microsoft/Minecraft Services 앱 승인이 끝나기 전에는 로그인 마지막 단계에서 403이 발생할 수 있지만, 게임 파일 사전 설치는 로그인 없이 가능합니다.
