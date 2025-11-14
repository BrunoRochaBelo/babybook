# Landingpage - Como rodar localmente

Instruções para executar o projeto `landingpage` em modo de desenvolvimento e em modo produção (local).

Antes de começar, escolha o gerenciador de pacotes que você usa no workspace (`pnpm`, `npm` ou `yarn`). As instruções abaixo usam exemplos com `pnpm` e `npm`.

## Instalar dependências

No terminal, a partir da pasta do projeto `landingpage`:

PowerShell:

```
cd landingpage
pnpm install
```

ou com npm:

```
cd landingpage
npm install
```

## Modo Desenvolvimento

Roda o servidor de desenvolvimento com hot-reload (Vite):

PowerShell:

```
pnpm dev
```

ou com npm:

```
npm run dev
```

O Vite vai iniciar um servidor normalmente em `http://localhost:5173` (ou outra porta se já estiver em uso). Você pode sobrescrever a porta passando `--port`:

```
pnpm dev -- --port 3000
```

## Modo Produção (local)

1. Gerar os artefatos de produção:

PowerShell:

```
pnpm build
```

ou com npm:

```
npm run build
```

2. Servir a build localmente (pré-visualização/produção):

Usamos `vite preview` (há também o script `start` que é um alias para `vite preview`):

PowerShell:

```
pnpm start
```

ou com npm:

```
npm run start
```

Isso servirá a pasta `dist/` localmente para checar o comportamento em produção.

## Observações

- `pnpm` é o gerenciador recomendado no workspace, mas `npm` funciona igualmente neste pacote.
- O script `start` foi adicionado como atalho para `vite preview`, portanto `npm start` também funciona.
- Se você preferir usar um servidor HTTP estático (ex: `serve`), há um script `serve` incluído que usa a dependência local `serve`.

PowerShell:

```
pnpm run serve
```

ou com npm:

```
npm run serve
```

O script servirá a pasta `dist/` em `http://localhost:5000`. Se preferir outra porta, rode `pnpm run serve -- -l <porta>` ou `npm run serve -- -l <porta>`.

---

Se quiser, eu adiciono exemplos de configuração de porta, variáveis de ambiente, ou um script PowerShell para rodar tudo em sequência.
