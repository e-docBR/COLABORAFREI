"""Uploads endpoints for boletim PDFs."""
from pathlib import Path
import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

from ...core.config import settings
from ...services import enqueue_pdf


def register(parent: Blueprint) -> None:
    bp = Blueprint("uploads", __name__)

    @bp.post("/uploads/pdf")
    @jwt_required()
    def upload_boletim():
        if "file" not in request.files:
            return jsonify({"error": "arquivo não enviado"}), 400

        turno = (request.form.get("turno") or "").strip()
        turma = (request.form.get("turma") or "").strip()
        if not turno or not turma:
            return jsonify({"error": "turno e turma são obrigatórios"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({"error": "nome de arquivo inválido"}), 400

        upload_dir = Path(settings.upload_folder) / _normalize_segment(turno) / _normalize_segment(turma)
        upload_dir.mkdir(parents=True, exist_ok=True)
        filepath = upload_dir / filename
        file.save(filepath)

        job_id = enqueue_pdf(filepath, turno=turno, turma=turma)
        return (
            jsonify(
                {
                    "filename": filename,
                    "status": "queued",
                    "job_id": job_id,
                    "turno": turno,
                    "turma": turma,
                }
            ),
            202,
        )

    parent.register_blueprint(bp)


def _normalize_segment(value: str) -> str:
    slug = re.sub(r"[^0-9A-Za-z_-]+", "-", value.strip())
    return slug or "geral"
