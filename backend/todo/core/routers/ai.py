import json
import os
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from supabase import Client
import anthropic
from database import get_supabase
import schemas

router = APIRouter(prefix="/api/ai", tags=["ai"])

# ── Context Layer 1 + 2: Role & Rules
_STEPS_SYSTEM = """\
ROLE: Research task decomposer
DOMAIN: Academic research lab (AI/ML) — paper reading, experiment, coding, writing
REGISTER: Korean, concise, actionable

DECOMPOSE_RULES:
  - steps: 3~5개 (복잡도에 따라 조정, 단순 태스크는 3개)
  - granularity: 단일 집중 세션(30~90분)에 완료 가능한 단위
  - format: 동사+목적어 구체형 ("논문 읽기" X → "논문 2.1~3절 읽고 핵심 수식 메모" O)
  - order: 논리적 선후 관계 기준, 병렬 가능한 것은 묶기
  - avoid: 당연한 준비 단계 ("환경 설정 확인" 등 불필요한 단계 금지)

OUTPUT: JSON only — {"steps": ["...", "..."]}"""

# ── Context Layer 3: Few-shot
_STEPS_EXAMPLES = """\
EXAMPLE_1:
  input:  TODO="Transformer 논문 리뷰" / PRIORITY=high / DEADLINE=2일
  output: {"steps": [
    "Abstract~Introduction 읽고 연구 질문 한 줄 요약",
    "Architecture 섹션 읽고 Attention 수식 직접 유도",
    "Experiments 결과 표 분석 및 baseline 대비 수치 정리",
    "관련 선행 연구 2편과 차이점 비교 메모"
  ]}

EXAMPLE_2:
  input:  TODO="실험 코드 디버깅" / PRIORITY=urgent / DEADLINE=오늘
  output: {"steps": [
    "에러 로그 확인 후 원인 범위 특정",
    "최소 재현 코드 작성하여 원인 격리",
    "수정 후 단위 테스트 실행"
  ]}"""

# ── Context Layer 1 + 2: Strategy
_STRATEGY_SYSTEM = """\
ROLE: Research schedule advisor
DOMAIN: Academic research lab (AI/ML)
REGISTER: Korean, friendly, one sentence only

ADVICE_RULES:
  - length: 한 문장
  - focus: 다른 태스크와의 우선순위 관계 + 시작 시점 제안
  - tone: 친근하되 구체적 (날짜/시간대 언급 권장)
  - avoid: 일반적인 조언 ("열심히 하세요" 등 금지)

OUTPUT: 한 문장 텍스트만"""


def get_anthropic():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
    return anthropic.Anthropic(api_key=api_key)


@router.post("/generate-steps")
def generate_steps(req: schemas.GenerateStepsRequest):
    client = get_anthropic()
    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL_FAST", "claude-haiku-4-5-20251001"),
        max_tokens=512,
        system=f"{_STEPS_SYSTEM}\n\n{_STEPS_EXAMPLES}",
        messages=[{"role": "user", "content": (
            f"TODO: {req.todo_name}\n"
            f"MEMO: {req.memo or '없음'}\n"
            f"PRIORITY: {req.priority}\n"
            f"DEADLINE: {req.deadline or '미정'}"
        )}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {raw}")


def _write_steps_to_db(todo_id: int, steps: list[str], sb: Client) -> None:
    for i, step in enumerate(steps):
        sb.table("steps").insert({
            "todo_id": todo_id,
            "name":    step,
            "order_index": i,
            "done":    False,
        }).execute()


def _run_generate_steps(req: schemas.GenerateStepsRequest) -> None:
    sb = get_supabase()
    try:
        client = get_anthropic()
        message = client.messages.create(
            model=os.getenv("CLAUDE_MODEL_FAST", "claude-haiku-4-5-20251001"),
            max_tokens=512,
            system=f"{_STEPS_SYSTEM}\n\n{_STEPS_EXAMPLES}",
            messages=[{"role": "user", "content": (
                f"TODO: {req.todo_name}\n"
                f"MEMO: {req.memo or '없음'}\n"
                f"PRIORITY: {req.priority}\n"
                f"DEADLINE: {req.deadline or '미정'}"
            )}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        steps = json.loads(raw).get("steps", [])
        _write_steps_to_db(req.todo_id, steps, sb)
    except Exception:
        pass  # 백그라운드 실패는 무시 — 사용자는 수동으로 단계 추가 가능


@router.post("/generate-steps-async")
def generate_steps_async(
    req: schemas.GenerateStepsRequest,
    background_tasks: BackgroundTasks,
):
    if req.todo_id is None:
        raise HTTPException(status_code=422, detail="todo_id required for async generation")
    background_tasks.add_task(_run_generate_steps, req)
    return {"status": "generating"}


@router.post("/generate-strategy")
def generate_strategy(req: schemas.GenerateStrategyRequest, sb: Client = Depends(get_supabase)):
    client = get_anthropic()

    res = sb.table("todos").select("name").eq("id", req.todo_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Todo not found")
    target_name = res.data["name"]

    # 클라이언트 제공 데이터 대신 DB에서 직접 조회
    all_todos = sb.table("todos").select("name, priority, deadline, done").eq("done", False).execute()
    todos_text = "\n".join(
        f"- [{t['priority']}] {t['name']} (마감: {t.get('deadline') or '미정'})"
        for t in (all_todos.data or [])
    )

    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL_FAST", "claude-haiku-4-5-20251001"),
        max_tokens=256,
        system=_STRATEGY_SYSTEM,
        messages=[{"role": "user", "content": (
            f"ALL_TODOS:\n{todos_text}\n\n"
            f"TARGET: {target_name}"
        )}],
    )
    strategy = message.content[0].text.strip()

    sb.table("todos").update({"ai_strategy": strategy}).eq("id", req.todo_id).execute()

    updated = sb.table("todos").select("*, steps(*)").eq("id", req.todo_id).single().execute()
    todo = updated.data
    todo["steps"] = sorted(todo.get("steps") or [], key=lambda s: s["order_index"])
    return todo
