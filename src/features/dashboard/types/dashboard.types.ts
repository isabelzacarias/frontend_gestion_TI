import type { RecordatorioDashboard } from "@/features/reminder/types/reminder"

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

export type RecordatorioItem = RecordatorioDashboard

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
