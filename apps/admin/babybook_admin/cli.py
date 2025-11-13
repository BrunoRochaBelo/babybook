import typer
from rich.console import Console

console = Console()
app = typer.Typer(help="Ferramentas operacionais do Baby Book")


@app.command()
def migrate() -> None:
    console.print("[green]Executar migrações Alembic aqui[/green]")


@app.command()
def quota_report() -> None:
    console.print("Usuários com quota acima de 80% serão listados aqui.")


if __name__ == "__main__":
    app()
