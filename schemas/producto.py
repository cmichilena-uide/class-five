from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str = Field(min_length=1, max_length=500)
    precio: float = Field(gt=0, le=1_000_000, allow_inf_nan=False)
    stock: int = Field(ge=0, le=1_000_000)
    imagen: str | None = Field(default=None, max_length=500, pattern=r"^https?://\S+$")


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str
    precio: float
    stock: int
    imagen: str | None
