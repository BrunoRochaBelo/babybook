DOSSIÊ de Atualização e Execução — Baby Book

Foco: Engenharia Financeira Avançada, Estratégia B2B2C & Arquitetura de Produto
Status: Documento Mandatório. Substitui integralmente as premissas dos arquivos "Visão & Viabilidade" e "Plano de Desenvolvimento".

---

## 📊 STATUS DE IMPLEMENTAÇÃO (Atualizado: Janeiro 2025)

### Progresso Geral: ✅ 95% Concluído

| Área                  | Status           | Arquivos                                |
| --------------------- | ---------------- | --------------------------------------- |
| Storage Paths         | ✅ **Concluído** | `storage/paths.py`                      |
| Partner Service       | ✅ **Concluído** | `storage/partner_service.py`            |
| Hybrid Storage        | ✅ **Concluído** | `storage/hybrid_service.py`             |
| Edge Worker           | ✅ **Concluído** | `apps/edge/` (24 testes)                |
| Partner Portal API    | ✅ **Concluído** | `routes/partner_portal.py`              |
| Voucher Routes        | ✅ **Concluído** | `routes/vouchers.py`                    |
| Partner Portal UI     | ✅ **Concluído** | `apps/web/src/features/partner-portal/` |
| Voucher Redemption UI | ✅ **Concluído** | `VoucherRedemptionPage.tsx`             |
| DB Migrations         | ✅ **Concluído** | 3 migrations Alembic                    |
| E2E Tests             | ⚠️ **85%**       | Faltam voucher/upload tests             |

### Implementações Extras

- ✅ **"Porteiro Digital"** - Edge Worker protegendo bucket B2
- ✅ **Server-side copy** - Voucher redemption sem download/upload
- ✅ **Estratégia de pastas** - `tmp/`, `partners/`, `u/`, `sys/`

---

1. ENGENHARIA FINANCEIRA: O CHOQUE DE REALIDADE (Blindagem do Caixa)
   O modelo original era tecnicamente viável em uma planilha de Excel idealizada (cenário de Vale do Silício), mas ignorava a "fricção brasileira" — taxas reais de antecipação, complexidade tributária do Simples Nacional e custos ocultos de operação. Fizemos um "Stress Test" rigoroso nas contas e blindamos o modelo contra a insolvência.

1.1 Gateway de Pagamento e a Cultura do Parcelamento
Premissa anterior: Custo estimado de R$ 7,37 por transação.
Realidade: A taxa de antecipação por parcelamento (quando o vendedor quer receber a liquidez) varia de 5% a 15% dependendo do player. Ajustamos a previsão de custo para R$ 16,33 (média de 5,5%) no cenário B2C via cartão, assumindo parcelamento médio de 3x–4x.
Contra-medida tática: Estratégia de precificação dupla e incentivo ao PIX.

- Preço cartão (cheio): R$ 297,00
- Preço PIX (desconto): R$ 279,00 (desconto deliberado para forçar liquidez imediata e reduzir custo efetivo)

  1.2 Impostos e Regime Tributário (O Perigo do Anexo V)
  Risco: Vender licenciamento/software no Simples Nacional pode enquadrar a empresa no Anexo V (alíquota inicial alta). Mantemos projeção de ~10% para segurança, mas adicionamos a Regra de Ouro Operacional (Fator R): folha de pagamento (pró-labore + INSS) >= 28% do faturamento para ter direito ao Anexo III.

  1.3 Infraestrutura D0 (Setup Inicial e Processamento)
  Antes: transcodificação server-side (Modal) e custo estimado ~R$ 0,44/conta.
  Agora: mover processamento para a ponta (client-side) sempre que possível — ffmpeg.wasm para web; ffmpeg-kit / react-native-compressor para mobile. Novo custo aproximado por conta: ~R$ 0,20 (APIs leves, thumbnails de fallback).

  1.4 Custos Invisíveis e Operacionais
  Adicionamos linha fixa de R$ 5,00 por venda para cobrir contabilização, contas de ferramentas, store fees e manutenção mínima (se vendermos 100 unidades/mês, isso cobre contas fixas mensais básicas).

2. PRICING & MODELO DE NEGÓCIO: O PIVOT B2B2C
   Anteriormente vendíamos direto a R$ 200. Após o stress-test financeiro adotamos precificação dual (R$ 297 cartão / R$ 279 PIX) e pivotamos para um modelo B2B2C onde o fotógrafo compra licenças no atacado e entrega o produto à mãe.

2.1 Política de Preços

- Preço varejo (B2C): R$ 297,00 (ancoragem psicológica)
- Preço parceiro (B2B): R$ 120,00 (base para pacotes de 10 unidades; margem para negociar até R$ 100/licença para volume)

  2.2 Canal "Cavalo de Troia"
  Foco principal: fotógrafos parceiros que compram vouchers em lote (ex: 10 vouchers por R$ 1.200). Isso reduz o CAC e cria viralidade orgânica quando a mãe recebe o código.

