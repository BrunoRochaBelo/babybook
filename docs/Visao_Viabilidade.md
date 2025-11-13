# Visão & Viabilidade — Baby Book

## 1. Visão do negócio

O Baby Book nasce para resolver uma ansiedade central da paternidade moderna: o medo de perder as memórias preciosas dos primeiros anos de vida, soterrado pelo volume caótico de fotos e vídeos não organizados. O produto é um álbum vivo, digital e privado, focado em curadoria guiada.

Nossa audiência-alvo primária é a "Mãe Millennial" (ou Pai) de primeira viagem. Esta audiência é digitalmente nativa, mas sofre com a "culpa da captura" (o sentimento de que, se não registrar tudo, está falhando) e o "caos do rolo da câmera" (milhares de mídias que nunca são vistas). Eles valorizam significado sobre volume e estão cada vez mais céticos em relação a plataformas sociais que monetizam sua privacidade.

Cada momento (capítulo pré-definido, como "Primeiro sorriso" ou "Primeiros passos") funciona como um contêiner limitado: 3 fotos, 1 vídeo curto (10 s) e 1 áudio, acompanhados de pequenos textos. Essa estrutura transforma a tarefa esmagadora de "organizar fotos" em pequenas missões gerenciáveis.

O produto é estritamente mobile-first, desenhado para o contexto real dos pais: uso rápido, com uma só mão, muitas vezes com o bebê no colo. A experiência (UX) é intencionalmente calma, privada e livre de ansiedade social (sem likes, sem feeds infinitos, sem notificações viciantes). Nosso design não compete pela atenção do usuário; ele a devolve.

A monetização é o pilar financeiro central: combina um pagamento único (modelo "Acesso Perpétuo") para o pacote base, com upsell de "Pacotes de Repetição" (focados em momentos, não em dados). Esse modelo exige uma arquitetura magra em custo fixo e elástica no uso (pay-per-use), garantindo que o custo de manutenção de uma conta ao longo dos anos seja mínimo e previsível.

O foco estratégico é duplo: (1) converter a emoção da paternidade em uma compra de baixo atrito (Acesso Perpétuo) e (2) garantir que a arquitetura de custo variável por conta seja tão baixa que a receita do D0 cubra o custo vitalício do Acesso Perpétuo.

### Proposta de valor resumida

**Curadoria guiada (60 momentos):** A "paralisia da tela em branco" mata a adoção. Não vendemos um álbum; vendemos um serviço de redução de ansiedade. Uma estrutura narrativa clara reduz a carga cognitiva e transforma o que era uma "obrigação" (organizar fotos) em uma "conquista" (completar um capítulo).

**Limites intencionais (3 fotos, 1 vídeo de 10 s, 1 áudio):** Restrição gera qualidade. Ao forçar a escolha ("qual é a melhor foto?"), o produto final (o álbum) se torna exponencialmente mais valioso. Para o negócio, essa restrição controla storage e compute de forma previsível.

**Compartilhamento simples e privado (private | people | link):** Focado em conexões íntimas (avós, padrinhos), não em performance social. Nosso "fosso" (moat) competitivo não são features, mas sim a confiança. Concorrentes que dependem de publicidade (Meta, Google) não podem competir credivelmente neste pilar.

### Objetivo financeiro

**Margem de contribuição positiva no D0:** O pagamento de R$ 200 deve, imediatamente (Dia Zero), cobrir o CAC (realista), todos os custos transacionais E provisionar o Custo de Estoque vitalício da conta. Cada venda deve gerar lucro líquido real no D0.

**Viabilidade sem Upsell:** O negócio deve ser lucrativo e sustentável a longo prazo, mesmo com uma taxa de upsell (attach rate) de 0%. O upsell é um acelerador de lucro, não uma condição de sobrevivência.

**Eficiência de Capital:** Atingir um Custo de Estoque (sangramento) real por conta ≤ R$ 2,00/ano. O break-even mensal deve permanecer baixo (target: < 20 contas/mês).

## 2. O Modelo de Negócio (Racional Técno-Financeiro)

Esta seção detalha a amarração entre as decisões de produto, engenharia e finanças que tornam o modelo de Acesso Perpétuo viável.

### 2.1 Por que Acesso Perpétuo + Upsell de Repetição

**Adoção mais fácil:** Assinatura (MRR) gera "fadiga de assinatura" e atrito. "Pague uma vez, é seu" (Acesso Perpétuo) alinha-se perfeitamente com o valor emocional de uma memória, que é permanente.

