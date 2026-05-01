"""Lab Toolkit — 연구실 도구 모음 허브"""
import os

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.paper_analyzer import app as paper_app
from backend.translator import app as translate_app
from backend.arch_trainer import app as arch_app
from backend.todo import app as todo_app

BASE = os.path.dirname(__file__)
DIST = os.path.join(BASE, "frontend", "dist")

app = FastAPI(title="Lab Toolkit")

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
    uvicorn.run("main:app", host="localhost", port=port, reload=True)
