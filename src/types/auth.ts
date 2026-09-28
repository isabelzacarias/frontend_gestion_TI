export interface UsuarioAuth {
  id: string
  nombre: string
  email: string
}

export interface UsuarioPerfil extends UsuarioAuth {
  activo: boolean
  rol: string | null
}

export interface RespuestaLogin {
  token: string
  tokenTipo: string
  expiraEn: string
  usuario: UsuarioAuth
}

export interface RespuestaApi<T> {
  success: boolean
  message: string
  errors: unknown[]
  data?: T
  meta?: unknown
}
