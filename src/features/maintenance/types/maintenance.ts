export type MaintenanceType = "PREVENTIVO" | "CORRECTIVO"
export type MaintenanceStatus =
  | "PROGRAMADO"
  | "EN_PROCESO"
  | "COMPLETADO"
  | "CANCELADO"
export type MaintenancePriority = "BAJA" | "MEDIA" | "ALTA"

export interface MaintenanceActivo {
  id: number
  cb23: string | null
  tipo: string
}

export interface MaintenanceTecnico {
  id: string
  nombre: string
  email: string | null
}

export interface MaintenanceOrder {
  id: number
  folio: string
  activoId: number
  activo: MaintenanceActivo
  tipo: MaintenanceType
  estado: MaintenanceStatus
  prioridad: MaintenancePriority
  tecnicoId: string
  tecnico: MaintenanceTecnico
  fechaProgramada: string
  fechaRealizada: string | null
  costo: number | null
  descripcion: string | null
  evidencias: unknown | null
  createdAt: string
  updatedAt: string
}

export interface MaintenanceFormDraft extends Record<string, unknown> {
  activoId: string
  tipo: string
  prioridad: string
  tecnicoId: string
  fechaProgramada: string
  fechaRealizada: string
  costo: string
  descripcion: string
}

export interface DatosCreacionMantenimiento {
  activoId: number
  tipo: MaintenanceType
  prioridad: MaintenancePriority
  tecnicoId: string
  fechaProgramada: string
  fechaRealizada: string | null
  costo: number | null
  descripcion: string | null
}

export interface DatosEdicionMantenimiento
  extends Partial<DatosCreacionMantenimiento> {
  estado?: MaintenanceStatus
}

export interface MaintenanceSocketEvent {
  id: number
  folio: string
  activoId: number
  estado: MaintenanceStatus
  tipo: MaintenanceType
  prioridad: MaintenancePriority
  tecnicoId: string
  fechaProgramada: string
  estadoAnterior?: MaintenanceStatus
}

export interface MaintenanceDeletedEvent {
  id: number
  folio: string
  activoId: number
}
