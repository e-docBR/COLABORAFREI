"""Versioned API blueprint."""
from flask import Blueprint

from . import alunos, auth, dashboard, graficos, notas, relatorios, turmas, uploads, usuarios, comunicados, ocorrencias, audit, chat, academic_years, super_admin

api_v1_bp = Blueprint("api_v1", __name__)

@api_v1_bp.before_request
def before_v1_request():
    from app.core.middleware import resolve_tenant_context
    # Bypass for super_admin routes if needed
    if request.blueprint == "api_v1.super_admin":
        return None
    return resolve_tenant_context()

alunos.register(api_v1_bp)
auth.register(api_v1_bp)
dashboard.register(api_v1_bp)
graficos.register(api_v1_bp)
notas.register(api_v1_bp)
relatorios.register(api_v1_bp)
turmas.register(api_v1_bp)
uploads.register(api_v1_bp)
usuarios.register(api_v1_bp)
comunicados.register(api_v1_bp)
ocorrencias.register(api_v1_bp)
audit.register(api_v1_bp)
chat.register(api_v1_bp)
academic_years.register(api_v1_bp)
super_admin.register(api_v1_bp)
