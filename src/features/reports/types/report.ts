export type FormatoReporte = "xlsx" | "csv" | "pdf"

export type EstadoReporteGenerado =
  | "PENDIENTE"
  | "GENERANDO"
  | "COMPLETADO"
  | "FALLIDO"

export type TipoFiltroReporte = "texto" | "enum" | "fecha" | "booleano"

export interface ReporteFiltroDefinicion {
  nombre: string
  tipo: TipoFiltroReporte
  descripcion: string
  opciones?: string[]
}

export interface ReporteMetadata {
  codigo: string
  nombre: string
  descripcion: string
  modulo: string
  formatos: FormatoReporte[]
  permisos: string[]
  filtros: ReporteFiltroDefinicion[]
  maxFilas: number
}

export interface ReporteGeneracion {
  id: number
  codigo: string
  formato: FormatoReporte
  parametros: Record<string, unknown> | null
  estado: EstadoReporteGenerado
  error: string | null
  nombreArchivo: string | null
  tamano: number | null
  creadoEn: string
  iniciadoEn: string | null
  terminadoEn: string | null
}

export interface DescargaGeneracion {
  url: string
  expiraEn: string
}

export interface ListadoGeneraciones {
  generaciones: ReporteGeneracion[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
