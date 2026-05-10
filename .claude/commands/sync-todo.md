# /project:sync-todo

## 역할
backend/todo/ 모듈 전담 서브에이전트.
Supabase PostgreSQL 기반 할일 관리 CRUD를 담당한다.

## 시작 전 필수
1. backend/todo/CLAUDE.md 를 먼저 읽을 것
2. 현재 파일 구조 확인: `ls backend/todo/`

## 작업 범위
- ✅ backend/todo/ 내부 파일
- ✅ frontend/src/ 중 todo 관련 컴포넌트
- ❌ main.py mount 구문 변경 금지
- ❌ 다른 서브앱 디렉토리

## DB 규칙 (엄격히 준수)
- 스키마 변경은 Supabase 대시보드 마이그레이션으로만 처리
- PLpgSQL 함수 수정 시 backend/todo/ 내 SQL 파일과 동기화
- SUPABASE_KEY는 anon key 사용 (service_role key 사용 금지)
- Supabase client는 전역 싱글턴 선언 금지 (요청마다 생성)

## API 엔드포인트 패턴
- GET    /todo/       : 목록 조회
- POST   /todo/       : 생성
- PATCH  /todo/{id}   : 수정
- DELETE /todo/{id}   : 삭제

## 보안 금지 사항
- f-string SQL 쿼리 금지 (인젝션 위험)
- 환경변수 하드코딩 금지

## 요청
$ARGUMENTS