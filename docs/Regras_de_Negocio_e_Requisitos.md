# Baby Book — Regras de Negócio e Requisitos (Golden Record)

**Status:** living document (fonte de consolidação)  
**Objetivo:** capturar, em um único lugar, as regras de negócio e requisitos do sistema Baby Book (B2C + B2B2C), alinhando produto, UX, API, banco e portal do parceiro.

> Fontes canônicas (em ordem de prioridade quando houver conflito):
>
> 1. `docs/Dossie_Execucao.md` (negócio/pricing/estratégia)
> 2. `docs/Arquitetura_do_Sistema.md` (SLOs, segurança, fluxos críticos)
> 3. `docs/Modelo_de_Dados_Lógico.md` (modelo e invariantes de dados)
> 4. `docs/API_Reference.md` (contrato HTTP, erros, idempotência/ETag)
> 5. `docs/Modelagem_Produto.md`, `docs/Modelagem_UI-UX.md`, `docs/Catalogo_Momentos.md` (UX, microcopy, templates, critérios de aceite)

---

## Glossário (termos do domínio)

- **Account**: identidade/autenticação e agregador de acesso (multi-tenant). No B2C é quem “logou”, mas **não é** a unidade econômica do B2B.
- **User**: registro de usuário autenticável. Pode ter role `owner`, `guardian`, `viewer` (e `photographer` no portal do parceiro).
- **Child (Livro)**: unidade central do produto (child-centric). **Licenciamento, PCE e quota física de storage são por Child**.
- **PCE (Provisão de Custo de Existência)**: fundo provisionado por venda para sustentar acesso perpétuo. No B2B, o evento econômico é um **novo Child**.
- **Partner (Parceiro)**: fotógrafo/estúdio com acesso ao portal do parceiro e saldo de créditos.
- **Crédito (do parceiro)**: “potencialmente 1 novo Livro (Child) com PCE quitado” (dossiê).
- **Delivery (Entrega)**: pacote de arquivos do parceiro associado a um cliente/beneficiário. Pode ser por voucher ou importação direta.
- **Voucher**: código resgatável (B2B2C) que vincula/entrega uma `Delivery` ao usuário.
- **Late binding**: decisão de custo/consumo de crédito acontece **no resgate/importação**, quando o usuário escolhe entre **EXISTING_CHILD** e **NEW_CHILD**.
- **Moment (Momento)**: entrada/tela do álbum. Pode ser guiado (template) ou avulso.
- **Asset**: arquivo de mídia (foto/vídeo/áudio) com lifecycle (upload → process → ready).

---

## Regras de negócio — B2C (usuário final)

### Produto e monetização

- **Modelo principal:** “Acesso Perpétuo” (pagamento único) — não é assinatura.
- **Upsell:** “Pacote Completo” (ou pacotes de repetição, conforme evolução do pricing), sempre vendido como valor/experiência, **não** como “comprar GiB”.  
  Referências: `docs/Modelagem_Produto.md` (Seções 5.1 e 5.2).

### Quotas e limites (base)

- **Quota física de storage:** 2 GiB **por Child** (Livro).  
  Referências: `docs/Arquitetura_do_Sistema.md` (3.2), `docs/Modelo_de_Dados_Lógico.md`.
- **Limites de produto (gatilho de upsell):**
  - Momentos “únicos” e “séries fixas” são guiados pelo catálogo.
  - Momentos recorrentes têm limite gratuito (padrão 5) e, ao exceder, devem acionar upsell.
  - O metadado `upsell_category` vem do `moment_template` (ver `docs/Modelo_de_Dados_Lógico.md` 4.4 e `docs/Catalogo_Momentos.md`).

### Privacidade e compartilhamento

- **Privado por padrão:** nada é público automaticamente.
- **Compartilhamento:** via links privados SSR (edge). Deve ser revogável.
- **Guestbook:** social privado com moderação (owner aprova/rejeita), sem “likes” nem dinâmica de rede social.

### Concorrência e idempotência

