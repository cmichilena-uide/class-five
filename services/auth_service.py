from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, or_, select

from core.security import (
    DUMMY_HASH,
    create_access_token,
    hash_password,
    verify_password,
)
from models.usuario import Usuario
from schemas.usuario import Token, UserCreate


class UserAlreadyExistsError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


def register_user(session: Session, data: UserCreate) -> Usuario:
    email = data.email.lower()
    existing = session.exec(
        select(Usuario).where(or_(Usuario.username == data.username, Usuario.email == email))
    ).first()
    if existing is not None:
        raise UserAlreadyExistsError
    user = Usuario(
        username=data.username,
        email=email,
        password=hash_password(data.password),
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise UserAlreadyExistsError from error
    session.refresh(user)
    return user


def authenticate_user(session: Session, username: str, password: str) -> Usuario:
    user = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if user is None:
        verify_password(password, DUMMY_HASH)
        raise InvalidCredentialsError
    if not verify_password(password, user.password):
        raise InvalidCredentialsError
    return user


def login(session: Session, username: str, password: str) -> Token:
    user = authenticate_user(session, username, password)
    return Token(access_token=create_access_token(str(user.id)))


def get_user_by_id(session: Session, user_id: int) -> Usuario | None:
    return session.get(Usuario, user_id)
