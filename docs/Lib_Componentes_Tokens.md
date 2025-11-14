# Design System: Biblioteca de Componentes & Tokens

Este documento é um complemento ao "Design System — Baby Book" e foca em transformar os princípios de design em código. Ele detalha os pacotes, tokens, componentes React, padrões de acessibilidade e convenções de uso dentro do monorepo, descrevendo como o produto se transforma em uma UI reutilizável, opinada e rastreável.

---

## 1. Visão Geral da Biblioteca de Design

### 1.1. Objetivo

Fornecer uma base de UI única e consistente para todos os frontends do Baby Book (aplicativo, web, painéis internos), garantindo:

- **Tokens de design versionados**: Cores, tipografia, espaçamento, movimento e `z-index`.
- **Componentes React reutilizáveis**: Alinhados ao Design System e à Modelagem de UI/UX.
- **Padrões explícitos**: Acessibilidade e estados (vazio, carregando, erro, sucesso).
- **Processos de evolução claros**: Sem "forks" visuais por aplicativo ou temas paralelos improvisados.

A biblioteca deve permitir que o time de produto se concentre em fluxos e momentos, não em pixels e sombras a cada nova tela.

### 1.2. Princípios

- **Fonte Única de Verdade**: Tokens e componentes residem em pacotes compartilhados e versionados. Os aplicativos nunca devem duplicar estilos críticos localmente.
- **Domínio em Primeiro Lugar**: Componentes como `MomentCard` e `GuestbookEntryCard` são de primeira classe. A UI fala a linguagem do produto: Jornada, Saúde, Visitas, Cápsula, etc.
- **Calma Intencional na Implementação**: Props enxutas, estados previsíveis e nomes claros. Componentes devem ser fáceis de usar e difíceis de usar errado.
- **Mobile-first de Verdade**: Componentes são projetados para o contexto de uso real (pais cansados, uma mão só), com áreas de toque amplas e hierarquia visual simples.
- **Acessibilidade desde o Início**: Foco visível, atributos `aria-*` coerentes, contraste adequado e suporte a leitores de tela são prioridades.
- **Compatibilidade Evolutiva**: Mudanças devem preservar a compatibilidade. Quando a quebra é inevitável, o versionamento deve ser claro e a migração, guiada.

---

## 2. Estrutura de Pacotes no Monorepo

### 2.1. Organização

A estrutura sugerida para os pacotes do Design System é:

- `packages/design-tokens/`: Tokens de design (JSON, TS, CSS vars).
- `packages/ui-core/`: Componentes atômicos e genéricos (`Button`, `TextField`, `Card`).
- `packages/ui-domain/`: Componentes de domínio do Baby Book (`MomentCard`, `AlbumCover`).
- `packages/icons/`: Wrapper de ícones e aliases padronizados.

**Nomes no NPM:**

- `@babybook/design-tokens`
- `@babybook/ui-core`
- `@babybook/ui-domain`
- `@babybook/icons`

### 2.2. Responsabilidades

- **`@babybook/design-tokens`**: Define a linguagem visual (cores, tipografia, etc.). É agnóstico de framework.
- **`@babybook/ui-core`**: Implementa os componentes básicos da UI em React, com foco em acessibilidade e responsividade, sem conhecimento do domínio do negócio.
- **`@babybook/ui-domain`**: Usa o `ui-core` para construir componentes que materializam o domínio do Baby Book (Jornada, Saúde, Visitas).
- **`@babybook/icons`**: Centraliza o uso de ícones para evitar divergências entre os aplicativos.

### 2.3. Integração com Apps

Os aplicativos devem consumir apenas os pacotes do Design System. Estilos específicos de tela podem existir, mas como complementos, nunca como substitutos dos tokens.

---

## 3. Design Tokens

Os tokens refletem as decisões da **Modelagem de UI/UX** e do **Catálogo de Momentos**: paleta quente, fontes serifadas para memórias e sans-serif para UI.

### 3.1. Organização de Arquivos

No pacote `@babybook/design-tokens`:

