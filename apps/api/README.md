# Baby Book API

Serviço FastAPI stateless responsável por RBAC, quotas e contratos OpenAPI.

```bash
cd apps/api
# Crie o ambiente virtual e instale dependências em modo editável. A raiz do repo também fornece helpers:
# Windows
pnpm run setup:py:win
# macOS / Linux
pnpm run setup:py:unix

# Ative o venv manualmente (opcional):
# Windows PowerShell
& .\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# Inicie a API em dev
python -m uvicorn babybook_api.main:app --app-dir apps/api --reload --port 8000
```

Os testes locais ficam em `apps/api/babybook_api/tests` e os contratos expostos em `/openapi.json`.
