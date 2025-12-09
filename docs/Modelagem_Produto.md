# Modelagem de Produto — Baby Book

Este documento é a "fonte da verdade" para o time de Produto, UX e UI. Ele traduz a tese de negócio (definida na Visão & Viabilidade) e as capacidades técnicas (definidas na Arquitetura) em uma experiência de usuário coesa.

## Sumário

- [Visão do Produto (A Proposta de Valor)](#visão-do-produto-a-proposta-de-valor)
- [A Tese do Produto (O "Porquê")](#a-tese-do-produto-o-porquê)
  - [O Princípio da "Curadoria Guiada"](#o-princípio-da-curadoria-guiada)
  - [O Princípio da "Calma e Privacidade" (O Anti-Rede Social)](#o-princípio-da-calma-e-privacidade-o-anti-rede-social)
- [Personas (Para Quem Estamos Construindo)](#personas-para-quem-estamos-construindo)
  - [Persona Primária (O Usuário Comprador)](#persona-primária-o-usuário-comprador)
  - [Persona Secundária (O Ecossistema)](#persona-secundária-o-ecossistema)
- [O Loop de Engajamento (Core Loop)](#o-loop-de-engajamento-core-loop)
- [A Modelagem do Negócio (Produto & Finanças)](#a-modelagem-do-negócio-produto--finanças)
  - [O Produto Principal: "Acesso Perpétuo" (O Cofre)](#o-produto-principal-acesso-perpétuo-o-cofre)
  - [O Upsell: "Pacote Completo" (O Valor)](#o-upsell-pacote-completo-o-valor)
- [A Jornada do Usuário (Onboarding & Conversão)](#a-jornada-do-usuário-onboarding--conversão)
  - [Jornada A: Aquisição B2C (Varejo Digital)](#jornada-a-aquisição-b2c-varejo-digital)
  - [Jornada B: Aquisição B2B2C (Voucher de Parceiro)](#jornada-b-aquisição-b2b2c-voucher-de-parceiro)
- [O "Momento Aha!" (O Gatilho da Retenção)](#o-momento-aha-o-gatilho-da-retenção)
- [O Gatilho de Upsell (O Fluxo de Caixa)](#o-gatilho-de-upsell-o-fluxo-de-caixa)
- [Métricas-Chave (KPIs de Produto)](#métricas-chave-kpis-de-produto)
- [Os Anti-Padrões (O Que Não Fazer)](#os-anti-padrões-o-que-não-fazer)
  - [A Armadilha do Freemium / Trial](#a-armadilha-do-freemium--trial)
  - [A Armadilha da "Ferramenta" (Ser o Google Photos)](#a-armadilha-da-ferramenta-ser-o-google-photos)
  - [A Armadilha da "Rede Social" (Ser o Instagram)](#a-armadilha-da-rede-social-ser-o-instagram)
- [O Roadmap Futuro (Extensões de Valor)](#o-roadmap-futuro-extensões-de-valor)
  - [Print-on-Demand (PoD) (Extensão de LTV)](#print-on-demand-pod-extensão-de-ltv)
  - [Cápsula do Tempo (Extensão de Retenção)](#cápsula-do-tempo-extensão-de-retenção)

## Visão do Produto (A Proposta de Valor)

O Baby Book é um álbum vivo, digital e privado, focado em curadoria guiada para combater o caos da paternidade moderna.
Nossa proposta de valor não é "armazenamento" (um Dropbox glorificado) nem "performance social" (um Instagram privado). Nossa proposta é transformar a ansiedade de registrar memórias em um ato de prazer e calma.
Nossos concorrentes não são apenas outros apps de bebê; são o rolo da câmera caótico, o Google Photos (um "depósito" sem alma) e o Instagram (um "palco" que gera ansiedade).
Resolvemos duas dores centrais:

- A Dor do Caos: O rolo da câmera dos pais é um cemitério digital com 10.000 fotos não organizadas. O Google Photos "ajuda" criando álbuns aleatórios, mas ele não conta uma história.
- A Dor da Impermanência: Não é apenas o medo de perder os arquivos; é o medo de perder a história. É a culpa e a ansiedade de ser um "mau guardião" da memória, de acordar daqui a 5 anos e não ter nada tangível para mostrar ao filho, apenas um mar de arquivos digitais descontextualizados.

O Baby Book resolve isso sendo um "Guia de Curadoria", não uma "Caixa de Entrada". Nós não perguntamos "O que você quer salvar?", nós perguntamos "Vamos salvar o 'Primeiro Sorriso' juntos?".

## A Tese do Produto (O "Porquê")

Nossa tese de produto é que, na era da superexposição, a verdadeira necessidade do usuário é foco, privacidade e calma. Todo o design da aplicação deve refletir isso.

### O Princípio da "Curadoria Guiada"

- **O Problema:** A "Paralisia da Tela em Branco". Pedir a um pai exausto, às 22h, para "organizar suas fotos" é uma tarefa esmagadora que ele irá procrastinar indefinidamente.
- **A Solução (O "HUD"):** O Catálogo de Momentos.pdf (nosso backend de IA) é a nossa arma secreta. Ele é o "roteiro" do filme. O frontend (UI) deve traduzir esse catálogo em um "Head-Up Display (HUD)" (Seção 4). O HUD é o nosso "Product Manager" embutido no app, sentando ao lado do usuário.
- **Implicação de Design:** A tela inicial do app não é um feed infinito nem uma grade de 40 álbuns (o que geraria ansiedade de "tarefas pendentes"). É uma pergunta simples, singular e acionável: "Vamos registrar o 'Primeiro Sorriso'? Aqui está o que você precisa." O produto transforma uma maratona (organizar 1.000 fotos) em 40 sprints de 5 minutos (preencher um momento guiado).

### O Princípio da "Calma e Privacidade" (O Anti-Rede Social)

- **O Problema:** Redes sociais (Instagram, Facebook) são otimizadas para ansiedade e performance. O usuário posta uma foto do filho e fica refém de likes, comentários de estranhos e da necessidade de projetar uma imagem de "paternidade perfeita".
- **A Solução:** O Baby Book é um cofre, não um palco. Nós otimizamos para "paz de espírito", não para "tempo de tela".
- **Implicação de Design:**
  - Zero Likes: Não há contagem de likes ou "engajamento" público.
  - Compartilhamento Privado: O compartilhamento (Seção 4) é feito via links privados ou convites diretos (Guardian), focados em um círculo íntimo (Avós, Padrinhos).
  - Design "Zen": A UI deve usar cores calmas, tipografia elegante e espaços em branco generosos. A experiência deve parecer um álbum de capa de couro, não um aplicativo de fast-food piscando notificações.
  - Sem Notificações Ansiosas: Não deve haver badges de notificação vermelhos. Um novo comentário no Guestbook (Seção 7) deve ser um badge sutil e passivo, ou um resumo diário ("Sua família deixou 3 recados hoje"). Estamos projetando um produto para ser usado 5 minutos por dia, e depois fechado com a sensação de "missão cumprida".

## Personas (Para Quem Estamos Construindo)

Toda decisão de design deve ser filtrada por estas duas personas principais.

### Persona Primária (O Usuário Comprador)

- **Nome:** Ana, a "Guardiã da Memória" (32 anos).
- **Perfil:** Mãe ou pai de primeira viagem. Planejadora, ansiosa, sobrecarregada. Usa Instagram, mas se ressente da pressão social. Tecnicamente fluente (iPhone 14, Google Photos), mas acha essas ferramentas "mortas" — são depósitos de arquivos, não contadores de histórias.
- **Dor Principal:** "Meu celular tem 5.000 fotos do Bento. Eu sei que deveria estar organizando isso, mas estou exausta. Tenho pavor de acordar daqui a 5 anos e não ter nenhuma história real para contar, só um monte de arquivos soltos."
- **Cenário de Uso (Ana):** São 22h, o bebê finalmente dormiu. Ela abre o app. O HUD (Seção 4) sugere: "Que tal registrar a 'Primeira Papinha' (A Careta)?". Ela sorri, lembra do vídeo que fez à tarde. Em 3 minutos, ela anexa o vídeo, escolhe a tag "Fez Careta" e escreve duas linhas. Ela sente "missão cumprida" e vai dormir aliviada.
- **O que Ana Compra:** Ana não compra "2 GiB de storage". Ela compra "paz de espírito" e a garantia de que não está falhando em registrar a história do filho. O gatilho de compra dela (na Landing Page) não é o preço, mas a visualização de um mockup do álbum impresso (o PoD, Seção 11.1), que faz a proposta de valor se tornar tangível.

### Persona Secundária (O Ecossistema)

- **Nome:** Sérgio, o "Convidado de Honra" (65 anos).
- **Perfil:** Avô (ou tia, madrinha). Menos fluente em tecnologia. Ama o neto incondicionalmente, mas mora em outra cidade.
- **Dor Principal:** "Eu odeio o Facebook. Só o uso para ver as fotos do meu neto, mas me perco no meio de anúncios e política. Eu só queria um lugar simples para ver as fotos novas e deixar um recado carinhoso."
- **Cenário de Uso (Sérgio):** Ele recebe um link no WhatsApp. Clica. Vê uma página linda e limpa (o apps/edge da Arquitetura) com o vídeo do "Primeiro Engatinhar". Ele não precisa de login. Ele vê um campo (o Guestbook) e escreve: "Que orgulho, campeão! Vovô te ama." Ana (a Guardiã) recebe a mensagem, aprova, e o comentário de Sérgio fica registrado para sempre junto com a memória.
- **O que Sérgio Valoriza:** Simplicidade, zero fricção, zero ruído (anúncios).
- **Implicação Técnica:** A página de SSR (Server-Side Rendering) que Sérgio vê deve ser extremamente leve (sem bundles de JS pesados) e carregar rápido, mesmo em um celular Android mais antigo com internet 3G. A escolha da Arquitetura por SSR leve (apps/edge) é, portanto, um requisito de produto para servir a esta persona.

## O Loop de Engajamento (Core Loop)

O produto é desenhado para criar um loop de hábito positivo que se auto-reforça. O design deve focar em otimizar a velocidade e a carga emocional de cada passo.

- **Gatilho (O "HUD"):** O usuário (Ana) abre o app. A UI, baseada no Catálogo de Momentos, sugere o próximo momento cronológico vago (ex: "Primeiro Sorriso").
  - **Monólogo Interno de Ana:** "Ah, é verdade, o primeiro sorriso! Eu filmei isso ontem."
  - **Implicação de UI:** A tela inicial não é uma lista de 40 itens. É um card de foco único.
- **Ação (Preenchimento Rápido):** A UI do momento é um formulário guiado (ex: "Anexe 1 vídeo (10s), 2 fotos, e conte a reação").
  - **Monólogo Interno:** "Fácil. Vídeo aqui, foto aqui... 'Reação: Fez careta'. Salvar."
  - **Implicação de UI:** O formulário deve ser curto e os limites (10s vídeo) devem ser claros.
- **Recompensa (Valor Entregue):** Ana salva. O momento é renderizado em um template bonito. Ela vê sua "Jornada" (timeline) crescendo.
  - **Monólogo Interno:** "Ufa. Feito. O álbum está ficando lindo. Não estou deixando passar."
  - **Implicação de UI:** O feedback visual (o layout do momento salvo) deve ser imediato e bonito.
- **Investimento (Compartilhamento):** O app sugere: "Compartilhar com os avós?".
  - **Monólogo Interno:** "Claro. Deixa eu mandar pra minha mãe (Sérgio)."
  - **Implicação de UI:** O botão de compartilhar (para Guardian ou link) é o CTA secundário mais importante.
- **Recompensa Social (O Aha! Moment):** Sérgio responde via Guestbook. Ana vê o comentário carinhoso do pai dentro do app, associado à memória. O valor do álbum aumentou: agora ele contém a memória e a reação da família.
  - **Monólogo Interno:** "Nossa, o comentário do meu pai! Que fofo! Isso é muito melhor que um 'like' no Insta."
- **Ciclo:** Isso reforça o valor do app para Ana, que se sente motivada a preencher o próximo nudge do HUD.

## A Modelagem do Negócio (Produto & Finanças)

O design do produto deve servir ao modelo financeiro (Visão & Viabilidade). Nosso modelo é o Acesso Perpétuo + Upsell de Valor.

### O Produto Principal: "Acesso Perpétuo" (O Cofre)

- **O que é (Finanças):** O pagamento único de ticket (R$ 279 PIX / R$ 297 cartão). Conforme a Visão & Viabilidade (Seção 5.3), cada venda provisiona R$ 30,60 (o PCE) para cobrir 20 anos de Custo de Estoque (R$ 1,53/ano). Este é o pilar que torna nosso negócio anti-frágil.
- **O que é (Produto/UX):** É o nosso maior diferencial. Não somos uma assinatura (MRR).
- **Implicação de Design (Confiança):** A mensagem de marketing e checkout deve ser clara: "Pague uma vez. É seu para sempre." Isso constrói confiança.
  **A Psicologia do Preço (ticket — R$ 279 PIX / R$ 297 cartão):** A ancoragem e o desconto por PIX são decisões intencionais para incentivar liquidez imediata e reduzir fees.
  - Sinaliza Premium: Não somos um app de R$ 1,99. Somos um produto premium, um "bem durável".
  - Alinha com "Aninhamento": O ticket se encaixa no mindset de "preparação do ninho" dos pais, alinhado a outras compras de alto valor percebido (ex: o berço, o enxoval, a sessão de fotos newborn). É um investimento, não um gasto.
  - Habilita o PCE: Permite que o modelo de Provisão de Custo de Estoque funcione, garantindo a sobrevivência do negócio sem depender do upsell.

### O Upsell: "Pacote Completo" (O Valor)

- **O que é (Finanças):** Como o PCE (5.1) garante nossa sobrevivência, o upsell é 100% focado em lucro. Alinhado com a Visão & Viabilidade (Seção 3.1), simplificamos o upsell para um único "Pacote Completo" de R$ 49.
- **O que é (Produto/UX):** Abstraímos 100% o custo técnico. O usuário nunca compra "GiB" ou "armazenamento". Isso é jargão de TI, gera ansiedade e quebra a proposta de valor ("calma").
- **Implicação de Design (Valor Percebido):** O usuário compra a história completa.
  - Base (ticket — R$ 279 PIX / R$ 297 cartão): Inclui todos os 40 momentos-chave + 5 entradas gratuitas para cada momento recorrente (ex: 5 "Visitas Especiais", 5 "Galerias de Arte").
  - Upsell (R$ 49): O usuário compra o "Pacote Completo", que desbloqueia "Repetições Ilimitadas" para todas as categorias recorrentes (Social, Criativa, Saúde) de uma só vez.
- **Rationale (Por que um, não três?):** Foco no Paradoxo da Escolha. Ana (Persona 3.1) está exausta às 22h. Ela não quer decidir se precisa do "Pacote Social" (R$ 29) ou "Criativo" (R$ 19). Isso é mais atrito. Um único "Pacote Completo" (R$ 49) é uma decisão "Sim/Não" de baixo atrito, que maximiza o LTV por transação e respeita a carga cognitiva da usuária.

## A Jornada do Usuário (Onboarding & Conversão)

Definimos duas jornadas de aquisição primárias, alinhadas com nossa estratégia de GTM (Seção 3.4 da Visão & Viabilidade).

### Jornada A: Aquisição B2C (Varejo Digital)

Esta é a jornada da Persona "Ana" (3.1).

1. **Descoberta (Marketing):** Ana vê um anúncio (ex: Instagram de uma influencer de maternidade) que fala sobre "o app que não é rede social e salvou as memórias do primeiro ano". A mensagem foca na "calma" e "curadoria".
2. **Landing Page (Consideração):** A página de vendas reforça a Tese (Seção 2). Mostra layouts bonitos do álbum (o PoD) e o testimonial do Avô (Sérgio). O call-to-action (CTA) é claro: "Compre seu Acesso Perpétuo — R$ 297 (cartão) / R$ 279 (PIX)".
3. **O "Atrito Positivo" (Checkout):** Este é um pilar da nossa estratégia anti-freemium (Seção 10.1). Não pedimos cartão depois, pedimos antes.

- **Rationale:** Queremos clientes comprometidos. O ato de pagar o ticket (R$ 279 PIX / R$ 297 cartão) é um filtro de intenção. Ele filtra usuários não-sérios (que só geram custo de compute e storage) e seleciona clientes (como Ana) que estão investidos em completar a jornada.

4. **O "Primeiro Valor" (Onboarding Pós-Compra):** Ana baixa o app e faz login. O onboarding é mínimo. Não há um tour de 10 telas. O app pede 2 coisas:
   - Nome do Bebê.
   - Data de Nascimento (Opcional, mas crucial para o HUD).
5. **O HUD (Engajamento):** Imediatamente, o HUD (Seção 4) acende. Se ela colocou a data de nascimento, o app já sabe qual o próximo momento cronológico. A jornada de valor começa em 30 segundos.

### Jornada B: Aquisição B2B2C (Voucher de Parceiro)

Esta é a jornada do nosso canal GTM primário (Visão & Viabilidade, Seção 3.4).

1. **Descoberta (Parceiro):** Ana contrata uma fotógrafa de newborn (nossa parceira B2B2C). Junto com as fotos, a fotógrafa entrega um voucher (um cartão físico premium, ou um código digital): "Como presente, aqui está o Acesso Perpétuo ao Baby Book para você guardar essas memórias."
2. **Landing Page (Resgate):** Ana não vai para a página de vendas. Ela acessa uma URL específica de resgate (ex: babybook.com/resgatar). A UI deve ser elegante, parecendo "abrir um presente".
3. **O "Resgate Sem Atrito":** A página pede duas coisas:
   - O código do voucher.
   - O e-mail para criar a conta.
   <!-- end list -->

   Implicação: Esta jornada pula o "Atrito Positivo" (Checkout), pois o parceiro já pagou por aquele cliente (em lote, com desconto).

4. **O "Primeiro Valor" (Onboarding):** Imediatamente após o resgate, ela é direcionada para o mesmo Passo 4 da Jornada A (Nome do Bebê, Data de Nascimento).
5. **O HUD (Engajamento):** A jornada converge com a Jornada A.

## O "Momento Aha!" (O Gatilho da Retenção)

O "Momento Aha!" não é quando Ana preenche o primeiro momento. Isso é apenas "tarefa concluída" (Recompensa 3).
O "Momento Aha!" é quando o loop social privado (Seção 4) se fecha pela primeira vez.

1. Ana preenche o "Primeiro Sorriso".
2. Ela compartilha o link privado com Sérgio (Avô).
3. Sérgio (o Convidado) abre o link, se encanta e deixa uma mensagem no Guestbook: "Que sorriso lindo, vovô já está com saudades!"
4. Ana recebe uma notificação (calma, sem badge vermelho) no app: "Você tem uma nova mensagem no Livro de Visitas".
5. Ela abre o app, aprova a mensagem.
6. $$Aha\!$$ Ela olha para o "Primeiro Sorriso" e agora vê, abaixo dele, o comentário do pai.

Nesse instante, o Baby Book deixou de ser um "app de fotos" (um software) e se tornou um repositório de afeto familiar intergeracional (um serviço emocional). O valor do produto aumentou 10x na percepção dela. A retenção está garantida, pois o valor do app agora é único e insubstituível. Este loop é o nosso "fosso" (moat) competitivo.

## O Gatilho de Upsell (O Fluxo de Caixa)

O upsell (Seção 5.2) deve ser contextual e de baixo atrito.
Fluxo de UX (Obrigatório):

1. **Contexto:** Ana (Guardiã) adora a feature "Visitas Especiais" (Template Key: visita_especial, Categoria de Upsell: social). Ela já adicionou as 5 entradas gratuitas.
2. **Ação:** Ela tenta adicionar a 6ª "Visita Especial".
3. **Chamada de API:** A UI (React) faz POST /moments com template_id: 'visita_especial'.
4. **Resposta da API:** A API (FastAPI) checa o template_key (visita_especial), vê a categoria social. Consulta a v_effective_quotas (Seção 9.1 do Modelo de Dados). Vê que unlimited_social = false e que used = 5, quota = 5.
5. **O Gatilho (Erro 402):** A API retorna o erro 402 Payment Required, com o payload (definido na API Reference 3.4):
   ```
   { "error": { "code": "quota.recurrent_limit.exceeded", "details": { "package_key": "unlimited_social" } } }
   ```

Interceptação (UI): O client de API (React Query) intercepta globalmente o erro 402. Ele não exibe um toast de "Erro!". (Esta lógica de interceptação e upsell se aplica igualmente a ambas as jornadas de aquisição, B2C e B2B2C, pois o voucher de parceiro cobre apenas o plano base.)
O Modal Contextual (Alinhado com Pacote Único): O interceptador (independente do package_key recebido, seja social, creative ou tracking) abre o modal de upsell unificado:

- **Título:** "Complete sua história sem limites!"
- **Mensagem:** "Vimos que você adora registrar cada detalhe! O seu Acesso Perpétuo inclui 5 entradas para cada capítulo recorrente (como 'Visitas' e 'Consultas'). Com o Pacote Completo, você pode adicionar entradas ilimitadas para todas as categorias, para sempre."
- **CTA:** "Adicionar Pacote Completo (R$ 49,00)"

Por que isso funciona:

- Contextual: O upsell aparece no exato momento da necessidade.
- Valor, Não Dados: Ela não está comprando "GiB", está comprando "Entradas Ilimitadas".
- Baixo Atrito (Financeiro): É um pagamento único, não uma nova assinatura mensal.
- Baixo Atrito (Decisão): É uma única oferta (R$ 49), não uma árvore de decisão complexa (R$ 19 vs R$ 29).

## Métricas-Chave (KPIs de Produto)

Para saber se essa modelagem está funcionando, o time de Produto (e a liderança) deve monitorar obsessivamente estes 3 KPIs:

- **Taxa de Conversão (Checkout/Resgate $\rightarrow$ 1º Momento):**
  - **O que mede:** A eficiência do nosso onboarding (Seção 6), tanto B2C quanto B2B2C.
  - **Pergunta:** Dos usuários que pagaram (Jornada A) ou resgataram (Jornada B), quantos preencheram o primeiro momento guiado?
  - **Meta (A1):** > 80%.
  - **Dono (RACI):** PM / UX Designer.
  - **Indicador Avançado (Leading):** 'Tempo para o 1º Momento'. Se o tempo médio do 'Resgate' ou 'Checkout' até o '1º Momento' for > 24h, nosso onboarding está falhando.
- **Taxa de Conclusão da Jornada (1º Momento $\rightarrow$ 40º Momento):**
  - **O que mede:** A eficiência do nosso Core Loop (Seção 4) e do "Momento Aha!" (Seção 7).
  - **Pergunta:** Dos usuários que preenchem o 1º momento, quantos chegam a preencher o 40º (o "Primeiro Aniversário")?
  - **Meta (A1):** > 30%.
  - **Dono (RACI):** PM / Engenharia (performance do HUD).
- **Taxa de Attach Rate (Upsell):**
  - **O que mede:** A eficiência do nosso fluxo de upsell (Seção 8) e a lucratividade de longo prazo.
  - **Pergunta:** Das contas ativas (ex: > 6 meses), qual porcentagem comprou o "Pacote Completo" (R$ 49)?
  - **Meta (Piso):** 20% (Conforme Visão & Viabilidade).
  - **Dono (RACI):** CEO / PM.

## Os Anti-Padrões (O Que Não Fazer)

Tão importante quanto saber o que fazer, é saber o que não fazer.

### A Armadilha do Freemium / Trial

- **O Anti-Padrão:** Oferecer um trial de 14 dias ou um plano "Grátis" (ex: 3 momentos).
- **Por que é uma Armadilha:**
  - Conflito com o Negócio (PCE): Nosso modelo financeiro (Visão & Viabilidade) depende de cada usuário pagar o ticket no D0 (na Jornada A) para provisionar o Custo de Estoque (PCE) de 20 anos (R$ 30,60). Um usuário freemium que faz upload de 3 vídeos e abandona o app gera um custo de compute (Modal) e storage (B2) não pago. Ele gera prejuízo líquido. (A Jornada B, do voucher, não é freemium, ela é pré-paga pelo parceiro).
  - Conflito com o Produto (Compromisso): O "Atrito Positivo" (Seção 6.1) é uma feature. Ele seleciona clientes (Anas) que estão comprometidos a usar o app. Um trial atrai usuários não-comprometidos.

### A Armadilha da "Ferramenta" (Ser o Google Photos)

- **O Anti-Padrão:** Adicionar features de "gerenciamento" (ex: "Importar todo o Rolo da Câmera", "Detecção facial", "Organizar em pastas").
- **Por que é uma Armadilha:**
  - Quebra da Tese: Isso nos transforma em uma "Caixa de Entrada", quebrando a tese da "Curadoria Guiada" (Seção 2.1). O usuário troca a ansiedade de "preciso preencher" pela ansiedade de "preciso organizar".
  - Competição: Nunca venceremos o Google Photos ou o Apple Photos em "ferramentas de IA de fotos". É uma briga perdida. Devemos focar no nosso nicho (0,12% do mercado, conforme Visão & Viabilidade 4.3). Não precisamos de todos; precisamos das "Anas".

### A Armadilha da "Rede Social" (Ser o Instagram)

- **O Anti-Padrão:** Adicionar features de "performance social" (ex: Likes, contagem de visualizações públicas, feeds globais, comentários públicos).
- **Por que é uma Armadilha:**
  - Quebra da Tese: Isso quebra a tese da "Calma e Privacidade" (Seção 2.2). O like é o motor da ansiedade social. Nós somos o antídoto para o feed.
  - Erosão da Confiança: Se Ana (Guardiã) vir um estranho comentando na foto do filho, ela abandona o app imediatamente. A privacidade é nosso maior ativo.

## O Roadmap Futuro (Extensões de Valor)

Após o MVP (o Catálogo de Momentos + o upsell de repetição) estar validado, o roadmap de produto foca em duas extensões que aumentam o LTV e a retenção, alinhadas com o Visão & Viabilidade (Seção 7).

### Print-on-Demand (PoD) (Extensão de LTV)

- **O que é:** Um botão "Imprimir meu Álbum". O sistema renderiza o álbum (usando os templates do Catálogo) em um PDF de alta resolução e o envia para uma gráfica parceira (ex: Printful).
- **Modelo de Negócio:** Margem de lucro direta.
- **Implicação (Produto):** A UI de "Preview do PoD" é o verdadeiro loop de engajamento do Ano 2. É o que motiva o usuário a "limpar" os drafts e garantir que as melhores fotos estão selecionadas.

### Cápsula do Tempo (Extensão de Retenção)

- **O que é:** (Ref: Catálogo B.5). A feature que permite a Ana (Guardiã) gravar um vídeo ou escrever uma carta para o filho, que só pode ser "aberta" em uma data futura (ex: 10 ou 18 anos).
- **Modelo de Negócio:** Retenção.
- **Implicação (Produto):** É a feature de maior valor emocional percebido. Ela garante que Ana nunca abandonará a plataforma, pois o logout significaria perder o e-mail de notificação em 18 anos. É a nossa âncora de retenção de longo prazo.
