# 스팟 수집 배치

data.go.kr 공공데이터를 가져와 Firestore `spots` 컬렉션에 `status: 'pending'`으로 적재하는 1회성 Node 스크립트. 관리자는 `admin/` 웹 대시보드에서 승인/반려한다 (PRD 3.6 참고).

## 설정

1. **data.go.kr 인증키**: https://www.data.go.kr/data/15021141/standard.do → Open API 탭 → 활용신청 → 발급된 일반 인증키(디코딩 키)
2. **Firebase 서비스 계정 키**: Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → 다운로드한 JSON을 이 폴더에 `serviceAccountKey.json`으로 저장 (git에는 올라가지 않음)
3. `cp .env.example .env` 후 위 값들 채우기

## 실행

```bash
npm install
npm run collect:tourspot
```

`.env`의 `COLLECT_LIMIT`(기본 50)만큼만 가져온다. 전체(852건 안팎)를 가져오려면 `COLLECT_LIMIT`을 늘려서 재실행하면 되고, 이미 저장된 항목(id로 판별)은 건너뛰므로 여러 번 실행해도 중복되지 않는다.

## 한계

- 이 데이터셋엔 "사진 촬영 테마" 정보가 없어 이름·소개문구 키워드로 테마를 추정한다(`src/guessThemes.ts`) — 부정확할 수 있어 관리자 검토가 전제
- `bestTimeNote`는 소스 데이터에 없어 플레이스홀더로 채워짐 — 승인 전 관리자가 보정 필요(단, 현재 어드민 UI엔 메타데이터 수정 기능이 없어 승인/반려만 가능. 필요하면 추가 작업)
- 전국 관광지 데이터 특성상 사진 명소가 아닌 일반 관광지도 다수 섞여 있음 — 그래서 자동 승인이 아니라 pending으로만 적재함
