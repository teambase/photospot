# 사진 스팟 추천 앱 — 기획서 (PRD)

작성일: 2026-07-20 (최종 업데이트: 2026-07-23)
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
| 지오펜싱 푸시 알림 (3.3) | ✅ 로직 구현, Firestore 실데이터 기준 회귀 확인 완료(권한 관련 버그 수정 포함) — 실기기 배터리 테스트만 남음 |
| 바람 조언 (3.5, 신규) | ✅ 구현 — 원 PRD에 없던 기능, 개발 중 추가 |
| 실데이터 연동 (기상청/천문연구원/에어코리아) | ✅ **완료** — 3개 API 전부 실제 응답으로 검증, 지도·추천·상세 화면이 `data/mockWeather.ts`(삭제됨) 대신 실시간 데이터 사용. TourAPI만 아직 미연동 |
| 지도 SDK 선택 | ✅ 확정 — 네이버 지도 |
| 백엔드 | ✅ **완료** — Firebase 프로젝트(`photospot-1d9e6`) 생성·연결 완료, Firestore `spots` 컬렉션 운영 중 |
| 관리시스템(어드민) | ✅ **완료** — `admin/` 로그인·승인/반려·**일괄 승인**(체크박스 선택) 전부 실동작 확인 |
| 스팟 발굴 소스 | ✅ 확정 및 **실행 완료** — `collector/`로 data.go.kr 전국관광지정보표준데이터 50건을 `pending`으로 적재, 재실행 시 중복 방지(멱등) 확인 |
| 스팟 노출 승인 워크플로우 | ✅ **완료** — RN 앱이 `data/mockSpots.ts`(삭제됨) 대신 Firestore를 직접 쿼리(`lib/spotsRepo.ts` + TanStack Query), 승인된 스팟만 지도·추천·지오펜싱에 노출됨을 시뮬레이터로 확인 |
| 전국 스팟 확장 | 🟡 진행 중 — 수기 31곳(승인됨) + data.go.kr 50건(대기중, 일부 승인 테스트됨). 나머지 약 800건은 미수집 |
| 실 서비스(프로덕션) 배포 | ⬜ **계획 단계** — 착수는 보류, 배포 대상만 정리 중 (10장 참고) |

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

### 3.6 스팟 데이터 파이프라인 & 관리자 승인 ✅ 완료(End-to-End 검증됨) *(개발 중 추가)*
스팟을 "자동 수집 → 관리자 검토 → 승인" 3단계로 관리한다. 자동 수집만으로 앱에 바로 노출하지 않고, **관리자가 승인한 스팟만 지도·추천 리스트에 노출**되도록 한다.

- **수집**: data.go.kr 전국 표준데이터셋(5. 데이터 소스 참고)에서 후보 스팟을 가져와 `status: 'pending'`으로 DB에 저장 — ✅ `collector/`(Node, Firebase Admin SDK) 완료. 이름·소개문구 키워드로 테마를 추정(`guessThemes.ts`)하며, 좌표 검증·중복 방지(멱등) 적용. 최초 실행으로 50건 적재 확인
- **검토/승인**: 관리시스템(백오피스)에서 관리자가 후보를 확인 후 `approved` 또는 `rejected`로 전환 — ✅ `admin/`(Vite+React+Firebase Auth/Firestore) 완료. 구글 로그인(이메일 allowlist), 승인 대기/승인됨/반려됨 탭, **체크박스로 여러 건을 한 번에 승인하는 일괄 승인** 기능까지 포함
- **노출**: 앱(지도 3.1, 추천 3.2, 지오펜싱 3.3 등록 대상)은 `status: 'approved'`인 스팟만 조회 — ✅ `lib/spotsRepo.ts`(Firestore 쿼리) + `lib/spotsQueries.ts`(TanStack Query 훅)로 전환 완료. `data/mockSpots.ts`는 삭제됨
- 사용자 제보(UGC)와는 다른 개념이다 — UGC는 4장에서 여전히 v1 범위 밖이며, 이 파이프라인은 관리자가 공공데이터를 큐레이션하는 반자동 프로세스다

