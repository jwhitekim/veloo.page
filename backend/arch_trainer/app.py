"""논문 아키텍처 설명력 훈련 앱 — FastAPI 백엔드"""
import asyncio
import base64
import json
import logging
import os
import re
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

load_dotenv(Path(__file__).parent.parent.parent / ".env")

app = FastAPI(title="논문 아키텍처 설명력 훈련")
client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

MODEL = os.environ.get("CLAUDE_MODEL_SMART", "claude-sonnet-4-6")
_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

_supabase_url = os.environ.get("SUPABASE_URL")
_supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
_supabase = None
if _supabase_url and _supabase_key:
    from supabase import create_client
    _supabase = create_client(_supabase_url, _supabase_key)

EXPLAIN_PROMPT = """\
이 논문 아키텍처 그림을 분석해줘.

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "overview": "이 모델이 무엇을 하는 시스템인지 한두 문장으로",
  "modules": "각 모듈의 이름, 역할, 작동 방식을 기술적으로 정확하게 서술. 탭 사용 금지, 불릿 사용 금지, 의문문으로 작성",
  "data_flow": "입력이 각 단계를 거치며 어떻게 변환되어 출력까지 가는지 서술",
  "contribution": "기존 방법과 다른 이 논문의 핵심 기여가 무엇인지 서술"
}"""

FEEDBACK_PROMPT = """\
사용자가 아키텍처를 이렇게 설명했어:
<user_explanation>
{user_explanation}
</user_explanation>

실제 아키텍처 분석은 이거야:
<ai_explanation>
{ai_explanation}
</ai_explanation>

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "correct": "사용자가 맞게 짚은 핵심 개념",
  "missing": "놓쳤거나 잘못 이해한 부분",
  "suggestion": "개선 내용을 더 정확하게 표현하는 방법"
}}"""


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    return json.loads(cleaned)


class FeedbackRequest(BaseModel):
    ai_explanation: dict
    user_explanation: str
    history_id: int | None = None


@app.post("/api/explain")
async def explain(image: UploadFile = File(...)):
    media_type = image.content_type or "image/png"
    if media_type not in _ALLOWED_IMAGE_TYPES:
        return JSONResponse({"error": "지원하지 않는 이미지 형식입니다. (jpeg/png/gif/webp만 허용)"}, status_code=400)

    raw = await image.read()
    if len(raw) > 10 * 1024 * 1024:
        return JSONResponse({"error": "이미지가 너무 큽니다 (최대 10MB)"}, status_code=400)

    b64 = base64.standard_b64encode(raw).decode()

    try:
        msg = await client.messages.create(
            model=MODEL,
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": b64,
                            },
                        },
                        {"type": "text", "text": EXPLAIN_PROMPT},
                    ],
                }
            ],
        )
        explanation_json = _parse_json(msg.content[0].text)
    except Exception:
        logging.exception("arch_trainer error")
        return JSONResponse({"error": "서버 오류가 발생했습니다."}, status_code=500)

    history_id = None
    if _supabase:
        try:
            res = await asyncio.to_thread(
                lambda: _supabase.table("arch_history").insert({
                    "image_name": image.filename,
                    "explanation": explanation_json,
                }).execute()
            )
            if res.data:
                history_id = res.data[0]["id"]
        except Exception:
            pass

    return JSONResponse({"explanation": explanation_json, "history_id": history_id})


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    try:
        msg = await client.messages.create(
            model=MODEL,
            max_tokens=800,
            messages=[
                {
                    "role": "user",
                    "content": FEEDBACK_PROMPT.format(
                        user_explanation=req.user_explanation.replace("<", "&lt;").replace(">", "&gt;"),
                        ai_explanation=json.dumps(req.ai_explanation, ensure_ascii=False, indent=2),
                    ),
                }
            ],
        )
        feedback_json = _parse_json(msg.content[0].text)
    except Exception:
        logging.exception("arch_trainer error")
        return JSONResponse({"error": "서버 오류가 발생했습니다."}, status_code=500)

    if _supabase and req.history_id:
        try:
            await asyncio.to_thread(
                lambda: _supabase.table("arch_history")
                    .update({"feedback": feedback_json})
                    .eq("id", req.history_id)
                    .execute()
            )
        except Exception:
            pass

    return JSONResponse({"feedback": feedback_json})


@app.get("/api/history")
async def get_arch_history(count: bool = False):
    if not _supabase:
        return JSONResponse({"count": 0} if count else {"items": []})
    try:
        if count:
            res = await asyncio.to_thread(
                lambda: _supabase.table("arch_history").select("id", count="exact").execute()
            )
            return JSONResponse({"count": res.count or 0})
        res = await asyncio.to_thread(
            lambda: _supabase.table("arch_history")
                .select("id,image_name,explanation,created_at")
                .order("created_at", desc=True)
                .limit(5)
                .execute()
        )
        return JSONResponse({"items": res.data})
    except Exception:
        return JSONResponse({"count": 0} if count else {"items": []})