**Psicologia da Venda (Valor, não Utilidade):** Esta é a distinção estratégica mais importante. Não vendemos "dados" (GiB) ou "espaço". Vender "espaço" é um jogo de commodity, uma corrida para o fundo do poço vencida por gigantes.

O Pacote Base (R$ 200): Inclui todos os momentos únicos (ex: "Primeiro Sorriso") e séries fixas (ex: "Mêsversários"). Para momentos recorrentes (ex: "Visitas Especiais", "Consultas", "Galeria de Arte", "Livro de Visitas"), o pacote base inclui 5 entradas gratuitas para cada.

O Upsell (Pacotes de Repetição): O upsell é acionado quando o usuário tenta adicionar a 6ª entrada em um momento recorrente. O upsell é a compra de "Pacotes de Repetição Ilimitada" (pagamento único).

Exemplo: Pacote "Social" (R$ 29): Entradas ilimitadas para "Visitas Especiais" e "Livro de Visitas".

Exemplo: Pacote "Saúde" (R$ 29): Entradas ilimitadas para "Curva de Crescimento" e "Visitas ao Pediatra".

**Implicação:** O cliente compra valor (a liberdade de continuar um capítulo), não utilidade (dados). A compra é emocional, não punitiva.

### 2.2 Por que o Stack Serverless (O Racional de Custo)

O modelo de Acesso Perpétuo inverte a lógica do SaaS: a receita é concentrada no D0, mas o custo (armazenamento, entrega) é vitalício. Eliminar custo fixo (ociosidade) não é otimização: é condição de sobrevivência.

**O Problema Central: Custo Fixo vs. Custo Vitalício**

O cliente paga R$ 200 uma vez, mas nós temos que "bancar" o custo de storage, egress (tráfego) e compute (processamento) desse cliente para sempre. Em um SaaS normal (assinatura), o custo fixo (servidor ligado 24/7, como um AWS RDS de R$ 200/mês) é diluído pela receita recorrente. No nosso modelo, a receita é só no Dia Zero (D0). Portanto, a ociosidade é o nosso maior inimigo.

**O que era preciso (A Tese):** Precisávamos de um stack que tivesse um custo fixo de R$ 0 (ou perto disso) e cujo custo variável escalasse perfeitamente com a receita (novos uploads), não com o uso (visualização).

**A Solução: O Stack "Pay-per-Use" (Peça por Peça)**

Nós atacamos os três grandes ralos de custo: Banco de Dados, Processamento (Workers) e, o mais perigoso, a Saída de Dados (Egress).

1. **O Problema do Banco de Dados (Ociosidade)**

   O que era preciso: Um banco de dados que não cobrasse R$ 200/mês só para ficar "ligado", já que 90% dos usuários ficarão inativos após o primeiro ano.

   A Tecnologia Escolhida: Neon (PostgreSQL Serverless).

   O Motivo (Por quê?): O Neon separa o storage (armazenamento, que é barato) do compute (processamento, que é caro). Quando o banco fica ocioso (ex: 5 min sem consulta), o compute "dorme" (escala a zero) e o custo fixo dele vai a R$ 0.

   A Troca (Trade-off): Aceitamos um cold start de 1-3 segundos na primeira consulta de um usuário inativo. Isso é perfeitamente aceitável, pois nossa UX não é de alta frequência (como um chat), mas sim de uso esporádico e intencional.

2. **O Problema do Processamento (Workers)**

   O que era preciso: Processar picos de uploads (ex: Dia das Mães) sem manter uma frota de servidores (VMs/EC2) cara e ociosa, nem gerenciar a complexidade de um auto-scaling de Kubernetes ou um setup de Celery/Redis.

   A Tecnologia Escolhida: Modal (Workers Python).

   O Motivo (Por quê?): É o "compute" elástico e sem gerenciamento. Pagamos por segundo de CPU usado. Se ninguém faz upload, o custo é R$ 0. Se 1.000 usuários fazem upload no mesmo minuto, 1.000 workers "nascem" sob demanda, processam o vídeo (executando nosso código Python/FFmpeg) e "morrem". O custo de compute (os R$ 0,44 por conta, ver 2.3) só acontece no D0, junto com a receita de R$ 200.

3. **O Problema da Fila (Robustez)**

   O que era preciso: Uma forma de lidar com os picos e garantir a resiliência. Se 1.000 usuários fazem upload simultaneamente, a API (o "porteiro") não pode cair e o job de processamento não pode se perder se o worker falhar.

   A Tecnologia Escolhida: Cloudflare Queues.

   O Motivo (Por quê?): Quando o usuário completa o upload, a API (no Fly.io) não tenta "chamar" o Modal. Ela só "joga" uma mensagem minúscula na fila da Cloudflare (ex: "processe o asset_id 123") e retorna "OK" (202) para o usuário em milissegundos. A fila absorve o "tranco" (o pico) e garante a entrega da mensagem ao Modal. Se o Modal falhar, a fila re-tenta automaticamente. Isso garante a UX "fire-and-forget" e a integridade dos dados.

