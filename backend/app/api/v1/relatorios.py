"""Relatório endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func

from ...core.database import session_scope
from ...models import Aluno, Nota


def _apply_aluno_filters(query, turno: str | None, serie: str | None, turma: str | None):
    if turno:
        query = query.filter(func.upper(Aluno.turno) == turno.strip().upper())
    if turma:
        query = query.filter(Aluno.turma == turma.strip())
    if serie:
        serie_limpa = serie.strip()
        if serie_limpa:
            query = query.filter(Aluno.turma.ilike(f"{serie_limpa}%"))
    return query


def build_turmas_mais_faltas(session, turno: str | None = None, serie: str | None = None, turma: str | None = None):
    query = (
        session.query(Aluno.turma, func.sum(Nota.faltas).label("faltas"))
        .join(Nota)
        .group_by(Aluno.turma)
        .order_by(func.sum(Nota.faltas).desc())
        .limit(10)
    )
    query = _apply_aluno_filters(query, turno, serie, turma)
    return [
        {"turma": turma, "faltas": int(faltas or 0)}
        for turma, faltas in query.all()
    ]


def build_melhores_medias(session, turno: str | None = None, serie: str | None = None, turma: str | None = None):
    query = (
        session.query(Aluno.turma, Aluno.turno, func.avg(Nota.total).label("media"))
        .join(Nota)
        .group_by(Aluno.turma, Aluno.turno)
        .order_by(func.avg(Nota.total).desc())
        .limit(10)
    )
    query = _apply_aluno_filters(query, turno, serie, turma)
    return [
        {
            "turma": turma,
            "turno": turno,
            "media": round(float(media or 0), 2),
        }
        for turma, turno, media in query.all()
    ]


def build_alunos_em_risco(session, turno: str | None = None, serie: str | None = None, turma: str | None = None):
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
    subquery = _apply_aluno_filters(subquery, turno, serie, turma)
    return [
        {"nome": nome, "turma": turma, "media": round(float(media), 2)}
        for nome, turma, media in subquery.all()
    ]


def build_disciplinas_notas_baixas(
    session,
    turno: str | None = None,
    serie: str | None = None,
    turma: str | None = None,
):
    # Mapeamento de disciplinas para normalização
    normalizacao = {
        "ARTES": "ARTE",
        "INGLÊS": "LÍNGUA INGLESA",
        "INGLES": "LÍNGUA INGLESA",
        "LÍNGUA PORTUGUÊSA": "LÍNGUA PORTUGUESA",
        "LINGUA PORTUGUESA": "LÍNGUA PORTUGUESA",
    }
    
    query = (
        session.query(Nota.disciplina, func.avg(Nota.total).label("media"))
        .join(Aluno)
        .group_by(Nota.disciplina)
        .order_by(func.avg(Nota.total))
    )
    query = _apply_aluno_filters(query, turno, serie, turma)
    
    # Agrupa por disciplina normalizada
    disciplinas_map = {}
    for disciplina, media in query.all():
        disc_normalizada = normalizacao.get(disciplina.upper(), disciplina)
        if disc_normalizada not in disciplinas_map:
            disciplinas_map[disc_normalizada] = []
        disciplinas_map[disc_normalizada].append(float(media))
    
    # Calcula média para cada disciplina normalizada
    result = []
    for disciplina, medias in disciplinas_map.items():
        media_final = sum(medias) / len(medias)
        result.append({"disciplina": disciplina, "media": round(media_final, 1)})
    
    # Ordena por média crescente
    result.sort(key=lambda x: x["media"])
    return result


def build_melhores_alunos(session, turno: str | None = None, serie: str | None = None, turma: str | None = None):
    query = (
        session.query(
            Aluno.nome,
            Aluno.turma,
            Aluno.turno,
            func.avg(Nota.total).label("media"),
        )
        .join(Nota)
        .group_by(Aluno.id, Aluno.nome, Aluno.turma, Aluno.turno)
        .order_by(func.avg(Nota.total).desc())
        .limit(10)
    )
    query = _apply_aluno_filters(query, turno, serie, turma)
    return [
        {
            "nome": nome,
            "turma": turma_nome,
            "turno": turno_nome,
            "media": round(float(media or 0), 2),
        }
        for nome, turma_nome, turno_nome, media in query.all()
    ]


REPORT_BUILDERS = {
    "turmas-mais-faltas": build_turmas_mais_faltas,
    "melhores-medias": build_melhores_medias,
    "alunos-em-risco": build_alunos_em_risco,
    "disciplinas-notas-baixas": build_disciplinas_notas_baixas,
    "melhores-alunos": build_melhores_alunos,
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

        turno = request.args.get("turno") or None
        serie = request.args.get("serie") or None
        turma = request.args.get("turma") or None

        with session_scope() as session:
            data = builder(session, turno=turno, serie=serie, turma=turma)
        return jsonify({"relatorio": slug, "dados": data})

    parent.register_blueprint(bp)
