"""veloo — 연구실 도구 모음 허브"""
import logging
import os
import secrets
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import bcrypt as _bcrypt
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from supabase import create_client, Client

from backend.paper_analyzer import app as paper_app
from backend.translator import app as translate_app
from backend.arch_trainer import app as arch_app
from backend.todo import app as todo_app

BASE = os.path.dirname(__file__)
DIST = os.path.join(BASE, "frontend", "dist")

def _hash_pw(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify_pw(password: str, hashed: str) -> bool:
    return _bcrypt.checkpw(password.encode(), hashed.encode())


_supabase: Client | None = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
        _supabase = create_client(url, key)
    return _supabase


# IP별 로그인 실패 횟수 (메모리, 재시작 시 초기화)
_login_attempts: dict[str, list[datetime]] = defaultdict(list)
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

_API_PREFIXES = ("/paper/", "/translate/", "/arch-trainer/", "/todo/")
_OPEN_PATHS = {"/login", "/logout", "/register", "/api/me", "/favicon.svg"}


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    return forwarded.split(",")[0].strip() if forwarded else (
        request.client.host if request.client else "unknown"
    )


def _is_rate_limited(ip: str) -> bool:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=LOCKOUT_MINUTES)
    _login_attempts[ip] = [t for t in _login_attempts[ip] if t > cutoff]
    return len(_login_attempts[ip]) >= MAX_ATTEMPTS


def _record_failure(ip: str) -> None:
    _login_attempts[ip].append(datetime.now(timezone.utc))


def _clear_attempts(ip: str) -> None:
    _login_attempts.pop(ip, None)


def _secure_cookie(request: Request) -> bool:
    configured = os.getenv("SECURE_COOKIE")
    if configured is not None:
        return configured.lower() not in {"0", "false", "no"}
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    return request.url.scheme == "https" or forwarded_proto.split(",")[0].strip() == "https"


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in _OPEN_PATHS or path.startswith("/assets/"):
            return await call_next(request)

        token = request.cookies.get("access_token")
        if token:
            result = (
                get_supabase()
                .table("sessions")
                .select("expires_at")
                .eq("token", token)
                .execute()
            )
            if result.data:
                expires_at = datetime.fromisoformat(result.data[0]["expires_at"])
                if expires_at > datetime.now(timezone.utc):
                    return await call_next(request)
                get_supabase().table("sessions").delete().eq("token", token).execute()

        if any(path.startswith(p) for p in _API_PREFIXES):
            return JSONResponse(
                {"error": "세션이 만료됐습니다. 다시 로그인해주세요."}, status_code=401
            )
        return RedirectResponse(url="/login")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not os.getenv("SUPABASE_URL"):
        logging.warning(
            "SUPABASE_URL이 설정되지 않았습니다. 인증이 정상 동작하지 않을 수 있습니다."
        )
    yield


app = FastAPI(title="Lab Toolkit", lifespan=lifespan)
app.add_middleware(AuthMiddleware)


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/register")
async def register(req: RegisterRequest):
    db = get_supabase()
    existing = (
        db.table("users")
        .select("id")
        .eq("username", req.username)
        .execute()
    )
    if existing.data:
        return JSONResponse({"error": "이미 사용 중인 사용자명입니다."}, status_code=409)
    pw_hash = _hash_pw(req.password)
    db.table("users").insert({
        "username": req.username,
        "password_hash": pw_hash,
        "is_approved": False,
    }).execute()
    return {"ok": True, "message": "승인 대기 중입니다."}


@app.post("/login")
async def login(req: LoginRequest, request: Request):
    ip = _get_ip(request)
    if _is_rate_limited(ip):
        return JSONResponse(
            {"error": "너무 많은 시도가 있었습니다. 15분 후 다시 시도해주세요."},
            status_code=429,
        )

    db = get_supabase()
    result = (
        db.table("users")
        .select("id, password_hash, is_approved")
        .eq("username", req.username)
        .execute()
    )
    user = result.data[0] if result.data else None

    if not user or not _verify_pw(req.password, user["password_hash"]):
        _record_failure(ip)
        return JSONResponse(
            {"error": "사용자명 또는 비밀번호가 틀렸습니다."}, status_code=401
        )

    if not user["is_approved"]:
        return JSONResponse({"error": "승인 대기 중입니다."}, status_code=403)

    _clear_attempts(ip)
    token = secrets.token_hex(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    db.table("sessions").insert({
        "user_id": user["id"],
        "token": token,
        "expires_at": expires_at,
    }).execute()

    response = JSONResponse({"ok": True})
    is_secure = _secure_cookie(request)
    response.set_cookie(
        "access_token", token,
        httponly=True, samesite="lax", max_age=60 * 60 * 24 * 30, secure=is_secure,
    )
    return response


@app.delete("/logout")
async def logout(request: Request):
    token = request.cookies.get("access_token")
    if token:
        get_supabase().table("sessions").delete().eq("token", token).execute()
    response = JSONResponse({"ok": True})
    response.delete_cookie("access_token", samesite="lax", secure=_secure_cookie(request))
    return response


@app.get("/api/me")
async def me(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return JSONResponse({"error": "인증이 필요합니다."}, status_code=401)

    db = get_supabase()
    session_result = (
        db.table("sessions")
        .select("user_id, expires_at")
        .eq("token", token)
        .execute()
    )
    session = session_result.data[0] if session_result.data else None
    if not session:
        return JSONResponse({"error": "세션이 만료됐습니다."}, status_code=401)

    if datetime.fromisoformat(session["expires_at"]) <= datetime.now(timezone.utc):
        db.table("sessions").delete().eq("token", token).execute()
        return JSONResponse({"error": "세션이 만료됐습니다."}, status_code=401)

    user_result = (
        db.table("users")
        .select("username")
        .eq("id", session["user_id"])
        .execute()
    )
    if not user_result.data:
        return JSONResponse({"error": "사용자를 찾을 수 없습니다."}, status_code=401)

    return {"ok": True, "username": user_result.data[0]["username"]}


app.mount("/paper", paper_app)
app.mount("/translate", translate_app)
app.mount("/arch-trainer", arch_app)
app.mount("/todo", todo_app)
app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")


@app.get("/favicon.svg")
async def favicon():
    return FileResponse(os.path.join(DIST, "favicon.svg"), media_type="image/svg+xml")


@app.get("/{full_path:path}")
async def spa(full_path: str):
    return FileResponse(os.path.join(DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 9000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