```
src/
├── tokens.colors.json
├── tokens.typography.json
├── tokens.spacing.json
├── tokens.radius.json
├── tokens.elevation.json
├── tokens.motion.json
├── tokens.zindex.json
└── index.ts
```

A partir desses arquivos, podemos gerar variáveis CSS, objetos TypeScript e tokens para o Figma.

### 3.2. Paleta de Cores

Mapeamento da paleta funcional:

- `bb-color-bg`: Fundo de álbum / papel quente (`#F7F3EF`).
- `bb-color-ink`: Texto principal (`#2A2A2A`).
- `bb-color-muted`: Bordas e divisores (`#C9D3C2`).
- `bb-color-accent`: Ações principais e CTAs (`#F2995D`).
- `bb-color-danger`: Erros e ações destrutivas (`#C76A6A`).

### 3.3. Tipografia

- **Títulos de momentos**: Fonte serifada (ex: `Lora`).
- **Corpo de texto e UI**: Fonte sans-serif (ex: `Inter`).

**Aliases por função:**

- `bb-text-heading-1`: Serif, 28/34, para títulos principais.
- `bb-text-heading-2`: Serif, 22/28, para capítulos.
- `bb-text-heading-3`: Serif, 18/24, para títulos de cards.
- `bb-text-body`: Sans, 16/24, para texto corrido.
- `bb-text-caption`: Sans, 13/18, para metadados.

### 3.4. Layout, Espaçamento e Movimento

- **Escala de espaçamento**: Múltiplos de 4px (4, 8, 12, 16, 24, 32, 40).
- **Raio e sombras**: `sm` (4px), `md` (8px), `lg` (16px) para um visual de "álbum arredondado".
- **Elevação**: Escala de `0` a `3` para sombras (cards, modais, toasts).
- **Movimento**: `fast` (150ms), `normal` (250ms), `slow` (300ms).
- **Z-index**: Camadas previsíveis para conteúdo, navegação, modais e toasts.

### 3.5. Exemplos de Tokens em JSON

**Cores:**
```json
{
  "bb-color-bg": { "value": "#F7F3EF", "type": "color" },
  "bb-color-ink": { "value": "#2A2A2A", "type": "color" },
  "bb-color-accent": { "value": "#F2995D", "type": "color" }
}
```

**Tipografia:**
```json
{
  "bb-font-family-heading": {
    "value": "'Lora', serif",
    "type": "fontFamily"
  },
  "bb-font-size-md": { "value": 16, "type": "fontSize" }
}
```

**Espaçamento:**
```json
{
  "bb-space-4": { "value": 16, "type": "spacing" },
  "bb-radius-lg": { "value": 16, "type": "borderRadius" }
}
```

---

## 4. @babybook/ui-core — Componentes Genéricos

Oferece os blocos de construção básicos da UI, estilizados com o "jeito Baby Book", mas sem conhecimento de domínio.

### 4.1. Convenções

- Componentes em `PascalCase` (`Button`, `Card`).
- Props pensadas para mobile-first.
- Estilos derivados de tokens.
- Acessibilidade como requisito.

### 4.2. Componentes Principais

- **Tipografia e Layout**: `Text`, `Heading`, `Box`, `Stack`, `Avatar`, `Tag`, `EmptyState`.
- **Formulários**: `TextField`, `TextArea`, `NumberInput`, `DatePicker`, `TimeInput`, `Select`, `ChipSelect`, `Checkbox`, `Radio`, `Switch`.
- **Upload e Mídia**: `MediaUploadSlot`, `MediaUploadGrid`, `XorMediaSlot`, `AudioRecorder`.
- **Feedback e Estrutura**: `Card`, `Dialog`, `BottomSheet`, `Tabs`, `Toast`, `Alert`, `Skeleton`, `Spinner`, `Tooltip`.

---

## 5. @babybook/ui-domain — Componentes de Domínio

Encapsula os padrões de negócio do Baby Book, alinhados ao **Catálogo de Momentos** e à **Modelagem de UI/UX**.

### 5.1. Componentes por Livro/Funcionalidade

