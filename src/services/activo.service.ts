import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type {
  ActivoImportRow,
  ActivoResumen,
  MetadatosPaginacion,
  ParametrosListadoActivos,
  ResultadoConfirmacionImportacion,
  ResultadoValidacionImportacion,
  RespuestaPaginada,
} from "@/types/activo"

export class ActivoApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "ActivoApiError"
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

function toActivoApiError(error: unknown): ActivoApiError {
  if (error instanceof ActivoApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new ActivoApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new ActivoApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new ActivoApiError(error.message, [])
  }

  return new ActivoApiError("No se pudo completar la solicitud.", [])
}

export interface ListadoActivos {
  activos: ActivoResumen[]
  meta: MetadatosPaginacion
}

export async function listarActivos(
  parametros: ParametrosListadoActivos = {},
): Promise<ListadoActivos> {
  try {
    const response = await api.get<RespuestaPaginada<ActivoResumen>>(
      "/activos",
      { params: parametros },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ActivoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { activos: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toActivoApiError(error)
  }
}

export async function validarImportacionActivos(
  filas: ActivoImportRow[],
): Promise<ResultadoValidacionImportacion> {
  try {
    const response = await api.post<
      RespuestaApi<ResultadoValidacionImportacion>
    >("/activos/importaciones/validar", { filas })

    if (!response.data.success || !response.data.data) {
      throw new ActivoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toActivoApiError(error)
  }
}

export async function confirmarImportacionActivos(
  filas: ActivoImportRow[],
): Promise<ResultadoConfirmacionImportacion> {
  try {
    const response = await api.post<
      RespuestaApi<ResultadoConfirmacionImportacion>
    >("/activos/importaciones/confirmar", { filas })

    if (!response.data.success || !response.data.data) {
      throw new ActivoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toActivoApiError(error)
  }
}
