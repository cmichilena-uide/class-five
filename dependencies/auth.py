from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.security import decode_access_token
from db.database import SessionDep
from models.usuario import Usuario
from services import auth_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], session: SessionDep
) -> Usuario:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    subject = decode_access_token(token)
    if subject is None or not subject.isdigit():
        raise credentials_error
    user = auth_service.get_user_by_id(session, int(subject))
    if user is None:
        raise credentials_error
    return user


CurrentUser = Annotated[Usuario, Depends(get_current_user)]
