# Design System — Baby Book

Guia completo e detalhado de tokens, componentes, layouts e padrões de experiência do Baby Book. Está alinhado à Modelagem de UI/UX, ao Catálogo de Momentos, ao documento de Visão & Viabilidade e à arquitetura de produto em torno dos 3 Livros: Jornada, Saúde e Visitas.

Este documento existe para ser a fonte de verdade visual e comportamental do produto. Tudo que aparece na interface — do primeiro onboarding à geração do fotolivro (PoD), passando por momentos recorrentes, upsell, cápsula do tempo, Livro de Visitas, Saúde e Cofre — deve conseguir ser rastreado até aqui em forma de princípios, componentes ou padrões.

A proposta não é só catalogar telas bonitas, mas definir como o Baby Book se comporta, o que comunica, como se move, como trata o usuário quando está tudo bem e, principalmente, quando algo dá errado.

---

## Sumário

- **1. Introdução**
  - 1.1 Objetivo
  - 1.2 Princípios do produto e de design
  - 1.3 Relação com a Modelagem de UI/UX e o Catálogo de Momentos
  - 1.4 Escopo e não-escopo do design system
  - 1.5 Público-alvo deste documento e formas de uso
- **2. Filosofia de design & identidade**
  - 2.1 Princípios de experiência
  - 2.2 Tom de voz
  - 2.3 Papel do HUD, Jornada Guiada e “3 Livros”
  - 2.4 Coerência entre digital e print-ready
  - 2.5 Anti-padrões explícitos (o que não fazer)
- **3. Fundamentos visuais**
  - 3.1 Paleta de cores (tokens de cor)
  - 3.2 Tipografia (serif + sans)
  - 3.3 Grid, espaçamento e layout
  - 3.4 Bordas, cantos e elevação
  - 3.5 Iconografia (lucide) e ilustrações
  - 3.6 Uso de mídia (fotos, vídeos, áudios, documentos)
  - 3.7 Exemplos de combinações visuais típicas
  - 3.8 Diretrizes de consistência visual entre plataformas
- **4. Fundamentos de interação**
  - 4.1 Plataformas, contexto e “uma mão só”
  - 4.2 Estados de interação
  - 4.3 Motion, preferências do sistema e performance percebida
  - 4.4 Feedback visual e textual por tipo de ação
  - 4.5 Acessibilidade (WCAG + ARIA) como padrão mínimo
  - 4.6 Padrões de foco e navegação hierárquica
- **5. Tokens de design**
  - 5.1 Convenções de nomenclatura
  - 5.2 Tokens de cor
  - 5.3 Tokens de tipografia
  - 5.4 Tokens de espaçamento
  - 5.5 Tokens de bordas, sombras e z-index
  - 5.6 Tokens de motion
  - 5.7 Convenções de organização de tokens no código
  - 5.8 Exemplo de aplicação de tokens em um componente
- **6. Componentes base (shadcn/ui + lucide)**
  - 6.1 Botões
  - 6.2 Inputs e formulários
  - 6.3 Seletores e chips
  - 6.4 Cards e listas
  - 6.5 Modais, sheets e diálogos solenes
  - 6.6 Navegação (Bottom Nav, HUD, FAB)
  - 6.7 Feedback (toasts, banners, empty states, skeletons)
  - 6.8 Convenções gerais de propriedades e estados
- **7. Componentes de domínio — Baby Book**
  - 7.1 Card de Momento e estados
  - 7.2 Timeline, Capítulos e HUD (Jornada Guiada)
  - 7.3 Seletor de Criança e Perfil da Criança
  - 7.4 Livro de Visitas e moderação
  - 7.5 Cápsula do Tempo
  - 7.6 Aba Saúde (Vacinas, Consultas, Crescimento) e Cofre
  - 7.7 Exportar, PoD e Meus Pedidos
  - 7.8 Compartilhamento e Guardiões
  - 7.9 Recorrentes (padrões de UI)
  - 7.10 Relação entre componentes de domínio e API
- **8. Padrões de telas (layouts)**
  - 8.1 Dashboard / Aba Jornada
  - 8.2 Perfis, abas e utilitários
  - 8.3 Páginas públicas de compartilhamento
  - 8.4 Exemplos de fluxos encadeados
  - 8.5 Layouts de erro e estados de exceção
