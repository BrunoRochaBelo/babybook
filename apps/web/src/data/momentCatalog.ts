export type CatalogMomentType = "unique" | "recurring" | "series";

export type CatalogMoment = {
  id: string;
  templateKey: string;
  title: string;
  prompt: string;
  type: CatalogMomentType;
};

export type CatalogChapter = {
  id: string;
  title: string;
  subtitle: string;
  range: string;
  accent: string;
  moments: CatalogMoment[];
};

export type CatalogSequenceItem = CatalogMoment & {
  chapterId: string;
  chapterTitle: string;
  chapterSubtitle: string;
  chapterAccent: string;
  range: string;
  order: number;
};

export const MOMENT_CATALOG: CatalogChapter[] = [
  {
    id: "cap-1",
    title: "Cap. 1 • A Jornada Começa",
    subtitle: "Gravidez e parto",
    range: "Pré-natal até a alta da maternidade",
    accent: "#F4DAD4",
    moments: [
      {
        id: "descoberta",
        templateKey: "capitulo_1_descoberta",
        title: "A Descoberta",
        prompt: "O momento que tudo mudou! Conte como foi a grande notícia.",
        type: "unique",
      },
      {
        id: "diario-barriga",
        templateKey: "capitulo_1_diario_barriga",
        title: "Diário da Barriga",
        prompt: "Acompanhe o crescimento sempre no mesmo ângulo.",
        type: "recurring",
      },
      {
        id: "ouvimos-coracao",
        templateKey: "capitulo_1_ouvimos_coracao",
        title: "Ouvimos seu Coração",
        prompt: "O som mais emocionante do mundo.",
        type: "unique",
      },
      {
        id: "historia-nome",
        templateKey: "capitulo_1_historia_nome",
        title: "A História do Nome",
        prompt: "Todo nome tem um significado. Qual é o de vocês?",
        type: "unique",
      },
      {
        id: "cha-bebe",
        templateKey: "capitulo_1_cha_bebe",
        title: "Chá de Bebê / Revelação",
        prompt: "O dia da celebração! Como foi a festa?",
        type: "unique",
      },
      {
        id: "quartinho",
        templateKey: "capitulo_1_quartinho",
        title: "O Quartinho",
        prompt: "O cantinho mais especial da casa.",
        type: "unique",
      },
      {
        id: "seja-bem-vindo",
        templateKey: "capitulo_1_seja_bem_vindo",
        title: "Seja Bem-Vindo(a)!",
        prompt: "Nosso cartão oficial de nascimento.",
        type: "unique",
      },
      {
        id: "lembrancas-maternidade",
        templateKey: "capitulo_1_lembrancas_maternidade",
        title: "Lembranças da Maternidade",
        prompt: "Pulseirinha, roupinha e todo carinho na hora da alta.",
        type: "unique",
      },
    ],
  },
  {
    id: "cap-2",
    title: "Cap. 2 • Nosso Novo Lar",
    subtitle: "Primeiros dias",
    range: "Chegada em casa até a nova rotina",
    accent: "#F9E7C8",
    moments: [
      {
        id: "chegada-casa",
        templateKey: "capitulo_2_chegada_casa",
        title: "A Chegada em Casa",
        prompt: "A primeira vez no novo ninho.",
        type: "unique",
      },
      {
        id: "primeiro-banho-casa",
        templateKey: "capitulo_2_primeiro_banho",
        title: "Primeiro Banho em Casa",
        prompt: "Gostou ou chorou? Conte tudo.",
        type: "unique",
      },
      {
        id: "visitas-especiais",
        templateKey: "capitulo_2_visitas_especiais",
        title: "Visitas Especiais",
        prompt: "Quem veio conhecer o bebê e doar tempo/colo.",
        type: "recurring",
      },
      {
        id: "cantinho-dormir",
        templateKey: "capitulo_2_cantinho_dormir",
        title: "Meu Cantinho de Dormir",
        prompt: "Onde os sonhos acontecem.",
        type: "unique",
      },
    ],
  },
  {
    id: "cap-3",
    title: "Cap. 3 • As Grandes Conquistas",
    subtitle: "Marcos incríveis",
    range: "Do primeiro sorriso aos primeiros passos",
    accent: "#FCE4EB",
    moments: [
      {
        id: "primeiro-sorriso",
        templateKey: "capitulo_3_primeiro_sorriso",
        title: "Primeiro Sorriso Social",
        prompt: "Aquele sorriso que derreteu todo mundo.",
        type: "unique",
      },
      {
        id: "primeiro-gugu",
        templateKey: "capitulo_3_primeiro_gugu",
        title: "Primeiro “Gugu-Dada”",
        prompt: "Os sons que viraram conversa.",
        type: "unique",
      },
      {
        id: "primeiro-rolamento",
        templateKey: "capitulo_3_primeiro_rolamento",
        title: "Primeiro Rolamento",
        prompt: "Descobrindo como se mover.",
        type: "unique",
      },
      {
        id: "primeira-gargalhada",
        templateKey: "capitulo_3_primeira_gargalhada",
        title: "Primeira Gargalhada",
        prompt: "A melhor risada do mundo. O que causou?",
        type: "unique",
      },
      {
        id: "primeira-comida",
        templateKey: "capitulo_3_primeira_comida",
        title: "Primeira Comida",
        prompt: "Hora da bagunça! Qual foi a reação?",
        type: "unique",
      },
      {
        id: "primeiro-dente",
        templateKey: "capitulo_3_primeiro_dente",
        title: "Primeiro Dente",
        prompt: "Olha a janelinha (ou o pontinho branco)!",
        type: "unique",
      },
      {
        id: "primeiro-engatinhar",
        templateKey: "capitulo_3_primeiro_engatinhar",
        title: "Primeiro Engatinhar",
        prompt: "Rumo à independência! Qual o estilo?",
        type: "unique",
      },
      {
        id: "primeira-palavra",
        templateKey: "capitulo_3_primeira_palavra",
        title: "Primeira Palavra",
        prompt: "O que ele(a) disse primeiro?",
        type: "unique",
      },
      {
        id: "primeiros-passos",
        templateKey: "capitulo_3_primeiros_passos",
        title: "Primeiros Passos",
        prompt: "Os pés ganharam o mundo!",
        type: "unique",
      },
    ],
  },
  {
    id: "cap-4",
    title: "Cap. 4 • Crescendo",
    subtitle: "Saúde e acompanhamento",
    range: "Utilitários privados do Owner",
    accent: "#E3F0E2",
    moments: [
      {
        id: "curva-crescimento",
        templateKey: "capitulo_4_curva_crescimento",
        title: "Curva de Crescimento",
        prompt: "Acompanhando peso, altura e perímetro.",
        type: "recurring",
      },
      {
        id: "visitas-pediatra",
        templateKey: "capitulo_4_consulta_pediatra",
        title: "Visitas ao Pediatra",
        prompt: "Registro das consultas importantes.",
        type: "recurring",
      },
      {
        id: "galeria-arte",
        templateKey: "capitulo_4_galeria_arte",
        title: "Galeria de Arte",
        prompt: "Primeiros rabiscos e expressões criativas.",
        type: "recurring",
      },
    ],
  },
  {
    id: "cap-5",
    title: "Cap. 5 • Celebrações",
    subtitle: "Festas e datas especiais",
    range: "Do 1º mês ao primeiro aniversário",
    accent: "#FFE6D6",
    moments: [
      {
        id: "mesversario-m01",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 1º mês",
        prompt: "O primeiro check-in do time-lapse afetivo.",
        type: "series",
      },
      {
        id: "mesversario-m02",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 2º mês",
        prompt: "Como o ninho mudou após 60 dias?",
        type: "series",
      },
      {
        id: "mesversario-m03",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 3º mês",
        prompt: "Comece a notar os traços marcantes desse trimestre.",
        type: "series",
      },
      {
        id: "mesversario-m04",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 4º mês",
        prompt: "O sorriso está diferente? Registre!",
        type: "series",
      },
      {
        id: "mesversario-m05",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 5º mês",
        prompt: "Capture o topete, o cabelo, o jeito único do quinto mês.",
        type: "series",
      },
      {
        id: "mesversario-m06",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 6º mês",
        prompt: "Metade do primeiro ano! Hora da foto especial.",
        type: "series",
      },
      {
        id: "mesversario-m07",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 7º mês",
        prompt: "Registre as novas manias e expressões preferidas.",
        type: "series",
      },
      {
        id: "mesversario-m08",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 8º mês",
        prompt: "Quem é o convidado especial desse mês?",
        type: "series",
      },
      {
        id: "mesversario-m09",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 9º mês",
        prompt: "Tempo de celebrar as descobertas motoras.",
        type: "series",
      },
      {
        id: "mesversario-m10",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 10º mês",
        prompt: "Registre a personalidade que já desponta.",
        type: "series",
      },
      {
        id: "mesversario-m11",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 11º mês",
        prompt: "Último antes do aniversário! Faça um teaser do grande dia.",
        type: "series",
      },
      {
        id: "primeiro-aniversario",
        templateKey: "capitulo_5_primeiro_aniversario",
        title: "Primeiro Aniversário",
        prompt: "O primeiro ano completo! O grande marco.",
        type: "unique",
      },
      {
        id: "primeiro-natal",
        templateKey: "capitulo_5_primeiro_natal",
        title: "Primeiro Natal",
        prompt: "O primeiro Natal em família.",
        type: "unique",
      },
      {
        id: "primeira-pascoa",
        templateKey: "capitulo_5_primeira_pascoa",
        title: "Primeira Páscoa",
        prompt: "A primeira visita do coelhinho.",
        type: "unique",
      },
      {
        id: "primeiro-dia-das-maes-pais",
        templateKey: "capitulo_5_primeiro_dia_das_maes_pais",
        title: "Primeiro Dia das Mães/Pais",
        prompt: "A primeira celebração como nova família.",
        type: "unique",
      },
    ],
  },
];

let sequenceOrder = 0;
export const GUIDED_MOMENT_SEQUENCE: CatalogSequenceItem[] =
  MOMENT_CATALOG.flatMap((chapter) =>
    chapter.moments.map((moment) => ({
      ...moment,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterSubtitle: chapter.subtitle,
      chapterAccent: chapter.accent,
      range: chapter.range,
      order: sequenceOrder++,
    })),
  );

export const getMomentByTemplateKey = (templateKey?: string | null) => {
  if (!templateKey) {
    return undefined;
  }
  return GUIDED_MOMENT_SEQUENCE.find(
    (item) => item.templateKey === templateKey,
  );
};

export const TOTAL_GUIDED_MOMENTS = GUIDED_MOMENT_SEQUENCE.length;
