from sqlalchemy.orm import Session
from .models import Category

DEFAULT_CATEGORIES = [
    ("Salário", "RECEITA", "💰"),
    ("Serviços", "RECEITA", "💼"),
    ("Venda", "RECEITA", "🛍️"),
    ("Outros", "RECEITA", "➕"),
    ("Moradia", "DESPESA", "🏠"),
    ("Mercado", "DESPESA", "🛒"),
    ("Alimentação", "DESPESA", "🍔"),
    ("Transporte", "DESPESA", "🚗"),
    ("Saúde", "DESPESA", "❤️"),
    ("Lazer", "DESPESA", "🎮"),
    ("Outros", "DESPESA", "📁"),
]


def seed_categories(db: Session) -> None:
    if db.query(Category).count() > 0:
        return

    for name, type_, icon in DEFAULT_CATEGORIES:
        db.add(Category(name=name, type=type_, icon=icon))
    db.commit()
