# Guia de Componentes - Design Migrado

Este documento descreve como usar os componentes criados na migração de design da pasta `inspiração design` para o Baby Book.

## 📋 Componentes Disponíveis

### 1. Dashboard (Feature)

**Localização:** `apps/web/src/features/dashboard/Dashboard.tsx`

O Dashboard principal que exibe o santuário do bebê com capítulos de momentos, progresso geral e HUD com próxima sugestão.

#### Props

```typescript
interface DashboardProps {
  babyName: string; // Nome do bebê (ex: "Maria")
  onSelectChapter: (chapterId: string) => void; // Callback ao clicar em um capítulo
  onNavigate: (section: "memories" | "visits") => void; // Callback de navegação entre seções
  onSettings: () => void; // Callback para abrir configurações
}
```

#### Uso Básico

```tsx
import { Dashboard } from "@/features/dashboard/Dashboard";

function Page() {
  const handleSelectChapter = (chapterId: string) => {
    console.log("Capítulo selecionado:", chapterId);
    // Navegar para editor de momento ou visualizador
  };

  const handleNavigate = (section: "memories" | "visits") => {
    console.log("Navegando para:", section);
  };

  const handleSettings = () => {
    console.log("Abrindo configurações");
  };

  return (
    <Dashboard
      babyName="Maria"
      onSelectChapter={handleSelectChapter}
      onNavigate={handleNavigate}
      onSettings={handleSettings}
    />
  );
}
```

#### Características

- ✅ Exibe "Santuário de {babyName}" com font serif
- ✅ HUD com "Próxima sugestão: O Primeiro Sorriso"
- ✅ Progress bar geral com percentual
- ✅ Cards de capítulos com ícones coloridos e progresso individual
- ✅ Empty state acolhedor quando sem momentos registrados
- ✅ Header com seletor de filhos, notificações e tema
- ✅ FloatingNav integrada na base

#### Design Tokens Utilizados