- **Jornada (Livro de Memórias)**:
  - `MomentHUD`: Sugestão do próximo momento.
  - `MomentsTimeline`: Lista de `MomentCard`.
  - `MomentCard`: Visualização de um momento.
  - `MomentTemplateForm`: Formulário genérico para templates de momentos.
  - `MomentMediaSlots`: Gerenciador de uploads de mídia com base nas regras do template.

- **Saúde (Livro de Saúde)**:
  - `HealthMeasurementForm`: Formulário para peso, altura, etc.
  - `HealthMeasurementChart`: Gráfico de curvas de crescimento.
  - `PediatricVisitList`: Lista de visitas ao pediatra.
  - `VaultDocumentSection`: Cofre para documentos importantes.

- **Visitas (Livro de Visitas)**:
  - `GuestbookLayout`: Estrutura da seção de visitas.
  - `GuestbookEntryCard`: Card com uma mensagem de visitante.
  - `GuestbookComposer`: Formulário para deixar uma mensagem.

- **Estruturas Gerais**:
  - `ChildProfileHeader`: Cabeçalho do perfil da criança.
  - `FamilyTreeView`: Visualização da árvore genealógica.
  - `CapsuleLayout`: Layout da Cápsula do Tempo.

- **PoD, Export, Quota e Upsell**:
  - `ExportJobStatus`: Status de exportação.
  - `PodCurationList`: Lista de momentos para o álbum impresso.
  - `QuotaBanner`: Avisos sobre o uso de armazenamento.
  - `RecurringMomentUpsellBanner`: Banner para upgrade de momentos recorrentes.

---

## 6. Integração e Exemplos

### 6.1. Exemplo: `Button` usando Tokens

```jsx
import { tokens } from '@babybook/design-tokens';
import { ComponentProps } from 'react';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', ...rest }: ButtonProps) {
  const styles = {
    borderRadius: tokens.radius['bb-radius-md'].value,
    backgroundColor: tokens.colors[`bb-color-${variant}`].value,
    // ... outros estilos
  };

  return <button style={styles} {...rest} />;
}
```

### 6.2. Exemplo: `MomentCard` usando `ui-core`

```jsx
import { Card, Text, HStack, VStack, Icon } from '@babybook/ui-core';

export function MomentCard(props) {
  const { title, date, mediaSummary } = props;

  return (
    <Card clickable>
      <VStack gap="md">
        {/* Thumbnail */}
        <VStack gap="xs">
          <Text variant="heading-3">{title}</Text>
          <Text variant="caption">{date}</Text>
        </VStack>
        <HStack gap="sm">
          <Text variant="caption">{mediaSummary.photos} fotos</Text>
          {mediaSummary.hasVideo && <Icon name="video" />}
        </HStack>
      </VStack>
    </Card>
  );
}
```

---

## 7. Theming (Modo Claro/Escuro)

A estratégia inicial é focar em um `theme-light` bem otimizado, com um `theme-dark` planejado para o futuro. A troca de tema será gerenciada por um `ThemeProvider` no `ui-core`.

---

## 8. Governança

### 8.1. Versionamento

- **`@babybook/design-tokens`**: Major version para mudanças visuais que quebram a compatibilidade.
- **`@babybook/ui-*`**: Major version para mudanças na API dos componentes.

### 8.2. Processo para Novos Componentes

1.  **Proposta**: Descrever o problema e o impacto.
2.  **Design**: Criar o design no Figma usando tokens existentes.
3.  **Revisão**: Alinhar com a engenharia sobre props, estados e acessibilidade.
4.  **Implementação**: Desenvolver o componente no pacote apropriado.
5.  **Documentação**: Atualizar este documento e o changelog.

---

## 9. Próximos Passos

1.  Mapear o Design System para arquivos de tokens reais.
2.  Criar o esqueleto dos pacotes `@babybook/design-tokens` и `@babybook/ui-core`.
3.  Implementar o conjunto mínimo de componentes: `Text`, `Button`, `Card`, `Modal`, `Toast`.
4.  Criar os primeiros componentes de domínio: `MomentCard`, `AlbumCover`, `GuestbookEntry`.
5.  Garantir a sincronia contínua com a **Modelagem de UI/UX** e o **Catálogo de Momentos**.