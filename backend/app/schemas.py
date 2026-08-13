from datetime import date, datetime
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: str
    icon: str = "📁"
    active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionBase(BaseModel):
    description: str = Field(min_length=1, max_length=120)
    amount: float = Field(gt=0)
    type: str
    date: date
    status: str = "CONFIRMADO"
    notes: str | None = None
    category_id: int


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: CategoryOut

    model_config = {"from_attributes": True}


class DashboardOut(BaseModel):
    income: float
    expenses: float
    balance: float
    result: float
