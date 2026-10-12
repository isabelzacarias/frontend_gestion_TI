import axios from "axios"

import { api } from "@/services/api"
import type {
  Assignment,
  DatosCreacionAsignacion,
  DatosEdicionAsignacion,
  ParametrosListadoAsignaciones,
} from "@/features/assignments/types/assignment"
import type { MetadatosPaginacion } from "@/types/activo"
import type { RespuestaApi } from "@/types/auth"

export class AsignacionApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "AsignacionApiError"
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

function toAsignacionApiError(error: unknown): AsignacionApiError {
  if (error instanceof AsignacionApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new AsignacionApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new AsignacionApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new AsignacionApiError(error.message, [])
  }

  return new AsignacionApiError("No se pudo completar la solicitud.", [])
}

interface RespuestaPaginadaAsignaciones {
  success: boolean
  message: string
  errors: unknown[]
  data: Assignment[]
  meta: MetadatosPaginacion
}

export interface ListadoAsignaciones {
  asignaciones: Assignment[]
  meta: MetadatosPaginacion
}

export async function listarAsignaciones(
  parametros: ParametrosListadoAsignaciones = {},
): Promise<ListadoAsignaciones> {
  try {
    const response = await api.get<RespuestaPaginadaAsignaciones>(
      "/asignaciones",
      { params: parametros },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new AsignacionApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { asignaciones: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toAsignacionApiError(error)
  }
}

const LIMITE_ASIGNACIONES = 100
const MAX_PAGINAS_ASIGNACIONES = 100

export async function listarTodasLasAsignaciones(
  filtros: Omit<ParametrosListadoAsignaciones, "page" | "limit"> = {},
): Promise<Assignment[]> {
  const primera = await listarAsignaciones({
    ...filtros,
    page: 1,
    limit: LIMITE_ASIGNACIONES,
  })

  const asignaciones = [...primera.asignaciones]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_ASIGNACIONES,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarAsignaciones({
      ...filtros,
      page,
      limit: LIMITE_ASIGNACIONES,
    })
    asignaciones.push(...siguiente.asignaciones)
  }

  return asignaciones
}

export async function crearAsignacion(
  activoId: number,
  datos: DatosCreacionAsignacion,
): Promise<void> {
  try {
    const response = await api.post<RespuestaApi<unknown>>(
      `/activos/${activoId}/asignaciones`,
      datos,
    )

    if (!response.data.success) {
      throw new AsignacionApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }
  } catch (error) {
    throw toAsignacionApiError(error)
  }
}

export async function actualizarAsignacion(
  id: number,
  datos: DatosEdicionAsignacion,
): Promise<Assignment> {
  try {
    const response = await api.patch<RespuestaApi<Assignment>>(
      `/asignaciones/${id}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new AsignacionApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toAsignacionApiError(error)
  }
}

export async function devolverAsignacion(id: number): Promise<void> {
  try {
    const response = await api.post<RespuestaApi<unknown>>(
      `/asignaciones/${id}/devolucion`,
    )

    if (!response.data.success) {
      throw new AsignacionApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }
  } catch (error) {
    throw toAsignacionApiError(error)
  }
}
