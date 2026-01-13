from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Aluno(Base):
    __tablename__ = "alunos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    
    matricula: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    turma: Mapped[str] = mapped_column(String(32), nullable=False)
    turno: Mapped[str] = mapped_column(String(32), nullable=False)

    notas = relationship("Nota", back_populates="aluno", cascade="all, delete-orphan")
    usuario = relationship("Usuario", back_populates="aluno", uselist=False)
    tenant = relationship("Tenant", back_populates="alunos")
