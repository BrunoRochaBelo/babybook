import { Baby, Heart, Star, Sparkles, Cake, Footprints } from "lucide-react";

export interface MomentTemplate {
  id: string;
  title: string;
  description: string;
  isRecurrent: boolean;
  chapterId: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

export const chapters: Chapter[] = [
  {
    id: "great-day",
    title: "O Grande Dia",
    description: "Nascimento e primeiras horas",
    icon: Baby,
    color: "bg-primary/10 text-primary"
  },
  {
    id: "first-month",
    title: "Primeiro Mês",
    description: "Adaptação e descobertas iniciais",
    icon: Heart,
    color: "bg-accent/10 text-accent"
  },
  {
    id: "milestones",
    title: "Marcos de Desenvolvimento",
    description: "Sorrisos, rolamentos, sentar...",
    icon: Star,
    color: "bg-secondary text-secondary-foreground"
  },
  {
    id: "first-times",
    title: "Primeiras Vezes",
    description: "Palavra, passo, comida sólida...",
    icon: Sparkles,
    color: "bg-primary/10 text-primary"
  },
  {
    id: "celebrations",
    title: "Celebrações",
    description: "Aniversários e datas especiais",
    icon: Cake,
    color: "bg-accent/10 text-accent"
  },
  {
    id: "adventures",
    title: "Aventuras",
    description: "Passeios, viagens e experiências",
    icon: Footprints,
    color: "bg-secondary text-secondary-foreground"
  }
];

export const momentTemplates: MomentTemplate[] = [
  // O Grande Dia
  {
    id: "birth-moment",
    title: "O momento do nascimento",
    description: "Data, hora, peso e medida",
    isRecurrent: false,
    chapterId: "great-day"
  },
  {
    id: "first-photo",
    title: "Primeira foto",
    description: "A primeira imagem de vida",
    isRecurrent: false,
    chapterId: "great-day"
  },
  {
    id: "first-cry",
    title: "Primeiro choro",
    description: "Grave o som mais especial",
    isRecurrent: false,
    chapterId: "great-day"
  },
  {
    id: "skin-to-skin",
    title: "Primeiro contato pele a pele",
    description: "O primeiro abraço",
    isRecurrent: false,
    chapterId: "great-day"
  },
  {
    id: "first-bath",
    title: "Primeiro banho",
    description: "O momento da limpeza",
    isRecurrent: false,
    chapterId: "great-day"
  },
  {
    id: "going-home",
    title: "Chegada em casa",
    description: "O primeiro dia no lar",
    isRecurrent: false,
    chapterId: "great-day"
  },
  {
    id: "visitors",
    title: "Primeiras visitas",
    description: "Família e amigos conhecendo",
    isRecurrent: true,
    chapterId: "great-day"
  },
  {
    id: "feeding",
    title: "Primeira mamada",
    description: "O início da nutrição",
    isRecurrent: false,
    chapterId: "great-day"
  },
  
  // Primeiro Mês
  {
    id: "first-smile",
    title: "Primeiro sorriso",
    description: "Aquele momento mágico",
    isRecurrent: false,
    chapterId: "first-month"
  },
  {
    id: "umbilical-cord",
    title: "Queda do cordão umbilical",
    description: "Marco importante da cicatrização",
    isRecurrent: false,
    chapterId: "first-month"
  },
  {
    id: "first-outing",
    title: "Primeiro passeio",
    description: "A primeira saída de casa",
    isRecurrent: false,
    chapterId: "first-month"
  },
  {
    id: "sleep-routine",
    title: "Rotina de sono estabelecida",
    description: "Quando o padrão começou",
    isRecurrent: false,
    chapterId: "first-month"
  },
  {
    id: "weight-gain",
    title: "Ganho de peso",
    description: "Crescimento saudável",
    isRecurrent: true,
    chapterId: "first-month"
  },
  {
    id: "first-doctor",
    title: "Primeira consulta pediátrica",
    description: "Visita ao médico",
    isRecurrent: false,
    chapterId: "first-month"
  },
  
  // Marcos de Desenvolvimento
  {
    id: "head-control",
    title: "Sustenta a cabeça",
    description: "Controle cervical",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "rolling-over",
    title: "Rolar de barriga",
    description: "De costas para barriga e vice-versa",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "sitting",
    title: "Sentar sozinho",
    description: "Sem apoio",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "crawling",
    title: "Engatinhar",
    description: "Primeira locomoção independente",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "standing",
    title: "Ficar em pé",
    description: "Com apoio inicialmente",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "first-steps",
    title: "Primeiros passos",
    description: "Andando sozinho",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "first-word",
    title: "Primeira palavra",
    description: "Comunicação verbal",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "pointing",
    title: "Apontar para objetos",
    description: "Comunicação gestual",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "waving",
    title: "Acenar tchau",
    description: "Interação social",
    isRecurrent: false,
    chapterId: "milestones"
  },
  {
    id: "clapping",
    title: "Bater palmas",
    description: "Coordenação motora",
    isRecurrent: false,
    chapterId: "milestones"
  },
  
  // Primeiras Vezes
  {
    id: "solid-food",
    title: "Primeira comida sólida",
    description: "Introdução alimentar",
    isRecurrent: false,
    chapterId: "first-times"
  },
  {
    id: "first-tooth",
    title: "Primeiro dente",
    description: "Dentição começando",
    isRecurrent: false,
    chapterId: "first-times"
  },
  {
    id: "haircut",
    title: "Primeiro corte de cabelo",
    description: "Visual novo",
    isRecurrent: false,
    chapterId: "first-times"
  },
  {
    id: "swimming",
    title: "Primeira natação",
    description: "Na piscina ou praia",
    isRecurrent: false,
    chapterId: "first-times"
  },
  {
    id: "pet-interaction",
    title: "Primeiro contato com pet",
    description: "Conhecendo animais",
    isRecurrent: false,
    chapterId: "first-times"
  },
  {
    id: "playground",
    title: "Primeiro playground",
    description: "Diversão ao ar livre",
    isRecurrent: false,
    chapterId: "first-times"
  },
  
  // Celebrações
  {
    id: "first-birthday",
    title: "Primeiro aniversário",
    description: "Um ano de vida",
    isRecurrent: false,
    chapterId: "celebrations"
  },
  {
    id: "holidays",
    title: "Datas festivas",
    description: "Natal, Ano Novo, Páscoa...",
    isRecurrent: true,
    chapterId: "celebrations"
  },
  {
    id: "monthly-celebrations",
    title: "Mesversários",
    description: "Celebração mensal",
    isRecurrent: true,
    chapterId: "celebrations"
  },
  {
    id: "family-gatherings",
    title: "Reuniões familiares",
    description: "Encontros especiais",
    isRecurrent: true,
    chapterId: "celebrations"
  },
  
  // Aventuras
  {
    id: "first-trip",
    title: "Primeira viagem",
    description: "Aventura fora de casa",
    isRecurrent: false,
    chapterId: "adventures"
  },
  {
    id: "park-visits",
    title: "Visitas ao parque",
    description: "Explorando a natureza",
    isRecurrent: true,
    chapterId: "adventures"
  },
  {
    id: "zoo-visit",
    title: "Ida ao zoológico",
    description: "Conhecendo animais",
    isRecurrent: false,
    chapterId: "adventures"
  },
  {
    id: "museum-visit",
    title: "Museu ou aquário",
    description: "Experiências educativas",
    isRecurrent: true,
    chapterId: "adventures"
  },
  {
    id: "restaurant",
    title: "Primeira ida ao restaurante",
    description: "Refeição fora de casa",
    isRecurrent: false,
    chapterId: "adventures"
  },
  {
    id: "movie-theater",
    title: "Cinema ou teatro",
    description: "Entretenimento cultural",
    isRecurrent: false,
    chapterId: "adventures"
  }
];

export function getMomentsByChapter(chapterId: string): MomentTemplate[] {
  return momentTemplates.filter(moment => moment.chapterId === chapterId);
}

export function getChapterById(chapterId: string): Chapter | undefined {
  return chapters.find(chapter => chapter.id === chapterId);
}

export function getMomentById(momentId: string): MomentTemplate | undefined {
  return momentTemplates.find(moment => moment.id === momentId);
}
