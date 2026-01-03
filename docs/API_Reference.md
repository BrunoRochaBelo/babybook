# Baby Book API - Referência Técnica

Este documento descreve o contrato público da API v1 do Baby Book. O foco é ser uma referência técnica completa para integração, cobrindo contratos HTTP, fluxos de processo, regras de validação e o modelo de dados subjacente.

O design segue princípios de simplicidade (REST), resiliência (idempotência e concorrência otimista) e segurança por padrão (sessão HttpOnly + CSRF, RBAC). Este documento é a "fonte da verdade" para qualquer cliente (Web, Mobile) que consumir a API.

**Base URL (Produção):** https://app.babybook.com/api

**Base URL (Local, API direta):** http://localhost:8000

> Nota importante (paths): em produção a API é servida atrás de proxy reverso no mesmo domínio (`/api`).
> Por isso, neste documento os exemplos usam paths como `POST /auth/login` (sem repetir `/api`).

## 1. Princípios da API (Regras Globais)

Estas regras aplicam-se a todos os endpoints, salvo indicação contrária.

### 1.1. Autenticação e Segurança

A API opera com um modelo de sessão híbrido (cookie + header CSRF), ideal para aplicações Web (SPAs) hospedadas no mesmo domínio principal, eliminando a complexidade do CORS e refresh tokens.

**Sessão:** A autenticação é mantida por um cookie HttpOnly e Secure.

```
__Host-session (Secure; HttpOnly; SameSite=Lax; Path=/)
```

**Implicação:** O prefixo \_\_Host- é uma diretiva de segurança crucial. Ele garante que o cookie é seguro, não pode ser sobrescrito por subdomínios (ex: malicioso.app.babybook.com) e está vinculado ao host, prevenindo ataques de cookie injection. HttpOnly previne acesso via JavaScript (defesa contra XSS). SameSite=Lax oferece proteção nativa contra a maioria dos ataques CSRF em navegações top-level (ex: clicar em um link).

**CSRF (Cross-Site Request Forgery):** Para proteger contra CSRF em requisições iniciadas por JavaScript (ex: fetch, axios), que não são protegidas pelo SameSite=Lax, todas as requisições state-changing (POST, PUT, PATCH, DELETE) devem enviar um token CSRF pareado com a sessão no cabeçalho.

```
X-CSRF-Token: <token_obtido_via_GET_auth_csrf>
```

**Implicação:** Um atacante em um domínio malicioso não pode ler o cookie HttpOnly (para saber a sessão) nem pode fazer uma requisição a GET /auth/csrf para obter o token (devido à política de Same-Origin do navegador). Isso impede que ele forje uma requisição válida em nome do usuário.

**CORS:** Desligado em produção. A API é servida via proxy reverso no mesmo domínio (/api/). Isso simplifica drasticamente a segurança (não há OPTIONS pre-flight) e melhora a performance (menos round-trips de rede).

**RBAC (Role-Based Access Control):** Os papéis (owner, guardian, viewer), definidos no Modelo de Dados (Seção 3), são aplicados pela API em cada requisição (via dependências FastAPI) e determinam o acesso aos recursos, reforçados por RLS (Row Level Security) no banco.

### 1.2. Versionamento

Este documento descreve o **contrato v1**. Atualmente, o deploy web expõe a API atrás de proxy reverso em `/api`.

- **Regra (cliente):** não hardcodar `/v1` nos clientes. Use a base `/api` (produção) ou `http://localhost:8000` (API direta em dev).
- **Evolução (breaking changes):** se precisarmos de uma v2 com breaking changes, a estratégia preferida é publicar uma nova base (ex.: `/api/v2`) e manter compatibilidade por no mínimo 90 dias.

### 1.3. Formato de Dados

- **Requisições:** application/json; charset=utf-8 (exceto uploads multipart).
- **Respostas:** application/json; charset=utf-8 (sem BOM).
- **Ignorar Campos:** A API ignora campos JSON desconhecidos enviados no request (comportamento padrão do Pydantic). Isso permite que clientes v1.1 enviem dados extras para um servidor v1.0 sem quebrar.

### 1.4. Modelo de Erro Padrão

Respostas de erro (4xx, 5xx) seguem um envelope padrão para tratamento unificado no cliente.

```json
{
  "error": {
    "code": "string",
    "message": "string (legível, para debug, não para UI)",
    "details": {},
    "trace_id": "uuid"
  }
}
```

- **code:** Um identificador único para o erro (ex: auth.session.expired, quota.recurrent_limit.exceeded). A UI deve usar este código para tomar decisões (ex: redirecionar para o upsell ou para o login), e não a message.
- **details:** (Opcional) Um objeto com informações contextuais.

  **Exemplo (422 Validation Error):**

  ```json
  "details": [
    { "loc": ["body", "data", "peso_kg"], "msg": "value must be greater than 0", "type": "value_error.greater_than" }
  ]
  ```

  **Exemplo (402 Upsell Trigger):**

  ```json
  "details": { "package_key": "social" }
  ```

- **trace_id:** (Obrigatório) O ID de rastreabilidade (conforme Estrutura do Projeto 1.3). A UI deve exibir este ID para o usuário em caso de erro fatal, facilitando o suporte ("Por favor, nos informe este código: bb-trace-...").

### 1.5. Convenções Comuns

- **Datas:** ISO-8601 em UTC (ex: 2025-05-12T14:35:22Z). Campos "date-only" usam YYYY-MM-DD.
- **IDs:** UUID v4 para recursos.
- **Paginação:** Usamos paginação baseada em cursor (forward-only), que é mais performática que OFFSET em datasets grandes.
  - `?limit=25` (Padrão 25, Máx. 100)
  - `&cursor=<next_cursor_token>` (O token é opaco para o cliente, geralmente um timestamp ou ID criptografado).
- **Ordenação:** Padrão created_at DESC.
  - `?sort=occurred_at&order=asc`
- **Trace:** Toda resposta (sucesso ou erro) retorna um X-Trace-Id.

### 1.6. Concorrência (ETag)

