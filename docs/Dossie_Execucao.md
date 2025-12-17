# BABY BOOK: DOSSIÊ DE EXECUÇÃO

Status: Documento Mandatório

Foco: Estratégia de Negócio, Engenharia Financeira, Arquitetura Técnica & Roteiro de Implementação

Atualiza: Todas as versões anteriores dos documentos "Visão & Viabilidade", "Modelagem do Produto", "Plano de Negócio", "Arquitetura", etc

---

## PARTE 1: ESTRATÉGIA & VIABILIDADE FINANCEIRA

### 1. ENGENHARIA FINANCEIRA: O CHOQUE DE REALIDADE

O modelo original era "tecnicamente viável", mas financeiramente frágil para um desenvolvedor solo no Brasil. Realizamos um stress test considerando a realidade de taxas bancárias, impostos complexos e custos ocultos.

#### 1.1 Gateway de Pagamento e Liquidez

Premissa Original:

- Custo estimado: R$ 7,37 por transação (~3,5% + taxa fixa)
- Baseado em taxas ideais ignorando a cultura brasileira de parcelamento

Nova Realidade (Blindagem do Caixa):

- A Verdade Brasileira: Ticket de R$ 200+ quase sempre vira parcelamento. Para viabilizar conversão sem implodir margem, **subsidiaremos apenas até 3x sem juros** no B2C.
- Regra de Segurança Financeira (pior cenário): **assumimos 12% all-in** (gateway + antecipação + custo do parcelamento 3x) no cartão.
- Taxa PIX (referência): **R$ 1,50** (fixa)

Estratégia de Incentivo PIX:

- Preço "Cheio" (Cartão): **R$ 297,00** → comunica premium e absorve o custo do parcelamento até 3x
- Preço "Desconto" (PIX): **R$ 279,00** → incentiva liquidez imediata e reduz risco/custo
- Resultado: Margem líquida maior no PIX + menor risco operacional (chargeback e disputa)

#### 1.2 Impostos e Regime Tributário

Premissa Original:

- Alíquota linear: 9%-10% (R$ 18-20)

Nova Decisão (Planejamento Fator R):

- Risco Identificado: Desenvolvedores de software caem no Anexo V do Simples (15,5%)
- Solução: Engenharia do Fator R para manter Anexo III (6%)
- Regra Matemática: Folha de pagamento (pró-labore) ≥ 28% do faturamento bruto
- Exemplo Prático: Faturamento R$ 10.000 → Pró-labore mínimo R$ 2.800 (+ INSS)
- Projeção Conservadora: Mantemos 10% como margem de segurança nos cálculos

#### 1.3 Infraestrutura D0 (Setup Inicial)

Premissa Original:

- Custo: R$ 0,49 por usuário no "Dia Zero"
- Tecnologia: Upload RAW → Gatilho Cloud → Transcodificação Server-side
- Problema: Custos ignoravam retries, arquivos corrompidos e CPU intenso para H.265

Revolução Client-Side:

- Tecnologia: WebAssembly (FFmpeg.wasm) no navegador
- Novo Custo: ~R$ 0,20 (redução de 60%)
- Vantagem: CPU do usuário trabalha gratuitamente. Servidor vira apenas "validador leve"
- Economia: ~90% na infra de entrada

#### 1.4 Custos Invisíveis e Operacionais

Custos Fixos Mensais Identificados:

- Contador: R$ 300/mês
- Apple Developer Account: $99/ano (~R$ 8,25/mês)
- Domínios & E-mail Marketing: R$ 50/mês
- Total: ~R$ 360/mês

Decisão: Adicionamos R$ 5,00 por venda no Unit Economics como "taxa de existência" para cobrir custos fixos distribuídos.

### 2. PRICING & MODELO DE NEGÓCIO: O PIVOT B2B2C

Saímos de "Varejo Digital" (vender para mães no Instagram) para "Atacado Estratégico" (vender para quem precisa entregar o trabalho).

#### 2.1 A Nova Política de Preços (Ancoragem Psicológica)

Estratégia Original:

- Venda direta: R$ 200,00
- Foco: Volume B2C via Ads

Nova Estratégia (Valor Percebido):

