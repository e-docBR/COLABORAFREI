from typing import List, Tuple, Optional
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from app.models import Aluno, Nota
from app.repositories.base import BaseRepository

class TurmaRepository(BaseRepository[Aluno]):
    """
    Turma is not a model, but an aggregation of Alunos.
    We inherit from BaseRepository[Aluno] but methods are specific.
    """
    def __init__(self, session: Session):
        super().__init__(session, Aluno)

    def get_summaries(self) -> List[Tuple[str, str, int, float, float]]:
        query = (
            self.session.query(
                Aluno.turma,
                Aluno.turno,
                func.count(distinct(Aluno.id)).label("total_alunos"),
                func.avg(Nota.total).label("media"),
                func.avg(Nota.faltas).label("faltas_medias"),
            )
            .join(Nota)
            .group_by(Aluno.turma, Aluno.turno)
            .order_by(Aluno.turma)
        )
        return query.all()

    def get_real_name(self, name_or_slug: str, slugify_func) -> Optional[str]:
        # Direct match
        direct_match = (
            self.session.query(Aluno.turma)
            .filter(func.lower(Aluno.turma) == name_or_slug.lower())
            .scalar()
        )
        if direct_match:
            return direct_match

        # Slug match
        turmas = self.session.query(Aluno.turma).distinct().all()
        for (turma,) in turmas:
            if slugify_func(turma) == slugify_func(name_or_slug):
                return turma
        return None

    def get_alunos_by_turma(self, turma_nome: str) -> List[Aluno]:
        return (
            self.session.query(Aluno)
            .filter(Aluno.turma == turma_nome)
            .order_by(Aluno.nome)
            .all()
        )

    def get_notas_for_alunos(self, aluno_ids: List[int]) -> List[Nota]:
        return (
            self.session.query(Nota)
            .filter(Nota.aluno_id.in_(aluno_ids))
            .order_by(Nota.aluno_id, Nota.disciplina)
            .all()
        )