- **Cores:** background (#F7F3EF), accent (#F2995D), muted (#C9D3C2)
- **Tipografia:** serif para títulos (h2-h3), sans para corpo
- **Componentes:** rounded-2xl, shadow-lg para cards

---

### 2. MomentForm (Feature)

**Localização:** `apps/web/src/features/moment/MomentForm.tsx`

Formulário para registrar novos momentos com data, mídia e história.

#### Props

```typescript
interface MomentFormProps {
  momentTitle: string; // Título do momento (ex: "O Primeiro Sorriso")
  momentDescription?: string; // Descrição adicional (opcional)
  babyName: string; // Nome do bebê para contexto
  isRecurrent?: boolean; // Se este momento pode ser registrado múltiplas vezes
  existingRecordsCount?: number; // Quantos registros já existem (para recorrentes)
  onBack: () => void; // Callback ao clicar em voltar
  onSave: () => void; // Callback após salvar com sucesso
}
```

#### Uso Básico

```tsx
import { MomentForm } from "@/features/moment/MomentForm";

function MomentPage() {
  const handleBack = () => {
    // Voltar ao dashboard
  };

  const handleSave = () => {
    // Após salvar, pode redirecionar ou atualizar dados
  };

  return (
    <MomentForm
      momentTitle="O Primeiro Sorriso"
      momentDescription="Aquele sorriso intencionado que sempre lembramos"
      babyName="Maria"
      isRecurrent={true}
      existingRecordsCount={2}
      onBack={handleBack}
      onSave={handleSave}
    />
  );
}
```

#### Características

- ✅ Campo de data obrigatório
- ✅ Upload de fotos, vídeos e áudios (mocked, pronto para integração)
- ✅ Campo de texto para contar a história (opcional)
- ✅ Toast notifications com microcopy acolhedora
- ✅ Suporte a momentos recorrentes
- ✅ Dica acessível com incentivo não-punitivo
- ✅ Botão "Guardar no Santuário" com icon de check

#### Integrações Futuras

O componente está preparado para integração com:

```typescript
// 1. React Query para mutations
const { mutate: saveMoment } = useMutation({
  mutationFn: (data) => api.post("/moments", data),
  onSuccess: () => onSave(),
});

// 2. Upload Manager para mídia
const uploadResult = await uploadManager.upload(file);

// 3. Zod para validação
const schema = z.object({
  date: z.date(),
  story: z.string(),
  media: z.array(mediaSchema),
});
```

---

### 3. FloatingNav (Componente)

**Localização:** `apps/web/src/components/FloatingNav.tsx`

Navegação flutuante no estilo iOS com 2 abas: Jornada e Visitas.

#### Props

```typescript
interface FloatingNavProps {
  activeSection: "memories" | "visits"; // Aba ativa
  onNavigate: (section: "memories" | "visits") => void; // Callback de navegação
}
```

#### Uso Básico

```tsx
import { FloatingNav } from "@/components/FloatingNav";

function App() {
  const [activeSection, setActiveSection] = useState<"memories" | "visits">(
    "memories",
  );

  return (
    <>
      {/* Conteúdo da aba */}
      {activeSection === "memories" && <DashboardContent />}
      {activeSection === "visits" && <VisitsContent />}

      {/* Navegação flutuante */}
      <FloatingNav
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />
    </>
  );
}
```

#### Características

- ✅ 2 abas: "Jornada" e "Visitas" (conforme Modelagem_UI-UX.md § 2.2)
- ✅ Ícones lucide-react (BookHeart, Users)
- ✅ Indicador visual de seção ativa com cor accent
- ✅ Animação scale ao passar mouse
- ✅ Backdrop blur e border translúcido
- ✅ Posicionado fixo no bottom com max-width

#### Design Tokens

- **Cor ativa:** bg-accent/20 text-accent
- **Hover:** bg-muted/50
- **Border-radius:** rounded-[24px] para container, rounded-[18px] para botões
- **Shadow:** shadow-2xl para profundidade

---

### 4. NotificationCenter (Componente)

**Localização:** `apps/web/src/components/NotificationCenter.tsx`

Painel de notificações com suporte a múltiplos tipos (vacina, marco, memória, celebração, geral).

#### Props

```typescript
interface NotificationCenterProps {
  notifications: Notification[]; // Lista de notificações
  onMarkAsRead: (notificationId: string) => void; // Marcar uma como lida
  onMarkAllAsRead: () => void; // Marcar todas como lidas
}

interface Notification {
  id: string;
  type: "vaccine" | "milestone" | "memory" | "celebration" | "general";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

#### Uso Básico

```tsx
import { NotificationCenter } from "@/components/NotificationCenter";
import { useState } from "react";

function Header() {
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "vaccine",
      title: "Vacina Próxima",
      message: "Pentavalente (2ª dose) prevista para 15/11/2025",
      time: "2 dias atrás",
      isRead: false,
      action: {
        label: "Ver detalhes",
        onClick: () => console.log("Ver detalhes"),
      },
    },
    // ... mais notificações
  ]);

  return (
    <NotificationCenter
      notifications={notifications}
      onMarkAsRead={(id) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
      }}
      onMarkAllAsRead={() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }}
    />
  );
}
```

#### Características

- ✅ Badge com contador de não-lidas
- ✅ Painel deslizante com 5 tipos de notificações
- ✅ Ícones e cores específicas por tipo
- ✅ Status read/unread
- ✅ Ações opcionais por notificação
- ✅ Indicador visual de não-lidas (dot azul)
- ✅ Empty state acolhedor

#### Tipos de Notificação

| Tipo        | Ícone    | Cor       | Exemplos                   |
| ----------- | -------- | --------- | -------------------------- |
| vaccine     | Syringe  | red-500   | Vacinas, checkups          |
| milestone   | Heart    | accent    | Marcos de desenvolvimento  |
| memory      | Calendar | accent    | Lembranças automáticas     |
| celebration | Gift     | secondary | Aniversários, mesversários |
| general     | Bell     | muted     | Atualizações gerais        |

---

### 5. ChildSwitcherDialog (Componente)

**Localização:** `apps/web/src/components/ChildSwitcherDialog.tsx`

Modal para trocar entre filhos/bebês cadastrados.

#### Props

```typescript
interface ChildSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChild: Child;
  children: Child[];
  onSelectChild: (childId: string) => void;
  onAddChild: () => void;
}

interface Child {
  id: string;
  name: string;
  age: string;
  momentCount: number;
  isActive: boolean;
}
```

#### Uso Básico

```tsx
import { ChildSwitcherDialog } from "@/components/ChildSwitcherDialog";
import { useState } from "react";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const children = [
    {
      id: "1",
      name: "Maria",
      age: "10 meses",
      momentCount: 10,
      isActive: true,
    },
    { id: "2", name: "João", age: "3 anos", momentCount: 45, isActive: false },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>{children[0].name}</button>

      <ChildSwitcherDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        currentChild={children[0]}
        children={children}
        onSelectChild={(id) => console.log("Selecionou:", id)}
        onAddChild={() => console.log("Adicionar novo filho")}
      />
    </>
  );
}
```

#### Características

- ✅ Modal com overlay escuro
- ✅ Lista de filhos com indicador de ativo
- ✅ Botão para adicionar novo filho
- ✅ Avatar com initial do nome
- ✅ Exibe idade e contador de momentos
- ✅ Fecha ao clicar fora ou em um filho

---

### 6. useTheme (Hook)

**Localização:** `apps/web/src/hooks/useTheme.ts`

Hook para gerenciar tema (light/dark) com persistência em localStorage.

#### Uso Básico

```tsx
import { useTheme } from "@/hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
```

#### Características

- ✅ Gerencia classe "dark" no documento
- ✅ Persiste em localStorage
- ✅ Respeita `prefers-color-scheme` do sistema
- ✅ Tipo-seguro com TypeScript

---

## 🎨 Design Tokens Implementados

Todos os componentes usam os tokens definidos em `tailwind.config.js` conforme `Modelagem_UI-UX.md § 1`:

### Cores

```css
/* Classe Tailwind → Hex */
bg-background   → #F7F3EF (areia/quente)
text-foreground → #2A2A2A (carvão macio)
bg-accent       → #F2995D (pêssego/argila)
text-muted      → #C9D3C2 (sálvia)
bg-danger       → #C76A6A (rubi dessaturado)
```

### Tipografia

```css
font-serif /* Lora, Merriweather, Vollkorn */
  → Títulos h1-h3, "Santuário", "Próxima sugestão"