| Segmento       |  Preço | Psicologia              | Margem Líquida |
| -------------- | -----: | ----------------------- | -------------: |
| B2C (Varejo)   | R$ 297 | Preço premium acessível |            47% |
| B2C (PIX)      | R$ 279 | Incentivo conversão     |            50% |
| B2B (Parceiro) | R$ 135 | Lote 10 vouchers (PIX)  |              - |
| B2B (Parceiro) | R$ 149 | Lote 10 vouchers (3x)   |              - |

**Atualização (Golden Record — Licenciamento B2B por “ativação de novo assento”):** no B2B, o parceiro compra **créditos** (lotes). Cada crédito representa **potencialmente 1 novo Livro (Child)** com PCE quitado e quota de 2 GiB.

- **Reserva vs. Consumo:** o sistema _reserva_ 1 crédito quando o parceiro cria uma entrega (para viabilizar o fluxo operacional), mas só _consome_ de fato quando, no resgate, a mãe cria um **novo Child**.
- **Estorno:** se, no resgate, a mãe vincular a entrega a um **Child existente** (com PCE já pago), o sistema estorna o crédito (saldo volta) e registra auditoria no extrato.

Mecânica de Ancoragem:

- Fotógrafo paga R$ 135 (atacado via PIX/transferência)
- Cliente vê produto de R$ 297 (varejo)
- Fotógrafo diz: "Estou te dando um bônus de R$ 300"
- Cliente percebe valor extremo
- Todos ganham

#### 2.2 Estratégia de Canais: O "Cavalo de Troia"

Problema da Estratégia Original:

- Dependência de Ads (Meta/Google)
- CAC volátil e imprevisível

Nova Estratégia (Canal Indireto):

- Cliente Ideal: Fotógrafo de Parto (não a mãe)

Dor Resolvida:

- WeTransfer expira em 7 dias → gera reenvios
- Pen Drive some/quebra
- Entrega digital simples parece "pouco"

Produto B2B: Baby Book como Plataforma de Entrega Oficial

Vantagens:

- CAC Zero: Fotógrafo compra antecipado
- Viralidade Orgânica: Mãe que recebe promove para avós/amigas
- Previsibilidade: Receita pré-paga

### 3. ADAPTAÇÃO DO PRODUTO: UX, MÍDIA E "UNBOXING"

#### 3.1 Qualidade de Mídia e Impressão

Problema Original:

- Fotos padrão web inviabilizavam Print-on-Demand futuro

Nova Especificação (Ready for Print):

| Origem               |    Resolução | Compressão | Uso                             |
| -------------------- | -----------: | ---------: | ------------------------------- |
| Fotógrafos (B2B)     | 2560px (QHD) |   JPEG 85% | Print A4, Álbuns                |
| Upload Celular (B2C) |       2048px |   JPEG 80% | Tela Retina, 10x15cm            |
| Vídeo (Todos)        |   720p H.265 |       HEVC | Qualidade 1080p, metade do peso |

Vantagem: Garante 300 DPI para impressão profissional sem explodir custos de storage.

#### 3.2 Momentos Premium (Solução das 50 Fotos)

Conflito Original:

- Limite de 3 fotos/momento (curadoria)
- Fotógrafos entregam 50-100 fotos

Solução: Tipos de Momentos Dinâmicos

- Momento Padrão (Usuário):
  - Até 3 fotos
  - Criado manualmente
  - Curadoria diária
- Momento Galeria Profissional (Parceiro):
  - Grid/Mosaico: 20-100 fotos
  - Não criável pelo usuário
  - Apenas via Voucher
  - Aparece como evento especial na timeline

#### 3.3 A Experiência de "Unboxing" Digital

Fluxo Original:

- Baixa app → Cria conta → Tela vazia → Sobe fotos

Problema: Barreira do "primeiro upload"

Novo Fluxo (Warm Start):

- Fotógrafo sobe arquivos ANTES da mãe saber
- Mãe recebe Cartão Digital com código
- Digita código na Landing Page
- Sistema cria conta E transfere posse dos arquivos
- Primeiro login já mostra fotos do parto organizadas

Resultado: Elimina barreira + encantamento imediato.

### 4. RESUMO EXECUTIVO FINANCEIRO

#### 4.1 Unit Economics Consolidado (A Matemática da Sobrevivência)

