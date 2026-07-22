# 사진 스팟 추천 앱 — 기획서 (PRD)

작성일: 2026-07-20 (최종 업데이트: 2026-07-22)
작성자: Josh (개인 프로젝트)
용도: 클로드 코드(Claude Code) 개발 착수용 스펙 문서

---

## 0. 현재 개발 상태 (요약)

**Phase 1(스켈레톤) 완료.** React Native + Expo(Expo Router)로 앱 골격과 화면 4개(지도/추천/설정/스팟 상세)를 목업 데이터 기반으로 구현했고, GitHub(`teambase/photospot`)에 배포해 관리 중이다. iOS 로컬 빌드(`expo run:ios`) 및 시뮬레이터 실행 확인 완료.

| 항목 | 상태 |
|---|---|
| 지도 기반 스팟 탐색 (3.1) | ✅ 구현 (목업 스팟 31곳) |
| 조건 기반 추천 (3.2) | ✅ 구현 (규칙 기반 점수 로직 그대로 적용) |
| 카메라 세팅 조언 (3.4) | ✅ 구현 (규칙 테이블 + 룰 1개 추가) |
| 지오펜싱 푸시 알림 (3.3) | ✅ 로직 구현, 목업 스팟 기준 동작 확인 — 실기기 배터리 테스트 미실시 |
| 바람 조언 (3.5, 신규) | ✅ 구현 — 원 PRD에 없던 기능, 개발 중 추가 |
| 실데이터 연동 (기상청/천문연구원/TourAPI/에어코리아) | ⬜ 미착수 — 목업 데이터로 대체 중 |
| 지도 SDK 선택 | ✅ 확정 — 네이버 지도 |
| 백엔드 | ✅ 확정 — **Firebase (Firestore + Auth)**. 프로젝트는 신규 생성 필요(사용자 액션 대기), 연동 코드는 아직 mock 기준 |
| 관리시스템(어드민) | 🟡 코드 구현 완료(`admin/`, Vite+React+Firebase), 실제 Firebase 프로젝트 연결·데이터 이관 전이라 미검증 |
| 스팟 발굴 소스 | ✅ 확정 — data.go.kr 전국 표준데이터셋 우선 적용 (5. 데이터 소스 참고) |
| 스팟 노출 승인 워크플로우 | 🟡 앱 쪽 `status`/`source` 필드·`getApprovedSpots()` 필터링 반영 완료, 실제 DB 연동·어드민 승인 액션 검증은 미완 (3.6 참고) |
| 전국 스팟 확장 | ⬜ 서울/수도권 중심 31곳만 등록 |

---

## 1. 개요

날씨와 천문 데이터(일출·일몰·골든아워·달의 위상 등)를 기반으로, 사용자 주변의 사진 촬영 스팟을 테마별로 추천하고, 최적의 촬영 타이밍을 알려주는 모바일 앱. 기존 PhotoPills, Sun Surveyor류 앱이 "한 장소에서의 태양/달 계산"에 강점이 있다면, 본 앱은 "지금 조건에서 어디로 가면 좋은가"에 초점을 맞춘다.

핵심 차별점은 다음 세 가지다.

1. 날씨·천문 조건과 장소를 결합한 추천 (단순 정보 나열이 아님)
2. 스팟 반경 진입 시 실시간 조건 요약 푸시 알림 (지오펜싱)
3. 조건에 맞는 카메라 세팅을 규칙 기반으로 즉시 제안

## 2. 타겟 사용자 및 범위

- 대상: 국내(한국) 아마추어~세미프로 사진 애호가
- 서비스 지역: 한국 한정 (추후 확장 가능하도록 설계는 지역 비종속적으로)
- 플랫폼: 모바일 앱 (iOS, Android)
- 수익 모델: 없음 (개인 프로젝트, 광고/구독 없음)

## 3. MVP 핵심 기능

### 3.1 지도 기반 스팟 탐색 ✅ 구현됨
- 사용자 현재 위치 기준 주변 사진 스팟을 지도에 마커로 표시
- 마커 클릭 시 스팟 상세: 이름, 테마, 대표 사진, 오늘의 날씨·일몰(일출)시각·구름량 오버레이
- 테마 필터: 일몰/일출, 벚꽃, 단풍, 은하수/별, 야경, 안개 등

구현: `app/(tabs)/index.tsx`(지도 탭), `components/SpotMarker.tsx`, `components/SpotDetailSheet.tsx`(바텀시트), `components/ThemeChip.tsx`(테마 필터). 현재는 `data/mockSpots.ts`의 목업 스팟 31곳(서울/수도권 위주 + 지방 일부)으로 동작하며, 실데이터 연동 전까지 스팟 등록 자체는 하드코딩 상태다.

