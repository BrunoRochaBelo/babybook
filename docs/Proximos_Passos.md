# Próximos passos recomendados — Dossiê de Atualização e Execução

Data: 09/12/2025

Este documento lista tudo o que ficou pendente após a atualização da documentação para refletir o "Dossiê de Atualização e Execução". Para cada item: prioridade, descrição, critérios de aceitação e sugestões de implementação.

---

## 1) Migrations de banco de dados (Alta prioridade)

- O que: Implementar migrações (Alembic) para criar as novas tabelas referidas na documentação:
  - `app.partners`
  - `app.deliveries`
  - `app.vouchers`
  - `app.media_assets`
- Por que: Suporta o canal B2B2C (parceiros/entregas) e o fluxo de resgate por voucher descrito no dossiê.
- Critérios de aceitação:
  - Migração cria as tabelas com colunas e constraints conforme docs/Modelo_de_Dados_Lógico.md.
  - Índices essenciais presentes: `idx_deliveries_partner`, `idx_vouchers_lookup`, `idx_assets_processing`.
  - Alembic revision passa nos testes de migração (upgrade/downgrade localmente).
- Sugestão de implementação:
  - Criar arquivo de migration em `apps/api/alembic/versions` (local canônico do projeto).
  - Usar tipos SQL compatíveis com Neon/Postgres (JSONB para payloads, UUIDs quando aplicável).
  - Incluir constraints FK e unique (p.ex. `vouchers.code` como PK ou unique).
- Estimativa: 1-2 horas.

---

## 2) Endpoint POST /redeem (Transacional) — Alta prioridade

- O que: Implementar handler de API para resgate de voucher com comportamento transacional e idempotente.
- Por que: Necessário para que parceiros entreguem galerias e usuários possam resgatar sem inconsistências.
- Critérios de aceitação:
  - Endpoint valida voucher (ativo, não expirado) e realiza as ações dentro de uma transação DB.
  - Ao sucesso: cópia server-side dos assets do payload do parceiro para o path do usuário, criação de `moment` e `moment_asset`, e atualização do `voucher.status` para `REDEEMED` e `delivery.status` quando aplicável.
  - Em caso de falha parcial (p.ex. falha ao copiar arquivos), a transação é revertida e o estado do voucher permanece inalterado.
  - Endpoint é idempotente — reenvios com mesmo idempotency_key não duplicam recursos.
- Sugestão de implementação:
  - FastAPI + dependência de DB (async/await se o projeto usar async).
  - Uso de SELECT ... FOR UPDATE ao verificar voucher.
  - Registrar uma chave de idempotência por request (tabela opcional `idempotency_keys`).
  - Operação de cópia de arquivos: enfileirar job worker ou realizar cópia síncrona dependendo do SLA; registrar operações de Storage SDK com retry e backoff.
- Estimativa: 1 dia para esqueleto + testes, 2-3 dias para maturar (retry, observability, edge cases).

---

## 3) Atualizar lógica de faturamento / webhooks (Média prioridade)

- O que: Persistir no modelo de Purchase/Order o breakdown das transações: `amount_gross`, `gateway_fee`, `pce_reserved`, `tax_effective`.
- Por que: Reconciliar Unit Economics conforme PCE e garantir registros para contabilidade e relatórios fiscais.
- Critérios de aceitação:
  - Webhook handlers armazenam event_id para idempotência e não gravam duplicados.
  - Purchase/Order passa a ter colunas para os campos citados e são preenchidos em casos de pagamento bem-sucedido.
  - Relatórios básicos (ex.: monthly unit economics) podem ser gerados localmente para validar cálculos.
- Sugestão de implementação:
  - Adicionar colunas em migration submetida no item #1 ou em migration separada.
  - Ajustar handlers de webhook para calcular gateway_fee (provisório) e reservar PCE (p.ex. pce_reserved = 25.00 por venda) no campo correspondente.
- Estimativa: 1 dia.

---

