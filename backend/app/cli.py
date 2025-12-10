"""Custom Flask CLI commands for database lifecycle."""
import random
from decimal import Decimal

import click

from .core.database import Base, engine, session_scope
from .core.security import hash_password
from .models import Aluno, Nota, Usuario


TURMAS = [
    ("6º A", "Matutino"),
    ("7º B", "Vespertino"),
    ("8º C", "Noturno"),
]
DISCIPLINAS = [
    "Matemática",
    "Língua Portuguesa",
    "Ciências",
    "História",
    "Geografia",
]


def register_cli(app):
    @app.cli.command("init-db")
    def init_db_command():
        """Create database tables using SQLAlchemy metadata."""
        Base.metadata.create_all(bind=engine)
        click.secho("Database schema initialized.", fg="green")

    @app.cli.command("seed-demo")
    def seed_demo_command():
        """Populate the database with demo data for local development."""
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            if session.query(Aluno).count() > 0:
                click.secho("Demo data already exists, skipping seeding.", fg="yellow")
                return

            alunos: list[Aluno] = []
            for idx, (turma, turno) in enumerate(TURMAS, start=1):
                for seq in range(1, 9):
                    aluno = Aluno(
                        matricula=f"{idx}{seq:03}",
                        nome=f"Aluno {turma} #{seq}",
                        turma=turma,
                        turno=turno,
                    )
                    session.add(aluno)
                    alunos.append(aluno)
            session.flush()

            for aluno in alunos:
                for disciplina in DISCIPLINAS:
                    notas = [Decimal(str(random.uniform(12, 18))) for _ in range(3)]
                    total = sum(notas) / len(notas)
                    session.add(
                        Nota(
                            aluno_id=aluno.id,
                            disciplina=disciplina,
                            disciplina_normalizada=disciplina.upper(),
                            trimestre1=notas[0],
                            trimestre2=notas[1],
                            trimestre3=notas[2],
                            total=total,
                            faltas=random.randint(0, 10),
                            situacao="APR" if total >= 14 else "REC",
                        )
                    )

            admin = Usuario(
                username="admin",
                password_hash=hash_password("admin"),
                role="admin",
                is_admin=True,
            )
            session.add(admin)
            click.secho("Demo data seeded (includes admin/admin).", fg="green")
