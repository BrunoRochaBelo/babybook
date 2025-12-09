# 🎨 Baby Book - Web Frontend

Frontend React para a aplicação Baby Book - um memorial digital para momentos especiais dos filhos.

## 🚀 Setup Inicial

### 1. Instalar dependências

```bash
cd apps/web
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

O arquivo `.env.local` contém:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENABLE_MSW=true
```

Quando `VITE_ENABLE_MSW=true` os mocks do MSW são carregados (valor padrão). Altere para `false` apenas quando quiser falar com a API real.

Nota operacional:

- Pricing e ofertas: o produto adota pricing dual (Ticket R$297 cartão / R$279 PIX). A landing page e mensagens públicas devem ser validadas contra `docs/DOSSIE_ATUALIZACAO_EXECUCAO.md` antes de qualquer publicação.
- Processamento de mídia: o frontend prefere processar mídia no cliente usando `ffmpeg.wasm` (Web Worker) para reduzir custos de infraestrutura. O pipeline de workers (Modal) existe como fallback e para jobs pesados; não dependa do worker para o fluxo básico local quando `VITE_ENABLE_MSW=true`.
- Storage: em desenvolvimento a API normalmente aponta para um MinIO local (mock S3). Em produção usamos Cloudflare R2 (hot/previews) + Backblaze B2 (cold/originals).

### 3. Rodar em modo desenvolvimento

```bash
pnpm dev
```

A aplicação abrirá em `http://localhost:5173` (ou outra porta se 5173 estiver em uso).

## 📝 Dados Mock

Quando `VITE_ENABLE_MSW=true` (em combinação com `pnpm dev` ou `pnpm test`), o MSW (Mock Service Worker) intercepta os requests e devolve os dados abaixo. Com o valor padrão (`true`) você conversa com os mocks; mude para `false` para falar direto com a API.

Todos os endpoints retornam dados mockados:

- ✅ 2 crianças de exemplo (Alice e Bruno)
- ✅ 5 momentos com mídia de exemplo
- ✅ 3 entradas no livro de visitas
- ✅ 8 medições de crescimento (gráfico funcional)
- ✅ 1 usuário logado

### Endpoints Mock Implementados

```
GET  /children                              → Lista de crianças
POST /children                              → Criar criança

GET  /children/:childId/moments             → Momentos de uma criança
GET  /moments/:momentId                     → Detalhe de um momento
POST /moments                               → Criar momento
PATCH /moments/:momentId                    → Atualizar momento

POST /uploads/init                          → Upload de mídia

GET  /children/:childId/guestbook           → Livro de visitas
POST /guestbook                             → Nova entrada
POST /guestbook/:entryId/approve            → Aprovar entrada

GET  /children/:childId/health/measurements → Medições de crescimento
POST /health/measurements                   → Adicionar medição

GET  /me                                    → Perfil do usuário
GET  /me/usage                              → Quota de armazenamento
```

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
  ├── pages/                # Páginas principais
  ├── components/           # Componentes reutilizáveis
  ├── layouts/             # Layouts de página
  ├── hooks/               # Custom hooks (API)
  ├── services/            # Serviços (axios config)
  ├── store/               # Estado global (Zustand)
  ├── types/               # TypeScript interfaces
  ├── app/                 # Configuração app
  └── mocks/               # MSW handlers e data
```

### Principais Tecnologias

- **React 18** - UI library
- **React Router v6** - Roteamento
- **React Query** - Gerenciamento de dados assincronos
- **Zustand** - Estado global
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes acessíveis
- **MSW** - Mock Service Worker (dados em dev)
- **Vite** - Build tool
- **TypeScript** - Type safety

## 🎯 Rotas Principais

```
/                              → Redireciona para /jornada

/jornada                       → Dashboard (HUD + Timeline)
/jornada/moment/draft/:id      → Formulário template
/jornada/moment/avulso         → Novo momento livre
/jornada/moment/:id            → Detalhe do momento
/jornada/perfil-crianca        → Perfil da criança

/saude                         → Saúde (3 tabs)
/saude/crescimento             → Gráfico de crescimento
/saude/pediatra                → Visitas ao pediatra
/saude/cofre                   → Cofre de documentos

/visitas                       → Livro de visitas

/capsule/:id                   → Cápsula do tempo

/perfil-usuario                → Perfil do usuário
/perfil-usuario/guardians      → Gerenciar guardiões
/perfil-usuario/orders         → Meus pedidos (PoD)
```

## 🎨 Design System

### Paleta de Cores

- `#F7F3EF` - Fundo (Areia)
- `#2A2A2A` - Texto (Carvão)
- `#C9D3C2` - Bordas (Sálvia)
- `#F2995D` - Accent (Pêssego)
- `#C76A6A` - Danger (Rubi)

### Componentes

Todos os componentes usam:

- **Raio**: `rounded-xl` ou `rounded-2xl`
- **Sombra**: `shadow-md` ou `shadow-lg`
- **Transições**: `transition-all`
- **Touch targets**: ≥ 44px

## 📱 Responsividade

- **Mobile-first**: Desenvolva mobile primeiro
- **Breakpoints**: `sm`, `md`, `lg`, `xl`
- **Bottom Nav**: Fixa na base (mobile)
- **Conteúdo**: Padding 16px, max-width 1024px

## ✅ Checklist de Desenvolvimento

### MVP (Mínimo Viável)

- [x] Estrutura base com rotas
- [x] Layout com Bottom Navigation
- [x] Dashboard (HUD + Timeline)
- [x] Dados mock com MSW
- [x] Formulários de Momento
- [x] Aba Saúde (3 tabs)
- [x] Livro de Visitas
- [x] Cápsula do Tempo
- [ ] Upload de mídia com progresso
- [ ] Autenticação (login/signup)
- [ ] Compartilhamento (link + guardiões)
- [ ] PoD (Print-on-Demand)
- [ ] Fila de upload offline

### QA & Testes

- [ ] Testes E2E (Playwright)
- [ ] Testes unitários (Vitest)
- [ ] Responsividade (mobile/tablet/desktop)
- [ ] Acessibilidade (WCAG AA)
- [ ] Performance (Lighthouse)

## 🔧 Troubleshooting

### A página está branca

1. Abra o console (F12)
2. Verifique se há erros de TypeScript
3. Limpe o cache: `pnpm run build` depois `pnpm dev`

### MSW não está interceptando requests

1. Confirme que `VITE_ENABLE_MSW=true` no `.env.local`
2. Verifique que está em modo dev: `import.meta.env.MODE === 'development'`
3. Abra DevTools → Application → Service Workers e cheque se `mockServiceWorker.js` está carregando

### Estilos não aparecem

1. Tailwind precisa estar compilado
2. Verifique `tailwind.config.js` incluiu `src/**/*.{tsx,ts}`
3. Rode `pnpm dev` novamente

## 📚 Próximas Etapas

1. **Upload de Mídia**: Implementar preview + barra de progresso
2. **Autenticação**: Magic Link ou OAuth com backend
3. **Compartilhamento**: Link público + convite de guardiões
4. **PoD**: Fluxo completo de curadoria e impressão
5. **Offline**: IndexedDB para fila de uploads
6. **Push Notifications**: Notificações de mensagens e eventos

## 🤝 Contribuindo

Antes de fazer commit:

```bash
# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build
```

## 📄 Licença

MIT
