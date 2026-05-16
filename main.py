"""Lab Toolkit — 연구실 도구 모음 허브"""
import logging
import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware

from backend.paper_analyzer import app as paper_app
from backend.translator import app as translate_app
from backend.arch_trainer import app as arch_app
from backend.todo import app as todo_app

BASE = os.path.dirname(__file__)
DIST = os.path.join(BASE, "frontend", "dist")

ACCESS_PASSWORD = os.environ.get("ACCESS_PASSWORD")

# 유효 세션 토큰 저장소 (메모리, 재시작 시 초기화)
_sessions: set[str] = set()


_API_PREFIXES = ("/paper/", "/translate/", "/arch-trainer/", "/todo/")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not ACCESS_PASSWORD:
            return await call_next(request)
        path = request.url.path
        if path == "/login" or path.startswith("/assets/"):
            return await call_next(request)
        if request.cookies.get("access_token") in _sessions:
            return await call_next(request)
        # API 경로: redirect 대신 401 JSON 반환 (fetch redirect 오동작 방지)
        if any(path.startswith(p) for p in _API_PREFIXES):
            return JSONResponse({"error": "세션이 만료됐습니다. 다시 로그인해주세요."}, status_code=401)
        return RedirectResponse(url="/login")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not ACCESS_PASSWORD:
        logging.warning(
            "ACCESS_PASSWORD가 설정되지 않았습니다. "
            "인증이 비활성화된 상태로 실행됩니다. "
            "프로덕션 환경에서는 반드시 설정하세요."
        )
    yield


app = FastAPI(title="Lab Toolkit", lifespan=lifespan)
app.add_middleware(AuthMiddleware)


class LoginRequest(BaseModel):
    password: str


@app.post("/login")
async def login(req: LoginRequest):
    if ACCESS_PASSWORD and req.password != ACCESS_PASSWORD:
        return JSONResponse({"error": "비밀번호가 틀렸습니다."}, status_code=401)
    token = secrets.token_hex(32)
    _sessions.add(token)
    response = JSONResponse({"ok": True})
    response.set_cookie(
        "access_token", token,
        httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30, secure=True,
    )
    return response


app.mount("/paper", paper_app)
app.mount("/translate", translate_app)
app.mount("/arch-trainer", arch_app)
app.mount("/todo", todo_app)
app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")


@app.get("/{full_path:path}")
async def spa(full_path: str):
    return FileResponse(os.path.join(DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 9000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
