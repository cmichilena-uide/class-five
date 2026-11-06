from fastapi import APIRouter, Depends, HTTPException, status

from db.database import SessionDep
from dependencies.auth import CurrentUser, get_current_user
from schemas.producto import ProductCreate, ProductRead
from services import producto_service

router = APIRouter(
    prefix="/productos",
    tags=["productos"],
    dependencies=[Depends(get_current_user)],
)

NOT_FOUND = "Producto no encontrado"


def user_id_of(user: CurrentUser) -> int:
    if user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user.id


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductRead)
def create_product(data: ProductCreate, session: SessionDep, user: CurrentUser):
    return producto_service.create_product(session, data, user_id_of(user))


@router.get("/", response_model=list[ProductRead])
def list_products(session: SessionDep, user: CurrentUser):
    return producto_service.list_products(session, user_id_of(user))


@router.get("/{id}", response_model=ProductRead)
def get_product(id: int, session: SessionDep, user: CurrentUser):
    product = producto_service.get_product(session, id, user_id_of(user))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return product


@router.put("/{id}", response_model=ProductRead)
def update_product(id: int, data: ProductCreate, session: SessionDep, user: CurrentUser):
    product = producto_service.update_product(session, id, data, user_id_of(user))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return product


@router.delete("/{id}")
def delete_product(id: int, session: SessionDep, user: CurrentUser):
    if not producto_service.delete_product(session, id, user_id_of(user)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return {"message": "Producto eliminado"}
