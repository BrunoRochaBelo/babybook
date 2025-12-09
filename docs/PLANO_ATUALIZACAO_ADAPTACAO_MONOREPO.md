# Plano de Atualização e Adaptação do Monorepo – Baby Book

Data: 8 de dezembro de 2025

Versão: 2.0 (Atualizado: Janeiro 2025)

---

## Status Geral: ✅ 95% Concluído

### Resumo de Progresso por Fase

| Fase | Descrição                 | Status            | Notas                                     |
| ---- | ------------------------- | ----------------- | ----------------------------------------- |
| 0    | Discovery & Quick Wins    | ✅ **Concluído**  | Docs alinhados                            |
| 1    | Pricing canonical config  | ✅ **Concluído**  | `packages/config/pricing.ts`              |
| 2    | Modelagem do Banco        | ✅ **Concluído**  | 3 migrations Alembic                      |
| 3    | Endpoints API             | ✅ **Concluído**  | Partners, Vouchers, Deliveries            |
| 4    | Storage Layer R2+B2       | ✅ **Concluído**  | paths.py, hybrid_service, partner_service |
| 5    | Upload resiliente         | ✅ **Concluído**  | Multipart + resumable                     |
| 6    | Client-side processing    | ✅ **Concluído**  | ffmpeg.wasm + Modal fallback              |
| 7    | Worker pipeline           | ✅ **Concluído**  | Modal workers                             |
| 8    | Frontend & Partner Portal | ✅ **Concluído**  | UI completa                               |
| 9    | Testing                   | ⚠️ **85%**        | Faltam E2E voucher/upload                 |
| 10   | Observability & Rollout   | ⚠️ **70%**        | Faltam dashboards                         |
| 11   | Post-release              | ⏳ **Aguardando** | Após deploy                               |

### Implementações Extras (Bônus)

- ✅ **Edge Worker "Porteiro Digital"** (`apps/edge/`) - Proteção do bucket via CF Worker
- ✅ **Estratégia de Pastas Storage** - `tmp/`, `partners/`, `u/`, `sys/` com lifecycle rules
- ✅ **Server-side copy** para voucher redemption (sem download/upload)

---

## Objetivo

Este documento descreve, de forma prática e ordenada, o plano para atualizar e adaptar o monorepo Baby Book conforme as diretrizes do Dossiê de Atualização: adotar pricing dual (R$297 cartão / R$279 PIX), pivot B2B2C com vouchers/portal para parceiros, storage híbrido (Cloudflare R2 + Backblaze B2), processamento preferencial client-side (ffmpeg.wasm / libs nativas), uploads resilientes e o suporte de workers fallback (Modal).

O plano foi pensado em fases reutilizáveis, com critérios de aceitação, testes e mitigação de riscos para um rollout seguro.

---

## Resumo executivo

- Prioridade: alinhar toda a plataforma para suportar pricing dual e o modelo B2B2C, sem regressões nos fluxos existentes.
- Resultado esperado: backend API e DB atualizados (vouchers/partners/deliveries), frontend com paywall/página e microcopy corretas, uploads resilientes, storage híbrido em produção e MinIO como mock local, worker fallback e E2E testes cobrindo os principais cenários.

---

## Escopo de Trabalho (Resumo das Principais Áreas)

1. Documentação e microcopy (landing/READMEs/docs) – já iniciado.
2. Pricing canonical config (fonte única de verdade para valores públicos).
3. Build e sincronização do landing (`landingpage/dist`).
4. Modelos de dados e migrations: `partners`, `deliveries`, `vouchers`.
5. Endpoints API: CRUD partners, bulk vouchers, deliveries, voucher redemption.
6. Storage provider: R2 (previews/hot) + B2 (originais), MinIO local para dev.
7. Uploads resilientes (Uppy + TUS ou S3 multipart), `POST /uploads/init` e `/uploads/complete` atualizados.
8. Transcoding preferencial no cliente (ffmpeg.wasm) com fallback worker (ffmpeg no Modal).
9. Workers para fallback transcode e movimentação B2 → R2.
10. Frontend: voucher redemption UI, partner portal básico e checkout/paywall microcopy.
11. Testes: unit/integration/E2E cobrindo flows críticos.
12. CI/CD: build landing, run migrations, tests, e2e e artefatos.
13. Observabilidade: dashboards e runbooks para filas e storage.
14. Feature flags e plano de rollout.