4. **O Problema da Saída de Dados (O "Pulo do Gato")**

   Esse era o maior risco. De que adianta o storage ser barato se, toda vez que o usuário (ou os avós) assiste a um vídeo, nós pagamos egress (saída de dados), que é caríssimo? Um álbum compartilhado que viraliza quebraria a empresa.

   **O que era preciso (A "Saída Gratuita"):** Precisávamos de storage barato com egress (saída) gratuito.

   A Tecnologia Escolhida: O combo Backblaze B2 (Storage) + Cloudflare (CDN).

   O Motivo (Por quê?): O B2 é um dos storages S3-compatíveis mais baratos do mercado. Mas o "pulo do gato" é que ele faz parte da "Bandwidth Alliance".

   Como foi resolvido: Essa aliança significa que qualquer transferência de dados do B2 para a CDN da Cloudflare tem custo ZERO de egress. Nosso fluxo fica:

   - Armazenamos a mídia no B2 (barato).
   - O usuário pede a mídia.
   - A Cloudflare (CDN) "puxa" a mídia do B2 (custo R$ 0) e armazena em cache na borda.
   - A Cloudflare entrega a mídia para o usuário (rápido e, na maior parte, de graça).

   Basicamente, essa única decisão (a "Bandwidth Alliance") neutralizou o maior risco financeiro variável do modelo de Acesso Perpétuo.

**Resumo do Stack**

O stack não foi escolhido por ser "moderno" (apesar de ser), mas como uma estratégia financeira direta para viabilizar o modelo de Acesso Perpétuo:

- Neon + Modal: Matam o custo fixo (ociosidade).
- B2 + Cloudflare: Matam o custo de egress (o "sangramento" variável).
- Cloudflare Queues + Fly.io: Garantem que a UX seja rápida e que o sistema aguente picos sem quebrar.

### 2.3 Custo de Estoque Real (O "Sangramento" Auditado)

O modelo anterior (revC) usava uma estimativa conservadora de R$ 4,44/ano. Uma auditoria nos custos reais (baseada nos preços atuais de B2) revela um número muito menor, o que torna o modelo de provisionamento (Seção 5.3) viável.

O custo de Setup (D0) é o custo de processar os 60 momentos iniciais. O custo de Estoque (Anual) é o custo de manter a conta inativa.

**Custo de Setup (D0):** R$ 0,44

- Compute (workers): R$ 0,44 (Custo único de transcodificação dos 60 momentos no D0).

**Custo de Estoque (Anual):** R$ 1,53

- Storage (B2 Real): R$ 0,20

  Cálculo: (0,6 GB _ (R$ 5,50 _ $0,005/GB/mês) * 12 meses). O valor de R$ 2,67 anterior era uma provisão de 1200% de gordura.

- Egress (edge/CDN): R$ 1,11 (Provisão para tráfego não-B2: API, Neon).

- Banco/I/O: R$ 0,22 (Custo do Neon "dormindo").

- Total "Sangramento": R$ 1,53/conta/ano.

### 2.4 Por que os Limites (A Defesa do Modelo)

**Cognitivo e conclusão (60 momentos + 5 repetições):** Pedir "suba suas fotos" falha; pedir "complete 'Primeira papinha'" gera vitória rápida.

**Previsibilidade de custo (2 GiB):** Os limites são uma feature, não uma punição. Eles evitam o "Google Photos Trap" (armazenamento infinito = custo infinito). 60 momentos e 2 GiB permitem calcular o custo de estoque real de R$ 1,53/ano e precificar o Acesso Perpétuo (R$ 200) com confiança.

**Qualidade pela restrição (3 fotos, 10 s):** Forçamos a curadoria. Um vídeo de 10 s transcodifica em segundos (compute barato). Um vídeo de 60 s multiplicaria custo e espera 6×.

### 2.5 Privacidade & SLOs Financeiros

**Privacidade (3 modos):** private (padrão), people (convidados), link (público opcional).

**SLOs Financeiros:** Time-to-ready ≤ 2 min: Tempo do upload ao playback (eficiência da fila + worker).

Custo de Estoque ≤ R$ 2,00/conta/ano: A métrica de sobrevivência do negócio. (Estamos em R$ 1,53).

## 3. O Modelo de Receita (Go-to-Market)

