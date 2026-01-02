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

// IDs fixos (UUID) para manter consistência com os schemas do contracts.
const CHILD_ALICE_ID = "0b1f0d9a-6c4a-4b83-9a77-3f3c0e2e3c11";
const CHILD_THEO_ID = "3a1d0c72-0c2d-4f9b-9ad9-4f2b77b3a0e1";
const PARTNER_DEMO_ID = "6f7d9c2a-2c4c-4f6f-9d4d-3e6b9a4a2f10";

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
  id: CHILD_ALICE_ID,
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
    id: CHILD_THEO_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a04",
    childId: CHILD_ALICE_ID,
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a00",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a05",
    childId: CHILD_ALICE_ID,
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a01",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a06",
    childId: CHILD_ALICE_ID,
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a02",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a07",
    childId: CHILD_ALICE_ID,
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a03",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a08",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a09",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a06",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a07",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a0a",
    childId: CHILD_ALICE_ID,
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
    id: "b6f2d8b2-9f8e-4a40-9e7a-7b1b5d7d2a0b",
    childId: CHILD_ALICE_ID,
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
    id: "c3a1b2f0-1a2b-4c3d-9e0f-1a2b3c4d5e00",
    childId: CHILD_THEO_ID,
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
    id: "c3a1b2f0-1a2b-4c3d-9e0f-1a2b3c4d5e01",
    childId: CHILD_THEO_ID,
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
    id: "c3a1b2f0-1a2b-4c3d-9e0f-1a2b3c4d5e02",
    childId: CHILD_THEO_ID,
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
    id: "c3a1b2f0-1a2b-4c3d-9e0f-1a2b3c4d5e03",
    childId: CHILD_THEO_ID,
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
    id: "d5e0b4a1-3a1b-4c5d-9e0f-4b3a2c1d0e01",
    childId: CHILD_ALICE_ID,
    authorName: "Vovó Maria",
    authorEmail: "maria@example.com",
    message:
      "Que menina lindinha! Estamos orgulhosos de vocês. A casa está cheia de amor!",
    status: "approved",
    createdAt: "2024-03-20T08:00:00Z",
  },
  {
    id: "d5e0b4a1-3a1b-4c5d-9e0f-4b3a2c1d0e02",
    childId: CHILD_ALICE_ID,
    authorName: "Tio João",
    authorEmail: null,
    message:
      "Parabéns aos pais! Já reservei um sábado para fazer pizza para vocês descansarem.",
    status: "approved",
    createdAt: "2024-03-22T15:30:00Z",
  },
  {
    id: "d5e0b4a1-3a1b-4c5d-9e0f-4b3a2c1d0e03",
    childId: CHILD_ALICE_ID,
    authorName: "Prima Ana",
    authorEmail: null,
    message:
      "Quero ser a responsável pelo capítulo de 'Galeria de Arte'! Posso?",
    status: "pending",
    createdAt: "2024-11-10T10:15:00Z",
  },
  {
    id: "d5e0b4a1-3a1b-4c5d-9e0f-4b3a2c1d0e04",
    childId: CHILD_THEO_ID,
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
    id: "e1b2c3d4-1111-4aaa-9bbb-000000000001",
    childId: CHILD_ALICE_ID,
    date: "2024-03-15",
    weight: 3.2,
    height: 48,
  },
  {
    id: "e1b2c3d4-1111-4aaa-9bbb-000000000002",
    childId: CHILD_ALICE_ID,
    date: "2024-04-15",
    weight: 4.1,
    height: 51,
  },
  {
    id: "e1b2c3d4-1111-4aaa-9bbb-000000000003",
    childId: CHILD_ALICE_ID,
    date: "2024-06-15",
    weight: 5.8,
    height: 56,
  },
  {
    id: "e1b2c3d4-1111-4aaa-9bbb-000000000004",
    childId: CHILD_ALICE_ID,
    date: "2024-08-15",
    weight: 7.2,
    height: 61,
  },
  {
    id: "e1b2c3d4-2222-4bbb-9ccc-000000000005",
    childId: CHILD_THEO_ID,
    date: "2023-06-20",
    weight: 3.5,
    height: 49,
  },
  {
    id: "e1b2c3d4-2222-4bbb-9ccc-000000000006",
    childId: CHILD_THEO_ID,
    date: "2023-12-20",
    weight: 7.9,
    height: 68,
  },
  {
    id: "e1b2c3d4-2222-4bbb-9ccc-000000000007",
    childId: CHILD_THEO_ID,
    date: "2024-06-20",
    weight: 10.8,
    height: 78,
  },
];

export const mockHealthVaccines: HealthVaccine[] = [
  {
    id: "f0000000-0000-4aaa-9bbb-000000000001",
    childId: CHILD_ALICE_ID,
    name: "BCG",
    dueDate: "2024-03-20",
    appliedAt: "2024-03-20",
    status: "completed",
    notes: null,
  },
  {
    id: "f0000000-0000-4aaa-9bbb-000000000002",
    childId: CHILD_ALICE_ID,
    name: "Hepatite B (2ª dose)",
    dueDate: "2024-04-15",
    appliedAt: "2024-04-18",
    status: "completed",
    notes: null,
  },
  {
    id: "f0000000-0000-4aaa-9bbb-000000000003",
    childId: CHILD_ALICE_ID,
    name: "Penta (DTP/Hib/HB)",
    dueDate: "2024-06-15",
    appliedAt: null,
    status: "scheduled",
    notes: null,
  },
  {
    id: "f0000000-0000-4aaa-9bbb-000000000004",
    childId: CHILD_ALICE_ID,
    name: "Rotavírus",
    dueDate: "2024-06-15",
    appliedAt: null,
    status: "scheduled",
    notes: null,
  },
  {
    id: "f0000000-0000-4aaa-9bbb-000000000005",
    childId: CHILD_THEO_ID,
    name: "Tríplice Viral",
    dueDate: "2024-07-20",
    appliedAt: "2024-07-22",
    status: "completed",
    notes: null,
  },
  {
    id: "f0000000-0000-4aaa-9bbb-000000000006",
    childId: CHILD_THEO_ID,
    name: "Meningocócica ACWY",
    dueDate: "2024-08-01",
    appliedAt: null,
    status: "overdue",
    notes: null,
  },
];

export const mockUser: UserProfile = {
  id: "c2e9a7c8-7d0a-4d38-8ba1-5f5a0f28c9ef",
  email: "dev@babybook.dev",
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
  id: "a1e9a7c8-7d0a-4d38-8ba1-5f5a0f28c9ef",
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
  targetChildId?: string | null;
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
  id: PARTNER_DEMO_ID,
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
    id: "1a2b3c4d-1111-4aaa-9bbb-000000000001",
    partnerId: PARTNER_DEMO_ID,
    title: "Ensaio - Bruno (Importação Direta)",
    clientName: "Bruno",
    targetEmail: "dev@babybook.dev",
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
    id: "1a2b3c4d-1111-4aaa-9bbb-000000000002",
    partnerId: PARTNER_DEMO_ID,
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
    id: "1a2b3c4d-1111-4aaa-9bbb-000000000003",
    partnerId: PARTNER_DEMO_ID,
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
    id: "1a2b3c4d-1111-4aaa-9bbb-000000000004",
    partnerId: PARTNER_DEMO_ID,
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
