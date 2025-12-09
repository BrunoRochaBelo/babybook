# Arquitetura & Domínio - Baby Book

Nota: este documento foi harmonizado com o [BABY BOOK: DOSSIÊ DE EXECUÇÃO](Dossie_Execucao.md). O dossiê contém as decisões de negócio e financeiras que impactam arquitetura e SLOs — consulte-o antes de alterar políticas de custo.

Documento de referência técnica. Cobre stack, fluxos críticos, segurança, governança, SLOs e políticas de custo para sustentar o modelo de "Acesso Perpétuo", garantindo lucratividade no D0 através da Provisão de Custo de Estoque (PCE).

## Sumário

- Visão, objetivos e princípios
  - 1.1. Metas de Engenharia (SLOs) e Implicações (Alinhado)
  - 1.2. Metas Mensuráveis de Produto (KPIs) (Alinhado)
  - 1.3. Restrições e premissas (Alinhado)
  - 1.4. Requisitos não funcionais
  - 1.5. Diretrizes de acessibilidade (WCAG)
- Stack, topologia e desenho de alto nível
  - 2.1. Stack, escolhas e racional (Alinhado)
  - 2.2. Mapa de comunicações
  - 2.3. DNS, domínios e políticas
  - 2.4. Contratos e compatibilidade (API v1)
  - 2.5. Padrões de chaves S3 e lifecycle (Alinhado)
  - 2.6. Presets de mídia e derivados
- Domínio de produto
  - 3.1. Entidades principais (Campos-chave)
  - 3.2. Quotas e política de upsell (Alinhado com "Pacotes de Repetição")
  - 3.3. Regras de negócio e invariantes
  - 3.4. Séries & rascunhos
  - 3.5. Print-on-Demand (Futuro)
  - 3.6. Cápsula do Tempo (Futuro)
  - 3.7. Domínio de Faturamento (Pagamento Único)
  - 3.8. Entidades de Faturamento (Alinhado com "Pacotes de Repetição")
- Fluxos críticos (com contratos)
  - 4.1. Registro de Conta (Onboarding)
  - 4.2. Verificação de E-mail
  - 4.3. Recuperação de Senha
  - 4.4. Autenticação (sessão + CSRF)
  - 4.5. Upload multipart direto ao B2 (Fluxo de Erro Detalhado)
  - 4.6. Compartilhamento público (SSR na Edge)
  - 4.7. Exportação completa (ZIP + manifest)
  - 4.8. Guestbook (mural) com RBAC
  - 4.9. Logout e invalidação de sessão
  - 4.10. Fluxo de Compra (Webhook) (Alinhado com "Pacotes de Repetição")
- Segurança e conformidade (STRIDE)
  - 5.1. CSP, cookies, CORS e headers
  - 5.2. Gestão de segredos e privilégios
  - 5.3. LGPD, privacidade e RLS
  - 5.4. Política de retenção e Cold Storage (Implementação Detalhada)
- Modelo padronizado de erros (API) (Alinhado)
- Capacidade, performance e escala
  - 7.1. Orçamentos de performance (budgets)
  - 7.2. Step-Cost (degraus de escala e custo)
  - 7.3. Paginação e anti-N+1
- Governança de dados e DR (Neon PITR)
- Observabilidade e SLOs
  - 9.1. SLIs, alertas e orçamentos de erro
  - 9.2. Telemetria e correlação ponta a ponta
  - 9.3. Política de Retries e DLQ (Dead-Letter Queue)
- Riscos arquiteturais e mitigação (Alinhado com PCE)
- Roadmap técnico (Simplificado)
- Apêndices (Guias de Implementação)
  - A. Matriz RBAC (Controle de Acesso)
  - B. Tabela de Rate-Limit (Defesa de API)
  - C. Estratégia de Desenvolvimento Local (DevEx)
  - D. Observabilidade (Logs Unificados & Tracing)
  - E. Governança de Banco (Migrações de Schema)

## 1. Visão, objetivos e princípios

Objetivo: Garantir uma experiência de usuário fluida e calma, sustentada por uma arquitetura de custo variável (pay-per-use) que viabilize financeiramente o modelo de Acesso Perpétuo. A arquitetura deve escalar de zero (ociosidade) a picos sazonais (ex: Dia das Mães) sem intervenção manual e com custo previsível.

Princípios:

- **Elasticidade Econômica:** Eliminar custo fixo (ociosidade) é a condição de sobrevivência do modelo. Usar Neon (DB) e Modal (Workers) para escalar a zero.

  **Implicação:** Aceitamos cold starts (a primeira consulta do dia ao Neon, o primeiro job do Modal) como um trade-off explícito para obter custo zero em repouso. A engenharia deve focar em minimizar o impacto percebido (ex: spinners na UI), não em eliminar o cold start (o que aumentaria o custo fixo).

- **Simplicidade Operacional:** Menos peças, menor MTTR (Mean Time to Repair).

  **Implicação:** Escolhemos serviços gerenciados (Cloudflare Queues, Neon) em vez de auto-hospedados (Redis, RabbitMQ), mesmo que sejam menos flexíveis. O custo de gerenciamento de infraestrutura é um custo fixo (tempo de engenharia) que deve ser eliminado.

- **Robustez Assíncrona:** Desacoplar tarefas pesadas (transcode) da API (aceite) através de uma fila robusta. A UX do usuário é "fire-and-forget".

  **Implicação:** A UI deve ser desenhada de forma otimista. Quando o usuário faz um upload e a API retorna 202 Accepted, o item deve aparecer imediatamente na UI com um estado "processando". O usuário nunca deve esperar pela transcodificação. Isso exige um mecanismo de atualização de estado no cliente. Dado o princípio de 'Simplicidade Operacional', a solução preferencial é o Short Polling (ex: a cada 5-10 segundos, GET /assets/status?ids=...), evitando a complexidade de WebSockets.