- **9. Conteúdo e microcopy**
  - 9.1 Diretrizes de linguagem
  - 9.2 Vocabulário canônico (glossário visual resumido)
  - 9.3 Exemplos por contexto (Jornada, Saúde, Visitas, PoD, Cápsula)
  - 9.4 Erros, avisos, upsell e confirmação
- **10. Estados (vazio, carregamento, erro, offline)**
  - 10.1 Estados vazios por domínio
  - 10.2 Carregamento e fila de upload
  - 10.3 Erros e recuperação
  - 10.4 Estratégias de prevenção de frustração
  - 10.5 Exemplos de fluxos resilientes
- **11. Acessibilidade e responsividade**
  - 11.1 Critérios mínimos (WCAG AA)
  - 11.2 Padrões mobile-first e breakpoints
  - 11.3 Leitores de tela e navegação por teclado
  - 11.4 Considerações para usuários exaustos, com uma mão ocupada
  - 11.5 Checklist de acessibilidade para releases
- **12. Telemetria visual e critérios de aceite (UI)**
  - 12.1 Eventos e instrumentação de UX
  - 12.2 Critérios de aceite por fluxo
  - 12.3 Como usar telemetria para evoluir o design system
  - 12.4 Exemplos de hipóteses visuais ligadas a métricas
- **13. QA visual e handoff**
  - 13.1 Checklist de QA visual
  - 13.2 Handoff para engenharia
  - 13.3 Boas práticas de documentação em Figma
  - 13.4 Ciclo de feedback entre squads
- **14. Itens opcionais (pós-MVP) e extensões do design system**
- **15. Riscos de UX e diretrizes não negociáveis**

---

## 1. Introdução

### 1.1 Objetivo

Este documento define o design system do Baby Book — uma linguagem visual, de conteúdo e de interação que sustenta todos os fluxos descritos na Modelagem de UI/UX, no Catálogo de Momentos, nos documentos de Arquitetura & Domínio e de Visão & Viabilidade.

Ele cobre o ciclo completo da experiência:

- Primeiro contato do usuário (landing/onboarding).
- Criação da criança e configuração inicial do álbum.
- Registro de memórias via templates guiados e recorrentes.
- Interações sociais (Livro de Visitas, Guardiões, link público).
- Utilitários de Saúde (Vacinas, Consultas, Crescimento, Cofre).
- Exportação (ZIP/PDF) e impressão sob demanda (PoD).
- Experiências especiais (Cápsula do Tempo, Galeria de Arte quando aplicável).

Mais do que um catálogo de componentes, o design system estabelece como o produto deve se comportar de forma consistente, previsível e acolhedora ao longo do tempo. Por exemplo, dois times diferentes trabalhando em telas de Saúde e Visitas, em momentos distintos, devem chegar em soluções coerentes se seguirem os mesmos princípios, componentes e padrões descritos aqui.

### 1.2 Princípios do produto e de design

O design system é guiado por princípios de produto que se repetem nos demais documentos e que aqui ganham implicações visuais diretas:

- **Calma intencional**: A UI reduz o ruído, não aumenta. Isso significa priorizar uma ação principal por tela, evitar múltiplos CTAs competindo pela atenção e não usar elementos que comuniquem urgência artificial (badges vermelhos, contadores agressivos de pendência, timers psicológicos).
- **Acolhimento**: O app parte do pressuposto de que o usuário está cansado, distraído e, muitas vezes, emocionalmente envolvido com o conteúdo que está registrando. O design deve transmitir que qualquer registro já é valioso. A interface não cobra, não compara, não cria ranking de “bons pais”.
- **Clareza radical**: Para cada ação, a pessoa precisa entender: o que vai acontecer, o que é esperado dela e como desfazer (quando possível). Ícones críticos sempre vêm acompanhados de texto; microcopy evita jargões técnicos; erros dizem o que houve e apontam um caminho concreto.
- **Privado por padrão**: A confiança é pilar central. Nenhum momento é público sem escolha explícita. A UI de compartilhamento deixa claro para quem algo será visível e oferece um painel único de revisão e revogação.
- **Digital-first, print-ready**: Embora o app seja digital, a estrutura visual já nasce preparada para exportação em PDF e impressão. O design system incentiva título + relato + mídia em arranjos que funcionam bem tanto na tela quanto no papel.

### 1.3 Relação com a Modelagem de UI/UX e o Catálogo de Momentos

A Modelagem de UI/UX responde “como é a experiência do usuário no fluxo inteiro”. O Catálogo de Momentos responde “quais momentos existem, como se comportam, que mídia aceitam, que limites possuem”. Este documento responde “como tudo isso aparece na tela e se conecta em uma linguagem só”.

