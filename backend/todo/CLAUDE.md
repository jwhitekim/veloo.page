# Todo Sub-agent

## 역할
Supabase PostgreSQL 기반 할일 관리 CRUD.

## DB 스키마 규칙
- 테이블 변경은 반드시 Supabase 대시보드의 마이그레이션으로 처리
- PLpgSQL 함수 수정 시 backend/todo/ 내 SQL 파일과 동기화 유지

## 환경변수 (필수)
- SUPABASE_URL
- SUPABASE_KEY (anon key 사용, service_role key 사용 금지)

## API 패턴
- GET    /todo/        : 목록 조회
- POST   /todo/        : 생성
- PATCH  /todo/{id}    : 수정
- DELETE /todo/{id}    : 삭제

## 금지 사항
- Supabase client를 전역 싱글턴으로 선언 금지 (요청마다 생성)
- 직접 SQL 인젝션 가능한 f-string 쿼리 금지