- **Privacidade por Padrão:** LGPD by design; RLS (Row-Level Security) em dados sensíveis.

  **Implicação:** Nenhuma consulta de aplicação deve acessar tabelas sensíveis (ex: Health) diretamente. O acesso deve ser feito através de views ou funções que aplicam as regras de RLS. Debug em produção não pode envolver SELECT \* em dados de usuário.

- **Portabilidade:** Aderência a interfaces padrão (HTTP, SQL, S3) para mitigar vendor lock-in.

  **Implicação:** Evitamos usar recursos específicos de provedor na lógica de negócio (ex: branching do Neon em produção, ou schedulers específicos do Modal). A aplicação deve rodar em qualquer Postgres (SQL), qualquer S3 (HTTP) e qualquer orquestrador de contêineres (HTTP).

### 1.1 Metas de Engenharia (SLOs) e Implicações (Alinhado)

- **SLO de Leitura (p95) ≤ 500 ms (dinâmico):**

  **Implicação (Engenharia):** Este é o tempo para carregar o dashboard principal (ex: GET /moments). Exige otimização cuidadosa de consulta (evitar N+1, usar JOINs eficientes) e, potencialmente, um cache de aplicação em memória (ex: fastapi-cache com backend in-memory) para os "hot paths" se o Neon se tornar um gargalo. Se a escala exigir um cache distribuído, a solução deve ser serverless (ex: Cloudflare KV), alinhada ao stack.

- **SLO de Escrita Leve (p95) ≤ 800 ms (metadados, mural):**

  **Implicação (Engenharia):** Ações como POST /guestbook ou PATCH /moments/{id} (mudar notas). A API deve realizar apenas a escrita no DB e retornar. Qualquer lógica complexa (ex: notificar outros usuários, checar 5 regras de negócio) deve ser deferida para um worker via fila.

- **SLO de Aceite de Upload (p95) ≤ 1500 ms:**

  **Implicação (Engenharia):** Este é o tempo combinado do POST /init e POST /complete. É a "velocidade percebida" pelo usuário. A API não pode fazer validações pesadas síncronas (ex: checar hash SHA256 do arquivo). Deve apenas (1) checar quota (rápido), (2) criar a linha Asset no DB (rápido), (3) publicar na fila (rápido) e retornar 202.

- **SLO de Time-to-Ready (p95) ≤ 2 min:**

  **Implicação (Engenharia):** Do complete ao derivado pronto. Este SLO dita nossas escolhas de custo vs. performance. Se este SLO for violado, temos duas opções: (1) Aumentar o custo (mais CPU/RAM nos workers Modal) ou (2) Reduzir a qualidade (presets de 720p com bitrate menor, menos thumbnails).

- **SLO de Custo de Estoque (Médio) ≤ R$ 2,00 /conta/ano:**

  **Implicação (Engenharia):** Alinhado com a Viabilidade (visao_viabilidade_babybook.md, Seção 2.3). Este é o "God SLO" (o SLO principal). A estimativa de custo anual por conta é ≈ R$ 1,25/ano (derivada da provisão do PCE de R$ 25,00 distribuída ao longo de 20 anos). O SLO de R$ 2,00 dá à engenharia uma margem de segurança para flutuações de câmbio ou preço de provedor antes que o modelo financeiro precise ser revisto. Todos os outros SLOs (performance, disponibilidade) são balanceados contra este.

### 1.2 Metas Mensuráveis de Produto (KPIs) (Alinhado)

- **Funil de Onboarding:** Taxa de conversão (Registro → Verificação → Primeiro Upload).

  **Link (Engenharia):** Falhas no SLO de Aceite de Upload ou complexidade no fluxo de verificação (4.2) aumentam o atrito e matam este KPI.

- **Taxa de Conclusão (Base):** % de usuários que completam os 60 momentos base.

  **Link (Engenharia):** Performance de leitura (SLO p95 < 500ms) e UI fluida são essenciais. Se o app for lento, o usuário abandona.

- **Taxa de Attach (Upsell):** % de usuários (base A1) que compram um "Pacote de Repetição" (Alvo: 20% A1, 25% A2, 30% A3+).

  **Link (Engenharia):** Alinhado com a Viabilidade. Este KPI agora mede lucro incremental (gravy), não sobrevivência. A engenharia deve garantir que o fluxo de POST /webhooks/payment (4.10) seja 100% robusto e idempotente.

- **CAC (Custo de Aquisição):** Custo blended por nova conta paga (Alvo A1: R$ 80).

  **Link (Engenharia):** Embora seja um KPI de marketing, um funil de onboarding lento (engenharia) aumenta o CAC.

### 1.3 Restrições e premissas (Alinhado)

- Infra multi-fornecedor: Cloudflare (Edge/CDN/Fila), Fly.io (API), Neon (DB), Backblaze B2 (S3), Modal (workers).
- API stateless: Sessão via cookie \_\_Host-session. Permite escalar horizontalmente.
- Upload direto ao B2 (multipart): API não trafega payload pesado; apenas orquestra.
- Quotas Base: 2 GiB de storage por conta; 60 momentos únicos; 5 entradas gratuitas para cada momento recorrente.
- Modelo de Negócio: Acesso Perpétuo (pagamento único) + Upsell de "Pacotes de Repetição" (pagamentos únicos adicionais). O modelo não é de assinatura (MRR) e não depende de upsell para sobreviver (graças ao PCE).
- Formato canônico: Vídeo MP4 (H.264/AAC) em 720p (base). 1080p pode ser um entitlement (direito) concedido via upsell, mas não é um shed-load.

## 2. Stack, topologia e desenho de alto nível

