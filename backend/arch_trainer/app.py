"""논문 아키텍처 설명력 훈련 앱 — FastAPI 백엔드"""
import base64
import os
import uuid
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

load_dotenv(Path(__file__).parent.parent.parent / ".env")

app = FastAPI(title="논문 아키텍처 설명력 훈련")
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

MODEL = os.environ.get("CLAUDE_MODEL_SMART", "claude-sonnet-4-6")

# 서버 메모리 세션 저장소: {session_id: {"explanation": str}}
_sessions: dict[str, dict] = {}

EXPLAIN_PROMPT = """\
이 논문 아키텍처 그림을 보고 다음 네 가지를 설명해줘:

1. **전체 흐름** — 한두 문장으로, 이 모델이 뭘 하는 시스템인지
2. **각 모듈** — 모듈마다 이름과 역할을 비전공자도 이해할 수 있게
3. **데이터 흐름** — 입력이 어떻게 변환되며 출력까지 가는지
4. **핵심 아이디어** — 이 논문이 기존 방법과 다른 점이 뭔지

전문 용어는 반드시 직관적인 비유나 쉬운 말로 풀어줘. 마크다운 사용 가능."""

FEEDBACK_PROMPT = """\
사용자가 아키텍처를 이렇게 설명했어:
<user_explanation>
{user_explanation}
</user_explanation>

실제 아키텍처 설명은 이거야:
<ai_explanation>
{ai_explanation}
</ai_explanation>

다음 세 가지로 피드백해줘:
1. **잘 이해한 부분** — 맞게 짚은 핵심 개념
2. **틀리거나 빠진 부분** — 놓쳤거나 잘못 이해한 것
3. **더 정확한 표현** — 같은 내용을 어떻게 말하면 더 좋은지

너무 길지 않게, 핵심만 3-5줄로 짚어줘. 마크다운 사용 가능."""


class FeedbackRequest(BaseModel):
    session_id: str
    user_explanation: str


@app.post("/api/explain")
async def explain(image: UploadFile = File(...)):
    raw = await image.read()
    if len(raw) > 10 * 1024 * 1024:
        return JSONResponse({"error": "이미지가 너무 큽니다 (최대 10MB)"}, status_code=400)

    media_type = image.content_type or "image/png"
    b64 = base64.standard_b64encode(raw).decode()

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=1500,
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
        explanation = msg.content[0].text
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {"explanation": explanation}

    return JSONResponse({
        "session_id": session_id,
        "explanation": explanation,
    })


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다. 먼저 이미지를 업로드해주세요.")

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=800,
            messages=[
                {
                    "role": "user",
                    "content": FEEDBACK_PROMPT.format(
                        user_explanation=req.user_explanation,
                        ai_explanation=session["explanation"],
                    ),
                }
            ],
        )
        fb = msg.content[0].text
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    return JSONResponse({"feedback": fb})
