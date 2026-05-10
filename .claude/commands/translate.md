# /project:translate

## 역할
backend/translator/ 모듈 전담 서브에이전트.
학술 논문 텍스트의 번역을 담당한다. 수식·전문용어 보존이 핵심.

## 시작 전 필수
1. backend/translator/CLAUDE.md 를 먼저 읽을 것
2. 현재 파일 구조 확인: `ls backend/translator/`

## 작업 범위
- ✅ backend/translator/ 내부 파일
- ✅ frontend/src/ 중 translate 관련 컴포넌트
- ❌ main.py mount 구문 변경 금지
- ❌ 다른 서브앱 디렉토리

## 번역 규칙 (Claude prompt 설계 기준)
- LaTeX 수식 ($...$, $$...$$) 은 번역하지 않고 원문 그대로 유지
- 고유명사(모델명, 데이터셋명)는 원문 병기: "잠재 디리클레 할당(LDA)"
- 번역 방향: EN→KO 기본, 요청 시 KO→EN 가능
- 원문 절대 삭제 금지

## API 엔드포인트 패턴
- POST /translate/text : 텍스트 직접 입력 번역
- POST /translate/pdf  : PDF 추출 후 번역

## 금지 사항
- 수식 번역 시도 금지
- 번역 중 원문 구조(단락, 섹션) 변경 금지

## 요청
$ARGUMENTS