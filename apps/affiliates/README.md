# @babybook/affiliates

Portal de Afiliados (influenciadores/parceiros) com duas experiências:

- **Empresa (Admin)**: criar/pausar/excluir afiliados, ver detalhes e simular vendas.
- **Afiliado**: ver link, acompanhar vendas, configurar pagamento e solicitar repasse.

## Rodar em desenvolvimento

Este app suporta **modo mock** (MSW + localStorage) e **modo real** (chama API configurada).

- Mock (recomendado): dados simulados e persistência local
  - credenciais:
    - Admin: `admin@babybook.dev` / `admin123`
    - Afiliado: `alice@influ.dev` / `affiliate123`

## Variáveis de ambiente

Veja `.env.example`.

- `VITE_ENABLE_MSW=true|false`
- `VITE_API_BASE_URL` (quando `VITE_ENABLE_MSW=false`)

### Link de divulgação (ref)

Para o afiliado copiar um link apontando para a entrada “pública” correta (landingpage ou B2C), configure:

- `VITE_REFERRAL_LINK_BASE_URL` (ex.: `http://localhost:5174`)

### Bridge dev (registro de venda no mock)

Em modo dev/test, o B2C pode registrar uma venda no mock do portal via iframe em `/bridge/record-sale`.
Para reduzir ruído/spam local, você pode restringir origens permitidas pelo `referrer`:

- `VITE_AFFILIATE_BRIDGE_ALLOWED_REFERRERS` (lista separada por vírgula, ex.: `http://localhost:5173`)
