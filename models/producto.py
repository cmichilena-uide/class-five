from sqlmodel import Field, SQLModel


class Producto(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, max_length=100)
    descripcion: str = Field(max_length=500)
    precio: float
    stock: int
    imagen: str | None = Field(default=None, max_length=500)
    user_id: int = Field(foreign_key="usuario.id", index=True)
