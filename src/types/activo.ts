export type EstadoActivoImport =
  | "EN_USO"
  | "DISPONIBLE"
  | "MANTENIMIENTO"
  | "BAJA"

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
  datos: unknown
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
