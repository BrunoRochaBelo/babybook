# ⚡ Quick Start - Usar os Componentes Migrados

**Tempo estimado:** 5 minutos

---

## 🎯 Objetivo

Integrar os componentes já implementados em sua aplicação.

---

## 1️⃣ Importar Dashboard

```tsx
import { Dashboard } from "@/features/dashboard/Dashboard";

export function DashboardPage() {
  return (
    <Dashboard
      babyName="Maria"
      onSelectChapter={(id) => {
        console.log("Capítulo selecionado:", id);
        // TODO: Navegar para editor de momento
      }}
      onNavigate={(section) => {
        console.log("Seção ativa:", section); // "memories" ou "visits"
        // TODO: Mostrar conteúdo da seção
      }}
      onSettings={() => {
        console.log("Abrir configurações");
        // TODO: Navegar para /settings
      }}
    />
  );
}
```

**Props obrigatórias:**

- `babyName` (string): Nome do bebê
- `onSelectChapter` (function): Callback ao clicar em capítulo
- `onNavigate` (function): Callback ao clicar em abas (Jornada/Visitas)
- `onSettings` (function): Callback para configurações

---

## 2️⃣ Importar MomentForm

```tsx
import { MomentForm } from "@/features/moment/MomentForm";
import { useNavigate } from "react-router-dom";

export function MomentPage() {
  const navigate = useNavigate();

  return (
    <MomentForm
      momentTitle="O Primeiro Sorriso"
      babyName="Maria"
      isRecurrent={true}
      existingRecordsCount={2}
      onBack={() => navigate("/dashboard")}
      onSave={() => {
        // TODO: Refetch capítulos
        navigate("/dashboard");
      }}
    />
  );
}
```

**Props obrigatórias:**

- `momentTitle` (string): Título do momento
- `babyName` (string): Nome do bebê
- `onBack` (function): Callback ao clicar em voltar
- `onSave` (function): Callback após salvar

**Props opcionais:**

- `momentDescription` (string): Descrição do momento
- `isRecurrent` (boolean): Pode ser registrado múltiplas vezes
- `existingRecordsCount` (number): Quantos já existem

---

## 3️⃣ FloatingNav (Já Integrada no Dashboard)

A navegação flutuante já está integrada no Dashboard. Se precisar usar isoladamente:

```tsx
import { FloatingNav } from "@/components/FloatingNav";
import { useState } from "react";

export function App() {
  const [activeSection, setActiveSection] = useState<"memories" | "visits">(
    "memories",
  );

  return (
    <>
      {activeSection === "memories" && <DashboardContent />}
      {activeSection === "visits" && <VisitsContent />}

      <FloatingNav
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />
    </>
  );
}
```

---

## 4️⃣ NotificationCenter (Já Integrada no Dashboard)

Já está no header do Dashboard. Para usar isoladamente:

```tsx
import { NotificationCenter } from "@/components/NotificationCenter";
import { useState } from "react";

export function Header() {
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "vaccine" as const,
      title: "Vacina Próxima",
      message: "Pentavalente (2ª dose) prevista para 15/11/2025",
      time: "2 dias atrás",
      isRead: false,
      action: {
        label: "Ver detalhes",
        onClick: () => console.log("Clicou"),
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

---

## 5️⃣ useTheme Hook

```tsx
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
```

**O que faz:**

- Gerencia tema light/dark
- Persiste em localStorage
- Respeita preferência do sistema

---

## 📋 Próximos Passos

### Para integração imediata:

1. **Copiar o código acima** em sua página
2. **Validar TypeScript** (sem erros?)
3. **Testar no navegador** (renderiza?)
4. **Conectar callbacks** (fazem o que deveriam?)

### Para implementação completa:

1. **React Query** - Buscar dados reais
2. **Upload** - Implementar upload de mídia
3. **Autenticação** - Proteger rotas
4. **Testes** - Adicionar testes

---

## 🎨 Design System

### Cores Disponíveis

```css
/* Use essas classes no Tailwind */
bg-background   /* #F7F3EF - Fundo */
text-foreground /* #2A2A2A - Texto */
bg-accent       /* #F2995D - Ações (botões, CTAs) */
text-muted      /* #C9D3C2 - Texto secundário */
bg-danger       /* #C76A6A - Erros */
```

### Tipografia Disponível

```css
font-serif   /* Títulos: Lora, Merriweather */
font-sans    /* Corpo: Inter, Manrope */
text-3xl     /* h1/Grandes títulos */
text-base    /* Padrão (16/24px) */
```

### Componentes

```css
rounded-2xl   /* Padrão para cards, buttons (24px) */
rounded-xl    /* Inputs, elementos menores (16px) */
shadow-lg     /* Para cards com profundidade */
```

---

## ✅ Checklist de Integração

- [ ] Dashboard importado e renderizando
- [ ] MomentForm importado (se necessário)
- [ ] FloatingNav funcionando (ou integrada no Dashboard)
- [ ] NotificationCenter funcionando (ou integrada no Dashboard)
- [ ] useTheme funcionando
- [ ] TypeScript sem erros
- [ ] Tema light/dark ativado
- [ ] Cores mostrando corretamente

---

## 🐛 Troubleshooting

### Erro: "Cannot find module @/features/dashboard/Dashboard"

**Solução:** Verificar alias `@` em `tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erro: "Cannot find module '@babybook/ui'"

**Solução:** Instalar dependências com `pnpm install`

### Componente não renderiza cores corretamente

**Solução:** Verificar que `tailwind.config.js` foi atualizado com tokens

### FloatingNav não aparece

**Solução:** Estará no bottom, verificar que `pb-32` está no container pai

---

## 📚 Mais Informações

- **Como usar cada componente?** → [COMPONENTES_GUIA.md](./COMPONENTES_GUIA.md)
- **Design tokens e cores?** → [DESIGN_MIGRATION_README.md](./DESIGN_MIGRATION_README.md#-design-system)
- **Integração com backend?** → [CHECKLIST_VALIDACAO_ARQUITETURA.md](./CHECKLIST_VALIDACAO_ARQUITETURA.md#-integrações)
- **Índice completo?** → [INDEX.md](./INDEX.md)

---

## 🎉 Pronto!

Parabéns! Você já tem:

- ✅ Design migrado
- ✅ Componentes funcionais
- ✅ Design system implementado
- ✅ Documentação completa

**Agora é só integrar e divertir-se! 🚀**