Esta seção foca em como geramos receita e quanto custa adquiri-la.

### 3.1 Modelo de Preços (Revisado)

**Ticket de entrada (Acesso Perpétuo):** R$ 200 por conta (inclui todos os 60+ momentos e 5 entradas para cada momento recorrente).

**Upsell (Pacote Completo):** R$ 49 (pagamento único).

Prompt: "Desbloqueie entradas ilimitadas para todos os seus momentos recorrentes: Visitas, Saúde, Diário da Barriga, Galeria de Arte e mais. Complete sua história sem limites."

**Ticket médio upsell (base):** R$ 49 (Ajustado para o pacote único)

**Política:** Upsell contextual (acionado na 6ª entrada de um recorrente), focado em liberar valor, não em vender espaço.

### 3.2 Racional de Preço

**Âncora emocional (R$ 200):** Referência a bens duráveis (álbum de luxo, ensaio fotográfico) sem bloquear a compra por impulso.

**Upsell como Produto (R$ 49):** É um frictionless step-up. Simplifica a jornada de compra (uma decisão, não três) e maximiza o LTV de clientes engajados.

### 3.3 Mix de Canais e CAC Alvo

O cenário de lançamento (realista) assume um CAC blended de R$ 80.

| Canal                    | Papel                    | CAC alvo (R$) | Observações / Métricas-Chave                                                           |
| ------------------------ | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| Parcerias (B2B2C)        | Prioridade 1 (CAC baixo) | 15–30         | Fotógrafos de parto, lojas de enxoval. Métrica: Custo por Parceiro Qualificado (CPPQ). |
| Orgânico/SEO             | Base de longo prazo      | 10–25         | Long tail de marcos do bebê; ramp-up lento. Métrica: % de Vendas Orgânicas.            |
| Influência de nicho      | Picos com credibilidade  | 30–55         | Microinfluenciadores; rastreamento por cupom. Métrica: ROAS por Cupom.                 |
| Mídia paga (meta/search) | Acelerar lote (Pós-PMF)  | 70–90         | Cenário realista de leilão caro. Só manter se LTV/CAC ≥ 3×. Métrica: LTV/CAC > 3x.     |

### 3.4 Plano GTM Tático (Foco B2B2C - 180 Dias)

O canal de Parcerias (B2B2C) não é opcional; é a estratégia primária de aquisição para o Ano 1, pois nos permite adquirir clientes com um custo baseado em comissão (R$ 15-30), não em leilão (R$ 70-90).

**Alvo (180 Dias):** Conquistar 40 parceiros qualificados. (Se 50% das 3.000 contas do A1 vierem de B2B2C, e cada parceiro gerar 3-4 vendas/mês, precisamos de ~35-40 parceiros ativos).

**Risco de Execução:** O ciclo de vendas B2B2C é lento. O DRE (Seção 5) já assume um CAC de R$ 80, dando-nos "gordura" para queimar em mídia paga enquanto o canal B2B2C amadurece.

**Canais de Parceria Prioritários:**

**Fotógrafos de Parto/Newborn:**

- **Modelo Principal (Venda Direta):** Venda de pacotes de 10 vouchers com 30% de desconto (R$ 140/licença). O fotógrafo presenteia o cliente, embutindo o custo em seu pacote "premium". Este modelo de venda em lote (vouchers) é a nossa estratégia primária, pois garante a receita no D0 para nós, gera um LTV/CAC claro (LTV/CAC > 4x) e alinha 100% os incentivos, pois o parceiro só ganha se nós ganharmos. Isso torna a escala de parceiros muito mais rápida.

**Lojas de Enxoval (Físicas e Online):**

- **Oferta A (Gift Card):** Venda de gift cards do Baby Book no caixa.
- **Oferta B (Bônus):** Nas compras acima de R$ X, o cliente ganha o Baby Book.

### 3.5 Gateway e Parcelamento

**Provedor recomendado:** Stripe (Plano B: Pagar.me).

**Custo:** Premissa média 3,49% + R$ 0,39/tx.

**Política de parcelamento:**

- Acesso Perpétuo (R$ 200): até 3× sem juros. >3× com juros (cliente assume).
- Upsells (R$ 19, R$ 29): 1×.

## 4. Premissas & Projeções (O Modelo Financeiro)

Esta seção detalha as entradas (inputs) do nosso modelo financeiro.

### 4.1 Premissas Financeiras (BRL)

**Moeda e câmbio:** Provedores cobram em USD. Assumimos USD/BRL = R$ 5,50 com margem.

