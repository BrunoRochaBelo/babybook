import {
  Child,
  GuestbookEntry,
  HealthMeasurement,
  HealthVaccine,
  Moment,
  UserProfile,
} from "@babybook/contracts";

type MediaKind = "photo" | "video" | "audio";

type VariantSeed = {
  preset: string;
  url?: string | null;
  key?: string | null;
  sizeBytes?: number | null;
  widthPx?: number | null;
  heightPx?: number | null;
  kind?: MediaKind;
};

type MediaSeed = {
  id: string;
  kind: MediaKind;
  url?: string | null;
  key?: string | null;
  variants?: VariantSeed[];
  durationSeconds?: number;
};

type MomentSeed = {
  id: string;
  childId: string;
  title: string;
  summary: string;
  occurredAt?: string | null;
  templateKey?: string | null;
  status?: Moment["status"];
  privacy?: Moment["privacy"];
  media?: MediaSeed[];
  payload?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

const at = (date: string, time = "10:00:00") => `${date}T${time}Z`;

const makeMoment = ({
  id,
  childId,
  title,
  summary,
  occurredAt = null,
  templateKey = null,
  status = "draft",
  privacy = "private",
  media = [],
  payload,
  createdAt,
  updatedAt,
  publishedAt,
}: MomentSeed): Moment => ({
  id,
  childId,
  title,
  summary,
  occurredAt,
  templateKey,
  status,
  privacy,
  payload: payload ?? {},
  media: media.map((item) => ({
    id: item.id,
    kind: item.kind,
    url: item.url ?? null,
    key: item.key ?? null,
    durationSeconds: item.durationSeconds ?? undefined,
    variants: item.variants?.map((variant) => ({
      preset: variant.preset,
      url: variant.url ?? null,
      key: variant.key ?? null,
      sizeBytes: variant.sizeBytes ?? null,
      widthPx: variant.widthPx ?? null,
      heightPx: variant.heightPx ?? null,
      kind: (variant.kind ?? item.kind) as MediaKind,
    })),
  })),
  rev: 1,
  createdAt: createdAt ?? at("2024-01-01"),
  updatedAt: updatedAt ?? createdAt ?? at("2024-01-01", "12:00:00"),
  publishedAt:
    status === "published" ? (publishedAt ?? updatedAt ?? null) : null,
});

export const mockChild: Child = {
  id: "child-1",
  name: "Alice",
  birthday: "2024-03-15",
  avatarUrl:
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=240&h=240&fit=crop",
  createdAt: "2024-03-15T00:00:00Z",
  updatedAt: "2024-05-01T00:00:00Z",
};

export const mockChildren: Child[] = [
  mockChild,
  {
    id: "child-2",
    name: "Theo",
    birthday: "2023-06-20",
    avatarUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=240&h=240&fit=crop",
    createdAt: "2023-06-20T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
  },
];

export const mockMoments: Moment[] = [
  makeMoment({
    id: "bb-alice-00",
    childId: "child-1",
    title: "A Descoberta",
    summary: "Chegada da Alice e o primeiro colo ainda na sala de parto.",
    occurredAt: "2024-03-15",
    templateKey: "capitulo_1_descoberta",
    status: "published",
    payload: {
      chapter: "Cap. 1 - Bem-vindo ao mundo",
      milestone: "Parto humanizado",
    },
    media: [
      {
        id: "bb-alice-newborn",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&fit=crop",
        key: "media/mock/bb-alice-newborn/original.jpg",
        variants: [
          {
            preset: "thumb",
            url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=300&fit=crop",
          },
          {
            preset: "full",
            url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&fit=crop",
          },
        ],
      },
    ],
    createdAt: at("2024-03-15", "08:10:00"),
    updatedAt: at("2024-03-16", "07:55:00"),
    publishedAt: at("2024-03-16", "07:55:00"),
  }),
  makeMoment({
    id: "bb-alice-01",
    childId: "child-1",
    title: "Primeira Noite em Casa",
    summary: "Montamos nosso ninho e registramos o quartinho novo.",
    occurredAt: "2024-03-18",
    templateKey: "capitulo_2_primeira_noite",
    status: "published",
    payload: {
      chapter: "Cap. 2 - Nosso Novo Lar",
      checklist: ["Luzes âmbar", "Som de chuva"],
    },
    media: [
      {
        id: "bb-alice-room",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1500534314210-9ea7b04b9ccd?w=900&fit=crop",
      },
    ],
    createdAt: at("2024-03-18", "21:00:00"),
    updatedAt: at("2024-03-19", "09:12:00"),
    publishedAt: at("2024-03-19", "09:12:00"),
  }),
  makeMoment({
    id: "bb-alice-02",
    childId: "child-1",
    title: "Primeiro Banho em Casa",
    summary: "Suporte da vovó para deixar o banho mais leve.",
    occurredAt: "2024-03-20",
    templateKey: "capitulo_2_primeiro_banho",
    status: "published",
    media: [
      {
        id: "bb-alice-bath",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=900&fit=crop",
      },
    ],
    payload: {
      chapter: "Cap. 2 - Nosso Novo Lar",
      careTips: ["Água a 36º", "Manta aquecida"],
    },
    createdAt: at("2024-03-21", "10:15:00"),
    updatedAt: at("2024-03-21", "10:15:00"),
    publishedAt: at("2024-03-21", "10:15:00"),
  }),
  makeMoment({
    id: "bb-alice-03",
    childId: "child-1",
    title: "Primeiro Sorriso Social",
    summary: 'Alice respondeu ao nosso "gugu-dadá" com a maior expressão.',
    occurredAt: "2024-04-25",
    templateKey: "capitulo_3_primeiro_sorriso",
    status: "draft",
    media: [
      {
        id: "bb-alice-smile",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&fit=crop",
      },
    ],
    payload: {
      chapter: "Cap. 3 - Primeiras descobertas",
      milestone: "Interação social",
    },
    createdAt: at("2024-04-26", "08:00:00"),
  }),
  makeMoment({
    id: "bb-alice-04",
    childId: "child-1",
    title: "Primeiro Rolamento",
    summary: "Registramos o treino na manta Montessori.",
    occurredAt: "2024-05-30",
    templateKey: "capitulo_3_primeiro_rolamento",
    status: "draft",
    media: [
      {
        id: "bb-alice-roll",
        kind: "video",
        url: "https://videos.pexels.com/video-files/4149834/4149834-uhd_2560_1440_24fps.mp4",
        durationSeconds: 14,
      },
    ],
    payload: {
      chapter: "Cap. 3 - Primeiras descobertas",
      milestone: "Coordenação motora grossa",
    },
    createdAt: at("2024-05-30", "19:00:00"),
  }),
  makeMoment({
    id: "bb-alice-05",
    childId: "child-1",
    title: "Primeiro Dente",
    summary: "Dois incisivos inferiores apareceram de um dia para o outro.",
    occurredAt: "2024-08-25",
    templateKey: "capitulo_3_primeiro_dente",
    status: "published",
    privacy: "people",
    media: [
      {
        id: "bb-alice-tooth",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1470167290877-7d5d3446de4c?w=900&fit=crop",
      },
    ],
    payload: {
      chapter: "Cap. 3 - Primeiras descobertas",
      milestone: "Dentição",
    },
    createdAt: at("2024-08-25", "17:45:00"),
    updatedAt: at("2024-08-26", "09:00:00"),
    publishedAt: at("2024-08-26", "09:00:00"),
  }),
  makeMoment({
    id: "bb-alice-06",
    childId: "child-1",
    title: "Visita Especial - Avós",
    summary: "Segunda visita da vovó e vô para reforçar o vínculo.",
    occurredAt: "2024-09-05",
    templateKey: "capitulo_4_visita_especial",
    status: "published",
    media: [
      {
        id: "bb-alice-grandparents",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&fit=crop",
      },
    ],
    payload: {
      chapter: "Cap. 4 - Vila reunida",
      recurrenceSlot: 2,
      upsellCategory: "social",
    },
    createdAt: at("2024-09-05", "18:30:00"),
    publishedAt: at("2024-09-06", "07:45:00"),
  }),
  makeMoment({
    id: "bb-alice-07",
    childId: "child-1",
    title: "Galeria de Arte - Semana 20",
    summary: "Primeiras pinturas com tinta comestível.",
    occurredAt: "2024-10-10",
    templateKey: "capitulo_4_galeria_arte",
    status: "published",
    media: [
      {
        id: "bb-alice-art-1",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1498079022511-d15614cb1c02?w=900&fit=crop",
      },
      {
        id: "bb-alice-art-2",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&fit=crop",
      },
    ],
    payload: {
      upsellCategory: "creative",
      chapter: "Cap. 4 - Vila reunida",
    },
    createdAt: at("2024-10-11", "11:00:00"),
    publishedAt: at("2024-10-11", "11:00:00"),
  }),
  makeMoment({
    id: "bb-alice-08",
    childId: "child-1",
    title: "Primeiros Passos",
    summary: "Alice deu três passinhos independentes em direção ao pai.",
    occurredAt: null,
    templateKey: "capitulo_3_primeiros_passos",
    status: "draft",
    payload: {
      chapter: "Cap. 3 - Primeiras descobertas",
      milestone: "Marcha independente",
    },
  }),
  makeMoment({
    id: "bb-alice-09",
    childId: "child-1",
    title: "Primeiro Aniversário",
    summary: "Rascunho com ideias de decoração e carta para o PoD.",
    occurredAt: null,
    templateKey: "capitulo_5_primeiro_aniversario",
    status: "draft",
    payload: {
      chapter: "Cap. 5 - Grandes celebrações",
      todo: ["Selecionar fotos favoritas", "Convidar padrinhos"],
    },
  }),
  // Theo (segundo filho) - dados para comparar capítulos
  makeMoment({
    id: "bb-theo-00",
    childId: "child-2",
    title: "A Descoberta",
    summary: "Parto em casa, luz baixa e playlist Lo-Fi.",
    occurredAt: "2023-06-20",
    templateKey: "capitulo_1_descoberta",
    status: "published",
    payload: {
      chapter: "Cap. 1 - Bem-vindo ao mundo",
    },
    media: [
      {
        id: "bb-theo-newborn",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&fit=crop",
      },
    ],
    createdAt: at("2023-06-21"),
    updatedAt: at("2023-06-21", "08:30:00"),
    publishedAt: at("2023-06-21", "08:30:00"),
  }),
  makeMoment({
    id: "bb-theo-01",
    childId: "child-2",
    title: "Primeiro Banho do Theo",
    summary: "Theo dormiu o banho inteiro dentro do balde ofurô.",
    occurredAt: "2023-06-23",
    templateKey: "capitulo_2_primeiro_banho",
    status: "published",
    payload: {
      chapter: "Cap. 2 - Nosso Novo Lar",
    },
    media: [
      {
        id: "bb-theo-bath",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=900&fit=crop",
      },
    ],
    createdAt: at("2023-06-23", "20:05:00"),
    updatedAt: at("2023-06-24", "08:00:00"),
    publishedAt: at("2023-06-24", "08:00:00"),
  }),
  makeMoment({
    id: "bb-theo-02",
    childId: "child-2",
    title: "Primeiro Dia na Creche",
    summary: "Registro da adaptação gradual no capítulo 5.5.",
    occurredAt: "2024-02-05",
    templateKey: "capitulo_5_primeiro_dia_creche",
    status: "published",
    media: [
      {
        id: "bb-theo-school",
        kind: "photo",
        url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&fit=crop",
      },
    ],
    payload: {
      chapter: "Cap. 5 - Grandes celebrações",
      checklist: ["Etiqueta com nome", "Naninha"],
    },
    createdAt: at("2024-02-05", "07:30:00"),
    updatedAt: at("2024-02-05", "21:00:00"),
    publishedAt: at("2024-02-05", "21:00:00"),
  }),
  makeMoment({
    id: "bb-theo-03",
    childId: "child-2",
    title: "Consulta de Crescimento - 12 Meses",
    summary: "Gráfico de peso/altura anexado ao capítulo de saúde.",
    occurredAt: "2024-06-25",
    templateKey: "capitulo_4_consulta_pediatra",
    status: "draft",
    payload: {
      chapter: "Cap. 4 - Vila reunida",
      clinicalNotes: "Revisar ferro sérico em 3 meses.",
    },
  }),
];

export const mockGuestbookEntries: GuestbookEntry[] = [
  {
    id: "guestbook-1",
    childId: "child-1",
    authorName: "Vovó Maria",
    authorEmail: "maria@example.com",
    message:
      "Que menina lindinha! Estamos orgulhosos de vocês. A casa está cheia de amor!",
    status: "approved",
    createdAt: "2024-03-20T08:00:00Z",
  },
  {
    id: "guestbook-2",
    childId: "child-1",
    authorName: "Tio João",
    authorEmail: null,
    message:
      "Parabéns aos pais! Já reservei um sábado para fazer pizza para vocês descansarem.",
    status: "approved",
    createdAt: "2024-03-22T15:30:00Z",
  },
  {
    id: "guestbook-3",
    childId: "child-1",
    authorName: "Prima Ana",
    authorEmail: null,
    message:
      "Quero ser a responsável pelo capítulo de 'Galeria de Arte'! Posso?",
    status: "pending",
    createdAt: "2024-11-10T10:15:00Z",
  },
  {
    id: "guestbook-4",
    childId: "child-2",
    authorName: "Dinda Carol",
    authorEmail: "carol@example.com",
    message:
      "Theo, já temos data para o seu piquenique de 2 anos. Contagem regressiva!",
    status: "approved",
    createdAt: "2024-04-01T12:00:00Z",
  },
];

export const mockHealthMeasurements: HealthMeasurement[] = [
  {
    id: "alice-health-1",
    childId: "child-1",
    date: "2024-03-15",
    weight: 3.2,
    height: 48,
  },
  {
    id: "alice-health-2",
    childId: "child-1",
    date: "2024-04-15",
    weight: 4.1,
    height: 51,
  },
  {
    id: "alice-health-3",
    childId: "child-1",
    date: "2024-06-15",
    weight: 5.8,
    height: 56,
  },
  {
    id: "alice-health-4",
    childId: "child-1",
    date: "2024-08-15",
    weight: 7.2,
    height: 61,
  },
  {
    id: "theo-health-1",
    childId: "child-2",
    date: "2023-06-20",
    weight: 3.5,
    height: 49,
  },
  {
    id: "theo-health-2",
    childId: "child-2",
    date: "2023-12-20",
    weight: 7.9,
    height: 68,
  },
  {
    id: "theo-health-3",
    childId: "child-2",
    date: "2024-06-20",
    weight: 10.8,
    height: 78,
  },
];

export const mockHealthVaccines: HealthVaccine[] = [
  {
    id: "vax-1",
    childId: "child-1",
    name: "BCG",
    dueDate: "2024-03-20",
    appliedAt: "2024-03-20",
    status: "completed",
    notes: "Aplicada na maternidade",
  },
  {
    id: "vax-2",
    childId: "child-1",
    name: "Hepatite B (2ª dose)",
    dueDate: "2024-04-15",
    appliedAt: "2024-04-18",
    status: "completed",
    notes: null,
  },
  {
    id: "vax-3",
    childId: "child-1",
    name: "Penta (DTP/Hib/HB)",
    dueDate: "2024-06-15",
    appliedAt: null,
    status: "scheduled",
    notes: null,
  },
  {
    id: "vax-4",
    childId: "child-1",
    name: "Rotavírus",
    dueDate: "2024-06-15",
    appliedAt: null,
    status: "scheduled",
    notes: null,
  },
  {
    id: "vax-5",
    childId: "child-2",
    name: "Tríplice Viral",
    dueDate: "2024-07-20",
    appliedAt: "2024-07-22",
    status: "completed",
    notes: "Sem reações.",
  },
  {
    id: "vax-6",
    childId: "child-2",
    name: "Meningocócica ACWY",
    dueDate: "2024-08-01",
    appliedAt: null,
    status: "overdue",
    notes: "Reagendar consulta.",
  },
];

export const mockUser: UserProfile = {
  id: "c2e9a7c8-7d0a-4d38-8ba1-5f5a0f28c9ef",
  email: "bruno@example.com",
  name: "Bruno",
  locale: "pt-BR",
  role: "owner",
  hasPurchased: false,
  onboardingCompleted: true,
};

// =============================================================================
// Partner Portal Mock Data
// =============================================================================

export const mockPartnerUser: UserProfile = {
  id: "p1e9a7c8-7d0a-4d38-8ba1-5f5a0f28c9ef",
  email: "pro@babybook.dev",
  name: "Maria Fotógrafa",
  locale: "pt-BR",
  role: "photographer",
  hasPurchased: true,
  onboardingCompleted: true,
};

export interface MockPartner {
  id: string;
  name: string;
  email: string;
  studioName: string | null;
  phone: string | null;
  logoUrl: string | null;
  voucherBalance: number;
  status: "pending_approval" | "active" | "inactive" | "suspended";
  createdAt: string;
}

export interface MockDelivery {
  id: string;
  partnerId: string;
  title: string;
  clientName: string | null;
  targetEmail?: string | null;
  directImport?: boolean;
  description: string | null;
  eventDate: string | null;
  status: "draft" | "pending_upload" | "ready" | "completed";
  assetsCount: number;
  voucherCode: string | null;
  creditStatus?: "reserved" | "consumed" | "refunded" | "not_required" | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const mockPartner: MockPartner = {
  id: "partner-demo-001",
  name: "Maria Fotógrafa",
  email: "pro@babybook.dev",
  studioName: "Estúdio Demo",
  phone: "(11) 99999-9999",
  logoUrl: null,
  voucherBalance: 5,
  status: "active",
  createdAt: "2024-01-15T10:00:00Z",
};

export const mockDeliveries: MockDelivery[] = [
  {
    id: "delivery-direct-001",
    partnerId: "partner-demo-001",
    title: "Ensaio - Bruno (Importação Direta)",
    clientName: "Bruno",
    targetEmail: "bruno@example.com",
    directImport: true,
    description: "Entrega de fotos via importação direta (sem voucher).",
    eventDate: "2024-12-15",
    status: "ready",
    assetsCount: 8,
    voucherCode: null,
    creditStatus: "not_required",
    createdAt: "2024-12-15T14:00:00Z",
    updatedAt: "2024-12-15T16:30:00Z",
  },
  {
    id: "delivery-001",
    partnerId: "partner-demo-001",
    title: "Ensaio Newborn - Sofia",
    clientName: "Ana Silva",
    description: "Ensaio newborn da pequena Sofia, 10 dias de vida.",
    eventDate: "2024-12-10",
    status: "ready",
    assetsCount: 15,
    voucherCode: "BB-SOFIA-2024",
    creditStatus: "reserved",
    createdAt: "2024-12-10T14:00:00Z",
    updatedAt: "2024-12-10T16:30:00Z",
  },
  {
    id: "delivery-002",
    partnerId: "partner-demo-001",
    title: "Smash the Cake - Miguel",
    clientName: "Carla Santos",
    description: "Smash the Cake de 1 aninho do Miguel.",
    eventDate: "2024-12-08",
    status: "completed",
    assetsCount: 25,
    voucherCode: "BB-MIGUEL-2024",
    creditStatus: "consumed",
    createdAt: "2024-12-08T10:00:00Z",
    updatedAt: "2024-12-09T11:00:00Z",
  },
  {
    id: "delivery-003",
    partnerId: "partner-demo-001",
    title: "Ensaio Gestante - Julia",
    clientName: "Julia Mendes",
    description: null,
    eventDate: "2024-12-12",
    status: "pending_upload",
    assetsCount: 0,
    voucherCode: null,
    creditStatus: null,
    archivedAt: "2024-12-13T10:00:00Z",
    createdAt: "2024-12-12T09:00:00Z",
    updatedAt: "2024-12-12T09:00:00Z",
  },
];
