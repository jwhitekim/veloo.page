from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / ".env")

from fastapi import FastAPI
from routers import todos, steps, ai

app = FastAPI(title="Research Todo API")

app.include_router(todos.router)
app.include_router(steps.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    return {"status": "ok"}
