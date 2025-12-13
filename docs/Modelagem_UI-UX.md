# Modelagem de UI/UX — Baby Book

Nota: A modelagem de UI/UX aqui descrita foi alinhada ao [BABY BOOK: DOSSIÊ DE EXECUÇÃO](Dossie_Execucao.md). Para decisões de produto que impactem microcopy, termos (ex: "Acesso Perpétuo"), e fluxo de unboxing, consulte o dossiê.

## Sumário

- [Filosofia de design & identidade](#1-filosofia-de-design--identidade)
  - [Princípios](#princípios)
  - [Tom de voz](#tom-de-voz)
  - [Paleta (tokens)](#paleta-tokens)
  - [Tipografia](#tipografia)
  - [Componentes (shadcn/ui + lucide)](#componentes-shadcnui--lucide)
  - [Acessibilidade](#acessibilidade)
- [Arquitetura da interface (navegação & rotas)](#2-arquitetura-da-interface-navegação--rotas)
  - [2.1 Estrutura global](#21-estrutura-global)
  - [2.2 Navegação base (Os 3 Livros)](#22-navegação-base-os-3-livros)
  - [2.3 Arquitetura de conteúdos](#23-arquitetura-de-conteúdos)
- [Fluxos principais (user flows)](#3-fluxos-principais-user-flows)
  - [3.1 Onboarding (Foco em Valor) → Compra (Acesso Perpétuo)](#31-onboarding-foco-em-valor--compra-acesso-perpétuo)
  - [3.2 Fluxo de "Momento Guiado" (Rascunho)](#32-fluxo-de-momento-guiado-rascunho)
  - [3.3 Fluxo de "Momento Avulso" (FAB)](#33-fluxo-de-momento-avulso-fab)
  - [3.4 Compartilhar (público) e Guardião](#34-compartilhar-público-e-guardião)
  - [3.5 Exportar ZIP / PDF (print-ready) & PoD](#35-exportar-zip--pdf-print-ready--pod)
  - [3.6 Fluxo do Livro de Visitas (Moderação)](#36-fluxo-do-livro-de-visitas-moderação)
  - [3.7 Fluxo da Cápsula do Tempo (Selar)](#37-fluxo-da-cápsula-do-tempo-selar)
- [Padrões de telas (layouts)](#4-padrões-de-telas-layouts)
  - [4.1 Dashboard / Início (Aba Jornada)](#41-dashboard--início-aba-jornada)
  - [4.2 Perfil da Criança (Contexto)](#42-perfil-da-criança-contexto)
  - [4.3 Formulário de Momento (Template)](#43-formulário-de-momento-template)
  - [4.4 Layout: Livro de Visitas (Aba Visitas)](#44-layout-livro-de-visitas-aba-visitas)
  - [4.5 Layout: Cápsula do Tempo](#45-layout-cápsula-do-tempo)
  - [4.6 Layout: Saúde (Aba Saúde)](#46-layout-saúde-aba-saúde)
  - [4.7 Layout: Cofre de Documentos (Aba Saúde)](#47-layout-cofre-de-documentos-aba-saúde)
  - [4.8 Layout: Meus Pedidos (PoD) (/orders)](#48-layout-meus-pedidos-pod-orders)
- [Conteúdo & microcopy](#5-conteúdo--microcopy)
  - [Diretrizes](#diretrizes)
  - [Exemplos](#exemplos)
- [Estados (vazio, carregamento, erro)](#6-estados-vazio-carregamento-erro)
- [Acessibilidade & responsividade](#7-acessibilidade--responsividade)
- [Mapeamento UI → API (MVP)](#8-mapeamento-ui--api-mvp)
- [Telemetria & métricas de UX](#9-telemetria--métricas-de-ux)
- [Critérios de aceite (UI) por fluxo](#10-critérios-de-aceite-ui-por-fluxo)
  - [10.1 Onboarding](#101-onboarding)
  - [10.2 Momento (Template)](#102-momento-template)
  - [10.3 Compartilhamento](#103-compartilhamento)
  - [10.4 Export](#104-export)
  - [10.5 PoD (Print-on-Demand)](#105-pod-print-on-demand)
  - [10.6 Livro de Visitas](#106-livro-de-visitas)
  - [10.7 Cápsula do Tempo](#107-cápsula-do-tempo)
- [Design system (tokens & componentes)](#11-design-system-tokens--componentes)
  - [11.1 Tokens](#111-tokens)
  - [11.2 Componentes mínimos](#112-componentes-mínimos)
- [QA visual & handoff](#12-qa-visual--handoff)
- [Itens opcionais (Pós-MVP)](#13-itens-opcionais-pós-mvp)
- [Riscos de UX & mitigação](#14-riscos-de-ux--mitigação)
- [Apêndice A — Microcopy (exemplos prontos)](#apêndice-a--microcopy-exemplos-prontos)
- [Apêndice B — Glossário visual](#apêndice-b--glossário-visual)

## 1. Filosofia de design & identidade

### Princípios

Calma intencional: A interface deve ser um refúgio, não uma fonte de estresse. Isso significa evitar notificações intrusivas, emblemas de contagem (badges) que geram ansiedade e layouts sobrecarregados. O foco é sempre em uma ação por vez, guiando o usuário suavemente.
Implicação: Animações são sutis (fade, slide suave), e "Sussurros" (notificações) são passivos, não alertas modais. O HUD (item 4.1) foca em uma próxima ação.
Acolhimento: O público (pais recentes) está frequentemente cansado e sobrecarregado. A UI deve validar suas ações, reduzir a ansiedade de "ficar devendo" (ex: "não posto há 3 dias") e celebrar pequenos avanços. O progresso é uma celebração, não uma cobrança.
Implicação: A microcopy (item 5) é crucial. Usamos linguagem afirmativa ("Momento registrado!") e o design de "estado vazio" (item 6) é convidativo, não punitivo ("Vamos registrar sua primeira lembrança?").
Clareza radical: Usar linguagem simples e direta. Rótulos explícitos (ex: "Salvar" em vez de um ícone de disquete). A hierarquia tipográfica deve ser óbvia. Estados (carregando, erro, sucesso) devem ser evidentes e acompanhados de microcopy útil.
Implicação: Evitamos termos de engenharia como "Sincronizar" ou "Processar". Dizemos "Preparando seu vídeo..." ou "Salvando...". Um anti-exemplo seria um ícone "X" sem texto. O nosso "X" sempre virá acompanhado de "Fechar" ou "Cancelar".
Privado por padrão: A confiança é nosso maior ativo. Nenhum momento é público a menos que o usuário explicitamente o compartilhe. O compartilhamento deve ser sempre consciente, granular (momento a momento ou por álbum) e facilmente reversível com um clique.
Implicação: Quebrar essa confiança uma vez destrói o produto. A UI deve ter confirmações claras para ações de compartilhamento e um painel de "Controle de Acesso" (item 3.4) que mostra de forma inequívoca quem vê o quê.
Digital-first, print-ready: A UI é otimizada para visualização rápida no celular, mas a estrutura de dados (capítulos, momentos, datas) já nasce pensando na exportação para um fotolivro (PoD). Cada "momento" é uma potencial página ou entrada em um livro físico.
Implicação: Isso impõe restrições. O "Relato" de um momento não pode ser infinito; ele precisa caber em uma página de livro. Os "Templates de Momento" (item 4.3) ajudam a estruturar essa informação de forma que o PoD (item 3.5) possa consumi-la de forma inteligente.

### Tom de voz

Acolhedor, direto e honesto. Usamos contrações ("Tá tudo bem...") para soar mais próximos. A voz é de um amigo organizado, não de um gerente de projeto nem de um robô.

O que falamos: "Tá tudo bem salvar só um pouquinho hoje.", "Seu vídeo está sendo preparado com carinho.", "Encontramos um probleminha no upload, vamos tentar de novo?", "Seu álbum está seguro conosco."
O que evitamos (jargões, linguagem de culpa): "Falha na autenticação. Tente novamente." (Ruim) vs. "Senha incorreta. Vamos tentar de novo?" (Bom). Evitar "Otimizar", "Sincronizar", "Erro fatal", "Você precisa...", "Ação requerida".

### Paleta (tokens)

As cores são escolhidas para evocar sentimentos específicos alinhados com a filosofia de "calma". A paleta é intencionalmente dessaturada e quente para reduzir a carga cognitiva e parecer mais "orgânica" (papel, argila, plantas).

--bg: areia/quente #F7F3EF (Evoca papel antigo, conforto, calor. O "fundo" do álbum. É a tela sobre a qual as memórias são 'coladas'.)
--ink: carvão macio #2A2A2A (Para leitura confortável. É um preto suave, menos agressivo que #000, reduzindo o contraste excessivo.)
--muted: sálvia #C9D3C2 (Usado para bordas, divisórias, placeholders e estados "desativados". É calmo e orgânico, separando conteúdo sem 'gritar'.)
--accent: pêssego/argila #F2995D (A cor da ação. Usada em botões primários, links e CTAs. É convidativa, otimista e tátil.)
--danger: rubi dessaturado #C76A6A (Usado para erros ou ações destrutivas, como "Revogar acesso". É um "aviso", não um "alarme" estridente, mantendo a calma.)

### Tipografia

A combinação de serif e sans-serif é intencional para criar uma hierarquia clara entre "memória" (emoção) e "ferramenta" (função).

Títulos (Lora/Merriweather/Vollkorn): A serifa suave (como Lora) traz um toque de "livro de histórias", emoção e permanência. Usada em títulos de capítulos e momentos, dando um ar de "coisa importante".
Corpo/UI (Inter/Manrope/Figtree): A sans-serif limpa (como Inter) garante legibilidade máxima em telas pequenas (celulares), especialmente para rótulos de botões, formulários, notas e toda a interação da interface.
Escalas: Definidas para garantir clareza e hierarquia. body 16/24 (16px de fonte, 24px de altura de linha) é a base para conforto de leitura ideal. Títulos (h1 28/34) são grandes o suficiente para impacto, mas não tanto a ponto de quebrar o layout mobile.

### Componentes (shadcn/ui + lucide)

Usamos shadcn/ui como base pela sua acessibilidade e foco em composição, e lucide-react para iconografia limpa e amigável.

Botões rounded-2xl, touch target ≥ 44×44 px. O arredondamento extremo (2xl) reforça a suavidade e o tom "fofo" do produto. O press com leve escala (scale-95) dá feedback tátil imediato.
Cards rounded-2xl shadow-lg. O shadow-lg dá profundidade e um senso de "tato", fazendo o "momento" flutuar sobre o fundo de "areia", como uma foto colada em um scrapbook.
Inputs com rótulo sempre visível (padrão "floating label"). Nunca usar apenas placeholder como rótulo (critério de acessibilidade). Help text curto abaixo do campo.
Skeletons (telas de esqueleto) em listas/cards para evitar "saltos" de layout (Cumulative Layout Shift - CLS) durante o carregamento, o que passa uma sensação de lentidão e instabilidade.
Toasts (notificações) simples, no topo ou rodapé, nunca bloqueantes (modais). Devem ter tempo de leitura suficiente (pelo menos 5 segundos) ou um botão "Fechar".

### Acessibilidade

Não é um item opcional; é central para o "Acolhimento". Um pai ou mãe segurando um bebê com um braço precisa conseguir usar o app com o outro.

WCAG AA (contraste ≥ 4.5:1) é mandatório para todas as combinações de cor/texto.
Foco visível (outline ou sombra) em todos os elementos interativos (links, botões, inputs).
Navegação por teclado lógica e fluida. A ordem do Tab deve seguir o fluxo visual.
Uso de aria-live="polite" nos toasts para leitores de tela anunciarem feedback (ex: "Momento salvo").
aria-describedby para vincular programaticamente mensagens de erro aos inputs que falharam.
Respeito a prefers-reduced-motion para desabilitar animações (como o hover scale) e o auto-hide da barra de navegação.
Testes manuais com VoiceOver (iOS) e TalkBack (Android) são parte do QA (item 12).

## 2. Arquitetura da interface (navegação & rotas)

### 2.1 Estrutura global

A estrutura de rotas é pensada para separar claramente as "memórias" (core loop) dos "utilitários" (configuração e perfil), alinhando-se à Rationale dos "Livros" enquanto reflete o que já está entregue em `apps/web/src/app/router.tsx`.

- `/` ⇒ redireciona para `/jornada`, a home do produto. `/dashboard` também redireciona para lá para manter retrocompatibilidade.
- `/jornada`: Aba "Jornada" (Dashboard / Jornada Guiada) dentro do `MainLayout`. Agrupa HUD, timeline e atalhos para capítulos.
- `/momentos` e `/momentos/:id`: Inventário completo e detalhe de momentos publicados (lista com `MomentCard` e página de leitura).
- `/jornada/moment/draft/:template_id`: Fluxo de rascunho guiado (usa `MomentForm` pré-preenchido com copy do template).
- `/jornada/moment/avulso`: Fluxo livre disparado pelo FAB.
- `/jornada/capitulos` e `/jornada/capitulos/:chapterId`: Catálogo fixo e visão detalhada de capítulos (placeholders interativos).
- `/jornada/perfil-crianca`: Hub de contexto da criança (perfil, cápsula, compartilhamento).
- `/capsula`: Tela da cápsula do tempo (não recebe mais o `:id`; depende do `ChildSwitcher`/estado global).
- `/saude`: Livro da Saúde com tabs internas para Crescimento, Pediatra e Vacinas (rota única, o tab é controlado por estado).
- `/cofre`: Cofre de documentos (HUD + slots com `VaultPage`).
- `/visitas`: Livro de Visitas com HUD, tabs de moderação e convites.
- `/perfil-usuario` (alias `/perfil`): Hub da conta, usado para dados pessoais e gestão de crianças.

Rotas especiais:

- `/jornada/perfil-crianca` e `/perfil-usuario` são alcançadas via o switcher do header.
- Wildcard `*` redireciona para `/jornada`, evitando 404.
- `MainLayout` controla header + navegação inferior para todas as rotas acima (exceto redirects), garantindo consistência visual e o HUD fixo no topo.

### 2.2 Navegação base (Os 3 Livros)

A barra de navegação principal (Bottom Nav) reflete a Rationale de IA dos "Livros", mas hoje expõe **quatro** entradas porque o Cofre ganhou vida própria (veja `apps/web/src/layouts/MainLayout.tsx`):

- **Jornada (Memórias Afetivas):** o memorial com HUD, timeline, capítulos e FAB.
- **Saúde (Utilitários Privados):** visível apenas para o Owner autenticado; carrega tabs de Crescimento, Pediatra e Vacinas e bloqueia o conteúdo com reautenticação após 5 minutos inativo.
- **Visitas (Memorial Social):** livro de visitas com moderação, convites e HUD de slots.
- **Cofre:** atalho direto para documentos críticos, mesmo fora da aba Saúde. O layout espelha o HUD + slots listados em `/cofre`.

Complementos:

- **Header**: concentra o brand, o botão de notificações (painel colapsável com destaques), o `BBChildSwitcher` e links para perfil/conta.
- **FAB (+)**: permanece exclusivo da Jornada, visível quando há criança selecionada e momentos carregados (`DashboardPage`). Sempre chama `/jornada/moment/avulso`.
- **HUD contextual**: renderizado logo após a seleção de view (timeline vs capítulos) e varia entre `NextMomentSuggestion` ou `JourneyProgressCard`.
- **Ações de perfil/configuração**: além do header, o Perfil da Criança mantém um CTA explícito para `/perfil-usuario`.

### 2.3 Arquitetura de conteúdos

- **Aba Jornada (Memorial guiado)**: combina HUD + seletor de modo.
  - `MomentsTimeline` alterna entre _Timeline_ (feed com `MomentCard`, placeholders clicáveis e estados vazios animados) e _Capítulos_ (list/grid com progresso por capítulo e call-to-action para `/jornada/capitulos/:chapterId`).
  - HUD varia conforme estado: ausência de criança selecionada, ausência de aniversário, jornada completa ou sugerindo o próximo template (`NextMomentSuggestion`).
  - FAB cria momentos avulsos e há atalhos visíveis para `/momentos`, `/jornada/moment/draft/*`, `/jornada/moment/avulso` e `/jornada/capitulos`.
  - O `ChapterMomentsPage` garante rastreabilidade do catálogo oficial (`apps/web/src/data/momentCatalog.ts`) e respeita estados draft/published.

- **Aba Saúde (Painel privado)**:
  - Tabs internas (`HealthGrowthTab`, `HealthPediatrianTab`, `HealthVaccinesTab`) são controladas em memória, não por rotas. Cada tab usa HUDs reutilizáveis e componentes ricos (`recharts`, formulários inline) e cobra reforço de autenticação (`Shield` modal) após 5 minutos sem atividade.
  - Regras de visibilidade: se `useAuthStore.user.role !== "owner"` e não estiver em modo mock, toda a aba mostra o empty state bloqueado.
  - Estados vazios reforçam o CTA (ex.: "Registrar primeira medição", "Registrar primeira visita" etc.).

- **Aba Cofre (Documentos críticos)**:
  - `/cofre` usa `VaultPage` com HUD que mostra progresso dos seis slots essenciais, regras de privacidade e `UploadModal`.
  - Documentos extras aparecem num bloco "Documentos adicionais".
  - Mensagens e ícones reforçam a promessa "não vai para o fotolivro" e a criptografia.

- **Aba Visitas (Social + moderação)**:
  - Tabs "Aprovadas" / "Pendentes" com `GuestbookList` e HUD indicando uso de slots (limite 20 + upsell para 50).
  - Quando o tab ativo é "Aprovadas", o CTA "Deixar mensagem" abre o `GuestbookForm` como modal full-screen.
  - Modal de convite (QR code + botões WhatsApp/E-mail) usa `navigator.clipboard` e templates prontos.

- **Perfil da Criança / Perfil do Usuário**:
  - `/jornada/perfil-crianca` se ancora no estado do `ChildSwitcher` e traz atalhos para cápsula, árvore da família e compartilhamento.
  - `/perfil-usuario` centraliza informações de conta, filhos e botões de ação (`ProfilePage`).
  - Ambos reforçam o caminho para editar dados necessários para o HUD (nome/aniversário).

## 3. Fluxos principais (user flows)

### 3.1 Onboarding (Foco em Valor) → Compra (Acesso Perpétuo)

```mermaid
flowchart TD
    A[Landing Page] --> B{Criar conta gratuita}
    B --> C[Wizard do primeiro livro]
    C --> D[Criação da Criança/Álbum]
    D --> E[Dashboard (Aba Jornada c/ Paywall + HUD)]
    E -- CTA: "Registre: A Descoberta" --> M1(Formulário Template /jornada/moment/draft/descoberta)
    M1 -- Tenta Salvar --> F(Apresenta Paywall de Acesso Perpétuo)
    F -- "Desbloquear seu álbum" --> G[Checkout]
    G -->|Aprovado| K[Timeline completa (Funcional)]
```

Critérios de aceite:

Até 2 cliques no login social (Google/Apple).
Happy path < 90 s até visualizar o paywall. O usuário já investiu tempo, nomeou o álbum e está engajado.
O usuário vê a UI principal (Dashboard) antes de pagar, confirmando a qualidade do produto.
O paywall é uma tela modal clara explicando o valor do pagamento único (Acesso Perpétuo). Microcopy: "Desbloqueie seu álbum para sempre. Pagamento único — R$ 297 (cartão) / R$ 279 (PIX) para seu álbum de 2GB."
Wizard aceita data futura (gestantes), adaptando a UI para "Semanas de gestação".
Se o pagamento falhar, o usuário retorna ao Dashboard (E), e o rascunhos (M1) são salvos localmente para não perder dados.

### 3.2 Fluxo de "Momento Guiado" (Rascunho)

Este é o fluxo principal de criação de conteúdo.

```mermaid
flowchart TD
    M0[Dashboard (HUD na Aba Jornada)] -- "Próxima Sugestão: [Primeiro Sorriso]" --> M1(Formulário Template Específico)
    M1 -- "Data, Para quem foi?, Vídeo" --> M2[Preenche campos únicos]
    M2 --> M3[Enviar Mídias (Slots específicos)]
    M3 -- Upload Inicia --> M4[Upload R2]
    M4 -- Concluído --> M5[Transcode Assíncrono]
    M2 --> M7[Salvar (Botão sticky)]
    M7 -- Salvar (API Rápida) --> M8(Momento salvo com estado "Processando")
    M8 --> M9[Usuário retorna ao Dashboard (Aba Jornada)]
    M9 --> M10[HUD atualiza: "Próxima Sugestão: [Primeira Gargalhada]"]
```

Feedback: O formulário (M1) é dinâmico. O "Salvar" (M7) é rápido (só salva metadados). O card na timeline (M8) exibe um overlay ou spinner "Preparando sua mídia..." até o transcode (M5) terminar.

### 3.3 Fluxo de "Momento Avulso" (FAB)

Este é o fluxo secundário, para conteúdo não-guiado.

```mermaid
flowchart TD
    F0[Botão + (FAB) na Aba Jornada] --> F1[Formulário Genérico (Avulso)]
    F1 -- "Data, Título, Relato, Galeria (10F, 2V)" --> F2[Preenche campos genéricos]
    F2 --> F3[Enviar Mídias]
    F3 --> F7[Salvar]
    F7 --> F8[Momento Avulso salvo]
    F8 --> F9[Retorna ao Dashboard (Timeline atualizada)]
```

Justificativa: A "Jornada Guiada" (3.2) resolve a "inércia da página em branco", enquanto o "Momento Avulso" (3.3) garante a liberdade criativa.

### 3.4 Compartilhar (público) e Guardião

```mermaid
flowchart TD
    S0[Ver Momento] --> S1[Ícone Compartilhar]
    S1 --> S2{Como deseja compartilhar?}
    S2 -->|Link público (qualquer pessoa)| S3[Definir TTL (7/30d) / Senha (opcional)]
    S3 --> S4[Criar URL SSR (Link gerado)]
    S4 --> S5[UI: "Link copiado!"]
    S2 -->|Guardião (requer login)| S6[Convidar por e-mail]
    S6 --> S6a{Guardião já é usuário?}
    S6a -- Sim --> S6b[Notificação in-app/associação]
    S6a -- Não --> S7[Pessoa recebe Magic link]
    S7 --> S8[Guardião vê sessão de leitura]
    S6b --> S8
```

Segurança (UI): A UI deve ter um local (ex: /perfil-usuario/guardians) onde o usuário vê todos os links públicos ativos e todos os Guardiões convidados, com botões claros de "Revogar".

### 3.5 Exportar ZIP / PDF (print-ready) & PoD

O "Preflight" torna-se um "Editor de Curadoria".

```mermaid
flowchart TD
    E0[Perfil do Usuário/Exportar] --> E1[Exportar tudo (ZIP)]
    E1 --> E3[Export job (Modal)]
    E3 --> E4[Notificar pronto (Sussurro)]
    E4 --> E5[Link de Download]

    subgraph PoD (Print-on-Demand)
    P0[Imprimir álbum] --> P1[Solicitar Preview (Job Assíncrono)]
    P1 -- UI: "Gerando prévia..." --> P2[Gerar PDF (Modal)]
    P2 -- Job Concluído --> P3[Notificar pronto (Sussurro)]
    P3 --> P4[Etapa 1: Curadoria]
    P4 -- "Selecionar Momentos & Incluir Livro de Visitas?" --> P6[Etapa 2: Revisar Preflight (DPI)]
    P6 -- "Tudo certo? (Aceito os riscos)" --> P7[Checkout (Endereço/Pagamento)]
    P7 --> P8[Webhooks: produção → enviado]
    end
```

Curadoria (P4): UI deve listar todos os "Momentos Avulsos" e "Recorrentes" com checkboxes para inclusão. Esta tela também deve conter o checkbox "Incluir Livro de Visitas (aprovados)?".
Preflight (P6): A UI deve explicitamente mostrar as imagens de baixa resolução (com um ícone de "Aviso").

### 3.6 Fluxo do Livro de Visitas (Moderação)

```mermaid
flowchart TD
    subgraph Visitante (Apenas Guardiões)
    V1[Acessa Aba "Visitas"] --> V2[Clica "Deixar Mensagem"]
    V2 --> V3[Formulário (Nome, Mensagem, 1 Mídia: Foto OU Áudio 30s)]
    V3 --> V4[Enviar Mensagem]
    V4 --> V5[UI: "Obrigado! Sua mensagem será exibida após aprovação."]
    end

    subgraph Owner (Dono do Álbum)
    O1[Recebe Sussurro: "Nova mensagem em Visitas"] --> O2[Acessa Aba "Visitas"]
    O2 --> O3[Vê Aba "Pendentes (1)"]
    O3 --> O4{Revisar Mensagem}
    O4 -- "Aprovar" --> O5[Mensagem move para aba "Aprovadas"]
    O4 -- "Rejeitar" --> O6[Mensagem descartada]
    end
```

Feedback (Owner): A aba "Pendentes" (O3) deve ter um design que a diferencie.

### 3.7 Fluxo da Cápsula do Tempo (Selar)

```mermaid
flowchart TD
    C1[Owner acessa Perfil da Criança -> Cápsula] --> C2[Escreve "Carta para o Futuro"]
    C2 --> C3[Grava Áudio/Vídeo (opcional)]
    C3 --> C4[Define "Data de Abertura" (ex: 10 anos)]
    C4 --> C5{Selar Cápsula?}
    C5 -- "Sim" --> C6[Modal Solene: "Esta ação não pode ser desfeita..."]
    C6 --> C7[Carta "Selada" (API bloqueia leitura)]
    C7 --> C8[UI mostra estado "Selada até [Data]"]

    subgraph No Futuro
    F1(Job (Cron) detecta Data) --> F2(Envia E-mail: "A Cápsula pode ser aberta!")
    F2 --> F3[Owner acessa /capsule/:id]
    F3 --> F4[UI: Botão "Abrir Cápsula"]
    F4 --> F5[Conteúdo revelado]
    end
```

Detalhe (C6): O Modal Solene é um ponto de atrito intencional, exigindo confirmação clara (ex: digitar "SELAR").
Reversibilidade: A UI deve ter um botão "Cancelar Selo" (com confirmação solene) para re-editar.
O ponto de entrada (/jornada/perfil-crianca) deve estar visível.

## 4. Padrões de telas (layouts)

### 4.1 Dashboard / Início (Aba Jornada)

Header: Seletor de criança (se houver mais de uma). Ao clicar no nome/avatar da criança, acessa o 'Perfil da Criança' (item 4.2). Ícone de "Perfil do Usuário" (Configurações, Pedidos, Sair).
HUD (Head-Up Display): Componente principal no topo.
Título: "Sua Jornada"
Sugestão: "Próxima sugestão: O Primeiro Sorriso" (Link para /jornada/moment/draft/primeiro-sorriso).
Corpo: A timeline (corpo) vertical infinita de momentos já publicados. Deve conter controles de visualização (ex: 'Ver por Capítulos' ou 'Ver Timeline Única').
FAB (Botão +): Fixo no canto, abre o "Momento Avulso".

### 4.2 Perfil da Criança (Contexto)

(Local: /jornada/perfil-crianca)

Hub de contexto que não é utilitário, mas sim "memória estrutural".
Link para "Editar Perfil da Criança" (Foto, Data de Nasc.).
Link para "Árvore da Família" (B.2).
Link para "Cápsula do Tempo" (B.5).
Link para "Configurações da Conta" (Acessa /perfil-usuario. Redundância positiva para 'Pedidos', 'Quota' e 'Sair').

### 4.3 Formulário de Momento (Template)

Não existe um formulário, mas templates de formulário.
Exemplo "1.7 Seja Bem-Vindo":Título (Serif): "Seja Bem-Vindo(a)!"
Campos: Data do Nascimento (DatePicker), Hora (TimeInput), Local (TextInput), Peso (NumberInput), Altura (NumberInput), Foto Principal (UploadSlot), Foto Secundária (UploadSlot).
Exemplo "3.5 Primeira Comida":Título (Serif): "Hora da bagunça! Qual foi a reação?"
Campos: Data (DatePicker), O que comeu? (TextInput), Reação (ChipSelect: ["Amou!", "Gostou", "Fez Careta", "Odiou!"]), Vídeo da Careta (UploadSlot), Fotos (UploadSlot).
Botão "Salvar" sticky em todos os templates.

### 4.4 Layout: Livro de Visitas (Aba Visitas)

(Local: /visitas)

Aba "Aprovadas" (Default): Lista pública de mensagens (Nome, Data, Mensagem, Mídia). Design limpo.
Aba "Pendentes": (Visível apenas para o Owner se houver itens) Lista de mensagens aguardando moderação. Cada item tem botões claros "Aprovar" e "Rejeitar".
Botão "Deixar Mensagem" (Visível para Guardiões).

### 4.5 Layout: Cápsula do Tempo

(Local: /capsule/:id)

UI "Solene" (cores mais escuras, tipografia serifada).
Seção "Cartas Abertas" (ex: "Carta de Boas-Vindas").
Seção "Cápsula Selada":
Se Rascunho: Formulário (Data de Abertura, Texto, Mídia) com botão "Selar".
Se Selada: Estado visual de "cofre" ou "caixa selada". Mostra "Selada até$$ \\ Data $$

$$
".

Se Pronta para Abrir: Estado visual festivo com botão "Abrir Cápsula".

### 4.6 Layout: Saúde (Aba Saúde)

(Local: /saude)

Tela visível apenas para o "Owner".
Aba "Curva de Crescimento":
Sub-aba "Adicionar Medição" (Form: Data, Peso, Altura).
Sub-aba "Ver Gráfico" (Componente Recharts).
Aba "Visitas ao Pediatra":Lista de visitas (Form: Data, Motivo, Anotações, Foto de Receita).
Aba "Cofre":Link para o Cofre de Documentos (item 4.7).

### 4.7 Layout: Cofre de Documentos (Aba Saúde)

(Local: /saude/cofre)

UI com ícones de "cadeado".
Slots nomeados (Certidão, CPF, Cartão SUS).
Feedback claro: "Estes documentos são privados, visíveis apenas para você, e nunca serão incluídos em álbuns impressos (PoD)."
Consideração de Segurança: Esta rota deve exigir re-autenticação (senha ou biometria) se a sessão estiver inativa por mais de 5 minutos.

### 4.8 Layout: Meus Pedidos (PoD) (/perfil-usuario/orders)

Lista de pedidos com status claros: Recebido, Em produção, Enviado (com link de rastreio).
Detalhe do pedido com o preview (PDF) que foi aprovado.
Estado vazio: "Você ainda não imprimiu nenhum álbum. Que tal transformar suas memórias em um livro?"

## 5. Conteúdo & microcopy

### Diretrizes

Mensagens afetuosas, específicas e que dão o próximo passo.
Erros explicam o que deu errado (causa) e como resolver (ação).
Nunca culpe o usuário: (Ruim: "Você não preencheu a data.") vs. (Bom: "Qual foi a data desse momento?").
Tempo/medidas padronizados (≤ 10 s; MB/GB; datas longas "2 de maio de 2025").
Usar "você" e "nós": "Nós salvamos sua foto." (Bom) vs. "A foto foi salva." (Ruim, passivo).
Ser consistente: Usar "Guardião" sempre, nunca "Convidado". Usar "Momento", nunca "Post". Usar "Visitas", não "Guestbook".

### Exemplos

Salvar (Sucesso): "✅ Momento registrado! Já estamos preparando sua mídia."
Upload em fila: "Seu vídeo entrou na fila. Pode continuar usando o app, avisaremos quando estiver pronto."
Quota (Aviso 90%): "Você já usou 1.8 GB do seu plano de 2 GB. Ao atingir o limite, será preciso mais espaço para novos momentos."
Quota (Bloqueio 100%): "Você atingiu o limite de 2 GB. Para adicionar novos momentos, compre +2 GB de espaço."
PoD (Início): "Estamos gerando a prévia do seu álbum. Isso pode levar alguns minutos, avisaremos assim que estiver pronto."
PoD (Pronto): "Pré-visualização pronta! Revise as páginas com atenção (especialmente fotos e textos) antes de confirmar o pedido."
PoD (Erro de Imagem): "Opa! A foto 'viagem.jpg' está com resolução baixa e pode ficar borrada na impressão. Recomendamos trocá-la."
Erro 403 (Guardião na Aba Saúde): "Ops! Esta área é um cofre privado, acessível apenas pelo dono do álbum."
Primeiro Acesso (Pós-Pagamento): "Prontinho! Seu álbum está desbloqueado. Vamos registrar o primeiro momento?"
HUD (Início): "Próxima sugestão: O Primeiro Sorriso. Vamos registrar?"
HUD (Fim da Jornada): "Parabéns, você completou a jornada do primeiro ano! Continue registrando memórias com o botão (+)."
Livro de Visitas (Sucesso Visitante): "Obrigado! Sua mensagem foi enviada para aprovação."
Livro de Visitas (Sussurro Owner): "Você tem 1 nova mensagem na Aba 'Visitas' aguardando sua aprovação."
Cápsula (Selar): "Selar esta cápsula para $Data$? Você não poderá ver ou editar o conteúdo até lá."
Cápsula (Abrir): "Chegou o grande dia! A Cápsula do Tempo está pronta para ser aberta."

## 6. Estados (vazio, carregamento, erro)

Vazio:Timeline Vazia (com HUD): O HUD (item 4.1) é o principal estado de "vazio", mostrando "Vamos registrar: A Descoberta?".
Capítulo Vazio: "Este capítulo ainda não tem momentos. Que tal adicionar um?"
Livro de Visitas Vazio: "Nenhuma mensagem ainda. Que tal convidar os avós para deixarem um recado?"
Aba Saúde Vazia: "Nenhum dado registrado. Toque em 'Adicionar' para começar."
Carregamento:Carregamento Inicial (App): Logo ou skeleton da UI principal (Shell).
Carregamento de Lista (Timeline): Skeletons em formato de "Card" (3-4 cards) para evitar CLS.
Carregamento de Ação (Botão): Spinner dentro do botão (ex: "Salvando...").
Carregamento de Upload: Barra de progresso no slot de mídia (item 4.3).
Erro:Erro de Campo (Formulário): Mensagem humana inline, vermelha (--danger), abaixo do input.
Erro de API (Toast): "Não foi possível salvar. Verifique sua conexão e tente novamente."
Erro 500 (Fatal): Uma tela de erro amigável. "Opa, algo deu errado do nosso lado. Nossa equipe já foi avisada."
Erro de Upload (no Card): Se um upload falhar permanentemente (ex: corrompido, 4xx), o Card do Momento na timeline deve exibir um overlay (ex: tom --danger) com uma mensagem clara: "Falha no upload da mídia" e um botão "Tentar novamente".
Offline/instável:Fila de Upload Persistente (Client-side): Essencial. Uploads em progresso ou falhados são mantidos em uma fila local (IndexedDB).
UI da Fila (Offline/Pausado): Um "Sussurro" fixo: "3 uploads pendentes (offline). Eles serão retomados assim que a conexão voltar."
Ações da Fila: O usuário deve poder ver a fila e (opcional) "Cancelar" ou "Tentar agora".
Retomada Automática: O app tenta retomar (com backoff) uploads pausados quando a conexão (evento online) é restabelecida.

## 7. Acessibilidade & responsividade

Touch targets ≥ 44 px; espaçamento generoso entre botões.
Rótulos visíveis (nunca usar placeholder como rótulo).
Foco visível (outline accent) em todos os elementos interativos. Ordem de navegação (Tab) lógica.
Layout fluido (grid 12 col.; breakpoints sm/md/lg/xl).
PoD Editor (Responsivo): O editor de PoD (3.5) deve ser mobile-first. A "Curadoria" (checklist) é simples. O "Editor de Layout" (drag-and-drop) pode ser desabilitado em telas pequenas (sm), com uma nota: "Para reordenar páginas, acesse por um tablet ou desktop."
Respeito a prefers-reduced-motion: Desativa animações de hover e transições.

## 8. Mapeamento UI → API (MVP)

Login/CSRF → GET /auth/csrf · POST /auth/login
Perfil & quotas → GET /me · GET /me/usage (Namespace /perfil-usuario)
Crianças → GET/POST/PATCH /children
Momentos (Templates) → GET /moments/drafts
Momentos (Salvar) → POST /moments (Envia metadados do template)
Momento (Avulso) → POST /moments/avulso
Upload → POST /uploads/init · POST /uploads/complete
Guardiões → POST /guardians/invite · DELETE /guardians/{id}
Livro de Visitas → GET /guestbook · POST /guestbook (Visitante)
Livro de Visitas (Moderação) → GET /guestbook/pending · POST /guestbook/{id}/approve
Cápsula do Tempo → GET /capsule · POST /capsule (Salva rascunho)
Cápsula do Tempo (Selar) → POST /capsule/{id}/seal
Árvore da Família → GET/PUT /family-tree
Saúde (Utilitário) → GET/POST /health/measurements · GET/POST /health/visits
Cofre (Utilitário) → GET/POST /vault/documents
PoD (Curadoria) → POST /print/jobs · PUT /print/jobs/{id}/curation
Export → POST /export · GET /export/{id}
Compartilhar (público) → POST /moments/{id}/share · DELETE /shares/{id}
Capítulos → GET/POST/PATCH/DELETE /chapters

## 9. Telemetria & métricas de UX

Eventos:onboarding_completed
ltd_checkout_started, ltd_checkout_completed
moment_guided_opened (Prop: template_id)
moment_avulso_opened (FAB)
moment_saved (Prop: template_id ou avulso)
upload_failed (Prop: error_code)
upload_retry_started (offline)
guardian_invited, guardian_activated
pod_preview_requested, pod_curation_completed, pod_checkout_completed
guestbook_entry_submitted, guestbook_entry_approved
capsule_letter_created, capsule_letter_sealed, capsule_letter_opened
tab_viewed (Prop: tab_name $$"Jornada", "Saúde", "Visitas"$$
)

KPIs de UX:Taxa de Conversão: paywall_presented → ltd_checkout_completed (Acesso Perpétuo).
Engajamento (Jornada): % de usuários que completam a "Jornada do Primeiro Ano".
Engajamento (Avulso): Relação moment_guided_saved vs. moment_avulso_saved.
Engajamento (Tabs): Distribuição de tab_viewed. (Quantos "Owners" acessam a aba "Saúde"?).
Engajamento (Sessão): % que completa 10/30/60 momentos (M1/M3/M6).
Engajamento (Social): VTR de e-mail de Guardião (≥ 60%).
Performance: p95 de time-to-interactive da dashboard (< 2,5 s em 3G rápido).
Confiabilidade: Taxa de falha de upload (uploads failed / started).

## 10. Critérios de aceite (UI) por fluxo

### 10.1 Onboarding

Duas opções de login social; campos mínimos.
Paywall de Acesso Perpétuo apresentado apenas após o usuário criar a criança/álbum.
Validação de e-mail (formato e duplicidade) com feedback claro.
Se o pagamento falhar, o estado do usuário é mantido e os rascunhos são salvos localmente.

### 10.2 Momento (Template)

Ao clicar no HUD, o formulário correto do template deve abrir.
A validação deve ser por template (ex: Peso/Altura deve aceitar apenas números).
Uploads falhados (offline) devem persistir na fila (item 6).
Se o upload falhar permanentemente, o Card do Momento na timeline deve exibir um overlay com uma mensagem clara: "Falha no upload da mídia" e um botão "Tentar novamente".
Após salvar, o HUD no Dashboard deve atualizar para o próximo rascunho.

### 10.3 Compartilhamento

Revogação (link ou Guardião) em 1 clique; estado visível.
Terminologia "Guardião" aplicada consistentemente.
O painel de controle (/perfil-usuario/guardians) deve ser a fonte da verdade para acessos.

### 10.4 Export

Feedback imediato do job ("Estamos preparando seu ZIP...") e notificação (Sussurro) quando pronto.
Link de download deve ter expiração clara (ex: "Link válido por 24h").

### 10.5 PoD (Print-on-Demand)

Geração de preview tratada como job assíncrono.
Critério Crítico: A etapa "Curadoria" (P4) deve carregar uma lista de Momentos Avulsos/Recorrentes com checkboxes funcionais.
Critério Crítico: A etapa "Curadoria" (P4) deve ter um checkbox funcional "Incluir Livro de Visitas (aprovados)?".
Preflight (P6) deve avisar sobre baixa resolução (DPI < 150) e bloquear se a imagem estiver corrompida.
O usuário deve marcar um checkbox "Eu revisei as$$ \\ N $$
$$$$páginas e aprovo a impressão" antes de ir para o Checkout (P7).

### 10.6 Livro de Visitas

Mensagens de Guardiões (visitantes logados) devem ir para a aba "Pendentes" e NUNCA aparecer na lista principal sem aprovação.
"Owner" deve ver as abas "Pendentes" e "Aprovadas".
"Guardião" (Visitante) deve ver apenas a aba "Aprovadas".
O RBAC da Aba "Visitas" deve funcionar (visível para Owner e Guardião).

### 10.7 Cápsula do Tempo

Botão "Selar" só deve ficar ativo se a "Data de Abertura" (mín. 10 anos) estiver definida.
Após "Selar", o conteúdo (texto/mídia) NÃO PODE ser lido (nem via API).
O fluxo de "Cancelar Selo" deve ser igualmente solene.
O ponto de entrada (/jornada/perfil-crianca) deve estar visível.

## 11. Design system (tokens & componentes)

### 11.1 Tokens

Espaços: 4/8/12/16/24/32 (escala de 4px).
Raio: xl/2xl (suavidade).
Sombra: sm/md/lg (profundidade).
Duração (Animação): 150/250/300 ms (rápido, suave).
Easings: ease-out (para elementos entrando) | in-out (para hover/scale).
Z-index: nav, modal, toast (para garantir sobreposição correta).

### 11.2 Componentes mínimos

Button · IconButton · Input · Textarea · Select · DatePicker
TimeInput (para "Seja Bem-Vindo") - Input com máscara HH:MM.
NumberInput (para "Peso/Altura") - Input com máscara e validação numérica.
ChipSelect / ToggleChip (para "Primeira Comida") - Botões de rádio estilizados como "tags".
AudioUploadSlot (com modo "Gravar" e "Enviar").
Avatar · Card · Tag · Badge · Progress · EmptyState
Tooltip · Toast · Dialog/Sheet · Tabs · Pagination
Skeleton · Breadcrumbs · Accordion (para FAQ ou Settings) · Alert/Banner (para offline/quota).

## 12. QA visual & handoff

Checklist de QA:
Contraste validado; foco visível; tab order lógico.
Quebra responsiva testada (sm/md/lg/xl).
Testar em conexões 3G lentas (simuladas no Chrome DevTools).
Estados de erro/vazio para todas as listas e formulários.
Testar N=5 templates de formulário e validar os campos únicos.
Testar fluxo de fila de upload offline (modo avião).
Testar fluxo de moderação do Livro de Visitas (Owner vs. Guardião).
Testar RBAC: Logar como "Guardião" e garantir que a Aba "Saúde" não é visível.
Testar fluxo de "Selar" Cápsula e verificar bloqueio na UI.
Handoff (Engenharia):
Figma com variants e auto-layout; tokens exportáveis.
Protótipos anotados com regras de template (quais campos em qual momento).
Documentação clara da lógica de estados (ex: "Estados do Card de Momento: Default, Processando, Erro de Upload").

## 13. Itens opcionais (Pós-MVP)

QR por página no PDF (para linkar de volta ao momento digital).
Busca full-text em notas de momentos.
Tagging de Pessoas (vincular "Visitas Especiais" à "Árvore da Família").
Apps nativos (deep links + push avançado).
Temas de UI (ex: Dark Mode).
Integração com IA (ex: sugestão de tags, resumo do mês).
Editor de Mídia (trim de vídeo, corte/filtro de fotos).
Multi-Álbum (para segundo filho, etc.).

## 14. Riscos de UX & mitigação

Fricção em upload → Mitigação: Fila de upload persistente (item 6), UI não-bloqueante.
Confusão de compartilhamento → Mitigação: Separar "Link público" × "Guardião" e ter um painel de controle claro (3.4).
Quota surpresa → Mitigação: Barra de uso visível (2.3), foco em upsell (nunca deletar).
PoD decepcionante → Mitigação: Preflight (aviso de baixa resolução) + Curadoria (usuário no controle do conteúdo).
Risco de Abandono Pós-Compra → Mitigação: "Jornada Guiada" (HUD) age como o principal motor de engajamento, puxando o usuário para o próximo passo.
Confusão "Momento" vs. "Capítulo" → Mitigação: A IA agora rebaixa "Capítulos" (item 2.3), focando a UI principal em "Momentos".
Complexidade do Formulário → Risco de o usuário se cansar de preencher templates. Mitigação: (1) Templates devem ter no máximo 5-6 campos. (2) "Momento Avulso" (FAB) sempre disponível para quem quer velocidade.
Risco: Ansiedade de Performance → Mitigação: O HUD foca em "um de cada vez". A linguagem é de "sugestão", não "tarefa".
Risco: "Cemitério Digital" → Mitigação: "Cápsula do Tempo" e "PoD" dão um propósito de longo prazo e um fim tangível para o produto.

## Apêndice A — Microcopy (exemplos prontos)

Estado vazio de capítulo: "Um novo capítulo prontinho pra começar. Adicione momentos a ele."
Toast de sucesso: "✅ Momento registrado — continuamos preparando sua mídia."
Erro de vídeo longo: "Vídeos devem ter até 10 s nesta fase. Tente um trecho menor."
Convite de Guardião enviado: "Convite de Guardião enviado para$$ \\ email $$
$$$$! Avise a pessoa por WhatsApp — o link expira em 7 dias."

Erro de Quota (PoD): "A geração do preview falhou pois seu armazenamento (2GB) está cheio. Para gerar o PDF, compre um pacote adicional de armazenamento."
HUD (Início): "Próxima sugestão: O Primeiro Sorriso. Vamos registrar?"
HUD (Fim da Jornada): "Parabéns, você completou a jornada do primeiro ano! Continue registrando memórias com o botão (+)."
Livro de Visitas (Sucesso Visitante): "Obrigado! Sua mensagem foi enviada para aprovação."
Livro de Visitas (Sussurro Owner): "Você tem 1 nova mensagem na Aba 'Visitas' aguardando sua aprovação."
Cápsula (Selar): "Selar esta cápsula para $Data$? Você não poderá ver ou editar o conteúdo até lá."
Cápsula (Abrir): "Chegou o grande dia! A Cápsula do Tempo está pronta para ser aberta."

## Apêndice B — Glossário visual

HUD (Head-Up Display): O componente no topo da "Aba Jornada" que mostra o próximo "Momento Guiado" (rascunho).
Jornada Guiada: A sequência de rascunhos pré-definidos (ex: "A Descoberta", "Mêsversários") que o app sugere.
Template de Momento: O formulário específico para um tipo de momento (ex: Template "Primeira Comida").
Momento Avulso: Um momento genérico (data, título, mídia) criado pelo FAB, fora da Jornada Guiada.
Guardião: Um usuário convidado por e-mail (RBAC) que faz login. Pode ver o álbum e (se permitido) escrever no Livro de Visitas. Não pode editar momentos nem ver a "Aba Saúde".
Visitante (Link Público): Um usuário anônimo que acessa um link de 'share' (item 3.4). Não pode ver o app, apenas a página SSR do momento. Visitantes (v1) não podem escrever no Livro de Visitas.
Sussurros: Notificações sutis (não intrusivas), geralmente em um hub de notificações, que não exigem ação imediata (ex: "Seu vídeo está pronto").
Aba Jornada (Livro 1): Navegação principal. Onde vivem o HUD, a timeline, o FAB e o Perfil da Criança.
Aba Saúde (Livro 2): Navegação principal. Onde vivem os utilitários privados do Owner (Crescimento, Cofre).
Aba Visitas (Livro 3): Navegação principal. Onde vive o Livro de Visitas.
$$