Esta análise incorpora um componente crítico ignorado por 99% dos desenvolvedores: o PCE (Provisão de Custo de Existência) de R$ 25,00 por venda. Este valor cria um "Fundo de Perpetuidade" que sustenta a promessa de acesso perpétuo.

**Regra de Auditoria (Pior Cenário Brasil):** todos os cálculos abaixo assumem **imposto de 15,5%** e **taxas de gateway altas**.

| Canal / Produto      | Condição     | Preço Venda | Imposto (15,5%) | Gateway/Juros  | CAC      | PCE (Fundo) | Infra/Ops | Lucro Líquido  | Meta R$ 60?  |
| :------------------- | :----------- | :---------- | :-------------- | :------------- | :------- | :---------- | :-------- | :------------- | :----------- |
| **B2C Cartão**       | 3x Sem Juros | R$ 297,00   | R$ 46,04        | R$ 35,64 (12%) | R$ 80,00 | R$ 25,00    | R$ 24,50  | **R$ 85,82**   | ✅ SIM       |
| **B2C Pix**          | A Vista      | R$ 279,00   | R$ 43,25        | R$ 1,50 (Fixo) | R$ 80,00 | R$ 25,00    | R$ 24,50  | **R$ 104,75**  | ✅ SIM       |
| **B2B (Novo Livro)** | Pix/Transfer | R$ 135,00   | R$ 20,93        | R$ 1,50 (Fixo) | R$ 5,00  | R$ 25,00    | R$ 18,50  | **R$ 64,07**   | ✅ SIM       |
| **B2B (Novo Livro)** | Cartão 3x    | R$ 149,00   | R$ 23,10        | R$ 17,88 (12%) | R$ 5,00  | R$ 25,00    | R$ 18,50  | **R$ 59,52\*** | ⚠️ ACEITÁVEL |

_Nota sobre B2B Cartão: O lucro de ~R$ 59,52 é aceitável pelo volume e zero CAC recorrente. Ajustar preço para R$ 149,00 no cartão._

**PS (Golden Record — Unit Economics B2B por “Novos Filhos”, não por “Novos Ensaios”):**

- O “evento econômico” relevante do B2B, do ponto de vista de custo marginal e provisionamento, é a criação de um **novo Child** (novo Livro), pois isso dispara **nova quota de 2 GiB** e **novo PCE**.
- Resgates que apenas vinculam a um Child existente (PCE já pago) têm custo marginal ~0 dentro da quota e, por regra, devem gerar **estorno de crédito** para o parceiro.

#### 4.2 O Segredo do PCE: A Máquina de Perpetuidade

O PCE não é "custo perdido" — é engenharia financeira aplicada. Veja o que acontece em escala:

Cenário: 10.000 Vendas B2B

| Indicador                 |         Valor | Análise do "Advogado do Diabo"              |
| ------------------------- | ------------: | ------------------------------------------- |
| Faturamento Bruto         |  R$ 1.200.000 | Entrada bruta de caixa (O primeiro milhão!) |
| Lucro Líquido Livre       |    R$ 750.000 | Distribuível para sócios ou reinvestimento  |
| Fundo PCE Acumulado       |    R$ 250.000 | 💰 O cofre intocável da perpetuidade        |
| Custo Manutenção/Mês      |      R$ 6.307 | Custo real para 10k usuários ativos         |
| Runway Estático           |      40 meses | Vida útil SEM novas vendas                  |
| Rendimento CDI (0,8%/mês) | ~R$ 2.000/mês | Renda passiva do fundo                      |
| Cobertura Passiva         |           32% | Juros cobrem ⅓ do custo de servidor         |

A Mágica da Perpetuidade:

- O Fundo PCE de R$ 250k aplicado a 100% do CDI gera ~R$ 2.000/mês
- Isso cobre automaticamente 32% do custo de infraestrutura sem tocar no principal
- À medida que o fundo cresce (mais vendas) e o custo unitário cai (economia de escala), nos aproximamos do ponto de equilíbrio perpétuo
- Santo Graal: Quando os juros cobrem 100% da manutenção, o negócio vira uma máquina auto-sustentável
- Estratégia Ano 1: Foco absoluto em B2B (62,5% margem, CAC zero, fluxo previsível).

#### 4.3 Projeção de Custos de Manutenção (Run Rate)

