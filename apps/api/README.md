# Baby Book API

Serviço FastAPI (stateless) responsável por regras de negócio, RBAC, quotas e contratos OpenAPI.

Este README foi expandido com um guia prático e um capítulo "Guia para Agentes de IA" que descreve padrões de código, estrutura e como operar localmente para contribuir automaticamente.

## Rápido para rodar (Dev)

```bash
cd apps/api
# Instala helpers e cria virtualenv (via pnpm helpers do monorepo)
# Windows
pnpm run setup:py:win
# macOS / Linux
pnpm run setup:py:unix

# Ative o venv (PowerShell)
& .\.venv\Scripts\Activate.ps1

# Rodar em modo dev
python -m uvicorn babybook_api.main:app --app-dir apps/api --reload --port 8000
```

## Estrutura do projeto (importante)

- `apps/api/babybook_api/` - código fonte principal
  - `main.py` - ponto de entrada FastAPI
  - `routes/` - definicões de rotas por domínio (vouchers, uploads, payments, auth)
  - `services/` - lógica de integração com storage, parceiros e provedores externos
  - `models/` - Pydantic schemas e DTOs
  - `db/` - inicializadores de DB, sessions e helpers (alembic integration points)
  - `tests/` - testes unitários e de integração (pytest)

## Contratos e OpenAPI

- OpenAPI gerado automaticamente em runtime: `GET /openapi.json`
- Tipos gerados a partir do OpenAPI são consumidos por frontend (packages/contracts). Ao alterar rotas/payloads:
  1.  Atualize Pydantic models em `models/` ou `schemas/`
  2.  Rode testes e verifique `/openapi.json`
  3.  Regenerate client types se necessário

## Migrações (Alembic)

- Migrações ficam em `apps/api/alembic/versions`
- **Fonte canônica**: use sempre este Alembic (`apps/api/alembic.ini`) para o banco compartilhado.
  - Observação: existem diretórios Alembic legados em outras apps; não use para evitar histórico divergente.
- Comandos comuns:
  - `alembic revision --autogenerate -m "add partners table"`
  - `alembic upgrade head`
  - `alembic downgrade -1`

### Importante: Portal do Parceiro — listagem de entregas

O endpoint `GET /partner/deliveries` suporta filtros server-side (busca, resgate, voucher, arquivadas etc.).

Para manter a listagem performática em bases grandes (staging/prod), garanta que a migration de índices foi aplicada:

- `0009_delivery_list_filter_indexes` (índices por `partner_id` para filtros comuns)

Ao atualizar a API em qualquer ambiente, rode:

- `alembic upgrade head`

### Bootstrap do zero (Postgres)

Este Alembic agora consegue subir um banco **vazio** do zero via `alembic upgrade head`.

- A migration `0000_core_schema` cria o schema core (accounts/users/assets/etc.)
- As migrations `0001+` criam/evoluem as tabelas B2B2C (partners/deliveries/vouchers/etc.) e ajustes incrementais.

### Nota sobre revision IDs encurtados (compat)

Para evitar erro com `alembic_version.version_num` limitado a `VARCHAR(32)`, alguns revision IDs foram encurtados:

- `0004_child_pce_credit_status_ledger` → `0004_child_pce_credit_ledger`
- `0007_delivery_credit_not_required` → `0007_delivery_credit_not_req`

Se você tiver um banco antigo que gravou os IDs longos em `alembic_version`, será necessário **stampar** o banco para o novo ID (ou atualizar `alembic_version` manualmente) antes de rodar upgrades futuros.

Mapeamento:

- `0004_child_pce_credit_status_ledger` → `0004_child_pce_credit_ledger`
- `0007_delivery_credit_not_required` → `0007_delivery_credit_not_req`

Em Postgres, o ajuste manual típico é (execute com cuidado):

- Atualizar 0004:
  - `UPDATE alembic_version SET version_num='0004_child_pce_credit_ledger' WHERE version_num='0004_child_pce_credit_status_ledger';`
- Atualizar 0007:
  - `UPDATE alembic_version SET version_num='0007_delivery_credit_not_req' WHERE version_num='0007_delivery_credit_not_required';`

Observação: em bases provisionadas com o default do Alembic (`alembic_version.version_num VARCHAR(32)`), esses IDs longos normalmente **nem chegam a ser gravados** (o upgrade falha antes). Nesse caso, basta usar a versão atual das migrations e rodar `alembic upgrade head` normalmente.

## Execução de testes

