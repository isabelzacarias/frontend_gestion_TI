import axios from "axios"

import { api } from "@/services/api"
import type { MetadatosPaginacion } from "@/types/activo"
import type { RespuestaApi } from "@/types/auth"

export interface UsuarioLista {
  id: string
  nombre: string
  email: string | null
  activo: boolean
}

export interface ParametrosListadoUsuarios {
  page?: number
  limit?: number
  q?: string
  activo?: boolean
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
