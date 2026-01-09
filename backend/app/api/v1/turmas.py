"""Turmas endpoints."""
from __future__ import annotations

from statistics import mean
from unicodedata import normalize
from urllib.parse import unquote

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func

from ...core.database import session_scope
from ...models import Aluno, Nota


def register(parent: Blueprint) -> None:
    bp = Blueprint("turmas", __name__)

    @bp.get("/turmas")
    @jwt_required()
    def list_turmas():
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
        with session_scope() as session:
            query = (
                session.query(
                    Aluno.turma,
                    Aluno.turno,
                    func.count(func.distinct(Aluno.id)).label("total_alunos"),
                    func.avg(Nota.total).label("media"),
                    func.avg(Nota.faltas).label("faltas_medias"),
                )
                .join(Nota)
                .group_by(Aluno.turma, Aluno.turno)
                .order_by(Aluno.turma)
            )
            rows = query.all()

        items = [
            {
                "turma": turma,
                "turno": turno,
                "total_alunos": total,
                "media": round(float(media), 2) if media is not None else None,
                "faltas_medias": round(float(faltas), 1) if faltas is not None else 0,
                "slug": _slugify(turma),
            }
            for turma, turno, total, media, faltas in rows
        ]
        return jsonify({"items": items, "total": len(items)})

    @bp.get("/turmas/<path:turma_nome>/alunos")
    @jwt_required()
    def list_alunos_por_turma(turma_nome: str):
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
        turma_decoded = unquote(turma_nome)
        with session_scope() as session:
            turma_real = _resolve_turma_nome(session, turma_decoded)
            if not turma_real:
                return jsonify({"turma": turma_decoded, "alunos": [], "total": 0}), 200

            alunos = (
                session.query(Aluno)
                .filter(Aluno.turma == turma_real)
                .order_by(Aluno.nome)
                .all()
            )
            if not alunos:
                return jsonify({"turma": turma_real, "alunos": [], "total": 0}), 200

            aluno_ids = [aluno.id for aluno in alunos]
            notas = (
                session.query(Nota)
                .filter(Nota.aluno_id.in_(aluno_ids))
                .order_by(Nota.aluno_id, Nota.disciplina)
                .all()
            )

        notas_por_aluno: dict[int, list[dict[str, str | float | int | None]]] = {aluno_id: [] for aluno_id in aluno_ids}
        for nota in notas:
            notas_por_aluno.setdefault(nota.aluno_id, []).append(_serialize_nota(nota))

        alunos_payload = []
        for aluno in alunos:
            notas_aluno = notas_por_aluno.get(aluno.id, [])
            media_total = _calcular_media(notas_aluno)
            situacao = _calcular_situacao(notas_aluno)
            alunos_payload.append(
                {
                    "id": aluno.id,
                    "nome": aluno.nome,
                    "matricula": aluno.matricula,
                    "turma": aluno.turma,
                    "turno": aluno.turno,
                    "media": media_total,
                    "situacao": situacao,
                    "notas": notas_aluno,
                }
            )

        return jsonify(
            {
                "turma": turma_real,
                "turno": alunos[0].turno,
                "total": len(alunos_payload),
                "alunos": alunos_payload,
            }
        )

    parent.register_blueprint(bp)


def _serialize_nota(nota: Nota) -> dict[str, str | float | int | None]:
    return {
        "disciplina": nota.disciplina,
        "trimestre1": float(nota.trimestre1) if nota.trimestre1 is not None else None,
        "trimestre2": float(nota.trimestre2) if nota.trimestre2 is not None else None,
        "trimestre3": float(nota.trimestre3) if nota.trimestre3 is not None else None,
        "total": float(nota.total) if nota.total is not None else None,
        "faltas": nota.faltas,
        "situacao": nota.situacao,
    }


def _calcular_media(notas: list[dict[str, str | float | int | None]]) -> float | None:
    valores = [nota["total"] for nota in notas if isinstance(nota.get("total"), (int, float))]
    if not valores:
        return None
    return round(mean(valores), 1)


def _calcular_situacao(notas: list[dict[str, str | float | int | None]]) -> str | None:
    situacoes = [str(nota["situacao"]).upper() for nota in notas if nota.get("situacao")]
    if not situacoes:
        return None
    if any(sit in {"REP", "REPROVADO"} for sit in situacoes):
        return "REP"
    
    # Se tiver ACC em alguma matéria, mas tudo o resto for APROVADO/APR/ACC/AR, retorna APCC.
    # Se tiver algo fora desse conjunto (e não é REP), cai no REC.
    if any(sit not in {"APR", "APROVADO", "ACC", "AR"} for sit in situacoes):
        return "REC"
        
    if any(sit == "ACC" for sit in situacoes):
        return "APCC"

    return "APR"


def _slugify(value: str) -> str:
    normalized = normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = "".join(ch if ch.isalnum() else "-" for ch in normalized.strip().lower())
    return "-".join(filter(None, slug.split("-")))


def _resolve_turma_nome(session, turma_value: str) -> str | None:
    direct_match = (
        session.query(Aluno.turma)
        .filter(func.lower(Aluno.turma) == turma_value.lower())
        .scalar()
    )
    if direct_match:
        return direct_match

    slug_target = _slugify(turma_value)
    turmas = session.query(Aluno.turma).distinct().all()
    for (turma,) in turmas:
        if _slugify(turma) == slug_target:
            return turma
    return None