Projeção considerando Dólar a R$ 6,00 (cenário pessimista/realista) para blindar contra surpresas cambiais em serviços dolarizados (Cloudflare, Fly.io, Modal).

| Categoria | Item          | 1 Usuário (Dev) | 100 Usuários | 1.000 Usuários | 10.000 Usuários |
| --------- | ------------- | --------------: | -----------: | -------------: | --------------: |
| Fixos     | Domínios/DNS  |            R$ 7 |         R$ 7 |           R$ 7 |            R$ 7 |
| Fixos     | E-mail/SaaS   |           R$ 45 |        R$ 80 |         R$ 150 |          R$ 500 |
| Fixos     | Contador      |          R$ 300 |       R$ 300 |         R$ 300 |          R$ 500 |
| Infra     | Fly.io + Neon |            R$ 0 |        R$ 35 |         R$ 180 |        R$ 1.000 |
| Storage   | Cloudflare R2 |            R$ 0 |        R$ 40 |         R$ 400 |        R$ 4.000 |
| Requests  | R2 Requests   |            R$ 0 |         R$ 5 |          R$ 50 |          R$ 300 |
| TOTAL     | Custo Mensal  |          R$ 352 |       R$ 467 |       R$ 1.087 |        R$ 6.307 |
|           | Custo/Usuário |       R$ 352,00 |      R$ 4,67 |        R$ 1,09 |         R$ 0,63 |

Estimativa de Storage: 10GB totais por usuário (vídeo H.265 + fotos QHD comprimidas)
10.000 usuários = 100TB → Custo de storage (R2) depende do pricing vigente. O SLO e o PCE existem para absorver variações; revalidar semestralmente.
Insights Críticos:

- Economia de Escala: Custo por usuário cai 99,8% (de R$ 352 para R$ 0,63)
- Break-even Operacional: ~125 vendas B2B cobrem custos fixos + infra de 100 usuários
- Zona de Conforto: A partir de 1.000 usuários, custo unitário estabiliza abaixo de R$ 1,10/mês

## PARTE 2: ARQUITETURA TÉCNICA & IMPLEMENTAÇÃO

### 5. NOVA ARQUITETURA DE INFRAESTRUTURA

Filosofia: "Browser is King" com rede de segurança.

#### 5.1 Stack Tecnológico Final

Frontend (Interface Única):

- Tecnologia: React (Vite) + PWA
- Hospedagem: Cloudflare Pages (deploy atômico, custo zero para banda)
- App-Like: manifest.json + Service Workers (Workbox)
- Resultado: Abre instantaneamente, mesmo offline

Processamento de Mídia (WASM - Motor Oculto):

- Primário (90%): FFmpeg.wasm (multithreaded)
- Como funciona: Roda binário C++ do FFmpeg dentro do navegador
- Custo: R$ 0,00
- Fallback (10%): Modal/Fly.io Worker para dispositivos fracos
- Custo Fallback: ~R$ 0,20

Backend (API Minimalista):

- Tecnologia: Python FastAPI no Fly.io
- Função: Apenas gestão de estado e regras de negócio
- Blindagem: Zero tráfego de mídia (API nunca vê o arquivo)
- Capacidade: Micro-instância (256MB RAM) suporta milhares de usuários

Banco de Dados:

- Tecnologia: Neon (PostgreSQL Serverless)
- Crítico: PgBouncer (Connection Pooling) obrigatório
- Motivo: PWA abre múltiplas conexões simultâneas

Armazenamento (R2-only):

- Cloudflare R2: originais e derivados (thumb/preview/720p) no mesmo storage.
- Mitigação de custo: quota rígida (2 GiB), compressão agressiva e purge de derivados recriáveis.

#### 5.2 Algoritmo de Decisão (Smart Upload)

Checagem de Capacidade (Frontend):

```js
// Antes de iniciar upload
const canProcessLocally =
  "SharedArrayBuffer" in window &&
  navigator.deviceMemory >= 4 &&
  fileSize < 500_000_000; // 500MB

if (canProcessLocally) {
  // Cenário A: Compressão local → Upload 15MB
  // Custo: R$ 0,00
} else {
  // Cenário B: Upload RAW → Servidor processa
  // Custo: ~R$ 0,20
}
```

