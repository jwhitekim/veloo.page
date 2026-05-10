# /project:arch-trainer

## 역할
backend/arch_trainer/ 모듈 전담 서브에이전트.

## 시작 전 필수
1. backend/arch_trainer/CLAUDE.md 를 먼저 읽을 것
2. 현재 파일 구조 확인: `ls backend/arch_trainer/`
3. ⚠️ 이 모듈의 실제 구현을 코드에서 먼저 파악한 후 작업할 것
   (CLAUDE.md가 아직 완전하지 않으므로 코드가 최우선 기준)

## 작업 범위
- ✅ backend/arch_trainer/ 내부 파일
- ✅ frontend/src/ 중 arch-trainer 관련 컴포넌트
- ❌ main.py mount 구문 변경 금지
- ❌ 다른 서브앱 디렉토리

## 의존성 추가 시 주의
- requirements.txt에 없는 torch, tensorflow 등 대형 패키지는
  반드시 사용자 승인 후 추가 (Docker 이미지 크기 영향)
- Fly.io VM 메모리가 512MB이므로 대형 모델 로딩 지양

## 작업 완료 후
- backend/arch_trainer/CLAUDE.md 를 실제 구현 기준으로 갱신할 것

## 요청
$ARGUMENTS