### 3.2 조건 기반 추천 ✅ 구현됨
- "오늘 저녁 노을 좋은 곳 반경 20km" 같은 조건부 리스트 뷰
- 추천 점수 로직(단순 규칙 기반, v1): 구름량 20~60%(노을에 유리), 강수 없음, 미세먼지 보통 이하 → 가중치 합산

구현: `app/(tabs)/recommend.tsx`, `lib/recommendation.ts`(`scoreWeather`) — 최초 설계한 점수 로직 그대로 구현됨. 반경/테마 필터는 `store/mapFilterStore.ts`(지도 필터)와 `store/preferenceStore.ts`(구독 테마)를 참조한다. 점수는 현재 목업 날씨(`data/mockWeather.ts`) 기준이라 실제 기상 조건과는 무관하다.

### 3.3 지오펜싱 푸시 알림 ✅ 로직 구현됨 (실기기 검증 전)
- 사용자가 등록 스팟 반경(기본 500m~1km, 조정 가능) 진입 시 푸시
- 알림 내용 예시: "여기는 OO 일몰 명소입니다. 오늘 일몰 19:24, 구름량 30%로 좋은 편입니다."
- 관심 테마 구독 시, 해당 테마 스팟만 알림 대상으로 필터링
- 기술 고려사항: iOS는 Region Monitoring API(동시 모니터링 지오펜스 20개 제한, CLLocationManager), Android는 Geofencing API(Google Play services location) 사용. 등록 스팟이 많을 경우 사용자 위치 기준 반경 내 상위 N개만 동적으로 지오펜스 등록/해제하는 전략 필요.

구현: `lib/geofencing.ts` — `expo-location` + `expo-task-manager` + `expo-notifications`로 백그라운드 태스크(`GEOFENCE_TASK`) 등록, iOS 20개 제한(`MAX_GEOFENCES`)을 상수로 반영해 상위 N개만 등록하는 전략까지 적용됨. 반경 기본값 500m, 알림 on/off는 `app/(tabs)/settings.tsx`에서 조정. 목업 스팟 기준으로 진입 시 알림 발송까지는 확인했으나, 실기기에서의 배터리 소모·정확도 테스트는 아직 미실시 (9. 미해결 이슈 참고).

### 3.4 카메라 세팅 조언 (규칙 기반) ✅ 구현됨
날씨/시간대/테마 조합에 따라 조리개·셔터스피드·ISO·화이트밸런스·기타 팁을 규칙 테이블로 제시.

예시 규칙:

| 조건 | 조리개 | 셔터스피드 | ISO | 비고 |
|---|---|---|---|---|
| 골든아워 + 역광 인물 | f/2.8~4 | 1/250 이상 | 100~400 | 노출보정 -0.7, RAW 권장 |
| 일몰/노을 풍경 | f/8~11 | 상황별(브라케팅 권장) | 100 | 삼각대 권장, HDR 고려 |
| 은하수/별 | 최대개방 | 15~20초 (500rule: 500÷화각환산초점거리) | 3200~6400 | 삼각대 필수, 신월 전후 추천 |
| 안개/흐린날 풍경 | f/8 | 상황별 | 100~200 | 화이트밸런스 다소 쿨하게 |
| 벚꽃/단풍 (맑음) | f/4~5.6 | 1/250 이상 | 100~200 | 역광 활용 시 -0.3~-0.7 보정 |
| 도심 야경 *(개발 중 추가)* | f/8 | 2~10초 | 100 | 삼각대 필수, 타이머·릴리즈 케이블로 흔들림 방지 |

v1은 규칙 테이블 기반으로 시작하고, 추후 사용자 촬영 데이터가 쌓이면 개선 여지 있음(딥러닝 기반은 범위 밖).

구현: `lib/cameraSettings.ts`(`getCameraSettings`) — 테마(`ThemeId`)별로 규칙을 매핑하며, 벚꽃/단풍은 목업 날씨의 `sky` 값이 맑음이 아니면 흐린날 규칙으로 자동 대체하는 조건 분기가 추가됨. 원 PRD에 없던 "야경" 테마 규칙(도심 야경)을 신규로 추가해 6개 테마 전체를 커버한다. UI는 `components/CameraSettingCard.tsx`, `app/spot/[id].tsx`에서 노출.

