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

**Margem de contribuição positiva no D0:** O pagamento de entrada (ticket) adota precificação dual: R$ 297 (cartão) / R$ 279 (PIX). Nas projeções financeiras usamos R$ 279 (PIX) como baseline conservadora. O ticket deve, imediatamente (Dia Zero), cobrir o CAC, todos os custos transacionais e provisionar o Custo de Estoque vitalício da conta. Cada venda deve gerar lucro líquido real no D0.

**Viabilidade sem Upsell:** O negócio deve ser lucrativo e sustentável a longo prazo, mesmo com uma taxa de upsell (attach rate) de 0%. O upsell é um acelerador de lucro, não uma condição de sobrevivência.

**Eficiência de Capital:** Atingir um Custo de Estoque (sangramento) real por conta ≤ R$ 2,00/ano. O break-even mensal deve permanecer baixo (target: < 20 contas/mês).

## DOSSIÊ DE EXECUÇÃO — Atualizações Principais

Nota canônica: este resumo sintetiza as decisões definidas no documento principal do projeto — [BABY BOOK: DOSSIÊ DE EXECUÇÃO](Dossie_Execucao.md). Consulte-o para a versão canônica e o roteiro de implementação.

Resumo das decisões tomadas no "Dossiê de Execução" (financeiro, produto e técnico) e que devem ser refletidas em todo o repositório:

- PCE (Provisão de Custo de Existência): provisionar R$ 25,00 por venda no D0 para formar o fundo de perpetuidade. Isso substitui versões anteriores do valor e altera unit economics e políticas de preço.
- Gateway & Liquidez: considerar custo real de cartão (projeção R$ 16,33 por venda para B2C parcelado) e taxa PIX fixa ≈ R$ 1,00; estratégia de preço: R$ 297 (cartão) / R$ 279 (PIX) com incentivo explícito ao PIX.
- Regime Tributário (Fator R): risco de enquadramento no Anexo V (~15,5%). Estratégia: estruturar pró-labore ≥ 28% do faturamento bruto para manter Anexo III (alíquota efetiva menor). Manter 10% de margem de segurança nas projeções fiscais.
- Infra D0 e Mídia: mover processamento pesado para o cliente (FFmpeg.wasm) quando possível; fallback server-side para dispositivos fracos (~R$ 0,20 por conta). Isso reduz drasticamente o custo de entrada por usuário.
- Pivot de GTM: priorizar canal B2B2C (fotógrafos de parto como parceiros) para CAC quase zero e receita pré-paga; manter vendas diretas B2C como canal complementar com CAC estimado em R$ 80.
- Qualidade de mídia pronta para impressão e presets (fotógrafos: QHD 2560px JPEG85; upload mobile 2048px JPEG80; vídeos H.265 720p) — atualizar regras de derived assets e presets no catálogo de momentos.
- Fluxo de Unboxing: fotógrafos sobem arquivos antes; mãe resgata com voucher; sistema cria conta e transfere posse — endpoint transacional /redeem deve garantir atomicidade.
- KPIs e Roadmap: foco em Taxa de Sucesso de Upload >95%, Tempo Médio de Compressão <2min (100MB), Taxa de uso de Fallback <10%, Margem líquida B2B >60%.

Essas decisões atualizam e substituem trechos anteriores dos documentos. Verifique os arquivos `Modelagem_Produto.md`, `Arquitetura_do_Sistema.md`, `Modelo_de_Dados_Lógico.md`, `DevOps_Observabilidade.md` e `Catalogo_Momentos.md` para ver as atualizações alinhadas.

## 2. O Modelo de Negócio (Racional Técno-Financeiro)

Esta seção detalha a amarração entre as decisões de produto, engenharia e finanças que tornam o modelo de Acesso Perpétuo viável.

### 2.1 Por que Acesso Perpétuo + Upsell de Repetição

**Adoção mais fácil:** Assinatura (MRR) gera "fadiga de assinatura" e atrito. "Pague uma vez, é seu" (Acesso Perpétuo) alinha-se perfeitamente com o valor emocional de uma memória, que é permanente.