#### 5.3 Fluxo de Upload Resiliente

Protocolo: Uppy + Tus (Resumable Upload)

- Arquivo quebrado em chunks de 5MB
- Se internet cair no chunk 2, retoma no chunk 3
- Não começa do zero

Compressão WASM (Passo a Passo):

- Usuário seleciona vídeo 4K (300MB)
- Navegador carrega em memória (Blob)
- FFmpeg.wasm processa em Web Worker (não trava UI)
- Output: H.265 720p (~15MB)
- Uppy envia para R2 via Presigned URL

Configuração de Segurança (Headers Cloudflare Pages):

- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp

### 6. ESTRUTURA DE PASTAS E GOVERNANÇA

Bucket Único: bb-production-v1

| Caminho                         | Propósito                   |       Lifecycle | Segurança       |
| ------------------------------- | --------------------------- | --------------: | --------------- |
| /tmp/                           | Chunks e processamento      |      Delete 24h | Write-Only      |
| /partners/{p_uuid}/{d_uuid}/    | Estoque pré-resgate         | Delete 365 dias | Partner-Only    |
| /u/{user_uuid}/m/{moment_uuid}/ | Cofre final do usuário      |     Keep Latest | User-Only (JWT) |
| /sys/assets/                    | Logos, ícones, placeholders |           Nunca | Public Cache    |

### 7. ENGENHARIA DE DADOS (SCHEMA POSTGRES)

```sql
-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PARCEIROS (Força de Vendas)
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    voucher_balance INT DEFAULT 0 CHECK (voucher_balance >= 0),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENTREGAS (Pacotes Fechados)
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id),
    client_name VARCHAR(255),
    assets_payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING'
      CHECK (status IN ('PENDING', 'CLAIMED', 'EXPIRED')),
    credit_status VARCHAR(20) DEFAULT 'RESERVED'
      CHECK (credit_status IN ('RESERVED', 'CONSUMED', 'REFUNDED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VOUCHERS (Chave do Cofre)
CREATE TABLE vouchers (
    code VARCHAR(20) PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES partners(id),
    delivery_id UUID REFERENCES deliveries(id),
    redeemed_by_user_id UUID REFERENCES users(id),
    redeemed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    CONSTRAINT unique_active_code UNIQUE (code)
);

-- 5. EXTRATO DO PARCEIRO (Auditoria de Reservas/Estornos)
CREATE TABLE partners_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  amount INTEGER, -- Ex: -1 (Reserva), +1 (Estorno), +10 (Compra)
  type VARCHAR(20), -- 'RESERVATION', 'REFUND', 'PURCHASE'
  description VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ASSETS (Controle de Mídia)
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    storage_path_original VARCHAR(500),
    storage_path_optimized VARCHAR(500),
    storage_path_thumb VARCHAR(500),
    processing_status VARCHAR(20) DEFAULT 'READY'
      CHECK (processing_status IN ('READY', 'PROCESSING', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXING (Performance)
CREATE INDEX idx_deliveries_partner ON deliveries(partner_id);
CREATE INDEX idx_vouchers_lookup ON vouchers(code) WHERE status = 'ACTIVE';
CREATE INDEX idx_assets_processing ON media_assets(processing_status)
  WHERE processing_status = 'PROCESSING';
```

#### 7.1 Transação de "Unboxing" (Lógica Crítica)

Endpoint: POST /redeem

# Pseudocódigo da transação atômica

```
BEGIN TRANSACTION

  # 1. Valida voucher (lock)
  voucher = SELECT * FROM vouchers WHERE code = {code} AND status = 'ACTIVE' FOR UPDATE
  delivery = SELECT * FROM deliveries WHERE id = voucher.delivery_id FOR UPDATE

  # 2. Identidade (login) e Ação da mãe
  # input: action = NEW_CHILD(name) ou EXISTING_CHILD(child_id)
  user = get_or_create_user(email)

  IF action == EXISTING_CHILD:
    assert user is guardian of child_id
    assert children.pce_status == 'PAID'
    UPDATE deliveries SET credit_status = 'REFUNDED'
    UPDATE partners SET voucher_balance = voucher_balance + 1
    INSERT partners_ledger (+1, 'REFUND', 'Estorno: vínculo em livro existente')
  ELSE IF action == NEW_CHILD:
    child = INSERT children(..., pce_status='PAID', storage_quota=2GiB)
    UPDATE deliveries SET credit_status = 'CONSUMED'
    # saldo não muda: já foi debitado na reserva

  # 3. Copia arquivos (server-side copy no storage)
  assets = delivery.assets_payload
  FOR EACH asset IN assets:
    storage_copy_object(source = ..., dest = ...)

  # 4. Cria momento associado ao Child escolhido
  INSERT INTO moments (child_id, ...)

  # 5. Marca como resgatado
  UPDATE vouchers SET status='REDEEMED', redeemed_by_user_id={user.id}
  UPDATE deliveries SET status='CLAIMED'

COMMIT TRANSACTION
```