- Quando o Catálogo diz que um momento tem tipologia **Recorrente** e permite 5 entradas gratuitas, o design system define como esse limite é mostrado: contador, badge, cadeado, upsell.
- Quando a Modelagem de UI/UX diz que existe um **HUD** com próxima sugestão, aqui definimos como esse HUD é desenhado, qual a hierarquia tipográfica, quais componentes usa e que tom de microcopy aparece dentro dele.
- Quando a arquitetura fala de **link público de compartilhamento**, aqui definimos como a página pública se apresenta, qual o visual mínimo e como a privacidade é comunicada na UI.

### 1.4 Escopo e não-escopo do design system

**Inclui, com grau de detalhe alto:**

- App autenticado (Jornada, Saúde, Visitas, Perfil do Usuário, Export, PoD, Cápsula, Cofre, tela de pedidos, painel de guardiões).
- Páginas públicas de compartilhamento (`/share/:token`), incluindo sua aparência e comportamento em mobile.
- Lógica visual e textual de e-mails transacionais, quando estes refletem diretamente a identidade do app (ex.: "Sua cápsula está pronta para abrir").

**Não inclui em detalhe, mas serve como fonte de inspiração e base de tokens:**

- Painéis internos/admin da operação (logs, monitoramento, suporte).
- Materiais de marketing externos, campanhas, landing pages experimentais.

### 1.5 Público-alvo deste documento e formas de uso

Este documento é pensado para:

- **Designers de produto e UX**: como referência para criar novas telas, variações de estado e padrões sem fugir da linguagem do Baby Book.
- **Desenvolvedores front-end**: como guia para implementação de componentes em React/shadcn, garantindo que a semântica dos componentes (`BBButton`, `BBMomentCard`, `BBHud`) se mantenha correta.
- **Produto/negócio**: como apoio para discutir novos fluxos (ex.: novos recorrentes, novos upsells, novas abas) com base em padrões já existentes.
- **QA/qualidade**: como fonte de critérios visuais para validar releases.

**Sugestão de uso no dia a dia:**

- Antes de criar uma tela nova, verificar se já existe padrão semelhante em alguma seção (Layouts, Estados, Domínio).
- Em refinamentos, revisar a seção de microcopy e de estados (erro, vazio, upsell) para garantir consistência.
- Antes de release, cruzar o que foi construído com o checklist de QA visual e de acessibilidade.

### 1.6 Estado atual do frontend (apps/web)

Para que o design system continue sendo a "fonte de verdade", o estado real do app (`apps/web`, Vite + React Router + Tailwind) precisa constar aqui. Quando um componente/domínio for alterado no código, esta tabela deve ser atualizada no mesmo PR.

| Área / fluxo | Componentes implementados | Observações de design |
| --- | --- | --- |
| Estrutura Global | `MainLayout` (header + painel de notificações + `BBChildSwitcher`) e rotas declaradas no `AppRouter`. | Bottom nav com 4 livros (`Jornada`, `Saúde`, `Visitas`, `Cofre`) animada com `LayoutGroup`. FAB exclusivo da Jornada. |
| HUD / Jornada | `NextMomentSuggestion`, `JourneyProgressCard`, `MomentsTimeline`, `ChapterMomentsPage`, `ChaptersPage`. | HUD cobre 4 estados (sem criança, sem data, próxima sugestão, jornada completa). Timeline alterna `Timeline` × `Capítulos` preservando tokens de cor/canto. |
| Cartões de domínio | `MomentCard`, placeholders do catálogo (`momentCatalog.ts`), `HudCard`. | `MomentCard` aplica badges (`Rascunho`, `Arquivado`) e chips de privacidade; `HudCard` padroniza tipografia serif + progress bar para métricas. |
| Saúde | `HealthGrowthTab`, `HealthPediatrianTab`, `HealthVaccinesTab`. | Crescimento usa `recharts` e formulário inline; Pediatra tem cards serifados com `CalendarClock`; Vacinas colore estados (`text-success`, `text-accent`, `text-danger`). |
| Cofre | `VaultPage`, `DocumentRow`, `UploadModal`. | HUD mostra "x de 6 documentos essenciais"; slots vazios usam borda tracejada e CTAs `Adicionar`; modal reforça privacidade. |
| Cápsula / Perfil | `CapsulePage`, `PerfilCriancaPage`, `ProfilePage`. | Cápsula valida mínimo de 10 anos para selar e alterna cartões "selado" × "em edição"; Perfil lista filhos e ações com `Button` outline/ghost. |
| Visitas | `VisitasPage` (tabs `approved/pending`), `GuestbookList`, `GuestbookForm`. | HUD mostra uso de slots (20 → CTA "Ampliar para 50"), tabs com `LayoutGroup`, modal de convite com QR + botões WhatsApp/E-mail. |
| Formulários | `MomentForm`, `GuestbookForm` e formulários inline dos tabs de Saúde. | Inputs 2xl, borda `#C9D3C2`, estados disabled em `opacity-50`; mensagens auxiliares reforçam copy acolhedora. |