Para previnir lost updates (condições de corrida), operações de escrita (PATCH, PUT, DELETE) em recursos mutáveis (como Moment) devem usar controle de concorrência otimista (baseado no rev do Modelo de Dados).

- GET em um recurso (ex: /moments/{id}) retorna um header ETag: "W/<rev_id>".
- PATCH ou DELETE nesse recurso deve enviar o header If-Match: "W/<rev_id>".
- Se o ETag no servidor for diferente (o recurso foi modificado por outra requisição), a API rejeita a operação com 412 Precondition Failed.

**Implicação (UI):** A UI (cliente) deve tratar o 412 como um erro esperado. Ela não deve tentar novamente. Ela deve:

- Parar a submissão (ex: setLoading(false)).
- Notificar o usuário (ex: "A mãe/pai salvou este momento primeiro! Vamos recarregar os dados.").
- Opcional: Salvar o draft do usuário no localStorage.
- Recarregar os dados (queryClient.invalidateQueries(["moments", id])) para exibir a versão mais recente.

### 1.7. Idempotência (POST)

Para garantir que operações de criação (POST) possam ser repetidas com segurança (ex: em caso de falha de rede), endpoints críticos suportam uma chave de idempotência.

- Envie o header Idempotency-Key: <uuid-v4>.
- A API armazena o resultado da primeira requisição com essa chave por 24h. Requisições repetidas (mesma chave, mesmo endpoint) retornarão a mesma resposta original (ex: 201 Created) sem reprocessar.

**Endpoints Críticos para Idempotência:**

- POST /webhooks/payment (Crítico! Usa o event.id do gateway como chave). Justificativa: Se o gateway (Stripe) enviar o webhook e nossa API processar, mas a resposta 200 OK se perder (timeout de rede), o Stripe vai tentar de novo. Sem idempotência, daríamos o upsell duas vezes.
- POST /export (Evita criar 2 ZIPs).
- POST /print-jobs (Evita criar 2 pedidos de impressão).
- POST /uploads/complete (Evita agendar 2 jobs de transcodificação).

### 1.8. Rate Limit

A API aplica limites de requisição por IP e/ou conta.

- **429 Too Many Requests:** Resposta quando o limite é excedido.
- **Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After.

**Implicação (UI):** O cliente deve respeitar o Retry-After (em segundos) e usar exponential backoff com jitter.

#### 1.8.1. Limites Específicos por Rota

Estes são os limites contratuais que o cliente deve esperar.

| Rota (prefixo /api — contrato v1) | Limite base        | Janela | Observações (Risco)                        |
| --------------------------------- | ------------------ | ------ | ------------------------------------------ |
| POST /auth/register               | 5 req/hora/IP      | 3600 s | (DoS) Evitar abuso/spam de e-mail          |
| POST /auth/login                  | 10 req/min/conta   | 60 s   | (Spoofing) Lockout progressivo             |
| POST /auth/password/forgot        | 3 req/hora/conta   | 3600 s | (DoS) Evitar spam de e-mail                |
| POST /webhooks/payment            | (Sem limite de IP) |        | (Spoofing) Protegido por HMAC              |
| POST /uploads/init                | 10 req/min/conta   | 60 s   | (DoS) Proteger R2 e API de hotspots        |
| POST /uploads/complete            | 10 req/min/conta   | 60 s   | (Tampering) Idempotência obrigatória       |
| POST /moments                     | 30 req/min/conta   | 60 s   | (DoS) Validação de slots (custosa)         |
| POST /moments/{id}/share          | 10 req/min/conta   | 60 s   | 1 ativo por momento (regra de negócio)     |
| POST /export                      | 1 job ativo        |        | (DoS/Custo) Retornar 409 export.concurrent |
| GET /export/{id}                  | 60 req/min/conta   | 60 s   | (DoS) Limitar polling                      |
| POST /guestbook                   | 30 req/min/conta   | 60 s   | (DoS) Estado pending                       |
| DELETE /guestbook/{id}            | 30 req/min/conta   | 60 s   | tombstone                                  |

### 1.9. Privacidade (LGPD)

- **Finalidade:** Armazenamento de lembranças familiares (Base Legal: Execução de Contrato).
- **Minimização:** Payloads evitam PII redundante.
- **Portabilidade:** POST /export fornece um ZIP completo.
- **Eliminação:** Remoção lógica (soft delete) imediata; hard delete por job assíncrono (conforme Modelo de Dados 10.4).

## 2. Guia Rápido: Autenticação (SPA Flow)

Este é o fluxo recomendado para uma Single-Page Application (SPA).

- **Carregar o App:** O cliente (SPA) é carregado.
- **Obter Token CSRF:** O cliente faz uma chamada inicial (ex: no bootstrap do app) para:

  ```
  GET /auth/csrf
  ```

  **Rationale:** Isso "prima" a sessão, define um cookie CSRF inicial (mesmo para anônimos) e retorna o token necessário para o login.

  **Resposta:** 200 OK { "csrf_token": "..." }.

- **Submeter Login:** O usuário preenche o formulário. O cliente envia:

  ```
  POST /auth/login
  Corpo: { "email": "...", "password": "...", "csrf_token": "..." }
  ```

- **Receber Sessão:** A API valida as credenciais e o token CSRF.

  **Resposta:** 204 No Content.

  **Ação (Header):** Define o cookie de sessão Set-Cookie: \_\_Host-session=... no navegador. Este cookie é HttpOnly, tornando-o inacessível ao JavaScript.

- **Chamadas Autenticadas:** A partir de agora, o navegador enviará o cookie \_\_Host-session automaticamente. O cliente deve incluir o X-CSRF-Token (obtido no passo 2 ou de uma nova chamada a /auth/csrf após o login) em todas as requisições POST, PUT, PATCH e DELETE.

  **Rationale (Double Submit Cookie):** O servidor valida que o X-CSRF-Token (Header) corresponde ao segredo dentro do \_\_Host-session (Cookie). Um atacante não pode ler nenhum dos dois, portanto não pode forjar a requisição.

