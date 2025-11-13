// Tipos comuns da aplicação
export interface Child {
  id: string
  name: string
  birthDate: string
  photo?: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface Moment {
  id: string
  childId: string
  title: string
  description?: string
  date: string
  templateId?: string
  isTemplate: boolean
  media: MomentMedia[]
  createdAt: string
  updatedAt: string
}

export interface MomentMedia {
  id: string
  type: 'image' | 'video' | 'audio'
  url: string
  duration?: number
}

export interface Guardian {
  id: string
  email: string
  name?: string
  role: 'owner' | 'guardian'
  invitedAt: string
  acceptedAt?: string
}

export interface GuestbookEntry {
  id: string
  childId: string
  name: string
  message: string
  media?: MomentMedia
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface TimeCapsule {
  id: string
  childId: string
  letter: string
  openDate: string
  media?: MomentMedia[]
  isSealed: boolean
  sealedAt?: string
  createdAt: string
}

export interface HealthMeasurement {
  id: string
  childId: string
  date: string
  weight?: number
  height?: number
}

export interface HealthVisit {
  id: string
  childId: string
  date: string
  reason: string
  notes?: string
  receiptPhoto?: string
}

export interface VaultDocument {
  id: string
  childId: string
  type: 'birth_certificate' | 'cpf' | 'health_card'
  document: MomentMedia
  uploadedAt: string
}

export interface PoD {
  id: string
  childId: string
  status: 'draft' | 'pending' | 'processing' | 'ready' | 'shipped'
  momentIds: string[]
  includeGuestbook: boolean
  previewUrl?: string
  trackingUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Share {
  id: string
  momentId: string
  token: string
  type: 'public' | 'guardian'
  expiresAt?: string
  password?: string
  createdAt: string
}

export type Template = 
  | 'descoberta'
  | 'primeiro-sorriso'
  | 'primeira-gargalhada'
  | 'primeiro-dente'
  | 'primeiro-dia-escola'
  | 'primeira-comida'
  | 'meses-passados'

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