> Referência visual: tokens de cor, tipografia e raio moram em `apps/web/src/index.css`. Este arquivo deve ser visto como a implementação "live" das tabelas da Seção 5.

---

## 2. Filosofia de design e identidade

### 2.1 Princípios de experiência

Os princípios abaixo aparecem em todos os documentos do projeto; aqui, eles são traduzidos explicitamente em decisões de UI:

- **Calma intencional**:
  - Evitar múltiplos CTAs com peso visual igual.
  - Evitar componentes que “gritam” visualmente sem necessidade (cores vibrantes em excesso, tipografia exagerada).
  - Manter o foco em uma ação principal por tela e, no máximo, uma ação secundária bem clara.
- **Acolhimento**:
  - Estados vazios são convites, nunca broncas.
  - Linguagem sempre no eixo “vamos juntos” e não “você falhou”.
  - Em fluxos sensíveis (apagando momentos, selando cápsula, revogando acesso), dar contexto com poucas frases bem escolhidas.
- **Clareza radical**:
  - Ícones fundamentais (compartilhar, excluir, editar) sempre acompanham texto.
  - O usuário nunca deve se perguntar “pra onde foi parar isso?” — ações de resultado assíncrono (ZIP, PoD, transcode) sempre têm um lugar claro para acompanhar o progresso.
- **Privado por padrão**:
  - Acesso a conteúdos sensíveis (Saúde, Cofre) mostra ícones de cadeado, mensagens de privacidade e, em alguns casos, exige reautenticação.
  - Páginas públicas de compartilhamento não “puxam” o visitante para o app com dark patterns; o foco é exibir o momento, não converter a qualquer custo.
- **Digital-first, print-ready**:
  - Campos são pensados para caber em layouts de página sem forçar truncamentos estranhos.
  - A distribuição visual de fotos e textos considera a versão impressa como um caso de uso central, não secundário.

### 2.2 Tom de voz

O tom acompanha a estética visual: caloroso, próximo, sem ser infantilizado.

- Pode usar gírias leves (“tá tudo bem”, “vamo registrando aos poucos”), mas sem exagero.
- Evita frases duras (“você esqueceu”, “você não preencheu”).
- Trabalha muito com reforço positivo: “Momento registrado”, “Seu álbum está seguro”, “Pode voltar quando quiser, a gente guarda pra você”.

O design system não define só o que dizer, mas também onde e como isso aparece visualmente — seja num toast, num banner fixo ou em um estado vazio.

### 2.3 Papel do HUD, Jornada Guiada e “3 Livros”

- **HUD**: Elemento que sintetiza o que o sistema considera “próximo melhor passo”. Deve ser visualmente destacado, mas não agressivo. Ele não é um alarme, é um convite.
- **Jornada Guiada e templates fixos**:
  - Todos os momentos nascem de templates descritos no Catálogo.
  - A Jornada Guiada define ordem e contexto; a UI reflete essa ordem por meio do HUD, de marcadores de progresso e de estados de conclusão.
- **3 Livros**:
  - O design da **Jornada** privilegia memória afetiva: fotos grandes, relatos, títulos serifados.
  - A **Saúde** é mais contida, com ênfase em dados, ícones e tabelas.
  - **Visitas** traz equilíbrio: mensagem afetiva de quem escreve, mas com estrutura clara para moderação.

### 2.4 Coerência entre digital e print-ready

Toda decisão visual aqui deve considerar que o conteúdo pode ir parar num PDF ou num livro físico. O design system orienta:

- Comprimento razoável de títulos e relatos (para evitar quebras estranhas na página).
- Prioridade visual de fotos que provavelmente serão usadas como destaques no PoD.
- Uso cuidadoso de cores e fundos que não prejudiquem a leitura quando impressos.

### 2.5 Anti-padrões explícitos (o que não fazer)