### 2.1 Stack, escolhas e racional (Alinhado)

| Componente     | Escolha                                                      | Racional (Alinhado com a Viabilidade)                                                                                                                                                            |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entrega/Edge   | Cloudflare Pages                                             | CDN global, SSL/WAF nativos, deploy via Git. Custo zero para estáticos. Simplicidade operacional.                                                                                                |
| SSR Público    | Cloudflare Workers                                           | Renderiza links públicos de share (share.babybook.com). Mantém a stack unificada na Cloudflare, custo fixo zero.                                                                                 |
| Backend (API)  | FastAPI (Python) @ Fly.io                                    | Async nativo, performance de I/O, ecossistema Python (conecta ao Modal). Fly nos dá uma micro-VM "quente" e barata.                                                                              |
| Banco de Dados | Neon (PostgreSQL)                                            | O pilar da elasticidade econômica. Autosuspend (escala-a-zero) em ociosidade. Vital para o modelo de Acesso Perpétuo.                                                                            |
| Armazenamento  | Cloudflare R2 (hot) + Backblaze B2 (cold)                    | Hot (R2) para thumbnails, previews e assets frequentemente acessados; Cold (B2) para originais e vídeos. Estratégia híbrida protege contra mudança de acordos comerciais e otimiza egress/custo. |
| Processamento  | Client-side (ffmpeg.wasm / mobile native) + Modal (fallback) | Compressão preferencial no cliente (ffmpeg.wasm em Web Worker; ffmpeg-kit / react-native-compressor no mobile). Modal mantém fallback server-side apenas para dispositivos fracos ou exceções.   |
| Fila (Queue)   | Cloudflare Queues                                            | Desacopla a API dos workers. Absorve picos (Dia das Mães) e garante retries. Custo zero na camada gratuita.                                                                                      |
| Sessão/Auth    | Cookies \_\_Host- + CSRF                                     | Abordagem B-F-F (Backend-for-Frontend) clássica. Simples e segura.                                                                                                                               |
| IaC / CI/CD    | Terraform + GitHub Actions                                   | Padrão de indústria para infra declarativa e pipelines de automação.                                                                                                                             |

### 2.2 Mapa de comunicações

- Cliente → API (via /api/ proxy): HTTPS (Cookie \_\_Host-session + Header X-CSRF-Token).
- Cliente → B2: HTTPS (PUT multipart via Presigned-URL).
- API → B2: HTTPS (SDK S3) - Apenas para gerar Presigned-URLs.
- API → Cloudflare Queues: HTTPS (SDK) - Para publicar jobs (ex: transcode_asset_id_123).
- Workers (Modal) → Cloudflare Queues: HTTPS (SDK) - Para consumir jobs.
- Workers (Modal) → B2: HTTPS (SDK) - GET original, PUT derivados (thumbs, 720p).
- Workers (Modal) → API: HTTPS (PATCH /assets/{id}) - Para atualizar status. Autenticado via Authorization: Bearer <MODAL_SERVICE_TOKEN>.
- Gateway (Pagamento) → API: HTTPS (Webhook) - POST /webhooks/payment (protegido por HMAC).

### 2.5 Padrões de chaves S3 e lifecycle (Alinhado) — **ATUALIZADO Jan/2025**

> ⚠️ **Implementação Concluída:** A estrutura de pastas abaixo está implementada em `apps/api/babybook_api/storage/paths.py`

#### Estrutura de Prefixos (Bucket: `bb-production-v1`)

| Prefixo                                               | Descrição                           | Lifecycle               | Acesso                  |
| ----------------------------------------------------- | ----------------------------------- | ----------------------- | ----------------------- |
| `tmp/{uuid}/`                                         | Uploads temporários em progresso    | **1 dia** (auto-delete) | Bloqueado               |
| `partners/{partner_uuid}/deliveries/{delivery_uuid}/` | Assets de parceiros para entrega    | **365 dias**            | JWT + role=photographer |
| `u/{user_uuid}/m/{moment_uuid}/`                      | Momentos do usuário                 | **Permanente**          | JWT + UUID match        |
| `sys/`                                                | Assets do sistema (logos, defaults) | **Permanente**          | Público                 |

#### Padrões de Chaves Detalhados

**Uploads Temporários:**

```
tmp/{upload_uuid}/{filename}
```

**Arquivos de Parceiros:**

```
partners/{partner_uuid}/deliveries/{delivery_uuid}/{filename}
partners/{partner_uuid}/deliveries/{delivery_uuid}/thumbs/{filename}
```

**Arquivos do Usuário:**

```
u/{user_uuid}/m/{moment_uuid}/original/{filename}
u/{user_uuid}/m/{moment_uuid}/preview/{filename}
u/{user_uuid}/m/{moment_uuid}/thumb/{filename}
```

**Arquivos do Sistema:**

```
sys/defaults/{filename}
sys/logos/{filename}
```

#### Racional da Estrutura:

- **UUID como isolamento:** `u/{user_uuid}/` garante isolamento por tenant. Impossível enumerar ou adivinhar paths de outros usuários.
- **`tmp/` como incinerador:** Lifecycle de 1 dia limpa uploads abandonados automaticamente.
- **`partners/` como quarentena:** Assets ficam em quarentena até resgate do voucher, quando são copiados para `u/`.
- **Separação original/preview/thumb:** Permite lifecycle diferenciado (previews recriáveis podem ter TTL).

#### Lifecycle Rules (B2)

```yaml
rules:
  - prefix: "tmp/"
    action: delete
    days: 1

  - prefix: "partners/"
    action: delete
    days: 365

  - prefix: "u/"
    action: cold_storage
    days: 365 # Após 1 ano sem acesso
```

#### Implementação

