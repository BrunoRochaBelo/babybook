# Catálogo de Momentos

Este documento é a "fonte da verdade" para o time de Produto e Engenharia sobre a estrutura de dados, regras de negócio e experiência do usuário (UX) de cada "Momento" do Baby Book. Ele serve como o blueprint para o Modelo de Dados (tabela `moment_template`) e a Modelagem de UI/UX.

## Rationale de Arquitetura de Informação (IA) - A Navegação dos 3 Livros

Para refletir a proposta de "3 livros em 1" na interface (UI) e tornar a proposta de valor clara para o usuário, a navegação principal da aplicação (ex: `BottomTabBar` em mobile) será dividida em três seções distintas:

### Livro de Memórias (Aba "Jornada" 📖)

- **Propósito**: O memorial afetivo. É a tela principal e o coração do app. É onde a história é contada.
- **Conteúdo**: Contém a timeline principal (Seção A) e o FAB (botão flutuante) para adicionar "Momento Avulso" (B.1).
- **Features de Contexto**: As features estruturais que dão contexto ao memorial (Árvore da Família B.2, Cápsula do Tempo B.5) ficam acessíveis através do "Perfil da Criança".

### Livro de Saúde (Aba "Saúde" 🩺)

- **Propósito**: O utilitário privado e funcional do `Owner`. É o "cofre" de dados práticos.
- **Conteúdo**: Agrupa os utilitários de acompanhamento. Contém "Curva de Crescimento" (4.1), "Visitas ao Pediatra" (4.2) e o "Cofre de Documentos" (B.4).
- **Acesso (RBAC)**: Esta aba inteira (e seu conteúdo) é visível apenas para usuários com papel `Owner`.
- **Implicação de Design**: Ocultar esta aba de `Guardians` e `Viewers` (Avós) não é apenas uma feature de permissão, é uma feature de confiança. A "Ana" (Persona Principal) precisa saber que seus dados médicos e documentos jamais serão vistos pelos avós, o que a encoraja a usar o app como seu repositório único de verdade.

### Livro de Visitas (Aba "Visitas" 💬)

- **Propósito**: O memorial social. É onde a "vila" (família estendida) interage com a criança.
- **Conteúdo**: Contém exclusivamente o "Livro de Visitas" (B.3).
- **Acesso (RBAC)**: Visível para `Owners` (com abas de "Aprovados" e "Pendentes") e `Guardians`/`Viewers` (vendo apenas "Aprovados").
- **Implicação de Design**: Ao separar o Guestbook da Jornada principal, protegemos o "memorial afetivo" (Jornada) de Ana do "ruído" social, mesmo que privado. Ana controla o ritmo, aprovando as mensagens quando tem tempo.

Esta Rationale de IA define a navegação principal do app. As seções abaixo detalham o conteúdo de cada tela.

---

## A. Capítulos de Memórias (A Timeline)

_(Conteúdo principal da Aba "Jornada" 📖)_

Estes são os momentos que compõem a "Jornada do Primeiro Ano" (nosso guia de momentos) e alimentam a timeline principal e o PoD. O guia é o nosso "nudge" central para combater a inércia; ele sugere uma estrutura, mas o usuário deve sempre ser capaz de adicionar "Momentos Avulsos" (via FAB - Floating Action Button) a qualquer momento.

> **Rationale de Arquitetura (Guia)**: Para combater a "inércia da página em branco" e dar ao usuário um "caminho" claro, o backend (Modelo de Dados, Seção 10.2, Job 2) deve, na criação da criança, gerar rascunhos (`drafts`) para todos os momentos de tipologia "Único" e "Série Fixa" (ex: "A Descoberta", "Seja Bem-Vindo", "Mêsversários").
> A UI (Modelagem de UI/UX, Seção 5.3) deve então exibir um 'Head-Up Display (HUD)' que destaca apenas o próximo momento sugerido no guia (ex: 'Próxima sugestão: O Primeiro Sorriso'). Isso transforma o app de uma ferramenta passiva em um guia ativo.

> **Implicação de Engenharia (Lógica do HUD)**: A lógica do "próximo momento sugerido" deve ser:
>
> 1. Buscar a `data_nascimento` da criança.
> 2. Se a `data_nascimento` não estiver definida, o HUD deve ser um CTA para "Definir Data de Nascimento".
> 3. Buscar todos os `moment` com `status = 'draft'`.
> 4. Ordenar os drafts pela data do evento (`occurred_at` ou data de agendamento do rascunho).
> 5. Priorizar o rascunho mais antigo pendente. Se a data do nascimento for $D$, o 'Primeiro Sorriso' ($D+45$) deve ser sugerido antes do 'Primeiro Dente' ($D+180$).
> 6. Se o usuário preencher um momento futuro (ex: "Primeiros Passos" antes do "Primeiro Dente"), o HUD deve retornar ao rascunho mais antigo pendente ("Primeiro Dente"). Isso garante que a jornada seja preenchida de forma cronológica, mas permite flexibilidade.

> **Rationale de Upsell (Momentos Recorrentes)**:
> Conforme a Visão & Viabilidade (Seção 3.1), o Plano Base (ticket — R$ 297 cartão / R$ 279 PIX) inclui 5 entradas gratuitas para cada momento de tipologia "Recorrente" (ex: "Visitas Especiais", "Galeria de Arte"). Ao tentar criar a 6ª entrada, a API (API Reference, Seção 4.4) retorna um erro `402 Payment Required`.

> **Implicação de Engenharia (Link DDL → API)**: Para que a API saiba qual upsell acionar, este Catálogo define a Categoria de Upsell de cada momento recorrente. Este Metadado (ex: `tracking`, `social`, `creative`) é armazenado na tabela `moment_template` (conforme Modelo de Dados 4.4) e é a chave que a API usa para retornar o erro `402` com o payload correto (ex: `details: { package_key: 'unlimited_tracking' }`).

---

### Cap. 1: A Jornada Começa (Gravidez e Parto)

