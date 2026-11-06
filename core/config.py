from pathlib import Path

from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field, field_validator

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    database_url: str = Field(min_length=1)
    secret_key: str = Field(min_length=32)
    algorithm: str = Field(min_length=1)
    access_token_expire_minutes: int = Field(gt=0)
    cors_origins: list[str] = Field(min_length=1)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


def load_settings() -> Settings:
    values = dotenv_values(ENV_FILE)
    return Settings.model_validate(
        {key.lower(): value for key, value in values.items()}
    )


settings = load_settings()
