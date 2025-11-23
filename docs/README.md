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
- storage (Minio S3) na porta 9000 (Endpoint da API) e 9001 (Console Web) (simulando o B2).

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

Para iniciar a landing page + API + Workers com o ambiente Python criado, rode primeiro `pnpm run bootstrap` e depois `pnpm run dev:all`.

Se não quiser subir os Workers (evitar conexões com o banco local), utilize a versão "lite":

```bash
pnpm run dev:all:lite
```

Isso irá iniciar os apps em modo watch (hot-reload):

- API (FastAPI): http://localhost:8000 (Acesse /docs para o Swagger).
- Web (React/Vite): http://localhost:5173

### 3.6. O que NÃO roda localmente (A Fila e o Worker)

Conforme nossa Arquitetura & Domínio (Apêndice C), o apps/workers (Modal) não precisa rodar localmente para o fluxo padrão. Em `ENV=local` e `INLINE_WORKER_ENABLED=true`, a API usa o modo inline: ela não publica na Fila e processa o job no mesmo processo, atualizando o asset.status para `ready` imediatamente. Isso preserva o DevEx do apps/web sem exigir ffmpeg/minio adicionais.

Quando alguém precisar testar o Worker (Modal) “de verdade”, basta definir `INLINE_WORKER_ENABLED=false`, escolher um provedor de fila (`QUEUE_PROVIDER=database` ou Cloudflare) e rodar `pnpm dev:workers` (ou o deploy Modal). O docker-compose já cria automaticamente os buckets `babybook-uploads`, `babybook-media` e `babybook-exports` no MinIO via serviço `storage-init`, então o ambiente local fica alinhado ao de produção.

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

### Modos do front-end

`ash
pnpm dev:web      # SPA (auto-detecta MSW, padrão mock)
pnpm dev:web:mock # Força MSW/dados seedados
pnpm dev:web:real # Desativa MSW (aponta para a API real)
`

No modo real, configure `VITE_ENABLE_MSW=false` (por padrão mantemos `true` para rodar 100% mockado) e `VITE_MEDIA_BASE_URL` no `.env.local` para apontar para o host dos derivados. Use `pnpm dev:web:mock` para voltar ao modo totalmente local.

### Worker real no ambiente local

Para executar o pipeline completo em dev:

1. Defina `INLINE_WORKER_ENABLED=false`.
2. Suba o compose (`docker compose up -d`) para criar os buckets via `storage-init`.
3. Rode `docker compose --profile workers up worker` (ou `pnpm dev:workers`).

Isso aproxima o ambiente local do comportamento em produção (jobs persistidos no banco e consumidos pelo worker Python).

#### Administrando a fila

```bash
cd apps/admin
python -m babybook_admin.cli worker-jobs list --status pending
python -m babybook_admin.cli worker-jobs replay <job_id>
```

#### SPA em contêiner

`ash
docker compose --profile web-prod up web-prod
`

Esse profile usa pps/web/Dockerfile para gerar o bundle estático em http://localhost:4173, apontando para a API/storage do compose.

> Dica: defina `VITE_MEDIA_BASE_URL` (por exemplo, `http://localhost:9000`) para que a SPA gere as URLs dos derivados ao usar o bucket local.