### 3.5 바람 조언 *(개발 중 추가, 원 PRD 범위 외)*
스팟 상세 화면에서 목업 풍속 데이터를 기준으로 촬영 유의사항(장노출 적합 여부, 꽃잎/잎 흔들림, 삼각대 무게추 등)을 한 줄 텍스트로 제공한다.

구현: `lib/windAdvice.ts`(`getWindTip`), `app/spot/[id].tsx`에서 사용. 풍속(`windSpeedMs`) 구간별 4단계 조언이며, 데이터 소스는 아직 목업(`WeatherSnapshot.windSpeedMs`)이라 기상청 API 연동 시 실데이터로 교체 필요.

### 3.6 스팟 데이터 파이프라인 & 관리자 승인 🟡 부분 구현 *(개발 중 추가)*
스팟을 "자동 수집 → 관리자 검토 → 승인" 3단계로 관리한다. 자동 수집만으로 앱에 바로 노출하지 않고, **관리자가 승인한 스팟만 지도·추천 리스트에 노출**되도록 한다.

- **수집**: data.go.kr 전국 표준데이터셋(5. 데이터 소스 참고)에서 후보 스팟을 가져와 `status: 'pending'`으로 DB에 저장 — ⬜ 미구현
- **검토/승인**: 관리시스템(백오피스)에서 관리자가 후보를 확인 후 `approved` 또는 `rejected`로 전환 — ✅ `admin/`(Vite+React+Firebase Auth/Firestore) 웹 대시보드 코드 구현 완료. 관리자는 구글 로그인(이메일 allowlist) 후 승인 대기/승인됨/반려됨 탭에서 상태를 전환
- **노출**: 앱(지도 3.1, 추천 3.2, 지오펜싱 3.3 등록 대상)은 `status: 'approved'`인 스팟만 조회 — ✅ `data/mockSpots.ts`의 `getApprovedSpots()`로 필터링 완료, 모든 화면이 이 함수를 거치도록 전환됨
- 사용자 제보(UGC)와는 다른 개념이다 — UGC는 4장에서 여전히 v1 범위 밖이며, 이 파이프라인은 관리자가 공공데이터를 큐레이션하는 반자동 프로세스다

현재 남은 일: (1) 실제 Firebase 프로젝트 생성 및 `admin/.env` 연결 — 사용자 액션 필요(구글 로그인 필요해 대행 불가, `admin/README.md`에 단계별 가이드 있음), (2) 앱 쪽을 `data/mockSpots.ts`에서 Firestore 쿼리로 전환, (3) data.go.kr 수집 배치 작성. 6. 기술 스택, 7. 데이터 모델, 8. 로드맵 참고.

## 4. MVP 제외 기능 (v2 이후 고려)

- 사용자 제보(UGC) 스팟 등록/공유, 커뮤니티 기능
- 사진 업로드 및 갤러리
- 다국어/해외 지역 확장
- 구독/유료 모델

## 5. 데이터 소스

**스팟 발굴(신규 항목):**

| 목적 | 소스 | 비고 | 연동 상태 |
|---|---|---|---|
| 스팟 후보 1차 수집 | data.go.kr 전국 표준데이터셋 — 전국관광지정보표준데이터, 전국문화축제표준데이터, 전국공공미술및조형물정보표준데이터 | 지자체가 의무 제출하는 동일 스키마 데이터라 지자체별 포털을 따로 돌 필요 없이 data.go.kr 한 곳에서 전국분을 수집 가능. "포토존" 전용 데이터는 드물어 관광지/문화재 데이터에서 간접적으로 후보를 골라내는 방식 | ⬜ 미연동 — API 키·수집 배치 모두 미구현. 수집 결과는 3.6에 따라 `pending` 상태로 저장 후 관리자 승인 필요 |
| 관광지·명소 보완 정보 | 한국관광공사 TourAPI | 표준데이터셋으로 못 채운 부분(설명·이미지 등)을 보완하는 2차 소스로 격하 | ⬜ 미연동 (`TOUR_API_KEY` 미발급) |

**날씨·천문(기존 항목, 변경 없음):**

| 목적 | 소스 | 비고 | 연동 상태 |
|---|---|---|---|
| 단기 날씨 (하늘상태, 강수, 구름량) | 기상청 API허브 (단기예보/초단기실황) | 격자 좌표 변환 필요 (위경도 → 기상청 격자) | ⬜ 미연동 (`KMA_API_KEY` 미발급) |
| 대기질 (미세먼지) | 에어코리아 대기질 정보 API | 원경 가시성 판단용 | ⬜ 미연동 (`AIRKOREA_API_KEY` 미발급) |
| 일출·일몰·월출·월몰·남중고도 | 한국천문연구원 특일정보/천문현상 API | 골든아워·블루아워 계산 핵심 소스 | ⬜ 미연동 (`KASI_API_KEY` 미발급) |

