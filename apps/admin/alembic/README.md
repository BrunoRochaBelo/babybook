# Alembic (Admin) — Legado / Não usar

Este diretório existe por legado.

## Fonte canônica de migrações

O banco de dados é **compartilhado** entre a API e o Admin, então precisamos de **uma única cadeia de migrações**.

Use sempre:

- Config: `apps/api/alembic.ini`
- Scripts: `apps/api/alembic/`
- Versions: `apps/api/alembic/versions/`

## Por que este diretório não deve ser usado?

Manter duas cadeias Alembic para o mesmo banco é arriscado (histórico divergente, versões inconsistentes e risco de DDL duplicado).

O CLI do admin (`python -m babybook_admin.cli migrate`) foi ajustado para executar as migrações canônicas da API.
