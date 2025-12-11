"""PDF ingestion helpers used by the uploads endpoint."""
from __future__ import annotations

from dataclasses import dataclass, field
import re
from pathlib import Path
from typing import Iterable, Sequence
from unicodedata import normalize as u_normalize
from uuid import uuid4

import pdfplumber
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.database import SessionLocal
from ..models import Aluno, Nota
from .accounts import ensure_aluno_user


@dataclass(slots=True)
class ParsedNotaRecord:
    disciplina: str
    disciplina_normalizada: str
    trimestre1: float | None = None
    trimestre2: float | None = None
    trimestre3: float | None = None
    total: float | None = None
    faltas: int | None = None
    situacao: str | None = None


@dataclass(slots=True)
class ParsedAlunoRecord:
    matricula: str
    nome: str
    turma: str | None
    turno: str | None
    notas: list[ParsedNotaRecord] = field(default_factory=list)


STUDENT_META_PATTERN = re.compile(
    r"Aluno\(a\):\s*(?P<nome>.+?)\s+Matr[ií]cula:\s*(?P<matricula>\d+)",
    re.IGNORECASE | re.DOTALL,
)


def enqueue_pdf(filepath: Path, *, turno: str | None = None, turma: str | None = None) -> str:
    job_id = uuid4().hex
    logger.info("Processando boletim {} para {}-{}", filepath.name, turno, turma)
    process_pdf(filepath, turno=turno, turma=turma)
    return job_id


def process_pdf(filepath: Path, *, turno: str | None = None, turma: str | None = None) -> int:
    records = parse_pdf(filepath, turno=turno, turma=turma)
    if not records:
        logger.warning("Nenhum registro encontrado no boletim {}", filepath)
        return 0
    return apply_records(records)