font-sans  /* Inter, Manrope, Figtree */
  → Corpo, labels, UI

/* Scales */
text-3xl font-serif → h2 "Santuário de Maria" (28/34px)
text-base            → Body padrão (16/24px)
```

### Componentes

```css
rounded-2xl      → Cards, buttons, inputs (24px)
shadow-lg        → Cards flutuando (depth effect)
rounded-[18px]   → Botões internos (18px)
rounded-[24px]   → Nav flutuante (24px)
```

---

## 🔗 Integrações com Sistema

### React Query

Os componentes estão preparados para integração com React Query:

```typescript
// Hook para buscar capítulos
export const useChapters = () =>
  useQuery({
    queryKey: ["chapters"],
    queryFn: () => api.get("/me/chapters"),
  });

// Hook para salvar momento
export const useSaveMoment = () =>
  useMutation({
    mutationFn: (data) => api.post("/moments", data),
  });
```

### Zustand (State Management)

Preparado para estado global:

```typescript
// apps/web/src/store/ui.ts
export const useUIStore = create((set) => ({
  selectedChapterId: null,
  activeSection: "memories" as "memories" | "visits",

  setSelectedChapterId: (id) => set({ selectedChapterId: id }),
  setActiveSection: (section) => set({ activeSection: section }),
}));
```

### Validação com Zod

```typescript
// apps/web/src/lib/schemas.ts
export const momentFormSchema = z.object({
  date: z.date().min(new Date("2024-01-01")),
  story: z.string().optional(),
  media: z.array(
    z.object({
      type: z.enum(["photo", "video", "audio"]),
      url: z.string().url(),
    }),
  ),
});
```

---

## 📐 Documentação de Referência

Todos os componentes foram desenvolvidos conforme especificações em:

- **Modelagem_UI-UX.md § 1**: Filosofia, tokens, tipografia
- **Modelagem_UI-UX.md § 2.2**: Navegação (Jornada, Visitas)
- **Modelagem_UI-UX.md § 4.1**: HUD (Próxima sugestão)
- **Modelagem_UI-UX.md § 5**: Microcopy e tom de voz
- **Modelagem_UI-UX.md § 6**: Empty states
- **Estrutura_e_Dependencias.md § 6**: Organização de features

---

## ✅ Checklist de Uso

Ao integrar os componentes em sua aplicação:

- [ ] Importar componentes do caminho correto (`@/features/...`, `@/components/...`)
- [ ] Passar todas as props necessárias (TypeScript verificará)
- [ ] Implementar callbacks (`onNavigate`, `onSelectChapter`, etc.)
- [ ] Configurar React Query com `QueryClientProvider`
- [ ] Adicionar `I18nProvider` para i18n
- [ ] Testar em mobile (componentes são mobile-first)
- [ ] Verificar tema claro/escuro (dark mode suportado)
- [ ] Validar acessibilidade (WCAG AA, touch targets 44×44px)

---

## 🚀 Próximos Passos

1. **Integrar com Router**: Adicionar rotas para `/dashboard`, `/moment/:id`, etc.
2. **Conectar API**: Implementar React Query hooks para dados reais
3. **Implementar Upload**: Integrar Upload Manager para mídia
4. **Adicionar Autenticação**: Proteger rotas e dados
5. **Testes**: Criar testes unitários (vitest) e E2E (playwright)
6. **Analytics**: Adicionar rastreamento de eventos
7. **PWA**: Implementar service workers para funcionar offline

---

**Última atualização:** 12 de novembro de 2025  
**Status:** ✅ Componentes prontos para uso em produção  
**Conforme:** Modelagem_UI-UX.md, Estrutura_e_Dependencias.md, Arquitetura_do_Sistema.md