**Psicologia da Venda (Valor, não Utilidade):** Esta é a distinção estratégica mais importante. Não vendemos "dados" (GiB) ou "espaço". Vender "espaço" é um jogo de commodity, uma corrida para o fundo do poço vencida por gigantes.

O Pacote Base (ticket — R$ 297 cartão / R$ 279 PIX): Inclui todos os momentos únicos (ex: "Primeiro Sorriso") e séries fixas (ex: "Mêsversários"). Para momentos recorrentes (ex: "Visitas Especiais", "Consultas", "Galeria de Arte", "Livro de Visitas"), o pacote base inclui 5 entradas gratuitas para cada.

O Upsell (Pacotes de Repetição): O upsell é acionado quando o usuário tenta adicionar a 6ª entrada em um momento recorrente. O upsell é a compra de "Pacotes de Repetição Ilimitada" (pagamento único).

Exemplo: Pacote "Social" (R$ 29): Entradas ilimitadas para "Visitas Especiais" e "Livro de Visitas".

Exemplo: Pacote "Saúde" (R$ 29): Entradas ilimitadas para "Curva de Crescimento" e "Visitas ao Pediatra".

**Implicação:** O cliente compra valor (a liberdade de continuar um capítulo), não utilidade (dados). A compra é emocional, não punitiva.

### 2.2 Por que o Stack Serverless (O Racional de Custo)

O modelo de Acesso Perpétuo inverte a lógica do SaaS: a receita é concentrada no D0, mas o custo (armazenamento, entrega) é vitalício. Eliminar custo fixo (ociosidade) não é otimização: é condição de sobrevivência.

**O Problema Central: Custo Fixo vs. Custo Vitalício**

O cliente paga o ticket uma vez (R$ 297 cartão / R$ 279 PIX), mas nós temos que "bancar" o custo de storage, egress (tráfego) e compute (processamento) desse cliente para sempre. Em um SaaS normal (assinatura), o custo fixo (servidor ligado 24/7 — por exemplo, uma RDS que poderia custar centenas de reais/mês) é diluído pela receita recorrente. No nosso modelo, a receita é só no Dia Zero (D0). Portanto, a ociosidade é o nosso maior inimigo.

**O que era preciso (A Tese):** Precisávamos de um stack que tivesse um custo fixo de R$ 0 (ou perto disso) e cujo custo variável escalasse perfeitamente com a receita (novos uploads), não com o uso (visualização).

**A Solução: O Stack "Pay-per-Use" (Peça por Peça)**

Nós atacamos os três grandes ralos de custo: Banco de Dados, Processamento (Workers) e, o mais perigoso, a Saída de Dados (Egress).

1. **O Problema do Banco de Dados (Ociosidade)**

   O que era preciso: Um banco de dados que não cobrasse custos mensais fixos altos só para ficar "ligado" (ex.: RDS tradicional), já que 90% dos usuários ficarão inativos após o primeiro ano.

   A Tecnologia Escolhida: Neon (PostgreSQL Serverless).

   O Motivo (Por quê?): O Neon separa o storage (armazenamento, que é barato) do compute (processamento, que é caro). Quando o banco fica ocioso (ex: 5 min sem consulta), o compute "dorme" (escala a zero) e o custo fixo dele vai a R$ 0.

   A Troca (Trade-off): Aceitamos um cold start de 1-3 segundos na primeira consulta de um usuário inativo. Isso é perfeitamente aceitável, pois nossa UX não é de alta frequência (como um chat), mas sim de uso esporádico e intencional.

2. **O Problema do Processamento (Workers)**

   O que era preciso: Processar picos de uploads (ex: Dia das Mães) sem manter uma frota de servidores (VMs/EC2) cara e ociosa, nem gerenciar a complexidade de um auto-scaling de Kubernetes ou um setup de Celery/Redis.

   A Tecnologia Escolhida: Modal (Workers Python).

   O Motivo (Por quê?): É o "compute" elástico e sem gerenciamento. Pagamos por segundo de CPU usado. Se ninguém faz upload, o custo é R$ 0. Se 1.000 usuários fazem upload no mesmo minuto, 1.000 workers "nascem" sob demanda, processam o vídeo (executando nosso código Python/FFmpeg) e "morrem". O custo de compute (os R$ 0,44 por conta, ver 2.3) só acontece no D0, junto com a receita do ticket (R$ 279 PIX / R$ 297 cartão).

