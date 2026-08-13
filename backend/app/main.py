from datetime import date
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine, get_db
from .models import Category, Transaction
from .schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    DashboardOut,
    TransactionCreate,
    TransactionOut,
    TransactionUpdate,
)
from .seed import seed_categories

Base.metadata.create_all(bind=engine)

app = FastAPI(title="JB Finance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    db = SessionLocal()
    try:
        seed_categories(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "JB Finance API funcionando"}


@app.get("/categories", response_model=list[CategoryOut])
def list_categories(
    type: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Category).order_by(Category.type, Category.name)
    if type:
        query = query.filter(Category.type == type)
    return query.all()


@app.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@app.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    for key, value in payload.model_dump().items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return category


@app.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    if category.transactions:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir uma categoria com movimentações",
        )
    db.delete(category)
    db.commit()


@app.get("/transactions", response_model=list[TransactionOut])
def list_transactions(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    type: str | None = None,
    category_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .order_by(Transaction.date.desc(), Transaction.id.desc())
    )

    if month:
        query = query.filter(extract("month", Transaction.date) == month)
    if year:
        query = query.filter(extract("year", Transaction.date) == year)
    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if status:
        query = query.filter(Transaction.status == status)

    return query.all()


@app.post("/transactions", response_model=TransactionOut, status_code=201)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    category = db.get(Category, payload.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Categoria inválida")
    if category.type != payload.type:
        raise HTTPException(
            status_code=400,
            detail="O tipo da categoria precisa corresponder à movimentação",
        )

    transaction = Transaction(**payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.id == transaction.id)
        .first()
    )


@app.put("/transactions/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
):
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")

    category = db.get(Category, payload.category_id)
    if not category or category.type != payload.type:
        raise HTTPException(status_code=400, detail="Categoria inválida")

    for key, value in payload.model_dump().items():
        setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.id == transaction.id)
        .first()
    )


@app.post("/transactions/{transaction_id}/duplicate", response_model=TransactionOut)
def duplicate_transaction(transaction_id: int, db: Session = Depends(get_db)):
    original = db.get(Transaction, transaction_id)
    if not original:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")

    duplicate = Transaction(
        description=f"{original.description} (cópia)",
        amount=original.amount,
        type=original.type,
        date=date.today(),
        status=original.status,
        notes=original.notes,
        category_id=original.category_id,
    )
    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)

    return (
        db.query(Transaction)
        .options(joinedload(Transaction.category))
        .filter(Transaction.id == duplicate.id)
        .first()
    )


@app.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    db.delete(transaction)
    db.commit()


@app.get("/dashboard", response_model=DashboardOut)
def dashboard(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    transactions = (
        db.query(Transaction)
        .filter(
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year,
            Transaction.status == "CONFIRMADO",
        )
        .all()
    )

    income = sum(item.amount for item in transactions if item.type == "RECEITA")
    expenses = sum(item.amount for item in transactions if item.type == "DESPESA")
    result = income - expenses

    all_transactions = (
        db.query(Transaction)
        .filter(Transaction.status == "CONFIRMADO")
        .all()
    )
    all_income = sum(item.amount for item in all_transactions if item.type == "RECEITA")
    all_expenses = sum(item.amount for item in all_transactions if item.type == "DESPESA")

    return DashboardOut(
        income=income,
        expenses=expenses,
        result=result,
        balance=all_income - all_expenses,
    )
