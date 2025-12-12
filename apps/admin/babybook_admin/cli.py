from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import typer
from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from rich.console import Console
from rich.table import Table
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import WorkerJob
from . import seeds

console = Console()
app = typer.Typer(help="Ferramentas operacionais do Baby Book")
worker_app = typer.Typer(help="Operações com a fila dos workers")
app.add_typer(worker_app, name="worker-jobs")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ALEMBIC_INI = PROJECT_ROOT / "alembic.ini"


def _alembic_config(database_url: Optional[str]) -> AlembicConfig:
    cfg = AlembicConfig(str(ALEMBIC_INI))
    if database_url:
        cfg.set_main_option("sqlalchemy.url", database_url)
    return cfg


@app.command()
def migrate(
    target: str = typer.Option(
        "head",
        "--target",
        "-t",
        help="Revis�o alvo para upgrade (padr�o: head).",
    ),
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Override do banco usado na migra��o.",
    ),
) -> None:
    """Executa alembic upgrade."""
    cfg = _alembic_config(database_url)
    try:
        alembic_command.upgrade(cfg, target)
        console.print(f"[green]Migra��es aplicadas at� {target}[/green]")
    except Exception as exc:  # pragma: no cover
        console.print(f"[red]Falha ao executar migra��o:[/red] {exc}")
        raise typer.Exit(code=1) from exc


@app.command()
def downgrade(
    target: str = typer.Option(
        "-1",
        "--target",
        "-t",
        help="Revis�o alvo para downgrade (padr�o: revis�o anterior).",
    ),
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Override do banco usado na migra��o.",
    ),
) -> None:
    """Executa alembic downgrade."""
    cfg = _alembic_config(database_url)
    try:
        alembic_command.downgrade(cfg, target)
        console.print(f"[yellow]Downgrade executado at� {target}[/yellow]")
    except Exception as exc:  # pragma: no cover
        console.print(f"[red]Falha ao executar downgrade:[/red] {exc}")
        raise typer.Exit(code=1) from exc


@app.command()
def quota_report() -> None:
    console.print("Usu�rios com quota acima de 80% ser�o listados aqui.")


@app.command("seed-moment-templates")
def seed_templates(
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Banco alvo para o seed.",
    ),
) -> None:
    seeds.seed_moment_templates_command(database_url)


@app.command("seed-base-plan")
def seed_base_plan(
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Banco alvo para o seed.",
    ),
) -> None:
    seeds.seed_base_plan_command(database_url)


@app.command("seed-demo-data")
def seed_demo_data(
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Banco alvo para o seed.",
    ),
) -> None:
    seeds.seed_demo_data_command(database_url)


@app.command("seed-partner-data")
def seed_partner_data(
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Banco alvo para o seed.",
    ),
) -> None:
    """Cria usuário parceiro/fotógrafo de teste (pro@babybook.dev / pro123)."""
    seeds.seed_partner_data_command(database_url)


async def _fetch_worker_jobs(
    database_url: Optional[str],
    status: Optional[str],
    limit: int,
) -> list[WorkerJob]:
    async with seeds._session_scope(database_url) as session:  # type: ignore[attr-defined]
        stmt = select(WorkerJob).order_by(WorkerJob.available_at, WorkerJob.created_at).limit(limit)
        if status and status != "all":
            stmt = stmt.where(WorkerJob.status == status)
        result = await session.execute(stmt)
        return result.scalars().all()


@worker_app.command("list")
def worker_jobs_list(
    status: str = typer.Option(
        "pending",
        "--status",
        "-s",
        help="Status para filtrar (pending/running/failed/all).",
    ),
    limit: int = typer.Option(10, "--limit", "-l", help="Número máximo de jobs a exibir."),
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Banco alvo (padrão: settings.database_url).",
    ),
) -> None:
    jobs = asyncio.run(_fetch_worker_jobs(database_url, status, limit))
    if not jobs:
        console.print("[yellow]Nenhum job encontrado com o filtro informado.[/yellow]")
        raise typer.Exit()
    table = Table(title="worker_jobs", show_lines=False)
    table.add_column("ID")
    table.add_column("Kind")
    table.add_column("Status")
    table.add_column("Attempts", justify="right")
    table.add_column("Available At")
    table.add_column("Last Error")
    for job in jobs:
        table.add_row(
            str(job.id),
            job.kind,
            job.status,
            str(job.attempts),
            job.available_at.isoformat() if job.available_at else "-",
            (job.last_error or "")[:60],
        )
    console.print(table)


async def _replay_job(database_url: Optional[str], job_id: uuid.UUID) -> bool:
    async with seeds._session_scope(database_url) as session:  # type: ignore[attr-defined]
        job: WorkerJob | None = await session.get(WorkerJob, job_id)
        if job is None:
            return False
        job.status = "pending"
        job.available_at = datetime.now(timezone.utc)
        job.last_error = None
        await session.commit()
        return True


@worker_app.command("replay")
def worker_jobs_replay(
    job_id: str = typer.Argument(..., help="UUID do job a ser reprocessado."),
    database_url: Optional[str] = typer.Option(
        None,
        "--database-url",
        envvar="BABYBOOK_DATABASE_URL",
        help="Banco alvo (padrão: settings.database_url).",
    ),
) -> None:
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        console.print(f"[red]job_id inválido:[/red] {job_id}")
        raise typer.Exit(code=1)
    updated = asyncio.run(_replay_job(database_url, job_uuid))
    if not updated:
        console.print(f"[red]Job {job_id} não encontrado.[/red]")
        raise typer.Exit(code=1)
    console.print(f"[green]Job {job_id} marcado para retry.[/green]")


if __name__ == "__main__":
    app()
