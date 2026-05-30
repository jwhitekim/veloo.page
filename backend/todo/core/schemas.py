from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class StepBase(BaseModel):
    text: str
    done: bool = False
    order_index: int = 0


class StepCreate(StepBase):
    pass


class StepUpdate(BaseModel):
    text: Optional[str] = None
    done: Optional[bool] = None
    order_index: Optional[int] = None


class StepOut(StepBase):
    id: int
    todo_id: int

    model_config = {"from_attributes": True}


class TodoBase(BaseModel):
    name: str
    memo: str = ""
    priority: str = "normal"
    deadline: str = ""


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    name: Optional[str] = None
    memo: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    done: Optional[bool] = None
    ai_strategy: Optional[str] = None


class TodoOut(TodoBase):
    id: int
    done: bool
    ai_strategy: str
    created_at: datetime
    updated_at: datetime
    steps: List[StepOut] = []

    model_config = {"from_attributes": True}


class GenerateStepsRequest(BaseModel):
    todo_id: int | None = None
    todo_name: str = Field(..., max_length=200)
    memo: str = Field("", max_length=1000)
    priority: Literal["urgent", "mid", "normal"] = "normal"
    deadline: str = Field("", max_length=100)


class GenerateStrategyRequest(BaseModel):
    todo_id: int
