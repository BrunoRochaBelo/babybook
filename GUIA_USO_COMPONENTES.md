# 🚀 Guia de Uso - Componentes Entregues

## Como Usar os Componentes

### 1. Dashboard Layout (Componente Principal)

O componente `DashboardLayout` gerencia toda a navegação do app.

```tsx
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";

export function App() {
  return <DashboardLayout babyName="Sofia" />;
}
```

**Props:**

- `babyName`: string - Nome do bebê a exibir

### 2. Navegação Entre Tabs

A navegação ocorre automaticamente através do componente `FloatingNav` que está integrado em cada tela:

- **Memórias** (BookHeart icon) → Dashboard com capítulos
- **Saúde** (Stethoscope icon) → HealthModule com vacinas e crescimento
- **Visitas** (Users icon) → Guestbook com livro de visitas

### 3. Fluxo: Memórias → Capítulo → Momento

1. Clique em um capítulo no Dashboard
2. Abre ChapterView mostrando momentos do capítulo
3. Clique em um momento "pending" para abrir MomentForm
4. Registre o momento com data, história e mídia
5. Salve para voltar ao Dashboard

### 4. Estrutura de Arquivos

```
apps/web/src/
├── components/
│   ├── ChapterView.tsx          ← Visualizar capítulo
│   ├── HealthModule.tsx         ← Saúde (vacinas + crescimento)
│   ├── Guestbook.tsx            ← Livro de visitas
│   ├── MomentForm.tsx           ← Registrar momento
│   ├── FloatingNav.tsx          ← Navegação 3 tabs
│   ├── Dashboard.tsx            ← Dashboard memórias (ATUALIZADO)
│   └── ...outros
└── features/dashboard/
    ├── Dashboard.tsx            ← Componente Dashboard
    ├── components/
    │   └── DashboardLayout.tsx  ← Orquestrador
    └── pages/
        └── MainDashboardPage.tsx ← Página principal
```

---

## 🎨 Design System

### Usar Cores do Design System

Todas as cores estão configuradas em `tailwind.config.js`:

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-white">Primário</button>
  <button className="bg-accent">Acentuado</button>
  <button className="border border-border">Com borda</button>
</div>
```

### Padrões de Componentes

**Cards:**

```tsx
<div className="p-4 sm:p-6 bg-card border border-border rounded-3xl">
  Conteúdo
</div>
```

**Botões:**

```tsx
<button className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white transition-colors">
  Botão
</button>
```

**Headers Sticky:**

```tsx
<div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
  Conteúdo do header
</div>
```

---

## 🔧 Personalização

### Mudar Nome do Bebê

```tsx
<DashboardLayout babyName="Maria" />
```

### Customizar Dados de Vacinas

Edite `HealthModule.tsx` linha ~20:

```tsx
const vaccines = [
  {
    age: "Ao nascer",
    items: [
      { name: "BCG", status: "completed" as const, date: "10/02/2024" },
      // ... adicione mais
    ],
  },
];
```

### Customizar Mensagens do Guestbook

Edite `Guestbook.tsx` linha ~22:

```tsx
const [messages, setMessages] = useState([
  {
    id: 1,
    name: "Nome",
    message: "Mensagem aqui",
    type: "approved" as const,
    date: "15/03/2024",
    hasAudio: true,
    hasPhoto: false,
  },
  // ... adicione mais
]);
```

---

## 📱 Responsividade

Todos os componentes usam breakpoints do Tailwind:

- **Mobile:** sm: 640px
- **Tablet:** md: 768px, lg: 1024px
- **Desktop:** xl: 1280px, 2xl: 1536px

Exemplo:

```tsx
<h1 className="text-2xl sm:text-3xl">Título</h1>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

---

## 🎯 Para Backend Integration

### Callbacks Disponíveis

Todos os componentes têm callbacks para integração com backend:

**Dashboard:**

- `onSelectChapter(chapterId)` → Quando clica em capítulo
- `onNavigate(section)` → Quando troca tab
- `onSettings()` → Quando clica em settings

**ChapterView:**

- `onBack()` → Volta para Dashboard
- `onAddMoment(momentId)` → Abre MomentForm

**MomentForm:**

- `onSave()` → Salva o momento (aqui você chama a API)
- `onBack()` → Cancela

**HealthModule/Guestbook:**

- `onNavigate(section)` → Troca de tab
- `onBack()` → Volta para Dashboard

### Exemplo de Integração

```tsx
const handleSelectChapter = async (chapterId: string) => {
  const chapter = await api.getChapter(chapterId);
  setSelectedChapter(chapter);
  // Renderizar ChapterView
};

const handleSaveMoment = async (moment: MomentData) => {
  const saved = await api.saveMoment(moment);
  toast.success("Momento salvo!");
  onBack();
};
```

---

## 🧪 Testes

### Testar Navegação

1. Iniciar app: `pnpm dev`
2. Clicar na aba "Saúde" → HealthModule aparece
3. Clicar na aba "Visitas" → Guestbook aparece
4. Clicar na aba "Memórias" → Dashboard aparece

### Testar ChapterView

1. No Dashboard, clicar em um capítulo
2. ChapterView abre com lista de momentos
3. Clicar em "Registrar agora" em um momento
4. MomentForm abre

### Testar MomentForm

1. Preencher data obrigatória
2. Clicar "Adicionar Foto/Vídeo/Áudio"
3. Ver arquivo adicionado
4. Clicar "Guardar Momento"
5. Toast aparece e volta ao Dashboard

---

## 🐛 Troubleshooting

**Problema:** Build falha com erro de tipos

**Solução:**

```bash
cd apps/web
pnpm run build
```

Se persistir, limpar cache:

```bash
rm -rf node_modules .pnpm-store
pnpm install
```

---

**Problema:** FloatingNav não aparece

**Solução:** Certifique-se de que `onNavigate` está sendo passado corretamente para `<Dashboard>` e outros componentes.

---

**Problema:** Animações lentas

**Solução:** Verifique se `motion/react` está instalado:

```bash
pnpm add motion@latest
```

---

## 📚 Documentação Referência

- **Design System:** `docs/Modelagem_UI-UX.md`
- **Arquitetura:** `docs/Estrutura_e_Dependencias.md`
- **Migração Design:** `DESIGN_MIGRATION_README.md`

---

**Versão:** 1.0  
**Atualizado:** 12 de novembro de 2025  
**Status:** ✅ Pronto para Produção