- **ETag/If-Match** para evitar _lost updates_ → erro 412 quando conflito.
  - **Obrigatório** nos recursos onde o contrato exigir (ex.: `PATCH/DELETE` de entidades mutáveis, como `children` e `moments`).
  - **Recomendado** onde o contrato permitir (ex.: updates de perfil do `me`).
    Referência: `docs/API_Reference.md` (1.6).
- **Idempotência** para POSTs críticos.
  - Padrão da API: header `Idempotency-Key` (ex.: `/uploads/complete`, `/export`, `/print-jobs`, `/webhooks/payment`).
  - **Exceção atual na implementação B2B2C:** alguns fluxos usam `idempotency_key` no **body** (ex.: `/vouchers/redeem` e importação direta). Isso está listado como divergência a alinhar (ver seção “Consistência e lacunas”).

---

## Regras de negócio — B2B2C (parceiros, vouchers e entregas)

### Golden Record (núcleo)

1. **Licença por criança (Child-centric):**  
   O “evento econômico” do B2B é criar um **novo Child**.

2. **Voucher só quando necessário:**  
   Se o cliente **não tem conta**, o parceiro precisa gerar voucher (onboarding + resgate).  
   Se o cliente **já tem conta**, o parceiro pode criar entrega em modo **importação direta** (sem voucher).

3. **Late binding no resgate/importação:**
   - **EXISTING_CHILD** (Child já pago): custo **0**; em entrega com crédito reservado, isso vira **estorno**.
   - **NEW_CHILD**: custo **1 crédito**; cria Child com `pce_status='paid'` e consome o crédito.

Referências: `docs/Dossie_Execucao.md` (2.1 + seção de transação de unboxing), `apps/api/babybook_api/routes/vouchers.py`, `apps/api/babybook_api/routes/partner_portal.py`.

### Créditos do parceiro e lifecycle do crédito

- A entrega possui `credit_status` com os estados:
  - **reserved**: crédito foi reservado na criação da entrega (saldo do parceiro já foi debitado).
  - **consumed**: crédito foi consumido (resgate/importação criou NEW_CHILD).
  - **refunded**: crédito foi estornado (resgate/importação vinculou a EXISTING_CHILD).
  - **not_required**: entrega em modo importação direta (cliente já tem conta). Não há reserva antecipada.

Referências: `apps/api/alembic/versions/0004_child_pce_credit_status_ledger.py`, `apps/api/alembic/versions/0007_delivery_credit_not_required.py`.

### Portal do parceiro — criação de entrega

- O parceiro cria uma `Delivery` com dados do cliente e do evento.
- Regra operacional (email do cliente = `target_email`):
  - se `target_email` já existe como `User` **e** possui pelo menos 1 `Child` com `pce_status='paid'`, **não** reservar crédito → `credit_status='not_required'`.
  - caso contrário, reservar 1 crédito sob lock transacional (evitar double-spend) → `credit_status='reserved'`.
- A reserva (quando existir) deve gerar entrada em `PartnerLedger` (auditoria).

Observações:

- A UI do portal pode fazer **validação silenciosa** via `POST /partner/check-eligibility` (sem expor nomes/lista de filhos), mas a API sempre recalcula a regra no `POST /partner/deliveries`.
- O hard lock no resgate/importação é por e-mail (`Delivery.target_email`).

Referência principal: `apps/api/babybook_api/routes/partner_portal.py` (`create_delivery`).

### Upload do parceiro

- Upload é **client-side direto para storage** com URL presigned.
- Arquivos sobem primeiro para `tmp/` (lifecycle curto), depois são promovidos para `partners/{partner_id}/deliveries/{delivery_id}/`.
- Validações server-side mínimas (anti-spoofing de content-type, tamanho máximo, validação de key esperada).

Referências: `docs/Arquitetura_do_Sistema.md` (2.5), `apps/api/babybook_api/routes/partner_portal.py` (`upload/init`, `upload/complete`).

### Finalizar entrega e gerar voucher (ou importação direta)