#### 1.1. A Descoberta

| Propriedade          | Valor                                                           |
| -------------------- | --------------------------------------------------------------- |
| **Tipologia**        | Único                                                           |
| **key (ID Técnico)** | `descoberta`                                                    |
| **Limites de Mídia** | 1 Vídeo (10s), 1 Foto, 0 Áudio                                  |
| **Prompt/Dica**      | "O momento que tudo mudou! Conte como foi a grande descoberta." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `foto_teste` (UploadSlot, Obrigatório, label: "A foto que mudou tudo")
  - `video_reacao` (UploadSlot, Opcional, label: "Grave ou envie a reação [limite 10s]")
  - `relato` (TextArea, Opcional, placeholder: "Onde você estava? Quem foi o primeiro a saber?...")

> **Rationale (UX)**: Este é o ponto de partida emocional. A UI deve ser celebratória. O relato é opcional, mas o placeholder deve ser instigante para encorajar o storytelling.

- **Critérios de Aceite (MVP)**:
  - **UI**: O card na timeline deve destacar o Relato (se existir) e a Foto do Teste. Se o `video_reacao` existir, exibe um ícone de play.
  - **PoD**: Momento de página inteira. O layout deve priorizar a Foto do Teste e o Relato. O vídeo não é impresso no v1 (QR codes são v1.x).
  - **Aceite**: `data` e `foto_teste` são obrigatórios para salvar. O upload de vídeo deve validar 10s no client-side (via `HTMLVideoElement.duration`) e ser re-validado no server-side (worker) para garantir a Visão & Viabilidade (Custo de Compute).

---

#### 1.2. Diário da Barriga

| Propriedade             | Valor                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **Tipologia**           | Recorrente                                                               |
| **Categoria de Upsell** | `tracking` (Saúde/Acompanhamento)                                        |
| **Limites de Mídia**    | 0 Vídeo, 1 Foto, 0 Áudio                                                 |
| **Prompt/Dica**         | "Acompanhando o crescimento. Tente tirar a foto sempre do mesmo ângulo!" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `medidas_cm` (NumberInput, Opcional, label: "Medida da barriga (cm)")
  - `sentimentos` (TextArea, Opcional, placeholder: "Desejos, chutes, como você se sente hoje?")
  - `foto_barriga` (UploadSlot, Obrigatório, label: "Foto do perfil")

> **Rationale (PoD)**: O fluxo de 'Preview/Edição' do PoD (v1) não deve renderizar este momento por default. A UI de 'Edição do PoD' (v1.x) deve ter um widget específico "Adicionar Colagem da Barriga" que permite ao usuário selecionar (ex) 4 a 6 fotos desta série para criar uma página de colagem.

- **Critérios de Aceite (MVP)**:
  - **UI**: Na timeline principal, deve aparecer apenas a última entrada (para não poluir). O "Momento" em si deve ter uma visualização interna (ex: "Ver todas as entradas") que mostre a progressão (ex: grid ou carrossel).
  - **Upsell**: API (API Reference 4.4) deve bloquear a 6ª entrada (contando `moment` onde `template_key = 'diario_barriga'`) com erro `402` (código `unlimited_tracking`).
  - **Aceite**: `data` e `foto_barriga` são obrigatórias por entrada.

---

#### 1.3. Ouvimos seu Coração

| Propriedade          | Valor                              |
| -------------------- | ---------------------------------- |
| **Tipologia**        | Único                              |
| **Limites de Mídia** | 0 Vídeo, 1 Foto, 1 Áudio (30s)     |
| **Prompt/Dica**      | "O som mais emocionante do mundo." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `onde_foi` (TextInput, Opcional, label: "Clínica ou Médico")
  - `foto_ultrassom` (UploadSlot, Obrigatório, label: "A primeira foto oficial")
  - `audio_batimento` (AudioUploadSlot, Obrigatório, label: "Grave ou envie o som do coração [limite 30s]")

> **Rationale (Engenharia/UX)**: Alinhado com a Visão & Viabilidade (Seção 2.1), o limite de áudio é padronizado em 30 segundos (não 60s) para manter os custos de storage e compute (geração de waveform) baixos e previsíveis. O `AudioUploadSlot` (conforme Modelagem de UI/UX 6.2) deve ter um modo "Gravação" (usando `MediaRecorder` API) e um modo "Upload" (`<input type='file'>`).

- **Critérios de Aceite (MVP)**:
  - **UI**: O card na timeline deve exibir a Foto do Ultrassom com um player de áudio embutido (ex: `HTMLAudioElement` estilizado, mostrando duração `0:25 / 0:30`).
  - **PoD**: O layout deve focar na Foto do Ultrassom. O áudio não é impresso no v1 (QR codes são v1.x).
  - **Aceite**: `data`, `foto_ultrassom` e `audio_batimento` são obrigatórios. Upload de áudio deve validar o limite de 30s (no client e server).

---

#### 1.4. A História do seu Nome

| Propriedade          | Valor                                            |
| -------------------- | ------------------------------------------------ |
| **Tipologia**        | Único                                            |
| **Limites de Mídia** | 0 Vídeo, 1 Foto, 0 Áudio                         |
| **Prompt/Dica**      | "Todo nome tem uma história. Qual é a de vocês?" |

- **Campos (Engenharia)**:
  - `significado` (TextInput, Opcional, label: "Significado do nome")
  - `quem_escolheu` (TextInput, Obrigatório, label: "Quem escolheu (ou ajudou)?")
  - `por_que` (TextArea, Obrigatório, placeholder: "Foi uma homenagem? Um consenso? Conte a história...")
  - `foto_arte` (UploadSlot, Opcional, ex: arte com o nome, bordado)

> **Rationale (UX)**: Este é um momento de storytelling puro. O design da UI (Modelagem de UI/UX 3.2) deve tratar este card com elegância (ex: fontes serifadas para o `por_que`), como uma página de 'prefácio' de um livro.

