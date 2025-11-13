/**
 * Application-wide constants
 */

export const APP_NAME = "Cofre de Memórias Digital";
export const APP_DESCRIPTION = "Um santuário digital para guardar as memórias mais preciosas do seu bebê";

export const PRICING = {
  LIFETIME_ACCESS: 199.00,
  STORAGE_YEARS: 5,
  CURRENCY: 'BRL'
} as const;

export const CHAPTERS = {
  'great-day': {
    id: 'great-day',
    title: 'O Grande Dia',
    description: 'Nascimento e primeiras horas'
  },
  'first-month': {
    id: 'first-month',
    title: 'Primeiro Mês',
    description: 'Adaptação e descobertas iniciais'
  },
  'milestones': {
    id: 'milestones',
    title: 'Marcos de Desenvolvimento',
    description: 'Sorrisos, rolamentos, sentar...'
  },
  'first-times': {
    id: 'first-times',
    title: 'Primeiras Vezes',
    description: 'Palavra, passo, comida sólida...'
  },
  'celebrations': {
    id: 'celebrations',
    title: 'Celebrações',
    description: 'Aniversários e datas especiais'
  },
  'adventures': {
    id: 'adventures',
    title: 'Aventuras',
    description: 'Passeios, viagens e experiências'
  }
} as const;

export const MOMENTS = {
  'birth-moment': 'O momento do nascimento',
  'first-photo': 'Primeira foto',
  'first-cry': 'Primeiro choro',
  'skin-to-skin': 'Primeiro contato pele a pele',
  'first-bath': 'Primeiro banho',
  'going-home': 'Chegada em casa',
  'visitors': 'Primeiras visitas',
  'feeding': 'Primeira mamada'
} as const;

export const MEDIA_LIMITS = {
  VIDEO_MAX_DURATION: 300, // 5 minutes in seconds
  AUDIO_MAX_DURATION: 180, // 3 minutes in seconds
  PHOTO_MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
} as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  MOMENTS: '/api/moments',
  CHAPTERS: '/api/chapters',
  HEALTH: '/api/health',
  GUESTBOOK: '/api/guestbook',
  UPLOAD: '/api/upload'
} as const;