**Hedge (Mandatório):** Política de manter 2-3 meses de custos de infra (USD) em caixa (ex: créditos pré-pagos B2/Modal) é mandatória. O financeiro deve ativamente comprar créditos USD sempre que a taxa de câmbio (PTAX) estiver abaixo da média dos últimos 30 dias (M30).

**Tributos (Simples efetivo):** Ano 1: 9% | Ano 2: 10% | Ano 3: 12%.

**Gateway de pagamento:** 3,49% + R$ 0,39/tx; chargeback: 0,4% (provisionado).

**CAC (Custo de Aquisição):**

- Base (Realista A1): R$ 80
- Meta (Otimização A2): R$ 65
- Meta (Longo Prazo A3+): R$ 55

**Upsell:**

- Attach anual (Base Realista): 20% (A1). Otimização para 25% (A2) e 30% (A3). Esta é agora uma premissa de lucro, não de sobrevivência.
- Ticket upsell médio: R$ 49 (Ajustado para o pacote único).

**Infra (consolidado):**

- Variável por conta/ano (estoque): R$ 1,53 (Custo real auditado, Seção 2.3).
- Variável por conta (Setup D0): R$ 0,44 (Custo real auditado, Seção 2.3).
- Fixo mensal: R$ 55/mês (A1) e R$ 214,50/mês (A2–A3).

**Opex administrativo:** R$ 2.500/mês (A1) → R$ 7.000/mês (A2) → R$ 15.000/mês (A3). (Premissa revisada para incluir custos de ferramentas mais realistas e provisão para pró-labore simbólico a partir do A2).

### 4.2 Premissas de Consumo (Storage)

**Por momento (médias):** ≈ 9,5–10 MB (3 fotos + thumbs + vídeo 10s + áudio).

**Por conta (base):** ≈ 600 MB (60 × 10 MB).

**Target de 2 GiB:** Folga > 3× para variações. Essa folga é intencional para que o usuário nunca se sinta "apertado".

### 4.3 Projeção de Demanda e Dimensionamento de Mercado (TAM)

**Dados de Mercado (TAM):**

O mercado brasileiro registra, de forma conservadora, cerca de 2,5 milhões de nascimentos por ano (fonte: IBGE/Datasus). Este é o nosso Mercado Anual Total Endereçável (TAM).

**Projeção de Demanda (Novas Contas/Ano):**

- Ano 1: 3.000 (Meta de Penetração: 0,12% do TAM)
- Ano 2: 10.000 (Meta de Penetração: 0,40% do TAM)
- Ano 3: 25.000 (Meta de Penetração: 1,00% do TAM)

**Racional (A1):** A meta de 3.000 contas no Ano 1 é deliberadamente conservadora. Capturar apenas 0,12% (ou 1 a cada 833 nascimentos) do mercado nacional é uma meta realista e alcançável, especialmente ao focar em nichos de alta conversão. O GTM (3.4) focado em 40 parceiros B2B2C (fotógrafos, lojas) é a máquina tática para gerar essa demanda inicial de forma sustentável (CAC baixo), enquanto o SEO (long tail) constrói a base para o A2 e A3.

### 4.4 Funil de Conversão (Hipóteses Revisadas)

- Visita → cadastro: 8–12%.
- Cadastro → compra: 6–9%.
- Compra → attach (ano): 20% (A1) → 25% (A2) → 30% (A3).

## 5. DRE e Unit Economics (A Prova Financeira)

Esta seção detalha os resultados (outputs) do modelo, com base nas premissas da Seção 4.

### 5.1 DRE Projetado (Ano 1–3) — Revisado (PCE)

Parâmetros (A1): Ticket R$ 200; Upsell médio R$ 49; Attach 20%; CAC R$ 80.

Parâmetros (A2): Attach 25%; CAC R$ 65.

Parâmetros (A3): Attach 30%; CAC R$ 55.

(Demais premissas conforme Seção 4.1)

| Indicador           | Ano 1 (Base R$ 80) | Ano 2 (Otim R$ 65) | Ano 3 (Otim R$ 55) |
| ------------------- | ------------------ | ------------------ | ------------------ |
| Contas novas        | 3.000              | 10.000             | 25.000             |
| Contas ativas (fim) | 3.000              | 13.000             | 38.000             |
| Receita ticket (R$) | 600.000            | 2.000.000          | 5.000.000          |
| Receita upsell (R$) | 29.400             | 159.250            | 558.600            |
| Receita bruta (R$)  | 629.400            | 2.159.250          | 5.558.600          |
| Gateway (R$)        | 23.362             | 80.528             | 208.204            |
| Chargeback (R$)     | 2.518              | 8.637              | 22.234             |
| Tributos (R$)       | 56.646             | 215.925            | 667.032            |

