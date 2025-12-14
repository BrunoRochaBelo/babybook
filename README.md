# Baby Book 📖

Este repositório contém o stack completo (monorepo) do projeto Baby Book.

## 1. O que é o Baby Book?

O Baby Book é um álbum vivo, digital e privado, focado em curadoria guiada para combater o caos da paternidade moderna. Nossa proposta de valor não é "armazenamento" (um Dropbox glorificado) nem "performance social" (um Instagram privado). Nossa proposta é transformar a ansiedade de registrar memórias em um ato de prazer e calma. O stack é 100% serverless, otimizado para custo zero de ociosidade e alta escalabilidade. Esta escolha técnica não é acidental; ela é a única forma de suportar financeiramente nosso modelo de negócio de "Acesso Perpétuo" (definido no documento Visão & Viabilidade). Como desenvolvedor, sua missão não é apenas construir features, mas garantir que elas respeitem nosso "God SLO" financeiro (o Custo de Estoque por conta), o que influencia decisões de arquitetura (ex: por que usamos flags booleanos para upsell ao invés de contadores complexos) e de engenharia (ex: por que usamos a Cloudflare Queues ao invés de um poller no banco).

## 2. A Bússola: Nossos Documentos-Chave

Este README.md é apenas a porta de entrada. Antes de codar, todo desenvolvedor (novo ou antigo) deve ler nossa "Bússola" de documentos (localizados em /docs) para entender a estratégia por trás do código. Cada documento responde a uma pergunta-chave:

- **Visão & Viabilidade (O "Porquê" Financeiro")**:  
  Pergunta que responde: O negócio é lucrativo? Como o Custo de Estoque (PCE) de R$ 1,53/ano é coberto no D0? Qual é a nossa estratégia Go-to-Market (B2B2C) e qual o CAC (R$ 80) esperado?  
  Implicação para o Dev: Este é o documento mais importante. Nossas escolhas de stack (ex: Cloudflare Queues, Neon) são decisões de negócio para manter o Custo de Estoque baixo. Leia para entender o "porquê" financeiro por trás das nossas escolhas técnicas.

- **Modelagem de Produto (A "Alma")**:  
  Pergunta que responde: Para quem estamos construindo (Personas "Ana" e "Sérgio")? Qual é o "Momento Aha!" (o loop do Guestbook)? Como é a jornada de upsell B2C e B2B2C para o "Pacote Completo" de R$ 49?  
  Implicação para o Dev: Este é o nosso Product Requirements Document (PRD). Use-o para entender as Personas e o racional por trás do "Aha! Moment" (o Guestbook) e do fluxo de upsell.

- **Arquitetura & Domínio (O "Blueprint" Técnico")**:  
  Pergunta que responde: Quais são as "caixinhas" do sistema? Por que escolhemos Neon, Modal e Cloudflare Queues (o stack serverless)? Como os dados fluem? Como funciona o RLS (Row Level Security) e o Cold Storage?  
  Implicação para o Dev: O blueprint mestre. Leia antes de adicionar um novo "microsserviço" ou dependência. Define os fluxos (ex: RLS, Cold Storage) e o racional do stack.

- **Modelo de Dados (O "Alicerce")**:  
  Pergunta que responde: Como o "Plano Base" e os flags de upsell (ex: unlimited_social) são modelados no DDL do Neon/Postgres? Como a contagem de uso assíncrona (usage_event_queue) funciona?  
  Implicação para o Dev: A "fonte da verdade" para o backend. Contém o DDL que o Alembic (migrações) usa. Consulte-o para entender as tabelas, views (v_effective_quotas) e triggers (queue_asset_usage).

- **Catálogo de Momentos (As "Features")**:  
  Pergunta que responde: O que é o momento "Primeiro Sorriso"? Quais campos ele tem? Qual upsell_category (ex: social, creative) ele aciona? Quais são os limites de mídia (10s/30s)?  
  Implicação para o Dev: O backend usa isso para construir a tabela moment_template. O frontend usa isso para construir os formulários.

- **API Reference (O "Contrato")**:  
  Pergunta que responde: Como o frontend deve chamar a API? Como é o payload do webhook de pagamento? Como a API retorna o erro 402 (Payment Required) quando o upsell de repetição é acionado?  
  Implicação para o Dev: O contrato OpenAPI que gera os tipos em packages/contracts. É a "cola" que impede o frontend e o backend de quebrarem a integração.

- **Estrutura do Projeto (O "Chão de Fábrica")**:  
  Pergunta que responde: Como este monorepo está organizado? Qual é o processo exato de DevEx (Seção 3 deste README)? Como funciona o CI/CD, o linting e o "Chão de Fábrica" (processo de PR, migrações)?  
  Implicação para o Dev: Onde encontrar as coisas. Define a separação de apps/ (deployável) e packages/ (reutilizável) e o DevEx.

- **Modelagem de UI/UX (O "Rosto")**:  
  Pergunta que responde: Como o design deve ser (Filosofia "Zen")? Como o "HUD" (Head-Up Display) funciona? Como é o wireframe do Modal de Upsell e do fluxo de resgate de voucher?  
  Implicação para o Dev: O guia do frontend e do designer. Traduz a Modelagem de Produto em telas, componentes e fluxos de interação (ex: como tratar o erro 402).

- **DevOps & Operação (O "Manual do Plantão")**:  
  Pergunta que responde: Como monitoramos a produção? Quais são os runbooks? Como diagnosticamos um backlog na Cloudflare Queues? Como funciona o PITR (Point-in-Time-Recovery) do Neon?  
  Implicação para o Dev: O guia de SRE. Define nossos SLOs (ex: latência p95 < 500ms), alertas e como responder a falhas (ex: reprocessar a DLQ da Fila).

> Nota rápida — decisões recentes (Dossiê de Atualização):
>
> - Pricing: adotamos precificação dual como padrão comercial — Ticket: R$297 (cartão) / R$279 (PIX). Ver `docs/DOSSIE_ATUALIZACAO_EXECUCAO.md` para o racional e a modelagem financeira.
> - GTM: pivot B2B2C com vouchers e portal para parceiros (fotógrafos/estúdios). O fluxo de resgate de vouchers e o portal do parceiro estão detalhados no Dossiê.
> - Storage: produção é **R2-only (S3-compatible)**. “Hot/Cold” é apenas uma separação **lógica** (tiers) dentro do mesmo provedor. Localmente usamos MinIO como mock S3/R2 para desenvolvimento.
> - Media processing: preferência por processamento na ponta (web: `ffmpeg.wasm` em Web Worker; mobile: ffmpeg-kit / libs nativas). Workers server-side (Modal) são fallback para dispositivos ou casos excepcionais.
>
> Consulte o Dossiê para a lista completa de decisões, SQL apêndice e o checklist de execução.

## 3. Como Rodar (Guia Rápido de DevEx)

Este guia é um resumo da docs/estrutura_projeto.md (Seção 1). O objetivo é ter o ambiente local 100% funcional em 5 minutos.

### 3.1. Pré-requisitos

- **pnpm**: Essencial para gerenciar os workspaces do monorepo (corepack enable ou npm i -g pnpm).
- **Node.js**: Versão definida em .nvmrc. (Recomendamos nvm para gerenciar).
- **Python**: Versão definida em pyproject.toml. (Recomendamos pyenv ou asdf para gerenciar).
- **Docker e docker-compose**: Essencial para simular nossos backing services de produção (Postgres e S3) localmente.

### 3.2. Setup Inicial (Primeira vez)

1. Clone o repositório.

   ```bash
   git clone [URL_DO_REPO]
   cd babybook
   ```

2. Copie os segredos locais (este arquivo é ignorado pelo .git):

   ```bash
   cp .env.example .env.local
   ```

   (Edite .env.local se precisar, mas os defaults devem funcionar para o Docker.)

Nota (staging/prod): a API possui guardrails e **falha no startup** se estiver com configuração insegura. Garanta que, nos ambientes não-locais, estejam definidos `ENV`, `ALLOWED_HOSTS`, `SECRET_KEY`, `SERVICE_API_TOKEN`, `BILLING_WEBHOOK_SECRET`, `SESSION_COOKIE_SECURE=true`, `CORS_ORIGINS` (sem localhost) e URLs públicas em https.

3. Instale TODAS as dependências (Node/Python) e rode o codegen da API:
   ```bash
   pnpm install
   ```
   (Este comando irá "içar" (hoist) todas as node*modules para a raiz, linkar os workspaces (apps/*, packages/\_) e instalar as dependências Python no ambiente virtual.)

### 3.3. Rodando a Infra Local

Suba os backing services (o banco e o storage S3 mockado). O docker-compose.yml (Seção 4) define esses serviços.

```bash
docker-compose up -d
```

Isso irá iniciar (em background):

- db (PostgreSQL 15) na porta 5432 (simulando o Neon).
- storage (MinIO - mock S3/R2) na porta 9000 (Endpoint da API) e 9001 (Console Web). Atenção: o MinIO é um mock local para desenvolvimento e simula o comportamento básico de um S3-compatible (incluindo R2) para testes.

### 3.4. Migração do Banco (Setup Inicial)

Com o container db rodando (do passo 3.3), você precisa aplicar o schema do banco de dados (Alembic) pela primeira vez:

```bash
pnpm --filter api run db:upgrade
```

(Importante: Você deve rodar este comando toda vez que "puxar" (pull) uma nova migração da main para manter seu banco local sincronizado.)

### 3.5. Rodando a Aplicação (Dev)

Após a infra (Docker) estar rodando e migrada, rode os serviços locais (API e SPA):

```bash
pnpm dev:local
```

Para iniciar a landing page, API e workers em paralelo, use (recomendado com o venv Python ativo):

````bash
& .\.venv\Scripts\Activate.ps1  # Windows PowerShell, se ainda não estiver ativo
pnpm run dev:all

No Windows, você pode usar o helper que ativa o venv e inicia todos os serviços em um comando:
```bash
pnpm run dev:all:win
```

No macOS / Linux, use:

```bash
pnpm run dev:all:unix
```

Se ainda não criou o ambiente Python e instalou dependências, rode primeiro:

Windows:
```powershell
pnpm run setup:py:win
```

macOS / Linux:
```bash
pnpm run setup:py:unix

Se preferir não rodar os Workers (e evitar conectar ao banco local), use a variante "lite":

```bash
pnpm run dev:all:lite
```

Ou use `dev:all:lite:win` / `dev:all:lite:unix` manualmente para ativar venv e rodar a versão "lite".
```

````

Observações:

- A Landing Page roda por padrão em http://localhost:3001
- API (FastAPI) roda em http://localhost:8000
- Web (React/Vite) roda em http://localhost:5173

Isso irá iniciar os apps em modo watch (hot-reload):

- API (FastAPI): http://localhost:8000 (Acesse /docs para o Swagger).
- Web (React/Vite): http://localhost:5173

### 3.6. O que NÃO roda localmente (A Fila e o Worker)

Conforme nossa Arquitetura & Domínio (Apêndice C), o apps/workers (Modal) não precisa rodar localmente para o fluxo padrão. Para simplificar o DevEx, usamos o modo **inline worker**: em `ENV=local` e `INLINE_WORKER_ENABLED=true`, a API (FastAPI) não publica na fila. Ela simula o processamento assincrono no mesmo processo e atualiza o asset.status para `ready` imediatamente. Isso mantém o upload funcional para quem está desenvolvendo o apps/web sem depender de ffmpeg/minio adicionais.

Quando precisamos validar o pipeline real (Cloudflare Queue + workers Python ou o modo `QUEUE_PROVIDER=database`), basta definir `INLINE_WORKER_ENABLED=false`, executar `pnpm dev:workers` (ou rodar o worker no provedor Modal) e deixar a API publicar os jobs normalmente. A composição local (`docker-compose`) cria os buckets `babybook-uploads`, `babybook-media` e `babybook-exports` no MinIO para conveniência de desenvolvimento; lembre-se que esses buckets são mocks locais — em produção usamos **Cloudflare R2-only** (tiers lógicos) conforme o Dossiê.

## 4. O que tem aqui? (Estrutura do Monorepo)

Usamos um monorepo pnpm para gerenciar as fronteiras do nosso stack. A Estrutura do Projeto (Seção 2) define isso em detalhes.

- **/apps/**: Descrição: O código executável. Cada pasta é uma "fronteira" de deploy.
  - api/: O "Cérebro" (FastAPI, Python). Controla RBAC, Quotas, Negócio.
  - web/: O "Coração" (React SPA, Vite). A experiência da "Ana" (Persona).
  - edge/: O "Rosto Público" (SSR Links, Hono/CF). O que o "Sérgio" (Persona) vê.
  - workers/: A "Fábrica" (Jobs de Mídia, Modal/Python). Consome da Fila CF.
  - admin/: Ferramentas de CLI (ex: rodar Jobs manuais, db:upgrade).

- **/packages/**: Descrição: Código compartilhado que não é deployável sozinho. É o nosso "core" interno, linkado via pnpm para os apps/.
  - contracts/: O "Contrato" (Tipos TS gerados da OpenAPI). A cola anti-quebra.
  - ui/: Os "Blocos" (Design System, shadcn/React).
  - config/: Configs (ESLint, TSConfig, Tailwind).
  - i18n/: Traduções (JSON).

- **/docs/**: Descrição: A "Bússola" (Seção 2). A fonte da verdade da nossa estratégia. Obrigatório ler.

- **/tests/**: Descrição: Testes E2E (playwright) que rodam contra o browser real e simulam o usuário (Login, Upload, etc.).

- **docker-compose.yml**: Descrição: A "Infra Local" (Postgres, Minio).

- **.env.example**: Descrição: O "Molde" dos segredos locais.

## 5. Filosofia de Testes

A qualidade é garantida por gates no CI/CD (Estrutura do Projeto, Seção 15). A nossa filosofia segue a "Pirâmide de Testes":

- **Base (Rápida): Unidade**
  - Onde: apps/api/tests/unit, apps/web/tests/unit.
  - O quê: Lógica pura, isolada.
  - Exemplo: Testar uma função de validação no zod (packages/contracts) ou uma lógica de cálculo de data (packages/utils).

- **Meio (Contrato): Integração**
  - O quê: Testa a "cola" entre os componentes.
  - Exemplo (Backend): Testar o endpoint POST /moments com um mock do db e da Fila CF (Cloudflare Queues).
  - Exemplo (Frontend): Testar o componente MomentCard contra um payload JSON mockado (via msw).

- **Topo (Lenta): E2E (End-to-End)**
  - Onde: tests/e2e/.
  - O quê: Um número mínimo de testes (playwright) que simulam o usuário no browser real.
  - Exemplo: (1) Login, (2) Upload de Foto B2C, (3) Resgate de Voucher B2B2C, (4) Gatilho de Upsell. Estes testes são a nossa "rede de segurança" final e rodam no CI.

```bash
# Rodar TUDO (Lint, Testes Unitários, Contrato, E2E)
pnpm test

# Rodar testes específicos de um app (ex: só a API)
pnpm --filter api test

# Rodar testes E2E com o navegador aberto (debug)
pnpm --filter e2e test:headed
```

## 3. Estrutura Atual do Monorepo

```
babybook/
├─ apps/
│  ├─ api/            # FastAPI + OpenAPI
│  ├─ web/            # SPA (React/Vite)
│  ├─ edge/           # SSR público (Hono)
│  ├─ workers/        # Pipelines assíncronos (Modal-ready)
│  └─ admin/          # Ferramentas operacionais (Typer)
├─ packages/
│  ├─ config/         # ESLint/Tailwind/TSConfig compartilhados
│  ├─ ui/             # Design System (Radix + tokens)
│  ├─ contracts/      # Tipos gerados do OpenAPI
│  ├─ utils/          # Helpers puros
│  └─ i18n/           # Provider e traduções
├─ tests/
│  ├─ e2e/            # Playwright
│  ├─ web/            # Testes de UI/a11y (Vitest)
│  ├─ api/            # Contratos FastAPI
│  └─ workers/        # Pipelines com pytest
└─ docs/              # Bússola estratégica
```

### Guia rápido

```bash
pnpm install
pnpm dev:web     # SPA autenticada
pnpm dev:web:mock # SPA com MSW e seeds
pnpm dev:web:real # SPA apontando para API real (desativa MSW)
pnpm dev:edge    # Links públicos
pnpm dev:api     # FastAPI (porta 8000)
pnpm dev:workers # Workers locais
```

> ⚙️ Em `pnpm dev:web` habilitamos o [MSW](https://mswjs.io/) automaticamente e carregamos o perfil **Bruno (owner)** com as crianças _Alice_ e _Theo_. Isso garante que toda a interface fique navegável mesmo sem backend.  
> Para validar contra a API real, crie/ajuste o `.env.local` em `apps/web` para **desativar** o MSW (`VITE_ENABLE_MSW=false`) e execute `pnpm dev:web` com o backend rodando. Quando terminar, volte o valor para `true` ou use `pnpm dev:web:mock` para restaurar o modo totalmente mockado.
> Dica: use `pnpm dev:web:mock` para garantir que os dados simulados estão ativos ou `pnpm dev:web:real` para desativá-los automaticamente.

### Worker real no ambiente local

O modo inline (padrão em `ENV=local`) resolve quase todos os cenários. Para exercitar o pipeline completo com fila + worker:

1. Defina `INLINE_WORKER_ENABLED=false` no `.env.local` (ou no shell).
2. Suba os serviços de apoio normalmente (`docker compose up -d`); o serviço `storage-init` cria automaticamente os buckets `babybook-uploads`, `babybook-media` (derivados com TTL de 30 dias) e `babybook-exports` (72h).
3. Rode `docker compose --profile workers up worker` para iniciar o worker Python (ou `pnpm dev:workers` se preferir rodar fora dos contêineres).

Com esses passos, o `/uploads/complete` publica jobs no banco (queue provider = `database`), o worker consome e atualiza o asset via `PATCH /assets/{id}`, replicando o comportamento de produção.

#### Administrando a fila

Use o CLI do `apps/admin` para inspecionar e reprocessar jobs:

```bash
cd apps/admin
python -m babybook_admin.cli worker-jobs list --status pending --limit 10
python -m babybook_admin.cli worker-jobs replay <job_id>
```

Defina `BABYBOOK_DATABASE_URL` para apontar para outro banco (por padrão usa o `settings.database_url`).

#### SPA em contêiner

Quando quiser rodar o front no compose (modo produção), habilite o profile web-prod:

`ash
docker compose --profile web-prod up web-prod
`

O container usa pps/web/Dockerfile para buildar o bundle e serve o app em http://localhost:4173 apontando para a API/storage do compose.

> Dica: para que o apps/web encontre os derivados no ambiente real/local, defina `VITE_MEDIA_BASE_URL` com o host do bucket (ex.: `http://localhost:9000`).

## Segurança (segredos e histórico)

- Execute `pre-commit install` para habilitar o hook de _secret scanning_ baseado em `detect-secrets` (baseline em `.secrets.baseline`). Commits com novos segredos serão bloqueados.
- O passo a passo para limpar o histórico e remover o segredo exposto (Company Email Password) está documentado em `docs/security-remediation.md`.
