import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { MetadatosPaginacion } from "@/types/activo"
import type {
  DatosCreacionRecordatorio,
  DatosEdicionRecordatorio,
  ParametrosListadoRecordatorios,
  Recordatorio,
} from "@/features/reminder/types/reminder"

export class RecordatorioApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "RecordatorioApiError"
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

function toRecordatorioApiError(error: unknown): RecordatorioApiError {
  if (error instanceof RecordatorioApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new RecordatorioApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new RecordatorioApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new RecordatorioApiError(error.message, [])
  }

  return new RecordatorioApiError("No se pudo completar la solicitud.", [])
}

interface RespuestaPaginadaRecordatorios {
  success: boolean
  message: string
  errors: unknown[]
  data: Recordatorio[]
  meta: MetadatosPaginacion
}

export interface ListadoRecordatorios {
  recordatorios: Recordatorio[]
  meta: MetadatosPaginacion
}

export async function listarRecordatorios(
  parametros: ParametrosListadoRecordatorios = {},
): Promise<ListadoRecordatorios> {
  try {
    const response = await api.get<RespuestaPaginadaRecordatorios>(
      "/recordatorios",
      { params: parametros },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new RecordatorioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return {
      recordatorios: response.data.data,
      meta: response.data.meta,
    }
  } catch (error) {
    throw toRecordatorioApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodosLosRecordatorios(): Promise<Recordatorio[]> {
  const primera = await listarRecordatorios({ page: 1, limit: LIMITE_LISTADO })
  const recordatorios = [...primera.recordatorios]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarRecordatorios({
      page,
      limit: LIMITE_LISTADO,
    })
    recordatorios.push(...siguiente.recordatorios)
  }

  return recordatorios
}

export async function crearRecordatorio(
  datos: DatosCreacionRecordatorio,
): Promise<Recordatorio> {
  try {
    const response = await api.post<RespuestaApi<Recordatorio>>(
      "/recordatorios",
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new RecordatorioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toRecordatorioApiError(error)
  }
}

export async function actualizarRecordatorio(
  id: number,
  datos: DatosEdicionRecordatorio,
): Promise<Recordatorio> {
  try {
    const response = await api.patch<RespuestaApi<Recordatorio>>(
      `/recordatorios/${id}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new RecordatorioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toRecordatorioApiError(error)
  }
}

export async function completarRecordatorio(
  id: number,
  completado: boolean,
): Promise<Recordatorio> {
  try {
    const response = await api.patch<RespuestaApi<Recordatorio>>(
      `/recordatorios/${id}/completar`,
      { completado },
    )

    if (!response.data.success || !response.data.data) {
      throw new RecordatorioApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toRecordatorioApiError(error)
  }
}

export async function eliminarRecordatorio(id: number): Promise<void> {
  try {
    await api.delete(`/recordatorios/${id}`)
  } catch (error) {
    throw toRecordatorioApiError(error)
  }
}
