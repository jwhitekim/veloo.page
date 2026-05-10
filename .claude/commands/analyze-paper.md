# /project:analyze-paper

## 역할
backend/paper_analyzer/ 모듈 전담 서브에이전트.
논문 PDF 파싱, Semantic Scholar 연동, Claude 분석 기능을 담당한다.

## 시작 전 필수
1. backend/paper_analyzer/CLAUDE.md 를 먼저 읽을 것
2. 현재 파일 구조 확인: `ls backend/paper_analyzer/`

## 작업 범위 (엄격히 준수)
- ✅ backend/paper_analyzer/ 내부 파일
- ✅ requirements.txt (paper_analyzer 관련 의존성만)
- ✅ frontend/src/ 중 paper 관련 컴포넌트
- ❌ main.py mount 구문 (기존 /paper 경로 변경 금지)
- ❌ 다른 서브앱 디렉토리

## 핵심 의존성
- pymupdf: PDF 텍스트/페이지 추출
- beautifulsoup4: 웹 메타데이터 스크래핑
- anthropic: 논문 분석 생성 (claude-sonnet-4-20250514)
- S2_API_KEY: Semantic Scholar API 논문 검색

## Claude API 호출 규칙
- model: claude-sonnet-4-20250514 고정
- system prompt: "PRML 연구자 관점에서 분석하라" 포함
- 응답 형식: JSON 구조화 (abstract, method, equations, results, limitations)

## 파일 처리 제약
- 지원 형식: .pdf 전용
- 최대 크기: 50MB
- 임시 파일: /tmp 저장 → 요청 완료 후 삭제

## 요청
$ARGUMENTS