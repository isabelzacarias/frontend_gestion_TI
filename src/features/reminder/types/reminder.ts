export type PrioridadRecordatorio = "BAJA" | "MEDIA" | "ALTA"

export interface Recordatorio {
  id: number
  titulo: string
  descripcion: string | null
  fecha: string | null
  prioridad: PrioridadRecordatorio
  completado: boolean
  completadoEn: string | null
  createdAt: string
  updatedAt: string
}

export interface RecordatorioDashboard {
  id: number
  titulo: string
  fecha: string
  prioridad: PrioridadRecordatorio
}

export interface RecordatorioFormDraft extends Record<string, unknown> {
  titulo: string
  descripcion: string
  fecha: string
  prioridad: string
}

export interface ParametrosListadoRecordatorios {
  page?: number
  limit?: number
  q?: string
  completado?: boolean
  prioridad?: PrioridadRecordatorio
  desde?: string
  hasta?: string
  sinFecha?: boolean
}

export interface DatosCreacionRecordatorio {
  titulo: string
  descripcion: string | null
  fecha: string | null
  prioridad: PrioridadRecordatorio
}

export interface DatosEdicionRecordatorio {
  titulo?: string
  descripcion?: string | null
  fecha?: string | null
  prioridad?: PrioridadRecordatorio
}
