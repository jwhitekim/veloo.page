import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / ".env")

from fastapi import FastAPI, Form, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

_supabase_url = os.environ.get("SUPABASE_URL")
_supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
_supabase = None
if _supabase_url and _supabase_key:
    from supabase import create_client
    _supabase = create_client(_supabase_url, _supabase_key)

from core.semantic_scholar import (
    parse_url, fetch_paper_by_url,
    fetch_paper_by_id, search_papers_by_title, enrich_authors,
)
from core.claude_analyzer import analyze_paper
from core.journal_quality import lookup_venue

app = FastAPI(title="Paper Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/search")
async def search(query: str = Form(...)):
    try:
        query = query.strip()

        if query.startswith("http"):
            lookup_type, _ = parse_url(query)
            if lookup_type == "unknown":
                return JSONResponse({"type": "unsupported_url"})
            return JSONResponse({"type": "url", "query": query})

        # 제목 검색 → 후보 5개
        results = await asyncio.to_thread(search_papers_by_title, query, 5)
        candidates = [
            {
                "paperId": p.get("paperId"),
                "title": p.get("title"),
                "year": p.get("year"),
                "venue": p.get("venue"),
                "citationCount": p.get("citationCount"),
            }
            for p in results
        ]
        return JSONResponse({"type": "candidates", "data": candidates})
    except Exception:
        logging.exception("search error")
        return JSONResponse({"error": "서버 오류가 발생했습니다."}, status_code=500)


@app.post("/analyze")
async def analyze(paper_id: str = Form(None), url: str = Form(None)):
    try:
        if url:
            paper = await asyncio.to_thread(fetch_paper_by_url, url)
        elif paper_id:
            paper = await asyncio.to_thread(fetch_paper_by_id, paper_id)
        else:
            return JSONResponse({"error": "paper_id 또는 url이 필요합니다."})

        if not paper:
            return JSONResponse({"error": "논문을 찾을 수 없습니다."})

        external_ids = paper.get("externalIds") or {}
        basic = {
            "title": paper.get("title", ""),
            "year": paper.get("year"),
            "venue": paper.get("venue", ""),
            "doi": external_ids.get("DOI"),
            "arxivId": external_ids.get("ArXiv"),
            "citationCount": paper.get("citationCount"),
        }

        abstract = paper.get("abstract") or ""
        analysis = await asyncio.to_thread(analyze_paper, abstract, basic["title"], basic["doi"] or "")
        authors = await asyncio.to_thread(enrich_authors, paper)
        quality = lookup_venue(basic["venue"])

        if _supabase:
            try:
                _supabase.table("paper_analyses").insert({
                    "title": basic["title"],
                    "doi": basic["doi"],
                    "arxiv_id": basic["arxivId"],
                    "domain": analysis.get("domain"),
                    "keywords": analysis.get("keywords"),
                    "problem_short": analysis.get("problem_short"),
                    "method_short": analysis.get("method_short"),
                    "conclusion_short": analysis.get("conclusion_short"),
                    "full_result": analysis,
                    "source": "search",
                }).execute()
            except Exception:
                pass

        return JSONResponse({
            "basic": basic,
            "analysis": analysis,
            "authors": authors,
            "quality": quality,
        })

    except Exception:
        logging.exception("analyze error")
        return JSONResponse({"error": "서버 오류가 발생했습니다."}, status_code=500)


@app.post("/analyze-pdf")
async def analyze_pdf(file: UploadFile = File(...)):
    try:
        from core.pdf_extractor import extract_from_pdf

        if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
            return JSONResponse({"error": "PDF 파일만 지원합니다."}, status_code=400)

        pdf_bytes = await file.read()
        if len(pdf_bytes) > 50 * 1024 * 1024:
            return JSONResponse({"error": "파일이 너무 큽니다 (최대 50MB)."}, status_code=400)
        extracted = extract_from_pdf(pdf_bytes)

        title    = extracted.get("title", "")
        abstract = extracted.get("abstract", "")
        doi      = extracted.get("doi") or ""
        arxiv_id = extracted.get("arxivId")
        figures  = extracted.get("figures", [])

        # Try to enrich from Semantic Scholar
        paper = None
        venue = ""
        year = None
        citation_count = None
        authors = []

        if arxiv_id:
            try:
                paper = await asyncio.to_thread(fetch_paper_by_url, f"https://arxiv.org/abs/{arxiv_id}")
            except Exception:
                pass
        if not paper and doi:
            try:
                paper = await asyncio.to_thread(fetch_paper_by_url, f"https://doi.org/{doi}")
            except Exception:
                pass

        if paper:
            ext = paper.get("externalIds") or {}
            title         = paper.get("title") or title
            abstract      = paper.get("abstract") or abstract
            doi           = ext.get("DOI") or doi
            arxiv_id      = ext.get("ArXiv") or arxiv_id
            venue         = paper.get("venue", "")
            year          = paper.get("year")
            citation_count = paper.get("citationCount")
            authors       = await asyncio.to_thread(enrich_authors, paper)

        basic = {
            "title": title,
            "year": year,
            "venue": venue,
            "doi": doi or None,
            "arxivId": arxiv_id,
            "citationCount": citation_count,
        }

        analysis = await asyncio.to_thread(analyze_paper, abstract, title, doi)
        quality  = lookup_venue(venue)

        if _supabase:
            try:
                _supabase.table("paper_analyses").insert({
                    "title": title,
                    "doi": doi or None,
                    "arxiv_id": arxiv_id,
                    "domain": analysis.get("domain"),
                    "keywords": analysis.get("keywords"),
                    "problem_short": analysis.get("problem_short"),
                    "method_short": analysis.get("method_short"),
                    "conclusion_short": analysis.get("conclusion_short"),
                    "full_result": analysis,
                    "source": "pdf",
                }).execute()
            except Exception:
                pass

        return JSONResponse({
            "basic": basic,
            "analysis": analysis,
            "authors": authors,
            "quality": quality,
            "figures": figures,
        })

    except Exception:
        logging.exception("analyze-pdf error")
        return JSONResponse({"error": "서버 오류가 발생했습니다."}, status_code=500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
