from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..core.database import Base

class Comunicado(Base):
    __tablename__ = "comunicados"

    id = Column(Integer, primary_key=True)
    titulo = Column(String(200), nullable=False)
    conteudo = Column(Text, nullable=False)
    data_envio = Column(DateTime, default=datetime.now)
    
    autor_id = Column(Integer, ForeignKey("usuarios.id"))
    autor = relationship("Usuario")

    # Target: "TODOS", "TURMA:<turma_slug>", "ALUNO:<id>"
    target_type = Column(String(50), nullable=False) 
    target_value = Column(String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "conteudo": self.conteudo,
            "data_envio": self.data_envio.isoformat(),
            "autor": self.autor.username if self.autor else "Sistema",
            "target": f"{self.target_type} {self.target_value or ''}".strip()
        }
