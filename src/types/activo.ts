export type EstadoActivo =
  | "EN_USO"
  | "EN_ALMACEN"
  | "EN_MANTENIMIENTO"
  | "DE_BAJA"

export interface ActivoImportRow {
  fila: number
  CB23: string
  Tipo: string
  Marca: string
  Modelo: string
  "Número de serie": string
  Sucursal: string
  Estado: string
  "Estado general": string
  Red: string
  "Correo responsable"?: string
}

export interface ErrorPeticion {
  campo: string
  valor: unknown
  [clave: string]: unknown
}

export interface UsuarioResumenActivo {
  id: string
  nombre: string
  email: string | null
}

export interface ActivoResumen {
  id: number
  claveActivo: string | null
  cb23: string | null
  tipo: string
  marca: string | null
  modelo: string | null
  numeroSerie: string | null
  sucursal: string | null
  estado: EstadoActivo
  estadoGeneral: string | null
  nombreRed: string | null
  responsable: UsuarioResumenActivo | null
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
  errors: ErrorPeticion[]
  data: T[]
  meta: MetadatosPaginacion
}

export interface ParametrosListadoActivos {
  page?: number
  limit?: number
  estado?: EstadoActivo
  tipo?: string
  sucursal?: string
  responsableId?: string
  q?: string
}

export interface DatosFilaImportada {
  tipo: string
  cb23: string | null
  marca: string | null
  modelo: string | null
  numeroSerie: string | null
  sucursal: string | null
  estadoGeneral: string | null
  nombreRed: string | null
  estado: EstadoActivo
  responsableId: string | null
}

export interface ResumenValidacionImportacion {
  total: number
  validas: number
  invalidas: number
}

export interface FilaValidacionImportacion {
  fila: number
  valido: boolean
  errores: string[]
  advertencias: string[]
  datos: DatosFilaImportada | null
}

export interface ResultadoValidacionImportacion {
  resumen: ResumenValidacionImportacion
  filas: FilaValidacionImportacion[]
}

export interface ResumenConfirmacionImportacion {
  total: number
  creadas: number
  rechazadas: number
}

export interface FilaConfirmacionImportacion {
  fila: number
  creado: boolean
  activoId: number | null
  errores: string[]
  advertencias: string[]
}

export interface ResultadoConfirmacionImportacion {
  resumen: ResumenConfirmacionImportacion
  filas: FilaConfirmacionImportacion[]
}
