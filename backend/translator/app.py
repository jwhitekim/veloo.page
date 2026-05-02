"""Translation Studio — FastAPI + Claude API"""
import os
import time

import anthropic
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from pathlib import Path
from fastapi.responses import JSONResponse
from pydantic import BaseModel

load_dotenv(Path(__file__).parent.parent.parent / ".env")

app = FastAPI(title="Translation Studio")

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL_FAST", "claude-haiku-4-5-20251001")
_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

_LONG_PROMPT = """\
다음 영어 문장을 논문·연구 맥락에 맞는 자연스러운 한국어 학술 문체로 번역하세요.
번역문만 출력하세요.

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

    msg = _client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": _LONG_PROMPT.format(text=text)}],
    )
    translation = msg.content[0].text.strip()
    return JSONResponse({"translation": translation})


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
