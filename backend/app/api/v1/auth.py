"""Auth endpoints."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from ...core.database import session_scope
from ...core.security import generate_tokens, verify_password
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
        tokens = generate_tokens(identity=str(user.id), roles=roles)
        return jsonify(
            {
                **tokens,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "is_admin": user.is_admin,
                },
            }
        )

    @bp.post("/auth/refresh")
    @jwt_required(refresh=True)
    def refresh():
        identity = get_jwt_identity()
        roles = get_jwt().get("roles", [])
        tokens = generate_tokens(identity=identity, roles=roles)
        return jsonify(tokens)

    @bp.post("/auth/logout")
    @jwt_required()
    def logout():
        return ("", 204)

    parent.register_blueprint(bp)
