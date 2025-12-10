"""Database helpers based on SQLAlchemy 2.0."""
from __future__ import annotations

from contextlib import contextmanager

from flask import Flask, g
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker

from .config import settings


def get_engine():
    return create_engine(settings.database_url, pool_pre_ping=True, future=True)


engine = get_engine()
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, expire_on_commit=False))


class Base(DeclarativeBase):
    pass


def init_db(app: Flask) -> None:
    @app.teardown_appcontext
    def shutdown_session(exception: Exception | None = None) -> None:  # noqa: ARG001
        SessionLocal.remove()


@contextmanager
def session_scope():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:  # pragma: no cover
        session.rollback()
        raise
    finally:
        session.close()