def apply_records(records: Sequence[ParsedAlunoRecord]) -> int:
    if not records:
        return 0
    session = SessionLocal()
    try:
        for record in records:
            aluno = _upsert_aluno(session, record)
            _upsert_notas(session, aluno, record.notas)
        session.commit()
        return len(records)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def parse_pdf(filepath: Path, *, turno: str | None = None, turma: str | None = None) -> list[ParsedAlunoRecord]:
    parsed: dict[str, ParsedAlunoRecord] = {}
    with pdfplumber.open(str(filepath)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            tables = page.extract_tables() or []
            student_metas = _extract_student_meta(text)
            if not student_metas:
                logger.warning("Página %s sem metadados em %s", page.page_number, filepath)
                continue

            for idx, meta in enumerate(student_metas):
                matricula = meta.get("matricula")
                if not matricula:
                    logger.warning("Página %s sem matrícula em %s", page.page_number, filepath)
                    continue

                registro = parsed.setdefault(
                    matricula,
                    ParsedAlunoRecord(
                        matricula=matricula,
                        nome=meta.get("nome") or "Aluno sem nome",
                        turma=meta.get("turma") or turma,
                        turno=meta.get("turno") or turno,
                    ),
                )
                if meta.get("nome"):
                    registro.nome = meta["nome"].strip()
                if meta.get("turma"):
                    registro.turma = meta["turma"]
                elif turma:
                    registro.turma = turma
                if meta.get("turno"):
                    registro.turno = meta["turno"]
                elif turno:
                    registro.turno = turno

                table_rows: Sequence[Sequence[Sequence[str | None]]] = []
                if idx < len(tables) and tables[idx]:
                    table_rows = [tables[idx]]

                for row in _extract_rows(table_rows):
                    disciplina = row.get("disciplina")
                    if not disciplina:
                        continue
                    registro.notas.append(
                        ParsedNotaRecord(
                            disciplina=disciplina.strip(),
                            disciplina_normalizada=_normalize_disciplina(disciplina),
                            trimestre1=_parse_float(row.get("trimestre1")),
                            trimestre2=_parse_float(row.get("trimestre2")),
                            trimestre3=_parse_float(row.get("trimestre3")),
                            total=_parse_float(row.get("total")),
                            faltas=_parse_int(row.get("faltas")),
                            situacao=_clean_text(row.get("situacao")),
                        )
                    )
    return list(parsed.values())


def _extract_student_meta(text: str) -> list[dict[str, str | None]]:
    metas = _extract_student_meta_blocks(text)
    if metas:
        return metas
    fallback = _extract_single_student_meta(text)
    return [fallback] if fallback.get("matricula") else []


def _extract_student_meta_blocks(text: str) -> list[dict[str, str | None]]:
    if not text:
        return []
    matches = list(STUDENT_META_PATTERN.finditer(text))
    if not matches:
        return []
    metas: list[dict[str, str | None]] = []
    for idx, match in enumerate(matches):
        start = match.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        block = text[start:end]
        turma_line = next((line for line in block.split("\n") if line.strip().lower().startswith("turma:")), "")
        turma_name = None
        turno_name = None
        if turma_line:
            turma_content = turma_line.split(":", 1)[1].strip()
            principal = turma_content.split("- -")[0].strip()
            turma_name, turno_name = _split_turma_turno(principal)
        metas.append(
            {
                "nome": match.group("nome").strip(),
                "matricula": match.group("matricula").strip(),
                "turma": turma_name,
                "turno": turno_name,
            }
        )
    return metas


def _extract_single_student_meta(text: str) -> dict[str, str | None]:
    meta: dict[str, str | None] = {"matricula": None, "nome": None, "turma": None, "turno": None}
    if not text:
        return meta
    single_line = " ".join(text.split())
    aluno_match = STUDENT_META_PATTERN.search(single_line)
    if aluno_match:
        meta["nome"] = aluno_match.group("nome").strip()
        meta["matricula"] = aluno_match.group("matricula").strip()

    turma_line = next((line for line in text.split("\n") if line.strip().lower().startswith("turma:")), "")
    if turma_line:
        turma_content = turma_line.split(":", 1)[1].strip()
        principal = turma_content.split("- -")[0].strip()
        turma_name, turno_name = _split_turma_turno(principal)
        meta["turma"] = turma_name
        meta["turno"] = turno_name

    return meta


def _split_turma_turno(value: str) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    tokens = value.split()
    if not tokens:
        return None, None
    turno_tokens = {"MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL"}
    turno = None
    if tokens[-1].upper() in turno_tokens:
        turno = tokens[-1].capitalize()
        tokens = tokens[:-1]
    turma = " ".join(tokens).strip()
    return (turma or None, turno)


def _extract_rows(tables: Sequence[Sequence[Sequence[str | None]]]) -> Iterable[dict[str, str]]:
    for table in tables:
        if not table:
            continue
        header = [_normalize_header(cell) for cell in table[0]]
        for raw_row in table[1:]:
            row: dict[str, str] = {}
            for idx, cell in enumerate(raw_row):
                key = header[idx] if idx < len(header) else None
                if not key:
                    continue
                value = (cell or "").strip()
                if value:
                    row[key] = value
            if row:
                yield row


def _upsert_aluno(session: Session, record: ParsedAlunoRecord) -> Aluno:
    stmt = select(Aluno).where(Aluno.matricula == record.matricula)
    aluno = session.execute(stmt).scalar_one_or_none()
    if aluno is None:
        aluno = Aluno(
            matricula=record.matricula,
            nome=record.nome,
            turma=record.turma or "",
            turno=record.turno or "",
        )
        session.add(aluno)
        session.flush()
        ensure_aluno_user(session, aluno)
        return aluno
    aluno.nome = record.nome or aluno.nome
    if record.turma:
        aluno.turma = record.turma
    if record.turno:
        aluno.turno = record.turno
    ensure_aluno_user(session, aluno)
    return aluno


def _upsert_notas(session: Session, aluno: Aluno, notas: Sequence[ParsedNotaRecord]) -> None:
    for nota_data in notas:
        stmt = select(Nota).where(
            Nota.aluno_id == aluno.id,
            Nota.disciplina_normalizada == nota_data.disciplina_normalizada,
        )
        existing = session.execute(stmt).scalars().all()
        nota = existing[0] if existing else None
        for duplicate in existing[1:]:
            session.delete(duplicate)
        if nota is None:
            nota = Nota(
                aluno_id=aluno.id,
                disciplina=nota_data.disciplina,
                disciplina_normalizada=nota_data.disciplina_normalizada,
            )
            session.add(nota)
        else:
            nota.disciplina = nota_data.disciplina
        nota.trimestre1 = nota_data.trimestre1
        nota.trimestre2 = nota_data.trimestre2
        nota.trimestre3 = nota_data.trimestre3
        nota.total = nota_data.total
        nota.faltas = nota_data.faltas or 0
        nota.situacao = nota_data.situacao


def _normalize_header(value: str | None) -> str | None:
    if not value:
        return None
    key = _slugify(value)
    aliases = {
        "matr": "matricula",
        "matricula": "matricula",
        "aluno": "nome",
        "alunoa": "nome",
        "estudante": "nome",
        "nome": "nome",
        "disciplina": "disciplina",
        "componentes-curriculares": "disciplina",
        "turma": "turma",
        "turno": "turno",
        "trimestre1": "trimestre1",
        "1-trimestre": "trimestre1",
        "1o-trimestre": "trimestre1",
        "primeiro-trimestre": "trimestre1",
        "trimestre2": "trimestre2",
        "2-trimestre": "trimestre2",
        "2o-trimestre": "trimestre2",
        "segundo-trimestre": "trimestre2",
        "trimestre3": "trimestre3",
        "3-trimestre": "trimestre3",
        "3o-trimestre": "trimestre3",
        "terceiro-trimestre": "trimestre3",
        "total": "total",
        "total-de-pontos": "total",
        "recuperacao": "recuperacao",
        "t-faltas": "faltas",
        "faltas": "faltas",
        "situacao": "situacao",
    }
    return aliases.get(key)


def _normalize_disciplina(value: str) -> str:
    return _slugify(value)


def _slugify(value: str) -> str:
    if not value:
        return ""
    normalized = u_normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.strip().lower()
    ascii_value = re.sub(r"[^a-z0-9]+", "-", ascii_value)
    return ascii_value.strip("-")


def _parse_float(value: str | None) -> float | None:
    if not value:
        return None
    value = value.replace("%", "").replace(",", ".")
    try:
        return float(value)
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    if not value:
        return None
    digits = re.sub(r"[^0-9-]", "", value)
    if not digits:
        return None
    try:
        return int(digits)
    except ValueError:
        return None


def _clean_text(value: str | None) -> str | None:
    if not value:
        return None
    text = value.strip()
    return text or None