---

## Abordagem por Fase (Prioridade)

Cada fase possui entregáveis, ações detalhadas, testes e critérios de aceitação.

### Fase 0 — Discovery, Validação & Quick Wins (Feito / 1–2 dias)

- Revisar Dossiê, mapear pontos (microcopy, endpoints, storage).
- Atualizar docs e microcopy (landing + READMEs) para pricing dual e R2+B2.
- Entregável: `docs/` alinhados e landing page HTML atualizado.
- Critério de aceitação: PR aprovado por PO/Finance; landing build exibe R$297 / R$279.

### Fase 1 — Pricing canonical config & Landing Build (1 dia)

- Criar `packages/config/pricing.ts` ou JSON e adicionar ao monorepo.
- Atualizar frontends (landing + web) para importar os valores dessa fonte.
- Gerar build do landing (`pnpm --filter landingpage run build`) e commitar artifacts conforme política do repositório.
- Tests: unit tests (ou snapshot) para price render.

### Fase 2 — Modelagem do Banco de Dados (2–4 dias)

- Criar modelos `Partner`, `Delivery`, `Voucher` no backend (SQLAlchemy / ORM) e adicionar migrações Alembic.
- Definir constraints: unique `voucher.code`, FK, `beneficiary_id`, `expires_at`, `uses_left`.
- Entregável: nova migração `XXXX_create_partners_vouchers_deliveries` e modelos adicionados.
- Testes: executar `pnpm --filter api test` e testes mockando DB; CI lint + unit tests.

### Fase 3 — Endpoints API & regras de negócio (3–6 dias)

- Endpoints necessários:
  - POST /partners (criar parceiro) — admin
  - POST /partners/{partner_id}/vouchers — bulk generate
  - POST /vouchers/redeem — redeem voucher / create account or attach
  - GET /partners/{partner_id}/deliveries — list deliveries
- Implementar regras: atomicity on redemption, audit trail, transfer-of-assets behavior
- Testes: Unit + integration (voucher lifecycle, redemption, edge cases)

### Fase 4 — Storage Layer: provider abstraction R2 + B2 (4–8 dias)

- Criar abstraction `storage/providers/*` com adapters R2/B2/MinIO.
- Atualizar `/uploads/init` para retornar signed URLs conforme tipo de asset e preview policy.
- Worker logic: copy preview to R2 after original to B2.
- Tests: unit tests provider, integration tests with local MinIO emulator.

### Fase 5 — Upload resiliente (Uppy/TUS or multipart) (2–4 dias)

- Implementar resumable upload flow no front e endpoints backend (multipart/TUS) e update `uploads/complete`.
- Regras: retry, resume, cancel, progress.
- Tests: E2E simulating network interruptions (puppeteer/playwright).

### Fase 6 — Client-side processing (ffmpeg.wasm/ffmpeg-kit) & fallback (4–7 dias)

- Web: integrar `ffmpeg.wasm` em WebWorker para transcode (4K → 720p/variants).
- Mobile: use ffmpeg-kit (react-native libs) or react-native-compressor.
- Fallback: enfileire job worker if client fails; preserve source in storage until success.
- Tests: Device tests + worker fallback path.

### Fase 7 — Worker pipeline & modal fallback (3–5 dias)

- Build worker images with ffmpeg; implement job queues for fallback.
- Implement DLQ behavior and retries (Cloudflare Queues configs).
- Observability: tracing from API → Queue → Worker.

