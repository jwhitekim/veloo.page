from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from database import get_supabase
import schemas
from dateutil import parser as dateutil_parser


def _parse_deadline(text: str) -> date | None:
    if not text or not text.strip():
        return None
    text = text.strip()
    today = datetime.now().date()
    monday = today - timedelta(days=today.weekday())

    if "오늘" in text:
        return today
    if "내일" in text:
        return today + timedelta(days=1)

    weekday_map = {"월": 0, "화": 1, "수": 2, "목": 3, "금": 4, "토": 5, "일": 6}
    for kr, wd in weekday_map.items():
        if kr + "요일" in text:
            return monday + timedelta(days=wd)

    try:
        return dateutil_parser.parse(text, fuzzy=True).date()
    except Exception:
        return None


def _this_week_range() -> tuple[date, date]:
    today = datetime.now().date()
    monday = today - timedelta(days=today.weekday())
    return monday, monday + timedelta(days=6)

router = APIRouter(prefix="/api/todos", tags=["todos"])


def _sort_steps(todo: dict) -> dict:
    todo["steps"] = sorted(todo.get("steps") or [], key=lambda s: s["order_index"])
    return todo


def _fetch_one(sb: Client, todo_id: int) -> dict:
    res = sb.table("todos").select("*, steps(*)").eq("id", todo_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Todo not found")
    return _sort_steps(res.data)


@router.get("", response_model=List[schemas.TodoOut])
def get_todos(filter: Optional[str] = None, sb: Client = Depends(get_supabase)):
    query = sb.table("todos").select("*, steps(*)")

    if filter == "week":
        res = query.eq("done", False).order("created_at", desc=True).execute()
    elif filter == "memo":
        res = query.neq("memo", "").order("created_at", desc=True).execute()
    else:
        res = query.order("created_at", desc=True).execute()

    todos = [_sort_steps(t) for t in (res.data or [])]

    if filter == "week":
        monday, sunday = _this_week_range()
        todos = [
            t for t in todos
            if (d := _parse_deadline(t.get("deadline") or "")) is not None
            and monday <= d <= sunday
        ]

    if filter == "today":
        today = datetime.now(timezone.utc).date().isoformat()
        todos = [
            t for t in todos
            if (t.get("created_at") or "")[:10] == today
            or "오늘" in (t.get("deadline") or "")
        ]

    return todos


@router.get("/{todo_id}", response_model=schemas.TodoOut)
def get_todo(todo_id: int, sb: Client = Depends(get_supabase)):
    return _fetch_one(sb, todo_id)


@router.post("", response_model=schemas.TodoOut)
def create_todo(todo_in: schemas.TodoCreate, sb: Client = Depends(get_supabase)):
    res = sb.table("todos").insert(todo_in.model_dump()).execute()
    todo = res.data[0]
    todo["steps"] = []
    return todo


@router.patch("/{todo_id}", response_model=schemas.TodoOut)
def update_todo(todo_id: int, todo_in: schemas.TodoUpdate, sb: Client = Depends(get_supabase)):
    data = todo_in.model_dump(exclude_none=True)
    sb.table("todos").update(data).eq("id", todo_id).execute()
    return _fetch_one(sb, todo_id)


@router.delete("/{todo_id}")
def delete_todo(todo_id: int, sb: Client = Depends(get_supabase)):
    sb.table("todos").delete().eq("id", todo_id).execute()
    return {"ok": True}


@router.patch("/{todo_id}/done", response_model=schemas.TodoOut)
def toggle_done(todo_id: int, sb: Client = Depends(get_supabase)):
    current = sb.table("todos").select("done").eq("id", todo_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Todo not found")
    sb.table("todos").update({"done": not current.data["done"]}).eq("id", todo_id).execute()
    return _fetch_one(sb, todo_id)


@router.post("/{todo_id}/steps", response_model=schemas.StepOut)
def add_step(todo_id: int, step_in: schemas.StepCreate, sb: Client = Depends(get_supabase)):
    res = sb.table("steps").insert({"todo_id": todo_id, **step_in.model_dump()}).execute()
    return res.data[0]
