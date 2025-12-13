# Plano de Implementação End-to-End — Baby Book

Status: Draft inicial (deve ser mantido como documento vivo) — atualizado para cobrir lacunas críticas

Referências canônicas: `docs/Dossie_Execucao.md`, `docs/Arquitetura_do_Sistema.md`, `docs/API_Reference.md`, `docs/Modelo_de_Dados_Lógico.md`, `docs/Lib_Componentes_Tokens.md`.

## Objetivos gerais

- Alinhar todo o produto (web, landing, API, workers, edge, parceiros) à arquitetura definida e aos requisitos de negócio/financeiro (PCE, pricing dual, B2B2C).
- Garantir segurança (RBAC + RLS), privacidade (LGPD), custo previsível (God SLO de estoque), performance e UX calma (PWA + upload resiliente).
- Fornecer roteiro acionável por fases, com critérios de pronto e cobertura de testes.

## Perfis e cenários de uso

- **Parceiro (fotógrafo / partner)**: compra lotes B2B, gera vouchers, faz upload prévio de entregas, acompanha status, baixa comprovantes.
- **Usuário final (mãe/pai/guardião)**: recebe voucher/código, cria conta ou resgata, navega timeline, sobe mídia, compartilha, modera guestbook, gerencia saúde/cofre, exporta álbum, encerra conta.
- **Convidado (viewer/link público)**: acessa share link (SSR edge), envia mensagens (guestbook) se permitido.
- **Equipe interna / admin**: suporte, moderação, reconciliação de pagamentos, auditoria.
- **Usuário de teste/dev**: opera em ambiente local com mocks (MSW), base seed e contas de demonstração.

## Requisitos não funcionais (RNF)

- **Segurança**: RLS em Postgres; JWT na edge; sessão HttpOnly `__Host-session` + CSRF; HMAC em webhooks; rate limit por rota; headers COOP/COEP/CSP para SharedArrayBuffer; presigned URLs com expiração; criptografia em trânsito; segregação por role.
- **Privacidade/LGPD**: minimização de PII; exportação completa (ZIP); exclusão lógica + job de hard delete; trilha de auditoria; consentimento e política de retenção.
- **Disponibilidade/SLOs**: p95 leitura ≤ 500ms; p95 escrita leve ≤ 800ms; p95 aceite upload ≤ 1500ms; time-to-ready ≤ 2 min; custo de estoque ≤ R$2/conta/ano; uptime API >99.5%.
- **Performance/escala**: compressão client-side (ffmpeg.wasm) como default; fallback server-side (Modal); SSE ou short-poll minimal para status; cache na edge; paginação por cursor.
- **Custo**: storage **R2-only**; PCE reservado por venda; deduplicação por SHA; FFmpeg client-side para reduzir compute; purge de derivados recriáveis.
- **Observabilidade**: X-Trace-Id em todas as respostas; logs estruturados; métricas (latência, taxa de sucesso de upload, uso de fallback); tracing distribuído (OTel); DLQ para jobs.
- **Acessibilidade**: WCAG AA; foco visível; aria-\*; contraste em tokens.
- **DevEx**: ambientes locais com MSW/MinIO; seeds; feature flags; testes automáticos (unit, integração, e2e).

## Fluxos funcionais (com critérios de pronto)

### 1) Autenticação e sessão

- **Cadastro**: POST /auth/register com email+senha; validação forte; e-mail de verificação obrigatório. Critério: cria sessão, retorna 204, seta cookie `__Host-session` HttpOnly Secure SameSite=Lax + `X-CSRF-Token` obtido em GET /auth/csrf.
- **Verificação de e-mail**: token único expira em 24h; POST /auth/verify-email {token}; reenvio limitado a 3/h; conta fica `pending` até verificar (bloqueia ações sensíveis e login pleno).
- **Login**: POST /auth/login com CSRF; bloqueio progressivo rate-limit; resposta 204; cookie e CSRF atualizados.
- **Refresh/CSRF**: GET /auth/csrf sempre disponível; gera token pareado à sessão.
- **Logout**: POST /auth/logout com CSRF; invalida sessão (revoga na tabela), expira cookie.
- **Recuperação de senha**: POST /auth/password/forgot (limite 3/h); POST /auth/password/reset com token de uso único.
- **Encerramento de conta**: POST /account/close (CSRF) → marca para deleção, agenda job de hard delete (assets + dados) e invalida sessões.
- **Sessão em múltiplos dispositivos**: tabela de sessões com `last_ip`, `user_agent`, `expires_at`; endpoint GET /auth/sessions para listagem e DELETE /auth/sessions/{id} para revogar; rate-limit 10 req/min/conta.

