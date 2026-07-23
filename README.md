# 포토스팟 (photospot)

날씨·천문 데이터 기반 사진 촬영 스팟 추천 앱. 기획서: [`사진스팟_앱_기획서_PRD.md`](./사진스팟_앱_기획서_PRD.md)

## 기술 스택

- React Native + Expo (프리빌드 방식, `expo run:ios` / `expo run:android`)
- TypeScript, Expo Router (파일 기반 라우팅)
- Zustand (상태 관리), TanStack Query (서버 상태 — API 연동 시 사용)
- 지도: [`@mj-studio/react-native-naver-map`](https://www.npmjs.com/package/@mj-studio/react-native-naver-map)
- 위치·지오펜싱: `expo-location` + `expo-task-manager`
- 로컬 알림: `expo-notifications`
- 바텀시트: `@gorhom/bottom-sheet`

## 시작하기

```bash
npm install
cp .env.example .env   # 아래 API 키를 채운 뒤
npm run ios            # 또는 npm run android
```

네이티브 모듈(네이버 지도, 지오펜싱)을 사용하므로 **Expo Go로는 실행할 수 없습니다.** `expo run:ios` / `expo run:android`로 로컬 개발 빌드를 생성해 실행하세요.

처음 실행하면 Xcode 시뮬레이터(또는 Android 에뮬레이터)가 자동으로 열리고 앱이 설치·실행됩니다. 코드를 수정한 뒤에는 대부분 시뮬레이터를 껐다 켤 필요 없이 자동으로 리로드됩니다(Metro 번들러가 떠 있는 동안). `app.config.ts`나 네이티브 설정을 바꾼 경우에만 `npm run ios`를 다시 실행하면 됩니다.

> macOS의 Ruby/CocoaPods가 로케일 설정에 따라 `pod install` 중 인코딩 에러를 내는 경우가 있어, `ios`/`android` 스크립트에 `LANG=en_US.UTF-8` 등 환경변수를 이미 넣어뒀습니다. 그래도 같은 에러가 나면 터미널을 껐다 켜보세요.

## 환경 변수 (`.env`)

| 변수 | 용도 | 발급처 |
|---|---|---|
| `NAVER_MAP_CLIENT_ID` | 지도 SDK 인증 | [네이버 클라우드 플랫폼](https://www.ncloud.com/) > AI·NAVER API > Maps |
| `KMA_API_KEY` | 단기예보/초단기실황 | 기상청 API허브 |
| `KASI_API_KEY` | 일출·일몰·월령 | 한국천문연구원 |
| `TOUR_API_KEY` | 관광지·명소 정보 | 한국관광공사 TourAPI |
| `AIRKOREA_API_KEY` | 대기질(미세먼지) | 에어코리아 |

`NAVER_MAP_CLIENT_ID`가 비어 있으면 지도 화면 상단에 경고 배너가 표시되고 지도가 빈 화면으로 나옵니다. 키를 넣은 뒤 `npm run ios`/`npm run android`를 다시 실행하세요 (네이티브 설정 변경이라 재빌드 필요).

## 현재 상태 (Phase 1 — 스켈레톤)

목업 데이터(`data/mockSpots.ts`, `data/mockWeather.ts`)로 전체 화면 구조를 완성한 상태입니다. 공공데이터 API 키가 발급되면 `lib/` 아래 서비스 레이어를 추가해 TanStack Query로 교체하면 됩니다.

- ✅ 지도 화면: 테마 필터, 스팟 마커, 상세 바텀시트
- ✅ 추천 리스트: 반경·테마 조건 필터, 점수 기반 정렬 (`lib/recommendation.ts`)
- ✅ 카메라 세팅 조언 규칙 엔진 (`lib/cameraSettings.ts`)
- ✅ 지오펜싱 등록/해제 로직 + 설정 화면 (`lib/geofencing.ts`) — 목업 스팟 기준으로 동작 확인 가능
- ⬜ 실데이터 연동 (기상청/천문연구원/TourAPI/에어코리아)
- ⬜ 전국 스팟 DB 확장

## 폴더 구조

```
app/                 Expo Router 화면
  (tabs)/             지도 · 추천 · 설정 탭
  spot/[id].tsx        스팟 상세 전체 화면
components/          재사용 UI 컴포넌트
constants/           컬러·타이포·테마 메타데이터
data/                목업 스팟/날씨 데이터
lib/                 추천 점수, 카메라 세팅, 지오펜싱, 거리 계산 로직
store/               Zustand 스토어
types/               공용 타입
admin/               스팟 승인 관리 웹 대시보드 (Vite + React + Firebase, 별도 앱 — admin/README.md 참고)
collector/           data.go.kr 공공데이터 수집 배치 (Node 스크립트, 별도 패키지 — collector/README.md 참고)
firestore.rules      Firebase Firestore 보안 규칙 (admin·collector·앱이 공유하는 Firebase 프로젝트에 적용)
```

## 디자인

블랙앤화이트 베이스 위에 테마(일몰·벚꽃·단풍·은하수·야경·안개) 아이콘에만 포인트 컬러를 적용했습니다. 팔레트는 `constants/colors.ts` 참고.
