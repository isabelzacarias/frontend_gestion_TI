export interface Credential {
  id: number
  nombre: string | null
  tipo: string | null
  usuario: string | null
  comentario: string | null
  activo: boolean
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

export interface ParametrosListadoSecretos {
  page?: number
  limit?: number
  activo?: boolean
  tipo?: string
  q?: string
}

export interface DatosCreacionSecreto {
  nombre: string | null
  tipo: string | null
  usuario: string | null
  password: string
  comentario: string | null
}

export interface DatosEdicionSecreto {
  nombre?: string | null
  tipo?: string | null
  usuario?: string | null
  password?: string
  comentario?: string | null
  activo?: true
}

export interface CredentialDraft extends Record<string, unknown> {
  nombre: string
  tipo: string
  usuario: string
  password: string
  comentario: string
}
