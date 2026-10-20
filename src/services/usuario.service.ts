import axios from "axios"

import { api } from "@/services/api"
import type { MetadatosPaginacion } from "@/types/activo"
import type { RespuestaApi } from "@/types/auth"

export interface ResumenCatalogo {
  id: number
  nombre: string
}

export interface ResumenRol {
  id: number
  nombre: string
}

export interface UsuarioLista {
  id: string
  nombre: string
  email: string | null
  activo: boolean
  fechaInicio: string | null
  fechaFin: string | null
  departamento: ResumenCatalogo | null
  ubicacion: ResumenCatalogo | null
  puesto: ResumenCatalogo | null
  tipoUsuario: ResumenCatalogo | null
  rol: ResumenRol | null
  /** Permisos concedidos por encima de los del rol. */
  permisosExtra: string[]
  /** Permisos del rol revocados solo para este usuario. */
  permisosRevocados: string[]
}

export interface ParametrosListadoUsuarios {
  page?: number
  limit?: number
  q?: string
  activo?: boolean
}

export interface Catalogos {
  departamentos: ResumenCatalogo[]
  ubicaciones: ResumenCatalogo[]
  puestos: ResumenCatalogo[]
  tiposUsuario: ResumenCatalogo[]
  roles: ResumenRol[]
}

export interface DatosCreacionUsuario {
  id: string
  nombre: string
  email: string | null
  password: string | null
  departamentoId: number | null
  ubicacionId: number | null
  puestoId: number | null
  tipoUsuarioId: number | null
  fechaInicio: string | null
  fechaFin: string | null
}

export interface DatosEdicionUsuario {
  nombre?: string
  email?: string | null
  activo?: boolean
  departamentoId?: number | null
  ubicacionId?: number | null
  puestoId?: number | null
  tipoUsuarioId?: number | null
  fechaInicio?: string | null
  fechaFin?: string | null
}

export interface DatosPermisosUsuario {
  /** Permisos a conceder (se agregan a `permisosExtra` y se quitan de `permisosRevocados`). */
  agregar: string[]
  /** Permisos a revocar (se agregan a `permisosRevocados` y se quitan de `permisosExtra`). */
  quitar: string[]
}

export interface PermisosUsuario {
  id: string
  nombre: string
  permisosExtra: string[]
  permisosRevocados: string[]
}

export class UsuarioApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "UsuarioApiError"
    this.errors = errors
    this.status = status
  }
}

function isApiErrorResponse(value: unknown): value is RespuestaApi<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof value.success === "boolean" &&
    "message" in value &&
    typeof value.message === "string" &&
    "errors" in value &&
    Array.isArray(value.errors)
  )
}

function toUsuarioApiError(error: unknown): UsuarioApiError {
  if (error instanceof UsuarioApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new UsuarioApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new UsuarioApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new UsuarioApiError(error.message, [])
  }

  return new UsuarioApiError("No se pudo completar la solicitud.", [])
}

interface RespuestaPaginadaUsuarios {
  success: boolean
  message: string
  errors: unknown[]
  data: UsuarioLista[]
  meta: MetadatosPaginacion
}

export interface ListadoUsuarios {
  usuarios: UsuarioLista[]
  meta: MetadatosPaginacion
}

export async function listarUsuarios(
  parametros: ParametrosListadoUsuarios = {},
): Promise<ListadoUsuarios> {
  try {
    const response = await api.get<RespuestaPaginadaUsuarios>("/usuarios", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { usuarios: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

const LIMITE_USUARIOS = 100
const MAX_PAGINAS_USUARIOS = 100

export async function listarTodosLosUsuarios(
  filtros: Omit<ParametrosListadoUsuarios, "page" | "limit"> = {},
): Promise<UsuarioLista[]> {
  const primera = await listarUsuarios({
    ...filtros,
    page: 1,
    limit: LIMITE_USUARIOS,
  })

  const usuarios = [...primera.usuarios]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_USUARIOS,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarUsuarios({
      ...filtros,
      page,
      limit: LIMITE_USUARIOS,
    })
    usuarios.push(...siguiente.usuarios)
  }

  return usuarios
}

export async function obtenerCatalogos(): Promise<Catalogos> {
  try {
    const response = await api.get<RespuestaApi<Catalogos>>("/catalogos")

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

export async function crearUsuario(
  datos: DatosCreacionUsuario,
): Promise<UsuarioLista> {
  try {
    const response = await api.post<RespuestaApi<UsuarioLista>>(
      "/usuarios",
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

export async function actualizarUsuario(
  id: string,
  datos: DatosEdicionUsuario,
): Promise<UsuarioLista> {
  try {
    const response = await api.patch<RespuestaApi<UsuarioLista>>(
      `/usuarios/${id}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

export async function asignarRolUsuario(
  id: string,
  rolId: number | null,
): Promise<UsuarioLista> {
  try {
    const response = await api.patch<RespuestaApi<UsuarioLista>>(
      `/usuarios/${id}/rol`,
      { rolId },
    )

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

export async function actualizarPermisosUsuario(
  id: string,
  datos: DatosPermisosUsuario,
): Promise<PermisosUsuario> {
  try {
    const response = await api.patch<RespuestaApi<PermisosUsuario>>(
      `/usuarios/${id}/permisos`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

export async function cambiarPasswordUsuario(
  id: string,
  password: string,
): Promise<UsuarioLista> {
  try {
    const response = await api.patch<RespuestaApi<UsuarioLista>>(
      `/usuarios/${id}/password`,
      { password },
    )

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}

export async function eliminarUsuario(id: string): Promise<UsuarioLista> {
  try {
    const response = await api.delete<RespuestaApi<UsuarioLista>>(
      `/usuarios/${id}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new UsuarioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toUsuarioApiError(error)
  }
}