- **Módulo:** `apps/api/babybook_api/storage/paths.py`
- **Funções:** `tmp_upload_path()`, `partner_delivery_path()`, `user_moment_path()`, `secure_filename()`, `validate_user_access()`
- **Integração:** `hybrid_service.py`, `partner_service.py`, rotas de upload

### 2.6 Edge Worker "Porteiro Digital" — **NOVO Jan/2025**

> O bucket B2 é 100% privado. Todo acesso passa pelo Edge Worker que valida JWT e aplica ACL.

#### Arquitetura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cliente   │────▶│ Cloudflare Edge  │────▶│ B2 Bucket       │
│  (Browser)  │     │    Worker        │     │  (Privado)      │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │ 1. Extract JWT
                    │ 2. Verify Signature
                    │ 3. Check ACL
                    │ 4. Sign Request (aws4fetch)
                    │ 5. Stream Response + Cache
                    └─────────────┘
```

#### Regras de ACL

| Path Pattern | Validação                   | Descrição                                |
| ------------ | --------------------------- | ---------------------------------------- |
| `u/{uuid}/*` | JWT.sub === path.uuid       | Usuário só acessa seus próprios arquivos |
| `partners/*` | JWT.role === "photographer" | Parceiros acessam suas entregas          |
| `sys/*`      | Nenhuma (público)           | Assets do sistema                        |
| `tmp/*`      | **Sempre 403**              | Nunca exposto externamente               |

#### Benefícios

- **Segurança:** Bucket permanece privado, sem URLs públicas vazadas
- **Custo Zero de Egress:** Bandwidth Alliance (Cloudflare ↔ B2 = grátis)
- **Cache na Edge:** Vídeo assistido 10x = 9 do cache
- **Baixa Latência:** Executa em 200+ POPs globais

#### Implementação

- **Localização:** `apps/edge/`
- **Arquivos:** `src/lib/auth.ts`, `src/lib/storage.ts`, `src/routes/files.ts`
- **Config:** `wrangler.toml`
- **Testes:** 24/24 passando

### 2.7 Presets de mídia e derivados

(Ver seção de Catalogo_Momentos.md para detalhes de presets de imagem e vídeo)

## 3. Domínio de produto

### 3.1 Entidades principais (Campos-chave)

- **Account:**
  - id (uuid, pk)
  - email (text, unique, lower)
  - hashed_password (text)
  - status (enum: pending, active, archived)
  - entitlements (jsonb) - Ver Seção 3.8 para a nova estrutura.
  - stripe_customer_id (text, unique, nullable)
  - last_login_at (timestptz)

- **Child:**
  - id (uuid, pk), account_id (fk), name (text), dob (date), timezone (text) (ex: 'America/Sao_Paulo').

- **ChildAccess (Guardião/Convidado):**
  - id (uuid, pk), account_id (fk) (Ref: Account, o usuário que recebe o acesso), child_id (fk) (Ref: Child, o recurso sendo acessado), role (enum: owner, guardian, viewer). (Nota: Renomeado de 'Person' para 'ChildAccess' para clareza, alinhado à Matriz RBAC. A entidade 'Person' será usada futuramente para tagging.)

- **Moment:**
  - id (uuid, pk)
  - child_id (fk)
  - chapter_id (fk, nullable)
  - notes (text)
  - privacy (enum: private, people, link)
  - occurred_at (timestptz) - Data em que o momento ocorreu (definida pelo usuário).

- **Asset:**
  - id (uuid, pk)
  - account_id (fk) - (Nota: moment_id (fk) foi removido. Assets pertencem à conta e são vinculados a momentos via MomentAsset.)
  - status (enum: uploading, queued, processing, ready, error, archived)
  - original_key (text) - Chave S3 do arquivo original.
  - derivs (jsonb) - Ex: { "thumb_320": "...", "720p": "..." }
  - filesize (int8) - Tamanho do original (usado para checagem de quota).
  - error_message (text, nullable)

- **MomentAsset (Join Table):**
  - moment_id (fk), asset_id (fk), slot_key (text) (ex: 'photo_1', 'video_main').

### 3.2 Quotas e política de upsell (Alinhado com "Pacotes de Repetição")

**Base (Acesso Perpétuo):** storage_quota = 2 GiB (limite físico). moments_quota = 60 (momentos únicos/guiados). recurrent_limit = 5 (limite de entradas para cada momento recorrente, ex: 5 "Visitas Especiais", 5 "Consultas").

**Enforcement (Implementação):**

- POST /uploads/init { ... filesize }: Checa Usage.total_bytes < Account.entitlements.quota_storage_gb. Se falhar, retorna 402 Payment Required (code: quota.bytes.exceeded).
- POST /moments: Checa Usage.total_moments < Account.entitlements.moments_quota. Se falhar, retorna 402 (code: quota.moments.exceeded).
- POST /moments { recurrent_chapter_id: '...' }: Checa Usage.recurrent_visits < Account.entitlements.recurrent_limit (a menos que Account.entitlements.features.unlimited_social == true).
- Se a checagem (3) falhar, a API retorna 402 Payment Required (code: quota.recurrent_limit.exceeded).
- A UI deve interceptar o código quota.recurrent_limit.exceeded e exibir o modal de upsell específico para "Pacotes de Repetição".

**Política de Upsell (Produto, não Utilidade):** O upsell não é "Compre +1 GiB". O upsell é a compra de "Pacotes de Repetição Ilimitada" (pagamento único).

Exemplo 1: Pacote "Social" (R$ 29) → Define Account.entitlements.features.unlimited_social = true.

Exemplo 2: Pacote "Saúde" (R$ 29) → Define Account.entitlements.features.unlimited_health = true.

**Implicação:** A UI de upsell vende experiência, não espaço. Isso alinha a monetização com a proposta de valor (curadoria).

### 3.3 Regras de negócio e invariantes

- Um Moment só é publicável (privacy=link) se todos os Assets associados estiverem status=ready.
- Links de Share são noindex (via header X-Robots-Tag).
- Idempotência (Obrigatório): POST /uploads/complete, POST /export, POST /webhooks/payment.
- Concorrência (Obrigatório): PATCH /moments/{id} deve usar ETag/If-Match para evitar lost updates.

### 3.7 Domínio de Faturamento (Pagamento Único)

**Provedor:** Gateway de pagamento (ex: Stripe) via checkout gerenciado.

**Estratégia:** A API não armazena dados de cartão (PCI Nível A). O cliente é redirecionado para o portal do provedor (Stripe Checkout).

**Comunicação:** A API consome webhooks assinados (HMAC) do provedor para provisionar entitlements (ver 4.10).

### 3.7.1 Política de Pricing & Fees (Atualização do Dossiê)

Notas operacionais (deve constar na implementação do checkout e nos cálculos de Unit Economics):

- Precificação dual: R$ 297 (cartão, B2C varejo) / R$ 279 (PIX). Incentivo explícito ao PIX para reduzir taxas.
- Taxas de gateway projetadas: cartão B2C (parcelamento realístico) ≈ R$ 16,33 por venda; PIX ≈ R$ 1,00 por venda. Esses números devem ser usados nos cálculos de fechamento de pedido e relatórios financeiros.
- Canais B2B: preços e descontos para fotógrafos/partners — ex.: R$ 120 (lote 10), R$ 100 (lote 50+). O checkout parceiro deve processar pagamento B2B e gerar vouchers em lote.
- Tributação/Regime (Fator R): risco de enquadramento no Anexo V (alíquota ≈ 15,5%). Estratégia adotada: estruturar pró-labore >= 28% do faturamento bruto para manter Anexo III (alíquota efetiva mais favorável). Implementar checagens mensais (financeiro/contábil) e alertas se a razão pró-labore/faturamento cair abaixo do threshold.

Implicação técnica: O serviço de faturamento (ou webhook handler) deve calcular e armazenar (no Purchase/order) os valores líquidos (amount_gross, tax_effective, gateway_fee, pce_reserved) para futura reconciliação e relatórios.

### 3.8 Entidades de Faturamento (Alinhado com "Pacotes de Repetição")

- **Plan:** (Definição no Stripe, ex: price\_...) Ex: "Acesso Perpétuo Base", "Pacote Repetição Social".

- **Entitlement:** (O que o usuário comprou - armazenado no JSONB Account.entitlements)

  Estrutura Exemplo:

  ```
  {
    "quotas": {
      "storage_gb": 2,
      "moments_quota": 60,
      "recurrent_limit": 5
    },
    "features": {
      "allow_1080p": false,
      "unlimited_social": false,
      "unlimited_health": false,
      "unlimited_creative": false
    }
  }
  ```

- **Purchase:** (Referência no DB) id (uuid, pk), account_id (fk), stripe_customer_id (text), stripe_payment_intent_id (text, unique), plan_id (text), amount (int), paid_at (timestptz).

## 4. Fluxos críticos (com contratos)

### 4.5 Upload resiliente (Web & Mobile)

No modelo PWA/Edge, o upload precisa tolerar aba fechada, troca de app e redes móveis instáveis. A abordagem preferencial é:

- Compressão no cliente:
  - Web: ffmpeg.wasm em um Web Worker (multithread sempre que possível) para transcodificar 4K → 720p H.265 antes do envio.
  - Mobile: bibliotecas nativas (ffmpeg-kit, react-native-compressor) para usar aceleradores do dispositivo.

- Upload resumable & chunking:
  - Usar Uppy + plugin Tus (ou multipart S3 resumable) para divisão em chunks (ex: 5MB) e retomada automática.
  - Registrar Background Sync quando suportado para permitir reenvio silencioso quando a conexão retornar.

- Fluxo simplificado:
  1. Cliente solicita /api/uploads/init com metadados.
  2. API valida quota, cria Asset (status=uploading) e retorna instruções de upload (presigned URLs ou dados TUS).
  3. Cliente realiza compressão local e envia os chunks resumable diretamente ao storage (R2/B2) sem atravessar a API.
  4. Ao completar, o cliente chama /api/uploads/complete com prova (ETags ou metadata). API valida e marca Asset como queued/ready conforme webhooks de storage.

- Fallback server-side:
  - Se o dispositivo for incapaz de transcodificar (ex: aparelhos muito fracos), o cliente pode enviar o bruto e a API/Modal processam o job server-side. Esse caminho deve ser raríssimo e controlado via feature-flag.

Erros e reentrega:

- Em caso de falha de rede, o Uppy/Tus garante retomada do chunk. Em caso de falha de processamento server-side, o job entra na DLQ conforme política (9.3).

### Apêndice F: SQL — Partners, Deliveries e Vouchers

-- Extensão para gerar UUIDs randômicos (Segurança contra enumeração)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PARCEIROS (A Força de Vendas)
CREATE TABLE partners (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
voucher_balance INT DEFAULT 0 CHECK (voucher_balance >= 0),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE ENTREGAS (O "Pacote" fechado)
CREATE TABLE deliveries (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
partner_id UUID NOT NULL REFERENCES partners(id),
client_name VARCHAR(255),
assets_payload JSONB NOT NULL,
status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLAIMED', 'EXPIRED')),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE VOUCHERS (A Chave do Cofre)
CREATE TABLE vouchers (
code VARCHAR(20) PRIMARY KEY,
partner_id UUID NOT NULL REFERENCES partners(id),
delivery_id UUID REFERENCES deliveries(id),
redeemed_by_user_id UUID REFERENCES users(id),
redeemed_at TIMESTAMP WITH TIME ZONE,
status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE INDEX idx_deliveries_partner ON deliveries(partner_id);
CREATE INDEX idx_vouchers_lookup ON vouchers(code) WHERE status = 'ACTIVE';

### 4.10 Fluxo de Compra (Webhook) (Alinhado com "Pacotes de Repetição")

Substitui o "Ciclo de Vida da Assinatura" por "Confirmação de Compra Única".

- **PMT (Gateway) → API:** POST /webhooks/payment { ... } (Payload, Stripe-Signature).
- **API:** Valida Assinatura HMAC (Segurança).

  **Caminho de Erro (Segurança):** Retorna 401 Unauthorized (code: billing.webhook.signature.invalid).

- **API:** Valida Idempotência (usa event_id do gateway, checa Purchase.stripe_payment_intent_id).

  **Caminho de Erro (Duplicado):** Retorna 200 OK (reconhece, mas não processa de novo).

- **API:** Processa o evento (ex: payment_intent.succeeded).
- **API → DB:** (Em transação)
  - Localiza Account (via customer_id).
  - Localiza o Plan comprado (ex: "Pacote Repetição Social").
  - Atualiza Entitlements (Nova Lógica):
    ```
    -- Exemplo para o Pacote Social
    UPDATE Account
    SET entitlements = jsonb_set(
        entitlements,
        '{features, unlimited_social}',
        'true'::jsonb
    )
    WHERE stripe_customer_id = '...';
    ```
  - Grava Purchase no DB (gravando o event_id para idempotência).

  **Caminho de Erro (DB):** Se a transação falhar, a API retorna 500 Internal Server Error. O Gateway (Stripe) deve re-tentar o webhook.

- **API → PMT:** 200 OK.

## 5. Segurança e conformidade (STRIDE)

### 5.4 Política de retenção e Cold Storage (Implementação Detalhada)

- Logs operacionais: 30-90 dias.
- Exports: 72 h (B2 Lifecycle).
- Derivados (Cache): 90 dias (B2 Lifecycle) - Recriáveis sob demanda.

**Mitigação de Custo (Acesso Perpétuo):**

- **Ação de Custo (Implementação):** Um job agendado (ex: Modal Cron daily) roda SELECT id FROM Account WHERE status = 'active' AND last_login_at < NOW() - INTERVAL '12 months'.
- Para cada conta, o job (1) atualiza Account.status = 'archived' e (2) enfileira um novo job (ex: archive_account_assets) na Cloudflare Queues.
- **Job de Arquivamento (Worker Modal):** O worker lista todos os original.{ext} da conta no B2 (media/u/{account_id}/...) e executa a transição de storage (API do B2/S3) para a classe "Archive".
- **UX de Restauração (Implementação):**
  - Usuário loga (se status='archived', API atualiza para status='active').
  - Usuário tenta acessar um Moment com Asset.status = 'archived'.
  - UI mostra placeholder e botão "Restaurar do Arquivo" (e o aviso "Pode levar algumas horas").
  - Usuário clica → API enfileira um job de restore (ex: restore_asset).
  - Worker (Modal) chama a API do B2 (ex: "Standard" retrieval, 3-5 horas).
  - A API deve ter um webhook (ou poller) para detectar que o restore do B2 foi concluído.
  - Quando concluído, o webhook/poller atualiza Asset.status = 'ready'. A UI (via polling) reflete a mudança.

## 6. Modelo padronizado de erros (API) (Alinhado)

Envelope mantido: { error: { code, message, details, trace_id } }

Novos Códigos de Domínio (Revisados):

- auth.account.pending_verification
- auth.csrf.invalid
- quota.bytes.exceeded (Limite físico de 2GiB)
- quota.moments.exceeded (Limite de 60 momentos únicos)
- quota.recurrent_limit.exceeded (Ex: 6ª visita. Gatilho para o upsell de Pacote de Repetição)
- quota.payment.required (402 - Genérico)
- upload.etag.mismatch, upload.mime.unsupported
- validation.precondition.failed (412 - ETag não bateu)
- billing.webhook.signature.invalid (401)
- billing.event.idempotency.failed (409 ou 200 OK, ver 4.10)
- asset.archived (para UX de restauração do cold storage)
- asset.restore.inprogress (se o usuário tentar restaurar um asset já em processo)

## 7. Capacidade, performance e escala

### 7.1 Orçamentos de performance (budgets)

- Front (Web Vitals): $TTI \le 2.5$ s em 4G; bundle inicial (core) $\le 200$ KB gzip; code-splitting agressivo por rota.
- API: $p95 \le 300$ ms (leitura) e $\le 800$ ms (escrita leve).
- Workers: queue_time $p95 \le 30$ s; processing_time (SLO 1.1) $\le 90$ s.

### 7.2 Step-Cost (degraus de escala e custo)

- Fase A (MVP): 2-4 instâncias API; warm pool 10 (Modal); limites conservadores.
- Fase B (Promo): 4-8 instâncias API; warm pool 20-30; cron de prewarm ativo.
- Fase C (Pico): 8-12 instâncias API; warm pool 40-60; shed-load (pausar 1080p via feature flag) ativado se queue_time > 60s.

### 7.3 Paginação e anti-N+1

- Paginação: Obrigatório por cursor (ex: limit, cursor_created_at) (fwd-only) para feeds de Moment.
- Anti-N+1: Evitar expands automáticos. Usar projeções e JOINs controlados (via SQLModel / SQLAlchemy selectinload).

## 8. Governança de dados e DR (Neon PITR)

- Backups/PITR: RPO (Recovery Point Objective) $\le 15$ min; RTO (Recovery Time Objective) $\le 2$ h. Janelas de retenção (7-30 dias) via Neon.
- Auditoria: Tabela AuditLog imutável por 180 dias.
- Drills de DR: Exercícios trimestrais de restauração (via branching do Neon) em ambiente de staging.

## 9. Observabilidade e SLOs

### 9.1 SLIs, alertas e orçamentos de erro

- SLIs: Latência p95; taxa 5xx; queue_time.
- Alertas: Burn rate (ex: 14d/1h) nos SLIs. Alerta de Custo (ex: B2 egress > $100/dia).
- Ações: Freeze de deploy se exceder orçamento de erro.

### 9.2 Telemetria e correlação ponta a ponta

- Logs JSON (via structlog em Python) com trace_id, account_id, asset_id.
- Scrubbing de PII (ex: email, password) antes de enviar para o sink de logs.
- Sampling adaptativo em pico (para evitar custos de log).

### 9.3 Política de Retries e DLQ (Dead-Letter Queue)

**Falha Transitória (Retry):**

- Exemplos: 503 Service Unavailable, timeout de rede, 429 Too Many Requests.
- Ação (Cloudflare Queues): A própria Fila deve ser configurada para retries automáticos com backoff exponencial.

**Falha Definitiva (DLQ - Dead-Letter Queue):**

- Exemplos: 400 Bad Request (arquivo de mídia corrompido), 404 Not Found (asset original sumiu), 401/403 (Service-Token revogado).
- Ação (Cloudflare Queues): Após esgotar os retries, a Fila deve ser configurada para enviar a mensagem falha para uma DLQ.
- Ação (Engenharia): A DLQ deve gerar um alerta. Exige intervenção manual (Runbook). O Worker deve logar o error_message no Asset (se possível).

## 10. Riscos arquiteturais e mitigação (Alinhado com PCE)

| Risco                                     | Mitigação (Alinhada com Viabilidade visao_viabilidade_babybook.md)                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Custo de Longo Prazo (Acesso Perpétuo) | O maior risco. Mitigado por: (1) Hedge Mandatório (créditos USD). (2) Cold Storage Agressivo (5.4) após 12 meses. (3) Cláusula de "Taxa de Manutenção" (Termos de Uso) para contas inativas > 36 meses. Detalhe: Legalmente, "Acesso Perpétuo" deve ser definido como "perpétuo enquanto o serviço for comercialmente viável". |
| 2. Câmbio (USD/BRL)                       | Risco financeiro que impacta o Custo de Estoque (estimativa ≈ R$ 1,25/ano). Mitigado pela Política de Hedge Mandatório (compra de créditos USD pré-pagos no B2/Modal/Fly quando o câmbio estiver favorável).                                                                                                                   |
| 3. Cold Start (DB/Workers)                | Aceitar em p99. Manter pool warm (Modal) e instâncias mínimas (Fly.io) em picos sazonais. A UI deve sempre mostrar um spinner otimista para mascarar o cold start do Neon.                                                                                                                                                     |
| 4. Fim da "Bandwidth Alliance"            | Risco de plataforma que quebraria o Custo de Estoque (aumentando o egress). Mitigação de Longo Prazo: Migrar o storage do B2 para o Cloudflare R2, que tem zero custo de egress por padrão, eliminando a dependência da aliança.                                                                                               |
| 5. Risco de Upsell Baixo                  | Rebaixado de Risco de Sobrevivência para Risco de Lucro. O modelo (visao_viabilidade_babybook.md, Seção 5.3) sobrevive com 0% de attach rate (graças ao PCE). Mitigação (Produto): O upsell é agora 100% "gravy". A mitigação é o Plano de Engajamento (CRM, Highlight Reels) para maximizar este lucro extra.                 |

## 11. Roadmap técnico (Simplificado)

- **MVP (Core Loop):**
  - Identidade (Onboarding, Auth, Reset).
  - Upload (4.5) com Fila (Cloudflare Queues) e Worker (Modal 720p).
  - Share SSR (4.6), Export (4.7).
  - Quotas Base (3.2) - Incluindo a lógica de 5 entradas recorrentes.
  - Observabilidade mínima (SLOs 1.1) e DR (Neon PITR).
  - Fluxo de Compra (4.10) do "Acesso Perpétuo" Base.

- **v1.0 (Lançamento):**
  - Billing (4.10) Completo: Checkout de "Pacotes de Repetição" (Upsell).
  - i18n completo, Guestbook (4.8), RBAC (Apêndice A).
  - Implementação da Política de Cold Storage (5.4) e UX de restauração (vital para o custo de longo prazo).

- **v1.1 (Pós-Lançamento):**
  - Reforço de Segurança (ALE para Health/Vault, MFA).
  - Otimização de Custo (Dashboards de custo/tenant).
  - Features de Upsell (Print-on-Demand, Cápsula do Tempo).

## 12. Apêndices (Guias de Implementação)

### Apêndice A: Matriz RBAC (Controle de Acesso)

Define quem pode fazer o quê. Owner é o dono da conta (pagante). Guardian é um co-administrador (ex: cônjuge). Viewer é um convidado (ex: avós).

| Recurso/Ação                  | Owner (Dono) | Guardian (Guardião) | Viewer (Convidado) | Público (SSR) |
| ----------------------------- | ------------ | ------------------- | ------------------ | ------------- |
| Account (Conta)               |              |                     |                    |               |
| Ver/Editar Faturamento        | ✅           | ❌                  | ❌                 | ❌            |
| Editar Pref. da Conta         | ✅           | ❌                  | ❌                 | ❌            |
| Child (Criança)               |              |                     |                    |               |
| Criar/Editar Perfil           | ✅           | ✅                  | ❌                 | ❌            |
| Convidar/Remover Pessoas      | ✅           | ✅                  | ❌                 | ❌            |
| Mudar Papel (Viewer/Guardian) | ✅           | ✅                  | ❌                 | ❌            |
| Moment (Momentos)             |              |                     |                    |               |
| Criar/Editar/Excluir          | ✅           | ✅                  | ❌                 | ❌            |
| Ver (Privado)                 | ✅           | ✅                  | ✅                 | ❌            |
| Gerar/Revogar Link (Share)    | ✅           | ✅                  | ❌                 | ❌            |
| Ver (Link SSR)                | ❌           | ❌                  | ❌                 | ✅            |
| Guestbook (Mural)             |              |                     |                    |               |
| Postar Mensagem               | ✅           | ✅                  | ✅ (se habilitado) | ❌            |
| Moderar (Aprovar/Remover)     | ✅           | ✅                  | ❌                 | ❌            |
| Export/Print                  |              |                     |                    |               |
| Solicitar Exportação (4.7)    | ✅           | ✅                  | ❌                 | ❌            |
| Criar Print-on-Demand (3.5)   | ✅           | ✅                  | ❌                 | ❌            |

### Apêndice B: Tabela de Rate-Limit (Defesa de API)

Limites por IP (para rotas não autenticadas) e por account_id (para rotas autenticadas) para prevenir abuso e DoS.

| Rota (Prefixo /v1)         | Limite Base        | Janela | Observações (Risco)                     |
| -------------------------- | ------------------ | ------ | --------------------------------------- |
| POST /auth/register        | 5 req/hora/IP      | 3600s  | (DoS) Evitar abuso/spam de e-mail.      |
| POST /auth/login           | 10 req/min/IP      | 60s    | (Spoofing) Lockout progressivo.         |
| POST /auth/password/forgot | 3 req/hora/IP      | 3600s  | (DoS) Evitar spam de e-mail.            |
| POST /webhooks/payment     | (Sem limite de IP) | -      | (Spoofing) Protegido por HMAC (4.10).   |
| POST /uploads/init         | 20 req/min/Conta   | 60s    | (DoS) Proteger B2 e API de hotspots.    |
| POST /uploads/complete     | 20 req/min/Conta   | 60s    | (Tampering) Idempotência obrigatória.   |
| POST /moments              | 30 req/min/Conta   | 60s    | (DoS) Validação de quotas (3.2).        |
| POST /export               | 1 job/hora/Conta   | 3600s  | (DoS/Custo) Retornar 429 (job recente). |
| GET /share/{token} (SSR)   | 100 req/min/IP     | 60s    | (DoS) Proteger SSR de abuso.            |

### Apêndice C: Estratégia de Desenvolvimento Local (DevEx)

Objetivo: Garantir que um desenvolvedor possa rodar e testar a aplicação localmente com o mínimo de atrito, sem depender dos serviços de nuvem (Neon, Modal, B2), que são usados em staging.

Ferramenta Padrão: Um docker-compose.yml será mantido na raiz do repositório.

Serviços no Compose:

- api: A aplicação FastAPI, rodando com reload (ex: uvicorn ... --reload).
- db: Imagem postgres:15 padrão. O Alembic (Apêndice E) local será apontado para este container.
- storage: Mock S3 (ex: minio/minio). As variáveis de ambiente da API (SDK S3) apontarão para este endpoint local.

Mock da Fila: Para alinhar com o princípio de "Simplicidade Operacional", o worker (Modal) não será simulado localmente. Para testes de POST /uploads/complete, o mock da Cloudflare Queues na API (ativado por ENV=local) deve simplesmente chamar a lógica de transcodificação em processo (in-process) ou marcar o asset como "pronto" imediatamente, permitindo que o desenvolvedor teste a UI sem a complexidade da fila.

### Apêndice D: Observabilidade (Logs Unificados & Tracing)

Problema: O stack multi-provider (Fly, Modal, CF) torna o debugging impossível sem correlação.

Solução: Sink Unificado.

Ferramenta: Um sink de logs unificado (ex: BetterStack, Logtail, Datadog) deve ser configurado para receber logs de todos os serviços (Fly.io, Modal, Cloudflare).

Contrato de Tracing (Obrigatório):

- A API (Fly.io) deve gerar um X-Trace-ID (ou X-Request-ID) para cada requisição recebida.
- Esse X-Trace-ID deve ser incluído em todos os logs estruturados (JSON) gerados pela API.
- Esse X-Trace-ID deve ser passado para a mensagem da Fila (Cloudflare Queues) (ver 4.5).
- O Worker (Modal), ao consumir a mensagem, deve extrair o X-Trace-ID e incluí-lo em todos os seus logs.

Resultado: O desenvolvedor busca um único X-Trace-ID no sink de logs e vê a jornada completa da requisição, desde o POST /uploads/init (API) até o ffmpeg (Worker), em um só lugar.

### Apêndice E: Governança de Banco (Migrações de Schema)

Problema: Evolução do schema do Neon (Postgres) de forma caótica ou manual.

Solução: Migrações como Código.

Ferramenta Padrão: Dado o stack (FastAPI/Python), a ferramenta oficial para gerenciar migrações de schema será o Alembic.

Repositório: As migrações (.py) são versionadas e tratadas como código, fazendo parte do pull request que as introduz.

Execução (CI/CD): A migração será executada automaticamente durante o deploy no Fly.io, usando a diretiva [deploy.release_command] no fly.toml.

```
fly.toml: [deploy] release_command = "alembic upgrade head"
```

Rolling Updates: A API deve suportar, brevemente, N (código antigo) e N+1 (código novo) rodando simultaneamente. Migrações destrutivas (ex: DROP COLUMN) devem ser feitas em duas fases (deploy A introduz a mudança sem quebrar o código antigo; deploy B remove o código antigo e finaliza).
