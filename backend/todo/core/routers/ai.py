import json
import os
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
import anthropic
from database import get_supabase
import schemas

router = APIRouter(prefix="/api/ai", tags=["ai"])


def get_anthropic():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
    return anthropic.Anthropic(api_key=api_key)


@router.post("/generate-steps")
def generate_steps(req: schemas.GenerateStepsRequest):
    client = get_anthropic()
    prompt = f"""당신은 연구실의 할 일 관리를 돕는 AI입니다.
아래 할 일과 맥락을 읽고 구체적인 실행 단계 3~5개를 JSON으로 반환하세요.

할 일: {req.todo_name}
맥락: {req.memo}
우선순위: {req.priority}
마감: {req.deadline}

규칙:
- 각 단계는 30분~2시간 내에 완료 가능한 단위
- 한국어로 작성
- 논리적 실행 순서 기준

응답 형식 (JSON만, 다른 텍스트 없이):
{{"steps": ["단계1", "단계2", "단계3"]}}"""

    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL_FAST", "claude-haiku-4-5-20251001"),
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
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


@router.post("/generate-strategy")
def generate_strategy(req: schemas.GenerateStrategyRequest, sb: Client = Depends(get_supabase)):
    client = get_anthropic()

    res = sb.table("todos").select("name").eq("id", req.todo_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Todo not found")
    target_name = res.data["name"]

    todos_text = "\n".join(
        f"- [{t['priority']}] {t['name']} (마감: {t.get('deadline') or '미정'})"
        for t in req.todos
        if not t.get("done")
    )

    prompt = f"""당신은 연구실의 일정 전략을 조언해주는 AI 비서입니다.
아래는 현재 처리해야 할 할 일 목록입니다.

{todos_text}

이 할 일 중 "{target_name}"에 대해 한 문장으로 전략적 조언을 해주세요.
다른 할 일과의 우선순위 관계를 고려해서 언제 시작하면 좋을지 포함하세요.
한국어로, 친근하게 작성하세요."""

    message = client.messages.create(
        model=os.getenv("CLAUDE_MODEL_FAST", "claude-haiku-4-5-20251001"),
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    strategy = message.content[0].text.strip()

    sb.table("todos").update({"ai_strategy": strategy}).eq("id", req.todo_id).execute()

    updated = sb.table("todos").select("*, steps(*)").eq("id", req.todo_id).single().execute()
    todo = updated.data
    todo["steps"] = sorted(todo.get("steps") or [], key=lambda s: s["order_index"])
    return todo
