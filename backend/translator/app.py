"""Translation Studio — FastAPI + Claude API"""
import json
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
_client = anthropic.AsyncAnthropic()

# Context Layer 1: Role & Domain
_SYSTEM_PROMPT = """\
ROLE: AI/ML academic translator (English → Korean)
DOMAIN: machine learning, deep learning, computer vision, NLP research papers
REGISTER: 한국어 학술 논문 문체 (formal academic Korean)"""

# Context Layer 2: Constraint Rules
_RULES = """\
PRESERVE_VERBATIM:
  - math: equations, variables, symbols  (∇L, θ, x_i ...)
  - identifiers: model names, dataset names, citation keys
  - code: function names, class names

PRESERVE_OR_BILINGUAL:
  - convention: attention→어텐션(attention) | embedding→임베딩(embedding)
  - keep_english: fine-tuning, transformer, encoder, decoder,
                  token, layer, weight, bias, gradient, loss,
                  batch, epoch, inference, prompt, dropout

STYLE:
  - flow: natural Korean, not word-for-word
  - structure: nominalization preferred (∼함, ∼됨, ∼임)
  - forbidden: 직역체, 번역체 문장

OUTPUT: translation only — no explanation, no prefix"""

# Context Layer 3: Few-shot examples
_EXAMPLES = """\
EXAMPLE_1:
  input:  "We propose a novel attention mechanism that..."
  output: "본 논문에서는 새로운 어텐션(attention) 메커니즘을 제안하며..."

EXAMPLE_2:
  input:  "The model is fine-tuned on downstream tasks using LoRA."
  output: "해당 모델은 LoRA를 활용하여 downstream 태스크에 fine-tuning된다."

EXAMPLE_3:
  input:  "Let x ∈ R^d be the input embedding."
  output: "x ∈ R^d를 입력 임베딩(input embedding)이라 하자." """

_NAVER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer":    "https://en.dict.naver.com/",
    "Accept":     "application/json",
}


def _strip_tags(s: str) -> str:
    return s.replace("<strong>", "").replace("</strong>", "")


def _extract_oxford_entry(data: dict) -> dict | None:
    try:
        exp_only = data["searchResultMap"]["searchResultListMap"]["THESAURUS"]["items"][0]["expOnly"]
        return json.loads(exp_only)
    except (KeyError, IndexError, json.JSONDecodeError):
        return None


def _parse_oxford_entry(raw: dict, data: dict, query: str) -> dict:
    # 발음기호는 WORD 섹션 items에 있음
    phonetic = ""
    try:
        for item in data["searchResultMap"]["searchResultListMap"]["WORD"]["items"]:
            phonetic = next(
                (s["symbolValue"] for s in item.get("searchPhoneticSymbolList", []) if s.get("symbolValue")),
                ""
            )
            if phonetic:
                break
    except (KeyError, IndexError):
        pass

    definitions = []
    examples = []
    for collector in raw.get("meansRevisionCollector", []):
        pos = collector.get("partOfSpeech", "")
        for mean in collector.get("means", []):
            if "all" not in mean.get("showLevelTab", []):
                continue
            definitions.append({
                "pos":   pos,
                "level": mean.get("meanLevel", ""),
                "value": _strip_tags(mean.get("value", "")),
            })
            ori = _strip_tags(mean.get("exampleOri", ""))
            if ori:
                examples.append({
                    "pos":   pos,
                    "ori":   ori,
                    "trans": _strip_tags(mean.get("exampleTrans", "")),
                })

    return {"query": query, "phonetic": phonetic, "definitions": definitions, "examples": examples}


class TranslateRequest(BaseModel):
    text: str


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    text = req.text.strip()
    if not text:
        return JSONResponse({"error": "텍스트가 비어 있습니다."}, status_code=400)

    async def stream():
        async with _client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            system=f"{_SYSTEM_PROMPT}\n\n{_RULES}",
            messages=[{"role": "user", "content": f"{_EXAMPLES}\n\nINPUT:\n{text}"}],
        ) as s:
            async for chunk in s.text_stream:
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

    raw = _extract_oxford_entry(data)
    if raw is None:
        return JSONResponse({"query": query, "phonetic": "", "definitions": [], "examples": []})

    result = _parse_oxford_entry(raw, data=data, query=query)
    return JSONResponse(result)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
