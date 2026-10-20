import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { MetadatosPaginacion } from "@/types/activo"
import type {
  AuditoriaGlobal,
  ParametrosListadoAuditoria,
} from "@/features/audit/types/audit"

export class AuditoriaApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "AuditoriaApiError"
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

function toAuditoriaApiError(error: unknown): AuditoriaApiError {
  if (error instanceof AuditoriaApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new AuditoriaApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new AuditoriaApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new AuditoriaApiError(error.message, [])
  }

  return new AuditoriaApiError("No se pudo completar la solicitud.", [])
}

interface RespuestaPaginadaAuditoria {
  success: boolean
  message: string
  errors: unknown[]
  data: AuditoriaGlobal[]
  meta: MetadatosPaginacion
}

export interface ListadoAuditoria {
  eventos: AuditoriaGlobal[]
  meta: MetadatosPaginacion
}

export async function listarAuditoriaGlobal(
  parametros: ParametrosListadoAuditoria = {},
): Promise<ListadoAuditoria> {
  try {
    const response = await api.get<RespuestaPaginadaAuditoria>("/auditoria", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new AuditoriaApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { eventos: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toAuditoriaApiError(error)
  }
}

export async function listarTodosLosEventosAuditoria(): Promise<
  AuditoriaGlobal[]
> {
  const primera = await listarAuditoriaGlobal({ page: 1, limit: 100 })
  const eventos = [...primera.eventos]
  const totalPaginas = Math.min(primera.meta.totalPages, 100)

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarAuditoriaGlobal({ page, limit: 100 })
    eventos.push(...siguiente.eventos)
  }

  return eventos
}

export async function obtenerAuditoria(id: number): Promise<AuditoriaGlobal> {
  try {
    const response = await api.get<RespuestaApi<AuditoriaGlobal>>(
      `/auditoria/${id}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new AuditoriaApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toAuditoriaApiError(error)
  }
}