- **Critérios de Aceite (MVP)**: `quem_escolheu` e `por_que` são os campos-chave (obrigatórios).

---

#### 1.5. Chá de Bebê / Revelação

| Propriedade          | Valor                                    |
| -------------------- | ---------------------------------------- |
| **Tipologia**        | Único                                    |
| **Limites de Mídia** | 1 Vídeo (10s), 5 Fotos, 0 Áudio          |
| **Prompt/Dica**      | "O dia da celebração! Como foi a festa?" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `tema` (TextInput, Opcional, label: "Tema da festa")
  - `destaques` (TextArea, Opcional, placeholder: "Momentos especiais, quem estava lá?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 5 Fotos)

> **Rationale (UX)**: Limite de mídia maior para acomodar a natureza de "festa" deste evento, mas ainda limitado (5F, 1V) para reforçar a "Curadoria Guiada" (Seção 2.1). O prompt deve guiar o usuário a escolher apenas os destaques, não a fazer um dump de 100 fotos.

- **Critérios de Aceite (MVP)**: `data` e pelo menos 1 Foto são obrigatórios.

---

#### 1.6. O Quartinho

| Propriedade          | Valor                                                      |
| -------------------- | ---------------------------------------------------------- |
| **Tipologia**        | Único                                                      |
| **Limites de Mídia** | 1 Vídeo (10s), 4 Fotos, 0 Áudio                            |
| **Prompt/Dica**      | "O cantinho mais especial da casa, pronto para a chegada." |

- **Campos (Engenharia)**:
  - `data_pronto` (DatePicker, Obrigatório, label: "Data em que ficou pronto")
  - `descricao` (TextArea, Opcional, placeholder: "Qual foi a inspiração? Quem montou?")
  - `galeria` (UploadSlots, Obrigatório (min 1), label: "Faça um tour pelo quartinho [vídeo limite 10s]")

- **Critérios de Aceite (MVP)**: `data` e pelo menos 1 Mídia (foto ou vídeo) são obrigatórios.

---

#### 1.7. Seja Bem-Vindo(a)!

| Propriedade          | Valor                                                   |
| -------------------- | ------------------------------------------------------- |
| **Tipologia**        | Único                                                   |
| **Limites de Mídia** | 0 Vídeo, 2 Fotos, 0 Áudio                               |
| **Prompt/Dica**      | "O momento da chegada! O cartão de nascimento oficial." |

- **Campos (Engenharia)**:
  - `data_nascimento` (DatePicker, Obrigatório)
  - `hora_nascimento` (TimeInput, Obrigatório, placeholder: "HH:MM")
  - `local` (TextInput, Obrigatório, label: "Hospital ou Local de Nascimento")
  - `peso_kg` (NumberInput, Obrigatório)
  - `altura_cm` (NumberInput, Obrigatório)
  - `foto_principal` (UploadSlot, Obrigatório)
  - `foto_secundaria` (UploadSlot, Opcional)

> **Rationale (UX/PoD)**: Este momento DEVE ter um layout de exibição especial (um "cartão" gráfico) na UI e ser a potencial "Página 1" do PoD. Os campos de dados (`peso_kg`, `altura_cm`) serão usados pelo Modelo de Dados (tabela `data`) para popular esse layout.

- **Critérios de Aceite (MVP)**:
  - **UI**: Na timeline, este momento renderiza como um "cartão de nascimento" gráfico.
  - **PoD**: Ocupa a primeira página do álbum físico (alta resolução).
  - **Aceite**: Todos os campos (exceto `foto_secundaria`) são obrigatórios. Validação de `NumberInput` (ex: `peso_kg > 0`, `altura_cm > 0`).

---

#### 1.8. Lembranças da Maternidade

| Propriedade          | Valor                                      |
| -------------------- | ------------------------------------------ |
| **Tipologia**        | Único                                      |
| **Limites de Mídia** | 0 Vídeo, 3 Fotos, 0 Áudio                  |
| **Prompt/Dica**      | "Guardando os pequenos detalhes da saída." |

- **Campos (Engenharia)**:
  - `relato_saida` (TextArea, Opcional, placeholder: "Como foi o dia da alta? Sentimentos?")
  - `foto_pulseirinha` (UploadSlot, Obrigatório (min 1), label: "Foto da pulseirinha")
  - `foto_roupinha` (UploadSlot, Opcional, label: "Foto da primeira roupinha")
  - `foto_saida` (UploadSlot, Opcional, label: "Foto da saída da maternidade")

- **Critérios de Aceite (MVP)**: UI deve exibir as 3 fotos em colagem com labels. Pelo menos 1 Foto (qualquer slot) é obrigatória.

---

### Cap. 2: Nosso Novo Lar (Os Primeiros Dias)

#### 2.1. A Chegada em Casa

| Propriedade          | Valor                                              |
| -------------------- | -------------------------------------------------- |
| **Tipologia**        | Único                                              |
| **Limites de Mídia** | 1 Vídeo (10s), 3 Fotos, 0 Áudio                    |
| **Prompt/Dica**      | "A primeira vez em casa. O início da nova rotina." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `video_entrada` (UploadSlot, Opcional, label: "O vídeo da chegada triunfal [limite 10s]")
  - `fotos_lar` (UploadSlots, Obrigatório (min 1), label: "As primeiras fotos no novo lar")
  - `relato` (TextArea, Opcional, placeholder: "Como foi a recepção? O pet conheceu o bebê? A primeira noite?")

- **Critérios de Aceite (MVP)**: `data` e pelo menos 1 Mídia (foto ou vídeo) são obrigatórios.

---

#### 2.2. Primeiro Banho em Casa

| Propriedade          | Valor                                          |
| -------------------- | ---------------------------------------------- |
| **Tipologia**        | Único                                          |
| **Limites de Mídia** | 1 Vídeo (10s), 2 Fotos, 0 Áudio                |
| **Prompt/Dica**      | "Gostou ou chorou? Como foi o primeiro banho?" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `quem_deu` (TextInput, Opcional, label: "Quem deu o banho?")
  - `relato` (TextArea, Obrigatório, placeholder: "Gostou ou chorou? Foi na banheira, no chuveiro?")
  - `galeria` (UploadSlots, Opcional, 1 Vídeo [limite 10s] + 2 Fotos)

- **Critérios de Aceite (MVP)**: `data` e `relato` são obrigatórios. Mídia é opcional, mas incentivada.

---

#### 2.3. Visitas Especiais

| Propriedade             | Valor                                                    |
| ----------------------- | -------------------------------------------------------- |
| **Tipologia**           | Recorrente                                               |
| **Categoria de Upsell** | `social` (Social/Família)                                |
| **Limites de Mídia**    | 1 Vídeo (10s), 3 Fotos, 0 Áudio                          |
| **Prompt/Dica**         | "Recebendo as pessoas que amamos (e que vieram ajudar)." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `quem_visitou` (TextInput, Obrigatório, label: "Quem veio ver o bebê?")
  - `relato` (TextArea, Opcional, placeholder: "Como foi o encontro?")
  - `fotos_visita` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 3 Fotos)

