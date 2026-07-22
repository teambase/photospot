# 포토스팟 어드민

`data.go.kr` 등에서 자동 수집된 스팟 후보를 관리자가 승인/반려하는 최소 기능 웹 대시보드. Vite + React + Firebase(Auth, Firestore) SPA — 별도 서버 없음.

## 1. Firebase 프로젝트 준비 (최초 1회, 콘솔에서 직접 진행)

1. https://console.firebase.google.com 접속 → **프로젝트 추가** → 이름 입력(예: `photospot`) → Google Analytics는 꺼도 무방
2. 왼쪽 메뉴 **Firestore Database** → 데이터베이스 만들기 → 프로덕션 모드 → 리전은 `asia-northeast3 (서울)` 권장
3. 왼쪽 메뉴 **Authentication** → 시작하기 → 로그인 방법 탭 → **Google** 제공업체 사용 설정
4. **프로젝트 설정(톱니바퀴) → 일반** → 하단 "내 앱" → `</>` (웹 앱) 아이콘 클릭 → 앱 닉네임 입력(예: `photospot-admin`) → Firebase Hosting 체크는 지금은 안 해도 됨 → 등록하면 나오는 `firebaseConfig` 값을 복사해둔다
5. **Firestore Database → 규칙** 탭 → 저장소 루트의 [`../firestore.rules`](../firestore.rules) 내용을 붙여넣고 게시. `you@example.com` 부분은 실제 관리자 구글 계정 이메일로 바꿀 것 (아래 `.env`의 `VITE_ADMIN_EMAILS`와 동일하게 유지)

## 2. 로컬 설정

```bash
cp .env.example .env   # 위에서 복사한 firebaseConfig 값과 관리자 이메일을 채운다
npm install
npm run dev
```

## 3. 데이터

`spots` 컬렉션의 문서를 그대로 읽고 쓴다 (`../types/spot.ts`의 `Spot` 타입과 동일 스키마 + `status`/`source` 필드). 아직 이 컬렉션에 데이터를 채우는 수집 배치·마이그레이션은 별도 작업으로 진행 예정이라, 지금은 대시보드가 비어 있는 게 정상이다.

## 4. 배포 (선택, 나중에)

Firebase Hosting에 올리려면 `firebase login` → `firebase init hosting`(이 폴더를 public 디렉터리로) → `npm run build && firebase deploy`. CLI 로그인은 브라우저 인증이 필요해 사용자가 직접 해야 한다.
