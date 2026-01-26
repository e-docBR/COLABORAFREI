"""Alunos endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, jwt_required

from ...core.database import session_scope
from ...services.aluno_service import AlunoService


def register(parent: Blueprint) -> None:
    bp = Blueprint("alunos", __name__)

    @bp.get("/alunos")
    @jwt_required()
    def list_alunos():
        if "aluno" in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso restrito"}), 403
            
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(10000, int(request.args.get("per_page", 20)))
        turno = request.args.get("turno")
        turma = request.args.get("turma")
        query_text = request.args.get("q")

        with session_scope() as session:
            service = AlunoService(session)
            result = service.list_alunos(
                page=page,
                per_page=per_page,
                turno=turno,
                turma=turma,
                query_text=query_text
            )
            
            # Pydantic v2 use model_dump
            return jsonify(result.model_dump())

    @bp.get("/alunos/<int:aluno_id>")
    @jwt_required()
    def retrieve_aluno(aluno_id: int):
        claims = get_jwt()
        aluno_claim_id = claims.get("aluno_id")
        
        if "aluno" in (claims.get("roles") or []):
            if not aluno_claim_id or int(aluno_claim_id) != int(aluno_id):
                return jsonify({"error": "Acesso restrito"}), 403
                
        with session_scope() as session:
            service = AlunoService(session)
            aluno_detail = service.get_aluno_details(aluno_id)
            
            if not aluno_detail:
                return jsonify({"error": "Aluno não encontrado"}), 404

            return jsonify(aluno_detail.model_dump())

    @bp.post("/alunos")
    @jwt_required()
    def create_aluno():
        if "admin" not in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso negado. Apenas administradores podem criar alunos."}), 403
            
        data = request.get_json()
        with session_scope() as session:
            service = AlunoService(session)
            aluno = service.create_aluno(data)
            return jsonify(aluno.model_dump()), 201

    @bp.patch("/alunos/<int:aluno_id>")
    @jwt_required()
    def update_aluno(aluno_id: int):
        if "admin" not in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso negado. Apenas administradores podem editar alunos."}), 403
            
        data = request.get_json()
        with session_scope() as session:
            service = AlunoService(session)
            aluno = service.update_aluno(aluno_id, data)
            if not aluno:
                return jsonify({"error": "Aluno não encontrado"}), 404
            return jsonify(aluno.model_dump())

    @bp.delete("/alunos/<int:aluno_id>")
    @jwt_required()
    def delete_aluno(aluno_id: int):
        if "admin" not in (get_jwt().get("roles") or []):
            return jsonify({"error": "Acesso negado. Apenas administradores podem excluir alunos."}), 403
            
        with session_scope() as session:
            service = AlunoService(session)
            if service.delete_aluno(aluno_id):
                return "", 204
            return jsonify({"error": "Aluno não encontrado"}), 404

    parent.register_blueprint(bp)