**운영 중 발견/수정한 버그**: data.go.kr 수집분 중 테마 키워드가 안 걸린 스팟(`themes: []`)을 승인하면 지도 마커가 `themes[0]`을 바로 참조하다 크래시 — `constants/themes.ts`에 `getPrimaryThemeMeta()`(빈 배열이면 "미분류" 아이콘으로 대체)를 추가해 방어 처리함.

남은 일: data.go.kr 나머지 약 800건 추가 수집 여부 결정, 실기기 지오펜싱 검증(8장 로드맵 8번). 6. 기술 스택, 7. 데이터 모델, 8. 로드맵, 10. 실 서비스 전환 계획 참고.

## 4. MVP 제외 기능 (v2 이후 고려)

- 사용자 제보(UGC) 스팟 등록/공유, 커뮤니티 기능
- 사진 업로드 및 갤러리
- 다국어/해외 지역 확장
- 구독/유료 모델

## 5. 데이터 소스

**스팟 발굴(신규 항목):**

| 목적 | 소스 | 비고 | 연동 상태 |
|---|---|---|---|
| 스팟 후보 1차 수집 | data.go.kr 전국 표준데이터셋 — 전국관광지정보표준데이터(연동), 전국문화축제표준데이터·전국공공미술및조형물정보표준데이터(미연동) | 지자체가 의무 제출하는 동일 스키마 데이터라 지자체별 포털을 따로 돌 필요 없이 data.go.kr 한 곳에서 전국분을 수집 가능. "포토존" 전용 데이터는 드물어 관광지/문화재 데이터에서 간접적으로 후보를 골라내는 방식 | ✅ 전국관광지정보표준데이터 연동·실행 완료(`collector/`, 50건 pending 적재). 나머지 2개 데이터셋은 미연동 |
| 관광지·명소 보완 정보 | 한국관광공사 TourAPI | 표준데이터셋으로 못 채운 부분(설명·이미지 등)을 보완하는 2차 소스로 격하 | ⬜ 미연동 (`TOUR_API_KEY` 미발급) |

**날씨·천문(기존 항목, 변경 없음):**

| 목적 | 소스 | 비고 | 연동 상태 |
|---|---|---|---|
| 단기 날씨 (하늘상태, 강수, 구름량) | 기상청_단기예보 조회서비스 (getUltraSrtNcst/getVilageFcst) | 위경도 → 기상청 격자 변환(`lib/kmaGrid.ts`, 실측 검증됨) 후 조회 | ✅ 연동 완료 — `lib/kmaWeather.ts`, 실제 응답 검증됨 |
| 대기질 (미세먼지) | 한국환경공단_에어코리아_대기오염정보 (getCtprvnRltmMesureDnsty) | 시도 단위 조회, khaiGrade를 dustGrade로 매핑 | ✅ 연동 완료 — `lib/airKorea.ts`, 실제 응답 검증됨 |
| 일출·일몰·월출·월몰 | 한국천문연구원_출몰시각 정보 (getAreaRiseSetInfo) | XML 전용 API, location 파라미터는 시/도 단위 지역명 필요 | ✅ 연동 완료 — `lib/kasiAstro.ts`, 실제 응답 검증됨 |
| 달의 위상(월령) | (API 미사용) | 삭망월 공식 기반 순수 계산으로 대체 — 별도 API 신청 불필요 | ✅ 연동 완료 — `lib/astro.ts` |

4개 API 키(TourAPI 제외) 모두 발급·연동 완료. `lib/weatherRepo.ts`가 넷을 조합해 `WeatherSnapshot`으로 변환하고, `lib/weatherQueries.ts`(TanStack Query)를 통해 지도·추천·상세 화면과 지오펜싱 알림에서 실데이터를 사용한다. `data/mockWeather.ts`는 삭제됨.

## 6. 기술 스택 (확정)

