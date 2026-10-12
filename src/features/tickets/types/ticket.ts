export type TicketEstado =
  | "NUEVO"
  | "EN_ANALISIS"
  | "EN_CURSO"
  | "COMPLETADO"
  | "DUPLICADO"

export type TicketPrioridad = "BAJA" | "NORMAL" | "ALTA" | "CRITICA"

export type TipoRequerimiento =
  | "NETSUITE"
  | "OTROS"
  | "OFFICE"
  | "EMAIL"
  | "IMPRESION"
  | "ERROR_EN_EQUIPO"
  | "SOLICITUD_DE_EQUIPO"
  | "INTRANET"
  | "CONEXION_DE_RED"

export interface UsuarioResumen {
  id: string
  nombre: string
  email: string | null
}

export interface DepartamentoResumen {
  id: number
  nombre: string
}

export interface Ticket {
  id: number
  originalId: number | null
  titulo: string
  estado: TicketEstado
  prioridad: TicketPrioridad
  tipoRequerimiento: TipoRequerimiento
  fechaNotificacion: string
  fechaResolucion: string | null
  solicitante: UsuarioResumen
  asignadoA: UsuarioResumen | null
  departamento: DepartamentoResumen | null
  totalActualizaciones: number
}

export interface ActualizacionTicket {
  id: number
  texto: string
  creadaEn: string
}

export interface TicketDetalle extends Ticket {
  descripcion: string
  evidenciaUrl: string | null
  actualizaciones: ActualizacionTicket[]
}

export interface MetadatosPaginacion {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface RespuestaPaginada<T> {
  success: boolean
  message: string
  errors: unknown[]
  data: T[]
  meta: MetadatosPaginacion
}

export interface ParametrosListadoTickets {
  page?: number
  limit?: number
  estado?: TicketEstado
  prioridad?: TicketPrioridad
  tipoRequerimiento?: TipoRequerimiento
  q?: string
}
