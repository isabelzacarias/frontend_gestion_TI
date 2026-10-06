export interface IncidentNotification {
  id: string
  titulo: string
  estado: string
  prioridad: string
  fechaNotificacion: string
}

export type NotificationConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