제안 단계에서 아래와 같이 확정되어 구현되었다.

- 클라이언트: **React Native + Expo(프리빌드 방식)** + TypeScript, **Expo Router**(파일 기반 라우팅) — Flutter 대신 확정
- 상태 관리: **Zustand** (`store/mapFilterStore.ts`, `store/preferenceStore.ts`), 서버 상태: **TanStack Query** (의존성만 설치, 실 API 연동 전이라 아직 미사용)
- 백엔드: **Firebase(Firestore + Auth), 연결 완료.** Firestore로 스팟 DB, Firebase Auth(Google 로그인 + 이메일 allowlist)로 관리자 인증. RN 앱은 `firebase` JS SDK(RN에서는 `experimentalForceLongPolling` 필요 — `lib/firebase.ts`)로 Firestore를 직접 조회
- 관리시스템(어드민): **Vite + React SPA** (`admin/`), Firebase JS SDK로 Firestore 직접 호출 — 별도 백엔드 서버 없이 클라이언트에서 승인/반려·일괄 승인 처리. `firestore.rules`(저장소 루트)로 "앱은 approved만 읽기 / 어드민은 전체 읽기·쓰기" 접근 제어
- 수집 배치: **Node + firebase-admin** (`collector/`), 별도 패키지로 분리 — 서비스 계정 키로 Firestore에 직접 씀 (보안 규칙 우회, gitignore 처리됨)
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
5. 전국 스팟 확장, UI 폴리싱 🟡 **진행 중** — 아래 5-A/5-B 완료, 확장·폴리싱은 계속
   - 5-A. DB 도입 + 관리시스템(백오피스) 구축 — 스팟 CRUD, `pending/approved/rejected` 승인 큐, 일괄 승인 ✅ **완료**
   - 5-B. data.go.kr 표준데이터셋 수집 배치 구축 → `pending`으로 적재 → 관리자 승인 → 앱 노출 (3.6) ✅ **완료** (50건 적재 확인, 나머지 800여 건은 필요 시 재실행)
   - UI 폴리싱 예시: 평점 배지를 스팟 상세/바텀시트 우측 상단으로 재배치 완료 (좌측 테마 칩과 균형)

**진행 순서 (2026-07-23 기준):**
1. ~~백엔드/DB 기술 선택~~ ✅ Firebase로 확정 및 연결 완료
2. ~~Spot 데이터 모델에 status/source 반영~~ ✅ 완료
3. ~~관리시스템 최소 기능(목록·승인·반려·일괄 승인)~~ ✅ 완료, 실동작 검증됨
4. ~~data.go.kr 수집 배치 작성~~ ✅ 완료, 50건 pending 적재 확인
5. ~~앱 데이터 소스를 mock → Firestore로 전환~~ ✅ 완료, 시뮬레이터에서 실데이터 렌더링 확인
6. ~~지오펜싱 등록 로직이 Firestore 기준으로 동작하는지 회귀 확인~~ ✅ 완료 — 시뮬레이터에서 설정 화면이 실제 승인 스팟 수(11곳)를 정확히 계산함을 확인. 이 과정에서 버그 발견·수정: `notificationEnabled`가 실제 권한 요청 없이 기본값 `true`였던 탓에 동기화 버튼이 권한 체크 없이 `startGeofencingAsync`를 호출해 `DeniedBackgroundLocationPermission`으로 크래시 — 기본값을 `false`로 바꾸고 `handleSync`에 권한 확인·에러 처리 추가
7. ~~기상청/천문연구원/에어코리아 API 연동~~ ✅ **완료** — 3개 API 전부 발급·연동·실데이터 검증 완료 (아래 상세)
8. 실기기 지오펜싱 배터리·정확도 테스트 ⬜ 시뮬레이터는 백그라운드 위치 권한 플로우를 완전히 재현하기 어려워, 사용자가 아이폰에 직접 설치해 진행 예정 — 애플 개발자 프로그램 가입·승인 대기 중
9. **(신규)** 실 서비스(프로덕션) 배포 — 10장 참고. **착수 보류, 계획만 지속 수립**

