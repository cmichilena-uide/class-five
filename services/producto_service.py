from collections.abc import Sequence

from sqlmodel import Session, col, select

from models.producto import Producto
from schemas.producto import ProductCreate


def create_product(session: Session, data: ProductCreate, user_id: int) -> Producto:
    product = Producto(**data.model_dump(), user_id=user_id)
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def list_products(session: Session, user_id: int) -> Sequence[Producto]:
    return session.exec(
        select(Producto).where(Producto.user_id == user_id).order_by(col(Producto.id))
    ).all()


def get_product(session: Session, product_id: int, user_id: int) -> Producto | None:
    return session.exec(
        select(Producto).where(Producto.id == product_id, Producto.user_id == user_id)
    ).first()


def update_product(
    session: Session, product_id: int, data: ProductCreate, user_id: int
) -> Producto | None:
    product = get_product(session, product_id, user_id)
    if product is None:
        return None
    product.sqlmodel_update(data.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def delete_product(session: Session, product_id: int, user_id: int) -> bool:
    product = get_product(session, product_id, user_id)
    if product is None:
        return False
    session.delete(product)
    session.commit()
    return True