### 2) RBAC, RLS e perfis

- Tabela `account_user` (owner/guardian/viewer) e GUCs para RLS; políticas no DB (default deny) para `moments`, `assets`, `health`, `vault`, `guestbook`.
- Guardians não acessam saúde/cofre; viewers só veem publicados/people; partners têm role separado no domínio B2B (`partners` + `deliveries`).
- Usuário anônimo (share link): apenas via edge SSR; pode ver momento publicado com privacy=link e assets `viewer_accessible`; não pode escrever.
- Service accounts (workers): token `MODAL_SERVICE_TOKEN` rotacionável; escopo restrito a PATCH /assets/{id}, callbacks de jobs; armazenar hash e expiração em tabela `service_tokens`.

### 3) Quotas, upsell e billing

- View `v_effective_quotas`: 2 GiB storage, 60 momentos, 5 recorrências por categoria, flags `unlimited_*` em `account`.
- Validações: /uploads/init → 413 quota.bytes.exceeded; /moments → 402 quota.moments.exceeded; recorrentes → 402 quota.recurrent_limit.exceeded {"package":"social|creative|tracking"}.
- Billing: entidades `order/purchase` com `amount_gross`, `gateway_fee`, `tax_effective`, `pce_reserved`; pricing dual R$297 (cartão, até 3x) / R$279 (PIX); B2B (lote 10) R$1.350 (PIX) / R$1.490 (cartão, até 3x). Webhook HMAC idempotente aplicando entitlements.
- Landing/pricing: LP consome `packages/config/pricing.ts`; CTAs diferenciados PIX vs Cartão; tracking de conversão por canal (UTM); B2B âncoras na LP e fluxo /resgatar.

### 4) Upload de mídia

- **Cliente**: ffmpeg.wasm em Web Worker; heurística `SharedArrayBuffer` + `deviceMemory>=4GB` + size<500MB → compressão local (720p H.265); barra unificada (0-30% compressão, 30-100% upload); Wake Lock + beforeunload guard.
- **Init**: POST /uploads/init {filename,size,mime,sha256,scope} → dedup (sha); presigned URLs para R2 (`tmp/uploads/{upload_uuid}/{part}`), part_size `upload_part_bytes`; retorna `upload_id`, `asset_id`, `urls`.
- **Upload**: PUT direto ao storage (Tus ou presigned multipart). Coletar ETags.
- **Complete**: POST /uploads/complete com ETags + `Idempotency-Key`; marca asset `processing`; publica job na queue.
- **Fallback**: se cliente fraco, upload RAW sem compressão; worker server-side transcode.
- **Status**: GET /assets/subscribe (SSE) ou short-poll mínimo; envia `asset_update` (processing/ready/failed, progress_pct, urls derivadas).
- **Download individual**: sempre via Edge Worker `/v1/file/{path}`; valida JWT (sub === user_id ou role photographer para partners); ACL por prefixo (u/, partners/, sys/); suporta Range; headers Cache-Control específicos por prefixo.

### 5) Processamento de mídia (workers)

- Consumer da fila (Cloudflare Queues ou equivalente) processa jobs `video.transcode`, `image.thumbnail`, `export.zip`.
- Usa SDK S3 (aioboto3) apontando para R2 para GET original, PUT derivados (`u/{user}/m/{moment}/original|preview|thumb`).
- Atualiza API via PATCH /assets/{id} com token de serviço; retries com backoff; DLQ após N tentativas.

### 6) Entregas B2B e “unboxing”

