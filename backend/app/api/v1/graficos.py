"""Endpoints para gráficos dinâmicos do dashboard."""
from __future__ import annotations

from typing import Callable

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.database import session_scope
from ...models import Aluno, Nota

GraphBuilder = Callable[[Session, str | None, str | None, str | None], list[dict[str, object]]]


def register(parent: Blueprint) -> None:
    bp = Blueprint("graficos", __name__)

    @bp.get("/graficos/<string:slug>")
    @jwt_required()
    def get_grafico(slug: str):
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
        builder = GRAPH_BUILDERS.get(slug)
        if not builder:
            return jsonify({"error": "Gráfico não encontrado"}), 404

        turno = request.args.get("turno") or None
        turma = request.args.get("turma") or None
        trimestre = request.args.get("trimestre") or None

        with session_scope() as session:
            data = builder(session, turno, turma, trimestre)

        return jsonify({"slug": slug, "dados": data})

    parent.register_blueprint(bp)


TRIMESTRE_COLUMNS = {
    "1": Nota.trimestre1,
    "2": Nota.trimestre2,
    "3": Nota.trimestre3,
}


def _resolve_trimestre_column(trimestre: str | None):
    if trimestre in TRIMESTRE_COLUMNS:
        return TRIMESTRE_COLUMNS[trimestre]
    return Nota.total


def _disciplinas_medias(session, turno: str | None, turma: str | None, trimestre: str | None):
    column = _resolve_trimestre_column(trimestre)
    query = session.query(Nota.disciplina, func.avg(column).label("media"))
    query = query.join(Aluno)
    if turno:
        query = query.filter(Aluno.turno == turno)
    if turma:
        query = query.filter(Aluno.turma == turma)
    query = query.group_by(Nota.disciplina).order_by(func.avg(column).desc())

    return [
        {
            "disciplina": disciplina,
            "media": round(float(media), 2) if media is not None else 0.0,
        }
        for disciplina, media in query.all()
    ]


def _turmas_trimestre(session, turno: str | None, turma: str | None, _trimestre: str | None):
    results: list[dict[str, object]] = []
    for trimestre, column in TRIMESTRE_COLUMNS.items():
        query = session.query(func.avg(column))
        query = query.join(Aluno)
        if turno:
            query = query.filter(Aluno.turno == turno)
        if turma:
            query = query.filter(Aluno.turma == turma)
        media = query.scalar()
        results.append({"trimestre": f"{trimestre}º", "media": round(float(media), 2) if media else 0.0})
    return results


def _situacao_distribuicao(session, turno: str | None, turma: str | None, _trimestre: str | None):
    query = session.query(Nota.situacao, func.count(Nota.id))
    query = query.join(Aluno)
    if turno:
        query = query.filter(Aluno.turno == turno)
    if turma:
        query = query.filter(Aluno.turma == turma)
    query = query.group_by(Nota.situacao)

    mapped = {
        "APR": "Aprovado",
        "APROVADO": "Aprovado",
        "REC": "Recuperação",
        "REPROVADO": "Recuperação",
    }

    data = {}
    for situacao, total in query.all():
        label = mapped.get((situacao or "").upper(), "Outros")
        data[label] = data.get(label, 0) + int(total or 0)

    return [
        {"situacao": label, "total": quantidade}
        for label, quantidade in data.items()
    ]


def _faltas_por_turma(session, turno: str | None, turma: str | None, _trimestre: str | None):
    query = (
        session.query(Aluno.turma, func.sum(Nota.faltas).label("faltas"))
        .join(Nota)
        .group_by(Aluno.turma)
        .order_by(func.sum(Nota.faltas).desc())
    )
    if turno:
        query = query.filter(Aluno.turno == turno)
    if turma:
        query = query.filter(Aluno.turma == turma)
    results = query.limit(10).all()
    return [
        {"turma": turma_nome, "faltas": int(faltas or 0)}
        for turma_nome, faltas in results
    ]


def _heatmap_disciplinas(session, turno: str | None, turma: str | None, trimestre: str | None):
    column = _resolve_trimestre_column(trimestre)
    query = session.query(Aluno.turma, Nota.disciplina, func.avg(column).label("media"))
    query = query.join(Aluno)
    if turno:
        query = query.filter(Aluno.turno == turno)
    if turma:
        query = query.filter(Aluno.turma == turma)
    query = query.group_by(Aluno.turma, Nota.disciplina)

    return [
        {
            "turma": turma_nome,
            "disciplina": disciplina,
            "media": round(float(media), 2) if media is not None else 0.0,
        }
        for turma_nome, disciplina, media in query.all()
    ]


GRAPH_BUILDERS: dict[str, GraphBuilder] = {
    "disciplinas-medias": _disciplinas_medias,
    "turmas-trimestre": _turmas_trimestre,
    "situacao-distribuicao": _situacao_distribuicao,
    "faltas-por-turma": _faltas_por_turma,
    "heatmap-disciplinas": _heatmap_disciplinas,
}
