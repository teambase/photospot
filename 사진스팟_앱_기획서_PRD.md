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
| 백엔드(Firebase 등) | ⬜ 미착수 — 로컬 상태(Zustand)만 사용 |
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

## 4. MVP 제외 기능 (v2 이후 고려)

- 사용자 제보(UGC) 스팟 등록/공유, 커뮤니티 기능
- 사진 업로드 및 갤러리
- 다국어/해외 지역 확장
- 구독/유료 모델

## 5. 데이터 소스

| 목적 | 소스 | 비고 | 연동 상태 |
|---|---|---|---|
| 관광지·명소 정보 | 한국관광공사 TourAPI | 카테고리 코드에서 사진촬영명소 유사 태그 활용, 지자체 공공데이터로 보완 | ⬜ 미연동 (`TOUR_API_KEY` 미발급, 스팟은 수기 목업) |
| 단기 날씨 (하늘상태, 강수, 구름량) | 기상청 API허브 (단기예보/초단기실황) | 격자 좌표 변환 필요 (위경도 → 기상청 격자) | ⬜ 미연동 (`KMA_API_KEY` 미발급) |
| 대기질 (미세먼지) | 에어코리아 대기질 정보 API | 원경 가시성 판단용 | ⬜ 미연동 (`AIRKOREA_API_KEY` 미발급) |
| 일출·일몰·월출·월몰·남중고도 | 한국천문연구원 특일정보/천문현상 API | 골든아워·블루아워 계산 핵심 소스 | ⬜ 미연동 (`KASI_API_KEY` 미발급) |

4개 API 키 모두 `.env.example`에 변수명은 정의해뒀으나(`README.md` 참고), 실제 발급·연동은 아직이라 `data/mockWeather.ts`의 고정값으로 전체 화면을 구동 중이다. `lib/` 아래 서비스 레이어를 추가해 TanStack Query로 교체하는 것이 다음 단계.

## 6. 기술 스택 (확정)

제안 단계에서 아래와 같이 확정되어 구현되었다.

- 클라이언트: **React Native + Expo(프리빌드 방식)** + TypeScript, **Expo Router**(파일 기반 라우팅) — Flutter 대신 확정
- 상태 관리: **Zustand** (`store/mapFilterStore.ts`, `store/preferenceStore.ts`), 서버 상태: **TanStack Query** (의존성만 설치, 실 API 연동 전이라 아직 미사용)
- 백엔드: **미착수.** Firebase 등 검토는 보류 상태 — 현재는 서버 없이 클라이언트 로컬 상태 + 목업 데이터로만 동작
- 지도: **네이버 지도 SDK** (`@mj-studio/react-native-naver-map`) — Google Maps 대신 국내 정확도 우선으로 확정
- 위치/지오펜싱: `expo-location` + `expo-task-manager` (iOS Region Monitoring / Android Geofencing을 Expo가 래핑)
- 알림: `expo-notifications` (현재는 로컬 알림만; 서버 푸시(FCM 등)는 백엔드 도입 후 검토)
- 바텀시트: `@gorhom/bottom-sheet`
- 네이티브 모듈을 포함하므로 **Expo Go 실행 불가** — `expo run:ios` / `expo run:android`로 로컬 개발 빌드 필요 (README 참고)

## 7. 데이터 모델 (구현 반영)

**Spot** (`types/spot.ts`)
- `id, name, lat, lng, themes: ThemeId[], description, bestTimeNote, azimuthNote?, region, images: string[]`
- 초안 대비 `sourceType` 필드는 아직 쓰이지 않아 제외, `region`(지역 태그) 필드가 추가됨

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
5. 전국 스팟 확장, UI 폴리싱 ⬜ **미착수**

**다음 단계 제안:** 1·2단계에 남은 실데이터 연동(기상청/천문연구원/에어코리아/TourAPI 키 발급 및 서비스 레이어 추가)을 마무리한 뒤, 5단계(전국 확장)로 넘어가는 순서를 권장.

## 9. 미해결 이슈 (2026-07-22 기준)

- ~~지도 SDK 선택 (Google vs Naver)~~ → **해결**: 네이버 지도로 확정, `NAVER_MAP_CLIENT_ID` 발급·연동 완료
- 기상청 API허브·천문연구원 API(`KMA_API_KEY`, `KASI_API_KEY`)는 아직 미발급 — 발급 전까지 날씨/일출일몰/월령은 전부 목업값(`data/mockWeather.ts`) 사용 중
- 에어코리아(`AIRKOREA_API_KEY`), TourAPI(`TOUR_API_KEY`)도 미발급 — 대기질 판단과 신규 스팟 발굴(전국 확장)이 이 키 발급에 걸려 있음
- 지오펜싱 배터리 소모 이슈 — 로직 구현은 완료했으나 실제 기기 테스트로 임계치 조정은 아직 미실시
- 스팟 데이터가 전부 수기 목업(31곳, 서울/수도권 중심)이라, TourAPI 연동 전까지는 등록 스팟 확장이 수작업에 의존