- **Logout:**

  ```
  POST /auth/logout (enviando o X-CSRF-Token).
  ```

  A API invalida a sessão e envia um Set-Cookie para expirar o cookie no navegador.

## 3. Guia Rápido: Upload de Mídia (Multipart Flow)

O upload de arquivos grandes é feito diretamente para o storage (Cloudflare R2 — **R2-only**) usando URLs pré-assinadas ou um protocolo resumable (TUS). Sempre que possível a compressão/transcode é feita no cliente (ffmpeg.wasm no navegador ou bibliotecas nativas no mobile) antes do envio, reduzindo custos de banda e processamento server-side.

- **Iniciar Upload (Cliente -> API):** O cliente informa à API que deseja iniciar um upload.

  ```
  POST /uploads/init
  Corpo: { "child_id": "<uuid>", "filename": "VID_1234.MP4", "size": 10485760, "mime": "video/mp4", "sha256": "base64:..." }
  ```

  **Ação da API:**
  - Verifica quota de storage **do Child** (quota.bytes.exceeded → 413).
  - Verifica sha256 para deduplicação (conforme Modelo de Dados 5.0).

- **Receber Resposta (API -> Cliente):**

  **Cenário A (Arquivo Novo):**

  ```
  200 OK
  Corpo: { "upload_id": "2f2a...", "key": "u/...", "parts": [1, 2], "urls": ["https://r2...", "https://r2..."] }
  ```

  **Cenário B (Deduplicação):** O arquivo já existe.

  ```
  200 OK
  Corpo: { "asset_id": "a1b2...", "status": "ready" }
  ```

  **Implicação (UI):** O upload é pulado. A UI pode marcar como 100% concluído.