- Executar teste rápido:
  ```bash
  cd apps/api
  pytest -q
  ```

## Configuração por ambiente (staging/prod) — fail-fast

Este serviço usa `apps/api/babybook_api/settings.py` e **falha no startup** em `ENV=staging|production` se detectar configuração insegura.

Variáveis importantes:

- `ENV`: `staging` ou `production`
- `SECRET_KEY`: segredo forte (não-default)
- `SERVICE_API_TOKEN`: token de service account (não-default)
- `RESEND_API_KEY`: chave API Resend (para envio de e-mails/notificações)
- `BILLING_WEBHOOK_SECRET`: segredo do webhook do gateway (não-default)
- `SESSION_COOKIE_SECURE=true`
- `FRONTEND_URL` (https)
- `PUBLIC_BASE_URL` (https)
- `UPLOAD_URL_BASE` (https)
- `CORS_ORIGINS` (lista JSON, sem localhost, https)
  - Ex.: `CORS_ORIGINS=["https://app.babybook.com"]`
- `ALLOWED_HOSTS` (lista JSON, **obrigatória** em staging/prod; sem `*`/localhost)
  - Ex.: `ALLOWED_HOSTS=["api.babybook.com"]`
- `TRUSTED_PROXY_IPS` (lista JSON de IPs/CIDR dos proxies confiáveis)
  - Ex.: `TRUSTED_PROXY_IPS=["10.0.0.0/8","172.16.0.0/12","192.168.0.0/16"]`

Observação: `TRUSTED_PROXY_IPS` é o que impede spoof de `X-Forwarded-For` (rate limit/auditoria). Se você não estiver atrás de proxy (ou não usa `X-Forwarded-For`), pode manter vazio.

## Guia para Agentes de IA (contribuição automatizada)

Regras para qualquer automação (bots/agents) que gere PRs neste serviço FastAPI:

- Estrutura e naming:
  - Rotas em `routes/{domain}.py` exportando `router = APIRouter()`; use prefix e tags coerentes.
  - Serviços em `services/` devem ser `async def` para I/O-bound; prefira funções puras + DI via `Depends`.
  - Schemas em `models/` ou `schemas/` nomeados `*Request`, `*Response`, `*Schema`; valide inputs com `Field(..., min_length=, max_length=)`.
  - Respostas padrão: use `pydantic` para payloads, nunca retorne dicts livres.

- Erros, logging e observabilidade:
  - Use `HTTPException` com códigos corretos; para regras de negócio use 422 ou 409 conforme conflito/idempotência.
  - Registre `request_id`, usuário e domínio no logger; não logar PII ou segredos.
  - Aplique timeouts e retries idempotentes em integrações externas (`asyncio.wait_for`, backoff leve) e registre falhas.

- DB, transações e idempotência:
  - Use sessão via dependency (`get_session`) e escopos curtos; nunca compartilhe sessão global.
  - Para operações críticas (vouchers, billing), use `SELECT ... FOR UPDATE` e checagem idempotente (chave única ou tabela de idempotência) antes de escrever.
  - Toda alteração de schema deve incluir migration Alembic em `alembic/versions` e atualizar modelos.

- Storage e cópias:
  - Use serviços existentes (`services/storage` ou `PartnerStorageService`) para copiar objetos entre prefixos (`partners/` → `u/{user}/`).
  - Logar operação de cópia com request id e tamanho/arquivo.

- Testes e qualidade:
  - Adicione testes em `tests/` cobrindo rotas novas (200/4xx), caminhos felizes e de erro; inclua casos de idempotência.
  - Se alterar contrato, valide `/openapi.json` e alinhe geração de tipos (packages/contracts).
  - Rodar `pytest -q` localmente; inclua fixtures/mocks para serviços externos.

- Branch/PR e mensagens automáticas:
  - Branch sugerido para bots: `auto/api-<slug>-<yyyymmdd>`.
  - Commit: `chore(api): <desc>` ou `feat(api): <desc>`; PR title `Automated API: <short desc>`.
  - PR body deve listar endpoints afetados, migrations incluídas, comandos de teste e riscos.

- Restrições:
  - Não alterar segredos, CI/CD ou políticas de segurança sem revisão humana explícita.
  - Mudanças que impactem faturamento/quotas precisam de label `needs-human-review`.

## Onde procurar ajuda

- Logs: `fly logs -a babybook-api` (em produção)
- Local: `python -m uvicorn babybook_api.main:app --reload`
- Contatos: ver `docs/` (owner, infra, produto)