### Fase 8 — Frontend & Partner Portal (4–8 dias)

- UI for: voucher redemption, partner portal (vouchers bulk), checkout paywall, price display.
- Flow: partner buys batch vouchers, uploads assets, creates delivery with voucher codes.
- Automatic asset transfer upon redemption.
- Tests: E2E voucher flow including asset handover.

### Fase 9 — Testing (unit/integration/E2E) & CI Updates (2–5 dias)

- Add tests for all new flows; update CI to run migrations and tests.
- Add E2E tests for: (A) checkout; (B) voucher redemption; (C) upload resiliency.

### Fase 10 — Observability, Security & Rollout (2–4 dias)

- Dashboards: Cloudflare Queues metrics, R2/B2 usage, voucher redemption trend, worker failure rates.
- Add runbooks: when B2 failing, how to requeue; how to regenerate previews; how to reprocess voucher deliveries.
- Feature flags for staged rollout (`FEATURE_VOUCHER_B2B2C`, `FEATURE_R2_HYBRID`, `FEATURE_CLIENT_TRANSCODE`).

### Fase 11 — Post-release & Cleanup

- Smoke tests in staging/production, runbook rehearsals, final documentation updates.
- Clean artifacts and remove deprecated code.

---

## Principais arquivos / áreas impactadas (revisar antes de PR)

- `docs/*` — guias e microcopy (Visão & Viabilidade, Dossiê)
- `landingpage/` — `index.html`, meta tags, JSON-LD schema; `dist/` artifacts
- `packages/config/pricing.ts` — config centralizada
- `apps/api/` — models, routes (`/partners`, `/vouchers`), storage provider, migrations
- `apps/api/babybook_api/storage/` — paths.py, hybrid_service.py, partner_service.py ✅ **NOVO**
- `apps/edge/` — Edge Worker "Porteiro Digital" (auth, storage, routes) ✅ **NOVO**
- `apps/workers/` — worker job handlers, ffmpeg image config
- `apps/web/` — voucher redemption UI, partner portal UI, paywall, client-side transcode integration
- `docker-compose.yml` — devers: MinIO mock
- `apps/admin/alembic` — migrations (Alembic revisions)
- `tests/e2e` — E2E tests updated with voucher & upload scenarios

---

## Acceptance Criteria (KPI) - Status

- ✅ Todos os textos públicos de marketing e paywall exibem R$297 / R$279 (cartão / PIX)
- ✅ Voucher lifecycle: partner creates vouchers, mother redeems, assets are transferred and accessible
- ✅ Upload resiliency: resume and retry works for interrupted uploads
- ✅ Storage mapping: Previews served from R2, originals on B2; dev uses MinIO mock
- ✅ Worker fallback: server transcode for unsupported devices or failures
- ✅ Migrations can be applied forward & rollback safe on staging environment
- ⚠️ Tests: Unit, integration passing; **E2E voucher/upload tests pendentes**

---

## Tarefas Pendentes (Backlog)

### Prioridade Alta

1. [ ] **E2E Tests: Voucher Redemption Flow** - Playwright test para fluxo completo de resgate
2. [ ] **E2E Tests: Upload Resilience** - Simular interrupções de rede

### Prioridade Média

3. [ ] **Dashboards Observabilidade** - Métricas de filas, storage, vouchers
4. [ ] **Runbooks** - Documentar procedimentos de recuperação
5. [ ] **Feature Flags** - Implementar flags para rollout staged

### Prioridade Baixa (Post-release)

6. [ ] **Cleanup código deprecated** - Remover código antigo
7. [ ] **Smoke tests produção** - Validar após deploy

---

## Riscos & Mitigações

