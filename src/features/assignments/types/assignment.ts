export interface AssignmentUser {
  id: string
  nombre: string
  email: string | null
}

export type EstadoActivo =
  | "EN_USO"
  | "EN_ALMACEN"
  | "EN_MANTENIMIENTO"
  | "DE_BAJA"

export interface AssignmentAsset {
  id: number
  claveActivo: string | null
  tipo: string
  marca: string | null
  modelo: string | null
  numeroSerie: string | null
  estado: EstadoActivo
}

export interface Assignment {
  id: number
  activa: boolean
  fechaAsignacion: string
  fechaDevolucion: string | null
  anioCompra: number | null
  numeroActivo: string | null
  nombreEquipo: string | null
  observacion: string | null
  usuario: AssignmentUser
  activo: AssignmentAsset
}
