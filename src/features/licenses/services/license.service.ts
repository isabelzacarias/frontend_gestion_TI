import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type {
  DatosCreacionLicencia,
  DatosEdicionLicencia,
  License,
  MetadatosPaginacion,
  ParametrosListadoLicencias,
  RespuestaPaginada,
} from "@/features/licenses/types/license"

export class LicenseApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "LicenseApiError"
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

function toLicenseApiError(error: unknown): LicenseApiError {
  if (error instanceof LicenseApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new LicenseApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new LicenseApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new LicenseApiError(error.message, [])
  }

  return new LicenseApiError("No se pudo completar la solicitud.", [])
}

export interface ListadoLicencias {
  licencias: License[]
  meta: MetadatosPaginacion
}

export async function listarLicencias(
  parametros: ParametrosListadoLicencias = {},
): Promise<ListadoLicencias> {
  try {
    const response = await api.get<RespuestaPaginada<License>>("/licencias", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new LicenseApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { licencias: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toLicenseApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodasLasLicencias(
  filtros: Omit<ParametrosListadoLicencias, "page" | "limit"> = {},
): Promise<License[]> {
  const primera = await listarLicencias({
    ...filtros,
    page: 1,
    limit: LIMITE_LISTADO,
  })

  const licencias = [...primera.licencias]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarLicencias({
      ...filtros,
      page,
      limit: LIMITE_LISTADO,
    })
    licencias.push(...siguiente.licencias)
  }

  return licencias
}

export async function crearLicencia(
  datos: DatosCreacionLicencia,
): Promise<License> {
  try {
    const response = await api.post<RespuestaApi<License>>("/licencias", datos)

    if (!response.data.success || !response.data.data) {
      throw new LicenseApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toLicenseApiError(error)
  }
}

export async function actualizarLicencia(
  id: number,
  datos: DatosEdicionLicencia,
): Promise<License> {
  try {
    const response = await api.patch<RespuestaApi<License>>(
      `/licencias/${id}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new LicenseApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toLicenseApiError(error)
  }
}

export async function desactivarLicencia(id: number): Promise<License> {
  try {
    const response = await api.delete<RespuestaApi<License>>(`/licencias/${id}`)

    if (!response.data.success || !response.data.data) {
      throw new LicenseApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toLicenseApiError(error)
  }
}
