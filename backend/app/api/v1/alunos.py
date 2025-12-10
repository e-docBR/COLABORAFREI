"""Alunos endpoints."""
from math import ceil

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from ...core.database import session_scope
from ...models import Aluno, Nota


def serialize_aluno(aluno: Aluno, media: float | None = None) -> dict[str, str | int | float | None]:
    return {
        "id": aluno.id,
        "matricula": aluno.matricula,
        "nome": aluno.nome,
        "turma": aluno.turma,
        "turno": aluno.turno,
        "media": float(media) if media is not None else None,
    }


def serialize_nota(nota: Nota) -> dict[str, str | int | float | None]:
    return {
        "id": nota.id,
        "disciplina": nota.disciplina,
        "trimestre1": float(nota.trimestre1) if nota.trimestre1 is not None else None,
        "trimestre2": float(nota.trimestre2) if nota.trimestre2 is not None else None,
        "trimestre3": float(nota.trimestre3) if nota.trimestre3 is not None else None,
        "total": float(nota.total) if nota.total is not None else None,
        "faltas": nota.faltas,
        "situacao": nota.situacao,
    }


def register(parent: Blueprint) -> None:
    bp = Blueprint("alunos", __name__)

    @bp.get("/alunos")
    @jwt_required()
    def list_alunos():
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, int(request.args.get("per_page", 20)))
        turno = request.args.get("turno")
        turma = request.args.get("turma")
        query_text = request.args.get("q")

        def apply_filters(query):
            if turno:
                query = query.filter(Aluno.turno == turno)
            if turma:
                query = query.filter(Aluno.turma == turma)
            if query_text:
                like_term = f"%{query_text}%"
                query = query.filter(Aluno.nome.ilike(like_term))
            return query

        with session_scope() as session:
            count_query = apply_filters(session.query(func.count(Aluno.id)))
            total = count_query.scalar() or 0

            query = apply_filters(
                session.query(Aluno, func.avg(Nota.total).label("media"))
                .outerjoin(Nota)
                .group_by(Aluno.id)
            )

            results = (
                query.order_by(Aluno.nome)
                .offset((page - 1) * per_page)
                .limit(per_page)
                .all()
            )

            items = [serialize_aluno(aluno, media) for aluno, media in results]

        return jsonify(
            {
                "items": items,
                "meta": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": ceil(total / per_page) if total else 0,
                },
            }
        )

    @bp.get("/alunos/<int:aluno_id>")
    @jwt_required()
    def retrieve_aluno(aluno_id: int):
        with session_scope() as session:
            aluno = session.get(Aluno, aluno_id)
            if not aluno:
                return jsonify({"error": "Aluno não encontrado"}), 404
            media = (
                session.query(func.avg(Nota.total))
                .filter(Nota.aluno_id == aluno_id)
                .scalar()
            )
            notas = (
                session.query(Nota)
                .filter(Nota.aluno_id == aluno_id)
                .order_by(Nota.disciplina)
                .all()
            )

        payload = serialize_aluno(aluno, media)
        payload["notas"] = [serialize_nota(nota) for nota in notas]
        return jsonify(payload)

    parent.register_blueprint(bp)
