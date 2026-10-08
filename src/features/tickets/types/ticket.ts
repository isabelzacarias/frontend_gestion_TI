export interface Solicitante {
  id: string
  nombre: string
  email: string
}

export interface AsignadoA {
  id: string
  nombre: string
  email: string
}

export type TicketEstado =
  | "NUEVO"
  | "EN_PROCESO"
  | "RESUELTO"
  | "CERRADO"
  | "CANCELADO"

export type TicketPrioridad = "BAJA" | "NORMAL" | "ALTA" | "URGENTE"

export type TipoRequerimiento =
  | "OTROS"
  | "HARDWARE"
  | "SOFTWARE"
  | "REDES"
  | "ACCESOS"
  | "MANTENIMIENTO"

export interface Ticket {
  id: number
  originalId: string | number | null
  titulo: string
  estado: TicketEstado
  prioridad: TicketPrioridad
  tipoRequerimiento: TipoRequerimiento
  fechaNotificacion: string
  fechaResolucion: string | null
  solicitante: Solicitante
  asignadoA: AsignadoA | null
  departamento: string | null
}
