"""SQLAlchemy models package."""
from .aluno import Aluno
from .comunicado import Comunicado
from .nota import Nota
from .usuario import Usuario
from .ocorrencia import Ocorrencia
from .audit_log import AuditLog

__all__ = ["Aluno", "Nota", "Usuario", "Comunicado", "Ocorrencia", "AuditLog"]