- Portal do parceiro: criar `delivery` com payload de assets; upload para `partners/{partner}/{delivery}/...`.
- Gerar vouchers (códigos únicos) vinculados a delivery.
- **Resgate /redeem (transação atômica)**:
  1. Valida voucher ativo.
  2. Cria/associa usuário (se não existir) e conta.
  3. Copia assets server-side: `partners/...` → `u/{user}/m/{moment}/...` (copy no storage/R2).
  4. Cria momento tipo `PROFESSIONAL_GALLERY` (não criável pelo usuário).
  5. Marca voucher `redeemed`, delivery `claimed`.
- UX: landing de resgate com código + criação de senha; primeiro login já mostra galeria profissional.

### 7) Momentos, timeline e capítulos

- Momentos: estados `draft|processing|ready|published`; privacy `private|people|link`; ETag com rev.
- Templates (`moment_template`) com `upsell_category`, `data_schema`, `ui_schema`, `limits`.
- Series/recorrências: geração de ocorrências via job (mensal/rrule), com quota recorrente.
- Chapter/organização: suporte a capítulos na timeline.
- Momento templates: GET /moment-templates retorna catálogo; UI forma forms dinâmicos; inclui `upsell_category`, `limits`, `prompt_microcopy`.
- HUD / NextMomentSuggestion: prioriza (a) recorrentes em atraso, (b) milestones do catálogo, (c) próximos capítulos; mostra progresso e CTA direto.

### 8) Guestbook (Livro de visitas)

- POST /guestbook pendente -> moderação; owner/guardian pode aprovar/rejeitar; viewer pode postar se permitido e dentro de rate-limit.
- Assets opcionais se `guestbook_allow_media=true`; assets com scope `guestbook`.
- Share público: link SSR renderizado na edge (noindex), só itens aprovados.
- Shield / reautenticação: ações sensíveis (saúde, cofre, aprovação de guestbook, encerrar conta) exigem reauth se inatividade >5 min; modal pede senha; endpoint POST /auth/reauth renova token curto.

### 9) Compartilhamento público (share links)

- `/shares/{id}` gera página SSR na edge com metadados (OpenGraph), noindex; só momentos `published` e assets `viewer_accessible`.
- Token opcional para conteúdo protegido (link people vs link público).

### 10) Download / Export

- GET /export inicia job (Idempotency-Key); gera ZIP com manifest; status em SSE/poll; limita 1 job ativo (409 se houver). Export inclui mídia derivada + JSON de metadados.
- Download de arquivos individuais: sempre via Edge Worker (`/v1/file/...`) validando JWT + ACL.
- Export quotas: 1 job ativo por conta; Idempotency-Key obrigatório; link assinado expira em 24h; inclui manifest JSON.

### 11) Print-on-Demand (futuro próximo)

- `print_job` e `print_job_item` ligados a momentos; critérios mínimos v1: preflight de assets (DPI ≥300, fotos partner 2560px), geração de preview PDF com layout estático, validação de páginas, webhook do provedor com HMAC + idempotência, bloqueio se assets não `ready`.

### 12) Convites e guardiões

- Guardiões: POST /guardians/invite gera token único (expira em 7 dias, uso único); envia magic link; rate-limit 5 convites/dia/conta; throttle por IP.
- Aceite: POST /guardians/{id}/accept com token; cria/associa usuário; seta role; invalida token após uso.

### 13) Saúde, Cofre, Cápsula

- Saúde/cofre: só owner; assets scope `health|vault`; RLS reforçada; reauth Shield após 5 min de inatividade.
- Cápsula do tempo: estados sealed/open; Job 3 abre na data configurada, dispara notificação/email, muda status e libera visualização; suporta anexos conforme catálogo.

### 14) Encerramento de conta e LGPD

- Soft delete imediato; agenda job de hard delete (assets + rows) em X dias; export opcional antes de fechar.
- Auditoria de quem solicitou; bloqueio de reuso de email por período se necessário.
- POST /account/close exige CSRF e reauth se saúde/cofre usados; grava auditoria; agenda hard delete (ex.: 30 dias); invalida sessões imediatamente.

