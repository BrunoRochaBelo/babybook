# 🔮 Roadmap Próximas Fases - Baby Book

**Documento estratégico para desenvolvimento futuro**  
**Data:** 12 de novembro de 2025

---

## 📍 Onde Estamos

✅ **Fase Concluída:** Design System & Componentes Base

- 8 componentes implementados
- Design system completo
- Documentação abrangente
- 0 débito técnico

---

## 🚀 Fase 1: Backend Integration (Semana 1-2)

### Objetivo

Conectar componentes com API real e implementar gerenciamento de dados.

### Tasks

#### 1.1 React Query Integration

```typescript
// apps/web/src/hooks/useChapters.ts
export const useChapters = () =>
  useQuery({
    queryKey: ["chapters"],
    queryFn: () => api.get("/me/chapters"),
  });

export const useSaveMoment = () =>
  useMutation({
    mutationFn: (data) => api.post("/moments", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chapters"] }),
  });
```

**Referência:** docs/Estrutura_e_Dependencias.md § 8.1

**Dependências:**

- @tanstack/react-query (já instalado)
- Axios ou Fetch client

#### 1.2 API Client Setup

```typescript
// apps/web/src/lib/api-client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para autenticação
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### 1.3 Zod Validation Schemas

```typescript
// apps/web/src/lib/schemas.ts
import { z } from "zod";

export const momentFormSchema = z.object({
  date: z.date(),
  story: z.string().optional(),
  media: z.array(
    z.object({
      type: z.enum(["photo", "video", "audio"]),
      url: z.string().url(),
    }),
  ),
});

export type MomentFormInput = z.infer<typeof momentFormSchema>;
```

**Referência:** docs/Estrutura_e_Dependencias.md § 8.3

#### 1.4 Update MomentForm com Mutation

```typescript
// apps/web/src/features/moment/MomentForm.tsx
import { useSaveMoment } from "@/hooks/useSaveMoment";

export function MomentForm(props: MomentFormProps) {
  const { mutate: saveMoment, isPending } = useSaveMoment();

  const handleSave = async () => {
    const data = momentFormSchema.parse({
      date: new Date(date),
      story,
      media: uploadedFiles.map(f => ({ type: f.type, url: f.url })),
    });

    saveMoment(data, {
      onSuccess: () => {
        toast.success("Momento guardado!");
        onSave();
      },
    });
  };

  return (
    // ... componente
    <button disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</button>
  );
}
```

#### 1.5 Update Dashboard com Query

```typescript
// apps/web/src/features/dashboard/Dashboard.tsx
import { useChapters } from "@/hooks/useChapters";

export function Dashboard(props: DashboardProps) {
  const { data: chapters, isLoading } = useChapters();

  if (isLoading) return <LoadingState />;

  const chaptersWithProgress = chapters?.map(ch => ({
    ...ch,
    progress: /* calcular de ch.moments */,
  })) || [];

  return (
    // ... componente com dados reais
  );
}
```

### Checklist

- [ ] API client criado
- [ ] React Query hooks implementados
- [ ] Zod schemas definidos
- [ ] MomentForm integrado
- [ ] Dashboard busca dados reais
- [ ] Testes com mock server (MSW)

### Tempo Estimado: 3-4 dias

---

## 🚀 Fase 2: Autenticação & Upload (Semana 3-4)

### Objetivo

Proteger rotas e implementar upload de arquivos.

### 2.1 Autenticação com JWT

#### Setup Auth Store (Zustand)

```typescript
// apps/web/src/store/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        set({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
        });
      },
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" },
  ),
);
```

**Referência:** docs/Estrutura_e_Dependencias.md § 8.2

#### Protected Routes

```typescript
// apps/web/src/app/ProtectedRoute.tsx
export function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return element;
}

// No router
const router = createBrowserRouter([
  { path: "/dashboard", element: <ProtectedRoute element={<Dashboard />} /> },
  { path: "/moment/:id", element: <ProtectedRoute element={<MomentForm />} /> },
]);
```

### 2.2 Upload de Arquivos

#### Integration com Upload Manager (apps/workers)

```typescript
// apps/web/src/lib/upload-manager.ts
export async function uploadFile(
  file: File,
): Promise<{ url: string; type: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", file.type.split("/")[0]); // 'video', 'audio', 'image'

  const response = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progress) => {
      console.log(
        `Upload: ${Math.round((progress.loaded / progress.total) * 100)}%`,
      );
    },
  });

  return response.data;
}
```

#### Progress Bar em MomentForm

```typescript
const [uploadProgress, setUploadProgress] = useState(0);

