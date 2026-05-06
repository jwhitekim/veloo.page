"""Translation Studio — FastAPI + Claude API"""
import os
import time

import anthropic
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from pathlib import Path
from pydantic import BaseModel

load_dotenv(Path(__file__).parent.parent.parent / ".env")

app = FastAPI(title="Translation Studio")

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL_SMART", "claude-sonnet-4-6")

_LONG_PROMPT = """\
다음 영어 텍스트를 한국어 AI·머신러닝 학술 논문 문체로 번역하세요.

규칙:
- attention, embedding, fine-tuning, transformer 등 관용적으로 영어를 유지하는 AI 용어는 영어 원문 그대로 두거나 괄호로 병기 (예: 어텐션(attention))
- 수식, 변수명, 고유명사는 번역하지 말 것
- 문장 구조를 지나치게 직역하지 말고 자연스러운 한국어 흐름으로
- 번역문만 출력

{text}"""

_NAVER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer":    "https://en.dict.naver.com/",
    "Accept":     "application/json",
}


class TranslateRequest(BaseModel):
    text: str


@app.post("/api/translate")
def translate(req: TranslateRequest):
    text = req.text.strip()
    if not text:
        return JSONResponse({"error": "텍스트가 비어 있습니다."}, status_code=400)

    def stream():
        with _client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            messages=[{"role": "user", "content": _LONG_PROMPT.format(text=text)}],
        ) as s:
            for chunk in s.text_stream:
                yield chunk

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8")


@app.get("/api/naver-dict")
def naver_dict(query: str = ""):
    query = query.strip()
    if not query:
        return JSONResponse({"results": []}, status_code=400)

    params = {
        "query":             query,
        "m":                 "pc",
        "shouldSearchVlive": "true",
        "lang":              "ko",
        "hid":               str(int(time.time() * 1000)),
    }
    resp = requests.get(
        "https://en.dict.naver.com/api3/enko/search",
        params=params,
        headers=_NAVER_HEADERS,
        timeout=5,
    )
    data = resp.json()

    word_section = (
        data.get("searchResultMap", {})
            .get("searchResultListMap", {})
            .get("WORD", {})
            .get("items", [])
    )

    def strip_tags(s: str) -> str:
        return s.replace("<strong>", "").replace("</strong>", "")

    results = []
    for item in word_section[:3]:
        entry = strip_tags(item.get("expEntry", ""))
        pron_list = item.get("searchPhoneticSymbolList", [])
        phonetic = pron_list[0].get("symbolValue", "") if pron_list else ""

        senses = []
        for collector in item.get("meansCollector", []):
            pos = collector.get("partOfSpeech", "")
            for mean in collector.get("means", []):
                senses.append({
                    "pos":          pos,
                    "value":        mean.get("value", ""),
                    "exampleOri":   strip_tags(mean.get("exampleOri", "")),
                    "exampleTrans": mean.get("exampleTrans", ""),
                })

        results.append({"entry": entry, "phonetic": phonetic, "senses": senses})

    return JSONResponse({"query": query, "results": results})


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
