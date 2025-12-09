# DevOps, Observabilidade & Operação - Baby Book

## Sumário

- [Objetivo, Escopo e o "God SLO"](#objetivo-escopo-e-o-god-slo)
- [Ambientes e Topologia Operacional](#ambientes-e-topologia-operacional)
  - [Domínios, DNS e Roteamento (A Decisão do Subdomínio)](#domínios-dns-e-roteamento-a-decisão-do-subdomínio)
  - [Edge (Cloudflare Pages/Workers)](#edge-cloudflare-pagesworkers)
  - [API (FastAPI no Fly.io)](#api-fastapi-no-flyio)
  - [Banco de Dados (Neon Postgres)](#banco-de-dados-neon-postgres)
  - [Storage (Cloudflare R2 + Backblaze B2 — S3 API)](#storage-cloudflare-r2--backblaze-b2--s3-api)
  - [Workers (Modal) & Fila (Cloudflare Queues)](#workers-modal--fila-cloudflare-queues)
  - [Matriz de Responsabilidades (RACI) e Plantão](#matriz-de-responsabilidades-raci-e-plantão)
- [CI/CD e Promoção Entre Ambientes](#cicd-e-promoção-entre-ambientes)
  - [Estratégia de Branches e Versionamento](#estratégia-de-branches-e-versionamento)
  - [Pipelines por Artefato (Web/API/Workers)](#pipelines-por-artefato-webapiworkers)
  - [Verificações de Contrato (OpenAPI) e Compatibilidade](#verificações-de-contrato-openapi-e-compatibilidade)
  - [Deploy Canário e Rollback](#deploy-canário-e-rollback)
  - [Requisitos de Aprovação e Bloqueios](#requisitos-de-aprovação-e-bloqueios)
- [Segurança Operacional](#segurança-operacional)
  - [Segredos, Rotação e Acesso Break-Glass](#segredos-rotação-e-acesso-break-glass)
  - [RBAC e Least Privilege por Provedor](#rbac-e-least-privilege-por-provedor)
  - [Blindagem da Origem (Origin Shielding)](#blindagem-da-origem-origin-shielding)
  - [Cabeçalhos (CSP/HSTS) e Cookies](#cabeçalhos-csphsts-e-cookies)
  - [CSRF, CORS e Same-Site (A Implicação da Topologia)](#csrf-cors-e-same-site-a-implicação-da-topologia)
  - [Supply Chain: SBOM, Dependency Review e Scans](#supply-chain-sbom-dependency-review-e-scans)
  - [LGPD: Registro de Tratamento e Acesso a Dados](#lgpd-registro-de-tratamento-e-acesso-a-dados)
  - [Operação de Dados Sensíveis (RLS/ALE)](#operação-de-dados-sensíveis-rlsale)
- [Observabilidade (Os 3 Pilares: App, Fila, Custo)](#observabilidade-os-3-pilares-app-fila-custo)
  - [Logging Estruturado e Correlação (Trace ID)](#logging-estruturado-e-correlação-trace-id)
  - [Métricas (SLIs) por Superfície](#métricas-slis-por-superfície)
  - [Tracing, Sampling e Propagação](#tracing-sampling-e-propagação)
  - [Dashboards por Fronteira](#dashboards-por-fronteira)
  - [Alertas, SLOs e Runbooks](#alertas-slos-e-runbooks)
  - [Synthetic Monitoring e Probes](#synthetic-monitoring-e-probes)
- [SLOs e Orçamento de Erros](#slos-e-orçamento-de-erros)
  - [O "God SLO" (Custo de Estoque)](#o-god-slo-custo-de-estoque)
  - [SLOs de Performance e Disponibilidade](#slos-de-performance-e-disponibilidade)
  - [Cálculo, Janelas e Burn Rate](#cálculo-janelas-e-burn-rate)
  - [Política de Freeze e Exceções](#política-de-freeze-e-exceções)
- [Resiliência, Backup e Recuperação](#resiliência-backup-e-recuperação)
  - [PITR (Neon) — RPO/RTO e RLS](#pitr-neon--rpor-to-e-rls)
  - [Exportações e Lifecycle (B2)](#exportações-e-lifecycle-b2)
  - [Graceful Degradation e Modo Somente Leitura](#graceful-degradation-e-modo-somente-leitura)
  - [Chaos Days e Testes de DR](#chaos-days-e-testes-de-dr)
- [Custo, Capacidade e Prewarming](#custo-capacidade-e-prewarming)
  - [Modelo de Degraus (Step-Cost)](#modelo-de-degraus-step-cost)
  - [Orçamentos e Quotas Operacionais](#orçamentos-e-quotas-operacionais)
  - [Janela Sazonal (Dia das Mães)](#janela-sazonal-dia-das-mães)
  - [FinOps: Tagging, Showback e Unidade de Custo](#finops-tagging-showback-e-unidade-de-custo)
- [Runbooks Operacionais](#runbooks-operacionais)
  - [Prewarming Coordenado (Pico Sazonal)](#prewarming-coordenado-pico-sazonal)
  - [PITR Cutover (Neon)](#pitr-cutover-neon)
  - [Resposta a Incidentes (Sev1–Sev3)](#resposta-a-incidentes-sev1se-v3)
  - [Incidente de Segurança (Rotação de Chaves)](#incidente-de-segurança-rotação-de-chaves)
  - [Export Cost Guardrail](#export-cost-guardrail)
  - [Falhas de Upload (Multipart)](#falhas-de-upload-multipart)
  - [Análise e Reprocessamento da DLQ (Cloudflare Queues)](#análise-e-reprocessamento-da-dlq-cloudflare-queues)
- [Quality Gates e Critérios de Aceite de Pipeline](#quality-gates-e-critérios-de-aceite-de-pipeline)
- [Tabela de Defaults Operacionais (Timeouts, TTLs, Retries)](#tabela-de-defaults-operacionais-timeouts-ttls-retries)
- [Checklist de Release](#checklist-de-release)
- [Impacto Cruzado com Outros Documentos](#impacto-cruzado-com-outros-documentos)
- [Anexos Práticos](#anexos-práticos)
  - [Cloudflare Workers — Cabeçalhos SSR](#cloudflare-workers--cabeçalhos-ssr)
  - [Fly.io — fly.toml (Healthcheck)](#flyio--flytoml-healthcheck)
  - [Política de Lifecycle — B2](#política-de-lifecycle--b2)
  - [Alerta Composto — Burn Rate](#alerta-composto--burn-rate)
  - [Exemplo: Configuração de Pool asyncpg](#exemplo-configuração-de-pool-asyncpg)
  - [Exemplo: Lógica do Produtor (API $\rightarrow$ Fila)](#exemplo-lógica-do-produtor-api-$\rightarrow$-fila)

## 1. Objetivo, Escopo e o "God SLO"

Objetivo: Este é o guia prático e canônico para implantar, monitorar e manter o Baby Book em produção. Ele cobre ambientes, deploy, segurança, observabilidade, resiliência e custos.
Escopo: Este documento assume a arquitetura definida no Arquitetura & Domínio: Edge (Cloudflare) para SSR público, API FastAPI (Fly.io), DB Neon (Postgres), Storage B2 (S3 API), Fila (Cloudflare Queues) e Workers (Modal).
Este documento é a "fonte da verdade" para o SRE (Site Reliability Engineer) de plantão às 3 da manhã. Ele traduz os requisitos dos manuais de Arquitetura e Estrutura do Projeto em procedimentos operacionais, métricas acionáveis e runbooks claros.
O "God SLO": Acima de todos os SLOs de performance e disponibilidade (Seção 6.2), existe o "God SLO" definido na Visão & Viabilidade:

God SLO (Custo): Custo de Estoque (PCE) $\le$ R$ 2,00/ano/conta.
Implicação Operacional: Esta é a nossa diretriz principal. Uma otimização de performance (ex: um worker mais rápido) que aumente o custo de compute (Modal) em R$ 0,50/ano/conta é uma falha de SLO, mesmo que melhore a latência. A engenharia de DevOps e Plataforma deve otimizar primeiro para Custo, depois para Performance.
Riscos & Mitigação:

Desalinhamento Doc vs. Infra: Mitigado por IaC (Terraform) como fonte única da verdade e quality gates (§10) que validam a infra.
Dependência de Conhecimento Tribal: Mitigado por runbooks (§9) versionados, detalhados e acessíveis (linkados em alertas). O conhecimento deve estar no documento, não na cabeça de um indivíduo.
Custos Descontrolados: Mitigado por budgets (§8.2), alertas de derivação (§5.5) que pegam anomalias cedo, e freeze de release (§6.4) se o FinOps (§8.4) falhar.
Regressão de Segurança: Mitigado por verificações automáticas de headers/CSP, secret scanning (§4.1) e gates de Semgrep (§4.6) no CI.

## 2. Ambientes e Topologia Operacional

Ambientes: dev, staging e prod.
dev: Pré-visualização automática (ex: Neon branching por PR) e recursos mínimos. Foco em velocidade de iteração.
staging: Shape semelhante a prod (mesmos componentes: API, Fila, Worker), porém com scale-down, quotas e rate limits mais restritivos. Usado para smoke tests e chaos days (§7.4).
prod: Ambiente do cliente. Deploy via canário (§3.4) e monitoramento SLO completo (§6).

### 2.1. Domínios, DNS e Roteamento (A Decisão do Subdomínio)

Domínio raiz: babybook.com (marketing, landing page)
App autenticado (SPA): app.babybook.com (Estático via Pages; consome API).
Compartilhamento público (SSR): share.babybook.com (Workers/Pages, noindex).
API: api.babybook.com (Fly.io, TLS obrigatório; HSTS; blindado, ver §4.3).
CDN de mídia: media.babybook.com (Origem B2, cache agressivo para derivados).
TTL recomendado (DNS): 300–600 s em prod; 60 s em staging/dev. TTLs moderados em prod permitem um rollback de DNS (emergência) em tempo razoável.
Protocolos: HTTP/3 habilitado no Edge; Brotli para HTML/JSON; gzip como fallback.
Implicação Operacional (API em Subdomínio): A escolha de api.babybook.com (em vez de app.babybook.com/api/) foi uma decisão de arquitetura para desacoplar o roteamento da API (Fly.io) do roteamento da SPA (Cloudflare Pages), simplificando a infra.
Consequência de Segurança (Ver §4.5): Esta decisão força implicações de segurança críticas:CORS: A API deve responder a OPTIONS (pre-flight) e retornar Access-Control-Allow-Origin: https://app.babybook.com, Vary: Origin, e Access-Control-Allow-Credentials: true.
Cookies: Para a sessão funcionar, o cookie (\_\_Host-session) deve ter SameSite=None; Secure. Isso desliga a proteção nativa do navegador contra CSRF.
Implicação no CSRF: A configuração SameSite=None é necessária para o cookie de sessão funcionar cross-domain, mas ela desliga a proteção nativa do navegador que SameSite=Lax ofereceria. Isso torna a proteção explícita via token (X-CSRF-Token, §4.5) a única linha de defesa contra CSRF para requisições XHR (fetch/axios), sendo sua implementação não-negociável.

### 2.2. Edge (Cloudflare Pages/Workers)

SSR público (/s/:token): HTML-first, ETag fraco e Cache-Control: public, max-age=300, stale-while-revalidate=60. O stale-while-revalidate é vital para picos: o usuário vê o conteúdo rápido (e obsoleto por 60s) enquanto o worker revalida em background.
CSP: default-src 'self'; img-src 'self' data: https://media.babybook.com; frame-ancestors 'none'. frame-ancestors 'none' é a mitigação de clickjacking.
WAF: Managed rules (OWASP Top 10, SQLi, XSS) e bot fight mode leve. Rate limit para /s/\* (ex.: 60 rps/IP) para prevenir scraping agressivo ou DoS no SSR.
Crons (Prewarm): Janelas sazonais configuráveis; seeds de cache para páginas populares.
Headers: X-Robots-Tag: noindex (crítico para share.babybook.com não poluir o Google), Referrer-Policy: no-referrer, X-Content-Type-Options: nosniff.

### 2.3. API (FastAPI no Fly.io)

Máquinas: min_machines_running = 2 em prod para alta disponibilidade (HA). auto_stop_machines = true em staging/dev para custo zero.
Health Checks (fly.toml):[checks.health] (Liveness): type = "http", path = "/health". Deve ser leve e não tocar em dependências (DB/Fila). Se falhar, o Fly reinicia a máquina.
[checks.ready] (Readiness): type = "http", path = "/ready". Deve checar dependências (ex: SELECT 1 no DB). Se falhar, o Fly para de enviar tráfego para esta máquina, mas não a reinicia.
Autoscaling: Horizontal por latência p95 (SLO de §6.2) e fila de conexões.
Rate-limit: Por IP/rota e token bucket por usuário; 429 com Retry-After.
Pool DB (Neon): Conexão via pooler do Neon (PgBouncer), que opera em modo "transaction pooling".Pool Aplicação (FastAPI/asyncpg): O gargalo é o pooler do Neon (ex: 100 conexões), não o banco. A soma de max_size de todas as instâncias da API não deve exceder o limite do pooler.
Implicação Crítica (RLS): O modo "transaction pooling" (PgBouncer) quebra o SET LOCAL fora de transações. A aplicação (FastAPI) deve garantir que o SET LOCAL app.account_id... (para o RLS) e a query de negócio subsequente rodem atomicamente dentro da mesma transação (BEGIN...COMMIT). Falhar nisso desliga o RLS.
max_size (ex: 10-15): Conservador. É melhor a API falhar rápido (timeout de aquisição) do que exaurir o pooler.
min_size (ex: 1-2): Baixo para scale-to-zero.
pool_acquire_timeout (ex: 2s): Falha rápida é crucial. (Ver Anexo 14.5).

### 2.4. Banco de Dados (Neon Postgres)

Branches: main (prod), staging, e branching por PR (dev/\*).Implicação DevOps: O CI deve usar o Neon branching para criar um banco de dados preview para cada PR, rodar os testes de integração contra ele, e destruí-lo no merge. Isso é um game-changer para a qualidade do teste.
PITR: Janela de 14 dias (ver §7.1); testes trimestrais de restauração.
Extensões: citext, pgcrypto, uuid-ossp/gen_random_uuid().
Observabilidade: Monitorar pg_locks, pg_stat_activity, tempo de query, bloat (especialmente em usage_counter), dead tuples; alertas para slow queries e tx_wraparound.
Segurança: Políticas de RLS (Row Level Security) ativas para dados sensíveis (Health/Vault), ver §4.8.

### 2.5. Storage (Cloudflare R2 + Backblaze B2 — S3 API)

Arquitetura híbrida de storage:

- Hot (Cloudflare R2): thumbnails, WebP previews, avatares e assets fortemente cacheados. R2 oferece egress otimizado a partir da borda, reduzindo custos quando o mesmo asset é solicitado milhares de vezes.
- Cold (Backblaze B2): originais high-res e vídeos armazenados para custo de storage mais baixo.

Buckets: bb-media (originais/derivados), bb-exports (ZIPs temporários) — com regras de lifecycle aplicadas por prefixo.
Lifecycle: Derivados com TTL curto (30d); exports 72h; reaper diário para órfãos (conforme Modelo de Dados 10.4).
Assinaturas (Presign): A API gera URLs PUT pré-assinadas ou fornece pontos de entrada TUS dependendo do caso de uso.
Segurança: Presigns restritos (key exata, content-length-range, TTL curto). Criptografia em repouso e políticas por prefixo.
Egress (Custo): A estratégia híbrida visa reduzir risco de custo dependente de acordos. O R2 reduz egress para arquivos hot; o B2 mantém custo baixo para armazenamento frio. Configurar o CDN (media.babybook.com) para privilegiar o R2 quando possível e só cair no B2 para originais sob demanda.

### 2.6. Workers (Modal) & Fila (Cloudflare Queues)

Comunicação (Fila, não Outbox): A API não usa app.outbox_event. Conforme Arquitetura (Seção 2.1), a API é o Produtor, publicando jobs diretamente na Cloudflare Queues.
Contrato da Mensagem: A API deve serializar o job em JSON, incluindo metadados críticos:trace_id (para observabilidade, §5.1)
asset_id (o que processar)
account_id (para tagging de custo)
job_type (ex: 'transcode', 'export', 'delete_asset')
Consumidor (Modal): O worker (Modal) é o Consumidor. Ele é configurado para "ouvir" a Cloudflare Queues.
Idempotência: A Fila garante entrega at-least-once. Se o worker processar o job mas falhar ao dar ACK (confirmação), a Fila vai reenviar. O worker deve ser idempotente (ex: IF asset.status != 'ready' THEN process...).
Concorrência (Modal): concurrency_limit global (ex: 50) definido na função do worker para evitar que 1000 jobs da fila tentem rodar simultaneamente, saturando o B2 ou o pool do Neon. O warm pool (ex: 10) é mantido para reduzir o cold start.
Resiliência (DLQ): A Fila (Cloudflare) é configurada para, após N falhas (ex: 3 retries), mover o job "envenenado" (ex: mídia corrupta) para uma Dead-Letter Queue (DLQ). Isso é gerenciado pela infra, não pelo DDL.

### 2.7. Matriz de Responsabilidades (RACI) e Plantão

Responsável (execução): Engenheiro de Plataforma de plantão. (Ex: Executa o runbook).
Aprovador: Líder de Engenharia/SRE. (Ex: Aprova o deploy do hotfix).
Consultado: Arquiteto de Software, Produto. (Ex: "O graceful degradation afeta qual feature?").
Informado: Suporte/CS e Stakeholders. (Ex: "O sistema está em modo leitura por 30 min").
Plantão: Janela 24x7 em picos sazonais. Handoff documentado.
Fluxo de Escalada: Alerta (Sev-3) $\rightarrow$ Plantão. Se não resolvido em 15 min ou se Sev-1/Sev-2 $\rightarrow$ Escalar para Líder de Engenharia/SRE.

## 3. CI/CD e Promoção Entre Ambientes

Fluxo trunk-based com PRs pequenos, checks obrigatórios e promoção automatizada até staging. prod exige aprovação humana e canário com guardrails claros.

### 3.1. Estratégia de Branches e Versionamento

main sempre deployable; feature/_ (branches curtos); hotfix/_ para emergências.
Tags semânticas vX.Y.Z geradas no release.
Deprecações com janela $\ge$ 90 dias e flags para desativar comportamento antigo.

### 3.2. Pipelines por Artefato (Web/API/Workers)

Web: Build $\rightarrow$ lint $\rightarrow$ e2e (smoke) $\rightarrow$ artefato estático; bundle budgets em CI.
API: ruff $\rightarrow$ mypy $\rightarrow$ pytest (com coverage $\ge$ 80%) $\rightarrow$ bandit (sem HIGH) $\rightarrow$ build Docker $\rightarrow$ trivy (sem CRITICAL) $\rightarrow$ spectral (sem breaking changes).
Workers: pytest (pipelines, golden files) $\rightarrow$ build Docker (ffmpeg) $\rightarrow$ trivy (sem CRITICAL).
Infra (IaC): terraform plan como check informativo em PRs de infra.

### 3.3. Verificações de Contrato (OpenAPI) e Compatibilidade

Lint OpenAPI (Spectral); breaking changes detectados (foco em remoção/troca de tipo) bloqueiam o build.
Contracts gerados para o front (packages/contracts) e commitados para diff visível.
Política additive-first: novos campos opcionais não quebram clientes; remoções exigem janela e feature flag no front.

### 3.4. Deploy Canário e Rollback

API/Workers: 5% $\rightarrow$ 25% $\rightarrow$ 100% com guardrails automáticos.
Métricas de Guardrail: O deploy é automaticamente revertido se, na janela de observação (ex: 5 min):Taxa de 5xx > 0.5% (vs. linha de base).
Latência p95 > 20% (vs. linha de base).
Idade da Fila (p99) > 1 min (indicador de falha no worker novo).
Taxa de Falha de Jobs (Worker) > 2%.
Rollback automático ao exceder limites. Post-deploy checks (synthetics) antes de ampliar tráfego.
Edge/Web: Atomic deploy (Pages), feature flags para mudanças de comportamento e cache purge segmentado.

### 3.5. Requisitos de Aprovação e Bloqueios

CODEOWNERS para contratos (openapi.yaml), segurança (fly.toml, Dockerfile) e migrações (alembic/versions/).
Freeze de release quando orçamento de erros estourar (ver §6) ou durante janelas de pico.
Bloqueio automático se scans de imagem encontrarem CRITICAL ou se contracts quebrados forem detectados.

## 4. Segurança Operacional

### 4.1. Segredos, Rotação e Acesso Break-Glass

Cofres: Segredos nativos dos provedores (Fly Secrets, Modal Secrets, CF Secrets); nunca em repositório.
Rotação: Semestral do segredo de sessão e chaves de serviço; rotação imediata em incidente (Runbook 9.4).
Scanning: Secret scanning (ex: gitleaks) automático em pre-commit e CI.
Break-Glass: Acesso de emergência (ex: ao Neon) é documentado, auditado, de curta duração e justificado.Auditoria Break-glass: O uso de credencial break-glass deve gerar um evento de auditoria (Sev-2) que loga quem acessou, quando e por que (justificativa). O script para usar a credencial deve ser o único local que a conhece e deve ser o responsável por enviar este log de auditoria.
Restrição RLS/ALE: Acesso break-glass ao banco não bypassa RLS/ALE (ver §4.8).

### 4.2. RBAC e Least Privilege por Provedor

Cloudflare: Escopos por zone e projeto; acesso read-only para observabilidade. Tokens de API granulares (ex: "só pode dar purge no cache").
Fly.io: Permissão apenas de deploy/secrets por ambiente; sem acesso a volumes.
Neon: Roles app_rw (aplicação), app_ro (observabilidade), migrator (Alembic). Plantão (break-glass) nunca usa app_rw.
B2: Chaves por bucket/prefix e ambiente. A API usa uma chave; o worker (Modal) usa outra (ex: app_rw só pode GET originais e PUT derivados).
Modal: Workspace segregado por ambiente; limites de concorrência por namespace.

### 4.3. Blindagem da Origem (Origin Shielding)

A API (api.babybook.com) não deve ser acessível publicamente pela internet.

Estratégia Preferencial (Argo Tunnel):Como: Rodar o daemon cloudflared como um processo sidecar (ou [processes] no fly.toml) junto à API.
Vantagem: A API não precisa de IP público. O Fly pode bloquear todo o tráfego de entrada, exceto o cloudflared. É a segurança máxima contra ataques de WAF bypass e DoS direto na origem.
Alternativa (mTLS):Como: Gerar um certificado de cliente no Cloudflare e configurar o load balancer do Fly (ou o próprio FastAPI/Uvicorn) para exigir e validar esse certificado de cliente.
Desvantagem: Mais complexo de gerenciar a rotação de certificados.

### 4.4. Cabeçalhos (CSP/HSTS) e Cookies

CSP estrita no Edge; report-only opcional em novas regras.
HSTS na API; X-Frame-Options implícito via frame-ancestors 'none'.
Cookie: \_\_Host-session; HttpOnly; Secure; Path=/; SameSite=None (pois a API está em subdomínio, ver §2.1).

### 4.5. CSRF, CORS e Same-Site (A Implicação da Topologia)

CSRF: X-CSRF-Token obrigatório em mutations XHR (padrão double-submit cookie). Essencial se SameSite=None.
CORS: Como a API está em subdomínio (api.babybook.com), ela deve lidar com CORS.Configuração: Origin pinado (https://app.babybook.com), Vary: Origin e Access-Control-Allow-Credentials: true.
Revisão periódica de preflight e allowed headers.

### 4.6. Supply Chain: SBOM, Dependency Review e Scans

SBOM via Syft; imagens escaneadas com Trivy (sem CRITICAL); Semgrep leve no PR; npm audit/pip-audit no CI.
Renovate (opcional) com janelas controladas; pin de versões em componentes críticos.
Gate de Segurança: Adicionar verificação de Semgrep/lint estático que falha o build se um endpoint de escrita (POST/PUT/DELETE) for adicionado sem a devida proteção de CSRF (ver §10).

### 4.7. LGPD: Registro de Tratamento e Acesso a Dados

Mínimo necessário: Logs sem PII; hash/pseudônimo quando imprescindível.
Direitos do titular: Export/remoção consomem rotas e runbook de suporte (tempo de atendimento meta: $\le$ 10 dias).
Retenção: Métricas/logs com janelas claras; anonymization após o prazo.

### 4.8. Operação de Dados Sensíveis (RLS/ALE)

Em alinhamento com Arquitetura 5.3 e 5.3.1, os dados de "Health" e "Vault" são protegidos por RLS (Row Level Security) e, futuramente, ALE (Application-Level Encryption).

Implicação Operacional (RLS): O SRE de plantão, mesmo com acesso break-glass (§4.1) ao banco, não conseguirá ler dados de tabelas protegidas por RLS (health_measurement, vault_document). A política de segurança é atrelada ao role da aplicação (app_rw) e o role do plantonista (operator_ro) não tem acesso.
Implicação Operacional (ALE): Dados criptografados (futuro) serão ilegíveis no banco. ALE adiciona latência (chamada a um KMS) e complexidade de rotação de chaves (KEK/DEK).
Procedimento de Debug: A depuração de problemas relacionados a esses dados deve ser feita pela camada de aplicação, usando o trace_id (§5.1) para correlacionar logs. Logs devem mascarar esses dados (ex: health_data: "[MASKED]"), mas confirmar sua presença ou ausência.

## 5. Observabilidade (Os 3 Pilares: App, Fila, Custo)

### 5.1. Logging Estruturado e Correlação (Trace ID)

Logs JSON (API/Workers):

```json
{
  "timestamp": "2025-11-10T20:30:01Z",
  "level": "INFO",
  "message": "Job received",
  "service": "workers",
  "job_type": "transcode",
  "env": "prod",
  "version": "1.2.3",
  "trace_id": "bb-trace-uuid-12345",
  "account_id_hash": "sha256-...",
  "asset_id": "uuid-asset-67890",
  "queue_time_ms": 120
}
```

Correlação: trace_id é o pilar. Conforme Estrutura do Projeto (1.3), ele deve ser propagado da UI $\rightarrow$ API $\rightarrow$ Fila (Cloudflare) $\rightarrow$ Worker (Modal).
Retenção: 14–30 dias para info; 90 dias para error (sem PII).

### 5.2. Métricas (SLIs) por Superfície

API (Fly.io): p50/p95/p99 por rota, taxa de 5xx, queue depth de DB, negócios (criação de momento, conclusão de upload).
Edge (CF Pages): TTFB, cache hit ratio, erros de render, bytes servidos (FinOps).
Workers (Modal): Throughput (jobs/seg), duração de jobs (p95), taxa de falha (transitória vs. DLQ), cold_start_time.
Fila (Cloudflare Queues): (Métricas de Fila Substituem o Outbox)queue_backlog_size (Gauge): O COUNT(\*) de mensagens na fila.
oldest_message_age_seconds (Gauge): Métrica de backlog mais crítica.
job_ack_rate (Counter): Taxa de sucesso (consumidor deu ACK).
job_retry_rate (Counter): Taxa de falhas transitórias.
dlq_message_count (Gauge): Número de jobs "envenenados" na DLQ.
DB (Neon): Tempo de query, locks, index_hit_rate, bloat, vacuum e tx_wraparound.
SLI de Custo (FinOps): Custo por mil requisições (CPM) e Custo por momento criado (derivado de §8.4).

### 5.3. Tracing, Sampling e Propagação

Sampling: Adaptativo. Erros 100%; GET /health 0,1%; sucesso 1–10% conforme tráfego.
Spans Canônicos: http.server $\rightarrow$ db.query $\rightarrow$ queue.publish (CF Queues) $\rightarrow$ queue.consume $\rightarrow$ worker.job (ffmpeg) $\rightarrow$ s3.put/get. O trace deve conectar o request da API ao job do worker via trace_id.
Propagação do trace até o cliente para debug direcionado.

### 5.4. Dashboards por Fronteira

Dashboard Executivo (Obrigatório):SLOs (percentuais).
Burn Rate (Orçamento de Erro).
Custo (Egress, Compute Workers) vs. Orçamento.
Tráfego (RPM).
Dashboard Tático (Operação - "Os 3 Pilares"):Pilar 1 (Saúde da API): Latência p95 por rota; Erros 5xx por error.code.
Pilar 2 (Saúde da Fila): Time-series da Idade da Fila (p99) e Backlog Size.
Pilar 3 (Saúde do Custo): Derivação de custo (ex: CPM, custo de egress/hora).
Dashboard Forense: Logs correlacionáveis por trace_id; drill down de spans.

### 5.5. Alertas, SLOs e Runbooks

Alertas com link direto para o runbook (§9) e dashboard relevante.

Critérios (Alinhados com Fila CF):Sev-1 (Fogo): API 5xx > 1% (5 min). Idade da Fila (p99) > 10 min (Fila travada! $\rightarrow$ Runbook 9.3).
Sev-2 (Degradação): API p95 > 500 ms (5 min). Item novo na DLQ (Fila CF) ($\rightarrow$ Runbook 9.7).
Sev-3 (Aviso): Slow query detectada, batch de retries nos workers, presign failure rate > 2%.
Alertas de FinOps: Budget mensal $\ge$ 90%, e alertas de derivação (ex: Custo/hora > 3-sigma da média móvel de 7 dias).

### 5.6. Synthetic Monitoring e Probes

Probes Periódicos (ex: a cada 5 min de 3 regiões):GET /health e GET /ready (SLO de disponibilidade).
Fluxo de Login (CSRF $\rightarrow$ POST /login).
POST /uploads/init (Checa quota e B2).
GET /s/:token_publico (Checa SSR público).
Probe de Fila (E2E): Synthetic que (1) publica um job de 'teste' (ex: asset_id_test) na Fila CF, e (2) sonda o banco de dados (Neon) até que asset.status = 'ready' para aquele ID. Ele mede o tempo total (TTR). Se TTR > 5 min, alerta Sev-2. Isso valida o loop completo: API (publicação) $\rightarrow$ Fila $\rightarrow$ Worker $\rightarrow$ DB (escrita).

## 6. SLOs e Orçamento de Erros

### 6.1. O "God SLO" (Custo de Estoque)

SLO de Custo: Custo de Estoque (PCE) $\le$ R$ 2,00/ano/conta.
Implicação: Este é o principal SLO. Uma mudança que viole este SLO (medido pelo FinOps, §8.4) deve ser tratada como um bug Sev-1.

### 6.2. SLOs de Performance e Disponibilidade

Disponibilidade (API): 99,5% / 30 dias. (Permite ~3.6h de downtime).
Leituras (API): p95 $\le$ 300 ms (cacheáveis); p95 $\le$ 500 ms (dinâmicas).
Escritas leves (API): p95 $\le$ 800 ms (incluindo publicação na Fila). Justificativa: 800ms é "invisível" para o usuário (< 1s), mas dá folga para a transação ACID no Neon e a publicação na Fila CF.
SSR público (Edge): TTFB p95 $\le$ 300 ms, hit ratio $\ge$ 80% (páginas populares).
Workers (E2E): Time-to-ready p95 $\le$ 2 min (Upload complete $\rightarrow$ status=ready).
Fila (CF Queues): Idade de processamento p95 $\le$ 5 min.

### 6.3. Cálculo, Janelas e Burn Rate

Medição request-based (API/Edge) e job-based (Fila/Workers).
Burn rate em múltiplas janelas (1h/6h/24h) para reações rápidas sem falso positivo.

### 6.4. Política de Freeze e Exceções

Freeze automático ao estourar o orçamento de erros; saída do freeze requer recuperação de SLO por 48h.
Exceções apenas para hotfixes de confiabilidade/segurança.

## 7. Resiliência, Backup e Recuperação

### 7.1. PITR (Neon) — RPO/RTO e RLS

RPO (Recovery Point Objective): $\le$ 5 min (alvo).
RTO (Recovery Time Objective): $\le$ 30 min com cutover validado (Runbook 9.2).
Implicação de RLS/ALE: Durante o drill de recuperação (§7.4), deve-se validar que as políticas de RLS (§4.8) e a infra de ALE (futuro) estão ativas no branch restaurado. Dados não podem ser restaurados "em aberto".
Ensaios: Trimestrais com checklist e validação de integridade pós-cutover.

### 7.2. Exportações e Lifecycle (B2)

Exports com validade de 72h; reaper diário remove órfãos; checksums e ETag mantidos.

### 7.3. Graceful Degradation e Modo Somente Leitura

Feature flag global para modo "somente leitura" (desabilita POST/PUT/PATCH/DELETE na API) em incidentes de DB ou manutenção planejada.
Mensagens claras (i18n) na UI e status page atualizada.

### 7.4. Chaos Days e Testes de DR

Injeção controlada de falhas (latência/timeout de B2, queda de uma instância API) em staging.

Cenário 1: Fila Travada. Pausar o consumidor (Modal). Validar: (a) queue_backlog_size e oldest_message_age sobem, (b) alerta Sev-1 dispara (§5.5), (c) probes de TTR falham.
Cenário 2: Poison Pill. Injetar um job "envenenado" (ex: asset_id inválido). Validar: (a) worker falha, (b) job é movido para a DLQ, (c) alerta Sev-2 dispara, (d) o restante da fila continua processando.
Cenário 3: Saturação de DB. Reduzir o max_size do pool de DB. Validar: (a) API p95 sobe, (b) API retorna 503/429 (falha rápida), (c) autoscaler do Fly sobe novas máquinas (pode piorar o cenário, bom de ver).
Cenário 4: Falha de Provedor (B2). Bloquear o acesso do worker ao B2. Validar: (a) Jobs de transcode falham, (b) Fila (CF) aplica retry, (c) Jobs eventualmente vão para a DLQ, (d) API (/uploads/init) pode falhar se não puder checar dedup.

## 8. Custo, Capacidade e Prewarming

### 8.1. Modelo de Degraus (Step-Cost)

Custos fixos sobem por degraus conforme concorrência (Edge/API/Workers). Compute de mídia permanece variável.
Monitorar picos (ex.: Dia das Mães) e médias (semanal/mensal) para calibrar min_instances, warm pool e TTLs.

### 8.2. Orçamentos e Quotas Operacionais

Budgets por provedor (Cloudflare, Fly, Neon, B2, Modal); alertas em 50%/75%/90% (§5.5).
Quotas de proteção: Concorrência máxima em Workers, min_instances na API, rate limits para /s/\*.

### 8.3. Janela Sazonal (Dia das Mães)

Cron de prewarm: Seed de cache no Edge, min_instances na API, warm pool nos Workers, revisão de rate limits (Runbook 9.1).

### 8.4. FinOps: Tagging, Showback e Unidade de Custo

Tagging: Padronizado por env (prod/staging), service (api/worker/db) e owner (plataforma).
Showback: Relatório mensal por serviço.
Unidade de Custo (FinOps SLI):Custo de Aquisição (Técnico): (Custo_Fly + Custo_Neon_IO + Custo_Modal + Custo_Fila) / (Total_Momentos_Criados_Mês) = Custo por Momento Criado.
Custo de Estoque (Técnico): (Custo_Neon_Storage + Custo_B2_Storage) / (Total_Contas_Ativas) = Custo de Estoque por Conta/Mês.
Implicação: Este SLI de FinOps (§5.2) informa se a otimização de código (ex: worker mais rápido) está, de fato, reduzindo o custo unitário. O Custo de Estoque é vital para validar o "God SLO" (§6.1).

## 9. Runbooks Operacionais

(Versões curtas. O documento completo de cada runbook deve ser versionado em docs/runbooks/.)

### 9.1. Prewarming Coordenado (Pico Sazonal)

Gatilho: Manual, T-2h antes do pico (ex: Dia das Mães).
Ações:fly scale ... --min-machines=4 (Aumentar min_instances da API).
modal deploy ... --warm-pool=20 (Aumentar warm pool dos Workers).
Rodar script de seed de cache do Edge (CF).
Rodar VACUUM leve no DB (Neon) e revisar índices quentes.
Monitorar: Abrir dashboards (p95/5xx/Idade da Fila) e ficar em watch durante o pico.

### 9.2. PITR Cutover (Neon)

Gatilho: Incidente de perda de dados (ex: DELETE acidental) em T=12:00.
Ações:Confirmar timestamp alvo (ex: T=11:59).
Ativar modo somente leitura (§7.3) na API.
neonctl branches create --from-time="<timestamp>" restore_branch
neonctl branches start restore_branch
Validar e reaplicar políticas de RLS (§4.8, §7.1) no branch temporal.
Atualizar DATABASE_URL no fly secrets para apontar para restore_branch.
fly scale restart (para API ler a nova secret).
Validar integridade com checks rápidos (synthetics).
Desativar modo somente leitura.
Post-mortem: Formalizar post-mortem. Discutir promoção do branch para main.

### 9.3. Resposta a Incidentes (Sev1–Sev3)

Sev-1 (Indisponibilidade / Fila Travada):Sintoma: Alerta Idade da Fila (CF) > 10 min.
Ação: Ativar modo leitura, comunicar status page.
Investigar:Foi um release recente (API ou Worker)? Se sim, iniciar rollback imediato.
O Consumidor (Modal) está travado? (Verificar logs do Modal).
O Produtor (API) está publicando? (Verificar logs da API).
A Fila (CF) está com backlog? (Verificar dashboard da Cloudflare).
Sev-2 (Degradação / Item na DLQ):Sintoma: Alerta Item novo na DLQ.
Ação: Pausar canário, throttle de features pesadas. Iniciar Runbook 9.7 para a DLQ.
Sev-3 (Bug isolado): Hotfix ou feature flag.
Escalonamento: Conforme RACI (§2.7).

### 9.4. Incidente de Segurança (Rotação de Chaves)

Gatilho: Alerta de secret vazado (ex: gitleaks).
Ações:Revogar chaves comprometidas (provedores).
Rotacionar segredo do cookie de sessão (força logout geral).
Invalidar tokens de share sensíveis (se aplicável).
Post-mortem: Varredura completa e post-mortem com ações preventivas.

### 9.5. Export Cost Guardrail

Sintoma: Alerta de FinOps (Sev-3) sobre custo de compute (Modal) ou egress (B2).
Ação:Ativar feature flag que limita o tamanho do export.
Mover jobs de export para uma Fila low-priority (se houver).
Implementar rate limiting mais agressivo no endpoint POST /export.

### 9.6. Falhas de Upload (Multipart)

Sintomas: PartNotFound, ETag mismatch, timeout, presign expirado.
Ações: Reduzir concorrência no cliente, renovar presign, recomeçar parte com novo checksum, acionar retry com backoff.
Alerta: Abrir incidente se taxa de falha > 5%/5 min.

### 9.7. Análise e Reprocessamento da DLQ (Cloudflare Queues)

Gatilho: Alerta Sev-2 de novo item na DLQ (Cloudflare).
Ação Imediata: Pausar reprocessamento automático para aquele job.
Análise:O erro é definitivo (ex: mídia corrupta, ffmpeg exit 1)?
O erro é um bug no worker (ex: NullPointerException, KeyError)?
O erro é externo (ex: B2 retornando 403 permanente)?
Resolução:Se (1): Marcar job como failed_definitive (ex: PATCH /assets/{id} para status='failed'), notificar usuário (opcional).
Se (2): Prioridade máxima. Preparar hotfix para o worker. Após o deploy, usar um script (apps/admin) para mover o job da DLQ de volta para a fila principal para reprocessamento.
Se (3): Escalonar (incidente de segurança/provedor).

## 10. Quality Gates e Critérios de Aceite de Pipeline

Web: e2e smoke obrigatório; bundle budget sem regressão; axe (acessibilidade) em páginas-chave.
API: Cobertura $\ge$ 80%; bandit sem HIGH; trivy sem CRITICAL; spectral sem erros.
Gate de Semgrep (Segurança): Falha se endpoint de escrita não tiver middleware de CSRF (ver §4.6).
Gate de Resiliência (Teste de Integração): Validar: POST /api/endpoint $\rightarrow$ COMMIT no DB $\rightarrow$ Mensagem publicada na Cloudflare Queues (mockada).
Gate de Migração: Migração dry-run (alembic check) não deve falhar.
Workers: Golden files estáveis; tempos de job dentro da faixa; non-regression de bitrate/qualidade.

## 11. Tabela de Defaults Operacionais (Timeouts, TTLs, Retries)

| Componente      | Parâmetro               | Default                      | Justificativa                                 |
| --------------- | ----------------------- | ---------------------------- | --------------------------------------------- |
| Edge (CF)       | Cache-Control (SSR)     | max-age=300, swr=60          | Equilíbrio entre frescor e hit ratio.         |
| Edge (CF)       | CSP                     | Ver §2.2                     | Least privilege de segurança.                 |
| API (Fly.io)    | read_timeout (servidor) | 5s                           | Evitar slow loris, falha rápida.              |
| API (Fly.io)    | client_timeout (http)   | 10s                          | Padrão razoável para cliente.                 |
| API (Fly.io)    | Rate Limit (base)       | 60 req/min/ip                | Ajustável por rota (ex: login).               |
| Fila (CF)       | Retries (Transitório)   | 5                            | Padrão (ex: 503, timeout).                    |
| Fila (CF)       | Backoff                 | Exponencial (base 1s)        | Evitar thundering herd no retry.              |
| Workers (Modal) | function_timeout        | 300s (5 min)                 | Tempo máximo para um job (ex: export).        |
| Storage (B2)    | Exports TTL             | 72h                          | Tempo para usuário baixar.                    |
| Storage (B2)    | Derivados TTL           | 30d                          | Recriáveis sob demanda (otimização de custo). |
| DB (Neon)       | PITR                    | 14d                          | Janela de recuperação.                        |
| DB (Neon)       | statement_timeout       | 10s (global), 5s (hot paths) | Evitar queries desgarradas.                   |
| DB (App Pool)   | pool_min_size           | 2                            | Mínimo para warm-up.                          |
| DB (App Pool)   | pool_max_size           | 15 (por instância)           | Crítico: Evita exaustão do pooler Neon.       |
| DB (App Pool)   | pool_acquire_timeout    | 2s                           | Falha rápida na API se o DB estiver saturado. |

## 12. Checklist de Release

- Pipeline verde (web/api/workers).
- Envelope de erro canônico inalterado ou diff documentado.
- Migrações em padrão expand/contract concluídas e testadas.
- Feature flags revisadas (novas com default off).
- Dashboards/alertas atualizados (especialmente para a Fila ou DLQ).
- Plano de rollback pronto e verificado (especialmente para migrações).
- Revisão de impacto LGPD/RLS (se aplicável).
- Runbooks relevantes atualizados? (Se uma nova feature muda o fluxo de falha).

## 13. Impacto Cruzado com Outros Documentos

Arquitetura & Domínio: Confirmar fronteiras (Edge/API/Workers), políticas de segurança (RLS/ALE) e resiliência (Fila CF, DLQ).
API Reference: Refletir limites operacionais (paginador, ETag/If-Match, idempotência, rate limits e GET /health / GET /ready).
UI/UX: Mapear mensagens de degradação (modo leitura) e textos por error.code.
Modelo de Dados: Garantir que estratégia expand/contract e TTLs (exports/derivados) estejam refletidos no esquema, e que NÃO existam tabelas outbox_event ou dlq.

## 14. Anexos Práticos

### 14.1. Cloudflare Workers — Cabeçalhos SSR

```javascript
// Exemplo conceitual de headers de resposta
export const onRequestGet: PagesFunction = async (ctx) => {
  const res = await renderPublicShare(ctx); // Função de render
  // Assume que res é um objeto Response
  res.headers.set(
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=60"
  );
  res.headers.set("ETag", `W/"${await weakETag(res.clone())}"`); // ETag fraco
  res.headers.set("X-Robots-Tag", "noindex");
  res.headers.set("Referrer-Policy", "no-referrer");
  // CSP e outros headers de segurança devem ser aplicados via config ou outro middleware
  return res;
};
```

### 14.2. Fly.io — fly.toml (Healthcheck)

```toml
# fly.toml (parcial)
app = "babybook-api-prod"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 2 # Para prod

[checks]
  [checks.health]
    # Liveness Probe: A máquina está "viva"?
    # Se falhar, o Fly reinicia a máquina.
    type = "http"
    path = "/health"
    interval = "15s"
    timeout = "2s"
    grace_period = "10s" # Tempo para a app subir antes do check

  [checks.ready]
    # Readiness Probe: A máquina está "pronta" para receber tráfego?
    # Se falhar, o Fly para de enviar tráfego, mas não reinicia.
    type = "http"
    path = "/ready"
    interval = "15s"
    timeout = "3s"
    grace_period = "10s"
```

### 14.3. Política de Lifecycle — B2

Derivados: Expirar entre 7–30 dias; recriáveis sob demanda.
Exports: Expirar em 72h; mover para trash/ antes da remoção definitiva (janela curta).
Originais: Sem expiração automática; retenção guiada por LGPD e política de conta.

### 14.4. Alerta Composto — Burn Rate

Condição: Se burn_rate(1h) > 2x E burn_rate(6h) > 1x $\rightarrow$ Sev-2.
Ação: Alertar plantão e acionar freeze preventivo de release.

### 14.5. Exemplo: Configuração de Pool asyncpg

```python
# Em /babybook_api/db/session.py (Conceitual)
import asyncpg
from .settings import settings

pool = None

async def get_db_pool():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=settings.DB_POOL_MIN_SIZE,  # Ex: 2
            max_size=settings.DB_POOL_MAX_SIZE,  # Ex: 15
            # Falha rápida se o pool estiver 100% ocupado
            timeout=30,  # Timeout total da conexão
            command_timeout=settings.DB_STATEMENT_TIMEOUT,  # Ex: 10s por query
        )
    return pool

# Na FastAPI (via Depends), usar com:
# async with (await get_db_pool()).acquire(timeout=settings.DB_POOL_ACQUIRE_TIMEOUT) as conn:
#   async with conn.transaction():
#     # CRÍTICO: SET LOCAL (RLS) e a query DEVEM estar na *mesma* transação.
#     await conn.execute("SET LOCAL app.account_id = $1", account_id)
#     await conn.fetch(...)
```

### 14.6. Exemplo: Lógica do Produtor (API $\rightarrow$ Fila)

```python
# Em /babybook_api/routes/uploads.py (Conceitual)
from fastapi import Request, Depends
from ..queue_service import get_queue_publisher

@router.post("/uploads/complete", status_code=202)
async def complete_upload(
    payload: UploadCompletePayload,
    trace_id: str = Header(None),
    queue: QueuePublisher = Depends(get_queue_publisher)
):
    # ... lógica de validação do ETag ...

    # Validação do Asset (ex: marcar como 'queued' no DB)
    # ... (db.commit()) ...

    # Enfileira o job para o worker (Modal)
    await queue.publish(
        topic='transcode',
        payload={
            "asset_id": asset.id,
            "account_id": user.account_id,
            "original_key": asset.key_original,
            "job_type": "transcode_video"
        },
        metadata={
            "trace_id": trace_id,
            "user_id": user.id
        }
    )

    return {"asset_id": asset.id, "status": "queued"}
```

## Checklist de Provisionamento dos Workers

1. Armazene o `SERVICE_API_TOKEN` no secrets manager do provedor (Fly/Modal) e injete-o tanto na API quanto nos workers. Nunca versione esse token.
2. Crie os buckets `babybook-uploads`, `babybook-media` e `babybook-exports` no Backblaze B2 (ou provedor equivalente) e configure lifecycle policies (derivados expiram em 30 dias, exports em 72h).
3. No Modal/Fly, construa a imagem dos workers com `ffmpeg`/`ffprobe` e valide que as envs `FFMPEG_PATH`/`FFPROBE_PATH` apontam para o binário existente.
4. Configure a Cloudflare Queue com Dead-Letter Queue (DLQ) após N tentativas e garanta o mesmo nome/credenciais usados na API (`CLOUDFLARE_*`).
5. Aponte `QUEUE_PROVIDER=cloudflare` em produção e mantenha `INLINE_WORKER_ENABLED=false` para evitar processamento inline fora do dev.