> **Rationale (UX)**: Este momento é a "cola" social. O campo "Quem visitou?" pode, no futuro (v1.x), ser vinculado à "Árvore da Família" (B.2) via autotagging.

- **Critérios de Aceite (MVP)**:
  - **UI**: Cada visita é um post individual na timeline. O título do card deve ser o campo `quem_visitou`.
  - **PoD**: Usuário deve poder selecionar quais visitas (entradas) quer imprimir.
  - **Upsell**: API deve bloquear a 6ª entrada com `402` (código `unlimited_social`).
  - **Aceite**: `data`, `quem_visitou` e 1 Foto são obrigatórios por entrada.

---

#### 2.4. Meu Cantinho de Dormir

| Propriedade          | Valor                       |
| -------------------- | --------------------------- |
| **Tipologia**        | Único                       |
| **Limites de Mídia** | 0 Vídeo, 2 Fotos, 0 Áudio   |
| **Prompt/Dica**      | "Onde os sonhos acontecem." |

- **Campos (Engenharia)**:
  - `foto_berco` (UploadSlot, Obrigatório, label: "Foto do berço ou caminha")
  - `foto_dormindo` (UploadSlot, Obrigatório, label: "Foto de um soninho tranquilo")
  - `relato` (TextArea, Opcional, placeholder: "Algum ritual para dormir?")

- **Critérios de Aceite (MVP)**: `foto_berco` e `foto_dormindo` são obrigatórias.

---

### Cap. 3: As Grandes Conquistas (Marcos)

> **Rationale de PoD (Layout)**: Sendo este o capítulo mais fragmentado, o motor de geração de PDF (v1) usará um template fixo de 'Colagem de Marcos', com slots definidos (ex: 4 marcos por página), onde o usuário poderá arrastar quais marcos preencherão quais slots.

#### 3.1. Primeiro Sorriso Social