### 5.2 Síntese do DRE

**Robustez Comprovada:** Mesmo com um CAC 60% maior (R$ 80) e um Opex mais realista (R$ 30k/ano), o modelo ainda gera R$ 270k de resultado operacional no Ano 1. A Margem Operacional de 42,9% prova que o unit economic é sadio. O aumento do ticket de upsell compensou o aumento do Opex no A2 e A3.

### 5.3 Unit Economics (LTV/CAC) (Revisado)

Esta é a matemática de uma única venda, agora com o modelo de Provisão de Custo de Estoque (PCE).

**Nova conta (Acesso Perpétuo R$ 200) — Ano 1**

Receita (D0): R$ 200,00

(–) Gateway: R$ 7,37

(–) Tributos (9%): R$ 18,00

(–) Chargeback (0,4%): R$ 0,80

(–) Custo de Setup (Compute D0): R$ 0,44

Margem Bruta (pré-CAC): ≈ R$ 173,39

(–) CAC (Base Realista A1): R$ 80,00

Contribuição Líquida (pré-PCE): ≈ R$ 93,39

**A Nova Provisão (PCE): Pagando o "Sangramento" no D0**

(–) Provisão de Custo de Estoque (PCE): Provisionando 20 anos de "sangramento" (Custo de Estoque Real).

PCE = 20 anos \* R$ 1,53/ano = R$ 30,60

Contribuição Líquida (pré-PCE): R$ 93,39

(–) Provisão de Custo de Estoque (20 anos): R$ 30,60

**LUCRO LÍQUIDO REAL (D0):** ≈ R$ 62,79

**Upsell (Pacote R$ 49) — Puro Lucro**

(–) Gateway: R$ 2,10 | Tributos (9%): R$ 4,41 | Chargeback: R$ 0,20 | Infra adicional: ≈ R$ 0,20

Contribuição: ≈ R$ 42,09

**LTV (LTD + upsell esperado)**

Leitura (Modelo Robusto): O negócio sobrevive com 0% de attach rate. O custo de estoque vitalício (R$ 30,60) é provisionado no D0, e ainda sobram R$ 62,79 de lucro líquido imediato por venda.

O Upsell é "Gravy" (Lucro Extra): O LTV incremental (A1) ≈ Attach (20%) × Contribuição Upsell (R$ 42,09) = R$ 8,42/conta/ano.

Implicação: Este LTV incremental (R$ 8,42) é puro lucro, pois o custo de estoque (R$ 1,53) já foi pago pela provisão no D0.

### 5.4 Break-Even e "Ponto de Parada" (Revisado)

**Payback (por cliente)**

Imediato (D0): O negócio é lucrativo no D0. Cada venda gera R$ 62,79 de lucro líquido imediato, após pagar CAC e provisionar 20 anos de custos de estoque.

**Break-even mensal (Ano 1)**

Fixos/mês (A1): ≈ R$ 2.555 (Infra R$ 55 + Opex R$ 2.500)

Lucro Líquido Real por conta nova (pós-CAC, pós-PCE): ≈ R$ 62,79

Ponto de equilíbrio: ≈ 41 contas/mês (R$ 2.555 ÷ R$ 62,79).

**Implicação:** O break-even subiu de 17 para 41 contas/mês devido à premissa de Opex mais realista. Este número (41 vendas) ainda é extremamente baixo e alcançável (menos de 2 vendas por dia útil).

**Manutenção do cliente ("ponto de parada")**

Regra: O custo de estoque (R$ 1,53/ano) é coberto pela "Provisão de Custo de Estoque" (R$ 30,60) feita no D0.

Ação de Custo: Contas inativas por 12 meses → cold storage (redução de custo de 40-60%). Ao retornar, restaura sob demanda.

## 6. Riscos & Sensibilidades

### 6.1 Análise de Sensibilidade (Alavancas de Gestão)

**Otimização de CAC (R$ 80 → R$ 50):** A principal alavanca de lucro. Cada R$ 10 de redução no CAC A1 gera +R$ 30.000 no resultado.

**Otimização de Attach Rate (20% → 35%):** A principal alavanca de lucro incremental (gravy). Deixou de ser uma alavanca de sobrevivência.

**Câmbio (USD/BRL):** Risco externo. + R$ 0,50 no FX (base R$ 5,50) ⇒ ≈ +9,1% na infra variável.

### 6.2 Riscos Principais & Mitigação

**Risco de Custo (Longo Prazo):** A promessa de "Acesso Perpétuo" expõe o negócio à flutuação de custos de terceiros (B2, Neon) e câmbio.

