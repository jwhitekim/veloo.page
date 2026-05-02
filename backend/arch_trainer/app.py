"""논문 아키텍처 설명력 훈련 앱 — FastAPI 백엔드"""
import base64
import json
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
        explanation_json = json.loads(msg.content[0].text)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {"explanation": explanation_json}

    return JSONResponse({
        "session_id": session_id,
        "explanation": explanation_json,
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
                        ai_explanation=json.dumps(session["explanation"], ensure_ascii=False, indent=2),
                    ),
                }
            ],
        )
        feedback_json = json.loads(msg.content[0].text)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    return JSONResponse({"feedback": feedback_json})
