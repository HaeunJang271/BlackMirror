# 검은 저울: 자정의 소환실 (BLACK SCALE)

오컬트 심리전 × 덱빌딩 배수 로그라이트 웹 프로토타입 (Phase 1)

## 실행

```bash
npm install
npm run dev
npm test
```

## 광고 부활 설정

토스 콘솔에서 발급한 보상형 광고 그룹 ID를 `.env.local`에 설정한 뒤 빌드하세요.

```env
VITE_TOSS_REWARDED_AD_ID=발급받은_광고_그룹_ID
```

일반 브라우저에서는 광고 대신 1.5초 테스트 시뮬레이션이 실행됩니다. 실제 광고는 앱인토스 환경에서 확인해야 합니다.

## Phase 1 범위

- `useReducer` 순수 상태 머신 (`TITLE` → `STAGE_INTRO` → `PLAYER_TURN` → `REWARD` → `VICTORY` / `GAME_OVER`)
- 의식 카드 6종 · 유물 6종 · 계약자 3명 데이터 연결
- Vitest 단위 테스트 (콤보 / 부러진 초침 / 피의 서약×젖은 성냥갑 / 소금의 원)
- 모바일 세로 1화면 UI (책상·황동·촛불·핏빛 팔레트)

## 스택

Vite + React + TypeScript + Tailwind CSS v4 + Framer Motion