## 4) Frontend — UX de resgate e Galeria Profissional (Média prioridade)

- O que: Criar telas e flows para:
  - Resgate de voucher (input code, validação, onboarding suave quando usuário não existir).
  - Página de Galeria Profissional (apresentação de entregas do parceiro, controles de privacidade e upsell).
- Por que: Experiência do usuário e conversão dependem de um fluxo simples e confiável para resgate e visualização.
- Critérios de aceitação:
  - Resgate funciona em ambiente de desenvolvimento integrando com o endpoint /redeem.
  - Onboarding por fotógrafo cria a conta e mostra a galeria resgatada sem erros.
  - Copy de microcopy substitui LTD por "Acesso Perpétuo" (já feito na docs; garantir no frontend).
- Sugestão de implementação:
  - Componentes em `web/src/features/voucher/` e rota SPA `/resgatar`.
  - Usar UX graceful fallback para usuários sem conta (criação automática + e-mail com link de ativação).
- Estimativa: 2-3 dias para implementação inicial.

---

## 5) Observabilidade e runbooks (Média prioridade)

- O que:
  - Implementar alertas para `presign-failure rate` e tempo médio de resgate.
  - Instrumentar métricas: presigns geradas, presign expiradas, jobs de cópia falhados, latência média de /redeem.
- Por que: Presign TTL = 15 minutos foi definido; é crítico monitorar renovação/falhas para operação estável.
- Critérios de aceitação:
  - Dashboards com gráficos de presign-failure e latências básicas.
  - Alertas configurados (Sev-3 para aumento súbito de presign failures).
- Sugestão de implementação:
  - Exportar métricas via Prometheus or Datadog (conforme infra existente) e criar runbook simples para investigacao.
- Estimativa: 1-2 dias.

---

## 6) Testes e QA (Alta prioridade)

- O que: Cobertura de testes unitários e integração para os fluxos críticos: migrations, /redeem, webhooks e cópia de arquivos.
- Por que: Evitar perda de dados ou estados inconsistentes no fluxo de resgate.
- Critérios de aceitação:
  - Testes de integração para /redeem que verificam commit/rollback em falhas.
  - Testes de webhook para idempotência.
- Sugestão: usar pytest (backend) com fixtures para DB e mocks do Storage SDK.
- Estimativa: 2-4 dias.

---

## 7) Rollout e migração de dados (Baixa/média prioridade)

- O que: Planejar deploy das migrations e rollout progressivo para produção.
- Por que: Evitar downtime e garantir reversão segura.
- Critérios de aceitação:
  - Script de rollback testado localmente.
  - Janela de deployment comunicada a stakeholders.
- Sugestão: rodar migrações em staging -> smoke tests -> deploy em produção com feature flag para /redeem.
- Estimativa: 1 dia de coordenação.

---

## 8) Trabalho opcional (Melhoria contínua)

- Adotar cópia client-side quando possível (ffmpeg.wasm) para reduzir custos de processamento.
- Automatizar relatórios de Unit Economics (coluna PCE aplicada) mensalmente para acompanhamento.
- Criar testes de carga para o fluxo de resgate e para jobs de cópia.

---

## Prioridade resumida

1. Migrations (tabelas parceiros/vouchers/media_assets) — Alta
2. Endpoint /redeem (transacional + idempotência) — Alta
3. Testes & QA — Alta
4. Faturamento / webhooks (persistir breakdown) — Média
5. Frontend resgate e Galeria Profissional — Média
6. Observabilidade / alertas (presign TTL) — Média
7. Rollout & migração de dados — Baixa/Média

---

## Contatos e responsáveis sugeridos

- Backend / Migrations / API: equipe de backend / dev responsável por `apps/api` (sugerir: @backend)
- Frontend: equipe web / dev responsável por `web/src` (sugerir: @frontend)
- DevOps / Observabilidade: responsável infra / SRE (sugerir: @devops)
- Produto: alinhar stakeholders e parceiros para validação de contratos e SLAs (sugerir: @pm)

---