**7번 진행 중 발견·해결한 이슈 2가지:**
- React Native(Hermes)엔 `URLSearchParams`가 기본 제공되지 않아 세 API 클라이언트가 조용히 실패하고 있었음 — `lib/queryString.ts`(직접 구현한 쿼리스트링 빌더)로 교체해 해결
- `app.config.ts`의 `extra`에 새 필드(API 키)를 추가해도 Metro 재시작(`expo start`)만으론 반영 안 됨 — 네이티브 Constants manifest는 `expo run:ios`(전체 재빌드) 시점에만 갱신된다는 걸 확인, 재빌드로 해결

## 9. 미해결 이슈 (2026-07-23 기준)

- ~~지도 SDK 선택 (Google vs Naver)~~ → **해결**: 네이버 지도로 확정, `NAVER_MAP_CLIENT_ID` 발급·연동 완료
- ~~관리시스템(백오피스) 기술 스택 미정~~ → **해결**: Firebase + Vite React 어드민으로 확정·구현·검증 완료
- ~~기상청·천문연구원·에어코리아 API 미발급~~ → **해결**: 3개 전부 발급·연동·실데이터 검증 완료
- TourAPI(`TOUR_API_KEY`)는 아직 미발급 — 표준데이터셋으로 못 채운 설명·이미지 보완용이라 우선순위 낮음
- 지오펜싱 배터리 소모 이슈 — 로직 구현은 완료했으나 실제 기기 테스트로 임계치 조정은 아직 미실시 (애플 개발자 프로그램 승인 대기 중)
- **(신규)** 추천 화면에서 스팟 다수(현재 25곳)의 날씨를 병렬 조회하다 보니 전체 목록에 점수가 다 채워지기까지 체감상 수~십 초 걸림 — 스팟이 더 늘어나면 배치/우선순위 조회 같은 최적화 필요할 수 있음
- data.go.kr 전국 표준데이터셋은 "포토존" 전용이 아니라 관광지/축제/공공미술 데이터에서 간접 필터링해야 함 — 자동 수집 시 사진 명소와 무관한 항목이 다수 섞여 들어올 수 있어, 관리자 승인 단계에서 걸러내는 것을 전제로 설계됨(완전 자동 노출은 배제). 실제로 수집된 50건 중 테마 키워드가 안 걸린 항목들이 있어 관리자 검토가 실제로 필요함을 확인
- **(신규)** 전국 확장을 위해 data.go.kr 나머지 약 800건을 더 수집할지, 아니면 품질 위주로 소량만 유지할지 큐레이션 방침 결정 필요
- **(신규)** 실 서비스 전환 시점·범위 — 10장에 배포 대상만 정리해두고 착수는 보류 중. 법적 요건(위치기반서비스 이용약관, 개인정보처리방침), 앱스토어 계정, API 키 사용량 비용 등은 아직 검토 전

## 10. 실 서비스(프로덕션) 전환 계획 (계획 단계 — 착수 보류)

git(GitHub `teambase/photospot`)은 소스 보관용일 뿐, 실제로 서비스가 되려면 컴포넌트별로 별도 배포 대상이 필요하다. **지금은 아래 방향만 정해두고 실제 착수는 하지 않는다** — 이후 대화에서 결정이 바뀌거나 구체화되면 이 장을 계속 갱신한다.

### 10.1 실기기 테스트 배포 (앱스토어 출시 전, 개인 테스트용)

지금까지는 `expo run:ios`로 Mac에 연결된 상태에서만 실행해왔는데, 이 방식은 **Mac이 켜져 있고 Metro 서버가 떠 있어야만** 아이폰에서 앱이 동작한다 — 로컬 의존을 없애려는 목적과 맞지 않는다.

