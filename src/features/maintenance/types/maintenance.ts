export type MaintenanceType = "PREVENTIVO" | "CORRECTIVO"
export type MaintenanceStatus =
  | "PROGRAMADO"
  | "EN_PROCESO"
  | "COMPLETADO"
  | "CANCELADO"
export type MaintenancePriority = "BAJA" | "MEDIA" | "ALTA"

export interface MaintenanceOrder {
  id: number
  folio: string
  activoId: string
  activoLabel: string
  tipo: MaintenanceType
  estado: MaintenanceStatus
  prioridad: MaintenancePriority
  tecnico: string
  fechaProgramada: string
  fechaRealizada: string | null
  costo: number | null
  descripcion: string
}

export interface MaintenanceFormDraft extends Record<string, unknown> {
  activoId: string
  tipo: string
  estado: string
  prioridad: string
  tecnico: string
  fechaProgramada: string
  fechaRealizada: string
  costo: string
  descripcion: string
}