- A entrega só pode ser finalizada se tiver ao menos 1 arquivo.
- Se `credit_status='not_required'`:
  - **não** gerar voucher; retornar `import_url` para o cliente importar autenticado.
- Caso contrário:
  - gerar voucher único e retornar dados do cartão digital (QR/URL), com validade.

Referência: `apps/api/babybook_api/routes/partner_portal.py` (`finalize_delivery`).

### Resgate de voucher (transação atômica)

- O resgate deve:
  - validar voucher (status, expiração, limite de usos)
  - ser idempotente (por `idempotency_key`)
  - permitir criação de conta/sessão no próprio resgate quando não autenticado
  - copiar assets server-side de `partners/...` para `u/...` (falha aborta a transação)
  - aplicar late binding **depois** da cópia, para não consumir/estornar em transações falhas

- Regras de late binding no resgate:
  - `EXISTING_CHILD`:
    - permitido apenas se `child.pce_status == 'paid'`
    - se a entrega estava `reserved`, gera `refunded` e devolve +1 crédito no parceiro (com `PartnerLedger`)
  - `NEW_CHILD` (ou legado sem action):
    - cria Child com PCE pago
    - se a entrega estava `reserved`, vira `consumed`
  - se a entrega está `not_required`, não há consumo/estorno.

Referência: `apps/api/babybook_api/routes/vouchers.py` (`redeem_voucher`).

---

## Requisitos de UX (obrigatórios)

### Resgate (B2B2C) — mitigação de misclick

- Se o usuário já tem filhos/livros, a UI deve **priorizar** “Adicionar ao Livro existente”.
- “Criar novo Livro” deve ser opção secundária.
- Proteções:
  - desabilitar ações imediatamente após clique
  - usar `idempotency_key`
  - manter o token/código estável durante login/cadastro (persistência local e redirect)

Referências: `docs/Modelagem_Produto.md` (seção “Golden Record — Child-Centric + Risco de Misclick”), `apps/web/src/features/vouchers/VoucherRedemptionPage.tsx`.

### Hard stop de quota

- Se o usuário tentar importar para um **Child existente** com storage cheio, a UI deve bloquear antes de side-effects (antes de cópia/criação de momento) e guiar para solução (upsell/limpeza).

Referência: `apps/web/src/features/vouchers/VoucherRedemptionPage.tsx` (hard stop antes do redeem).

### Unboxing

- Resgate deve ter experiência de “unboxing” com transições suaves, confete, e copy acolhedora.

Referência: `docs/Dossie_Execucao.md` (3.3), `docs/USER_MODULE_B2C_IMPLEMENTATION.md`.

---

## Requisitos não funcionais

### Segurança

- Sessão via cookie `__Host-session` (HttpOnly + Secure) + CSRF por header.
- RLS no banco para isolamento multi-tenant (evitar `WHERE account_id = ?` como segurança primária).
- Bucket privado: acesso a mídia via worker na edge que valida JWT e aplica ACL por path.

Referências: `docs/API_Reference.md` (1.1), `docs/Arquitetura_do_Sistema.md` (2.6 e segurança).

### Performance / SLOs

- Leitura p95 ≤ 500 ms
- Escrita leve p95 ≤ 800 ms
- Aceite de upload p95 ≤ 1500 ms
- Time-to-ready p95 ≤ 2 min
- God SLO: custo de estoque médio ≤ R$ 2,00/conta/ano

Referência: `docs/Arquitetura_do_Sistema.md` (1.1).

### Observabilidade e operação

- Erros devem ter `trace_id` (UI deve exibir para suporte).
- DLQ/retries para jobs assíncronos (quando aplicável).

---

## Modelo de erros (contrato)

- Envelope padrão de erro com `error.code`, `error.message`, `error.details`, `trace_id`.
- Códigos esperados e tratamento:
  - **402** `quota.recurrent_limit.exceeded` → abrir modal de upsell (pacote).
  - **413** `quota.bytes.exceeded` → hard stop (quota física), orientar limpeza/upgrade.
  - **412** (ETag/If-Match) → conflito de edição, recarregar e preservar rascunho.
  - **409** → conflitos de estado (ex.: crédito já consumido/estornado; voucher já usado).

