export interface AsignadaA {
  id: string
  nombre: string
  email: string | null
}

export interface License {
  id: number
  software: string
  tieneClave: boolean
  proveedor: string | null
  fechaCompra: string | null
  fechaVencimiento: string
  activa: boolean
  asignadaA: AsignadaA | null
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

export interface ParametrosListadoLicencias {
  page?: number
  limit?: number
  activa?: boolean
  proveedor?: string
  venceDesde?: string
  venceHasta?: string
  q?: string
}

export interface DatosCreacionLicencia {
  software: string
  clave: string | null
  proveedor: string | null
  fechaCompra: string | null
  fechaVencimiento: string
  asignadaAId: string | null
}

export interface DatosEdicionLicencia {
  software?: string
  clave?: string | null
  proveedor?: string | null
  fechaCompra?: string | null
  fechaVencimiento?: string
  asignadaAId?: string | null
  activa?: boolean
}

export interface LicenseFormDraft extends Record<string, unknown> {
  software: string
  clave: string
  proveedor: string
  fechaCompra: string
  fechaVencimiento: string
  asignadaAId: string
  activa: boolean
}
