# Lab Toolkit — Root CLAUDE.md

## 프로젝트 개요
가천대 PRML Lab 연구실 도구 허브.
FastAPI 루트(main.py)가 4개 서브앱을 마운트하는 SPA 구조.

## 아키텍처
```
[React Frontend (TypeScript)] → frontend/dist/ (정적 서빙)
[FastAPI Root — main.py]
    ├── /paper        → backend/paper_analyzer/
    ├── /translate    → backend/translator/
    ├── /arch-trainer → backend/arch_trainer/
    └── /todo         → backend/todo/
```

## 기술 스택
- Backend: Python 3.11, FastAPI 0.115, Uvicorn, Pydantic v2
- Frontend: TypeScript, React (Vite 빌드 → frontend/dist/)
- AI: Anthropic SDK (claude-sonnet-4-20250514 고정)
- DB: Supabase (todo 모듈 전용)
- 배포: Docker + Fly.io (region: nrt / Tokyo)

## 환경변수 목록 (fly secrets set 으로 관리)
| 변수명            | 사용 모듈         |
|------------------|------------------|
| ANTHROPIC_API_KEY | 전 모듈          |
| SUPABASE_URL      | todo             |
| SUPABASE_KEY      | todo (anon key)  |
| S2_API_KEY        | paper_analyzer   |

## 공통 코드 규칙
- 환경변수 하드코딩 절대 금지
- 각 서브앱은 FastAPI() 인스턴스로 독립 선언 후 main.py에서 mount
- Pydantic v2 문법 사용 (v1 문법 혼용 금지)
- 임시 파일은 /tmp 에 저장, 요청 종료 시 삭제

## 빌드 & 실행
```bash
# 백엔드
pip install -r requirements.txt
python main.py

# 프론트엔드
cd frontend && npm install && npm run build

# Docker
docker build -t lab-toolkit .
docker run -p 9000:9000 --env-file .env lab-toolkit
```

## 서브에이전트 위임 규칙
복수 모듈에 걸친 작업은 Task 도구로 병렬 처리하라.
- paper_analyzer 작업 → backend/paper_analyzer/CLAUDE.md 먼저 읽을 것
- translator 작업     → backend/translator/CLAUDE.md 먼저 읽을 것
- arch_trainer 작업   → backend/arch_trainer/CLAUDE.md 먼저 읽을 것
- todo 작업           → backend/todo/CLAUDE.md 먼저 읽을 것
- 두 모듈 이상 동시 수정 요청 → 각각 별도 Task로 분리해서 병렬 실행

## 자기 갱신 규칙
- 새 모듈/파일 추가 시: 해당 디렉토리의 CLAUDE.md 갱신
- 환경변수 추가 시: 이 파일의 환경변수 목록에 추가
- API 엔드포인트 변경 시: 관련 CLAUDE.md에 반영
- 갱신 시 기존 형식 유지, 변경된 항목만 수정할 것