Referência: `docs/API_Reference.md`.

> Nota de consistência: há trechos em docs que citam 402 para quota de bytes; o contrato de API descreve 413 para bytes excedidos. Este documento adota **API_Reference como canônico** e recomenda alinhar os demais docs.

---

## Critérios de aceite (alto nível)

### Fluxo B2C — criação de momento recorrente (gatilho de upsell)

- Dado um usuário sem entitlement de repetição, quando tentar criar a 6ª entrada recorrente, então a API retorna 402 com `quota.recurrent_limit.exceeded` e `details.package_key`, e a UI abre o modal do pacote.

### Fluxo B2B2C — entrega com voucher

- Dado parceiro com saldo ≥ 1, quando cria entrega (cliente sem conta), então o sistema reserva 1 crédito e registra no extrato.
- Quando finalizar entrega com arquivos, então um voucher único é gerado.
- Quando a mãe resgata escolhendo:
  - EXISTING_CHILD (PCE pago) → crédito vai para REFUNDED e saldo do parceiro aumenta em +1.
  - NEW_CHILD → crédito vai para CONSUMED.

### Fluxo B2B2C — importação direta (sem voucher)

- (UX) O portal do parceiro pode executar uma **validação silenciosa** (sem expor PII) em `POST /partner/check-eligibility`.
  - Se `is_eligible=true`, a criação da entrega é **0 crédito** (`credit_status='not_required'`).
  - Se `is_eligible=false` (ou se a validação falhar), a entrega deve seguir o caminho **1 crédito** (reserva/late binding conforme implementação).

- Dado cliente com conta e elegível, quando parceiro cria entrega, então `credit_status='not_required'` e não há reserva.
- Ao finalizar entrega, o sistema retorna `import_url` (sem voucher).
- Na importação, o usuário escolhe EXISTING_CHILD (0) ou NEW_CHILD (1 crédito).
  - **EXISTING_CHILD:** permitido apenas se `child.pce_status == 'paid'`.
  - **NEW_CHILD:** cobra **1 crédito do parceiro no momento da importação** (late binding), cria Child com `pce_status='paid'` e marca a entrega como `credit_status='consumed'`.
  - Se o parceiro não tiver saldo, a API retorna **402** `partner.insufficient_credits`.
    Referência (implementação): `apps/api/babybook_api/routes/me.py` (`POST /deliveries/{delivery_id}/import`).

- **Hard lock por e-mail (segurança):**
  - A entrega persiste `deliveries.target_email`.
  - No resgate/importação, somente o usuário autenticado com e-mail correspondente pode importar.
  - Em mismatch, a API retorna **403** `delivery.email_mismatch` com hint seguro `details.target_email_masked`.

---

## Consistência e lacunas (dez/2025)

Esta seção registra **o que está alinhado**, **o que diverge** entre documentos e implementação, e quais pontos exigem decisão/ajuste para evitar “doc drift”.

### ✅ Pontos confirmados como alinhados

- **Quota física (bytes) é hard stop com 413:**
  - Contrato: `docs/API_Reference.md` indica `413 quota.bytes.exceeded`.
  - Implementação: `apps/api/babybook_api/routes/uploads.py` lança `status_code=413` para `quota.bytes.exceeded`.
- **B2B2C — voucher só quando necessário + late binding:**
  - Implementação confirma `credit_status` em `reserved|consumed|refunded|not_required`.
  - Resgate (`/vouchers/redeem`) aplica estorno/consumo **após** cópia de arquivos (transação atômica).
  - Importação direta (`/deliveries/{id}/import`) cobra crédito do parceiro **apenas** em `NEW_CHILD`.

### ⚠️ Divergências (docs ↔ contrato ↔ código)

1. **Upload quota: 402 vs 413**
   - Alguns trechos de docs (ex.: `docs/Arquitetura_do_Sistema.md` em 3.2) mencionam 402 para bytes excedidos.
   - Contrato (`docs/API_Reference.md`) e implementação usam **413**.
   - **Ação recomendada:** atualizar `docs/Arquitetura_do_Sistema.md` para 413 (e manter 402 apenas para gatilhos de upsell, como `quota.recurrent_limit.exceeded`).