### 15) Observabilidade e segurança operacional

- Middleware de trace: gera `X-Trace-Id`; logs com `account_id`, `user_id`, domínio.
- Rate-limit centralizado (por IP e por conta) conforme tabela do API_Reference.
- CSP/COOP/COEP para ffmpeg.wasm; CORS desabilitado em produção (mesmo domínio via /api proxy).
- Secrets em vault (Wrangler secrets, Fly secrets); presigned URLs expiram em 15 min.
- Headers obrigatórios: `X-Trace-Id` em todas as respostas; em 429 incluir `X-RateLimit-*` e `Retry-After`; em SSE, `Cache-Control: no-cache` e `X-Accel-Buffering: no` se aplicável.
- Webhooks HMAC: HMAC-SHA256, header `X-Signature`, tolerância ±5 min, chaves distintas por ambiente (test/prod), rota sem rate-limit de IP.
- Idempotency-Key obrigatório em POST /uploads/complete, /export, /print-jobs, /webhooks/payment, /redeem, /account/close; armazenar resultados por 24h.

### 16) PWA e offline

- Service Worker (Workbox) cacheia estáticos e manifest; fallback offline; prefetch leve.
- Suporte a replays de uploads (fila offline) — opcional fase posterior.
- Offline storage: IndexedDB para drafts de momentos e fila de upload; replay quando online; cache de assets leves para leitura offline controlada.

### 17) Design System e tokens

- Pacotes: `@babybook/design-tokens` (JSON + CSS vars), `@babybook/ui-core`, `@babybook/ui-domain`.
- Extração dos componentes já existentes em `apps/web` para pacotes, mantendo acessibilidade e theming.
- FullscreenMediaViewer (swipe/zoom); QuotaBanner + RecurringMomentUpsellBanner consumindo GET /me/usage e erros 402; Shield (reauth modal) reutilizável; HUD (NextMomentSuggestion) como componente compartilhado.

### 18) Landing pages

- Cópia alinhada ao pricing dual e ancoragem B2B; CTA PIX com desconto; narrativa de “acesso perpétuo” e PCE.

## Fases de entrega (sequencial sugerido)

1. **Fase 0 — Fundamentos de dados e segurança**
   - Migrar schema: `account_user`, `app_policy`, enums, scopes, rev/ETag, `usage_counter`/`usage_event_queue`.
   - Middleware de erro padrão + trace; rate-limit.
   - Sessão HttpOnly + CSRF; endpoints auth básicos.
   - Health/readiness: GET /health e GET /ready expostos e configurados no deploy (Fly/CI).

2. **Fase 1 — Uploads e Edge**
   - Presigned URLs R2; paths canônicos; dedup SHA; `Idempotency-Key`.
   - ffmpeg.wasm client + fallback; SSE de status; worker conectado à fila + DLQ.
   - Edge Worker integrado para download seguro.
   - Download individual com JWT/ACL e cache-control por prefixo.

3. **Fase 2 — B2B2C Unboxing**
   - Portal parceiro (deliveries, vouchers); fluxo `/redeem` transacional; galeria profissional na UI.
   - Landing de resgate.
   - Pricing dual na LP, CTAs PIX/cartão e tracking UTM.

4. **Fase 3 — Quotas, upsell e billing**
   - `v_effective_quotas`, erros 402/413; entitlements por webhook HMAC; pricing dual e B2B; UI de upsell/usage.
   - GET /me/usage completo; banners Quota/Upsell; tratamento 402 → modal.

5. **Fase 4 — Compartilhamento, guestbook, saúde/cofre**
   - Share SSR, guestbook moderado, assets scope específicos, RLS reforçada.
   - Shield/reautenticação; fluxos de aprovação; cápsula do tempo (Job 3) e séries (Job 2).

6. **Fase 5 — PWA, DS e testes**
   - Service Worker, offline básico; extração Design System; testes unit/integração/e2e; observabilidade OTel.
   - Offline drafts (IndexedDB) e fila de upload; FullscreenMediaViewer; HUD; QuotaBanner.
   - PoD v1 com preflight/preview e webhook idempotente.