- **Enviar Partes (Cliente -> R2):** (Apenas se Cenário A)

  O cliente faz PUT dos chunks (partes) do arquivo diretamente para as urls pré-assinadas (ex: PUT https://r2...partNumber=1...).

  **Implicação (UI):** A UI (conforme Estrutura do Projeto 9.0) deve fazer isso em paralelo (ex: 3 partes de cada vez) e suportar retries por parte.

  O cliente deve coletar o header ETag (ex: "a543...") retornado pelo storage para cada parte enviada com sucesso.

- **Completar Upload (Cliente -> API):** (Apenas se Cenário A)

  ```
  POST /uploads/complete
  Header: Idempotency-Key: <uuid> (Altamente recomendado).
  Corpo: { "upload_id": "2f2a...", "etags": [{ "part": 1, "etag": "\"a543...\"" }, ...] }
  ```

- **Agendar Transcode (API -> Cliente):**

  A API valida as partes no R2 e publica um job na Cloudflare Queues para apps/workers.

  ```
  202 Accepted
  Corpo: { "asset_id": "a1b2...", "status": "queued" }
  ```

  **Implicação (UI):** O upload terminou, mas o processamento (transcode) começou. O asset_id é o ID que deve ser usado ao criar um Momento. A UI deve usar um endpoint de Server-Sent Events (SSE) (ex: GET /assets/subscribe?ids=...) para ser notificada sobre mudanças de status (processing -> ready -> failed) em tempo real para os assets relevantes.

  **Racional:** Polling é ineficiente, gera carga desnecessária na API (violando nosso 'God SLO' de custo) e atrasa a notificação ao usuário. SSE é uma arquitetura mais limpa e em tempo real para este caso.

### 3.1. Notificação de Status de Asset (SSE)

Para evitar polling (ex: GET /assets/{id} a cada 5s), o cliente deve usar este endpoint SSE para receber atualizações de status em tempo real.

```
GET /assets/subscribe
```

**Descrição:** Abre uma conexão SSE (Server-Sent Events) de longa duração. A API usará esta conexão para "empurrar" atualizações de status para o cliente.

**Parâmetros de Query:**

- `?ids=asset_id_1,asset_id_2,asset_id_3` (IDs dos assets que o cliente está "observando").

**Resposta (Stream):**

```
event: asset_update
data: {"id": "asset_id_1", "status": "processing", "progress_pct": 10}

event: asset_update
data: {"id": "asset_id_1", "status": "ready", "progress_pct": 100, "url": "..."}

event: asset_update
data: {"id": "asset_id_2", "status": "failed", "error_code": "transcode.unsupported_codec"}
```

**Implicação (UI):** O Upload Manager (Seção 8) deve, após o 202 Accepted do /uploads/complete, adicionar o novo asset_id à sua lista de observação e (re)conectar ao stream SSE. Isso permite que a UI mostre o progresso de transcodificação em tempo real.

## 4. Referência de Recursos (Endpoints)

### Recurso: Autenticação (Auth)

Endpoints para gerenciamento de sessão e CSRF.

#### GET /auth/csrf

Emite um token CSRF pareado com a sessão atual (autenticada ou anônima).

**Respostas de Sucesso:**

- 200 OK: { "csrf_token": "..." }

#### POST /auth/login

Inicia uma nova sessão de usuário, validando credenciais e o token CSRF.

**Corpo da Requisição:**

```json
{
  "email": "ana@example.com",
  "password": "string",
  "csrf_token": "token"
}
```

**Respostas de Sucesso:**

- 204 No Content: (Define o cookie \_\_Host-session).

**Respostas de Erro Comuns:**

- 400 Bad Request (Ex: auth.csrf.invalid)
- 401 Unauthorized (Ex: auth.credentials.invalid, auth.account.pending_verification)
- 429 Too Many Requests

#### POST /auth/logout

Revoga a sessão atual e expira o cookie no cliente.

**Respostas de Sucesso:**

- 204 No Content: (Expira o cookie \_\_Host-session).

**Respostas de Erro Comuns:**

- 401 Unauthorized

### Recurso: Conta (Me)

Endpoints para o usuário autenticado gerenciar seu próprio perfil e consultar cotas.

**Objeto Me**

```json
{
  "id": "uuid",
  "email": "ana@example.com",
  "name": "Ana",
  "locale": "pt-BR"
}
```

**Objeto Usage (Alinhado com Visão & Viabilidade)**

Este é o objeto de billing e quotas. A UI deve usar este objeto para construir a tela de "Minha Conta / Assinatura".

```json
{
  "storage": {
    "bytes_used": 104857600,
    "bytes_quota": 2147483648
  },
  "moments": {
    "unique_used": 27,
    "unique_quota": 60
  },
  "recurrent_usage": {
    "social": { "used": 3, "quota": 5 },
    "creative": { "used": 1, "quota": 5 },
    "tracking": { "used": 0, "quota": 5 }
  },
  "entitlements": {
    "unlimited_social": false,
    "unlimited_creative": false,
    "unlimited_tracking": false
  }
}
```

- **storage:** A quota física (2 GiB). Atingir isso gera um erro 413 (Upload bloqueado).
- **moments:** A quota de momentos únicos (60). Atingir isso gera um erro 402 (Upsell de Momentos, feature futura).
- **recurrent_usage:** O rastreamento de "repetições". used é o COUNT(\*) de momentos daquela categoria. quota é o limite gratuito (ex: 5).
- **entitlements:** Os flags booleanos do Modelo de Dados (Seção 4.1).

**Implicação (UI):** A UI deve ler recurrent_usage.social e entitlements.unlimited_social.

- Se unlimited_social for true, a UI exibe "Visitas: Ilimitado".
- Se false, a UI exibe "Visitas: 3 / 5". Se used >= quota, o botão "Adicionar Visita" deve acionar o modal de upsell.

#### GET /me

Retorna os dados do usuário autenticado.

**Respostas de Sucesso:** 200 OK (Retorna o objeto Me).

**Respostas de Erro Comuns:** 401 Unauthorized (Ex: auth.session.expired)

#### PATCH /me

Atualiza preferências básicas do usuário.

**Headers Específicos:** If-Match: "<etag>" (Recomendado)

**Corpo da Requisição:**

```json
{
  "name": "Ana Maria",
  "locale": "pt-BR"
}
```

**Respostas de Sucesso:** 200 OK (Retorna o objeto Me atualizado e um novo ETag).

**Respostas de Erro Comuns:** 401 Unauthorized, 412 Precondition Failed, 422 Unprocessable Entity

#### GET /me/usage

Retorna o uso atual e limites (cotas).

- **Obrigatório:** passe `child_id` (query string) para obter `bytes_used/bytes_quota` do **Livro (Child)**.
- **Sem modo legado:** este endpoint é estritamente **child-centric**.

**Nota de Consistência:**

- `bytes_used` é calculado a partir dos assets atribuídos ao Child (`assets.child_id`) e tende a ser _quase em tempo real_.

**Respostas de Sucesso:** 200 OK (Retorna o objeto Usage).

**Respostas de Erro Comuns:** 401 Unauthorized

### Recurso: Vouchers (B2B2C) — **Late Binding (Golden Record)**

Este recurso implementa o fluxo em dois tempos (Reserva → Confirmação) sem permitir que o parceiro pesquise a base (LGPD).

- **Reserva:** ocorre quando o parceiro cria uma entrega (decrementa saldo e marca a `delivery.credit_status = RESERVED`).
- **Confirmação:** ocorre no resgate (a mãe decide vincular a um Livro existente ou criar um novo).

#### POST /vouchers/validate

Valida um código de voucher sem consumi-lo.

**Corpo da Requisição:**

```json
{ "code": "BB-ABCD1234" }
```

**Respostas de Sucesso:** 200 OK

```json
{
  "valid": true,
  "voucher": {
    "id": "uuid",
    "code": "BB-ABCD1234",
    "partner_id": "uuid",
    "partner_name": "Estúdio Demo",
    "delivery_id": "uuid | null",
    "beneficiary_id": "uuid | null",
    "expires_at": "2025-12-31T23:59:59Z | null",
    "uses_left": 1,
    "max_uses": 1,
    "is_active": true,
    "created_at": "2025-12-01T12:00:00Z",
    "redeemed_at": null
  },
  "partner_name": "Estúdio Demo",
  "delivery_title": "Ensaio Newborn",
  "assets_count": 42,
  "error_code": null,
  "error_message": null
}
```

**Respostas de Erro Comuns:**

- 404 Not Found (voucher.not_found)
- 400 Bad Request (voucher.expired | voucher.not_available)

#### GET /vouchers/check/{code}

Checagem rápida de disponibilidade (útil para UI) baseada na validação.

**Resposta de Sucesso:** 200 OK

```json
{ "available": true, "reason": null }
```

ou

```json
{ "available": false, "reason": "voucher.expired" }
```

#### GET /vouchers/me

Lista vouchers resgatados pelo usuário atual.

**Resposta de Sucesso:** 200 OK

```json
[
  {
    "id": "uuid",
    "code": "BB-ABCD1234",
    "partner_id": "uuid",
    "partner_name": "Estúdio Demo",
    "delivery_id": "uuid | null",
    "beneficiary_id": "uuid",
    "expires_at": "2025-12-31T23:59:59Z | null",
    "uses_left": 0,
    "max_uses": 1,
    "is_active": false,
    "created_at": "2025-12-01T12:00:00Z",
    "redeemed_at": "2025-12-10T12:00:00Z"
  }
]
```

#### POST /vouchers/redeem

Resgata um voucher e realiza o vínculo tardio com um Livro (Child).

**Corpo da Requisição:**

```json
{
  "code": "BB-ABCD1234",
  "idempotency_key": "uuid-v4-opcional",
  "action": {
    "type": "EXISTING_CHILD",
    "child_id": "uuid"
  }
}
```

ou

```json
{
  "code": "BB-ABCD1234",
  "action": {
    "type": "NEW_CHILD",
    "child_name": "Bento"
  },
  "create_account": {
    "email": "ana@example.com",
    "name": "Ana",
    "password": "..."
  }
}
```

> Compatibilidade: clientes legados podem omitir `action`. Nesse caso, a API trata como um resgate equivalente a `NEW_CHILD`.

**Regras de Negócio (Golden Record):**

- Se `action.type = EXISTING_CHILD`:
  - A API valida que o usuário é guardião do `child_id`.
  - A API valida que `child.pce_status = PAID`.
  - Resultado financeiro: `deliveries.credit_status = REFUNDED` + ajuste no saldo do parceiro + registro no extrato.

- Se `action.type = NEW_CHILD`:
  - A API cria um novo `child` com `storage_quota_bytes = 2 GiB` e `pce_status = PAID`.
  - Resultado financeiro: `deliveries.credit_status = CONSUMED` (saldo do parceiro não muda, pois já foi debitado na reserva).

**Respostas de Sucesso:** 200 OK

```json
{
  "success": true,
  "voucher_id": "uuid",
  "child_id": "uuid",
  "assets_transferred": 42,
  "message": "Voucher resgatado com sucesso!",
  "redirect_url": "/app/onboarding"
}
```

`redirect_url` pode variar:

- Quando `create_account` foi usado (conta/sessão criada no resgate): `"/app/onboarding"`
- Quando o usuário já estava autenticado: `"/jornada"`

Observação: a resposta pode incluir campos adicionais para observabilidade/integração (ex.: `delivery_id`, `moment_id`, `csrf_token`).

**Respostas de Erro Comuns:**

- 401 Unauthorized (auth.session.invalid) — quando não há sessão e `create_account` não foi fornecido.
- 403 Forbidden (child.access.denied)
- 400 Bad Request (voucher.not_available | voucher.expired | child.pce.unpaid)
- 409 Conflict (voucher.already_claimed)

### Recurso: Portal do Parceiro (B2B2C) — Entregas

Este recurso descreve as rotas do **portal do parceiro** (`/partner`) usadas pela UI de estúdios/fotógrafos para criar e acompanhar entregas.

Objetivos principais:

- **Escala:** parceiros podem ter milhares de entregas, então os filtros são **server-side** (paginação e agregações coerentes).
- **Consistência:** `total`, paginação e contadores por status refletem o **subconjunto filtrado**.
- **Segurança:** acesso restrito a `role=photographer` (ou admin/owner), com scoping por `partner_id`.

#### Vocabulário de status (normalização)

O backend normaliza o status do banco para o vocabulário do portal:

- Banco `completed` → API `delivered`
- Banco `pending` → API `processing`
- Banco `failed` → API `failed`

Consequentemente:

- `status_filter=delivered` filtra `deliveries.status == completed` no banco.
- `status_filter=processing` filtra `deliveries.status in (pending, processing)`.

#### GET /partner/deliveries

Lista entregas do parceiro com filtros e agregações.

> Nota: este endpoint usa **paginação por offset** (diferente da convenção global de cursor descrita no documento).

**Query params (principais):**

- `status_filter` (opcional): `draft | pending_upload | processing | ready | failed | delivered | archived`
- `include_archived` (opcional, default `false`): inclui arquivadas na listagem quando `status_filter` não é `archived`
- `limit` (opcional, default `20`, máx `100`)
- `offset` (opcional, default `0`)

**Query params (filtros avançados):**

- `q` (opcional): busca básica por tokens (case-insensitive) em `title/client_name/voucher_code/target_email/beneficiary_email`
- `voucher` (opcional): `with | without`
- `redeemed` (opcional): `redeemed | not_redeemed` (baseado em `deliveries.assets_transferred_at`)
- `credit` (opcional): `reserved | consumed | refunded | not_required | unknown`
- `view` (opcional): `needs_action` (heurística server-side: `draft|pending_upload|failed` OU `ready` sem voucher)

**Query params (período):**

- `created` (opcional): `last_7 | last_30 | last_90 | custom`
  - `created_from` / `created_to` (quando `created=custom`) no formato `YYYY-MM-DD` (date-only) ou ISO-8601 (datetime)
- `redeemed_period` (opcional): `last_7 | last_30 | last_90 | custom`
  - `redeemed_from` / `redeemed_to` (quando `redeemed_period=custom`) no formato `YYYY-MM-DD` ou ISO-8601

> Dica: `created`/`redeemed_period` também aceitam `all` (ou podem ser omitidos) para não aplicar filtro de período.

**Query params (ordenação):**

- `sort` (opcional, default `newest`): `newest | oldest | status | client`

**Resposta de Sucesso:** 200 OK

```json
{
  "deliveries": [
    {
      "id": "uuid",
      "title": "Ensaio Newborn",
      "client_name": "Ana",
      "status": "ready",
      "credit_status": "reserved",
      "is_archived": false,
      "archived_at": null,
      "assets_count": 42,
      "voucher_code": "BABY-ABCD-EFGH | null",
      "created_at": "2025-12-10T12:00:00Z",
      "redeemed_at": "2025-12-12T18:15:00Z | null",
      "redeemed_by": "ana@example.com | null"
    }
  ],
  "total": 120,
  "aggregations": {
    "total": 520,
    "archived": 40,
    "by_status": {
      "draft": 3,
      "pending_upload": 12,
      "processing": 6,
      "failed": 1,
      "ready": 80,
      "delivered": 378
    }
  }
}
```

**Semântica de `aggregations`:**

- `aggregations.*` é calculado no **subconjunto filtrado** por `q/voucher/redeemed/credit/view/períodos`.
- `aggregations` é **independente** de `status_filter/limit/offset` (para permitir chips de status coerentes).
- `by_status` conta apenas entregas **ativas** (não arquivadas). Arquivadas ficam em `archived`.

**Respostas de Erro Comuns:**

- 401 Unauthorized (auth.session.invalid)
- 403 Forbidden (partner.forbidden)
- 400 Bad Request (parâmetro inválido, ex.: período/sort)

**Notas de performance (contratuais):**

- Em Postgres, recomenda-se índices compostos por `partner_id` para filtros muito usados (voucher/resgate/arquivamento).
- Em volume alto, `q` pode exigir evolução para FTS/trigram/unaccent; por ora é uma busca tokenizada básica (case-insensitive).

#### PATCH /partner/deliveries/{delivery_id}

Atualiza campos básicos (não sensíveis) de uma entrega.

- Campos permitidos: `title`, `client_name`, `description`, `event_date`
- Não permite alterar `target_email`.
- Não permite forçar `status` (o status é controlado pelo sistema).

**Resposta de Sucesso:** 200 OK (mesmo shape de `DeliveryResponse`)

**Respostas de Erro Comuns:**

- 400 Bad Request (ex.: tentativa de alterar status; entrega já resgatada/importada)
- 404 Not Found

#### DELETE /partner/deliveries/{delivery_id}

Remove uma entrega **somente** quando ainda é rascunho e sem uploads/voucher.

- Se havia `credit_status=reserved`, estorna automaticamente (+1 no saldo) e registra no ledger.

**Resposta de Sucesso:** 204 No Content

**Respostas de Erro Comuns:**

- 400 Bad Request (não é rascunho / já tem uploads/voucher)
- 404 Not Found

### Recurso: Entrega Direta (B2B2C) — Importação Direta (sem voucher)

Este recurso cobre o fluxo em que o parceiro cria uma entrega destinada a um e-mail existente e o cliente importa os arquivos diretamente para um Livro (Child), sem uso de voucher.

**Objetivos de segurança/privacidade (LGPD):**

- O parceiro **não** pode "procurar" contas na base (apenas recebe um booleano de elegibilidade).
- A entrega é "hard-locked" por e-mail: `deliveries.target_email`.
- No resgate/importação, **somente** o usuário autenticado com e-mail correspondente pode importar.

#### POST /partner/check-eligibility

Validação silenciosa (para UX): retorna se o e-mail informado é elegível para entrega direta.

**Regras (alto nível):**

- Elegível quando o usuário existe e tem pelo menos 1 Child com PCE pago/ativo.
- Se a validação falhar (erro temporário), o cliente deve assumir **não elegível** (fail-safe), para evitar tentativa de fluxo "grátis" que falharia depois.

**Corpo da Requisição:**

```json
{ "email": "ana@example.com" }
```

**Resposta de Sucesso:** 200 OK

```json
{ "is_eligible": true, "reason": "EXISTING_ACTIVE_CHILD" }
```

ou

```json
{ "is_eligible": false, "reason": "NEW_USER" }
```

**Respostas de Erro Comuns:**

- 401 Unauthorized (auth.session.invalid)
- 403 Forbidden (partner.forbidden)

#### GET /me/deliveries/pending

Lista entregas pendentes de importação direta para o usuário autenticado.

**Resposta de Sucesso:** 200 OK

```json
{
  "items": [
    {
      "delivery_id": "uuid",
      "partner_name": "string | null",
      "title": "string",
      "assets_count": 12,
      "target_email": "ana@example.com | null",
      "target_email_masked": "a***@e***.com | null",
      "created_at": "2025-12-10T12:00:00Z"
    }
  ],
  "total": 1
}
```

**Notas de privacidade:**

- `target_email` pode ser omitido/nulo no futuro; `target_email_masked` é a forma segura para UI.

**Respostas de Erro Comuns:**

- 401 Unauthorized (auth.session.invalid)

#### POST /me/deliveries/{delivery_id}/import

Importa uma entrega de importação direta para um Livro existente ou cria um novo.

**Corpo da Requisição:**

```json
{
  "idempotency_key": "uuid-v4-opcional",
  "action": { "type": "EXISTING_CHILD", "child_id": "uuid" }
}
```

ou

```json
{
  "idempotency_key": "uuid-v4-opcional",
  "action": { "type": "NEW_CHILD", "child_name": "Bento" }
}
```

**Regras de negócio:**

- `EXISTING_CHILD`: permitido somente se `child.pce_status = PAID`. Não cobra crédito.
- `NEW_CHILD`: cobra **1 crédito do parceiro** no momento da importação (late binding).

**Hard lock por e-mail:**

- Se `deliveries.target_email` existir e **não** bater com o e-mail do usuário autenticado, a API retorna 403 `delivery.email_mismatch`.
- A resposta deve incluir um hint seguro em `error.details.target_email_masked`.

**Resposta de Sucesso:** 200 OK

```json
{
  "success": true,
  "delivery_id": "uuid",
  "assets_transferred": 12,
  "child_id": "uuid",
  "moment_id": "uuid",
  "message": "Entrega importada com sucesso."
}
```

**Respostas de Erro Comuns:**

- 401 Unauthorized (auth.session.invalid)
- 403 Forbidden (delivery.email_mismatch)

  Exemplo:

  ```json
  {
    "error": {
      "code": "delivery.email_mismatch",
      "message": "Esta entrega foi enviada para outro e-mail. Faça login com a***@e***.com para resgatar.",
      "details": { "target_email_masked": "a***@e***.com" },
      "trace_id": "uuid"
    }
  }
  ```

- 400 Bad Request (delivery.not_direct_import | child.pce.unpaid)
- 402 Payment Required (partner.insufficient_credits)
- 404 Not Found (delivery.not_found)
- 422 Unprocessable Entity (request.validation_error)

### Recurso: Crianças (Children)

Gerenciamento dos perfis das crianças associadas à conta.

**Objeto Child**

```json
{
  "id": "uuid",
  "name": "string:1..120",
  "birthday": "YYYY-MM-DD | null",
  "avatar_url": "url | null"
}
```

#### GET /children

Lista as crianças da conta, com paginação e busca.

**Parâmetros de Query:** limit (int), cursor (string), q (string, busca por nome)

**Respostas de Sucesso:** 200 OK:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Bento",
      "birthday": "2025-01-05",
      "avatar_url": null
    }
  ],
  "next": "cursor_token | null"
}
```

**Respostas de Erro Comuns:** 401 Unauthorized

#### POST /children

Cria um novo perfil de criança.

**Headers Específicos:** Idempotency-Key: <uuid> (Recomendado)

**Corpo da Requisição:**

```json
{
  "name": "Bento",
  "birthday": "2025-01-05",
  "avatar_url": null
}
```

**Respostas de Sucesso:** 201 Created (Retorna o objeto Child criado).

**Respostas de Erro Comuns:** 401 Unauthorized, 422 Unprocessable Entity (Ex: validation.name.required)

#### GET /children/{id}

Retorna detalhes de uma criança específica.

**Respostas de Sucesso:** 200 OK (Retorna o objeto Child).

**Respostas de Erro Comuns:** 401 Unauthorized, 404 Not Found (Ex: child.not_found)

#### PATCH /children/{id}

Atualiza uma criança.

**Headers Específicos:** If-Match: "<etag>" (Obrigatório)

**Respostas de Sucesso:** 200 OK (Retorna o objeto Child atualizado e novo ETag).

**Respostas de Erro Comuns:** 401 Unauthorized, 404 Not Found, 412 Precondition Failed

#### DELETE /children/{id}

Remove (logicamente) uma criança.

**Headers Específicos:** If-Match: "<etag>" (Obrigatório)

**Respostas de Sucesso:** 204 No Content

**Respostas de Erro Comuns:** 401 Unauthorized, 404 Not Found, 412 Precondition Failed

### Recurso: Pessoas (People)

Gerenciamento de pessoas (adultos, amigos) que aparecem nos momentos.

**Objeto Person**

```json
{
  "id": "uuid",
  "name": "string:1..120",
  "avatar_url": "url | null"
}
```

(Endpoints GET, POST, PATCH, DELETE seguem o mesmo padrão de Children, usando o objeto Person).

### Recurso: Guardiões (Guardians)

Gerenciamento de convites e acesso para outros usuários (guardian ou viewer).

#### POST /guardians/invite

Cria e envia um convite por e-mail para um novo guardião/visualizador.

**Headers Específicos:** Idempotency-Key: <uuid> (Recomendado)

**Corpo da Requisição:**

```json
{
  "email": "tania@example.com",
  "role": "guardian",
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**Respostas de Sucesso:** 201 Created: { "invite_id": "uuid" }

**Respostas de Erro Comuns:** 401 Unauthorized, 403 Forbidden (só Owners podem convidar), 422 Unprocessable Entity (Ex: guardian.email.already_linked)

#### POST /guardians/{invite_id}/accept

Aceita um convite (requer autenticação do usuário convidado).

**Respostas de Sucesso:** 201 Created (Vínculo de acesso criado).

**Respostas de Erro Comuns:** 401 Unauthorized, 404 Not Found (Ex: guardian.invite.expired)

#### DELETE /guardians/{account_user_id}

Remove o acesso de um guardião/visualizador da conta.

**Respostas de Sucesso:** 204 No Content

**Respostas de Erro Comuns:** 401 Unauthorized, 403 Forbidden, 404 Not Found

### Recurso: Templates de Momento

Define os "tipos" de momentos (ex: "Primeiro Sorriso") e suas regras de slots, incluindo o gatilho de upsell.

**Objeto MomentTemplate (Alinhado com Modelo de Dados 4.4)**

```json
{
  "id": "uuid",
  "key": "visita_especial",
  "display_name": "Visita Especial",

  "upsell_category": "social | creative | tracking | null",

  "limits": { "photo": 3, "video": 1, "video_max_sec": 10 },
  "rules": { "xor_groups": [["video", "audio"]] },
  "prompt_microcopy": { "pt": "Quem veio visitar?", "es": "..." },
  "data_schema": {
    "type": "object",
    "properties": { "quem_visitou": { "type": "string" } }
  },
  "ui_schema": { "quem_visitou": { "ui:widget": "TextInput" } }
}
```

- **upsell_category:** O campo-chave que liga este template a um pacote de upsell. Se for 'social', a API saberá que deve checar a quota social_recurrent_quota (do GET /me/usage).

#### GET /moment-templates

Lista os templates de momento disponíveis para a conta.

**Implicação (UI):** A UI deve chamar este endpoint no bootstrap e cacheá-lo. Este endpoint é a "fonte da verdade" para a UI construir dinamicamente o formulário de "Adicionar Momento" (renderizando os campos de data_schema com as dicas de ui_schema) e para saber qual upsell_category um momento possui.

**Respostas de Sucesso:** 200 OK (Retorna uma lista de objetos MomentTemplate).

**Respostas de Erro Comuns:** 401 Unauthorized

### Recurso: Momentos (Moments)

O recurso central da aplicação.

**Objeto Moment**

```json
{
  "id": "uuid",
  "child_id": "uuid | null",
  "template_id": "uuid | null",
  "occurred_at": "ISO-8601",
  "type": "photo | video | audio | mixed",
  "status": "draft | processing | ready | published",
  "privacy": "private | people | link",
  "people": ["uuid"],
  "tags": ["string"],
  "location": { "name": "Hospital Esperança", "lat": -8.05, "lng": -34.9 },
  "data": { "peso_kg": 5.1, "reacao": "fez_careta" },
  "assets": {
    "photos": ["asset-id-1", "asset-id-2"],
    "video": "asset-id-3 | null",
    "audio": "asset-id-4 | null"
  }
}
```

#### GET /moments

Lista momentos com filtros, paginação e ordenação.

**Parâmetros de Query:** status, people, child_id, tag, from, to, template_key (ex: visita_especial), limit, cursor, sort, order

**Respostas de Sucesso:** 200 OK:

```json
{
  "items": [
    { "id": "uuid", "type": "video", "occurred_at": "...", "status": "ready" }
  ],
  "next": "cursor_token | null"
}
```

**Respostas de Erro Comuns:** 401 Unauthorized, 400 Bad Request (Ex: filtro inválido)

#### POST /moments

Cria um novo momento (via template) referenciando asset_ids de uploads concluídos. Este é o endpoint que valida as quotas de repetição.

**Headers Específicos:** Idempotency-Key: <uuid> (Obrigatório)

**Corpo da Requisição:** (Objeto Moment parcial, sem id, status, type)

**Lógica de Quota (API):**

- API busca o MomentTemplate (usando template_id).
- Verifica a upsell_category (ex: 'social').
- Se null, é um momento único. Verifica usage.moments.unique_used < usage.moments.unique_quota. (Se falhar → 413).
- Se 'social', verifica usage.entitlements.unlimited_social.
- Se false, verifica usage.recurrent_usage.social.used < usage.recurrent_usage.social.quota.
- Se falhar no passo 5 → Retorna 402 Payment Required com o details.package_key.

**Respostas de Sucesso:**

- 201 Created: (Retorna o objeto Moment criado, com status: "processing" e ETag).

**Respostas de Erro (Negócio):**

- 402 Payment Required: (Gatilho de Upsell)
  ```json
  {
    "error": {
      "code": "quota.recurrent_limit.exceeded",
      "message": "Limite de momentos recorrentes atingido para esta categoria.",
      "details": {
        "package_key": "social"
      },
      "trace_id": "bb-trace-..."
    }
  }
  ```
- 413 Payload Too Large (Ex: quota.moments.exceeded - atingiu os 60 momentos únicos).
- 409 Conflict (Chave de idempotência repetida).
- 422 Unprocessable Entity (Ex: moment.validation.slots, asset.not_found).

(Endpoints GET /moments/{id}, PATCH /moments/{id}, DELETE /moments/{id}, POST /moments/{id}/publish, etc. seguem o padrão RESTful conforme documento original, com ETag e RBAC.)

(Recursos: Marcadores, Séries, Capítulos, Compartilhamento (Shares), Cápsula, Saúde, Cofre, Print-on-Demand e Exportação seguem os padrões definidos no documento anterior...)

### Recurso: Guestbook (Livro de Visitas)

Endpoints para interação de convidados e gestão de convites.

#### POST /children/{child_id}/guestbook/invites

Envia um convite por e-mail para alguém deixar uma mensagem no Guestbook.

**Racional:** Permite que o Owner convide avós e amigos de forma ativa. O sistema envia um e-mail com um link único (`/guestbook/{token}`).

**Corpo da Requisição:**

```json
{
  "email": "vovo@example.com",
  "message": "Vovó, venha deixar um recadinho para a Alice!",
  "lang": "pt-BR"
}
```

**Respostas de Sucesso:** 201 Created

```json
{
  "invite_id": "uuid",
  "token": "..." // (Opcional, geralmente enviado por email)
}
```

**Respostas de Erro:** 401 Unauthorized, 422 Unprocessable Entity (Ex: email inválido).

#### GET /guestbook/invites/{token}

Recupera metadados do convite usando o token público. Usado pela página de aterrissagem (Edge/Frontend) para mostrar "Você foi convidado por Ana para visitar o livro de Alice".

**Acesso:** Público (Autenticação via Token na URL).

**Resposta de Sucesso:** 200 OK

```json
{
  "child_name": "Alice",
  "child_avatar_url": "...",
  "inviter_name": "Ana",
  "message": "Vovó...",
  "valid": true
}
```

**Respostas de Erro:** 404 Not Found (Token inválido ou expirado).

#### POST /guestbook/entries (via Token)

Cria uma mensagem no guestbook usando o token do convite.

**Corpo da Requisição:**

```json
{
  "token": "...",
  "name": "Vovó Maria",
  "message": "Alice, você é a luz das nossas vidas!",
  "relationship": "Avó"
}
```

**Resposta de Sucesso:** 201 Created (Status: pending).

### Recurso: Sinais Vitais (Health Checks)

Endpoints públicos (sem autenticação) para monitoramento (ex: UptimeRobot, K8s probes).

#### GET /health

(Liveness Probe) Sonda de "saúde" básica. Verifica se a API está "viva" (online e respondendo).

**Implicação:** Esta chamada não deve tocar no banco ou em serviços externos. Ela apenas retorna 200 OK para dizer "o processo está rodando".

**Respostas de Sucesso:** 200 OK: { "ok": true }

#### GET /ready

(Readiness Probe) Sonda de "prontidão". Verifica se a API está pronta para aceitar tráfego (ex: se consegue conectar ao banco de dados, filas e storage).

**Implicação:** Esta chamada deve fazer uma checagem leve (ex: SELECT 1 no DB, ping na Fila) para garantir que suas dependências críticas estão saudáveis. Se o DB estiver fora, este endpoint deve falhar.

**Respostas de Sucesso:** 200 OK: { "ok": true }

**Respostas de Erro:** 503 Service Unavailable: (Se uma dependência crítica estiver offline).

### Recurso: Webhooks (Inbound)

Endpoints consumidos por serviços de terceiros (ex: Gateways de Pagamento).

#### POST /webhooks/payment

Endpoint público para receber eventos de faturamento. Este endpoint é o núcleo do nosso upsell.

**Segurança:** Este endpoint não usa Sessão ou CSRF. A autenticação é feita validando a assinatura HMAC enviada pelo gateway (ex: header Stripe-Signature). A API deve rejeitar com 401 se a assinatura for inválida.

**Idempotência:** A API deve tratar idempotência usando o id do evento enviado pelo gateway (ex: evt\_...) e armazenando-o em uma tabela idempotency_key (conforme Modelo de Dados 7.2) para evitar provisionamento duplicado.

**Corpo da Requisição (Exemplo Stripe):** O payload crucial é (1) o _metadata_ que o cliente (UI) enviou para o checkout e (2) o método de pagamento normalizado.

**Campo obrigatório para conciliação:** `payment_method_type`

- Valores aceitos (normalizados pela API): `pix` | `credit_card`
- Motivo: as margens (e o timing do caixa) são drasticamente diferentes entre PIX e cartão; precisamos registrar isso no `Purchase/order` para relatórios e auditoria.

```json
{
  "id": "evt_123abc...",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_...",
      "amount": 2900,
      "currency": "brl",
      "payment_method_type": "pix",
      "metadata": {
        "account_id": "uuid-da-conta-do-usuario",
        "package_key": "unlimited_social"
      }
    }
  }
}
```
