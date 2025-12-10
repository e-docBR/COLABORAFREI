"""Versioned API blueprint."""
from flask import Blueprint

from . import alunos, auth, dashboard, graficos, notas, relatorios, turmas, uploads

api_v1_bp = Blueprint("api_v1", __name__)

alunos.register(api_v1_bp)
auth.register(api_v1_bp)
dashboard.register(api_v1_bp)
graficos.register(api_v1_bp)
notas.register(api_v1_bp)
relatorios.register(api_v1_bp)
turmas.register(api_v1_bp)
uploads.register(api_v1_bp)