7. **Fase 6 — Encerramento de conta e LGPD**
   - Fluxo de fechamento + hard delete job; export final; auditoria.
   - Jobs de GC de assets órfãos, reconciliação RLS, cold storage, abertura de cápsulas.

## Matriz de ambientes e usuários

- **Prod**: domínios reais; R2-only; queues reais; MSW off; rate-limit ativo.
- **Staging**: dados quase reais, integrações reais com credenciais de teste; feature flags.
- **Dev local**: MSW on por padrão; MinIO para S3; seeds (conta demo owner/guardian/viewer, parceiro fake com vouchers); toggle para API real.
- **Test automation**: banco isolado por run; storage mock; usuários de teste dedicados; chaves HMAC fake.
- **Anon (share)**: somente leitura via edge SSR; sem cookies.
- **Service tokens**: armazenados por ambiente; rotação periódica; escopo restrito.

## Métricas e testes mínimos

- **API**: unit (schemà/validators), integração (uploads, auth, vouchers), contrato OpenAPI estável; lint/format; pytest.
- **Workers**: jobs com mocks de S3; retries e DLQ; checksum/sha.
- **Web**: Vitest para hooks/services; Playwright e2e (onboarding, upload, redeem, guestbook); Lighthouse PWA budget.
- **Observabilidade**: dashboard de SLOs (latência, sucesso de upload, uso de fallback, erros 4xx/5xx por rota), alertas por orçamento de erro.
- **E2E adicionais**: quota exceeded (402/413), concorrência ETag/412, offline PWA, cold start (Neon autosuspend), reauth Shield, download via edge com JWT inválido.
- **Lighthouse budgets**: LCP ≤ 2.5s (p75), CLS ≤ 0.1, TTI ≤ 4s, TBT ≤ 300ms, SW instalado.

## Riscos e mitigação

- **Custo de compute/storage**: insistir em compressão client-side + dedup SHA + lifecycle cold storage.
- **Segurança de mídia**: Edge Worker obrigatório; presigned curto; RLS e ACL.
- **Fator R / tributação**: registrar `pce_reserved` e `gateway_fee` em cada venda; relatórios mensais; alerta se pró-labore <28% do faturamento.
- **Experiência de upload**: fallback server-side e barra unificada; testes em dispositivos reais médio/baixa gama.
- **Jobs críticos**: retries antes de DLQ (ex.: 5 tentativas, backoff exponencial 1s→32s); alertar quando DLQ crescer acima do limiar.
- **Migrações**: Alembic para schema changes; release_command no fly.toml; feature flags para campos novos; roll-forward seguro.

## Mapa de telas, rotas e critérios de pronto

### Portal do Parceiro

- Rotas: `/partner/deliveries`, `/partner/deliveries/:id`, `/partner/vouchers`.
- Funções: criar/editar delivery (upload em lote para partners/{partner}/{delivery}), gerar vouchers (lote, expiração), ver status de processamento, baixar comprovantes.
- Critérios: validação de limites de arquivo, exibição de estado por asset (uploading/processing/ready), erro de quota, geração de códigos únicos, paginação.

### Landing /resgatar

- Rotas: `/resgatar`, `/resgatar/sucesso`.
- Funções: inserir código, criar conta/senha, transferir posse dos assets (feedback de progresso), tratar erros (código inválido/expirado, já usado).
- Critérios: bloqueio após N falhas, spinner/estado “preparando suas fotos”, redirecionar para app com sessão criada.

### Dashboard / HUD

- Rota: `/jornada`.
- Funções: NextMomentSuggestion, progresso da jornada, milestones/capítulos, cards de próximos momentos.
- Critérios: HUD mostra CTA principal, lida com estado vazio (sem criança) e loading; usa dados de templates e uso/quotas.

### Timeline / Capítulos

- Rotas: `/jornada`, `/jornada/capitulos`.
- Funções: listar momentos por ordem temporal ou por capítulo, filtros/segmentação, placeholders de vazio.
- Critérios: suporta estados draft/processing/ready/published, respeita privacy, paginação por cursor.

