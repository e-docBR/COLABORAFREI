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
    # Teacher specific
    distribution: dict[str, int] | None = None

    @classmethod
    def empty(cls) -> "DashboardAnalytics":
        return cls(total_alunos=0, total_turmas=0, media_geral=0.0, alunos_em_risco=0)

    def to_dict(self) -> dict[str, float | int | dict]:
        data = {
            "total_alunos": self.total_alunos,
            "total_turmas": self.total_turmas,
            "media_geral": self.media_geral,
            "alunos_em_risco": self.alunos_em_risco,
        }
        if self.distribution:
            data["distribution"] = self.distribution
        return data


def build_dashboard_metrics(session: Session) -> DashboardAnalytics:
    total_alunos = session.execute(select(func.count(Aluno.id))).scalar_one() or 0
    normalized_turma = func.trim(
        func.replace(
            func.replace(func.upper(Aluno.turma), " ANO ", " "),
            "  ",
            " ",
        )
    )
    total_turmas = session.execute(select(func.count(func.distinct(normalized_turma)))).scalar_one() or 0
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

def build_teacher_dashboard(session: Session, query: str | None = None, turno: str | None = None, turma: str | None = None) -> dict[str, any]:
    # Base filter builder
    def apply_filters(stm):
        if turno and turno != 'Todos':
            stm = stm.where(Aluno.turno == turno)
        if turma and turma != 'Todas':
            stm = stm.where(Aluno.turma == turma)
        if query:
            term = f"%{query}%"
            stm = stm.where(Aluno.nome.ilike(term) | Aluno.matricula.ilike(term))
        return stm

    # 1. Grade Distribution
    # Intervals: 0-20, 20-40, 40-60, 60-80, 80-100
    queries = [
        (0, 20), (20, 40), (40, 60), (60, 80), (80, 101)
    ]
    dist = {}
    for start, end in queries:
        stm = select(func.count(Nota.id)).join(Aluno).where(Nota.total >= start, Nota.total < end)
        stm = apply_filters(stm)
        
        count = session.execute(stm).scalar_one()
        label = f"{start}-{end}" if end <= 80 else f"{start}-100"
        dist[label] = count

    # 2. Risk Alerts (Simulated AI or Heuristic)
    # Fetch top 10 risky students based on grades < 60
    base_stm = select(Aluno, func.avg(Nota.total).label("media")) \
        .join(Nota) \
        .group_by(Aluno.id) \
        .having(func.avg(Nota.total) < 60) \
        .order_by("media") \
        .limit(10)
    
    # We can't easily apply WHERE after GROUP BY/HAVING in this structure without subqueries or careful ordering.
    # Instead, we apply filters to the JOIN source.
    # Re-writing query:
    stm_risk = select(Aluno, func.avg(Nota.total).label("media")).join(Nota)
    stm_risk = apply_filters(stm_risk)
    stm_risk = stm_risk.group_by(Aluno.id).having(func.avg(Nota.total) < 60).order_by("media").limit(10)

    risky_students = session.execute(stm_risk).all()
    
    alerts = []
    # Import locally to avoid circular dependencies if any
    try:
        from .ai_predictor import predict_risk
    except ImportError:
        def predict_risk(aid): return 0.5

    for aluno, media in risky_students:
        score = predict_risk(aluno.id)
        alerts.append({
            "id": aluno.id,
            "nome": aluno.nome,
            "turma": aluno.turma,
            "media": round(media, 1),
            "risk_score": score
        })

    # 3. Classes Count
    stm_classes = select(func.count(func.distinct(Aluno.turma)))
    # If filtering by Aluno properties, we just query from Aluno
    stm_classes_src = select(func.count(func.distinct(Aluno.turma)))
    # apply_filters expects a statement that has Aluno. 
    # Let's fix apply_filters usage or create a fresh one.
    stm_c = select(func.count(func.distinct(Aluno.turma)))
    stm_c = apply_filters(stm_c)
    
    classes_count = session.execute(stm_c).scalar_one()

    return {
        "distribution": dist,
        "alerts": alerts,
        "classes_count": classes_count
    }