3. ADAPTAÇÃO DO PRODUTO: UX, MÍDIA E "UNBOXING"
   Resumos práticos:

- Fotos profissionais: padrão 2560 px (JPEG 85%) para garantir qualidade de impressão.
- Upload mobile: 2048 px (JPEG 80%).
- Vídeo: 720p H.265 (HEVC) como padrão.
- Momentos profissionais: "Galeria Profissional" via voucher — suporta 20–100 fotos.
- Onboarding "Unboxing": fotógrafo preenche entrega, gera voucher; quando a mãe resgata o código, a conta é criada e os arquivos são transferidos atomically para o cofre do usuário.

4. ARMAZENAMENTO E INFRAESTRUTURA (O COFRE HÍBRIDO) — ✅ IMPLEMENTADO

Estratégia híbrida: Hot (Cloudflare R2) para thumbnails/previews; Cold (Backblaze B2) para originais high-res e vídeos.

### Estrutura de Pastas (Implementado em `storage/paths.py`)

| Prefixo                                     | Descrição           | Lifecycle  | Acesso             |
| ------------------------------------------- | ------------------- | ---------- | ------------------ |
| `tmp/{uuid}/`                               | Uploads temporários | 1 dia      | Bloqueado          |
| `partners/{partner}/deliveries/{delivery}/` | Assets parceiros    | 365 dias   | JWT + photographer |
| `u/{user}/m/{moment}/`                      | Momentos usuário    | Permanente | JWT + owner        |
| `sys/`                                      | Assets sistema      | Permanente | Público            |

### Edge Worker "Porteiro Digital" (Implementado em `apps/edge/`)

O bucket B2 é 100% privado. Todo acesso passa pelo Cloudflare Worker:

```
[Cliente] → [CF Edge Worker] → [B2 Bucket Privado]
                   ↓
           JWT + ACL + Signed Request
```

**Benefícios:**

- Custo zero de egress (Bandwidth Alliance)
- Cache na edge (vídeo 10x = 9 do cache)
- Segurança granular por path

5. ENGENHARIA DE DADOS (SQL CRÍTICO) — ✅ IMPLEMENTADO
   Inclui tabelas de `partners`, `deliveries` e `vouchers` para suportar o modelo B2B2C e o fluxo de unboxing.

SQL SUGERIDO:
-- Extensão para gerar UUIDs randômicos (Segurança contra enumeração)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE partners (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
voucher_balance INT DEFAULT 0 CHECK (voucher_balance >= 0),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE deliveries (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
partner_id UUID NOT NULL REFERENCES partners(id),
client_name VARCHAR(255),
assets_payload JSONB NOT NULL,
status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CLAIMED', 'EXPIRED')),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

6. CHECKLIST DE IMPLEMENTAÇÃO (Atualizado Janeiro 2025)

### Fase 1: Fundação — ✅ CONCLUÍDO

- ✅ PWA + Service Worker
- ✅ Worker de Segurança ("Porteiro Digital" - `apps/edge/`)
- ✅ Migrations Neon (3 migrations aplicadas)
- ✅ Estrutura de pastas storage (`tmp/`, `partners/`, `u/`, `sys/`)

### Fase 2: Upload & Processamento — ✅ CONCLUÍDO

- ✅ ffmpeg.wasm integrado (Web Worker)
- ✅ Upload resumable/multipart
- ✅ Portal do Fotógrafo (UI completa)
- ✅ Partner Storage Service (server-side copy)

### Fase 3: Transacional & UX — ✅ CONCLUÍDO

- ✅ Endpoint `/vouchers/redeem` transacional
- ✅ VoucherRedemptionPage UI
- ✅ Transferência atômica de assets
- ⚠️ Integração PIX (pendente finalização)

### Fase 4: Observabilidade — ⚠️ PENDENTE

- [ ] Dashboards de monitoramento
- [ ] Runbooks de recuperação
- [ ] Feature flags para rollout

---

7. ARQUIVOS IMPLEMENTADOS NESTA ATUALIZAÇÃO

### Storage Layer (`apps/api/babybook_api/storage/`)

```
paths.py           - Geração de paths com prefixos
partner_service.py - Operações de upload/copy para parceiros
hybrid_service.py  - Coordenação R2 (hot) + B2 (cold)
__init__.py        - Exports atualizados
```

### Edge Worker (`apps/edge/`)

```
src/lib/auth.ts    - Verificação JWT + ACL
src/lib/storage.ts - Assinatura de requests S3 (aws4fetch)
src/routes/files.ts- Rotas protegidas (/v1/file/*)
src/index.ts       - Entry point Hono
wrangler.toml      - Configuração Cloudflare
README.md          - Documentação completa
```

### Routes (`apps/api/babybook_api/routes/`)

```
partner_portal.py  - Uploads de parceiros integrados
vouchers.py        - Redemption com transferência de arquivos
```

---

Nota final: Priorizar fundação (estrutura de dados e pastas). Testar upload em dispositivos baratos; implementar fallback server-side se ffmpeg.wasm travar.
