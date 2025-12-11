"""Relatório endpoints."""
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func

from ...core.database import session_scope
from ...models import Aluno, Nota


def build_turmas_mais_faltas(session):
    query = (
        session.query(Aluno.turma, func.sum(Nota.faltas).label("faltas"))
        .join(Nota)
        .group_by(Aluno.turma)
        .order_by(func.sum(Nota.faltas).desc())
        .limit(10)
    )
    return [
        {"turma": turma, "faltas": int(faltas or 0)}
        for turma, faltas in query.all()
    ]


def build_melhores_medias(session):
    query = (
        session.query(Aluno.turma, Aluno.turno, func.avg(Nota.total).label("media"))
        .join(Nota)
        .group_by(Aluno.turma, Aluno.turno)
        .order_by(func.avg(Nota.total).desc())
        .limit(10)
    )
    return [
        {
            "turma": turma,
            "turno": turno,
            "media": round(float(media or 0), 2),
        }
        for turma, turno, media in query.all()
    ]


def build_alunos_em_risco(session):
    subquery = (
        session.query(
            Aluno.nome,
            Aluno.turma,
            func.avg(Nota.total).label("media"),
        )
        .join(Nota)
        .group_by(Aluno.id)
        .having(func.avg(Nota.total) < 15)
        .order_by(func.avg(Nota.total))
        .limit(10)
    )
    return [
        {"nome": nome, "turma": turma, "media": round(float(media), 2)}
        for nome, turma, media in subquery.all()
    ]


def build_disciplinas_notas_baixas(session):
    query = (
        session.query(Nota.disciplina, func.avg(Nota.total).label("media"))
        .group_by(Nota.disciplina)
        .order_by(func.avg(Nota.total))
    )
    return [
        {"disciplina": disciplina, "media": round(float(media), 2)}
        for disciplina, media in query.all()
    ]


REPORT_BUILDERS = {
    "turmas-mais-faltas": build_turmas_mais_faltas,
    "melhores-medias": build_melhores_medias,
    "alunos-em-risco": build_alunos_em_risco,
    "disciplinas-notas-baixas": build_disciplinas_notas_baixas,
}


def register(parent: Blueprint) -> None:
    bp = Blueprint("relatorios", __name__)

    @bp.get("/relatorios/<string:slug>")
    @jwt_required()
    def get_relatorio(slug: str):
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
        builder = REPORT_BUILDERS.get(slug)
        if not builder:
            return jsonify({"error": "Relatório não encontrado"}), 404

        with session_scope() as session:
            data = builder(session)
        return jsonify({"relatorio": slug, "dados": data})

    parent.register_blueprint(bp)
