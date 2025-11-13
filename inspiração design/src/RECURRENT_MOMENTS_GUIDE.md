# Guia de Momentos Recorrentes - Cofre de Memórias Digital

## 📋 Visão Geral

Este documento descreve as melhorias implementadas para aprimorar a usabilidade de momentos recorrentes no aplicativo Cofre de Memórias Digital.

## ✨ Funcionalidades Implementadas

### 1. **Visualização de Momentos** (`MomentViewer.tsx`)

Novo componente que permite visualizar registros existentes de momentos:

#### Para Momentos Únicos (completed):
- Exibe o registro único com todos os detalhes
- Data formatada e tempo decorrido ("há 3 dias")
- Galeria de mídias (fotos, vídeos, áudios)
- História completa do momento
- Botão para editar o registro

#### Para Momentos Recorrentes:
- **Timeline de Registros**: Lista cronológica de todos os registros
- **Indicador Visual**: Cada registro mostra:
  - Data e tempo decorrido
  - Idade do bebê no momento
  - Preview de mídias (até 3 thumbnails)
  - Preview da história
- **Detalhes Expandidos**: Ao clicar em um registro, mostra:
  - Galeria completa de mídias
  - História completa
  - Opções de edição
- **Botão Fixo**: "Adicionar Novo Registro" sempre visível na parte inferior

### 2. **Melhorias no ChapterView** (`ChapterView.tsx`)

#### Navegação Inteligente:
- ✅ **Momento Pendente** → Abre formulário para registrar
- 👁️ **Momento Completo** → Abre visualizador
- 🔄 **Momento Recorrente** → Abre visualizador com timeline

#### Botões de Ação Claros:
- Momento Pendente: Botão "Registrar" (verde primário)
- Momento Completo: Botão "Ver" (ghost)
- Momento Recorrente: Botão "Ver X" (outline accent)

#### Preview de Momentos Recorrentes:
- Mostra mini-cards com data e número de mídias dos últimos 2 registros
- Indicador "+X" se houver mais registros
- Scroll horizontal suave (scrollbar oculta)

#### Textos Descritivos:
- "X registros • Toque para ver"
- "1 registro • Toque para ver e adicionar mais"
- "Momento recorrente • Toque para começar" (quando não tem registros ainda)

### 3. **Aprimoramentos no MomentForm** (`MomentForm.tsx`)

#### Indicadores Visuais:
- Badge "Recorrente" no cabeçalho
- Texto adaptativo:
  - Sem registros: "Este momento pode ser registrado múltiplas vezes"
  - Com registros: "Adicione mais um registro (você já tem X)"

#### Componente Educativo (`RecurrentMomentExplainer.tsx`):
- Card destacado explicando o conceito de momento recorrente
- Ícones ilustrativos para cada benefício:
  - 📅 Cada registro tem sua própria data
  - 📝 Lista em timeline
  - ➕ Adicione quantos quiser
- Contador de registros existentes
- Dica contextual: "Este será o Xº registro"

### 4. **Componente de Preview** (`RecurrentMomentPreview.tsx`)

Mini-cards que mostram:
- Data formatada (ex: "13 fev")
- Ícone de calendário
- Número de mídias anexadas
- Design compacto com scroll horizontal

## 🎯 Fluxos de Usuário

### Fluxo 1: Adicionar Primeiro Registro de Momento Recorrente
1. Usuário vê momento com badge "Recorrente"
2. Clica para registrar
3. Vê explicação educativa sobre momentos recorrentes
4. Preenche formulário
5. Salva registro

### Fluxo 2: Ver e Adicionar Mais Registros
1. Usuário vê momento recorrente com contador "3 registros"
2. Vê preview dos últimos registros
3. Clica para ver
4. **Timeline completa é exibida** com todos os 3 registros
5. Pode clicar em qualquer registro para ver detalhes
6. Pode clicar em "Adicionar Novo Registro" (botão fixo)
7. Volta ao formulário para adicionar o 4º registro

### Fluxo 3: Visualizar Momento Único Já Registrado
1. Usuário clica em momento com status "completed"
2. Vê visualizador com todos os detalhes do registro único
3. Pode editar se necessário

## 🎨 Design e UX

### Cores e Identidade Visual:
- **Primary (Peach)**: Ações principais, momentos completos
- **Accent (Terracota)**: Momentos recorrentes, destaques especiais
- **Secondary (Sage)**: Elementos de suporte

### Animações:
- Fade-in suave para cards (delay escalonado)
- Scale animation nos previews
- Transições suaves entre estados

### Responsividade:
- Design mobile-first
- Botões com altura mínima de 48px (acessibilidade)
- Textos adaptativos para telas pequenas
- Preview com scroll horizontal em mobile

### Acessibilidade:
- Textos descritivos claros
- Hierarquia visual bem definida
- Feedback visual imediato para interações
- Indicadores de estado (badges, ícones)

## 📊 Dados Mock

### Estrutura de Dados Expandida:

```typescript
interface MomentRecord {
  id: string;
  date: string; // ISO format
  story?: string;
  media: { type: 'photo' | 'video' | 'audio'; url: string; thumbnail?: string }[];
  ageAtMoment?: string; // "Sofia com 3 dias"
}

interface Moment {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'recurrent';
  thumbnail?: string;
  date?: string;
  count?: number;
  records?: MomentRecord[];
}
```

### Exemplo de Momento Recorrente:

```typescript
{
  id: "visitors",
  title: "Primeiras visitas",
  description: "Família e amigos conhecendo",
  status: 'recurrent',
  count: 3,
  records: [
    {
      id: "visitors-1",
      date: "2024-02-13",
      story: "Os avós vieram conhecer a neta...",
      media: [{ type: 'photo', url: '#' }],
      ageAtMoment: "Sofia com 3 dias"
    },
    // ... mais registros
  ]
}
```

## 🔄 Próximas Melhorias Sugeridas

1. **Filtros e Busca**: Filtrar registros recorrentes por período
2. **Estatísticas**: Mostrar gráficos de frequência de momentos recorrentes
3. **Exportação**: Exportar timeline de momento recorrente como PDF
4. **Comparação**: Visualização lado a lado de registros do mesmo tipo
5. **Tags**: Sistema de tags para categorizar registros recorrentes
6. **Lembretes**: Notificações para registrar momentos recorrentes periódicos

## 📱 Compatibilidade

- ✅ Mobile (iOS/Android)
- ✅ Tablet
- ✅ Desktop
- ✅ Modo escuro
- ✅ Modo claro

## 🧪 Testes Recomendados

1. **Navegação**: Testar todos os fluxos de clique em momentos diferentes
2. **Scroll**: Verificar preview horizontal em mobile
3. **Animações**: Garantir suavidade em dispositivos low-end
4. **Modo Escuro**: Validar contraste e legibilidade
5. **Acessibilidade**: Testar com leitor de tela

---

**Última atualização**: Novembro 2025
**Versão**: 1.0
