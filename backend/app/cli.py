"""Custom Flask CLI commands for database lifecycle."""
import random
from decimal import Decimal

import click

from .core.database import Base, engine, session_scope
from .core.security import hash_password
from .models import Aluno, Nota, Usuario, Tenant, AcademicYear
from .services.accounts import ensure_aluno_user


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

    @app.cli.command("drop-db")
    def drop_db_command():
        """Drop all database tables."""
        if click.confirm("This will delete ALL data. Continue?", abort=True):
            Base.metadata.drop_all(bind=engine)
            click.secho("Database schema dropped.", fg="red")

    @app.cli.command("seed-demo")
    def seed_demo_command():
        """Populate the database with demo data for local development."""
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            # Create default Tenant and Academic Year
            tenant = session.query(Tenant).filter(Tenant.slug == "default").first()
            if not tenant:
                tenant = Tenant(name="Escola ColaboraFREI", slug="default")
                session.add(tenant)
                session.flush()

            year = session.query(AcademicYear).filter(AcademicYear.tenant_id == tenant.id, AcademicYear.label == "2026").first()
            if not year:
                year = AcademicYear(tenant_id=tenant.id, label="2026", is_current=True)
                session.add(year)
                session.flush()

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
                        tenant_id=tenant.id,
                        academic_year_id=year.id,
                    )
                    session.add(aluno)
                    alunos.append(aluno)
            session.flush()

            for aluno in alunos:
                ensure_aluno_user(session, aluno)

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
                            tenant_id=tenant.id,
                            academic_year_id=year.id,
                        )
                    )

            admin = session.query(Usuario).filter(Usuario.username == "admin").first()
            if not admin:
                admin = Usuario(
                    username="admin",
                    password_hash=hash_password("admin"),
                    role="admin",
                    is_admin=True,
                    tenant_id=tenant.id
                )
                session.add(admin)
            click.secho("Demo data seeded (includes admin/admin).", fg="green")
