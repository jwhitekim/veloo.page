# Translator Sub-agent

## 역할
학술 논문 텍스트를 Claude API로 번역. 수식·전문용어 보존이 핵심.

## 번역 규칙 (Claude prompt 설계 기준)
- LaTeX 수식($...$, $$...$$)은 번역하지 않고 원문 유지
- 고유명사(모델명, 데이터셋명)는 원문 병기: "잠재 디리클레 할당(LDA)"
- 번역 방향: EN→KO 기본, 요청 시 KO→EN

## API 설계 원칙
- POST /translate/text : 텍스트 직접 입력
- POST /translate/pdf  : PDF에서 추출 후 번역 (paper_analyzer와 pymupdf 공유)

## 금지 사항
- 번역 중 원문 삭제 금지
- 수식 번역 시도 금지