### Moment Form / Detalhe

- Rotas: `/jornada/moment/draft/:id`, `/jornada/moment/:id`.
- Funções: criação/edição com template dinâmico, slots de mídia (upload + barra unificada), validação de limites, publish/unpublish, tags/pessoas.
- Critérios: tratamento de 402/413, estados de upload (SSE), reuso de asset deduplicado, erro 412 ETag.

### Guestbook

- Rotas: `/visitas` (app), `/s/:token` (SSR público).
- Funções: listar entradas, criar mensagem, aprovar/rejeitar (owner/guardian), mídia opcional se permitido, exibir apenas aprovados no público.
- Critérios: estados pending/visible/deleted, rate-limit por IP/conta, reauth Shield para aprovação, noindex no público.

### Saúde

- Rotas: `/saude`, tabs `/saude/crescimento`, `/saude/pediatra`, `/saude/vacinas`.
- Funções: forms inline, gráficos, histórico, uploads sensíveis (scope health).
- Critérios: reauth após 5 min, RLS/role owner, validação de limites e datas, estados vazios.

### Cofre

- Rota: `/cofre`.
- Funções: listagem de documentos, upload/download (scope vault), categorias.
- Critérios: Shield, ACL owner, erro de quota, progressos de upload, download via edge.

### Cápsula do Tempo

- Rotas: `/capsula`, `/capsula/:id`.
- Funções: criar/editar data de abertura, anexar itens, visualizar após abertura (job 3).
- Critérios: estados sealed/open, notificação ao abrir, logs de auditoria.

### Export / Downloads

- Rotas: `/export`, `/export/:id`.
- Funções: criar export, acompanhar status (SSE/poll), baixar ZIP (link assinado expira), histórico básico.
- Critérios: 1 job ativo, 409 se concorrente, idempotência, expiração de link.

### Print-on-Demand

- Rotas: `/pod`, `/pod/:id`.
- Funções: selecionar momentos, preflight (DPI/ready), preview PDF, submeter pedido, ver status.
- Critérios: bloqueia se asset não ready ou DPI insuficiente, webhook idempotente, estados pending/paid/failed.

### Perfil / Conta / Sessões / Encerramento

- Rotas: `/perfil`, `/perfil/sessoes`, `/perfil/conta`.
- Funções: editar nome/locale (PATCH /me), listar/revogar sessões, ver uso/quota, solicitar encerramento (POST /account/close).
- Critérios: reauth para encerramento, aviso de prazo, revogação imediata de sessões, banners de quota e upsell.

### Convites de Guardiões

- Rotas: `/perfil/guardioes`.
- Funções: emitir convite (rate-limit), ver status, reenviar, aceitar via magic link.
- Critérios: token expira em 7 dias, uso único, erros claros de token inválido/expirado, limite de convites/dia.

### Compartilhamento (Share Links)

- Rotas: `/perfil/compartilhar`, `/s/:id` (público SSR).
- Funções: criar/revogar links, copiar URL, definir privacy (people/link), ver acessos básicos.
- Critérios: somente momentos published, noindex, cache control na edge, revogação imediata.

### Auth (login/registro/verify/reset/reauth)

- Rotas: `/login`, `/registrar`, `/verificar-email`, `/reset-senha`, modal de reauth.
- Critérios: verify-email obrigatório, reenvio controlado, mensagens de erro específicas, reauth após inatividade.

### Sessões múltiplas

- Rotas: `/perfil/sessoes`.
- Funções: listar dispositivos/sessões, revogar sessão específica.
- Critérios: mostra IP, user agent, última atividade; revoke imediato.

### Admin/Support mínimo

- Rotas: `/health`, `/ready` (infra), dashboards externos.
- Critérios: health leve (process up), ready checando DB/queue/storage; integrados a CI/alerts.

## Próximas ações imediatas

- Aprovar este plano e priorizar Fase 0.
- Abrir issues por épico/fase com critérios de pronto claros.
- Preparar migração inicial (account_user, app_policy, enums) e middleware de erro/trace.
