"""Aluno model."""
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Aluno(Base):
    __tablename__ = "alunos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    matricula: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    turma: Mapped[str] = mapped_column(String(32), nullable=False)
    turno: Mapped[str] = mapped_column(String(32), nullable=False)

    notas = relationship("Nota", back_populates="aluno", cascade="all, delete-orphan")