- **핵심 개념**: "프리뷰/프로덕션" 빌드로 만들면 JS 번들이 앱 바이너리 안에 통째로 포함되어, 설치 후에는 로컬 서버가 전혀 필요 없다. 지금 쓰는 개발 빌드(`expo run:ios`, dev client)만 Metro 서버 연결이 필요한 것이지, 빌드 자체의 한계는 아니다.
- **방법**: EAS Build(Expo 클라우드 빌드 서비스) → `internal distribution`(애드혹)으로 빌드하면 설치 링크/QR코드가 나오고, 이걸로 앱스토어 심사 없이 바로 아이폰에 설치할 수 있다. 빌드는 Expo 클라우드에서 진행되므로 Mac이 꺼져 있어도 무방하다(빌드 요청만 로컬/CI에서 트리거).
- **막히는 지점**: 실제 아이폰(시뮬레이터 아님)에 설치하려면 **Apple Developer Program(연 $99) 가입이 사실상 필수**다. 무료 Apple ID로도 로컬 Xcode를 통해 사이드로드는 가능하지만, 프로비저닝 프로파일이 7일마다 만료되어 매주 Mac에 다시 연결해 재설치해야 하므로 "로컬 의존 없애기"라는 목적에 어긋난다.
- **비교**:

| 방식 | 비용 | Mac 의존 | 설치 유효기간 |
|---|---|---|---|
| `expo run:ios` (로컬 개발 빌드) | 무료 | 매번 필요 | 계속 연결 필요 |
| 무료 Apple ID + Xcode 사이드로드 | 무료 | 7일마다 필요 | 7일 |
| **EAS Build(애드혹) + Apple Developer Program** | 연 $99 | 빌드 시에만(클라우드 진행 가능) | 최대 1년 |

- **권장**: 실기기에서 지속적으로 테스트하려면 Apple Developer Program 가입 + EAS Build 애드혹 배포가 맞다. 다만 이건 결제가 필요한 결정이라 사용자가 직접 판단할 것 — 착수 시점은 아직 미정.

### 10.2 정식 서비스 전환

| 컴포넌트 | 배포 대상(안) | 비고 |
|---|---|---|
| 모바일 앱 (`app/`, RN+Expo) | EAS Build/Submit → App Store·Google Play | 10.1의 Apple Developer Program 가입이 선행되면 그대로 정식 배포로 이어짐. 스토어 심사(백그라운드 위치 권한은 심사 까다로운 편) 필요 |
| 관리시스템 (`admin/`) | Firebase Hosting | 이미 같은 Firebase 프로젝트를 쓰므로 `firebase deploy` 한 번으로 연결 가능. Vercel/Netlify도 대안이지만 우선순위 낮음 |
| 수집 배치 (`collector/`) | Firebase Cloud Functions **예약(스케줄) 트리거** | 지금처럼 로컬에서 수동 실행하는 대신, 주기적으로 자동 수집되도록 전환. 원래 PRD(6장 초안)에서도 Cloud Functions로 공공데이터 배치 수집을 제안했었음 |
| 백엔드(Firestore/Auth) | 변경 없음 | 이미 Firebase 관리형 서비스라 별도 배포 불필요 |

**실 서비스 전환 시 추가로 검토해야 할 것** (2026-07-22 대화에서 논의, 아직 미착수):
- 법적/컴플라이언스: 위치기반서비스 이용약관, 개인정보처리방침, 위치정보사업자 신고 여부
- 보안: 현재 API 키가 클라이언트 `.env`에 직접 들어가는 구조 — 서버 프록시 없이 민감 키가 노출될 위험 점검
- 인프라 비용: 공공데이터 API 호출량 제한, 네이버 지도 SDK 상업 이용 요금제, Firebase 사용량 과금 구간
- 앱스토어 배포: 개발자 계정, 프라이버시 라벨/데이터 안전 섹션 작성, 심사 대응

**메모:** 이 장은 "계획을 지속적으로 세워두는" 용도다. 실제로 배포를 시작하기로 결정하면, 8장 로드맵에 구체적인 착수 단계로 옮긴다.
