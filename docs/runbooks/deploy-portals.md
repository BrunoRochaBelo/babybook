# Deploy em Produção — Portais em Origens Separadas (B2C / Partner / Affiliates)

Este runbook descreve como publicar os portais como **apps realmente separados** no navegador (isolamento de storage, SW, caches e preferências), mantendo **integridade e segurança**.

## Objetivo

- B2C (pais) e Partner (fotógrafos) **não compartilham** `localStorage`/`IndexedDB`/Service Worker.
- Sessão/cookies e CORS configurados de forma segura.
- Deploy repetível (CI) com **builds separados**.

## Domínios recomendados

Escolha subdomínios distintos:

- **B2C**: `https://app.seudominio.com`
- **Partner (B2B)**: `https://partner.seudominio.com`
- **Affiliates**: `https://affiliates.seudominio.com`
- **API**: `https://api.seudominio.com`

> Observação: também funciona com outras convenções (ex.: `b2c.`/`pro.`), desde que sejam **origens diferentes**.

## Como gerar os builds (CI)

O `apps/web` é compilado duas vezes, com `VITE_PORTAL` diferente e diretórios de saída separados:

- B2C: `apps/web/dist-b2c`
- Partner: `apps/web/dist-partner`

Scripts:

- No pacote: `pnpm --filter @babybook/web run build:portals`
- Na raiz: `pnpm run build:web:portals`

### Affiliates

O portal de afiliados é um app separado (`apps/affiliates`) e deve ser publicado no subdomínio `affiliates.*`.

Artefatos:

- default: `apps/affiliates/dist`
- opcional: `apps/affiliates/dist-affiliates` (quando usar `build:prod:out`)

Scripts:

- `pnpm --filter @babybook/affiliates run build:prod`
- `pnpm run build:affiliates`

> Importante: hoje o portal de afiliados tem **modo mock** (MSW + localStorage) para dev. **Não existe ainda backend real de afiliados na API** (endpoints/modelos). Para produção “de verdade”, será necessário implementar o módulo de afiliados no `apps/api` (auth/afiliados/vendas/repasse) ou integrar com um serviço externo.

## Variáveis de ambiente — Frontend (web)

### Caso 1 (recomendado): proxy/rewrite `/api` no CDN (sem CORS)

Configure seu provedor (Cloudflare Pages / Vercel / nginx) para reescrever:

- `https://app.seudominio.com/api/*` → `https://api.seudominio.com/*`
- `https://partner.seudominio.com/api/*` → `https://api.seudominio.com/*`

Vantagens:

- O browser enxerga API como **same-origin** (`/api`), evitando CORS.
- Você pode ter cookies host-only por portal (isolamento máximo) _se_ a API for “montada” sob cada host.

Nesse modo, mantenha **sem** `VITE_API_BASE_URL` (o frontend cai para `"/api"`).

### Caso 2: API cross-origin (CORS habilitado)

Se o frontend chamar `https://api.seudominio.com` diretamente, defina:

- `VITE_API_BASE_URL=https://api.seudominio.com`

E garanta `CORS_ORIGINS` correto no backend.

> Nota: nesse modo, o cookie de sessão é do host `api.seudominio.com` e tende a ser compartilhado entre portais. Isso **não quebra** a separação de storage dos portais, mas a sessão pode ser “SSO” entre eles. Se você quiser sessão isolada por portal, prefira o **Caso 1** (proxy) ou use duas origens de API (`api-app.*` e `api-partner.*`).

## Variáveis de ambiente — Frontend (affiliates)

O `apps/affiliates` também suporta os dois modos de API:

- **Proxy /api (recomendado)**: não defina `VITE_API_BASE_URL` e publique com rewrite `/api/*` → `https://api.seudominio.com/*`
- **API cross-origin**: defina `VITE_API_BASE_URL=https://api.seudominio.com` e habilite CORS

Defina também:

- `VITE_ENABLE_MSW=false` (produção)
- `VITE_REFERRAL_LINK_BASE_URL=https://app.seudominio.com` (ou a landingpage pública correta)

> Nota: o `VITE_REFERRAL_LINK_BASE_URL` deve apontar para a **entrada pública** onde o usuário final cai (B2C/landing), não para o portal partner.

## Variáveis de ambiente — Backend (API)

Em **staging/prod**, o backend possui guardrails e falha no startup com config insegura.

Checklist mínimo:

- `ENV=production`
- `SESSION_COOKIE_SECURE=true`
- `FRONTEND_URL=https://app.seudominio.com`
- `PARTNER_FRONTEND_URL=https://partner.seudominio.com`
- `PUBLIC_BASE_URL=https://share.seudominio.com` (ou similar)
- `UPLOAD_URL_BASE=https://uploads.seudominio.com` (ou similar)
- `ALLOWED_HOSTS` (sem `*`) com os hosts válidos
- `CORS_ORIGINS` **apenas https** (sem localhost)
- `SECRET_KEY`, `SERVICE_API_TOKEN`, `BILLING_WEBHOOK_SECRET` definidos e não-default

### Sobre CORS

Se usar o **Caso 2** (API cross-origin), inclua:

- `CORS_ORIGINS=["https://app.seudominio.com","https://partner.seudominio.com","https://affiliates.seudominio.com"]`

Se usar o **Caso 1** (proxy `/api`), CORS pode ser mais restrito (ou até desnecessário, dependendo do desenho).

## Cookies e segurança

- Em produção, **exija HTTPS** e `SESSION_COOKIE_SECURE=true`.
- O cookie é `HttpOnly` e `SameSite=Lax` (padrão conservador).
- Não habilite `ALLOW_HEADER_SESSION_AUTH` em produção.

## Smoke tests pós-deploy

1. Abra `https://app.seudominio.com` e faça login. Verifique requests para `/me` e status 200.

2. Abra `https://partner.seudominio.com` e faça login (ou use role photographer). Confirme que:

- rotas B2C não ficam acessíveis pelo portal partner (redireciona)
- links gerados pelo partner (resgate/import) apontam para o **B2C**

3. Verifique que preferências (tema) e storage não “vazam” entre `app.*` e `partner.*`.

## Artefatos gerados

- `apps/web/dist-b2c` → publicar em `app.*`
- `apps/web/dist-partner` → publicar em `partner.*`

Se você também publicar affiliates:

- `apps/affiliates/dist` → publicar em `affiliates.*`