**Mitigação (Jurídico/Produto/Técnico):**

- **Hedge (4.1):** Política mandatória de compra de créditos USD.
- **Migração Técnica (Cloudflare R2):** Como mitigação técnica para o fim da "Bandwidth Alliance", o plano de longo prazo inclui a migração do storage (B2) para o Cloudflare R2. O R2 possui custo de egress zero por padrão, neutralizando este risco de plataforma (embora exija reavaliação do custo de storage).
- **Termos de Uso (Legal):** O termo "Acesso Perpétuo" deve ser legalmente definido em nossos Termos de Uso como "acesso pela vida útil comercial do serviço".
- **Cold Storage (Técnico):** Cláusula contratual (Termos de Uso) permitindo cold storage agressivo após 12 meses de inatividade (5.4).
- **Válvula de Escape (Legal/Financeiro):** Cláusula de "taxa de manutenção simbólica" para contas inativas > 36 meses.

**Deriva de consumo (storage/compute):** Tetos rígidos (10 s), normalização no cliente, presets no worker.

**Picos sazonais (custo/estabilidade):** Fila (Cloudflare Queues) + autoscaling (Modal) + backpressure (429 Retry-After).

## 7. Plano de Ação & Recomendações

O DRE (Seção 5) é robusto e lucrativo no D0. O foco agora é escalar o lucro via CAC e Upsell.

### 7.1 Otimização de CAC: Foco Tático (0-6 meses)

**Dono:** Head de Growth/CEO.

**Métrica Principal:** CAC Blended.

**Plano de Ação:** Foco total em Parcerias B2B2C (Seção 3.4) e SEO. Pausar mídia paga se o CAC do canal ultrapassar R$ 90.

### 7.2 Otimização de LTV: Estratégia de Engajamento e Upsell (Plano de Produto)

O Risco: O risco mudou de sobrevivência para oportunidade. O upsell é agora 100% lucro incremental.

A Solução (Plano Tático): O attach rate deve ser construído pelo produto.

**Onboarding do Upsell (D0):** O usuário precisa saber que a jornada continua. Durante o onboarding, a UI deve mostrar os "Próximos Capítulos" (ex: "O Segundo Ano") como "disponíveis para desbloquear".

**Gatilho de Valor (Mês 12):** Ao completar os 60 momentos (ou no primeiro aniversário), o app deve gerar um highlight reel (vídeo curto automático). O CTA ao final é: "A jornada continua. Desbloqueie o 'Segundo Ano'".

**Re-engajamento Ativo (CRM):** O produto não pode ser passivo. O sistema deve disparar e-mails de nurture (ex: quinzenais) baseados no tempo de vida do bebê (ex: "Seu bebê tem 9 meses, 5 dicas para fotos melhores do 'engatinhar'").

**Métricas-Chave (Produto):** (1) Attach Rate Anual (Meta A1: 20%), (2) % de Conclusão dos 60 Momentos (leading indicator), (3) Taxa de Conversão do Highlight Reel, (4) Taxa de Abertura/Clique do e-mail de Nurture.

### 7.3 Recomendações Práticas (Sumário)

**Termos de Uso:** Substituir "LTD" por "Acesso Perpétuo". Incluir cláusulas de cold storage (12 meses) e "taxa de manutenção simbólica" (inatividade > 36 meses). (Dono: Jurídico/CEO).

**CAC:** Lançar com foco em Parcerias B2B2C e Orgânico (conforme 3.4). Usar mídia paga com cautela, aceitando um CAC de R$ 70–90 no início. (Dono: Growth).

**Upsell:** Lançar com os "Pacotes de Repetição" (R$ 19–29) e implementar o "Plano de Engajamento" (7.2). (Dono: Produto).

**Técnica (Dia Zero):** Implementar a Fila (Cloudflare Queues) e o lifecycle de cold storage (12 meses) antes do lançamento. (Dono: Engenharia).

**Hedge:** Política mandatória de compra de créditos USD (Seção 4.1). (Dono: Financeiro/CEO).

## Anexo A — Fórmulas e notas de cálculo

Receita bruta = (Contas novas × R$ 200) + (Contas novas × attach_rate × upsell_médio)

... (demais fórmulas mantidas)

CAC (custo) = Contas novas × CAC_anual (R$ 80 no A1, R$ 65 no A2, R$ 55 no A3)

## Anexo B — Parâmetros ajustáveis (Revisado)

