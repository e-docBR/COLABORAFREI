from typing import Optional
from sqlalchemy.orm import Session
from math import ceil

from app.repositories.aluno_repository import AlunoRepository
from app.schemas.aluno import (
    AlunoPaginatedResponse, 
    AlunoListSchema, 
    PaginationMeta,
    AlunoDetailSchema,
    NotaSchema
)

class AlunoService:
    def __init__(self, session: Session):
        self.repository = AlunoRepository(session)

    def list_alunos(
        self,
        page: int,
        per_page: int,
        turno: Optional[str] = None,
        turma: Optional[str] = None,
        query_text: Optional[str] = None
    ) -> AlunoPaginatedResponse:
        
        results, total = self.repository.get_paginated_with_average(
            page=page,
            per_page=per_page,
            turno=turno,
            turma=turma,
            query_text=query_text
        )

        items = []
        for aluno, media, faltas in results:
            items.append(
                AlunoListSchema(
                    id=aluno.id,
                    matricula=aluno.matricula,
                    nome=aluno.nome,
                    turma=aluno.turma,
                    turno=aluno.turno,
                    media=float(media) if media is not None else None,
                    faltas=int(faltas) if faltas is not None else 0
                )
            )


        return AlunoPaginatedResponse(
            items=items,
            meta=PaginationMeta(
                page=page,
                per_page=per_page,
                total=total,
                pages=ceil(total / per_page) if total else 0
            )
        )

    def get_aluno_details(self, aluno_id: int) -> Optional[AlunoDetailSchema]:
        aluno, media, notas = self.repository.get_with_notes(aluno_id)
        
        if not aluno:
            return None

        notas_schema = [NotaSchema.model_validate(nota) for nota in notas]

        return AlunoDetailSchema(
            id=aluno.id,
            matricula=aluno.matricula,
            nome=aluno.nome,
            turma=aluno.turma,
            turno=aluno.turno,
            media=float(media) if media is not None else None,
            notas=notas_schema
        )
