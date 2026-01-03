# @babybook/edge - Cloudflare Edge Worker

**O "Porteiro Digital"** - Protege arquivos do bucket **Cloudflare R2 (S3-compatible)** e serve via CDN.

## 🎯 O Que Este Worker Faz

1. **Intercepta** requisições de arquivos (ex: `https://cdn.babybook.com.br/v1/file/u/user-123/video.mp4`)
2. **Verifica o Crachá (JWT)** - Token válido?
3. **Verifica a Sala (ACL)** - O ID do usuário no token bate com o ID na URL?
4. **Busca no R2** - Assina a requisição e busca do bucket privado
5. **Entrega com Cache** - Devolve o arquivo e cacheia na borda por horas

## 🔒 Regras de Acesso por Pasta

| Pasta                       | Acesso       | Regra                                            |
| --------------------------- | ------------ | ------------------------------------------------ |
| `u/{user_id}/...`           | 🔐 Privado   | JWT obrigatório + `sub` deve bater com `user_id` |
| `partners/{partner_id}/...` | 🔐 Privado   | JWT obrigatório + role `photographer` ou `admin` |
| `sys/...`                   | 🌍 Público   | Logos, placeholders, defaults                    |
| `tmp/...`                   | 🚫 Bloqueado | Arquivos temporários internos                    |

## 💰 Por Que Isso Economiza Dinheiro

1. **R2 Privado** - Ninguém baixa terabytes de vídeo sem token
2. **Sem egress fees** - R2 não cobra egress, e o cache na borda reduz ainda mais a origem
3. **Cache na Borda** - Vídeo assistido 10x = 9 vindas do cache (custo zero)

## 🚀 Rotas

### Arquivos Protegidos

```
GET /v1/file/{path}
HEAD /v1/file/{path}
```

Exemplos:

```
GET /v1/file/u/user-uuid/m/moment-uuid/photo.jpg
GET /v1/file/partners/partner-uuid/delivery-uuid/video.mp4
GET /v1/file/sys/defaults/placeholder.webp
```

### Tokens de Compartilhamento

```
GET /s/{token}
```

### Convites do Guestbook

```
GET /guestbook/{token}
```

### Health Check

```
GET /health
```

## 🛠️ Desenvolvimento

### Pré-requisitos

```bash
pnpm install
```

### Configurar Variáveis

```bash
cp .dev.vars.example .dev.vars
# Edite .dev.vars com suas credenciais
```

### Rodar Localmente

```bash
pnpm dev
```

### Testes

```bash
pnpm test
```

## 📦 Deploy

### Configurar Secrets (Uma vez)

```bash
# Credenciais do R2
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_ACCOUNT_ID

# JWT Secret (mesmo do backend Python)
npx wrangler secret put JWT_SECRET
```

### Deploy para Production

```bash
npx wrangler deploy
```

### Deploy para Staging

```bash
npx wrangler deploy --env staging
```

## 🏗️ Arquitetura

```
┌─────────────┐     ┌───────────────────┐     ┌─────────────┐
│   Cliente   │────▶│  Edge Worker (CF) │────▶│  R2 Bucket  │
│  (Browser)  │◀────│    "Porteiro"     │◀────│  (Privado)  │
└─────────────┘     └───────────────────┘     └─────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  CF Cache     │
                    │  (200+ POPs)  │
                    └───────────────┘
```

## 📁 Estrutura

```
apps/edge/
├── src/
│   ├── index.ts           # Entry point (Hono app)
│   ├── routes/
│   │   └── files.ts       # File serving routes
│   └── lib/
│       ├── auth.ts        # JWT verification, ACL
│       └── storage.ts     # R2 (S3-compatible) signed requests
├── tests/
│   ├── auth.test.ts
│   └── storage.test.ts
├── wrangler.toml          # Cloudflare config
└── .dev.vars.example      # Local dev secrets template
```

## 🔑 Variáveis de Ambiente

| Variável               | Descrição                                          | Exemplo                            |
| ---------------------- | -------------------------------------------------- | ---------------------------------- |
| `R2_ACCESS_KEY_ID`     | Access key id do R2                                | `0a1b2c...`                        |
| `R2_SECRET_ACCESS_KEY` | Secret access key do R2                            | `xYz...`                           |
| `R2_BUCKET_NAME`       | Nome do bucket                                     | `bb-production-v1`                 |
| `R2_ACCOUNT_ID`        | Account ID da Cloudflare                           | `1234567890abcdef...`              |
| `R2_ENDPOINT`          | (Opcional) Host do endpoint R2                     | `1234....r2.cloudflarestorage.com` |
| `R2_REGION`            | (Opcional) Região para assinatura (padrão: `auto`) | `auto`                             |
| `JWT_SECRET`           | Segredo JWT (mesmo do backend)                     | `super-secret-key`                 |
| `API_BASE_URL`         | URL da API (para shares)                           | `https://api.babybook.dev`         |

## 📝 Notas

- O Worker usa `aws4fetch` para assinar requisições S3 (compatível com R2)
- O JWT usa `jose` para validação robusta
- O cache é configurado por tipo de pasta (sys=24h, u=4h, partners=1h)
- Suporta `Range` headers para streaming de vídeo
