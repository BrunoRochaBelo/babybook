# 📦 Guia de Migração - Nova Estrutura

Este documento explica como migrar o projeto para a nova estrutura profissional.

## 🎯 Objetivo

Reorganizar o projeto seguindo melhores práticas de arquitetura frontend:
- Separação clara entre páginas e componentes
- Hooks customizados centralizados
- Camada de serviços para API
- Utilitários organizados
- Configuração PWA completa

## 📂 Estrutura Antiga → Nova

```
ANTES                          →  DEPOIS
──────────────────────────────────────────────────────────
/App.tsx                       →  /frontend/src/App.tsx
/components/LandingPage.tsx    →  /frontend/src/pages/LandingPage.tsx
/components/Dashboard.tsx      →  /frontend/src/pages/Dashboard.tsx
/components/ThemeProvider.tsx  →  /frontend/src/components/ThemeProvider.tsx
/components/ui/button.tsx      →  /frontend/src/components/ui/button.tsx
/styles/globals.css            →  /frontend/src/styles/globals.css
```

## ✅ Arquivos Já Criados

### 1. Estrutura Base
- ✅ `/frontend/src/main.tsx` - Ponto de entrada
- ✅ `/frontend/src/App.tsx` - Componente raiz (atualizado)
- ✅ `/frontend/README.md` - Documentação
- ✅ `/frontend/package.json` - Dependências
- ✅ `/frontend/vite.config.ts` - Configuração Vite
- ✅ `/frontend/tsconfig.json` - Configuração TypeScript

### 2. Hooks
- ✅ `/frontend/src/hooks/useTheme.ts` - Hook de tema
- ✅ `/frontend/src/hooks/index.ts` - Exports centralizados

### 3. Lib (Utilitários)
- ✅ `/frontend/src/lib/utils.ts` - Funções auxiliares
- ✅ `/frontend/src/lib/constants.ts` - Constantes
- ✅ `/frontend/src/lib/index.ts` - Exports centralizados

### 4. Services (API)
- ✅ `/frontend/src/services/api.ts` - Cliente API com mocks
- ✅ `/frontend/src/services/index.ts` - Exports centralizados

### 5. Components Base
- ✅ `/frontend/src/components/ThemeProvider.tsx` - Atualizado para usar hook
- ✅ `/frontend/src/components/ui/utils.ts` - Função cn()

### 6. PWA
- ✅ `/frontend/public/manifest.json` - Configuração PWA
- ✅ `/frontend/public/_redirects` - Redirects para SPA

### 7. Configuração
- ✅ `/frontend/.env.example` - Variáveis de ambiente
- ✅ `/frontend/.gitignore` - Arquivos ignorados

## 🔄 Próximos Passos para Migração Manual

### Passo 1: Copiar Componentes UI

Copie TODOS os arquivos de `/components/ui/` para `/frontend/src/components/ui/`:

```bash
# Arquivos a copiar:
/components/ui/button.tsx          → /frontend/src/components/ui/button.tsx
/components/ui/card.tsx            → /frontend/src/components/ui/card.tsx
/components/ui/input.tsx           → /frontend/src/components/ui/input.tsx
/components/ui/dialog.tsx          → /frontend/src/components/ui/dialog.tsx
/components/ui/drawer.tsx          → /frontend/src/components/ui/drawer.tsx
/components/ui/progress.tsx        → /frontend/src/components/ui/progress.tsx
/components/ui/badge.tsx           → /frontend/src/components/ui/badge.tsx
/components/ui/alert.tsx           → /frontend/src/components/ui/alert.tsx
/components/ui/tabs.tsx            → /frontend/src/components/ui/tabs.tsx
/components/ui/sonner.tsx          → /frontend/src/components/ui/sonner.tsx
/components/ui/dropdown-menu.tsx   → /frontend/src/components/ui/dropdown-menu.tsx
/components/ui/use-mobile.ts       → /frontend/src/components/ui/use-mobile.ts
... (todos os outros arquivos ui/)
```

**⚠️ IMPORTANTE**: Atualizar imports dentro desses arquivos:
```typescript
// Antes
import { cn } from "./utils";

// Depois (se necessário)
import { cn } from "./utils";
// ou
import { cn } from "@/lib/utils";
```

### Passo 2: Copiar Componentes Figma

```bash
/components/figma/ImageWithFallback.tsx → /frontend/src/components/figma/ImageWithFallback.tsx
```

### Passo 3: Mover Páginas

Copie os componentes de página para `/frontend/src/pages/`:

```bash
/components/LandingPage.tsx  → /frontend/src/pages/LandingPage.tsx
/components/AuthLogin.tsx    → /frontend/src/pages/AuthLogin.tsx
/components/Checkout.tsx     → /frontend/src/pages/Checkout.tsx
/components/SetupWizard.tsx  → /frontend/src/pages/SetupWizard.tsx
/components/Dashboard.tsx    → /frontend/src/pages/Dashboard.tsx
/components/ChapterView.tsx  → /frontend/src/pages/ChapterView.tsx
/components/MomentForm.tsx   → /frontend/src/pages/MomentForm.tsx
/components/HealthModule.tsx → /frontend/src/pages/HealthModule.tsx
/components/Guestbook.tsx    → /frontend/src/pages/Guestbook.tsx
/components/Settings.tsx     → /frontend/src/pages/Settings.tsx
```

