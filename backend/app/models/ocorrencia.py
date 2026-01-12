from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship

from ..core.database import Base

class Ocorrencia(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True)
    aluno_id = Column(Integer, ForeignKey("alunos.id"), nullable=False)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Simple string for enum flexibility or strict Enum
    tipo = Column(String(50), nullable=False) # ADVERTENCIA, ELOGIO, ATRASO, SUSPENSAO, NOTE
    descricao = Column(Text, nullable=False)
    data_ocorrencia = Column(DateTime, default=datetime.now)
    resolvida = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    aluno = relationship("Aluno", backref="ocorrencias")
    autor = relationship("Usuario")

    def to_dict(self):
        return {
            "id": self.id,
            "aluno_nome": self.aluno.nome if self.aluno else "Desconhecido",
            "aluno_id": self.aluno_id,
            "autor_nome": self.autor.username if self.autor else "Sistema",
            "tipo": self.tipo,
            "descricao": self.descricao,
            "data_ocorrencia": self.data_ocorrencia.isoformat(),
            "resolvida": self.resolvida,
            "created_at": self.created_at.isoformat()
        }
