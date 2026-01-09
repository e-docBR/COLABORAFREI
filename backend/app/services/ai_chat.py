from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from ..models import Aluno, Nota
from ..core.database import SessionLocal

def process_chat_message(message: str) -> str:
    message = message.lower()
    session = SessionLocal()
    try:
        if "total de alunos" in message or "quantos alunos" in message:
            count = session.execute(select(func.count(Aluno.id))).scalar_one()
            return f"Atualmente temos {count} alunos matriculados."

        if "reprovado" in message or "risco" in message:
            # Simple heuristic: Grade < 60
            risky = session.execute(
                select(Aluno.nome, func.avg(Nota.total).label("media"))
                .join(Nota)
                .group_by(Aluno.id)
                .having(func.avg(Nota.total) < 60)
                .limit(5)
            ).all()
            if not risky:
                return "Não encontrei alunos com média abaixo de 60 neste momento."
            names = ", ".join([f"{r.nome} ({round(r.media, 1)})" for r in risky])
            return f"Aqui estão alguns alunos em risco (média < 60): {names}..."

        if "melhor aluno" in message or "maior nota" in message:
             best = session.execute(
                select(Aluno.nome, func.avg(Nota.total).label("media"))
                .join(Nota)
                .group_by(Aluno.id)
                .order_by(desc("media"))
                .limit(1)
            ).first()
             if best:
                 return f"O aluno com maior média é {best.nome} com {round(best.media, 1)}."
             return "Não consegui calcular as médias."

        return "Desculpe, ainda estou aprendendo. Tente perguntar 'quantos alunos', 'quem está reprovado' ou 'melhor aluno'."
    finally:
        session.close()
