# Cofre de Memórias Digital - Frontend

MVP do aplicativo para pais guardarem memórias dos bebês (vídeos, áudios, fotos) com design emocional.

## 🏗️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── assets/          # Imagens, ícones, fontes
│   ├── components/      # Componentes React reutilizáveis (UI)
│   │   ├── ui/         # Componentes base (shadcn/ui)
│   │   ├── figma/      # Componentes importados do Figma
│   │   ├── ThemeProvider.tsx
│   │   └── InviteGuestDialog.tsx
│   ├── hooks/          # Hooks customizados
│   │   ├── useTheme.ts
│   │   └── index.ts
│   ├── lib/            # Utilitários e configurações
│   │   ├── utils.ts    # Funções auxiliares
│   │   ├── constants.ts # Constantes da aplicação
│   │   └── index.ts
│   ├── pages/          # Componentes de página/tela
│   │   ├── LandingPage.tsx
│   │   ├── AuthLogin.tsx
│   │   ├── Checkout.tsx
│   │   ├── SetupWizard.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ChapterView.tsx
│   │   ├── MomentForm.tsx
│   │   ├── HealthModule.tsx
│   │   ├── Guestbook.tsx
│   │   └── Settings.tsx
│   ├── services/       # Lógica de API
│   │   ├── api.ts      # Cliente API e tipos
│   │   └── index.ts
│   ├── styles/         # Estilos globais
│   │   └── globals.css
│   ├── App.tsx         # Componente raiz
│   └── main.tsx        # Ponto de entrada
├── public/             # Arquivos estáticos
│   └── manifest.json   # Configuração PWA
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 📁 Convenções de Organização

### `/src/pages/`
Componentes que representam telas completas da aplicação. Cada página:
- É um componente "inteligente" que gerencia estado
- Usa hooks customizados para lógica de negócio
- Chama services para comunicação com API
- Compõe components menores da pasta `/components/`

### `/src/components/`
Componentes reutilizáveis e "burros" (apresentacionais):
- Recebem dados via props
- Não têm lógica de negócio complexa
- Podem ser usados em múltiplas páginas
- Incluem subpastas:
  - `ui/` - Componentes base (shadcn/ui)
  - `figma/` - Componentes importados do Figma

### `/src/hooks/`
Custom React hooks para reutilização de lógica:
- `useTheme` - Gerenciamento de tema claro/escuro
- `useAuth` - Autenticação (a implementar)
- `useUpload` - Upload de mídia (a implementar)

### `/src/services/`
Camada de comunicação com APIs externas:
- Funções assíncronas para operações CRUD
- Tipos TypeScript para requests/responses
- Tratamento de erros centralizado
- Mock data para desenvolvimento

### `/src/lib/`
Utilitários e configurações globais:
- `utils.ts` - Funções auxiliares (formatação, validação)
- `constants.ts` - Constantes da aplicação (endpoints, limites)

## 🚀 Próximos Passos

### 1. Migração de Componentes
Todos os componentes de `/components/*.tsx` precisam ser movidos para:
- `/frontend/src/pages/` - Páginas (LandingPage, Dashboard, etc.)
- `/frontend/src/components/` - Componentes reutilizáveis

### 2. Migração de UI Components
Copiar todos os arquivos de `/components/ui/` para `/frontend/src/components/ui/`

### 3. Migração de Estilos
Mover `/styles/globals.css` para `/frontend/src/styles/globals.css`

### 4. Atualizar Imports
Atualizar todos os imports nos componentes para refletir a nova estrutura:
```typescript
// Antes
import { Button } from "./components/ui/button";

// Depois
import { Button } from "../components/ui/button";
// ou
import { Button } from "@/components/ui/button"; // com alias
```

### 5. Configurar Aliases
Adicionar aliases no `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

## 🛠️ Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Motion** - Animações
- **Shadcn/ui** - Componentes base
- **Lucide React** - Ícones
- **Sonner** - Toast notifications

## 📱 PWA Configuration

O app é configurado como PWA (Progressive Web App) para instalação mobile:
- Manifest em `/public/manifest.json`
- Service Worker para cache offline
- Ícones otimizados para diferentes tamanhos

## 🎨 Design System

- **Paleta**: Beiges, terracota, verde-sálvia
- **Typography**: 
  - Títulos: Lora (serif)
  - Corpo: Manrope (sans-serif)
- **Mobile-first**: Otimizado para uso mobile
- **Touch targets**: Mínimo 48px
- **Tema escuro**: Suportado

## 🔐 Backend Integration (Futuro)

Quando conectar ao Supabase:
1. Atualizar `/services/api.ts` com chamadas reais
2. Configurar variáveis de ambiente
3. Implementar autenticação real
4. Configurar storage para uploads

## 📝 Comandos Úteis

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🤝 Contribuição

Siga as convenções de organização ao adicionar novos componentes:
1. Páginas vão em `/pages/`
2. Componentes reutilizáveis em `/components/`
3. Lógica de API em `/services/`
4. Hooks customizados em `/hooks/`
5. Utilitários em `/lib/`
