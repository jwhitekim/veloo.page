# Frontend Sub-agent

## 확인된 사항
- Framework: React + TypeScript (추정 — package.json 확인 후 갱신)
- Build tool: Vite (추정 — dist 디렉토리 구조 기준)
- 빌드 출력: frontend/dist/ (main.py에서 정적 서빙)
- 아키텍처: SPA — 모든 라우팅은 index.html로 fallback

## API 연동 규칙
- 백엔드 엔드포인트는 상대경로 사용 (/paper, /translate, /arch-trainer, /todo)
- 환경변수로 baseURL 분리 금지 — 동일 origin에서 서빙되므로 불필요

## 빌드 규칙
- 반드시 `npm run build` 후 Docker 빌드
- dist/ 폴더를 직접 수정 금지 — 빌드 결과물이므로 git에서도 제외

## 수정 금지 파일
- frontend/dist/ 내 모든 파일