export interface IncidentSummary {
  id: string
  titulo: string
  estado: string
  prioridad: string
  fechaNotificacion: string
}

export interface IncidentNotification extends IncidentSummary {
  notificacionId: string
}

export interface PersistedNotification {
  id: string
  incidenciaId: string
  creadaEn: string
  leidaEn: string | null
  leida: boolean
  incidencia: IncidentSummary
}

export interface NotificationsMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  noLeidas: number
}

export type NotificationConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
