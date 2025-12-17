# Estrutura e Engenharia do Projeto - Baby Book

Nota: Este documento está alinhado ao [BABY BOOK: DOSSIÊ DE EXECUÇÃO](Dossie_Execucao.md). O dossiê contém as decisões financeiras e de produto que governam convenções, quotas e premissas de custo aqui descritas.

Este documento é o manual de engenharia e a fonte canônica de arquitetura para o projeto Baby Book. Ele define as fronteiras, responsabilidades, convenções e o "como" executar e evoluir o sistema, alinhado ao Visão & Viabilidade (Acesso Perpétuo + PCE).

## Sumário

- [Guia de Início Rápido (DX)](#1-guia-de-início-rápido-dx)
- [Diretrizes de Estrutura (Os Pilares)](#2-diretrizes-de-estrutura-os-pilares)
  - [2.1. Fronteiras e Responsabilidades](#21-fronteiras-e-responsabilidades)
  - [2.2. Contratos Gerados (Fonte Única)](#22-contratos-gerados-fonte-única)
  - [2.3. Rastreabilidade (Tracing)](#23-rastreabilidade-tracing)
  - [2.4. Quality Gates (Contrato com CI)](#24-quality-gates-contrato-com-ci)
  - [2.5. Riscos & Mitigação (Visão Geral)](#25-riscos--mitigação-visão-geral)
  - [2.6. Regras de Evolução e Refatoração Segura](#26-regras-de-evolução-e-refatoração-segura)
  - [2.7. Padrão de Observabilidade (Logs & Métricas)](#27-padrão-de-observabilidade-logs--métricas)
- [Layout do Monorepo (O Mapa)](#3-layout-do-monorepo-o-mapa)
  - [3.1. Visão Geral (Árvore de Pastas)](#31-visão-geral-árvore-de-pastas)
  - [3.2. Configuração do Docker (docker-compose.yml)](#32-configuração-do-docker-docker-composeyml)
  - [3.3. apps/web (SPA privada)](#33-appsweb-spa-privada)
  - [3.4. apps/edge (SSR público)](#34-appsedge-ssr-público)
  - [3.5. apps/api (Serviço Stateless)](#35-appsapi-serviço-stateless)
  - [3.6. apps/workers (Assíncrono)](#36-appsworkers-assíncrono)
  - [3.7. packages (Reuso)](#37-packages-reuso)
  - [3.8. docs e tests](#38-docs-e-tests)
  - [3.9. Convenções de Nomes e Aliases](#39-convenções-de-nomes-e-aliases)
  - [3.10. Gestão de Configuração e Segredos](#310-gestão-de-configuração-e-segredos)
- [Convenções e Contratos (API)](#4-convenções-e-contratos-api)
  - [4.1. Nomenclatura de rotas e recursos](#41-nomenclatura-de-rotas-e-recursos)
  - [4.2. Erro Canônico](#42-erro-canônico)
  - [4.3. Quotas base (Alinhado com Visão & Viabilidade)](#43-quotas-base-alinhado-com-visão--viabilidade)
  - [4.4. Convenção de códigos de erro](#44-convenção-de-códigos-de-erro)
  - [4.5. Contratos gerados para o front](#45-contratos-gerados-para-o-front)
  - [4.6. Padrão de versionamento de payloads](#46-padrão-de-versionamento-de-payloads)
  - [4.7. Datas, horários e timezones](#47-datas-horários-e-timezones)
  - [4.8. Paginação, ordenação e filtros](#48-paginação-ordenação-e-filtros)
  - [4.9. Cache de cliente, ETag e valiação condicional](#49-cache-de-cliente-etag-e-valiação-condicional)
  - [4.10. Idempotência cliente e repetição segura](#410-idempotência-cliente-e-repetição-segura)
- [Dependências por Workspace (O Arsenal)](#5-dependências-por-workspace-o-arsenal)
- [Organização das Features (Front-end SPA)](#6-organização-das-features-front-end-spa)
  - [6.1. Esqueleto recomendado de uma feature](#61-esqueleto-recomendado-de-uma-feature)
  - [6.2. Padrões de acessibilidade por componente (checklist a11y)](#62-padrões-de-acessibilidade-por-componente-checklist-a11y)
  - [6.3. Padrões de UX: loading, empty, error](#63-padrões-de-ux-loading-empty-error)
  - [6.4. Formulários e validação em múltiplas etapas](#64-formulários-e-validação-em-múltiplas-etapas)
- [Padrões de Roteamento e Navegação (SPA ↔ Edge)](#7-padrões-de-roteamento-e-navegação-spa--edge)
  - [7.1. Padrões de URL, slugs e anchors](#71-padrões-de-url-slugs-e-anchors)
  - [7.2. Code splitting](#72-code-splitting)
  - [7.3. Deep links e breadcrumbs](#73-deep-links-e-breadcrumbs)
- [Estado, Dados e Validação no Front (SPA)](#8-estado-dados-e-validação-no-front-spa)
  - [8.1. React Query (Server State)](#81-react-query-server-state)
  - [8.2. Zustand (UI State)](#82-zustand-ui-state)
  - [8.3. Validação com Zod (Cliente)](#83-validação-com-zod-cliente)
  - [8.4. Mocks e Desenvolvimento Offline (msw)](#84-mocks-e-desenvolvimento-offline-msw)
  - [8.5. Tratamento de erros na UI (boundary e toasts)](#85-tratamento-de-erros-na-ui-boundary-e-toasts)
- [Upload de Mídia (Detalhamento da Feature Core)](#9-upload-de-mídia-detalhamento-da-feature-core)
  - [9.1. Componentes Principais do Upload Manager](#91-componentes-principais-do-upload-manager)
  - [9.2. Estados e Transições](#92-estados-e-transições)
  - [9.3. Estratégias de Resiliência (Rede Móvel)](#93-estratégias-de-resiliência-rede-móvel)
  - [9.4. Contratos Mínimos do Uploader](#94-contratos-mínimos-do-uploader)
- [Chaves de Armazenamento (S3/R2)](#10-chaves-de-armazenamento-s3r2)
  - [10.1. Presets de Derivados (Workers)](#101-presets-de-derivados-workers)
  - [10.2. Metadados Relevantes](#102-metadados-relevantes)
  - [10.3. Política de Nomes (Exports e Lixo)](#103-política-de-nomes-exports-e-lixo)
- [Acessibilidade (a11y) e Internacionalização (i18n)](#11-acessibilidade-a11y-e-internacionalização-i18n)
  - [11.1. Tokens e Contraste](#111-tokens-e-contraste)
  - [11.2. Leitura de Tela (SR) e Foco](#112-leitura-de-tela-sr-e-foco)
  - [11.3. i18n: Chaves, Pluralização e Formatação](#113-i18n-chaves-pluralização-e-formatação)
  - [11.4. Testes rápidos de a11y no fluxo de PR](#114-testes-rápidos-de-a11y-no-fluxo-de-pr)
- [Padrões de Segurança (UI & API)](#12-padrões-de-segurança-ui--api)
  - [12.1. Conteúdo Embutido e Sanitização (UI)](#121-conteúdo-embutido-e-sanitização-ui)
  - [12.2. Proteções Básicas de Navegação (UI)](#122-proteções-básicas-de-navegação-ui)
  - [12.3. Dados Sensíveis em Tela e Histórico (UI)](#123-dados-sensíveis-em-tela-e-histórico-ui)
  - [12.4. Padrão de Segurança de Endpoint (API)](#124-padrão-de-segurança-de-endpoint-api)
- [Rastreabilidade de Dados (UI → API → DB)](#13-rastreabilidade-de-dados-ui--api--db)
- [Convenções Adicionais](#14-convenções-adicionais)
  - [14.1. Estilo de Código e Nomes](#141-estilo-de-código-e-nomes)
  - [14.2. Feature Flags e Configuração](#142-feature-flags-e-configuração)
  - [14.3. Padrões de Comentários e READMEs Locais](#143-padrões-de-comentários-e-readmes-locais)
- [O "Chão de Fábrica" (Operações e Processos)](#15-o-chão-de-fábrica-operações-e-processos)
  - [15.0. Filosofia de Testes (A Pirâmide)](#150-filosofia-de-testes-a-pirâmide)
  - [15.1. O Processo de PR (Do Feature ao Merge)](#151-o-processo-de-pr-do-feature-ao-merge)
  - [15.2. Migrações de Banco de Dados (Alembic)](#152-migrações-de-banco-de-dados-alembic)
  - [15.3. Filosofia de Erros (Retry vs. DLQ)](#153-filosofia-de-erros-retry-vs-dlq)
  - [15.4. Runbooks e Acesso (O que fazer às 3h da manhã)](#154-runbooks-e-acesso-o-que-fazer-às-3h-da-manhã)
- [Diretrizes de Documentação](#16-diretrizes-de-documentação)
  - [16.1. READMEs e Exemplos](#161-readmes-e-exemplos)
  - [16.2. Glossário Mínimo do Domínio](#162-glossário-mínimo-do-domínio)
  - [16.3. Diagramas Mermaid](#163-diagramas-mermaid)
  - [16.4. Registro de Decisões de Arquitetura (ADRs)](#164-registro-de-decisões-de-arquitetura-adrs)
- [Critérios de Aceite (Estrutura)](#17-critérios-de-aceite-estrutura)

## 1. Guia de Início Rápido (DX)

O objetivo é ter o ambiente local rodando em menos de 5 minutos, refletindo a arquitetura serverless. A Developer Experience (DX) é uma feature central.

### 1.1. Pré-requisitos

- pnpm: Usamos pnpm (via Corepack) para gerenciar o monorepo (workspaces). Garante instalação rápida e deduplicação de node_modules. (corepack enable ou npm i -g pnpm).
- Node.js: Versão definida em .nvmrc (use nvm use).
- Python: Versão definida em pyproject.toml (use pyenv ou asdf).
- Docker e docker-compose: Para a infraestrutura de backing services (banco e storage).

### 1.2. Setup de Infra Local

A infra local (banco, storage mock) é gerenciada por Docker. Não usamos Redis, pois o broker de mensagens em produção é a Cloudflare Queues, que é mockada pela API em ambiente local.

```bash
# 1. Subir os contêineres (PostgreSQL e Minio S3 Mock)
# -d (detached) roda em background
docker-compose up -d
```

### 1.3. Setup do Ambiente

Instalar dependências:

```bash
# Instala TODAS as dependências do monorepo (Node e Python)
pnpm install
```

(O pnpm install também deve trigar o postinstall que cria o ambiente virtual Python e instala as dependências do pyproject.toml via poetry ou pip.)

Configurar Segredos Locais:

```bash
# Copia o template de segredos. Este arquivo NUNCA é commitado.
cp .env.example .env.local
```

Edite .env.local (que está no .gitignore) com as credenciais para os serviços locais (ex: POSTGRES_PASSWORD, MINIO_ROOT_USER), conforme definido no docker-compose.yml (Seção 3.2).

Rodar Migrações do Banco:

```bash
# Executa o comando 'upgrade' do Alembic no workspace da API
pnpm --filter api run db:upgrade
```

### 1.4. Rodando o Projeto

O docker-compose gerencia apenas os backing services (DB e Storage). A API e a SPA rodam localmente via pnpm para habilitar o hot-reload e uma melhor DX.

```bash
# Sobe a API (FastAPI) e a SPA (Vite) em modo watch (hot-reload)
pnpm dev:local
```

API (FastAPI): http://localhost:8000/docs (Acesse para ver a documentação interativa do OpenAPI).
Web (SPA): http://localhost:5173 (Abra no navegador para usar o app).
Workers (Modal): Por padrão, não precisam rodar localmente. Em `ENV=local` + `INLINE_WORKER_ENABLED=true`, a API ativa o modo inline e processa o job no mesmo processo (mock da Cloudflare Queues). Isso cobre 99% do fluxo da UI sem exigir ffmpeg. Quando precisar validar o pipeline real (fila + worker), defina `INLINE_WORKER_ENABLED=false`, aponte o `QUEUE_PROVIDER` para `database` ou Cloudflare e execute `pnpm dev:workers` (ou deploy Modal) — o docker-compose já provisiona os buckets `babybook-uploads`, `babybook-media` e `babybook-exports` no MinIO via serviço `storage-init`.
Edge (Público): (Simulado via wrangler dev em outra porta, ex: 8787, via pnpm dev:edge).

### 1.5. Rodando Testes

Testes são o pilar da estabilidade. Rode-os antes de qualquer PR.

```bash
# Rodar todos os testes (front, back, e2e)
pnpm test

# Rodar testes específicos do workspace (ex: API)
pnpm --filter api test

# Rodar testes E2E com a UI aberta (modo debug)
pnpm --filter e2e test:headed
```

## 2. Diretrizes de Estrutura (Os Pilares)

Princípios que definem a arquitetura e não devem ser violados sem revisão.

### 2.1. Fronteiras e Responsabilidades

O sistema é dividido por fronteira de execução para reduzir acoplamento, facilitar escalas independentes e diminuir regressões cruzadas.

- apps/web: SPA Privada (React/Vite).O que faz: Experiência autenticada, criação/edição rica (Momentos, Cápsula, Cofre, Saúde), gestão de quotas, convites, UI de upsell.
  O que NÃO faz: Nunca fala com o banco de dados. Nunca contém lógica de negócio crítica (RBAC, Quotas). É um "cliente burro" que consome packages/contracts.
- apps/edge: SSR Público (Hono/Cloudflare).O que faz: Renderização pública de compartilhamentos (/s/:token), focada em performance (HTML-first), cache de borda (ETag) e segurança (noindex).
  O que NÃO faz: Não tem estado de sessão (session-less). Não serve a SPA privada.
- apps/api: Serviço Stateless (FastAPI @ Fly.io).O que faz: O "Cérebro" e "Porteiro". Concentra 100% das regras de negócio: autenticação, sessão/CSRF, RBAC, quotas (físicas e de repetição), presign de upload, publicação na fila (Cloudflare Queues), webhooks de pagamento.
  O que NÃO faz: Nunca serve HTML ou assets estáticos. Nunca executa jobs longos (ex: ffmpeg) – isso é trabalho dos workers.
- apps/workers: Processamento Assíncrono (Modal @ Python).O que faz: A "Fábrica". Consome da Cloudflare Queues. Executa jobs pesados e lentos: transcodificação de mídia (ffmpeg), geração de thumbnails (pillow), exportação (ZIP) e tarefas de cron.
  O que NÃO faz: Nunca é exposto à internet pública. Só é invocado pela fila.

### 2.2. Contratos Gerados (Fonte Única)

A camada packages/contracts (tipos TypeScript) é gerada automaticamente a partir do apps/api/openapi.yaml.

Justificativa: Evita deriva de contrato (front↔back). O front só compila se o contrato for compatível. É a principal ferramenta de governança entre times.
Implicação: Nunca escreva tipos de API manually no front-end.
Fluxo de Trabalho (Exigido): Se a UI (apps/web) precisa de um novo campo (ex: moment.is_favorited):O dev primeiro edita o openapi.yaml (em apps/api) e o model Pydantic.
Roda pnpm --filter contracts codegen.
O PR deve conter a mudança na API e a mudança resultante em packages/contracts.

### 2.3. Rastreabilidade (Tracing)

A capacidade de rastrear uma requisição ponta a ponta é mandatória, especialmente em um sistema distribuído (API $\rightarrow$ Fila $\rightarrow$ Worker).

Padrão: X-Trace-Id (ou trace_id).
Origem: O apps/web (cliente) DEVE gerar um trace_id (ex: bb-trace-uuid...) para cada "fluxo" de usuário (ex: um upload ou uma sessão de edição).
Propagação (Front → Back): A SPA DEVE enviar o X-Trace-Id em todo request para a API (via um interceptador fetch global).
Consumo (API): A API (FastAPI) DEVE ler o header X-Trace-Id (ou gerar um novo) e incluí-lo em todos os logs.
Propagação (API → Worker): Ao enfileirar um job na Cloudflare Queues, a API DEVE passar o trace_id como metadado da mensagem.
Consumo (Worker): O apps/workers (Modal) DEVE ler o trace_id da mensagem e usá-lo em todos os seus logs.
Resultado (Valor de Negócio): Quando um usuário reportar "Meu upload falhou", o Suporte (ou o dev) pode pedir o trace_id (visível no erro da UI, ver 4.2) e, ao buscá-lo no sink de logs (Datadog, BetterStack, etc.), verá a jornada completa: o clique na UI, a chamada /uploads/init na API, a publicação na fila e o erro ffmpeg no worker.

### 2.4. Quality Gates (Contrato com CI)

O pipeline de CI/CD é o guardião destas regras. Nenhum PR será mergeado se falhar em:

- Lint & Format: eslint, prettier, ruff, black.Implicação: O PR é bloqueado por estilo de código. O dev deve rodar pnpm format antes de commitar.
- Testes de Unidade/Integração: pytest, vitest (cobertura mínima de 80% em áreas críticas).Implicação: O PR é bloqueado se quebrar testes existentes.
- Testes E2E Críticos: playwright (fluxos de upload, share e login).Implicação: Garante que a experiência do usuário "ponta-a-ponta" (happy path) não foi quebrada.
- Lint de Contrato API: Spectral validando o openapi.yaml.Implicação: Garante que a API não introduziu uma mudança destrutiva (breaking change), como renomear um campo (ver 4.6).
- Orçamento de Bundle: Verificação de tamanho dos assets da SPA e do Edge.Implicação: Impede que uma nova npm install adicione 2MB ao bundle principal sem querer.
- Auditoria de A11y: axe-core nas rotas principais.Implicação: Garante que a acessibilidade (11.0) não regrediu.

### 2.5. Riscos & Mitigação (Visão Geral)

- Deriva de contrato (front↔back): Mitigado por packages/contracts gerado (2.2) e Spectral no CI (2.4).
- Crescimento de bundle (front): Mitigado por code splitting por rota (7.2), análise de bundle e orçamentos em CI (2.4).
- Performance no SSR público (Edge): Mitigado por HTML-first, dependências compatíveis com Edge e cache ETag (4.9).
- Concorrência no upload: Mitigado por fila local no cliente (Upload Manager, Seção 9), backoff, persistência em IndexedDB e retomada automática.
- Drift de nomenclatura (rotas↔tabelas): Mitigado por docs/api-db-traceability.md (13.0) e revisão de CODEOWNERS.

### 2.6. Regras de Evolução e Refatoração Segura

- Additive-first: Primeiro adiciona, depois migra o consumo, só então remove. (Ver 4.6 para mais detalhes).
- Toggle de caminho feliz: Feature flag (14.2) para novas árvores de componentes ou lógicas complexas.
- Back-compat no contrato: Clientes devem ignorar campos desconhecidos; remoções só após janela de deprecação.
- Refactors atômicos: Usar git mv para preservar histórico de arquivos.

### 2.7. Padrão de Observabilidade (Logs & Métricas)

Rastreabilidade (2.3) é sobre tracing. Observabilidade (O11y) é sobre agregados.

Sink Unificado: Logs de todas as fronteiras (Fly, Modal, Cloudflare) DEVEM ser encaminhados para um único sink de observabilidade (ex: Datadog, BetterStack, Logtail) para que o trace_id seja útil.
Logs (O que aconteceu?):Formato: JSON estruturado.
Nível: INFO (fluxos de negócio), WARN (falhas esperadas/corrigíveis), ERROR (exceções inesperadas).
Contexto: Todo log DEVE incluir trace_id. Logs de API e Worker DEVERIAM incluir account_id ou IDs de entidade relevantes (ex: asset_id).
Regra: Nunca logar PII (dados sensíveis, senhas, tokens) em INFO ou ERROR.
Métricas (Com que frequência? Quão rápido?):API (FastAPI): http_requests_total (labels: rota, metodo, status_code), http_request_duration_seconds (labels: rota, metodo).
Workers (Modal): jobs_in_queue (Gauge, lido da Cloudflare Queues), job_duration_seconds (Histogram), job_success_total (Counter), job_failure_total (Counter).
Diretriz do Dev: Ao criar uma nova feature, o PR (15.1) deve ser capaz de responder: "Como saberemos (via logs e métricas) que esta feature está funcionando em produção e quando ela quebrar?"

## 3. Layout do Monorepo (O Mapa)

### 3.1. Visão Geral (Árvore de Pastas)

```
babybook/
├─ README.md                            # Visão geral, como rodar (links para 1. Guia Rápido)
├─ package.json                         # Workspaces (web, edge, packages/*)
├─ pnpm-workspace.yaml
├─ pyproject.toml                       # Linters Python (ruff/mypy)
├─ docker-compose.yml                   # Infra local (Postgres, Minio) - Ver 3.2
├─ .editorconfig
├─ .pre-commit-config.yaml              # Hooks (ruff, eslint, commitlint)
├─ .env.example                         # Template de segredos
│
├─ apps/
│  ├─ web/                              # Frontend SPA (área autenticada)
│  ├─ edge/                             # SSR público (Cloudflare/Hono)
│  ├─ api/                              # FastAPI (serviço stateless)
│  ├─ workers/                          # Pipelines assíncronos (Modal)
│  └─ admin/                            # Ferramentas internas (scripts/CLI)
│
├─ packages/
│  ├─ ui/                               # Componentes compartilhados (shadcn + tokens)
│  ├─ config/                           # ESLint/Tailwind/TSConfig base
│  ├─ contracts/                        # Gerado do OpenAPI → TS (cliente tipado)
│  ├─ utils/                            # Helpers puros
│  └─ i18n/                             # Locales (pt-BR) + helpers
│
├─ docs/
│  ├─ README.md                         # Índice da documentação
│  ├─ visao_viabilidade.md              # Fonte canônica (Visão & Finanças)
│  ├─ arquitetura_dominio.md            # Fonte canônica (Arquitetura)
│  ├─ manual-engenharia.md (este doc)   # Fonte canônica (Como construir)
│  ├─ rbac-matrix.md                    # Matriz RBAC
│  ├─ api-db-traceability.md            # API ↔ Tabelas
│  ├─ adrs/                             # Decisões de Arquitetura (Ver 16.4)
│  └─ runbooks/                         # Manuais de incidente (ex: 001-fila-travada.md)
│
├─ tests/
│  ├─ e2e/                              # Playwright (fluxos críticos)
│  ├─ web/                              # Testes de UI/a11y
│  ├─ api/                              # Testes de contrato/integração
│  └─ workers/                          # Testes de pipeline (golden files)
│
└─ .github/ (ou GitLab CI, etc.)         # Definições de CI/CD (o executor do 2.4)
```

### 3.2. Configuração do Docker (docker-compose.yml)

Este arquivo define a infraestrutura mínima local para desenvolvimento (conforme Apêndice C do arquitetura.md). Ele não inclui Redis, pois usamos Cloudflare Queues (mockado pela API em modo local).

```yaml
version: "3.8"

services:
  # 1. Banco de Dados (PostgreSQL 15)
  # Alinhado com o Neon (Postgres)
  db:
    image: postgres:15-alpine
    container_name: babybook_db_local
    ports:
      - "5432:5432" # Expõe o banco na porta padrão
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-babybook}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-babybook}
      POSTGRES_DB: ${POSTGRES_DB:-babybook_dev}
    volumes:
      - babybook-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Storage Mock (Minio S3)
  # Local: MinIO (mock S3) para desenvolvimento.
  # Produção: Cloudflare R2 (R2-only) — retenção por prefixo (tmp/, partners/, exports/) e derivados recriáveis.
  storage:
    image: minio/minio:latest
    container_name: babybook_storage_local
    ports:
      - "9000:9000" # API Endpoint
      - "9001:9001" # Console Web
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    command: server /data --console-address ":9001"
    volumes:
      - babybook-storage-data:/data
    healthcheck:
      test: ["CMD-SHELL", "mc ready local"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  babybook-db-data:
    driver: local
  babybook-storage-data:
    driver: local
```

### 3.3. apps/web (SPA privada)

SPA (React/Vite) para a experiência autenticada. Prioriza riqueza de features e DX.

- src/app/: Rotas da SPA (React Router).
- src/components/: Design System (shadcn/Radix) + tokens. (Ex: <Button>, <Card>).
- src/features/: Lógica de negócio da UI (Momentos, Cápsula, Vault, etc.). Onde a inteligência mora.
- src/lib/: Módulos complexos e agnósticos. (Ex: lib/upload, lib/api-client, lib/utils).Diferença Chave: features/moments sabe o que é um "Momento". lib/upload não sabe; ele apenas sabe como enfileirar e enviar arquivos. lib/api-client não sabe por que está chamando /me/usage, apenas como chamá-lo.
- src/store/: Estado global de UI (Zustand). (Ver Seção 8.2).
- src/hooks/: Hooks globais e agnósticos (ex: useScreenSize, useDebounce). Hooks de feature (ex: useMomentQuery) vivem em features/moments/hooks/.

### 3.4. apps/edge (SSR público)

SSR (Hono/Cloudflare) para links compartilhados. Prioriza performance, cache e segurança.

- functions/[[path]].ts: Render de páginas públicas (/s/:token).
- Garantia: Nenhuma dependência de Node APIs; JS mínimo no cliente.

### 3.5. apps/api (Serviço Stateless)

FastAPI. Concentra regras de negócio, segurança e expõe openapi.yaml.

- babybook_api/main.py: App/middlewares/routers.
- babybook_api/settings.py: Config (pydantic) — quotas base (2 GiB / 60 momentos / 5 recorrentes).
- babybook_api/deps.py: Auth, DB, rate limit, enforcement de quotas.
- babybook_api/auth/: Lógica de Sessão e CSRF.
- babybook_api/routes/: Endpoints (ex: uploads.py, shares.py, billing.py).
- babybook_api/domain/: Lógica pura (ex: rbac.py, errors.py).
- babybook_api/db/: Models SQLAlchemy, migrações Alembic.
- babybook_api/openapi.yaml: Contrato Canônico.

### 3.6. apps/workers (Assíncrono)

Pipelines de mídia (Modal). Prioriza idempotência e resiliência.

- app/main.py: Entradas (consumidor da Cloudflare Queues, retries com jitter).
- app/ffmpeg.py: Vídeo 10s (presets 720p/1080p).
- app/images.py: Thumbnails (WebP/AVIF).
- app/exports.py: Empacotamento ZIP (streaming).

### 3.7. packages (Reuso)

- ui/: Componentes de UI (Radix/shadcn).
- contracts/: Tipos TS gerados do OpenAPI. Não editar manualmente.
- utils/: Funções puras (ex: formatação de datas, sem dependência de runtime).
- i18n/: Provider e arquivos de tradução.

### 3.8. docs e tests

- docs/: Documentação de arquitetura e decisões (Mermaid, MD).
- tests/: Testes E2E (playwright) e testes de integração por fronteira (api, web, workers).

### 3.9. Convenções de Nomes e Aliases

- Pastas: kebab-case (ex: features/guestbook-moderation).
- Arquivos TS/TSX: PascalCase para componentes; camelCase (ou kebab-case) para utilitários, hooks e rotas.
- Arquivos Python: snake_case.py.
- Módulos: Criar um módulo/pasta quando houver: (a) reutilização clara, (b) complexidade que mereça testes próprios, (c) fronteira natural (upload). Evitar pastas genéricas (misc, utils gigantes).
- Aliases: @/ aponta para apps/web/src/. Usar aliases para evitar ../../...

### 3.10. Gestão de Configuração e Segredos

- Camada 1 (Template): .env.example (gitado) - Contém todas as chaves, mas com valores de exemplo (ex: POSTGRES_USER=babybook).
- Camada 2 (Dev Local): .env.local (no .gitignore) - Onde o dev coloca as senhas locais (ex: POSTGRES_PASSWORD=local_secret). Lido pelo docker-compose.yml.
- Camada 3 (CI/Staging/Prod): Injetados pelo ambiente (ex: Cloudflare Secrets, GitHub Actions Secrets). O app nunca deve ter um arquivo .env em produção.

## 4. Convenções e Contratos (API)

### 4.1. Nomenclatura de rotas e recursos

- Revogação de compartilhamento: DELETE /shares/{id} (não /revoke).
- Cápsulas: /capsules (plural) com POST /capsules/{id}/seal (transição de estado).
- Print: /print-jobs/\*.
- Quotas: /me/usage.

### 4.2. Erro Canônico

{ error: { code, message, details, trace_id } } em todas as rotas 4xx/5xx.

Justificativa: Tratamento unificado no front (toast/retry) e rastreabilidade (trace_id).
Payload Exemplo:

```json
{
  "error": {
    "code": "quota.bytes.exceeded",
    "message": "Limite de armazenamento atingido.",
    "details": { "limit_bytes": 2147483648, "used_bytes": 2149000000 },
    "trace_id": "bb-req-01HVX…"
  }
}
```

### 4.3. Quotas base (Alinhado com Visão & Viabilidade)

Definidas em settings.py e aplicadas em deps.py. A UI reflete essa política.

- Quota Física: 2 GiB de storage (limite físico, gatilho de erro, não de upsell).
- Quota de Momentos: 60 momentos únicos/guiados.
- Quota de Repetição (Upsell): 5 entradas gratuitas para cada capítulo recorrente (ex: 5 "Visitas", 5 "Consultas", 5 "Galerias de Arte").

### 4.4. Convenção de códigos de erro

Formato: domínio.recurso.motivo (ex: quota.bytes.exceeded, auth.session.invalid).

Exemplos de Domínio:

- auth.\*: auth.session.invalid, auth.csrf.mismatch, auth.credentials.invalid.
- quota.\*:quota.bytes.exceeded (Erro 413: Atingiu 2GiB físicos).
  quota.moments.exceeded (Erro 402: Atingiu 60 momentos únicos).
  quota.recurrent_limit.exceeded (Erro 402: Atingiu a 6ª entrada recorrente. Gatilho principal de Upsell).
- upload.\*: upload.mime.unsupported, upload.size.exceeded, upload.etag.mismatch.
- billing.\*: billing.webhook.signature.invalid, billing.customer.not_found, billing.event.idempotency.failed.
- validation.\*: validation.body.invalid (erro genérico 400).

### 4.5. Contratos gerados para o front

packages/contracts é a fonte de tipos do cliente, gerada do OpenAPI. Versões geradas devem ser commitadas para inspeção e diff em PR.

### 4.6. Padrão de versionamento de payloads

Prefixo /v1.
Evolução via additive-first (adicionar campos opcionais).
Implicação Prática: Nunca renomeie ou remova um campo JSON. Isso é um breaking change.Exemplo Ruim: Renomear author para creator.
Exemplo Bom (Additive): 1. Adiciona creator. 2. A API passa a preencher ambos author e creator. 3. O front-end migra para ler creator. 4. Após meses, o campo author é marcado como deprecated no OpenAPI. 5. O campo author só é removido em uma v2.
Clientes devem ignorar campos desconhecidos.
Remoções só após janela de deprecação (marcar no OpenAPI).

### 4.7. Datas, horários e timezones

- Entrada/saída API: Timestamps em UTC (YYYY-MM-DDTHH:mm:ssZ).
- Apresentação UI: Formatar conforme locale do cliente (Intl.DateTimeFormat).
- Armazenamento DB: Campos de data/hora sempre com timezone explícito (TIMESTAMP WITH TIME ZONE).

### 4.8. Paginação, ordenação e filtros

Padrão: page, page_size (limite razoável), sort (default estável), filtros específicos.
Resposta: Incluir total (quando barato) ou next_cursor.

### 4.9. Cache de cliente, ETag e valiação condicional

Leituras elegíveis (ex: GET /shares/{id}) retornam ETag.
O cliente (React Query) envia If-None-Match.
A API responde 304 Not Modified se o ETag bater.
Mutations (POST/PATCH/DELETE) invalidam chaves relevantes do React Query.

### 4.10. Idempotência cliente e repetição segura

Retry com exponential backoff apenas em operações idempotentes (GET, PUT, DELETE) ou quando o servidor fornece um token de idempotência (ex: X-Idempotency-Key em POST /export).
Uploads (multipart) são idempotentes por parte.

## 5. Dependências por Workspace (O Arsenal)

### 5.1. apps/web (prod/dev/test)

- Prod: react, react-router-dom, @tanstack/react-query (Server State), zustand (UI State), zod (Validação), tailwindcss, @radix-ui/\* (A11y), i18next.
- Dev/Build: vite, typescript, eslint, prettier.
- Test: playwright, @testing-library/react, axe-core, msw.

Justificativa: Stack moderna, enxuta e focada. Dados remotos (React Query) são estritamente separados do estado local (Zustand) (ver Seção 8).

### 5.2. apps/edge (prod/dev)

- Prod: hono (roteamento leve).
- Dev/Build: wrangler, esbuild.

Justificativa: Performance máxima, sem sobrecarga de Node.js, otimizado para runtime de Edge.

### 5.3. apps/api (prod/dev/test)

- Prod: fastapi, uvicorn[standard], pydantic, SQLAlchemy, asyncpg, alembic, httpx, boto3/aioboto3, itsdangerous, passlib[bcrypt], limits, tenacity, orjson.
- Test: pytest, pytest-asyncio, pytest-cov, requests, faker.

Justificativa: FastAPI oferece performance async (ASGI) e validação de tipos (Pydantic) que se alinham perfeitamente com o openapi.yaml.

### 5.4. apps/workers (prod/dev/test)

- Prod: pillow, orjson; ffmpeg (no contêiner); boto3/aioboto3.
- Test: pytest, "golden files" de thumbs/bitrates.

## 6. Organização das Features (Front-end SPA)

features/\* reflete casos de uso do domínio:

- Moments: Criar/editar/preencher slots (mídia e textos).
- Chapters: Navegação/estrutura do livro.
- Share (UI): UI para criar link (o link em si é apps/edge).
- Guestbook: Mural com moderação (pending → visible).
- Capsule: Criação, adição de itens e seal.
- Vault: Documentos privados (RBAC rígido).
- Health: Medidas/consultas (RBAC rígido).
- Print: Orquestração de print-jobs.
- Export: Download de ZIP.

### 6.1. Esqueleto recomendado de uma feature

```
features/moments/
  ├─ pages/
  │   ├─ MomentsListPage.tsx     # A "view" de rota
  │   └─ MomentEditPage.tsx
  ├─ components/
  │   ├─ MomentCard.tsx          # Componente de UI específico desta feature
  │   └─ MediaSlot.tsx
  ├─ hooks/
  │   ├─ useMomentQuery.ts       # Onde React Query (8.1) vive. Ex: getMoment(id), updateMoment(...)
  │   └─ useUpload.ts            # Hook de integração com a lib/upload (9.0)
  ├─ store/
  │   └─ moments.store.ts        # Zustand (8.2) (UI local, ex: "qual slot está selecionado?")
  ├─ validations/
  │   └─ moment.schema.ts        # Zod (8.3) (ex: "título não pode ter mais de 100 chars")
  └─ index.ts                    # Ponto de entrada (se houver lazy loading)
```

Nota: O lib/api-client (agnóstico) expõe funções de chamada de API (ex: api.getMoment(id)). Os hooks da feature (ex: useMomentQuery) 'embrulham' essas funções com o React Query (useQuery({ queryFn: () => api.getMoment(id) })). As features (features/\*) não devem consumir o packages/contracts diretamente.

### 6.2. Padrões de acessibilidade por componente (checklist a11y)

- Dialog/Modal: Foco preso, aria-labelledby, Escape fecha, trap de tabulação.
- Form: Rótulos associados (<label htmlFor=...), mensagens de erro com aria-live="polite", alvo de toque ≥ 44px.
- Lista/Card: Ordem lógica de leitura; imagens com alt descritivo; ícones decorativos com aria-hidden="true".
- Teclado: Todo componente interativo (botões, links, inputs) deve ser navegável e operável sem mouse.

### 6.3. Padrões de UX: loading, empty, error

- Loading: Placeholders esqueléticos (skeleton) onde importa (acima da dobra). Evitar "pulgas" de layout (CLS) usando min-height nos contêineres.
- Empty: Mensagem contextual com CTA (ex: "Nenhum momento encontrado. Adicione seu primeiro momento").
- Error: Mensagens curtas baseadas em error.code (4.4) e ação clara (tentar novamente, voltar). Sempre mostrar o trace_id (2.3) em algum lugar (ex: "clique para detalhes").

### 6.4. Formulários e validação em múltiplas etapas

Validar a cada etapa com Zod; persistir rascunho leve em memória (Zustand).
Salvar no servidor apenas ao final (salvo upload pesado).
Indicar progresso (ex.: 3/5) e permitir retorno seguro às etapas anteriores.

## 7. Padrões de Roteamento e Navegação (SPA ↔ Edge)

Rotas privadas (SPA): Protegidas por sessão; dados via React Query.
Rotas públicas (Edge): Visualização de compartilhamentos; noindex, sem sessão.
Prefetch: Prefetch em hover/focus (desktop) ou touchstart (mobile), evitando custo em 3G.

### 7.1. Padrões de URL, slugs e anchors

Slugs estáveis para capítulos (ex: /chapters/primeiros-passos).
Anchors para slots relevantes (ex: #video).
Evitar informações sensíveis na URL (sem IDs de usuários ou e-mails).

Padronizar params curtos: :momentId, :shareId.

### 7.2. Code splitting

import() dinâmico por rota/página (features/_/pages/_).
Componentes raros/pesados (ex: editor de imagem) carregados sob demanda (on demand).

### 7.3. Deep links e breadcrumbs

Breadcrumbs refletem capítulos/subseções; links copiados preservam o contexto atual (anchor).
Tokens de share são opacos e não revelam IDs internos.

## 8. Estado, Dados e Validação no Front (SPA)

Esta é uma das seções mais importantes. A distinção clara entre estado do servidor e estado da UI é crítica para a manutenibilidade.

### 8.1. React Query (Server State)

Fonte Canônica: RQ é a fonte da verdade para dados do servidor.
O que é: useQuery(["moments", id], ...) é o "dono" dos dados do momento. Ele gerencia cache, revalidação, staleTime, etc.
Chaves: Padronizadas por recurso (ex: ["moments"], ["moments", id], ["me","usage"]).
staleTime: Ajustado por tipo de dado (uso/quotas mais curto; capítulos mais longo).
Mutations: Devem invalidar seletivamente (ex: queryClient.invalidateQueries(["moments"])). Usar optimistic updates apenas quando o risco de falha for baixo e a UX for muito beneficiada.
Anti-Padrão (NÃO FAÇA):Não use useEffect + useState + fetch para buscar dados. Isso é reinventar o React Query de forma incorreta.
Não passe dados do RQ para o Zustand (8.2) "só para usar". Os dados devem ser lidos do useQuery.
Exemplo: PÉSSIMO: useQuery(["moments"], { onSuccess: (data) => zustandStore.set({ moments: data }) }).
Por quê? Você acaba de criar duas fontes da verdade. O cache do React Query (que revalida em background) ficará dessincronizado do seu store Zustand. Isso causa bugs de dados "velhos" (stale data) que são impossíveis de depurar e quebra a revalidação de cache.
O Correto: A UI lê os momentos de useQuery(["moments"]). Se a UI precisar de um "momento selecionado", o Zustand armazena apenas o selectedMomentId: "uuid-123", e a UI usa esse ID para buscar o objeto completo do cache do React Query.

### 8.2. Zustand (UI State)

Fonte Canônica: Zustand é a fonte da verdade para estado efêmero e local da UI.
O que é: Estado que não vem do servidor e que não sobrevive a um refresh (a menos que persistido intencionalmente).
Exemplos: "O modal de edição está aberto?" (isEditModalOpen), "Qual passo do wizard de 5 etapas o usuário está?" (currentStep: 3), "O que o usuário digitou no formulário antes de salvar?" (draftMoment).
Regra: NÃO duplicar dados do servidor no Zustand.

### 8.3. Validação com Zod (Cliente)

Schemas por feature (ex: features/moments/validations/moment.schema.ts).
Mensagens de erro linkadas ao i18n.
Validações cruzadas (ex.: número de fotos + vídeo ≤ limite do momento).
Zod deve ser usado na borda da UI (em formulários) e na borda da API (nos deps.py) para garantir consistência.

### 8.4. Mocks e Desenvolvimento Offline (msw)

Usar msw (Mock Service Worker) para interceptar requests em modo development e test.
Handlers para rotas principais (moments, uploads, guestbook).
Fixtures em tests/web/fixtures para estados típicos (sem mídia, com 3 fotos, etc.).

### 8.5. Tratamento de erros na UI (boundary e toasts)

Error Boundary (React) por feature captura exceções de render/hook.
Toasts/Alerts baseados em error.code (ver 4.4) para mensagens amigáveis.
Interceptor de API (Obrigatório): O client de API (lib/api-client) deve ter um interceptador global de respostas.Se status === 401 (ex: auth.session.invalid), redireciona para /login.
Se status === 402 e code === "quota.recurrent_limit.exceeded", ele não deve exibir um erro genérico. Ele deve chamar o store do Zustand (ex: useUpsellStore.openModal("recurrent_social")) para abrir o modal de upsell de "Pacotes de Repetição" correto.
Logs de cliente (telemetria) nunca incluem PII; anexar trace_id quando houver (ver 2.3).

## 9. Upload de Mídia (Detalhamento da Feature Core)

Localizado em apps/web/src/lib/upload/. Esta é a feature crítica que demanda alta resiliência.

### 9.1. Componentes Principais do Upload Manager

- queue.ts: A "fila de espera". Gerencia a concorrência (ex: 3 uploads simultâneos), backoff exponencial (se a API falhar, esperar 1s, 2s, 4s...), cancelamento e prioridade (fotos são mais leves, vão antes de vídeos).
- multipart.ts: O "motor". Conhece a lógica de multipart da S3/R2. Sabe como chamar /uploads/init para obter o uploadId e as URLs, como fatiar o arquivo em partes (chunks), e como chamar /uploads/complete com os ETags das partes.
- persister.ts: O "cofre" (IndexedDB). Este é o cérebro da resiliência. Ele armazena o estado da fila no IndexedDB. Se o usuário fechar o navegador com 5 arquivos na fila, ao reabrir, o persister.ts recarrega a fila e continua de onde parou. Ele salva o uploadId e quais parts (partes) já foram concluídas (com seus ETags), para que o multipart.ts possa retomar o envio apenas das partes que faltam.
- network.ts: O "vigia". Ele usa navigator.onLine e window.addEventListener para pausar a fila (queue.ts) se a rede cair, e retomá-la automaticamente quando a rede voltar.
- preprocessor.ts: O "inspetor". Antes de enfileirar, ele lê o arquivo: valida o MIME type, checa a duração do vídeo (≤ 10s) usando HTMLVideoElement, e lê o EXIF para corrigir a orientação de fotos (JPEGs de celular).

hooks.ts: useUploadQueue para integração com a UI (progresso por item e por lote).

### 9.2. Estados e Transições

idle → queued → preprocessing → uploading(parts) → completing → done | failed(retryable/non-retryable)
A UI reflete estado por item e por lote; falhas recuperáveis disparam retry com backoff.

### 9.3. Estratégias de Resiliência (Rede Móvel)

Pausar fila em saveData=true ou bateria crítica; retomar manual ou automaticamente.
Reduzir concorrência em dispositivos mais fracos.
Cenário Crítico (O que acontece se...): O usuário está enviando um vídeo de 100MB (10 partes de 10MB). Ele envia 7 partes (70MB). A URL pré-assinada (presign) expira antes dele enviar a parte 8.Solução: O multipart.ts recebe um erro 403 (Expired) da S3/R2.
Ele não descarta o upload.
Ele sinaliza para a queue.ts que precisa "renovar" o presign.
A queue.ts chama a API (/uploads/init) novamente, passando o uploadId original.
A API gera novas URLs pré-assinadas para as partes restantes (8, 9, 10).
O multipart.ts recebe as novas URLs e continua o upload exatamente da parte 8, sem perder os 70MB já enviados. Isso é possível graças ao persister.ts que guardou os ETags das partes 1-7.
Visibilidade: Reduzir concorrência (visibilitychange) quando a aba está em background.

### 9.4. Contratos Mínimos do Uploader

```typescript
// apps/web/src/lib/upload/types.ts
export type UploadKind = "photo" | "video" | "audio";

export interface UploadItem {
  id: string; // ID local (ex: UUID)
  kind: UploadKind;
  file: File;
  status:
    | "queued"
    | "preprocessing"
    | "uploading"
    | "completing"
    | "done"
    | "failed";
  progress: number; // 0..1

  // Metadados para resiliência (salvos no IndexedDB)
  uploadId?: string; // ID da sessão multipart (vem da API)
  parts?: { index: number; etag?: string; status: "pending" | "done" }[];
  checksum?: string; // Checksum do arquivo local
}
```

## 10. Chaves de Armazenamento (S3/R2)

- Originais: media/u/{account}/{asset}/original.{ext}
- Derivados: media/u/{account}/{asset}/{preset}/...
- Exports: exports/{account}/{export_id}.zip

Justificativa: Previsibilidade para compor URLs/paths; separa originais de derivados (recriáveis).

### 10.1. Presets de Derivados (Workers)

Imagens: thumb (ex: 400w), card (800w), full (1600w) - (WebP/AVIF).
Vídeo: H.264/H.265; duração máxima de 10s preservada.
Áudio: Normalizar bitrate; gerar waveform opcional.

### 10.2. Metadados Relevantes

Preservar/normalizar rotação (EXIF) e timestamp de captura.
Checksums/ETag registrados no DB (asset) para auditoria e idempotência.

### 10.3. Política de Nomes (Exports e Lixo)

exports/{account}/{export_id}.zip com janela de validade (ex: 7 dias).
Mover artefatos órfãos para prefixo trash/ antes da remoção definitiva.

## 11. Acessibilidade (a11y) e Internacionalização (i18n)

### 11.1. Tokens e Contraste

Tokens de cor com pares claro/escuro; contraste mínimo WCAG AA.
Tipografia com hierarquia clara.

### 11.2. Leitura de Tela (SR) e Foco

Elementos interativos com rótulos acessíveis (aria-label); ordem de foco consistente.
Exemplo Concreto: Para um toast de "Upload concluído", use aria-live="polite" (anuncia sem interromper) ou role="status". Para um erro de formulário, use aria-live="assertive" (anuncia imediatamente).
Indicar visualmente o foco (focus-visible).

### 11.3. i18n: Chaves, Pluralização e Formatação

Chaves com namespace por feature (moments.title.edit).
Pluralização correta ("1 momento", "2 momentos").
Datas e números via Intl.\*.

### 11.4. Testes rápidos de a11y no fluxo de PR

Rodar axe-core em páginas-chave (ver 2.4).
Inspeção manual de ARIA e foco em componentes novos.

## 12. Padrões de Segurança (UI & API)

(Excluindo DevOps, focado no App)

### 12.1. Conteúdo Embutido e Sanitização (UI)

Evitar dangerouslySetInnerHTML.
Quando inevitável (ex: editor de texto rico no Guestbook), sanitizar a saída no cliente (ex: DOMPurify) e re-validar no servidor.
Risco: Se um usuário no Guestbook digitar <img src=x onerror="alert('XSS')"> ou <script src="http://evil.com/...">, isso não pode ser renderizado.
Tratar inputs do usuário como texto por padrão.

### 12.2. Proteções Básicas de Navegação (UI)

rel="noopener noreferrer" em target="\_blank".
Cabeçalhos anti-clickjacking (X-Frame-Options) e CSP são tratados na apps/api e apps/edge.

### 12.3. Dados Sensíveis em Tela e Histórico (UI)

Evitar que dados sensíveis (ex: nome do cofre) apareçam no <title> da página ou na URL.
Implicação: Dados do Vault ou Health (6.0) nunca devem ser armazenados no localStorage.
Limpar estado local (Zustand, RQ cache) ao deslogar (queryClient.clear()).

### 12.4. Padrão de Segurança de Endpoint (API)

A segurança da UI (12.1-12.3) é uma camada de defesa. A segurança canônica é aplicada na API.

Segurança por Padrão: A API nunca deve confiar no cliente. Todo input é untrusted.
Autorização Explícita: Toda rota em apps/api DEVE definir sua política de autorização (autenticação) via Depends() (FastAPI).
RBAC (Role-Based Access Control):A lógica de RBAC (deps.py) deve ser injetada antes da lógica de negócio.
Exemplo: def get_moment(moment_id: UUID, user: User = Depends(get_user_with_role("viewer"))).
A lógica de quem pode ver o quê está centralizada em deps.py e mapeada em docs/rbac-matrix.md.
RLS (Row-Level Security): Para dados ultra-sensíveis (Vault, Health), o RLS (Row-Level Security) no banco de dados (PostgreSQL) é a última linha de defesa, garantindo que, mesmo que a API tenha um bug, o banco não retorne dados de outro usuário.
Validação de Input: Pydantic é a primeira linha de defesa (validação de tipo, formato). Lógica de negócio (ex: "esse nome é único?") é a segunda linha, aplicada na camada de domínio/serviço.

## 13. Rastreabilidade de Dados (UI → API → DB)

Mapeamento de fluxos críticos para depuração de regras de negócio.

(Fonte canônica completa: docs/api-db-traceability.md)

| Fluxo           | UI/Trigger        | API (FastAPI)                    | Tabelas (DB)           |
| --------------- | ----------------- | -------------------------------- | ---------------------- |
| Sessão          | Login Form        | /auth/login                      | app_user, account_user |
| Upload          | Dropzone          | /uploads/init, /uploads/complete | upload_session, asset  |
| Transcode       | (Automático)      | (Worker) → PATCH /assets/{id}    | asset, asset_variant   |
| Share (Público) | Click (Share)     | /moments/{id}/share              | share_link             |
| Guestbook       | Form (Guest)      | /guestbook                       | guestbook_entry        |
| Capsule         | Button (Seal)     | /capsules/{id}/seal              | capsule, capsule_item  |
| Vault           | (RBAC)            | /vault/\*                        | vault_document         |
| Health          | (RBAC)            | /health/\*                       | health_measurement     |
| Print           | Button (Order)    | /print-jobs/\*                   | print_job              |
| Export          | Button (Download) | /export (API) → (Worker)         | export_job             |
| Quotas          | (Automático)      | /me/usage (Enforced deps.py)     | v_effective_quotas     |

## 14. Convenções Adicionais

### 14.1. Estilo de Código e Nomes

Imports: Absolutos (@/) primeiro, relativos (./) depois. Agrupar.
CSS: Tokens (CSS vars) primeiro; tailwind classes depois. Evitar style= hardcoded.
Comentários: Explicar o "porquê" (a decisão de negócio), não o "o quê" (o código óbvio).

### 14.2. Feature Flags e Configuração

Flags lidas do servidor (ex: /me/features) e injetadas no cliente.
O front deve degradar graciosamente (esconder o feature) se a flag estiver desligada.

### 14.3. Padrões de Comentários e READMEs Locais

Cada feature/_ e lib/_ com lógica relevante deve ter um README.md local com propósito, limites e exemplos mínimos.

## 15. O "Chão de Fábrica" (Operações e Processos)

Esta seção define como o time de engenharia opera no dia-a-dia. O código acima é o "o quê", isto é o "como".

### 15.0. Filosofia de Testes (A Pirâmide)

Testes são a principal ferramenta de qualidade e a rede de segurança contra regressões.

| Nível                   | Onde                                                              | O quê                                                                                                                               | Ferramentas                                               | Meta                                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: Unidade              | apps/api/tests/unit, apps/web/tests/unit, apps/workers/tests/unit | Lógica pura. Funções em domain/ (API), utils/ (Packages), hooks puros (Web), lógica de parsing (Workers).                           | pytest (Python), vitest (Front-end)                       | Muito rápidos, devem rodar em < 10 segundos.                                                                                                                                                                            |
| 2: Integração           | apps/api/tests/integration                                        | Testar a API "de fora para dentro", mas sem a UI. Validar se a API (routes/) + deps.py (Segurança) + db/ (Models) funcionam juntos. | pytest + docker-compose (rodando um banco de testes real) | Validar que uma chamada POST /moments realmente cria a linha no banco e que as checagens de RBAC (12.4) e quotas (4.3) funcionam.                                                                                       |
| 3: Contrato (Front-end) | apps/web/tests/contract                                           | Validar a reação da UI aos contratos da API.                                                                                        | vitest + msw (Mock Service Worker, ver 8.4)               | Garantir que a UI (isolada do backend real) reage corretamente aos contratos da API, como exibir a tela de "Limite Atingido" quando a API (mockada) retorna um erro { "code": "quota.recurrent_limit.exceeded" } (4.4). |
| 4: E2E                  | tests/e2e/                                                        | Fluxos críticos do usuário, ponta-a-ponta, simulando o clique.                                                                      | playwright                                                | Cobrir apenas os 3-5 "caminhos felizes" que não podem quebrar: (1) Login, (2) Upload de Foto, (3) Compartilhamento (Share).                                                                                             |

Aviso: São lentos, caros e frágeis. Não teste todas as bordas aqui.

### 15.1. O Processo de PR (Do Feature ao Merge)

Branch: Crie a partir do main (ou develop): feature/nome-da-feature ou fix/bug-xyz.
Desenvolva: Siga as convenções (14.1) e o esqueleto (6.1).
Teste: Adicione testes (15.0) para a nova lógica. Rode pnpm test e pnpm test:e2e localmente.
PR: Abra um Pull Request contra o main. Descreva o "porquê" da mudança e "como" testá-la.
CI Gates: Aguarde os Quality Gates (2.4) passarem (Lint, Testes, Bundle, A11y).
Review: Peça revisão de ao menos um CODEOWNER da área impactada.O que o Revisor procura:A lógica de negócio está correta?
Os testes cobrem os "caminhos infelizes" (erros, bordas)?
A mudança quebra algum contrato da API (4.6)?
A mudança segue os padrões de estado (8.0)?
A mudança considera a acessibilidade (11.0) e segurança (12.4)?
Merge: Após aprovação e CI verde, faça o merge (preferencialmente squash and merge para manter o histórico do main limpo).

### 15.2. Migrações de Banco de Dados (Alembic)

Alterar o banco (apps/api/db/models.py) exige uma migração. Este é um processo de alto risco.

Gerar Migração:

```bash
# Dentro do workspace da API (apps/api)
cd apps/api
alembic revision --autogenerate -m "Adiciona tabela capsule_items"
```

Revisar Script: Abra o arquivo gerado em `apps/api/alembic/versions/` e revise o código Python. O autogenerate pode errar.
Testar Local: Rode a migração no seu Docker local:

```bash
cd apps/api
alembic upgrade head
```

Commit: Commite ambos (models.py e o script de migração) no mesmo PR.

### 15.2.1. Migrações Zero-Downtime (Obrigatório)

Não podemos travar o banco ou quebrar a API em produção.
Nunca faça uma migração destrutiva (como DROP COLUMN ou RENAME COLUMN) em um único deploy.

Exemplo (Adicionando Coluna):PR 1: Adiciona a nova coluna (new_column) no models.py (com nullable=True) e gera a migração.
Deploy 1: Roda a migração (adiciona a coluna). O código antigo da API (ainda rodando) ignora a coluna. O novo código da API (que começa a subir) sabe da coluna.
Exemplo (Removendo Coluna old_column):PR 1: Modifica o código da API para parar de ler e escrever na old_column.
Deploy 1: O código da API agora ignora old_column.
PR 2: Gera a migração alembic para DROP COLUMN old_column.
Deploy 2 (Final): Roda a migração de remoção.

### 15.3. Filosofia de Erros (Retry vs. DLQ)

O "como" lidar com falhas, especialmente em apps/workers (Modal).

Retry (Tente de Novo): Para erros transitórios (ex: 503 Service Unavailable, timeout de rede, 429 Too Many Requests).Implementação: A própria Cloudflare Queues deve ser configurada para retries automáticos com backoff exponencial. A lógica do worker (Modal) não precisa implementar tenacity, ela apenas falha. A fila garante a re-execução.
DLQ (Dead-Letter Queue / Desista): Para erros definitivos (ex: 404 (asset original sumiu), 401 (token de serviço inválido), arquivo de mídia corrompido que o ffmpeg não lê).Implementação: A Cloudflare Queues deve ser configurada para, após N falhas, enviar a mensagem para uma Dead-Letter Queue (outra fila).
Regra: Não re-tentar indefinidamente. A DLQ deve gerar um alerta de observabilidade (2.7). A análise é manual via Runbook.

### 15.4. Runbooks e Acesso (O que fazer às 3h da manhã)

Fonte da Verdade: docs/runbooks/.
Se a fila de transcode (apps/workers) travar: consulte docs/runbooks/001-fila-travada.md.Ação: Verificar o dashboard da Cloudflare Queues (DLQ), não uma tabela no banco.
Se o faturamento (webhooks) parar: consulte docs/runbooks/002-webhooks-falhando.md.
Acesso: O apps/admin/cli (scripts) é a ferramenta para executar ações dos runbooks (ex: pnpm run admin:reprocessar-dlq).

## 16. Diretrizes de Documentação

### 16.1. READMEs e Exemplos

O README.md da raiz (3.1) deve focar no setup (Guia Rápido).
READMEs de Features: Cada features/\* (ex: features/capsule/README.md) deve documentar:Propósito: O que essa feature faz (1 linha).
Contratos (API): Quais endpoints da API ela consome (links para o API Reference).
Estado Local (Zustand): Qual estado local (store.ts) ela gerencia.
Decisões: Ex: "Por que o estado do formulário usa Zustand (para persistir rascunhos entre abas) em vez de useState local."

### 16.2. Glossário Mínimo do Domínio

- Momento: Registro com slots de mídia (3 fotos, 1 vídeo ≤ 10 s, 1 áudio) e textos.
- Capítulo: Agrupador de momentos.
- Cápsula: Coleção selável para abrir no futuro.
- Cofre (Vault): Documentos privados sensíveis (RBAC owner-only).
- Guestbook: Mural com moderação e mídia opcional.
- PCE (Provisão de Custo de Existência): A reserva financeira (do Visão & Viabilidade) que cobre o custo vitalício (R$ 25,00 por venda).
- Custo de Estoque: O "sangramento" anual estimado (≈ R$ 1,25/ano) para manter uma conta, derivado da provisão do PCE distribuída ao longo de 20 anos.

### 16.3. Diagramas Mermaid

Manter rótulos ASCII simples para evitar erros no parser.
Usar para ilustrar fluxos (Sequence) ou arquitetura (C4, se necessário).

### 16.4. Registro de Decisões de Arquitetura (ADRs)

Obrigatório: Toda decisão de arquitetura significativa (ex: "Por que Modal e não Lambda?", "Por que Cloudflare Queues e não SQS?", "Por que docker-compose e não devcontainers?") deve ser documentada em docs/adrs/NNN-titulo-da-decisao.md.
Formato: Um ADR simples deve conter: Contexto (O problema), Decisão (O que escolhemos), Consequências (O que ganhamos e o que perdemos).
Justificativa: Isso evita que o time re-litigue as mesmas decisões a cada 6 meses.

## 17. Critérios de Aceite (Estrutura)

- DX: Um novo dev consegue rodar o projeto (seção 1) e entender o fluxo de um request (seção 2.3).
- Fronteiras: web (SPA), edge (SSR público), api e workers refletidas no repositório.
- Contrato: packages/contracts gerado do OpenAPI e adotado pelo front.
- Features: features/\* mapeadas aos casos de uso do domínio.
- Rastreabilidade: docs/api-db-traceability.md coerente com o Modelo de Dados.
- Resiliência: O Upload Manager (seção 9) é implementado com resiliência (IndexedDB, retry) em mente.
- Processo: O "Chão de Fábrica" (seção 15) define claramente os processos de PR, migração e incidentes.