### 8. SEGURANÇA NA BORDA (CLOUDFLARE WORKER)

Função: Porteiro Digital que intercepta todas as requisições de mídia.

Lógica do Worker:

```js
// cdn.babybook.com/u/{user_id}/video.mp4

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) return new Response("Unauthorized", { status: 401 });

  // Decodifica JWT (sem bater no banco)
  const decoded = await verifyJWT(token, JWT_SECRET);

  // Extrai user_id da URL
  const urlUserId = url.pathname.split("/")[2];

  // Compara
  if (decoded.sub !== urlUserId) {
    return new Response("Forbidden", { status: 403 });
  }

  // Storage único (R2-only)
  const storage = R2;

  // Busca e entrega
  const object = await storage.get(url.pathname);

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata.contentType,
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
```

### 9. UX DE UPLOAD (GUIA DE GUERRA)

#### 9.1 Prevenção de "Morte Súbita"

Wake Lock API:

```js
let wakeLock = null;

async function startUpload() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    // Upload continua...
  } catch (err) {
    console.error("Wake Lock failed:", err);
  }
}
```

Confirmação de Saída:

```js
window.addEventListener("beforeunload", (e) => {
  if (uploadInProgress) {
    e.preventDefault();
    e.returnValue = "O upload será cancelado. Tem certeza?";
  }
});
```

#### 9.2 Feedback Visual (Barra Unificada)

Não mostre:

- "100% comprimido" → "0% enviado" (frustra)

Mostre:

- Barra única: 0-30% = Compressão | 30-100% = Upload
- "Faltam cerca de 2 minutos"
- Estado Fallback: "Recebemos seu vídeo! Preparando nos servidores..."

### 10. CHECKLIST DE IMPLEMENTAÇÃO (8 SEMANAS)

#### Fase 1: Fundação PWA (Semanas 1-2)

- [ ] Setup Cloudflare Pages (deploy automático via Git)
- [ ] Worker de Segurança (validação JWT na borda)
- [ ] Service Worker básico (cache de assets estáticos)
- [ ] Migrações SQL no Neon (tabelas partners, deliveries, vouchers)
- [ ] Teste de bloqueio: acessar arquivo sem token → 403

#### Fase 2: Motor de Mídia (Semanas 3-5)

- [ ] Implementar FFmpeg.wasm em rota de teste
- [ ] Validar compressão: 50MB → <5MB no navegador
- [ ] Integrar Uppy + Tus (resumable upload)
- [ ] Testar resiliência: desligar Wi-Fi durante upload
- [ ] Portal do Fotógrafo: UI drag & drop para upload em lote
- [ ] Configurar Fallback: Modal/Fly.io Worker para dispositivos fracos

#### Fase 3: Lógica B2B & Unboxing (Semanas 6-8)

- [ ] API de Resgate: endpoint transacional /redeem
- [ ] Componente React: Grid de Galeria para momentos premium
- [ ] Integração PIX: EFI/Asaas para QR Code de pagamento
- [ ] Geração de PDF: Voucher imprimível para fotógrafos
- [ ] Teste end-to-end: Fotógrafo sobe → Mãe resgata → Vê fotos

### 11. CONSIDERAÇÕES FINAIS E ALERTAS

⚠️ Pontos Críticos de Atenção

- FFmpeg.wasm:
  - Exige recursos significativos do navegador
  - Teste SEMPRE em dispositivos reais (Android médio + iPhone)
  - Se travar, a UX morre → Fallback salva
