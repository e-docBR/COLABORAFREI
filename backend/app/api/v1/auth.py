"""Auth endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from ...core.database import session_scope
from ...core.security import generate_tokens, hash_password, verify_password
from ...models import Usuario


def register(parent: Blueprint) -> None:
    bp = Blueprint("auth", __name__)

    @bp.post("/auth/login")
    def login():
        payload = request.get_json() or {}
        username = payload.get("username")
        password = payload.get("password")
        if not username or not password:
            return jsonify({"error": "Credenciais obrigatórias"}), 400

        with session_scope() as session:
            user = session.query(Usuario).filter(Usuario.username == username).first()

        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Usuário ou senha inválidos"}), 401

        roles = [user.role] if user.role else []
        extra_claims = {"aluno_id": user.aluno_id}
        tokens = generate_tokens(identity=str(user.id), roles=roles, extra_claims=extra_claims)
        return jsonify(
            {
                **tokens,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "is_admin": user.is_admin,
                    "aluno_id": user.aluno_id,
                    "photo_url": user.photo_url,
                    "must_change_password": user.must_change_password,
                },
            }
        )

    @bp.post("/auth/refresh")
    @jwt_required(refresh=True)
    def refresh():
        identity = get_jwt_identity()
        jwt_data = get_jwt()
        roles = jwt_data.get("roles", [])
        extra_claims = {"aluno_id": jwt_data.get("aluno_id")}
        tokens = generate_tokens(identity=identity, roles=roles, extra_claims=extra_claims)
        return jsonify(tokens)

    @bp.post("/auth/logout")
    @jwt_required()
    def logout():
        return ("", 204)

    @bp.post("/auth/change-password")
    @jwt_required()
    def change_password():
        payload = request.get_json() or {}
        current_password = payload.get("current_password")
        new_password = payload.get("new_password")

        if not current_password or not new_password:
            return jsonify({"error": "Campos obrigatórios: senha atual e nova senha"}), 400

        user_id = get_jwt_identity()
        print(f"DEBUG: change_password user_id={user_id} type={type(user_id)}")
        with session_scope() as session:
            all_users = session.query(Usuario).all()
            print(f"DEBUG: all users: {[u.id for u in all_users]}")
            user = session.get(Usuario, int(user_id))
            print(f"DEBUG: user found={user}")
            if not user:
                return jsonify({"error": "Usuário não encontrado"}), 404
            if not verify_password(current_password, user.password_hash):
                return jsonify({"error": "Senha atual inválida"}), 400
            user.password_hash = hash_password(new_password)
            user.must_change_password = False
            session.add(user)

        return ("", 204)

    parent.register_blueprint(bp)
