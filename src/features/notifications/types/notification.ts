export interface IncidentSummary {
  id: string
  titulo: string
  estado: string
  prioridad: string
  fechaNotificacion: string
}

export interface LicenseSummary {
  id: string
  software: string
  proveedor: string | null
  fechaVencimiento: string
}

export type NotificationType = "INCIDENCIA_NUEVA" | "LICENCIA_POR_VENCER"

export interface IncidentNotification extends IncidentSummary {
  notificacionId: string
}

export interface LicenseNotification {
  notificacionId: string
  licenciaId: string
  software: string
  fechaVencimiento: string
  diasRestantes: number
  hitoDias: number
  creadaEn: string
}

interface PersistedNotificationBase {
  id: string
  creadaEn: string
  leidaEn: string | null
  leida: boolean
}

export type PersistedNotification =
  | (PersistedNotificationBase & {
      tipo: "INCIDENCIA_NUEVA"
      incidenciaId: string
      licenciaId: null
      hitoDias: null
      incidencia: IncidentSummary
      licencia: null
    })
  | (PersistedNotificationBase & {
      tipo: "LICENCIA_POR_VENCER"
      incidenciaId: null
      licenciaId: string
      hitoDias: number
      incidencia: null
      licencia: LicenseSummary
    })

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
