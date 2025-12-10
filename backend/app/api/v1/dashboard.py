"""Dashboard analytics endpoints."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ...core.database import session_scope
from ...services import build_dashboard_metrics


def register(parent: Blueprint) -> None:
    bp = Blueprint("dashboard", __name__)

    @bp.get("/dashboard/kpis")
    @jwt_required()
    def fetch_kpis():
        with session_scope() as session:
            metrics = build_dashboard_metrics(session)
        return jsonify(metrics.to_dict())

    parent.register_blueprint(bp)