API 키 4종 모두 `.env.example`에 변수명은 정의해뒀으나(`README.md` 참고), 실제 발급·연동은 아직이라 `data/mockWeather.ts`·`data/mockSpots.ts`의 고정값으로 전체 화면을 구동 중이다. `lib/` 아래 서비스 레이어를 추가해 TanStack Query로 교체하는 것이 다음 단계.

## 6. 기술 스택 (확정)

제안 단계에서 아래와 같이 확정되어 구현되었다.

- 클라이언트: **React Native + Expo(프리빌드 방식)** + TypeScript, **Expo Router**(파일 기반 라우팅) — Flutter 대신 확정
- 상태 관리: **Zustand** (`store/mapFilterStore.ts`, `store/preferenceStore.ts`), 서버 상태: **TanStack Query** (의존성만 설치, 실 API 연동 전이라 아직 미사용)
- 백엔드: **Firebase(Firestore + Auth)로 확정.** Firestore로 스팟 DB, Firebase Auth(Google 로그인 + 이메일 allowlist)로 관리자 인증. 실제 Firebase 프로젝트는 아직 생성 전(구글 계정 로그인이 필요해 사용자가 직접 진행, `admin/README.md`에 단계별 가이드) — 그 전까지 앱은 `data/mockSpots.ts` 목업으로 동작
- 관리시스템(어드민): **Vite + React SPA** (`admin/`), Firebase JS SDK로 Firestore 직접 호출 — 별도 백엔드 서버 없이 클라이언트에서 승인/반려 처리. `firestore.rules`(저장소 루트)로 "앱은 approved만 읽기 / 어드민은 전체 읽기·쓰기" 접근 제어
- 지도: **네이버 지도 SDK** (`@mj-studio/react-native-naver-map`) — Google Maps 대신 국내 정확도 우선으로 확정
- 위치/지오펜싱: `expo-location` + `expo-task-manager` (iOS Region Monitoring / Android Geofencing을 Expo가 래핑)
- 알림: `expo-notifications` (현재는 로컬 알림만; 서버 푸시(FCM 등)는 백엔드 도입 후 검토)
- 바텀시트: `@gorhom/bottom-sheet`
- 네이티브 모듈을 포함하므로 **Expo Go 실행 불가** — `expo run:ios` / `expo run:android`로 로컬 개발 빌드 필요 (README 참고)

## 7. 데이터 모델 (구현 반영)

**Spot** (`types/spot.ts`)
- `id, name, lat, lng, themes: ThemeId[], description, bestTimeNote, azimuthNote?, region, images: string[], status: SpotStatus, source: SpotSource`
- `SpotStatus = 'pending' | 'approved' | 'rejected'`, `SpotSource = 'manual' | 'data-go-kr'` — 초안에 있던 `sourceType`이 이 형태로 부활. 앱은 `data/mockSpots.ts`의 `getApprovedSpots()`(=`status === 'approved'` 필터)로만 스팟을 조회하도록 전환 완료 — 지도(3.1)·추천(3.2)·지오펜싱 등록(3.3)·상세(spot/[id])·설정의 구독 스팟 계산까지 전부 이 함수를 거침. 목업 31곳은 전부 `status: 'approved', source: 'manual'`

**WeatherSnapshot** (`types/spot.ts`)
- `spotId, date, sky('맑음'|'구름많음'|'흐림'), precipitationChance, cloudCoverPercent, dustGrade('좋음'|'보통'|'나쁨'|'매우나쁨'), sunriseTime, sunsetTime, moonPhase, windSpeedMs, windDirection, updatedAt`
- 초안 대비 `windSpeedMs`/`windDirection`이 추가됨 — 3.5 바람 조언 기능을 위해 개발 중 도입

**CameraSetting** (`types/spot.ts`, 초안에는 없던 타입)
- `condition, aperture, shutterSpeed, iso, note` — 3.4 카메라 세팅 규칙 테이블을 코드 레벨 타입으로 구조화

**UserPreference** → `store/preferenceStore.ts`
- `subscribedThemes: ThemeId[], geofenceRadiusMeters, notificationEnabled` (초안의 `geofenceRadius`에서 단위 명시를 위해 `geofenceRadiusMeters`로 개명)

