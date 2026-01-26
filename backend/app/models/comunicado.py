from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base
from .base_mixin import TenantYearMixin

class Comunicado(Base, TenantYearMixin):
    __tablename__ = "comunicados"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    data_publicacao: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    autor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    autor = relationship("Usuario")

    # Target: "TODOS", "TURMA:<turma_slug>", "ALUNO:<id>"
    target_type = mapped_column(String(50), nullable=False) 
    target_value = mapped_column(String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "conteudo": self.conteudo,
            "data_envio": self.data_envio.isoformat(),
            "autor": self.autor.username if self.autor else "Sistema",
            "target": f"{self.target_type} {self.target_value or ''}".strip(),
            "arquivado": self.arquivado
        }