2. **Idempotência: header vs body**
   - Contrato global em `docs/API_Reference.md` define idempotência por **header** `Idempotency-Key`.
   - Implementação B2B2C usa `idempotency_key` no **body** em:
     - `apps/api/babybook_api/routes/vouchers.py` (`POST /vouchers/redeem`)
     - `apps/api/babybook_api/routes/me.py` (`POST /deliveries/{delivery_id}/import`)
   - **Ação recomendada (escolher 1):**
     - (A) padronizar para header (aceitar header e depreciar body), ou
     - (B) documentar explicitamente que esses endpoints usam body e manter o padrão dos demais no header.

3. **State machines (Moment/Privacy/Guestbook) divergem entre docs e modelos atuais**
   - `docs/API_Reference.md` descreve (ex.: Moment) `status: draft|processing|ready|published` e `privacy: private|people|link`.
   - A implementação atual (`apps/api/babybook_api/db/models.py`) define:
     - `moment_status_enum = draft|published|archived`
     - `moment_privacy_enum = private|people|public`
     - `guestbook_status_enum = pending|approved|hidden`
   - **Impacto:** risco de UI e API divergirem no tratamento de estados.
   - **Ação recomendada:** decidir a máquina de estados canônica (provavelmente a do `API_Reference`) e alinhar:
     - enums/migrations + modelos,
     - contrato/documentação,
     - UI (filtros/labels) e testes.

4. **Trechos de DDL “B2B2C” em docs estão desatualizados**
   - Em `docs/Modelo_de_Dados_Lógico.md` existem snippets que não refletem completamente o schema atual de `deliveries` (ex.: ausência de `credit_status` e enum expandido de `delivery_status`).
   - Implementação atual tem `delivery_status_enum = draft|pending_upload|ready|pending|processing|completed|failed` e `delivery_credit_status_enum` com `not_required`.
   - **Ação recomendada:** revisar/atualizar os snippets (ou removê-los em favor de apontar para as migrations/DDL reais).

### 🟡 Lacunas / decisões pendentes

- **Definir “verdade única” de estados e nomes:**
  - `privacy: link` vs `public` (o que a UI/edge realmente expõe?)
  - `guestbook: visible/deleted` vs `approved/hidden`
  - Moment `processing/ready` existe como estado real no produto (por assets/transcode) ou só no nível de Asset?

- **Formalizar o fluxo de importação direta no contrato público:**
  - ✅ Documentado em `docs/API_Reference.md` (seção “Entrega Direta (B2B2C) — Importação Direta (sem voucher)”).
  - **Manter em observação:** alinhamento fino de lista completa de erros (ex.: `delivery.invalid_credit_state`, `delivery.copy_failed`) e padronização de idempotência (header vs body).

- **Clarificar unidade do “beneficiário” no B2B2C:**
  - No código, `beneficiary_id` é um UUID de **Account** (não necessariamente `User`).
  - **Requisito:** documentar explicitamente para evitar integrações erradas.

- **Convergência de quotas:**
  - Hoje existem campos em `Account` (ex.: `plan_storage_bytes`) e quota efetiva em `Child.storage_quota_bytes`.
  - **Requisito:** reduzir redundância e garantir que a UI leia sempre a quota correta (child-centric).

---

## Apêndice — rastreabilidade (implementação)

- Resgate: `apps/api/babybook_api/routes/vouchers.py` → `redeem_voucher`
- Portal parceiro: `apps/api/babybook_api/routes/partner_portal.py` → `create_delivery`, `finalize_delivery`, upload init/complete
- UI resgate: `apps/web/src/features/vouchers/VoucherRedemptionPage.tsx`
- UI portal parceiro: `apps/web/src/features/partner-portal/*`
- Migrations: `apps/api/alembic/versions/0004_*`, `0007_*`