O design system também registra proibições claras:

- Não usar *streaks* (sequências diárias) como mecanismo de pressão.
- Não usar badges numéricos em ícones de navegação para “cobrar” ações pendentes.
- Não usar linguagem que sugira culpa ou dívida por não registrar momentos.
- Não misturar conteúdo de Saúde com conteúdo social em telas públicas.

---

## 3. Fundamentos visuais

### 3.1 Paleta de cores (tokens de cor)

Os tokens de cor não são apenas uma paleta estética; são contratos de significado ao longo da experiência.

- `--bb-bg` (areia/quente `#F7F3EF`): É o pano de fundo quase onipresente do app. A sensação deve ser de “papel quente” ou “álbum físico na mesa”.
- `--bb-ink` (carvão macio `#2A2A2A`): Preto suavizado que evita contraste agressivo em ambientes de pouca luz.
- `--bb-muted` (sálvia `#C9D3C2`): Usado em divisórias, bordas discretas, placeholders e estados desativados. Mantém a interface organizada sem roubar atenção.
- `--bb-accent` (pêssego/argila `#F2995D`): O “toque de vida” da interface: CTAs, links importantes, progressos visuais.
- `--bb-danger` (rubi dessaturado `#C76A6A`): A cor do cuidado, não do pânico. Usada com parcimônia, associada a ações irreversíveis ou a falhas importantes.

Tokens derivados reforçam usos semânticos, como `bb-color-success` (para operações concluídas) ou `bb-color-info` (avisos neutros), sempre mantendo a paleta calma.

### 3.2 Tipografia (serif + sans)

A combinação serif + sans é parte fundamental da identidade:

- **Serif** sinaliza narrativa, memória, emoção (capítulos, nomes de momentos, títulos importantes).
- **Sans serif** sinaliza ferramenta, ação, status (botões, labels, formulários, feedback de sistema).

A hierarquia tipográfica é sempre óbvia:

- Títulos de tela e de capítulo usam serif, tamanhos maiores e mais respiro.
- Subtítulos e descrições curtas usam sans em peso médio.
- Corpo do texto fica na base 16/24, confortável em mobile.

### 3.3 Grid, espaçamento e layout

A sensação de calma também vem do espaço:

- Margens externas confortáveis nas laterais, evitando que conteúdo “cole” nas bordas.
- Cards com padding interno consistente.
- Separação clara entre blocos de conteúdo, usando `bb-space-4` (16 px) como espaçamento padrão vertical.

### 3.4 Bordas, cantos e elevação

- Cantos suavemente arredondados em quase tudo o que o usuário pode tocar.
- Elevação usada de forma intencional: HUD, modais e cards especiais se destacam mais; listas de itens repetidos ficam mais “chapadas” para não poluir.

### 3.5 Iconografia (lucide) e ilustrações

- **Ícones**:
  - Sempre com stroke consistente, sem variação de peso exagerada.
  - Usados para reforçar significado, não como elemento decorativo gratuito.
- **Ilustrações**:
  - Preferencialmente em estados vazios e em contextos de onboarding/guias.
  - Estilo alinhado à paleta, sem exagero de detalhes.

### 3.6 Uso de mídia (fotos, vídeos, áudios, documentos)

- Cada template define sua quantidade de slots, mas a UI usa os mesmos componentes (`BBPhotoUploadSlot`, `BBVideoUploadSlot`, `BBAudioUploadSlot`).
- Fotos têm tratamento consistente de recorte e borda.
- Áudios são sempre apresentados com play simples e wave ou barra de progresso discreta.
- Documentos no Cofre usam ícones e nomes claros (Certidão, CPF, SUS etc.), com distinção visual forte em relação a fotos afetivas.

### 3.7 Exemplos de combinações visuais típicas

Cada tipo de momento tem uma “cara” que pode ser descrita:

- **Momento de nascimento** → título grande serif, foto principal, campos estritamente estruturados (peso, altura), talvez um pequeno texto opcional.
- **Momento de “Primeira Gargalhada”** → título brincalhão, foto ou vídeo em destaque, relato curto, foco no sentimento.
- **Momento recorrente de saúde** → representação gráfica (gráfico de crescimento), mais texto técnico, menos “efeito scrapbook”.

### 3.8 Diretrizes de consistência visual entre plataformas

Mesmo que webs e apps nativos evoluam, o design system estabelece que:

- Cores, tipografia e hierarquias se mantenham equivalentes.
- Componentes de domínio (HUD, Card de Momento, Livro de Visitas) sejam reconhecíveis, mesmo que o layout mude.

---

## 4. Fundamentos de interação

### 4.1 Plataformas, contexto e “uma mão só”

O uso típico do Baby Book é em um smartphone, com uma mão livre e pouca paciência.
Isso implica:

- Evitar passos longos demais em sequência sem respiro.
- Trazer ações críticas para a parte inferior da tela.
- Priorizar interações de toque diretas em vez de elementos pequenos ou difíceis de atingir.

### 4.2 Estados de interação

Todos os componentes interativos devem expor visualmente quando estão:

- Em foco (via teclado ou acessibilidade).
- Em interação (pressionados).
- Desabilitados (de forma clara, mas ainda legível).
- Em estado de carregamento (indicando ação em curso).

### 4.3 Motion, preferências do sistema e performance percebida

- Animações ajudam a comunicar “transição suave”, não devem distrair.
- O sistema respeita a preferência global de redução de movimento.
- Motion é usado para guiar a atenção: entrada de HUD, abertura de modais, deslocamento de conteúdo ao navegar entre abas.

### 4.4 Feedback visual e textual por tipo de ação

Padrões gerais:

- **Ação instantânea** → feedback discreto (toast ou mudança visual).
- **Ação assíncrona** → indicar que algo está sendo processado, onde o usuário acompanha e quando ficará pronto.
- **Ação irreversível** → sempre acompanhada de diálogo solene com explicação em linguagem simples.

### 4.5 Acessibilidade (WCAG + ARIA) como padrão mínimo

O design system assume WCAG AA como baseline, não como “nice to have”. Isso inclui contraste, foco, descrição por ARIA e respeito a tecnologias assistivas.

### 4.6 Padrões de foco e navegação hierárquica

- Tabbing deve seguir a ordem visual da tela.
- Em modais, o foco fica preso até que o modal seja fechado (focus trap).
- Componentes críticos (botões primários, ações destrutivas) recebem foco de forma previsível.

---

## 5. Tokens de design

### 5.1 Convenções de nomenclatura

Tokens usam prefixo `bb-` para reforçar que pertencem ao design system do Baby Book e podem coexistir com outros sistemas.

### 5.2 Tokens de cor

Definem não só a aparência, mas também a semântica. Ex.: `bb-color-accent` = cor de ação positiva/primária; `bb-color-danger` = cor de risco ou erro.

### 5.3 Tokens de tipografia

Usados para garantir que telas diferentes usem os mesmos tamanhos e pesos, facilitando manutenção e consistência.

### 5.4 Tokens de espaçamento

Aplicados de forma consistente em cards, formulários, listas e layouts.

### 5.5 Tokens de bordas, sombras e z-index

Garantem que sobreposições (nav, modais, toasts) funcionem sem “gambiarra” de z-index local.

### 5.6 Tokens de motion

Padronizam a sensação de movimento, evitando que cada tela tenha um “timing” diferente.

### 5.7 Convenções de organização de tokens no código

Tokens ficam centralizados em uma lib de UI compartilhada, usados tanto no app web quanto nas superfícies futuras.

### 5.8 Exemplo de aplicação de tokens em um componente

Exemplo: `BBButton` usa `bb-color-accent` como fundo, `bb-color-text-on-accent` como cor do texto, `bb-radius-pill` para cantos e `bb-motion-fast` para transição de hover.

---

## 6. Componentes base (shadcn/ui + lucide)

### 6.1 Botões

O design system padroniza formas e variações, evitando que cada nova tela invente um botão diferente.

### 6.2 Inputs e formulários

Todos os formulários devem seguir as mesmas convenções de rótulo, placeholder, mensagem de erro e espaçamento entre campos, para criar memória muscular no usuário.

### 6.3 Seletores e chips

Usados para escolhas claras (únicas ou múltiplas) com representação visual amigável.

### 6.4 Cards e listas

Cards organizam conteúdo em blocos, listas o repetem de forma previsível. Ambos seguem os tokens de espaçamento, tipografia e sombra.

### 6.5 Modais, sheets e diálogos solenes

O sistema diferencia visualmente:

- **Diálogos comuns** (confirmações simples).
- **Diálogos solenes** (Cápsula, ações irreversíveis).
- **Diálogos de upsell** (transação, não punição).

### 6.6 Navegação (Bottom Nav, HUD, FAB)

