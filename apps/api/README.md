# Baby Book API

Serviço FastAPI stateless responsável por RBAC, quotas e contratos OpenAPI.

```bash
cd apps/api
uv venv
source .venv/bin/activate
uv pip install -r pyproject.toml
uvicorn babybook_api.main:app --reload --port 8000
```

Os testes locais ficam em `apps/api/babybook_api/tests` e os contratos expostos em `/openapi.json`.
