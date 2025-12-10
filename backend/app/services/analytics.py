"""Analytics service responsible for KPIs and reports."""
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Aluno, Nota


@dataclass(slots=True)
class DashboardAnalytics:
    total_alunos: int
    total_turmas: int
    media_geral: float
    alunos_em_risco: int

    @classmethod
    def empty(cls) -> "DashboardAnalytics":
        return cls(total_alunos=0, total_turmas=0, media_geral=0.0, alunos_em_risco=0)

    def to_dict(self) -> dict[str, float | int]:
        return {
            "total_alunos": self.total_alunos,
            "total_turmas": self.total_turmas,
            "media_geral": self.media_geral,
            "alunos_em_risco": self.alunos_em_risco,
        }


def build_dashboard_metrics(session: Session) -> DashboardAnalytics:
    total_alunos = session.execute(select(func.count(Aluno.id))).scalar_one() or 0
    total_turmas = session.execute(select(func.count(func.distinct(Aluno.turma)))).scalar_one() or 0
    media_geral = session.execute(select(func.avg(Nota.total))).scalar_one()
    media_geral_value = float(media_geral) if media_geral is not None else 0.0

    alunos_em_risco = (
        session.execute(
            select(func.count(func.distinct(Nota.aluno_id))).where(Nota.total < 15)
        ).scalar_one()
        or 0
    )

    return DashboardAnalytics(
        total_alunos=total_alunos,
        total_turmas=total_turmas,
        media_geral=round(media_geral_value, 2),
        alunos_em_risco=alunos_em_risco,
    )
