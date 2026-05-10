# /project:frontend

## 역할
frontend/ 모듈 전담 서브에이전트.
React + TypeScript SPA 개발을 담당한다.

## 시작 전 필수
1. frontend/CLAUDE.md 를 먼저 읽을 것 (없으면 package.json 먼저 확인)
2. 현재 구조 확인: `ls frontend/src/`

## 작업 범위
- ✅ frontend/src/ 내부 파일 전체
- ✅ frontend/package.json (의존성 추가 시)
- ❌ frontend/dist/ 직접 수정 금지 (빌드 결과물)
- ❌ backend/ 디렉토리

## API 연동 규칙
- 백엔드 호출은 상대경로 사용 (/paper, /translate, /arch-trainer, /todo)
- 별도 baseURL 환경변수 불필요 (동일 origin 서빙)
- fetch 또는 axios 사용 시 에러 핸들링 필수

## 빌드 규칙
- 수정 후 반드시 `npm run build` 실행하여 dist/ 갱신
- TypeScript 타입 에러 0개 유지
- dist/ 폴더는 .gitignore 확인 후 커밋 여부 결정

## 요청
$ARGUMENTS