3. **O Problema da Fila (Robustez)**

   O que era preciso: Uma forma de lidar com os picos e garantir a resiliência. Se 1.000 usuários fazem upload simultaneamente, a API (o "porteiro") não pode cair e o job de processamento não pode se perder se o worker falhar.

   A Tecnologia Escolhida: Cloudflare Queues.

   O Motivo (Por quê?): Quando o usuário completa o upload, a API (no Fly.io) não tenta "chamar" o Modal. Ela só "joga" uma mensagem minúscula na fila da Cloudflare (ex: "processe o asset_id 123") e retorna "OK" (202) para o usuário em milissegundos. A fila absorve o "tranco" (o pico) e garante a entrega da mensagem ao Modal. Se o Modal falhar, a fila re-tenta automaticamente. Isso garante a UX "fire-and-forget" e a integridade dos dados.

4. **O Problema da Saída de Dados (O "Pulo do Gato")**

   Esse era o maior risco. De que adianta o storage ser barato se, toda vez que o usuário (ou os avós) assiste a um vídeo, nós pagamos egress (saída de dados), que é caríssimo? Um álbum compartilhado que viraliza quebraria a empresa.

   **O que era preciso (A "Saída Gratuita"):** Precisávamos de storage barato com egress (saída) gratuito.

   A Tecnologia Escolhida: Armazenamento híbrido R2 (hot) + Backblaze B2 (cold) servido pela CDN (Cloudflare) para minimizar egress.

   O Motivo (Por quê?): O B2 é um dos storages S3-compatíveis mais baratos do mercado. Mas o "pulo do gato" é que ele faz parte da "Bandwidth Alliance".

   Como foi resolvido: Essa aliança significa que qualquer transferência de dados do B2 para a CDN da Cloudflare tem custo ZERO de egress. Nosso fluxo fica:
   - Armazenamos a mídia no B2 (barato).
   - O usuário pede a mídia.
   - A Cloudflare (CDN) "puxa" a mídia do B2 (custo R$ 0) e armazena em cache na borda.
   - A Cloudflare entrega a mídia para o usuário (rápido e, na maior parte, de graça).

   Basicamente, essa única decisão (a "Bandwidth Alliance") neutralizou o maior risco financeiro variável do modelo de Acesso Perpétuo.

**Resumo do Stack**

O stack não foi escolhido por ser "moderno" (apesar de ser), mas como uma estratégia financeira direta para viabilizar o modelo de Acesso Perpétuo:

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

Receita bruta = (Contas novas × ticket [R$ 279 PIX / R$ 297 cartão]) + (Contas novas × attach_rate × upsell_médio)

... (demais fórmulas mantidas)

CAC (custo) = Contas novas × CAC_anual (R$ 80 no A1, R$ 65 no A2, R$ 55 no A3)

## Anexo B — Parâmetros ajustáveis (Revisado)

| Parâmetro                     | Faixa de Risco (Cenário Pessimista) | Base (Projeção Realista A1) | Faixa Otimista (Metas A2+) | Comentário Estratálgico                                      |
| ----------------------------- | ----------------------------------- | --------------------------- | -------------------------- | ------------------------------------------------------------ |
| FX (USD/BRL)                  | 5,80–6,10                           | 5,50                        | 5,10–5,49                  | Risco externo. Mitigado via Hedge (4.1).                     |
| **CAC (R$)**                  | 81–100 (B2B2C falha)                | 80 (A1)                     | 50–79 (B2B2C escala)       | Principal alavanca de lucro. Depende do GTM B2B2C (3.4).     |
| Attach (%)                    | 10%–19% (CRM falha)                 | 20% (A1)                    | 25%–45% (CRM otimizado)    | Alavanca de lucro incremental. Não mais de sobrevivência.    |
| Upsell médio (R$)             | -                                   | 49                          | -                          | Alavanca secundária de LTV. (Simplificado para pacote único) |
| Infra variável (R$/conta/ano) | 1,80–2,20                           | 1,25                        | 1,20–1,52                  | Já auditado e otimizado.                                     |