| Parâmetro                     | Faixa de Risco (Cenário Pessimista) | Base (Projeção Realista A1) | Faixa Otimista (Metas A2+) | Comentário Estratálgico                                      |
| ----------------------------- | ----------------------------------- | --------------------------- | -------------------------- | ------------------------------------------------------------ |
| FX (USD/BRL)                  | 5,80–6,10                           | 5,50                        | 5,10–5,49                  | Risco externo. Mitigado via Hedge (4.1).                     |
| **CAC (R$)**                  | 81–100 (B2B2C falha)                | 80 (A1)                     | 50–79 (B2B2C escala)       | Principal alavanca de lucro. Depende do GTM B2B2C (3.4).     |
| Attach (%)                    | 10%–19% (CRM falha)                 | 20% (A1)                    | 25%–45% (CRM otimizado)    | Alavanca de lucro incremental. Não mais de sobrevivência.    |
| Upsell médio (R$)             | -                                   | 49                          | -                          | Alavanca secundária de LTV. (Simplificado para pacote único) |
| Infra variável (R$/conta/ano) | 1,80–2,20                           | 1,53                        | 1,20–1,52                  | Já auditado e otimizado.                                     |

## Anexo C — Glossário rápido

**Acesso Perpétuo:** (Substitui LTD). Pagamento único, acesso ao produto base conforme Termos de Uso (que incluem cláusulas de inatividade e custo).

**Attach Rate (%):** "Taxa de Adesão". A porcentagem de clientes da base (Acesso Perpétuo) que compram um upsell (Pacote de Repetição) por ano. É a métrica-chave de LTV incremental.

**Bandwidth Alliance:** O "pulo do gato" técnico. Acordo entre o B2 (Backblaze) e a Cloudflare que zera o custo de egress (tráfego de saída) de mídia, tornando o streaming financeiramente viável.

**B2B2C:** "Business-to-Business-to-Consumer". Nossa estratégia de GTM prioritária (Seção 3.4), onde vendemos/ofertamos o app através de parceiros (Fotógrafos, Lojas de Enxoval) para chegar ao cliente final.

**CAC (Custo de Aquisição de Cliente):** O custo médio (blended) para adquirir um novo cliente pagante (ex: R$ 80 no A1). Inclui todos os custos de marketing, vendas e comissões de parceiros.

**Cold Start:** O "atraso" (1-3 segundos) para "acordar" um recurso serverless (Neon, Modal) que estava "dormindo" (ocioso). É o trade-off que aceitamos para ter custo fixo zero.

**Cold Storage:** "Armazenamento Frio". Mover dados de contas inativas (>12 meses) para uma camada de storage mais barata (e lenta) para reduzir o Custo de Estoque.

**Custo de Estoque:** Nosso "sangramento" anual. O custo de infra pay-per-use (R$ 1,53/ano) para manter uma conta inativa "em prateleira" (B2 + I/O mínimo).

**Custo de Setup:** Custo único de compute (R$ 0,44) incorrido no D0 para processar (transcodificar) os 60 momentos iniciais do cliente.

**D0 (Dia Zero):** O dia da compra. O pilar do nosso modelo é ser lucrativo no D0 (lucro líquido real após pagar CAC e PCE).

**DRE (Demonstração do Resultado):** A projeção financeira que valida o modelo (Seção 5.1).

**Egress:** Custo de tráfego de saída de dados (ex: streaming de vídeo). O maior risco de custo, mitigado pela Bandwidth Alliance.

**GTM (Go-to-Market):** O plano tático de "ida ao mercado" (Seção 3.4), focado em B2B2C.

**LTV (Lifetime Value):** "Valor do Ciclo de Vida do Cliente". A receita total esperada de um cliente. No nosso modelo: LTV = R$ 200 (D0) + (Contribuição Média do Upsell _ Attach Rate _ Anos).

**Opex (Operational Expenditure):** Nossos custos fixos mensais (ex: Opex Adm. de R$ 2.500/mês), que não incluem infra variável.

**Pacotes de Repetição:** Nosso produto de upsell. Venda de entradas ilimitadas para capítulos recorrentes (ex: "Pacote Social").

**PCE (Provisão de Custo de Estoque):** Reserva financeira criada no D0 (R$ 30,60) para cobrir o Custo de Estoque vitalício (20 anos) da conta. Garante a sobrevivência com 0% de upsell.

**SLO (Service Level Objective):** "Objetivo de Nível de Serviço". Metas mensuráveis (ex: Custo de Estoque ≤ R$ 2,00/ano).

**Stack Serverless:** A arquitetura (Neon, Modal, CF Queues) que "escala a zero", eliminando o custo fixo de ociosidade.

**TAM (Total Addressable Market):** O "Mercado Total Endereçável" (ex: 2,5 milhões de nascimentos/ano no Brasil).