**⚠️ IMPORTANTE**: Atualizar imports em cada arquivo:
```typescript
// Antes
import { Button } from "./ui/button";
import { useTheme } from "./ThemeProvider";

// Depois
import { Button } from "../components/ui/button";
import { useTheme } from "../hooks/useTheme";
// ou com alias
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
```

### Passo 4: Mover Componente Reutilizável

```bash
/components/InviteGuestDialog.tsx → /frontend/src/components/InviteGuestDialog.tsx
```

Atualizar imports neste arquivo também.

### Passo 5: Mover Estilos

```bash
/styles/globals.css → /frontend/src/styles/globals.css
```

### Passo 6: Atualizar Imports do Dashboard

O arquivo `/frontend/src/pages/Dashboard.tsx` precisa importar o hook:

```typescript
// Atualizar esta linha
import { useTheme } from "./ThemeProvider";

// Para
import { useTheme } from "../hooks/useTheme";
// ou
import { useTheme } from "@/hooks/useTheme";
```

Fazer o mesmo para todos os componentes que usam `useTheme`.

### Passo 7: Verificar Imports

Procure e substitua em TODOS os arquivos movidos:

1. **Imports relativos** - Ajustar níveis de diretório:
   ```typescript
   // De
   import { X } from "./components/..."
   // Para
   import { X } from "../components/..." // ou "@/components/..."
   ```

2. **Imports de UI**:
   ```typescript
   // De
   import { Button } from "./ui/button";
   // Para
   import { Button } from "../components/ui/button";
   // ou
   import { Button } from "@/components/ui/button";
   ```

3. **Imports de hooks**:
   ```typescript
   // De
   import { useTheme } from "./ThemeProvider";
   // Para
   import { useTheme } from "@/hooks/useTheme";
   ```

## 🔧 Atualizar Imports com Aliases

Para usar `@/` em vez de caminhos relativos, os aliases já estão configurados em:
- `vite.config.ts` - `resolve.alias`
- `tsconfig.json` - `paths`

Você pode optar por usar:

```typescript
// Estilo com alias (recomendado)
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { apiClient } from "@/services/api";
import { formatDateBR } from "@/lib/utils";

// Ou estilo relativo
import { Button } from "../components/ui/button";
```

## 🧪 Testar a Migração

1. **Instalar dependências**:
   ```bash
   cd frontend
   npm install
   ```

2. **Iniciar servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Verificar se não há erros de import**:
   - Abrir o console do navegador
   - Navegar por todas as páginas
   - Verificar se todos os componentes renderizam

4. **Testar funcionalidades**:
   - ✅ Landing page carrega
   - ✅ Login funciona
   - ✅ Checkout renderiza
   - ✅ Setup wizard completa
   - ✅ Dashboard exibe capítulos
   - ✅ Tema escuro/claro funciona
   - ✅ Navegação entre telas funciona

## 🐛 Problemas Comuns

### Erro: "Cannot find module"
**Solução**: Verificar se o caminho do import está correto e se o arquivo foi movido.

### Erro: "useTheme must be used within ThemeProvider"
**Solução**: Verificar se o import mudou de `./ThemeProvider` para `@/hooks/useTheme`.

### Erro de CSS não carrega
**Solução**: Verificar se `globals.css` está importado no `main.tsx`:
```typescript
import "./styles/globals.css";
```

### Componente UI não encontrado
**Solução**: Verificar se todos os arquivos `/components/ui/` foram copiados.

## 📦 Depois da Migração

### Limpar Arquivos Antigos
Após confirmar que tudo funciona, você pode remover:
- `/App.tsx` (raiz)
- `/components/` (raiz)
- `/styles/` (raiz)

### Atualizar Documentação
- ✅ README.md já atualizado em `/frontend/`
- Atualizar documentação de projeto se necessário

### Próximas Features
Com a estrutura organizada, ficará mais fácil adicionar:
- Autenticação real (atualizar `/services/api.ts`)
- Upload de arquivos (criar hook `useUpload`)
- Integração com Supabase
- Testes unitários
- Storybook para componentes

## 🎉 Benefícios da Nova Estrutura

1. **Escalabilidade** - Fácil adicionar novas páginas/componentes
2. **Manutenibilidade** - Código organizado por responsabilidade
3. **Testabilidade** - Services e hooks isolados
4. **Performance** - Code splitting por página
5. **DX** - Imports com aliases mais limpos
6. **Profissionalismo** - Estrutura padrão da indústria
7. **Colaboração** - Outros devs entendem facilmente

## 📞 Suporte

Se encontrar problemas durante a migração:
1. Verificar esta documentação
2. Verificar `/frontend/README.md`
3. Revisar console do navegador para erros
4. Verificar se todos os imports foram atualizados