const handleFileUpload = async (file: File) => {
  try {
    const { url } = await uploadFile(file);
    setUploadedFiles([...uploadedFiles, { type: file.type, url }]);
  } catch (error) {
    toast.error("Erro ao fazer upload");
  }
};
```

### Checklist

- [ ] Auth store implementado
- [ ] Login/logout funcionando
- [ ] Protected routes ativas
- [ ] Upload manager integrado
- [ ] Progress bar visível
- [ ] Autenticação em requests

### Tempo Estimado: 3-4 dias

---

## 🚀 Fase 3: Features Adicionais (Semana 5-6)

### 3.1 Livro de Visitas (Visits)

#### Components

```typescript
// apps/web/src/features/visits/VisitsTimeline.tsx
export function VisitsTimeline() {
  const { data: visits } = useQuery({
    queryKey: ["visits"],
    queryFn: () => api.get("/visits"),
  });

  return (
    <div className="space-y-4">
      {visits?.map(visit => (
        <VisitCard key={visit.id} visit={visit} />
      ))}
    </div>
  );
}

// apps/web/src/features/visits/VisitForm.tsx
export function VisitForm() {
  // Form para adicionar novo visitante
  // Timeline visual
  // Fotos da visita
}
```

#### Design Tokens

- Mesma paleta (background, accent, muted)
- Tipografia similar (serif para títulos)
- Animações com motion/react

### 3.2 Perfil de Usuário

```typescript
// apps/web/src/features/profile/ProfilePage.tsx
export function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  return (
    <div className="space-y-6">
      <AvatarUpload />
      <PersonalInfo />
      <GuardiansList />
      <SecuritySettings />
    </div>
  );
}
```

### 3.3 Compartilhamento

```typescript
// apps/web/src/features/sharing/ShareMoment.tsx
export function ShareMoment({ momentId }: { momentId: string }) {
  const { mutate: share } = useMutation({
    mutationFn: (guardianEmail: string) =>
      api.post(`/moments/${momentId}/share`, { guardianEmail }),
  });

  return (
    <div>
      <input type="email" placeholder="Email do responsável" />
      <button onClick={() => share(email)}>Compartilhar</button>
    </div>
  );
}
```

### Checklist

- [ ] Visitas timeline implementada
- [ ] Visit form funcionando
- [ ] Profile page pronta
- [ ] Perfil pode ser editado
- [ ] Compartilhamento funciona
- [ ] Design consistente com Dashboard

### Tempo Estimado: 4-5 dias

---

## 🚀 Fase 4: UX & Performance (Semana 7-8)

### 4.1 Offline First

```typescript
// apps/web/src/lib/offline.ts
import { openDB } from "idb";

export async function cacheMoment(moment: Moment) {
  const db = await openDB("babybook");
  await db.add("moments", moment);
}

export async function syncPendingMoments() {
  const db = await openDB("babybook");
  const pending = await db.getAll("moments");

  for (const moment of pending) {
    try {
      await api.post("/moments", moment);
      await db.delete("moments", moment.id);
    } catch (error) {
      console.error("Sync error:", error);
    }
  }
}
```

### 4.2 PWA

```typescript
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

export default {
  plugins: [
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Baby Book",
        short_name: "Baby",
        icons: [...],
      },
    }),
  ],
};
```

### 4.3 Dark Mode Refinado

```typescript
// tailwind.config.js
export default {
  darkMode: "class",
  theme: {
    extend: {
      // Dark mode specific colors
    },
  },
};
```

### Checklist

- [ ] Service workers implementados
- [ ] Offline functionality testada
- [ ] PWA instalável
- [ ] Dark mode completo
- [ ] Performance > 90 Lighthouse
- [ ] Mobile speed otimizado

### Tempo Estimado: 3-4 dias

---

## 🚀 Fase 5: Qualidade (Semana 9-10)

### 5.1 Testes Unitários (vitest)

```typescript
// apps/web/src/features/dashboard/__tests__/Dashboard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dashboard } from "../Dashboard";

