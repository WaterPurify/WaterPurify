# Coffee Bible MVP

집에서 핸드드립을 즐기는 사용자가 원두와 추출·시음 결과를 기록하고, 다음 추출에서 비교할 한 가지 조건을 제안받는 Android/iOS 앱입니다. 한국어 UI와 기기 내 저장을 기본으로 하며 계정, 서버, 외부 AI 없이 작동합니다.

## 이번 MVP에 구현된 기능

- 원두 등록·조회·수정·삭제와 원두 사진의 앱 저장소 보관
- 추출 전 레시피와 추출 후 시음 평가를 나눠 기록
- 평가를 비운 상태로 저장한 뒤 나중에 추가
- 최근 기록 목록, 상세 조회, 수정, 삭제
- 사용자가 적은 `다음에 원하는 맛`을 우선하는 규칙 기반 추천
- 한 번에 물양, 분쇄도, 수온 중 한 조건만 제안하고 변경 전후와 이유 표시
- 추천으로 새 기록을 만들 때 시음 평가는 복사하지 않고 출처 기록·추천 연결 정보 보존
- SQLite 기기 저장과 원두 스냅샷으로 과거 기록 보존
- 사진 권한 거부, 빈 평가, 잘못된 필수 수치에 대한 안내

회원가입, 결제, 지도, 음성 입력, 사진 자동 인식, 외부 AI, 커뮤니티는 이번 MVP에서 제외했습니다.

## VS Code + Docker로 시작하기

Docker Desktop과 VS Code의 **Dev Containers** 확장을 설치한 뒤 이 폴더를 열고, 명령 팔레트에서 `Dev Containers: Reopen in Container`를 실행합니다. 컨테이너 터미널에서 다음 명령을 실행합니다.

```bash
npm start
```

Dev Container를 쓰지 않고 Docker Compose만 사용할 수도 있습니다.

```bash
cp .env.example .env
# .env의 REACT_NATIVE_PACKAGER_HOSTNAME을 개발 PC의 같은 Wi-Fi IP로 변경
docker compose up --build
```

휴대폰에 Expo Go를 설치하고 터미널의 QR 코드를 읽으면 됩니다. 휴대폰과 개발 PC는 같은 네트워크에 있어야 합니다. Android 에뮬레이터는 `REACT_NATIVE_PACKAGER_HOSTNAME=10.0.2.2`, iOS 시뮬레이터는 `localhost`를 사용할 수 있습니다. iOS 시뮬레이터와 App Store용 네이티브 빌드는 macOS/Xcode가 필요하지만, 실제 iPhone의 Expo Go에서는 Windows나 Linux에서도 MVP를 확인할 수 있습니다.

로컬 Node.js 환경에서 실행하려면 다음 명령을 사용합니다.

```bash
npm ci
npm run android
# 또는 npm run ios / npm run web
```

정적 검사와 번들 검증은 다음과 같습니다.

```bash
npm run typecheck
npm run check
```

## 이번 주 개발 흐름

| 날 | 목표 | 확인할 결과 |
| --- | --- | --- |
| 1일차 | 프로젝트·Docker·화면 이동 | Android/iOS에서 모든 화면 진입 |
| 2일차 | 원두 CRUD와 사진 저장 | 앱 재실행 후 원두·사진 유지 |
| 3일차 | 추출·시음 기록 CRUD | 미평가 저장과 나중 평가 가능 |
| 4일차 | 규칙 추천과 새 기록 생성 | 변경 전후·이유·출처 연결 확인 |
| 5일차 | 실제 기기 점검과 입력 오류 보완 | 핵심 흐름을 Android와 iPhone에서 각각 1회 완주 |

## 4개월 로드맵

1개월차에는 개인용 MVP를 실제 기기에서 반복 사용하며 입력 부담, 누락 필드, 추천 규칙을 다듬습니다. 2개월차에는 검색·필터, 원두 재고, 데이터 내보내기와 접근성을 추가합니다. 3개월차에는 사용자가 원할 때만 켤 수 있는 계정·동기화 기반을 설계하고, 규칙 추천의 결과를 비교할 분석 화면을 만듭니다. 4개월차에는 베타 배포, 충돌·성능 관찰, 개인정보 안내, 스토어 심사 자료를 준비합니다. 외부 AI 추천은 충분한 실제 기록과 추천 품질 평가 기준이 생긴 뒤 별도 단계로 연결하는 편이 안전합니다.

## 데이터 설계

`beans`, `brews`, `recommendations`를 SQLite 테이블로 분리했습니다. 추출 기록에는 당시 원두 정보를 JSON 스냅샷으로 함께 저장하므로 원두를 나중에 수정하거나 삭제해도 과거 기록은 유지됩니다. 파생 기록은 `source_brew_id`와 `source_recommendation_id`로 출처를 남깁니다. 추천 규칙은 [src/recommendation.ts](src/recommendation.ts)에 분리되어 있어 이후 다른 추천 엔진으로 교체할 수 있습니다.

## 현재 검증 범위

이 개발 환경에서는 TypeScript 검사, Expo 웹 번들, Android/iOS JavaScript 번들, Docker 이미지 빌드를 검증합니다. 카메라 롤 권한, 앱 종료 후 사진·SQLite 유지, 키보드와 실제 화면 크기는 Android와 iPhone 실기기에서 이번 주 마지막 점검표에 따라 확인해야 합니다.
