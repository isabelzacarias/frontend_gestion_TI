export type Sucursal = "AMBOS" | "CANCUN" | "PLAYA"

export interface DashboardKPIs {
  ticketsPendientes: number
  totalActivos: number
  equiposAsignados: number
}

export interface ActivoPorTipo {
  tipo: string
  total: number
}

export interface UsuarioAsignadoLicencia {
  id: string
  nombre: string
  email: string
}

export interface LicenciaPorVencer {
  id: number
  software: string
  proveedor: string
  fechaVencimiento: string
  asignadaA?: UsuarioAsignadoLicencia | null
}

export interface RecordatorioItem {
  id?: number | string
  titulo: string
  descripcion?: string
  fecha?: string
  completado?: boolean
  prioridad?: "ALTA" | "MEDIA" | "BAJA"
}

export interface DashboardData {
  kpis: DashboardKPIs
  activosPorTipo: ActivoPorTipo[]
  licenciasPorVencer: LicenciaPorVencer[]
  recordatorios: RecordatorioItem[]
}

export interface DashboardSummaryApiResponse {
  success: boolean
  message: string
  errors?: unknown[]
  data: DashboardData
}
