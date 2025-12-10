"""Notas endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload

from ...core.database import session_scope
from ...models import Aluno, Nota


def serialize_nota_row(nota: Nota, aluno: Aluno | None = None) -> dict:
    data = {
        "id": nota.id,
        "disciplina": nota.disciplina,
        "trimestre1": float(nota.trimestre1) if nota.trimestre1 is not None else None,
        "trimestre2": float(nota.trimestre2) if nota.trimestre2 is not None else None,
        "trimestre3": float(nota.trimestre3) if nota.trimestre3 is not None else None,
        "total": float(nota.total) if nota.total is not None else None,
        "faltas": nota.faltas,
        "situacao": nota.situacao,
    }
    if aluno:
        data["aluno"] = {
            "id": aluno.id,
            "nome": aluno.nome,
            "turma": aluno.turma,
            "turno": aluno.turno,
        }
    return data


def register(parent: Blueprint) -> None:
    bp = Blueprint("notas", __name__)

    @bp.get("/notas")
    @jwt_required()
    def list_notas():
        turma = request.args.get("turma")
        turno = request.args.get("turno")
        disciplina = request.args.get("disciplina")

        with session_scope() as session:
            query = session.query(Nota).options(joinedload(Nota.aluno))
            if disciplina:
                query = query.filter(Nota.disciplina == disciplina)
            if turma or turno:
                query = query.join(Aluno)
                if turma:
                    query = query.filter(Aluno.turma == turma)
                if turno:
                    query = query.filter(Aluno.turno == turno)

            notas = query.limit(200).all()

        items = [serialize_nota_row(nota, nota.aluno) for nota in notas]
        return jsonify({"items": items, "total": len(items)})

    @bp.patch("/notas/<int:nota_id>")
    @jwt_required()
    def update_nota(nota_id: int):
        payload = request.get_json() or {}
        allowed_fields = {"trimestre1", "trimestre2", "trimestre3", "total", "faltas", "situacao"}
        updates = {k: v for k, v in payload.items() if k in allowed_fields}
        if not updates:
            return jsonify({"error": "Nenhum campo válido informado"}), 400

        with session_scope() as session:
            nota = session.get(Nota, nota_id)
            if not nota:
                return jsonify({"error": "Nota não encontrada"}), 404
            for key, value in updates.items():
                setattr(nota, key, value)
            session.add(nota)
            session.flush()
            session.refresh(nota)

        return jsonify(serialize_nota_row(nota))

    parent.register_blueprint(bp)