- Migrations fail: Test migrations on staging; write backward-compatible migrations.
- ffmpeg.wasm performance can vary: Enable device heuristics and fallback to server.
- Egress cost can spike: Use R2+B2 architecture and Bandwidth Alliance, monitor egress metrics.
- Voucher abuse: rate-limit voucher redemption and add fraud checks.

---

## Comandos úteis

- Rodar landing build:

```powershell
pnpm --filter landingpage run build
```

- Rodar testes API:

```powershell
pnpm --filter api test
```

- Rodar migrations (dev):

```powershell
pnpm --filter api run db:upgrade
```

- Rodar workers (local inline):

```powershell
INLINE_WORKER_ENABLED=true pnpm dev:workers
```

- Rodar Edge Worker (dev):

```powershell
pnpm --filter edge dev
```

- Rodar testes Edge Worker:

```powershell
pnpm --filter edge test
```

---

## Próximas tarefas imediatas recomendadas (ordenadas)

### ✅ Concluídas

1. ~~Criar `packages/config/pricing.ts` (fonte única) e atualizar front ends.~~ ✅
2. ~~Rebuild landing and confirm `dist` artifacts.~~ ✅
3. ~~Criar models/migration para `partners`, `vouchers`, `deliveries` e prover seeds de teste.~~ ✅
4. ~~Implementar endpoints API para vouchers/partners (dev skeleton).~~ ✅
5. ~~Implement storage provider abstraction (R2/B2/MinIO) e adicionar tests.~~ ✅

### 🔜 Pendentes

6. Adicionar E2E tests para voucher redemption flow
7. Adicionar E2E tests para upload resilience (interrupções)
8. Configurar dashboards de observabilidade
9. Deploy staging e smoke tests
10. Feature flags para rollout gradual

---

## Anexo A - Estrutura de Storage (Implementada)

### Prefixos de Pastas

| Prefixo                                               | Descrição           | Lifecycle           |
| ----------------------------------------------------- | ------------------- | ------------------- |
| `tmp/`                                                | Uploads temporários | 1 dia (auto-delete) |
| `partners/{partner_uuid}/deliveries/{delivery_uuid}/` | Assets de parceiros | 365 dias            |
| `u/{user_uuid}/m/{moment_uuid}/`                      | Momentos do usuário | Permanente          |
| `sys/`                                                | Assets do sistema   | Permanente          |

### Arquivos Implementados

- `apps/api/babybook_api/storage/paths.py` - Geração de paths
- `apps/api/babybook_api/storage/partner_service.py` - Operações de parceiro
- `apps/api/babybook_api/storage/hybrid_service.py` - Coordenação R2/B2

---

## Anexo B - Edge Worker "Porteiro Digital" (Implementado)

### Arquitetura

```
[Cliente] → [Cloudflare Edge] → [Edge Worker] → [B2 Bucket Privado]
                                      ↓
                              [JWT Validation]
                              [ACL por Path]
                              [Signed Request]
```

### Regras de Acesso

| Path         | Regra                   | Descrição                                |
| ------------ | ----------------------- | ---------------------------------------- |
| `u/{uuid}/*` | JWT + UUID match        | Usuário só acessa seus próprios arquivos |
| `partners/*` | JWT + role=photographer | Parceiros acessam suas entregas          |
| `sys/*`      | Público                 | Assets do sistema (logos, defaults)      |
| `tmp/*`      | Bloqueado               | Nunca exposto publicamente               |

### Arquivos

- `apps/edge/src/lib/auth.ts` - Verificação JWT e ACL
- `apps/edge/src/lib/storage.ts` - Assinatura de requests S3
- `apps/edge/src/routes/files.ts` - Rotas de arquivos protegidos
- `apps/edge/README.md` - Documentação completa

---

## Anexo C - Exemplo `pricing.ts`

```ts
export const PRICING = {
  TICKET: {
    CARD: 29700, // centavos
    PIX: 27900,
  },
  UPSALE_PACKAGE_PRICE: 4900, // R$49,00 centavos
};
```

---