A navegação reforça a metáfora dos 3 Livros e mantém o HUD e o FAB em posições previsíveis.

### 6.7 Feedback (toasts, banners, empty states, skeletons)

Feedback rápido, visível e não intrusivo, sempre com texto humano.

### 6.8 Convenções gerais de propriedades e estados

Componentes compartilham convenções de props (`variant`, `size`, `state`) para reduzir a complexidade mental de quem implementa.

---

## 7. Componentes de domínio — Baby Book

### 7.1 Card de Momento e estados

O `BBMomentCard` é a representação visual mínima de um momento na timeline/capítulos. Ele sintetiza mídia, título, data, privacidade e, eventualmente, tipologia.

### 7.2 Timeline, Capítulos e HUD (Jornada Guiada)

A aba Jornada é o coração do app. O design system fixou que ela sempre oferece:

- Uma timeline cronológica única.
- Uma visão por capítulos que lista todos eles, incluindo vazios.
- Um HUD que guia para o próximo passo.

### 7.3 Seletor de Criança e Perfil da Criança

O seletor de criança precisa ser claro, rápido de acessar e evitar confusão em famílias com mais de um álbum.

### 7.4 Livro de Visitas e moderação

O Livro de Visitas equilibra a liberdade dos convidados com a segurança e moderação do dono do álbum. A UI reflete isso com abas claras (Aprovadas/Pendentes), rótulos de ação evidentes (Aprovar/Rejeitar) e estados de feedback imediatos para quem envia e para quem modera.

### 7.5 Cápsula do Tempo

A Cápsula é tratada como um ritual. Visualmente, ela destoa levemente do resto do app, com peso maior em tipografia serif e cores mais profundas.

### 7.6 Aba Saúde (Vacinas, Consultas, Crescimento) e Cofre

A Saúde tem cara de painel de utilitário, sem perder o aconchego visual do produto, e nunca é exposta a terceiros não autorizados.

### 7.7 Exportar, PoD e Meus Pedidos

Padrões visuais reforçam a sensação de “processo em etapas”: selecionar conteúdo, revisar, aceitar riscos, acompanhar o pedido.

### 7.8 Compartilhamento e Guardiões

Fluxos de compartilhamento deixam muito claro quem está vendo o quê, por quanto tempo e como revogar.

### 7.9 Recorrentes (padrões de UI)

Recorrentes são tratados como uma categoria especial de momentos, com regras de contagem, limites gratuitos e upsell bem definidos visualmente.

### 7.10 Relação entre componentes de domínio e API

Cada componente de domínio tem relação direta com endpoints específicos. Por exemplo, `BBMomentCard` se alimenta de `/moments`, `BBGuestbookEntryCard` de `/guestbook`, `BBGrowthChart` de `/health/measurements` e assim por diante.

---

## 8. Padrões de telas (layouts)

### 8.1 Dashboard / Aba Jornada

A Dashboard é o ponto de retorno principal do usuário. Sua estrutura evita surpresas: HUD no topo, conteúdo logo abaixo, ações de criação sempre visíveis.

### 8.2 Perfis, abas e utilitários

Perfil da criança, Perfil do usuário, Saúde e Visitas compartilham layout de cabeçalho e padrões de navegação internos, facilitando o entendimento.

### 8.3 Páginas públicas de compartilhamento

As páginas públicas são simplificadas, focadas na visualização do momento, sem sobrecarregar com ações ou navegação ampla.

### 8.4 Exemplos de fluxos encadeados

Os fluxos descritos aqui servem como exemplos de como combinar componentes e padrões em jornadas coerentes.

### 8.5 Layouts de erro e estados de exceção

Há padrões específicos para quando algo dá muito errado (erro 500, queda de serviço, indisponibilidade temporária) para evitar telas “cruas”.

---

## 9. Conteúdo e microcopy

### 9.1 Diretrizes de linguagem

Sempre privilegiar clareza, brevidade e empatia. O tom padrão é "organizado, mas amigo".

### 9.2 Vocabulário canônico (glossário visual resumido)

O glossário garante que o app use sempre os mesmos termos para os mesmos conceitos.

### 9.3 Exemplos por contexto (Jornada, Saúde, Visitas, PoD, Cápsula)

Exemplos de mensagens em cada contexto ajudam redatores e designers a manter consistência.

### 9.4 Erros, avisos, upsell e confirmação

Erros explicam causa + ação; avisos preparam o usuário; upsells convidam, não pressionam; confirmações selam mudanças importantes.