| Propriedade          | Valor                                                    |
| -------------------- | -------------------------------------------------------- |
| **Tipologia**        | Único                                                    |
| **Limites de Mídia** | 1 Vídeo (10s), 2 Fotos, 0 Áudio                          |
| **Prompt/Dica**      | "Aquele sorriso que derreteu todo mundo! Para quem foi?" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `para_quem_foi` (TextInput, Opcional)
  - `relato` (TextArea, Opcional, placeholder: "Como foi o momento?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 2 Fotos)

- **Critérios de Aceite (MVP)**: `data` e 1 Mídia (foto ou vídeo) são obrigatórios.

---

#### 3.2. Primeiro "Gugu-Dada"

| Propriedade          | Valor                            |
| -------------------- | -------------------------------- |
| **Tipologia**        | Único                            |
| **Limites de Mídia** | 1 Vídeo (10s) OU 1 Áudio (30s)   |
| **Prompt/Dica**      | "Os primeiros sons e conversas." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `gravacao` (UploadSlot único, Obrigatório, label: "Grave ou envie a voz")
  - `legenda` (TextInput, Opcional, placeholder: "O que achamos que ele(a) disse?")

> **Rationale (UX/Eng)**: A UI deve apresentar um seletor (ex: Toggles): "Gravar Áudio" ou "Enviar Vídeo". O slot de upload se adapta ao tipo escolhido (limite de 10s para vídeo, 30s para áudio).

- **Critérios de Aceite (MVP)**: `data` e 1 Mídia (áudio ou vídeo) são obrigatórios.

---

#### 3.3. Primeiro Rolamento

| Propriedade          | Valor                          |
| -------------------- | ------------------------------ |
| **Tipologia**        | Único                          |
| **Limites de Mídia** | 1 Vídeo (10s), 1 Foto, 0 Áudio |
| **Prompt/Dica**      | "Descobrindo como se mover!"   |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `direcao` (TextInput, Opcional, label: "Do bruços para costas, ou vice-versa?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 1 Foto)

- **Critérios de Aceite (MVP)**: `data` e 1 Mídia (foto ou vídeo) são obrigatórios.

---

#### 3.4. Primeira Gargalhada

| Propriedade          | Valor                                     |
| -------------------- | ----------------------------------------- |
| **Tipologia**        | Único                                     |
| **Limites de Mídia** | 1 Vídeo (10s) OU 1 Áudio (30s)            |
| **Prompt/Dica**      | "A melhor risada do mundo. O que causou?" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `o_que_causou` (TextInput, Obrigatório)
  - `gravacao` (UploadSlot único, Obrigatório, label: "Grave ou envie a risada")

> **Rationale (UX/Eng)**: A UI deve apresentar um seletor (Toggles): "Gravar Áudio" ou "Enviar Vídeo" (limites 30s/10s).

- **Critérios de Aceite (MVP)**: `data`, `o_que_causou` e 1 Mídia (áudio ou vídeo) são obrigatórios.

---

#### 3.5. Primeira Comida (A Careta)

| Propriedade          | Valor                                 |
| -------------------- | ------------------------------------- |
| **Tipologia**        | Único                                 |
| **Limites de Mídia** | 1 Vídeo (10s), 2 Fotos, 0 Áudio       |
| **Prompt/Dica**      | "Hora da bagunça! Qual foi a reação?" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `o_que_comeu` (TextInput, Obrigatório, label: "O cardápio")
  - `reacao` (ChipSelect, Obrigatório, opções: ["Amou!", "Gostou", "Fez Careta 😖", "Odiou!"])
  - `video_reacao` (UploadSlot, Obrigatório (min 1), label: "O vídeo da reação! [limite 10s]")
  - `fotos_sujeira` (UploadSlots, Opcional, label: "Fotos da sujeira")

> **Rationale (UX)**: O `ChipSelect` é chave. Ele armazena um enum (`amou`, `odiou`) no Modelo de Dados (campo `data`), que permite futuras features (ex: 'Ver todas as reações a comidas').

- **Critérios de Aceite (MVP)**: UI divertida, destacando o `o_que_comeu` e o ícone da `reacao`. `data`, `o_que_comeu`, `reacao` e 1 Mídia (vídeo ou foto) são obrigatórios.

---

#### 3.6. Primeiro Dente

| Propriedade          | Valor                                      |
| -------------------- | ------------------------------------------ |
| **Tipologia**        | Único                                      |
| **Limites de Mídia** | 0 Vídeo, 1 Foto, 0 Áudio                   |
| **Prompt/Dica**      | "Olha a janelinha (ou o pontinho branco)!" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `qual_dente` (TextInput, Opcional, label: "Ex: Incisivo inferior esquerdo")
  - `foto_sorriso` (UploadSlot, Obrigatório)

- **Critérios de Aceite (MVP)**: `data` e `foto_sorriso` são obrigatórios.

---

#### 3.7. Primeiro Engatinhar

| Propriedade          | Valor                                          |
| -------------------- | ---------------------------------------------- |
| **Tipologia**        | Único                                          |
| **Limites de Mídia** | 1 Vídeo (10s), 1 Foto, 0 Áudio                 |
| **Prompt/Dica**      | "Rumo à independência! Qual o estilo dele(a)?" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `estilo` (TextInput, Opcional, placeholder: "Clássico, soldado, minhoca...?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 1 Foto)

- **Critérios de Aceite (MVP)**: `data` e 1 Mídia (foto ou vídeo) são obrigatórios.

---

#### 3.8. Primeira Palavra

| Propriedade          | Valor                          |
| -------------------- | ------------------------------ |
| **Tipologia**        | Único                          |
| **Limites de Mídia** | 1 Vídeo (10s) OU 1 Áudio (30s) |
| **Prompt/Dica**      | "O que ele(a) disse?"          |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `qual_foi` (TextInput, Obrigatório)
  - `gravacao` (UploadSlot único, Obrigatório, label: "Grave ou envie a palavra")

> **Rationale (UX/Eng)**: A UI deve apresentar um seletor (Toggles): "Gravar Áudio" ou "Enviar Vídeo" (limites 30s/10s).

- **Critérios de Aceite (MVP)**: `data`, `qual_foi` e 1 Mídia (áudio ou vídeo) são obrigatórios.

---

#### 3.9. Primeiros Passos

| Propriedade          | Valor                           |
| -------------------- | ------------------------------- |
| **Tipologia**        | Único                           |
| **Limites de Mídia** | 1 Vídeo (10s), 2 Fotos, 0 Áudio |
| **Prompt/Dica**      | "E saiu andando! Onde foi?"     |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `onde_foi` (TextInput, Opcional, placeholder: "Na sala, no parque, na casa da vovó?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 2 Fotos)

- **Critérios de Aceite (MVP)**: `data` e 1 Mídia (vídeo ou foto) são obrigatórios.

---

#### 3.10. Manias e Quirks

| Propriedade             | Valor                                                     |
| ----------------------- | --------------------------------------------------------- |
| **Tipologia**           | Recorrente                                                |
| **Categoria de Upsell** | `creative` (Criativo/Personalidade)                       |
| **Limites de Mídia**    | 1 Vídeo (10s), 1 Foto, 0 Áudio                            |
| **Prompt/Dica**         | "Aquelas manias fofas (ou engraçadas) que só ele(a) tem." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `qual_mania` (TextArea, Obrigatório, placeholder: "Dormir com um paninho, fazer careta para o cachorro...")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 1 Foto)

- **Critérios de Aceite (MVP)**:
  - **UI**: Cada "mania" é um post individual.
  - **Upsell**: API deve bloquear a 6ª entrada com `402` (código `unlimited_creative`).
  - **Aceite**: `data`, `qual_mania` e 1 Mídia são obrigatórios por entrada.

---

### Cap. 4: Crescendo (Saúde e Acompanhamento)

_(Arquitetura de UI: Conteúdo da Aba "Saúde" 🩺. Visível apenas para 'Owners')_

#### 4.1. Curva de Crescimento

| Propriedade             | Valor                             |
| ----------------------- | --------------------------------- |
| **Tipologia**           | Recorrente (Dados)                |
| **Categoria de Upsell** | `tracking` (Saúde/Acompanhamento) |
| **Limites de Mídia**    | 0 Vídeo, 0 Foto, 0 Áudio          |
| **Prompt/Dica**         | "Acompanhando o desenvolvimento." |

- **Interface (Formulário)**: Um formulário recorrente (não um momento único). Botão "Adicionar nova medição".
- **Campos**: `data` (Obrigatório), `peso_kg` (Obrigatório), `altura_cm` (Obrigatório), `perimetro_cef_cm` (Opcional).
- **Interface (Visualização)**: Uma aba dedicada que renderiza um gráfico (ex: Recharts) plotando os dados inseridos (Peso vs. Data, Altura vs. Data). (MVP v1: Apenas o gráfico do bebê. Comparação com curvas-padrão da OMS é v1.x).

> **Rationale (UX/Engenharia)**: Este é um utilitário. Ele vive na aba "Saúde" e é alimentado por múltiplas entradas na tabela `health_measurement` (conforme Modelo de Dados), não na tabela `moment`.

- **Critérios de Aceite (MVP)**:
  - **UI**: Uma feature na aba 'Saúde'. A UI deve ter 'Adicionar Medição' (formulário) e 'Ver Gráfico'.
  - **PoD**: O gráfico renderizado (como um PNG/SVG gerado no backend) pode ser uma página opcional no final do álbum, se o usuário (`Owner`) optar por incluí-lo.
  - **Upsell**: API deve bloquear a 6ª entrada com `402` (código `unlimited_tracking`).
  - **Aceite**: Formulário deve validar `data`, `peso_kg` (> 0) e `altura_cm` (> 0).

---

#### 4.2. Visitas ao Pediatra

| Propriedade             | Valor                                 |
| ----------------------- | ------------------------------------- |
| **Tipologia**           | Recorrente                            |
| **Categoria de Upsell** | `tracking` (Saúde/Acompanhamento)     |
| **Limites de Mídia**    | 0 Vídeo, 1 Foto, 0 Áudio              |
| **Prompt/Dica**         | "Registro das consultas importantes." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `medico` (TextInput, Opcional)
  - `motivo` (TextInput, Obrigatório, label: "Motivo da consulta", ex: "Rotina 6 meses", "Resfriado")
  - `anotacoes` (TextArea, Opcional, placeholder: "Recomendações, dúvidas...")
  - `foto_receita` (UploadSlot, Opcional, label: "Foto de Receita/Exame")

> **Rationale (UX)**: Utilitário para centralizar informações. Alto valor de uso, baixo valor de PoD.

- **Critérios de Aceite (MVP)**:
  - **UI**: Cada visita é um item em uma lista na aba 'Saúde' (não na timeline principal).
  - **PoD**: Este momento não é incluído no PoD v1 (dado utilitário/privado).
  - **Upsell**: API deve bloquear a 6ª entrada com `402` (código `unlimited_tracking`).
  - **Aceite**: `data` e `motivo` são obrigatórios por entrada.

---

#### 4.3. Galeria de Arte

| Propriedade             | Valor                                   |
| ----------------------- | --------------------------------------- |
| **Tipologia**           | Recorrente                              |
| **Categoria de Upsell** | `creative` (Criativo/Personalidade)     |
| **Limites de Mídia**    | 0 Vídeo, 1 Foto, 0 Áudio                |
| **Prompt/Dica**         | "Os primeiros rabiscos e obras-primas!" |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `descricao_arte` (TextArea, Opcional, placeholder: "O que ele(a) desenhou?")
  - `foto_rabisco` (UploadSlot, Obrigatório)

> **Rationale (IA)**: Este momento é um híbrido. É afetivo, mas não é um "marco". Ele deve aparecer na timeline principal (Aba "Jornada").

- **Critérios de Aceite (MVP)**:
  - **UI**: Cada arte é um post na timeline.
  - **PoD**: O gerador de PoD pode ter uma seção "Galeria de Arte" com uma colagem das fotos.
  - **Upsell**: API deve bloquear a 6ª entrada com `402` (código `unlimited_creative`).
  - **Aceite**: `data` e `foto_rabisco` são obrigatórios por entrada.

---

### Cap. 5: Celebrações (Festas e Datas Especiais)

_(Conteúdo da Aba "Jornada" 📖)_

> **Rationale de Jornada (Pós-Guia)**: A "Jornada do Primeiro Ano" (nosso guia) se encerra no "Primeiro Aniversário". Após este marco, a UI deve celebrar a conclusão (ex: "Parabéns, você completou a jornada do primeiro ano!") e exibir um CTA principal para o PoD (ex: "Que tal materializar essa jornada? Veja como seu álbum impresso ficaria!").
> O app continua 100% funcional. Um "Guia do Segundo Ano" (com novos marcos) é a feature de LTV do Ano 2 (v1.x / v2), conforme Visão & Viabilidade (Seção 7.2.1).

#### 5.1. Mêsversários (1-11m)

| Propriedade          | Valor                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Tipologia**        | Série Fixa (11 entradas)                                                                 |
| **Limites de Mídia** | 1 Vídeo (10s), 3 Fotos, 0 Áudio                                                          |
| **Prompt/Dica**      | "Feliz $X$ meses! Tente tirar a foto principal no mesmo lugar para criar um time-lapse." |

- **Tipologia (Engenharia)**: Série Fixa. O backend (Job 2) deve gerar 11 instâncias de rascunho (`drafts`) na criação da criança. As notificações (sussurros) para preencher devem ser passivas (ex: um badge na UI), não um push notification, para evitar ansiedade.

- **Campos (Engenharia)**:
  - `foto_principal` (UploadSlot, Obrigatório, label: "Foto do mês! (Para o time-lapse)")
  - `galeria` (UploadSlots, Opcional, 1 Vídeo [limite 10s] + 2 Fotos)
  - `peso_altura` (NumberInput, Opcional)
  - `destaques_mes` (TextArea, Opcional, placeholder: "O que aprendeu de novo?...")

- **Critérios de Aceite (MVP)**:
  - **UI**: A UI deve ter uma visualização especial para a série, mostrando o "time-lapse" das `foto_principal` mês a mês.
  - **PoD**: O layout deve criar 1-2 páginas de colagem com as 11 `foto_principal`.
  - **Aceite**: Backend deve gerar os 11 rascunhos. Cada entrada preenchida requer `data` e `foto_principal`.

---

#### 5.2. Primeiro Aniversário (12m)

| Propriedade          | Valor                                      |
| -------------------- | ------------------------------------------ |
| **Tipologia**        | Único                                      |
| **Limites de Mídia** | 2 Vídeos (10s), 10 Fotos, 0 Áudio          |
| **Prompt/Dica**      | "O primeiro ano completo! O grande marco." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `tema_festa` (TextInput, Opcional)
  - `relato_dia` (TextArea, Obrigatório, placeholder: "Como foi a festa? Quem estava lá?...")
  - `galeria_festa` (UploadSlots, Obrigatório (min 1), 2 Vídeos [limite 10s/cada] + 10 Fotos)

- **Critérios de Aceite (MVP)**: `data`, `relato_dia` e pelo menos 1 Foto são obrigatórios. Upload de vídeo deve validar o limite de 10s por arquivo.

---

#### 5.3. Primeiro Natal

| Propriedade          | Valor                           |
| -------------------- | ------------------------------- |
| **Tipologia**        | Único                           |
| **Limites de Mídia** | 1 Vídeo (10s), 3 Fotos, 0 Áudio |
| **Prompt/Dica**      | "O primeiro Natal em família."  |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `onde_passamos` (TextInput, Opcional)
  - `relato` (TextArea, Opcional, placeholder: "Como foi a celebração?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 3 Fotos)

- **Critérios de Aceite (MVP)**: `data` e 1 Foto são obrigatórios.

---

#### 5.4. Primeira Páscoa

| Propriedade          | Valor                             |
| -------------------- | --------------------------------- |
| **Tipologia**        | Único                             |
| **Limites de Mídia** | 1 Vídeo (10s), 3 Fotos, 0 Áudio   |
| **Prompt/Dica**      | "A primeira visita do coelhinho." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `relato` (TextArea, Opcional, placeholder: "Entendeu o coelhinho? Se lambuzou de chocolate?")
  - `galeria` (UploadSlots, Obrigatório (min 1), 1 Vídeo [limite 10s] + 3 Fotos)

- **Critérios de Aceite (MVP)**: `data` e 1 Foto são obrigatórios.

---

#### 5.5. Primeiro Dia das Mães/Pais

| Propriedade          | Valor                                                 |
| -------------------- | ----------------------------------------------------- |
| **Tipologia**        | Único                                                 |
| **Limites de Mídia** | 1 Vídeo (10s), 3 Fotos, 0 Áudio                       |
| **Prompt/Dica**      | "O primeiro Dia das Mães/Pais como uma nova família." |

- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `relato` (TextArea, Obrigatório, focado no progenitor, placeholder: "Uma mensagem para a mamãe/papai...")
  - `galeria` (UploadSlots, Opcional, 1 Vídeo [limite 10s] + 3 Fotos)

- **Critérios de Aceite (MVP)**: `data` e `relato` são obrigatórios.

---

## B. Features Estruturais (Fora da Timeline)

Estas são áreas-chave do app que não são "capítulos" da timeline, mas sim funcionalidades centrais de engajamento, utilidade e perfil.

### B.1. Momento Avulso (Genérico)

| Propriedade          | Valor                                                    |
| -------------------- | -------------------------------------------------------- |
| **Tipologia**        | Genérico (FAB)                                           |
| **Localização**      | FAB (Floating Action Button) global na Aba "Jornada" 📖. |
| **Limites de Mídia** | 2 Vídeos (10s), 10 Fotos, 0 Áudio                        |

- **Descrição**: Este é o "catch-all" (pega-tudo) para qualquer memória que não se encaixa nos momentos pré-definidos do Guia. É a "página em branco" opcional.
- **Campos (Engenharia)**:
  - `data` (DatePicker, Obrigatório)
  - `titulo` (TextInput, Obrigatório, label: "Qual é a lembrança?")
  - `relato` (TextArea, Opcional)
  - `galeria` (UploadSlots, Obrigatório (min 1), 2 Vídeos [limite 10s/cada] + 10 Fotos)

> **Rationale (UX)**: Dar liberdade ao usuário é crucial. O FAB é a principal porta de entrada para usuários proativos. Os limites de mídia devem ser generosos (iguais ao "Primeiro Aniversário"). Este momento não conta para o upsell de repetição, para não punir a criatividade do usuário.

- **Critérios de Aceite (MVP)**:
  - **PoD (v1)**: Momentos Avulsos não são incluídos por padrão. O fluxo de 'Preview/Edição' do PoD (v1) deve permitir ao usuário selecionar quais 'Momentos Avulsos' ele deseja incluir.
  - **Aceite**: `data`, `titulo` e pelo menos 1 Mídia (foto ou vídeo) são obrigatórios.

---

### B.2. Árvore da Família

| Propriedade          | Valor                                                           |
| -------------------- | --------------------------------------------------------------- |
| **Tipologia**        | Configuração / Perfil                                           |
| **Localização**      | Acessível via "Perfil da Criança" (dentro da Aba "Jornada" 📖). |
| **Limites de Mídia** | 1 Foto por pessoa (slot)                                        |

- **Descrição**: É um modelo visual que ancora o contexto social da criança.
- **Campos (Engenharia)**: Slots Nomeados (`UploadSlot` + `TextInput`) para: (Pai/Mãe 1), (Pai/Mãe 2), (Avós Maternos), (Avós Paternos), (Padrinhos).

> **Rationale (UX)**: Isso personaliza o app e permite tagging futuro (v1.x) em fotos e momentos ("Visita da Vovó Maria").

- **Critérios de Aceite (MVP)**:
  - **UI**: Uma visualização gráfica (não uma lista) que mostra a árvore.
  - **PoD (v1)**: Será incluída automaticamente como uma das páginas iniciais (ex: "Nossa Família") se pelo menos um slot (ex: Pai/Mãe 1) tiver sido preenchido.
  - **Aceite**: Todos os campos são opcionais.

---

### B.3. Livro de Visitas (Guestbook)

| Propriedade             | Valor                             |
| ----------------------- | --------------------------------- |
| **Tipologia**           | Especial (Moderação) / Recorrente |
| **Localização**         | Aba principal "Visitas" 💬.       |
| **key (ID Técnico)**    | `guestbook`                       |
| **Categoria de Upsell** | `social` (Social/Família)         |
| **Limites de Mídia**    | 1 Foto OU 1 Áudio (30s)           |

- **Descrição**: Funcionalidade central de engajamento para a família estendida ("Momento Aha!", Modelagem de Produto 7.0).
- **Fluxo de Criação (Visitante)**: O `Guardian`/`Viewer` (ex: Avô "Sérgio") ou o "Link Público" (se habilitado pelo `Owner`) vê um botão "Deixar uma Mensagem".
- **Campos (Visitante)**:
  - `nome_visitante` (TextInput, Obrigatório)
  - `mensagem` (TextArea, Obrigatório)
  - `midia` (Slot único, Opcional - 1 Foto OU 1 Áudio [limite 30s], para evitar abuso de Opex).
- **Fluxo de Moderação (Owner)**: O `Owner` (Ana) recebe uma notificação sutil ("Nova mensagem no Livro de Visitas"). A mensagem só se torna pública após a aprovação.

- **Critérios de Aceite (MVP)**:
  - **UI**: A tela do Guestbook (Aba "Visitas") tem duas abas para o `Owner`: "Aprovados" (público) e "Pendentes" (fila de moderação). O `Viewer` vê apenas a aba "Aprovados".
  - **PoD (v1)**: O fluxo de checkout do PoD deve exibir uma checkbox (marcada por padrão): 'Incluir o Livro de Visitas no final do álbum?'.
  - **Upsell**: API deve bloquear a 6ª entrada com `402` (código `unlimited_social`).
  - **Aceite**: `nome` e `mensagem` são obrigatórios para o visitante enviar.

---

### B.4. Cofre de Documentos

| Propriedade          | Valor                                                |
| -------------------- | ---------------------------------------------------- |
| **Tipologia**        | Utilitário / Admin                                   |
| **Localização**      | Aba "Saúde" 🩺, em uma seção/aba interna "Cofre" 🔒. |
| **Limites de Mídia** | 1 Arquivo por slot (PDF ou Foto)                     |

- **Descrição**: É um utilitário, não uma memória.
- **Campos (Engenharia)**:
  - Slots nomeados para Foto/PDF da Certidão (`UploadSlot`)
  - Foto/PDF do CPF/RG (`UploadSlot`)
  - Foto/PDF Cartão SUS/Plano (`UploadSlot`)

> **Rationale (UX/Segurança)**: Conteúdo 100% privado. A localização na aba "Saúde" (visível apenas para `Owners`) reforça que é um "cofre".

- **Critérios de Aceite (MVP)**:
  - **UI**: Acessível apenas pela Aba "Saúde". A UI deve ter ícones de 'cadeado' 🔒.
  - **PoD**: Estes dados NUNCA são incluídos em NENHUMA exportação de PoD. Isso é um critério de segurança.
  - **Aceite**: Upload deve aceitar PDF e Imagens. O RBAC do backend (API Reference e Modelo de Dados 8.3) deve bloquear `Viewer` e `Guardian` desta rota (retornar `403 Forbidden`).

---

### B.5. Cápsula do Tempo

| Propriedade          | Valor                                                           |
| -------------------- | --------------------------------------------------------------- |
| **Tipologia**        | Especial (Selado)                                               |
| **Localização**      | Acessível via "Perfil da Criança" (dentro da Aba "Jornada" 📖). |
| **Limites de Mídia** | 1 Vídeo (10s) OU 1 Áudio (30s)                                  |

- **Descrição**: Feature de altíssimo valor emocional e retenção a longo prazo (Modelagem de Produto 11.2).
- **Campos (Engenharia)**:
  - **Carta de Boas-Vindas**: (`De`: TextInput, `Texto`: RichTextArea). Fica aberta.
  - **Carta de 1 Ano**: (`De`: TextInput, `Texto`: RichTextArea). Fica aberta.
  - **Carta para o Futuro**:
    - `data_abertura` (DatePicker, Obrigatório, min=10 anos, max=25 anos)
    - `de` (TextInput, Obrigatório)
    - `texto` (RichTextArea, Obrigatório)
    - `midia` (AudioUploadSlot ou VideoUploadSlot, Opcional, 1V[10s] OU 1A[30s])

> **Rationale (Engenharia v1)**:
>
> - **Alinhamento de Mídia**: O limite de vídeo foi corrigido para 10s (e áudio 30s) para alinhar com o stack de compute (Modal) e a Visão & Viabilidade.
> - **RichText (MVP)**: O escopo do `RichTextArea` no MVP v1 é estritamente: Negrito, Itálico, Listas (bullet/número) e Quebras de Linha.
> - **PoD (v1)**: O motor de geração de PDF fará best-effort para converter essa formatação.

> **Rationale (UX/Engenharia)**:
>
> - A UI deve ser "solene". Uma carta só é "selada" quando a `data_abertura` é definida.
> - O backend (Modelo de Dados 8.3) bloqueia a leitura (nem mesmo o `Owner` pode ver) até a `data_abertura`.
> - Na data, o Job 3 (Modelo de Dados 10.3) dispara um e-mail de notificação: "Sua Cápsula do Tempo para $Bebê$ pode ser aberta!".

- **Critérios de Aceite (MVP)**:
  - **UI**: A "Carta para o Futuro" deve ter um estado visual de "Selada", com a `data_abertura` visível. O botão "Editar" deve sumir após "Selar".
  - **PoD**: As cartas "Abertas" (Boas-Vindas, 1 Ano) podem ser incluídas no PoD. A carta "Selada" não pode.
  - **Aceite**: Backend deve ter o Job 3 (cron) que verifica diariamente as cartas. A API deve bloquear (`403 Forbidden`) qualquer tentativa de leitura do conteúdo antes da data.
