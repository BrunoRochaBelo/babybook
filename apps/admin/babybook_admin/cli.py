from __future__ import annotations

from pathlib import Path
from typing import Optional

import typer
from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from rich.console import Console

from . import seeds

console = Console()
app = typer.Typer(help="Ferramentas operacionais do Baby Book")

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


if __name__ == "__main__":
    app()