**MapFilterState** (`store/mapFilterStore.ts`, 초안에는 없던 상태)
- `activeThemes: ThemeId[]` — 지도 탭 전용 테마 필터. `UserPreference.subscribedThemes`(알림 구독)와는 별개 상태로 분리 구현됨

## 8. 개발 로드맵 (진행 현황)

1. ~~공공데이터 API 연동 확인~~ → **보류**, 스팟 DB 초기 구축(수도권 우선 파일럿) ✅, 지도에 마커 표시 ✅ *(1단계: API 연동만 미완료, 나머지 완료)*
2. ~~날씨/천문 데이터 오버레이~~ → **목업으로 대체 구현**, 조건 기반 추천 리스트 ✅ *(2단계: 사실상 완료, 데이터만 목업)*
3. 카메라 세팅 조언 규칙 엔진 ✅ **완료**
4. 지오펜싱 푸시 알림 ✅ **로직 완료** (실기기 검증 대기)
5. 전국 스팟 확장, UI 폴리싱 🟡 **진행 중** — 아래 5-A/5-B로 세분화
   - 5-A. DB 도입 + 관리시스템(백오피스) 구축 — 스팟 CRUD, `pending/approved/rejected` 승인 큐 🟡 코드 구현 완료(`admin/`), Firebase 프로젝트 생성·연결은 대기 중
   - 5-B. data.go.kr 표준데이터셋 수집 배치 구축 → `pending`으로 적재 → 관리자 승인 → 앱 노출 (3.6) ⬜ 미착수

**진행 순서 (2026-07-22 기준):**
1. ~~백엔드/DB 기술 선택~~ ✅ Firebase로 확정
2. ~~Spot 데이터 모델에 status/source 반영~~ ✅ 완료
3. 관리시스템 최소 기능(목록·승인·반려) ✅ 코드 구현 완료, 실제 Firebase 프로젝트 연결 전이라 미검증
4. data.go.kr 수집 배치 작성 ⬜ 다음 순서
5. 앱 데이터 소스를 mock → Firestore로 전환 ⬜ Firebase 프로젝트 생성 후 진행
6. 지오펜싱 등록 로직 회귀 확인 ⬜ 5번 이후
7. 기상청/천문연구원/에어코리아 API 연동 (병행 가능) ⬜
8. 실기기 지오펜싱 배터리·정확도 테스트 ⬜ 스팟 수가 늘어난 뒤가 의미 있음

**현재 블로커:** Firebase 프로젝트 생성은 구글 계정 로그인이 필요해 사용자가 직접 진행해야 함 (`admin/README.md` 1절 참고). 프로젝트 생성 후 `firebaseConfig` 값을 `admin/.env`에 채우면 4~5번으로 이어갈 수 있음.

## 9. 미해결 이슈 (2026-07-22 기준)

- ~~지도 SDK 선택 (Google vs Naver)~~ → **해결**: 네이버 지도로 확정, `NAVER_MAP_CLIENT_ID` 발급·연동 완료
- 기상청 API허브·천문연구원 API(`KMA_API_KEY`, `KASI_API_KEY`)는 아직 미발급 — 발급 전까지 날씨/일출일몰/월령은 전부 목업값(`data/mockWeather.ts`) 사용 중
- 에어코리아(`AIRKOREA_API_KEY`), TourAPI(`TOUR_API_KEY`)도 미발급 — 대기질 판단과 신규 스팟 발굴(전국 확장)이 이 키 발급에 걸려 있음
- 지오펜싱 배터리 소모 이슈 — 로직 구현은 완료했으나 실제 기기 테스트로 임계치 조정은 아직 미실시
- 스팟 데이터가 전부 수기 목업(31곳, 서울/수도권 중심)이라, 수집 파이프라인 연동 전까지는 등록 스팟 확장이 수작업에 의존
- **(신규)** 관리시스템(백오피스) 기술 스택 미정 — 백엔드(6장) 자체가 미정이라 승인 워크플로우를 어디에 둘지(Firebase Console+Firestore 규칙 vs 별도 어드민 웹앱 등)도 함께 결정 필요
- **(신규)** data.go.kr 전국 표준데이터셋은 "포토존" 전용이 아니라 관광지/축제/공공미술 데이터에서 간접 필터링해야 함 — 자동 수집 시 사진 명소와 무관한 항목이 다수 섞여 들어올 수 있어, 관리자 승인 단계에서 걸러내는 것을 전제로 설계됨 (완전 자동 노출은 애초에 배제)
