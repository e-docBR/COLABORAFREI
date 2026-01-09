from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import select, desc

from ...core.database import session_scope
from ...models import Ocorrencia, Aluno

def register(parent: Blueprint) -> None:
    bp = Blueprint("ocorrencias", __name__)

    @bp.get("/ocorrencias")
    @jwt_required()
    def list_ocorrencias():
        # Optional filter by aluno_id query param
        req_aluno_id = request.args.get("aluno_id")
        
        claims = get_jwt()
        roles = claims.get("roles", [])
        user_aluno_id = claims.get("aluno_id") # If student logged in

        with session_scope() as session:
            stm = select(Ocorrencia).order_by(desc(Ocorrencia.data_ocorrencia))

            # Access Control
            is_staff = any(r in ["admin", "professor", "coordenacao", "direcao"] for r in roles)
            if not is_staff:
                # Student can only see their own
                if not user_aluno_id:
                    return jsonify([]), 200
                stm = stm.where(Ocorrencia.aluno_id == user_aluno_id)
            else:
                # Staff can see all, or filter by specific student
                if req_aluno_id:
                    stm = stm.where(Ocorrencia.aluno_id == int(req_aluno_id))

            results = session.execute(stm).scalars().all()
            return jsonify([o.to_dict() for o in results])

    @bp.post("/ocorrencias")
    @jwt_required()
    def create_ocorrencia():
        claims = get_jwt()
        roles = claims.get("roles", [])
        if not any(r in ["admin", "professor", "coordenacao", "direcao"] for r in roles):
            return jsonify({"error": "Acesso negado"}), 403

        data = request.json or {}
        if not data.get("aluno_id") or not data.get("tipo") or not data.get("descricao"):
            return jsonify({"error": "Campos obrigatórios: aluno_id, tipo, descricao"}), 400

        user_id = int(get_jwt_identity())
        
        try:
            # Parse date or use now
            dt_str = data.get("data_ocorrencia")
            dt = datetime.fromisoformat(dt_str) if dt_str else datetime.now()
        except:
            dt = datetime.now()

        with session_scope() as session:
            novo = Ocorrencia(
                aluno_id=int(data["aluno_id"]),
                autor_id=user_id,
                tipo=data["tipo"],
                descricao=data["descricao"],
                data_ocorrencia=dt
            )
            session.add(novo)
            session.flush() # To get ID
            
            # Audit
            from ...services import log_action
            log_action(
                session, 
                user_id, 
                "CREATE", 
                "Ocorrencia", 
                novo.id, 
                {"tipo": novo.tipo, "aluno_id": novo.aluno_id}
            )
        
        return jsonify({"message": "Ocorrência registrada!"}), 201

    parent.register_blueprint(bp)
