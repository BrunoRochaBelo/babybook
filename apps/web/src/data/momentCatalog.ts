export type CatalogMomentType = "unique" | "recurring" | "series";

export type CatalogFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "tags"
  | "date"
  | "datetime"
  | "richtext";

export type CatalogFieldOption = {
  value: string;
  label: string;
};

export type CatalogField = {
  key: string;
  label: string;
  type: CatalogFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: CatalogFieldOption[];
  min?: number;
  max?: number;
  readOnly?: boolean;
};

export type CatalogMediaConstraints = {
  photos?: { min: number; max: number };
  video?: { max: number; maxSeconds: number; required?: boolean };
  audio?: { max: number; maxSeconds: number; required?: boolean };
  /** Quando o momento aceita 1 vídeo OU 1 áudio (exclusivo). */
  videoOrAudio?: { max: number; maxSeconds: number; required?: boolean };
  notes?: string[];
};

export type CatalogMoment = {
  id: string;
  templateKey: string;
  title: string;
  prompt: string;
  type: CatalogMomentType;
  media?: CatalogMediaConstraints;
  /** Variante de constraints para B2B (ex.: galeria 50+ fotos). */
  mediaB2B?: CatalogMediaConstraints;
  badges?: string[];
  /** Campos específicos de UI para este momento (salvos em payload.fields). */
  fields?: CatalogField[];
  /** Valores padrão (ex.: mês do mêsversário), mesclados em payload.fields. */
  defaults?: Record<string, unknown>;
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
    title: "Cap. 1 • A Doce Espera",
    subtitle: "Gestação",
    range: "Da grande descoberta ao chá revelação",
    accent: "#F4DAD4",
    moments: [
      {
        id: "descoberta",
        templateKey: "capitulo_1_descoberta",
        title: "A Grande Descoberta",
        prompt: "Como você descobriu? E como foi a reação?",
        type: "unique",
        fields: [
          {
            key: "how_discovered",
            label: "Como descobriu?",
            type: "textarea",
            required: true,
          },
          {
            key: "reaction",
            label: "Reação",
            type: "textarea",
            required: true,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["Regra de Ouro: 3 fotos + 1 vídeo (30s) ou áudio."],
        },
      },
      {
        id: "diario-barriga",
        templateKey: "capitulo_1_diario_barriga",
        title: "Diário da Barriga",
        prompt: "Semanas, medida e sentimentos — sempre no mesmo ângulo.",
        type: "recurring",
        badges: ["Upsell • Tracking"],
        fields: [
          {
            key: "weeks",
            label: "Semanas",
            type: "number",
            required: true,
            min: 1,
            max: 45,
          },
          {
            key: "measurement_cm",
            label: "Medida (cm)",
            type: "number",
            required: false,
            min: 0,
            max: 200,
          },
          {
            key: "feelings",
            label: "Sentimentos",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["Foco em time-lapse (consistência é tudo)."],
        },
      },
      {
        id: "ouvimos-coracao",
        templateKey: "capitulo_1_ouvimos_coracao",
        title: "Ouvimos seu Coração",
        prompt: "Onde foi? E quantos BPM?",
        type: "unique",
        fields: [
          {
            key: "where",
            label: "Onde foi?",
            type: "text",
            required: false,
          },
          {
            key: "bpm",
            label: "BPM",
            type: "number",
            required: false,
            min: 0,
            max: 300,
          },
        ],
        media: {
          photos: { min: 1, max: 1 },
          audio: { max: 1, maxSeconds: 30 },
          notes: ["1 foto (ultrassom) + 1 áudio (30s) dos batimentos."],
        },
      },
      {
        id: "cha-bebe",
        templateKey: "capitulo_1_cha_bebe",
        title: "Chá Revelação / Bebê",
        prompt: "Tema e destaques. Como foi o momento da revelação?",
        type: "unique",
        fields: [
          {
            key: "theme",
            label: "Tema",
            type: "text",
            required: false,
          },
          {
            key: "highlights",
            label: "Destaques",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["3 fotos + 1 vídeo (30s) da revelação."],
        },
      },
      {
        id: "ensaio-gestante",
        templateKey: "capitulo_1_ensaio_gestante",
        title: "Ensaio Gestante",
        prompt: "Fotógrafo(a) e data. Um registro profissional dessa fase.",
        type: "unique",
        badges: ["Especial • B2B/Voucher"],
        fields: [
          {
            key: "photographer",
            label: "Fotógrafo(a)",
            type: "text",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["B2C: 3 fotos + 1 vídeo.", "B2B: 50+ fotos (galeria)."],
        },
        mediaB2B: {
          photos: { min: 50, max: 200 },
          notes: [
            "B2B: 50+ fotos (galeria).",
            "No modo B2B, este momento aceita somente fotos (sem vídeo/áudio).",
          ],
        },
      },
    ],
  },
  {
    id: "cap-2",
    title: "Cap. 2 • A Chegada",
    subtitle: "Nascimento",
    range: "Do parto à alta da maternidade",
    accent: "#F9E7C8",
    moments: [
      {
        id: "bem-vindo",
        templateKey: "capitulo_1_seja_bem_vindo",
        title: "Bem-Vindo(a)!",
        prompt: "Data/hora, peso, altura e local — o cartão oficial.",
        type: "unique",
        fields: [
          {
            key: "time",
            label: "Hora (opcional)",
            type: "text",
            placeholder: "Ex: 14:35",
            required: false,
          },
          {
            key: "weight_kg",
            label: "Peso (kg)",
            type: "number",
            required: false,
            min: 0,
            max: 20,
          },
          {
            key: "height_cm",
            label: "Altura (cm)",
            type: "number",
            required: false,
            min: 0,
            max: 100,
          },
          {
            key: "location",
            label: "Local",
            type: "text",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["3 fotos (1 principal para capa) + 1 vídeo (30s)."],
        },
      },
      {
        id: "relato-parto",
        templateKey: "capitulo_2_relato_parto",
        title: "Relato do Parto",
        prompt: "Tipo de parto e a história — do seu jeito.",
        type: "unique",
        fields: [
          {
            key: "birth_type",
            label: "Tipo de Parto",
            type: "select",
            required: false,
            options: [
              { value: "normal", label: "Normal" },
              { value: "cesarea", label: "Cesárea" },
              { value: "outro", label: "Outro" },
            ],
          },
          {
            key: "story",
            label: "A História",
            type: "richtext",
            required: false,
            placeholder: "Conte o relato do parto...",
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
        },
      },
      {
        id: "marcas-crescimento",
        templateKey: "capitulo_2_marcas_crescimento",
        title: "Marcas do Crescimento",
        prompt: "Mão ou pé? Um carimbo afetivo pra guardar.",
        type: "recurring",
        badges: ["Upsell • Creative"],
        fields: [
          {
            key: "age_months",
            label: "Idade (meses)",
            type: "number",
            required: false,
            min: 0,
            max: 48,
          },
          {
            key: "limb",
            label: "Membro",
            type: "select",
            required: false,
            options: [
              { value: "mao", label: "Mão" },
              { value: "pe", label: "Pé" },
            ],
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          notes: ["Sem vídeo (foco na arte / contraste)."],
        },
      },
      {
        id: "ensaio-newborn",
        templateKey: "capitulo_2_ensaio_newborn",
        title: "Ensaio Newborn",
        prompt:
          "Fotógrafo(a) e tema. Um registro profissional dos primeiros dias.",
        type: "unique",
        badges: ["Especial • B2B/Voucher"],
        fields: [
          {
            key: "photographer",
            label: "Fotógrafo(a)",
            type: "text",
            required: false,
          },
          {
            key: "theme",
            label: "Tema",
            type: "text",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["B2C: 3 fotos + 1 vídeo.", "B2B: 50+ fotos (galeria)."],
        },
        mediaB2B: {
          photos: { min: 50, max: 200 },
          notes: [
            "B2B: 50+ fotos (galeria).",
            "No modo B2B, este momento aceita somente fotos (sem vídeo/áudio).",
          ],
        },
      },
      {
        id: "lembrancas-maternidade",
        templateKey: "capitulo_1_lembrancas_maternidade",
        title: "Lembranças da Maternidade",
        prompt: "Pulseira, roupinha, legendas e detalhes que viram memória.",
        type: "unique",
        fields: [
          {
            key: "captions",
            label: "Legendas (pulseira, roupa, detalhes)",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["3 fotos documentais + 1 vídeo (30s)."],
        },
      },
    ],
  },
  {
    id: "cap-3",
    title: "Cap. 3 • Primeiros Dias",
    subtitle: "Adaptação",
    range: "Chegada em casa, cuidados e rotina",
    accent: "#FCE4EB",
    moments: [
      {
        id: "chegada-casa",
        templateKey: "capitulo_2_chegada_casa",
        title: "Chegada em Casa",
        prompt: "Quem recebeu? Conte como foi a entrada no novo ninho.",
        type: "unique",
        fields: [
          {
            key: "who_received",
            label: "Quem recebeu?",
            type: "tags",
            required: false,
            placeholder: "Ex: mamãe, papai, vovó",
          },
          {
            key: "story",
            label: "Relato",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["Vídeo (30s) da entrada/chegada."],
        },
      },
      {
        id: "primeiro-banho",
        templateKey: "capitulo_2_primeiro_banho",
        title: "Primeiro Banho",
        prompt: "Quem deu? E como foi a reação?",
        type: "unique",
        fields: [
          {
            key: "who_gave",
            label: "Quem deu?",
            type: "text",
            required: false,
          },
          {
            key: "reaction",
            label: "Reação",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
        },
      },
      {
        id: "caiu-umbigo",
        templateKey: "capitulo_3_caiu_umbigo",
        title: "Caiu o Umbigo",
        prompt: "Data da queda e onde você guardou.",
        type: "unique",
        fields: [
          {
            key: "stored_where",
            label: "Onde guardou?",
            type: "text",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30, required: false },
          notes: ["Vídeo opcional."],
        },
      },
      {
        id: "soninho",
        templateKey: "capitulo_2_cantinho_dormir",
        title: "O Soninho",
        prompt: "Local e ritual — um ruído branco pra lembrar.",
        type: "unique",
        fields: [
          {
            key: "sleep_place",
            label: "Local",
            type: "select",
            required: false,
            options: [
              { value: "berco", label: "Berço" },
              { value: "cama", label: "Cama" },
              { value: "outro", label: "Outro" },
            ],
          },
          {
            key: "ritual",
            label: "Ritual",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["Vídeo (30s) com o ritual/ambiente."],
        },
      },
    ],
  },
  {
    id: "cap-4",
    title: "Cap. 4 • Marcos do Desenvolvimento",
    subtitle: "Conquistas",
    range: "Do primeiro sorriso às primeiras palavras",
    accent: "#E3F0E2",
    moments: [
      {
        id: "primeiro-sorriso",
        templateKey: "capitulo_3_primeiro_sorriso",
        title: "Primeiro Sorriso",
        prompt: "Qual foi o motivo do sorriso?",
        type: "unique",
        fields: [
          {
            key: "reason",
            label: "O motivo",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["Vídeo (30s) do sorriso."],
        },
      },
      {
        id: "introducao-alimentar",
        templateKey: "capitulo_3_primeira_comida",
        title: "Introdução Alimentar",
        prompt: "O que comeu? E a reação (amou/odiou)?",
        type: "unique",
        fields: [
          {
            key: "food",
            label: "O que comeu?",
            type: "text",
            required: false,
          },
          {
            key: "reaction",
            label: "Reação",
            type: "select",
            required: false,
            options: [
              { value: "amou", label: "Amou" },
              { value: "odiou", label: "Odiou" },
            ],
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["3 fotos (a sujeira) + 1 vídeo (30s) da careta."],
        },
      },
      {
        id: "sentou-sozinho",
        templateKey: "capitulo_4_sentou_sozinho",
        title: "Sentou Sozinho",
        prompt: "O dia em que a postura virou conquista.",
        type: "unique",
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
        },
      },
      {
        id: "engatinhou",
        templateKey: "capitulo_3_primeiro_engatinhar",
        title: "Engatinhou",
        prompt: "Estilo (arrastando/4 apoios) e como foi o primeiro dia.",
        type: "unique",
        fields: [
          {
            key: "style",
            label: "Estilo",
            type: "select",
            required: false,
            options: [
              { value: "arrastando", label: "Arrastando" },
              { value: "4_apoios", label: "4 apoios" },
            ],
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
        },
      },
      {
        id: "primeiros-passos",
        templateKey: "capitulo_3_primeiros_passos",
        title: "Primeiros Passos",
        prompt: "Onde foi? Quem viu?",
        type: "unique",
        fields: [
          {
            key: "where",
            label: "Onde foi?",
            type: "text",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
        },
      },
      {
        id: "primeiras-palavras",
        templateKey: "capitulo_3_primeira_palavra",
        title: "Primeiras Palavras",
        prompt: "Qual foi a palavra?",
        type: "unique",
        fields: [
          {
            key: "word",
            label: "A palavra",
            type: "text",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          videoOrAudio: { max: 1, maxSeconds: 30 },
          notes: ["1 áudio OU 1 vídeo (30s)."],
        },
      },
      {
        id: "primeiro-dente",
        templateKey: "capitulo_3_primeiro_dente",
        title: "Primeiro Dente",
        prompt: "Qual dente foi? (macro/sorriso).",
        type: "unique",
        fields: [
          {
            key: "tooth",
            label: "Qual dente?",
            type: "text",
            required: false,
            placeholder: "Ex: incisivo inferior",
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30, required: false },
          notes: ["Vídeo opcional."],
        },
      },
    ],
  },
  {
    id: "cap-5",
    title: "Cap. 5 • Celebrações & Rituais",
    subtitle: "Festas, fé e datas especiais",
    range: "Do 1º mês ao primeiro ano",
    accent: "#FFE6D6",
    moments: [
      {
        id: "mesversario-m01",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 1º mês",
        prompt: "Destaques do mês e a foto do time-lapse.",
        type: "series",
        defaults: { month_ref: 1 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          {
            key: "highlights",
            label: "Destaques",
            type: "textarea",
            required: false,
          },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m02",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 2º mês",
        prompt: "O que mudou desde o mês passado?",
        type: "series",
        defaults: { month_ref: 2 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m03",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 3º mês",
        prompt: "Destaques e novas manias do mês.",
        type: "series",
        defaults: { month_ref: 3 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m04",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 4º mês",
        prompt: "Destaques do mês e uma frase que marcou.",
        type: "series",
        defaults: { month_ref: 4 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m05",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 5º mês",
        prompt: "Destaques do mês e a carinha dessa fase.",
        type: "series",
        defaults: { month_ref: 5 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m06",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 6º mês",
        prompt: "Metade do primeiro ano! Hora da foto especial.",
        type: "series",
        defaults: { month_ref: 6 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m07",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 7º mês",
        prompt: "Registre as novas manias e expressões preferidas.",
        type: "series",
        defaults: { month_ref: 7 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m08",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 8º mês",
        prompt: "Quem é o convidado especial desse mês?",
        type: "series",
        defaults: { month_ref: 8 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m09",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 9º mês",
        prompt: "Tempo de celebrar as descobertas motoras.",
        type: "series",
        defaults: { month_ref: 9 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m10",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 10º mês",
        prompt: "Registre a personalidade que já desponta.",
        type: "series",
        defaults: { month_ref: 10 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "mesversario-m11",
        templateKey: "capitulo_5_mesversarios",
        title: "Mêsversário • 11º mês",
        prompt: "Último antes do aniversário! Faça um teaser do grande dia.",
        type: "series",
        defaults: { month_ref: 11 },
        fields: [
          {
            key: "month_ref",
            label: "Mês ref.",
            type: "number",
            readOnly: true,
          },
          { key: "highlights", label: "Destaques", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["1 foto obrigatória para o time-lapse."],
        },
      },
      {
        id: "primeiro-ano",
        templateKey: "capitulo_5_primeiro_aniversario",
        title: "O Primeiro Ano (12m)",
        prompt: "Tema e relato — o grande marco do primeiro ano.",
        type: "unique",
        fields: [
          { key: "theme", label: "Tema", type: "text" },
          {
            key: "story",
            label: "Relato",
            type: "richtext",
            placeholder: "Conte como foi a festa e o que você sentiu...",
          },
        ],
        media: {
          photos: { min: 10, max: 10 },
          video: { max: 2, maxSeconds: 30 },
          notes: ["Exceção: 10 fotos + 2 vídeos (30s)."],
        },
      },
      {
        id: "batizado-apresentacao",
        templateKey: "capitulo_5_batizado_apresentacao",
        title: "Batizado / Apresentação",
        prompt: "Padrinhos e local. Um ritual que vira memória.",
        type: "unique",
        badges: ["Especial • B2B Link"],
        fields: [
          {
            key: "godparents",
            label: "Padrinhos",
            type: "tags",
            placeholder: "Ex: tia Ana, tio João",
          },
          { key: "location", label: "Local", type: "text" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
          notes: ["B2C: 3 fotos + 1 vídeo.", "B2B: 50+ fotos (galeria)."],
        },
        mediaB2B: {
          photos: { min: 50, max: 200 },
          notes: [
            "B2B: 50+ fotos (galeria).",
            "No modo B2B, este momento aceita somente fotos (sem vídeo/áudio).",
          ],
        },
      },
      {
        id: "datas-especiais",
        templateKey: "capitulo_5_datas_especiais",
        title: "Datas Especiais",
        prompt: "Natal, Páscoa, Dia dos Pais/Mães… Onde foi e como foi?",
        type: "recurring",
        fields: [
          { key: "year", label: "Ano", type: "number", min: 1900, max: 2100 },
          { key: "where", label: "Onde foi?", type: "text" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          video: { max: 1, maxSeconds: 30 },
        },
      },
      {
        id: "galeria-arte",
        templateKey: "capitulo_4_galeria_arte",
        title: "Galeria de Arte",
        prompt: "Título/descrição do desenho e a história por trás.",
        type: "recurring",
        badges: ["Upsell • Creative"],
        fields: [
          { key: "art_title", label: "Título", type: "text" },
          { key: "art_description", label: "Descrição", type: "textarea" },
        ],
        media: {
          photos: { min: 3, max: 3 },
          notes: ["Sem vídeo."],
        },
      },
    ],
  },
];

// Mapeia template_keys antigos para o novo catálogo (para não “perder” contexto em cards).
const TEMPLATE_KEY_ALIASES: Record<string, string> = {
  capitulo_5_primeiro_natal: "capitulo_5_datas_especiais",
  capitulo_5_primeira_pascoa: "capitulo_5_datas_especiais",
  capitulo_5_primeiro_dia_das_maes_pais: "capitulo_5_datas_especiais",
};

export const normalizeTemplateKey = (templateKey?: string | null) => {
  if (!templateKey) return null;
  return TEMPLATE_KEY_ALIASES[templateKey] ?? templateKey;
};

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
  const normalized = normalizeTemplateKey(templateKey);
  if (!normalized) return undefined;
  return GUIDED_MOMENT_SEQUENCE.find((item) => item.templateKey === normalized);
};

export const TOTAL_GUIDED_MOMENTS = GUIDED_MOMENT_SEQUENCE.length;