---

## 10. Estados (vazio, carregamento, erro, offline)

### 10.1 Estados vazios por domínio

Cada domínio (Jornada, Saúde, Visitas, PoD, Pedidos) tem estados vazios próprios, com microcopy desenhada para incentivar o primeiro passo.

### 10.2 Carregamento e fila de upload

Uploads são críticos para o produto. A UI sempre deixa claro o que está em andamento, o que falhou, o que será retomado quando a conexão voltar.

### 10.3 Erros e recuperação

O design system define que o sistema deve ser resiliente: quando possível, manter o que já foi preenchido, mesmo se partes do fluxo falharem.

### 10.4 Estratégias de prevenção de frustração

Salvar rascunhos, avisar sobre offline, mostrar fila de upload, evitar *surprise deletes*.

### 10.5 Exemplos de fluxos resilientes

Ex.: Momento salvo com mídia ainda processando; PoD que falha apenas na pré-visualização, não na curadoria; export que pode ser refeito.

---

## 11. Acessibilidade e responsividade (critérios mínimos de release)

### 11.1 Critérios mínimos (WCAG AA)

O produto parte da premissa de inclusão, não de exceção. Os critérios de contraste, foco, texto alternativo e navegação via teclado são tratados como obrigatórios.

### 11.2 Padrões mobile-first e breakpoints

Layout começa em mobile e cresce de forma fluida para tablets e desktops em fluxos que se beneficiem disso (PoD, export, painel de pedidos).

### 11.3 Leitores de tela e navegação por teclado

Configuração de ARIA, ordem de tabulação, foco em modais e feedback via `aria-live` são itens de QA, não bônus opcionais.

### 11.4 Considerações para usuários exaustos, com uma mão ocupada

Botões grandes, formulários curtos, possibilidade de pausar e retomar, mensagens que reconhecem o contexto (“tá tudo bem fazer aos poucos”).

### 11.5 Checklist de acessibilidade para releases

Antes de cada release, verificar contraste, foco, labels de acessibilidade e se o fluxo principal funciona sem pointer (teclado, leitor de tela).

---

## 12. Telemetria visual e critérios de aceite (UI)

### 12.1 Eventos e instrumentação de UX

Eventos como `onboarding_completed`, `moment_saved`, `upload_failed`, `capsule_sealed` e `tab_viewed` devem ser mapeados visualmente em telas que fazem sentido.

### 12.2 Critérios de aceite por fluxo

Cada fluxo (onboarding, momentos, visitas, cápsula, PoD) tem critérios claros do que precisa funcionar visualmente para ser considerado "pronto".

### 12.3 Como usar telemetria para evoluir o design system

Métricas de uso (ex.: cliques em HUD, rejeição de upsell, abandono de PoD) retroalimentam decisões de melhoria de componentes.

### 12.4 Exemplos de hipóteses visuais ligadas a métricas

Ex.: Se poucos usuários completam curadoria de PoD, talvez o layout esteja denso demais; se muitos não entendem a aba Saúde, talvez o rótulo ou os cards precisem de ajustes.

---

## 13. QA visual e handoff

### 13.1 Checklist de QA visual

Verificar cores, tipografia, espaçamento, estados e consistência de componentes em cada tela.

### 13.2 Handoff para engenharia

Entregar specs claras, com variações de estado em Figma e documentação de props, principalmente para componentes de domínio.

### 13.3 Boas práticas de documentação em Figma

Usar auto-layout, variants e nomes consistentes com os componentes do código.

### 13.4 Ciclo de feedback entre squads

Design, engenharia e produto revisam juntos as telas principais, usando este documento como referência comum.

---

## 14. Itens opcionais (pós-MVP) e extensões do design system

Aqui vivem ideias como dark mode, temas alternativos, variações de layout para tablets e experiências adicionais com IA (tags automáticas, resumos de mês etc.).

---

## 15. Riscos de UX e diretrizes não negociáveis

Alguns riscos são considerados críticos demais para serem ignorados, e o design system estabelece guardrails:

- Não gerar sensação de cobrança ou culpa.
- Não expor dados de Saúde ou Cofre em superfícies públicas.
- Não forçar upsell de forma opaca ou enganosa.
- Não quebrar expectativa de privacidade da cápsula.

Qualquer nova feature deve ser avaliada contra esses princípios antes de ir para a tela. Ver também os anti-padrões da seção 2.5, que funcionam como uma lista prática do que nunca deve ser introduzido na experiência.