describe("Dashboard", () => {
  it("renderiza título do santuário", () => {
    render(
      <Dashboard
        babyName="Maria"
        onSelectChapter={vi.fn()}
        onNavigate={vi.fn()}
        onSettings={vi.fn()}
      />
    );
    expect(screen.getByText(/Santuário de Maria/)).toBeInTheDocument();
  });

  it("chama onSelectChapter ao clicar em capítulo", () => {
    const onSelectChapter = vi.fn();
    render(
      <Dashboard {...props} onSelectChapter={onSelectChapter} />
    );
    // ... teste interação
  });
});
```

**Meta:** 80% cobertura em features críticas

### 5.2 Testes E2E (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from "@playwright/test";

test("fluxo completo de registrar momento", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Santuário")).toBeVisible();

  await page.click("text=Registrar o Grande Dia");
  await page.fill("input[type=date]", "2025-11-12");
  await page.fill("textarea", "Meu primeiro momento");
  await page.click("button:has-text('Guardar no Santuário')");

  await expect(page.getByText("Momento registrado")).toBeVisible();
});
```

### Checklist

- [ ] 80%+ cobertura vitest
- [ ] E2E tests em rotas críticas
- [ ] Axe accessibility audit
- [ ] Lighthouse score > 90
- [ ] Bundle size otimizado
- [ ] CI/CD pipeline verde

### Tempo Estimado: 4-5 dias

---

## 📅 Cronograma Sugerido

| Fase                        | Semanas | Status      |
| --------------------------- | ------- | ----------- |
| Design System & Componentes | ✅ Done | Completo    |
| Backend Integration         | 1-2     | Próximo     |
| Autenticação & Upload       | 3-4     | Após fase 1 |
| Features Adicionais         | 5-6     | Após fase 2 |
| UX & Performance            | 7-8     | Após fase 3 |
| Testes & QA                 | 9-10    | Contínuo    |

**Total estimado:** 10 semanas (2,5 meses)

---

## 📊 Métricas de Sucesso

| Métrica                 | Meta | Atual        |
| ----------------------- | ---- | ------------ |
| TypeScript Errors       | 0    | ✅ 0         |
| Component Coverage      | 80%+ | ⏳ A iniciar |
| E2E Coverage            | 90%+ | ⏳ A iniciar |
| Lighthouse Score        | 90+  | ⏳ A validar |
| Accessibility (WCAG AA) | 100% | ✅ 100%      |
| Design System Tokens    | 100% | ✅ 100%      |

---

## 🔄 Processo de Desenvolvimento

### Para cada task:

1. **Planejamento**
   - Definir acceptance criteria
   - Estimar tempo
   - Atribuir responsável

2. **Desenvolvimento**
   - Criar branch: `feature/...`
   - Seguir código review checklist
   - Referencial: CHECKLIST_VALIDACAO_ARQUITETURA.md

3. **Teste**
   - Teste manual
   - Teste automatizado
   - Teste de acessibilidade

4. **Review**
   - Code review
   - Design review
   - Performance review

5. **Deploy**
   - Merge para main
   - Deploy em staging
   - Deploy em produção

---

## 📚 Referências para Próximas Fases

- **React Query:** docs/Estrutura_e_Dependencias.md § 8.1
- **Zustand:** docs/Estrutura_e_Dependencias.md § 8.2
- **Zod Validation:** docs/Estrutura_e_Dependencias.md § 8.3
- **Upload:** docs/Estrutura_e_Dependencias.md § 9
- **Testes:** docs/Estrutura_e_Dependencias.md § 15
- **Acessibilidade:** docs/Estrutura_e_Dependencias.md § 11
- **DevOps:** docs/DevOps_Observabilidade.md

---

## 🎯 Pontos de Atenção

### Mantém Conformidade Arquitetônica

- Respeitar § 3.3 em estrutura
- Seguir § 6 em organização
- Validar contra § 14.1 em código

### Design System

- Usar tokens de tailwind.config.js
- Manter tipografia serif/sans
- Respeitar paleta de cores

### Documentação

- Atualizar documentos ao mudar spec
- Documentação é fonte de verdade
- Referenciar § apropriados

---

## ✨ Considerações Finais

1. **Debt Técnico:** Manter zero
2. **Performance:** Monitorar continuamente
3. **Acessibilidade:** Never compromise
4. **Documentação:** Keep it updated
5. **Code Quality:** Padrão ou acima

---

**Última Atualização:** 12 de novembro de 2025  
**Próxima Revisão:** Após Fase 1 completada  
**Responsável:** Tech Lead / Product Manager
