# Paper Analyzer Sub-agent

## 역할
PDF 논문을 파싱하고 Claude API로 구조화된 분석을 생성.

## 사용 라이브러리
- pymupdf: PDF 텍스트/페이지 추출
- beautifulsoup4: 웹에서 논문 메타데이터 스크래핑
- anthropic: 분석 결과 생성
- jinja2: 응답 템플릿 렌더링

## 핵심 기능 (수정 시 반드시 유지)
- PDF 업로드 → 텍스트 추출 → Claude 분석 → 구조화 응답
- 분석 항목: Abstract 요약, 연구 방법, 핵심 수식, 실험 결과, 한계점

## Claude API 호출 규칙
- model: claude-sonnet-4-20250514 고정
- system prompt에 "PRML 연구자 관점으로 분석" 명시
- 응답은 JSON 구조화 형식으로 요청

## 파일 처리 제약
- 최대 파일 크기: 50MB
- 지원 형식: .pdf 전용
- 임시 파일은 /tmp 에 저장 후 요청 종료 시 삭제