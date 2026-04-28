"""
Lab Toolkit — 연구실 도구 모음 허브
각 서브앱을 importlib으로 독립 로드 후 FastAPI에 mount.
"""
import sys
import os
import importlib.util

# 각 서브 프로젝트 루트를 sys.path에 추가 (서브앱 내부 상대 import 지원)
BASE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(BASE, "paper-analyzer"))
sys.path.insert(0, os.path.join(BASE, "translator"))
sys.path.insert(0, os.path.join(BASE, "arch-trainer"))
sys.path.insert(0, os.path.join(BASE, "todo"))

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

def _load_module(label: str, file_path: str):
    """파일 경로로 모듈을 독립 로드 (모듈명 충돌 방지)."""
    pkg_dir = os.path.dirname(file_path)
    if pkg_dir not in sys.path:
        sys.path.insert(0, pkg_dir)
    spec = importlib.util.spec_from_file_location(label, file_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[label] = mod
    spec.loader.exec_module(mod)
    return mod


# ── 서브앱 로드 ──────────────────────────────────────────────────────

# paper-analyzer: FastAPI, app = FastAPI(title="Paper Analyzer")
_paper = _load_module(
    "paper_main",
    os.path.join(BASE, "paper-analyzer", "main.py"),
)
paper_app = _paper.app

# translator: FastAPI, app = FastAPI(title="Translation Studio")
_translate = _load_module(
    "translate_main",
    os.path.join(BASE, "translator", "main.py"),
)
translate_app = _translate.app

# arch-trainer: FastAPI, app = FastAPI(title="논문 아키텍처 설명력 훈련")
_arch = _load_module(
    "arch_main",
    os.path.join(BASE, "arch-trainer", "main.py"),
)
arch_app = _arch.app

# todo: FastAPI, app = FastAPI(title="Research Todo API")
_todo = _load_module(
    "todo_main",
    os.path.join(BASE, "todo", "main.py"),
)
todo_app = _todo.app

# ── 메인 앱 ────────────────────────────────────────────────────────

app = FastAPI(title="Lab Toolkit")

# "/" 를 catch-all 보다 먼저 등록해야 sub-app의 /{full_path:path}에 잡히지 않음
@app.get("/")
async def home():
    return FileResponse(os.path.join(BASE, "static", "home.html"))

app.mount("/static", StaticFiles(directory=os.path.join(BASE, "static")), name="static")
app.mount("/paper", paper_app)
app.mount("/translate", translate_app)
app.mount("/arch-trainer", arch_app)
app.mount("/todo", todo_app)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 9000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
