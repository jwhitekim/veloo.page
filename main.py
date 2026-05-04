"""Lab Toolkit — 연구실 도구 모음 허브"""
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not ACCESS_PASSWORD:
            return await call_next(request)
        path = request.url.path
        if path.startswith("/login") or path.startswith("/assets"):
            return await call_next(request)
        if request.cookies.get("access_token") == ACCESS_PASSWORD:
            return await call_next(request)
        return RedirectResponse(url="/login")


app = FastAPI(title="Lab Toolkit")
app.add_middleware(AuthMiddleware)


class LoginRequest(BaseModel):
    password: str


@app.post("/login")
async def login(req: LoginRequest):
    if not ACCESS_PASSWORD or req.password == ACCESS_PASSWORD:
        response = JSONResponse({"ok": True})
        response.set_cookie(
            "access_token", req.password,
            httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30,
        )
        return response
    return JSONResponse({"error": "비밀번호가 틀렸습니다."}, status_code=401)


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
