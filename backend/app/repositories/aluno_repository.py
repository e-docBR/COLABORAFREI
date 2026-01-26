from typing import List, Tuple, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Aluno, Nota
from app.repositories.base import BaseRepository

class AlunoRepository(BaseRepository[Aluno]):
    def __init__(self, session: Session):
        super().__init__(session, Aluno)

    def get_paginated_with_average(
        self,
        page: int = 1,
        per_page: int = 20,
        turno: Optional[str] = None,
        turma: Optional[str] = None,
        query_text: Optional[str] = None
    ) -> Tuple[List[Tuple[Aluno, float, int]], int]:
        
        # Base query for count
        count_query = select(func.count(Aluno.id))
        
        # Base query for data
        data_query = (
            select(Aluno, func.avg(Nota.total).label("media"), func.sum(Nota.faltas).label("faltas"))
            .outerjoin(Nota)
            .group_by(Aluno.id)
        )


        # Apply filters function
        def apply_filters(query):
            if turno:
                query = query.where(Aluno.turno == turno)
            if turma:
                query = query.where(Aluno.turma == turma)
            if query_text:
                like_term = f"%{query_text}%"
                query = query.where(
                    or_(
                        Aluno.nome.ilike(like_term),
                        Aluno.matricula.ilike(like_term),
                        Aluno.turma.ilike(like_term),
                    )
                )
            return query

        # Execute count
        final_count_query = apply_filters(count_query)
        total = self.session.execute(final_count_query).scalar() or 0

        # Execute data fetch
        final_data_query = apply_filters(data_query)
        final_data_query = (
            final_data_query
            .order_by(Aluno.nome)
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        
        results = self.session.execute(final_data_query).all()
        
        return results, total

    def get_with_notes(self, aluno_id: int) -> Tuple[Optional[Aluno], Optional[float], List[Nota]]:
        aluno = self.get(aluno_id)
        if not aluno:
            return None, None, []

        media = (
            self.session.query(func.avg(Nota.total))
            .filter(Nota.aluno_id == aluno_id)
            .scalar()
        )
        
        notas = (
            self.session.query(Nota)
            .filter(Nota.aluno_id == aluno_id)
            .order_by(Nota.disciplina)
            .all()
        )

        return aluno, media, notas
