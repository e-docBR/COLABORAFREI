from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import select, desc, or_

from ...core.database import session_scope
from ...models import Comunicado, Aluno, Usuario

def register(parent: Blueprint) -> None:
    bp = Blueprint("comunicados", __name__)

    @bp.get("/comunicados")
    @jwt_required()
    def list_comunicados():
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        roles = claims.get("roles", [])
        with session_scope() as session:
            has_permission = any(r in ["admin", "professor", "coordenacao", "direcao"] for r in roles)
            if has_permission:
                # Admins/Staff see all messages they authored OR all messages if admin
                stm = select(Comunicado).order_by(desc(Comunicado.data_envio))
                # Optionally filter by author if not full admin? For now, let staff see all.
            else:
                aluno_id = claims.get("aluno_id")
                # Aluno/Responsavel sees:
                # 1. Target = TODOS
                # 2. Target = TURMA:<sua_turma>
                # 3. Target = ALUNO:<seu_id>
                
                # We need to find the student's turma first
                turma_slug = None
                if aluno_id:
                    aluno = session.get(Aluno, aluno_id)
                    if aluno and aluno.turma:
                         # Normalize turma to slug-like if needed, but we store exact string in target often
                         # Let's assume target_value matches 'turma' field for now
                         turma_slug = aluno.turma

                # User requested strictly class-related messages (plus personal)
                filters = []
                if turma_slug:
                    filters.append((Comunicado.target_type == "TURMA") & (Comunicado.target_value == turma_slug))
                if aluno_id:
                    filters.append((Comunicado.target_type == "ALUNO") & (Comunicado.target_value == str(aluno_id)))
                
                if not filters:
                     stm = select(Comunicado).where(1 == 0) # No match
                else:
                     stm = select(Comunicado).where(or_(*filters)).order_by(desc(Comunicado.data_envio))

            results = session.execute(stm).scalars().all()
            return jsonify([comm.to_dict() for comm in results])

    @bp.post("/comunicados")
    @jwt_required()
    def create_comunicado():
        claims = get_jwt()
        roles = claims.get("roles", [])
        if "admin" not in roles and "professor" not in roles and "coordenacao" not in roles and "direcao" not in roles:
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        if not data.get("titulo") or not data.get("conteudo"):
            return jsonify({"error": "Campos obrigatórios: titulo, conteudo"}), 400

        user_id = int(get_jwt_identity())
        
        with session_scope() as session:
            novo = Comunicado(
                titulo=data["titulo"],
                conteudo=data["conteudo"],
                autor_id=user_id,
                target_type=data.get("target_type", "TODOS"),
                target_value=data.get("target_value")
            )
            session.add(novo)
        
        return jsonify({"message": "Comunicado enviado!"}), 201

    @bp.patch("/comunicados/<int:comunicado_id>")
    @jwt_required()
    def update_comunicado(comunicado_id: int):
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "direcao"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        user_id = int(get_jwt_identity())

        with session_scope() as session:
            comunicado = session.get(Comunicado, comunicado_id)
            if not comunicado:
                return jsonify({"error": "Comunicado não encontrado"}), 404
            
            # Check ownership if not admin? 
            # Let's simple check: Admin/Coord/Direcao can edit all. Professor only own?
            # For simplicity, let staff edit.
            
            if "titulo" in data:
                comunicado.titulo = data["titulo"]
            if "conteudo" in data:
                comunicado.conteudo = data["conteudo"]
            if "arquivado" in data:
                comunicado.arquivado = bool(data["arquivado"])
            
            # Audit could be added here similar to Ocorrencias

            session.add(comunicado)
        
        return jsonify({"message": "Atualizado com sucesso"}), 200

    @bp.delete("/comunicados/<int:comunicado_id>")
    @jwt_required()
    def delete_comunicado(comunicado_id: int):
        claims = get_jwt()
        roles = claims.get("roles", [])
        if "admin" not in roles and "coordenacao" not in roles:
             # Let's say only admin/coord can delete globally. Or author.
             pass

        user_id = int(get_jwt_identity())
        
        with session_scope() as session:
            comunicado = session.get(Comunicado, comunicado_id)
            if not comunicado:
                return jsonify({"error": "Comunicado não encontrado"}), 404
            
            # Permission check: Admin/Coord or Author
            has_permission = "admin" in roles or "coordenacao" in roles or comunicado.autor_id == user_id
            if not has_permission:
                return jsonify({"error": "Acesso negado"}), 403

            session.delete(comunicado)
        
        return jsonify({"message": "Removido com sucesso"}), 200

    parent.register_blueprint(bp)