- Cache é Vida:
  - Cada byte servido do cache = byte que você não paga
  - Configure Cache-Control agressivamente
  - Use Cloudflare Page Rules para assets estáticos
- Fator R (Impostos):
  - Não é opcional, é matemático
  - Pró-labore mínimo: 28% do faturamento
  - Contador DEVE validar mensalmente
- Segurança:
  - Nunca exponha JWT_SECRET no frontend
  - Presigned URLs devem expirar em 15 minutos
  - Rate limiting no Worker (previne DDoS)
- PCE (Provisão de Custo de Existência):
  - Não toque neste dinheiro para "acelerar crescimento"
  - É um seguro de vida do negócio, não uma conta corrente
  - Aplique em CDB/Tesouro Direto com liquidez diária
  - Objetivo: Rendimento ≥ 100% CDI

🎯 Métricas de Sucesso (KPIs)

Técnicas:

- Taxa de sucesso de upload: >95%
- Tempo médio de compressão: <2min para vídeo 100MB
- Taxa de uso de Fallback: <10%
- Uptime da API: >99.5%

Financeiras:

- Margem líquida B2B: >60%
- CAC B2B: <R$ 50 (webinar + email)
- LTV (Lifetime Value): >R$ 500 (considerando upsell futuro)
- Break-even Operacional: 50 vendas B2B
- Runway Mínimo (Fundo PCE): 12 meses de cobertura

Produto:

- NPS (Net Promoter Score): >50
- Taxa de ativação de voucher: >80% em 7 dias
- Retenção 30 dias: >70%
- Taxa de referência orgânica: >15% (mães indicando para amigas)

📊 Marcos Financeiros (Milestones)

| Marco            | Vendas B2B | Fundo PCE Acumulado | Runway Estático | Status                |
| ---------------- | ---------: | ------------------: | --------------: | --------------------- |
| MVP (Validação)  |         50 |            R$ 1.250 |       0,3 meses | 🚀 Prova de conceito  |
| Break-even       |        125 |            R$ 3.125 |       0,7 meses | ✅ Custos cobertos    |
| Sustentabilidade |        500 |           R$ 12.500 |       2,7 meses | 💪 Resiliência básica |
| Zona de Conforto |      2.000 |           R$ 50.000 |        11 meses | 🎯 Runway saudável    |
| Perpetuidade     |     10.000 |          R$ 250.000 |        40 meses | 👑 Auto-sustentável   |

Meta Ano 1: Atingir zona de conforto (2.000 vendas B2B = 20.000 usuários finais ativos)

### 🛡️ Filosofia do Bootstrapping Raiz

Este projeto foi desenhado sob os princípios de Profit First e Resiliência Financeira:

- Não existe "crescer agora, lucrar depois" - Cada venda deixa dinheiro no caixa HOJE
- Eficiência Obsessiva - Cada linha de código tem ROI imediato ou economia estrutural
- Camelo, não Unicórnio - O objetivo é sobreviver a longas secas, não queimar milhões em crescimento artificial
- PCE como Pilar - A provisão de R$ 25/venda transforma venda única em perpetuidade

O Segredo da Longevidade: Enquanto concorrentes queimam venture capital perseguindo métricas de vaidade, nós construímos silenciosamente uma máquina que se paga sozinha através de rendimentos financeiros do fundo acumulado.

## GLOSSÁRIO TÉCNICO

- PWA: Progressive Web App - aplicação web que funciona como app nativo
- WASM: WebAssembly - binário que roda no navegador com performance quase nativa
- H.265/HEVC: Codec de vídeo moderno - mesma qualidade H.264 com metade do tamanho
- Egress: Transferência de dados de saída (cobrada por cloud providers)
- Presigned URL: URL temporária assinada que permite acesso seguro sem autenticação
- Fator R: Cálculo tributário do Simples Nacional baseado em folha de pagamento
- CAC: Custo de Aquisição de Cliente
- LTV: Lifetime Value - valor total que um cliente gera ao longo do relacionamento
- PCE: Provisão de Custo de Existência - fundo de perpetuidade de R$ 25/venda
- CDI: Certificado de Depósito Interbancário - taxa de referência de investimentos conservadores
- Runway: Período que a empresa sobrevive sem novas receitas (calculado via Fundo PCE ÷ Custo Mensal)