## Anexo C — Glossário rápido

**Acesso Perpétuo:** (Substitui LTD). Pagamento único, acesso ao produto base conforme Termos de Uso (que incluem cláusulas de inatividade e custo).

**Attach Rate (%):** "Taxa de Adesão". A porcentagem de clientes da base (Acesso Perpétuo) que compram um upsell (Pacote de Repetição) por ano. É a métrica-chave de LTV incremental.

**Bandwidth Alliance:** O "pulo do gato" técnico. Acordo entre o B2 (Backblaze) e a Cloudflare que zera o custo de egress (tráfego de saída) de mídia, tornando o streaming financeiramente viável.

**B2B2C:** "Business-to-Business-to-Consumer". Nossa estratégia de GTM prioritária (Seção 3.4), onde vendemos/ofertamos o app através de parceiros (Fotógrafos, Lojas de Enxoval) para chegar ao cliente final.

**CAC (Custo de Aquisição de Cliente):** O custo médio (blended) para adquirir um novo cliente pagante (ex: R$ 80 no A1). Inclui todos os custos de marketing, vendas e comissões de parceiros.

**Cold Start:** O "atraso" (1-3 segundos) para "acordar" um recurso serverless (Neon, Modal) que estava "dormindo" (ocioso). É o trade-off que aceitamos para ter custo fixo zero.

**Cold Storage:** "Armazenamento Frio". Mover dados de contas inativas (>12 meses) para uma camada de storage mais barata (e lenta) para reduzir o Custo de Estoque.

**Custo de Estoque:** Nosso "sangramento" anual. O custo de infra pay-per-use (estimativa ≈ R$ 1,25/ano) para manter uma conta inativa "em prateleira" (B2 + I/O mínimo). Esta estimativa deriva da provisão do PCE (R$ 25,00 dividido ao longo de 20 anos) e deve ser revisada periodicamente.

**Custo de Setup:** Custo único de compute (R$ 0,44) incorrido no D0 para processar (transcodificar) os 60 momentos iniciais do cliente.

**D0 (Dia Zero):** O dia da compra. O pilar do nosso modelo é ser lucrativo no D0 (lucro líquido real após pagar CAC e PCE).

**DRE (Demonstração do Resultado):** A projeção financeira que valida o modelo (Seção 5.1).

**Egress:** Custo de tráfego de saída de dados (ex: streaming de vídeo). O maior risco de custo, mitigado pela Bandwidth Alliance.

**GTM (Go-to-Market):** O plano tático de "ida ao mercado" (Seção 3.4), focado em B2B2C.

**LTV (Lifetime Value):** "Valor do Ciclo de Vida do Cliente". A receita total esperada de um cliente. No nosso modelo: LTV = ticket (R$ 279 PIX / R$ 297 cartão) (D0) + (Contribuição Média do Upsell _ Attach Rate _ Anos).

**Opex (Operational Expenditure):** Nossos custos fixos mensais (ex: Opex Adm. de R$ 2.500/mês), que não incluem infra variável.

**Pacotes de Repetição:** Nosso produto de upsell. Venda de entradas ilimitadas para capítulos recorrentes (ex: "Pacote Social").

**PCE (Provisão de Custo de Existência):** Reserva financeira criada no D0 (R$ 25,00 por venda) para cobrir o Custo de Estoque vitalício (20 anos) da conta. Garante a sobrevivência com 0% de upsell. (equivalente a uma provisão anual estimada de ~R$ 1,5/ano dependendo do mix de custos operacionais)

**SLO (Service Level Objective):** "Objetivo de Nível de Serviço". Metas mensuráveis (ex: Custo de Estoque ≤ R$ 2,00/ano).

**Stack Serverless:** A arquitetura (Neon, Modal, CF Queues) que "escala a zero", eliminando o custo fixo de ociosidade.

**TAM (Total Addressable Market):** O "Mercado Total Endereçável" (ex: 2,5 milhões de nascimentos/ano no Brasil).
