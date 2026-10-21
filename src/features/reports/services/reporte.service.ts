import axios from "axios"

import { api } from "@/services/api"
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearStoredAuthSession,
  readStoredAuthSession,
} from "@/services/auth-session"
import type { RespuestaApi } from "@/types/auth"
import { construirParametros } from "@/features/reports/utils/report-display"
import type {
  DescargaGeneracion,
  FormatoReporte,
  ListadoGeneraciones,
  ReporteGeneracion,
  ReporteMetadata,
} from "@/features/reports/types/report"

export class ReporteApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "ReporteApiError"
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

function toReporteApiError(error: unknown): ReporteApiError {
  if (error instanceof ReporteApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new ReporteApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new ReporteApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new ReporteApiError(error.message, [])
  }

  return new ReporteApiError("No se pudo completar la solicitud.", [])
}

function obtenerBaseUrl(): string {
  const base =
    api.defaults.baseURL ??
    `http://${window.location.hostname}:3000/api`
  return base.replace(/\/+$/, "")
}

function manejarSesionExpirada(): void {
  try {
    clearStoredAuthSession()
  } catch (error) {
    console.error("No se pudo limpiar la sesión almacenada.", error)
  }
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
  if (window.location.pathname !== "/login") {
    window.location.assign("/login")
  }
}

async function leerErrorFetch(response: Response): Promise<ReporteApiError> {
  let message = `No se pudo completar la solicitud (${response.status}).`
  let errors: unknown[] = []

  try {
    const data = (await response.json()) as unknown
    if (typeof data === "object" && data !== null) {
      const registro = data as Record<string, unknown>
      if (typeof registro.message === "string") message = registro.message
      if (Array.isArray(registro.errors)) errors = registro.errors
    }
  } catch {
    message = response.statusText || message
  }

  return new ReporteApiError(message, errors, response.status)
}

function obtenerNombreArchivo(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback

  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return utf8[1]
    }
  }

  const simple = header.match(/filename="?([^";]+)"?/i)
  return simple?.[1] ?? fallback
}

function descargarBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = filename
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function obtenerCatalogoReportes(): Promise<ReporteMetadata[]> {
  try {
    const response = await api.get<RespuestaApi<ReporteMetadata[]>>(
      "/reportes",
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ReporteApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toReporteApiError(error)
  }
}

export async function obtenerDefinicionReporte(
  codigo: string,
): Promise<ReporteMetadata> {
  try {
    const response = await api.get<RespuestaApi<ReporteMetadata>>(
      `/reportes/${codigo}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new ReporteApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toReporteApiError(error)
  }
}

export async function crearGeneracionReporte(
  codigo: string,
  formato: FormatoReporte,
  filtros: Record<string, string>,
): Promise<ReporteGeneracion> {
  try {
    const response = await api.post<RespuestaApi<ReporteGeneracion>>(
      `/reportes/${codigo}/generaciones`,
      null,
      { params: { formato, ...construirParametros(filtros) } },
    )

    if (!response.data.success || !response.data.data) {
      throw new ReporteApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toReporteApiError(error)
  }
}

interface RespuestaPaginadaGeneraciones {
  success: boolean
  message: string
  errors: unknown[]
  data: ReporteGeneracion[]
  meta: ListadoGeneraciones["meta"]
}

export async function listarGeneraciones(
  page: number,
  limit = 20,
): Promise<ListadoGeneraciones> {
  try {
    const response = await api.get<RespuestaPaginadaGeneraciones>(
      "/reportes/generaciones",
      { params: { page, limit } },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ReporteApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { generaciones: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toReporteApiError(error)
  }
}

export async function obtenerGeneracion(
  id: number,
): Promise<ReporteGeneracion> {
  try {
    const response = await api.get<RespuestaApi<ReporteGeneracion>>(
      `/reportes/generaciones/${id}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new ReporteApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toReporteApiError(error)
  }
}

export async function obtenerDescargaGeneracion(
  id: number,
): Promise<DescargaGeneracion> {
  try {
    const response = await api.get<RespuestaApi<DescargaGeneracion>>(
      `/reportes/generaciones/${id}/descarga`,
    )

    if (!response.data.success || !response.data.data) {
      throw new ReporteApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toReporteApiError(error)
  }
}

export async function descargarReporteSincrono(
  codigo: string,
  formato: FormatoReporte,
  filtros: Record<string, string>,
): Promise<void> {
  const token = readStoredAuthSession()?.token
  if (!token) {
    manejarSesionExpirada()
    throw new ReporteApiError("Tu sesión expiró. Inicia sesión nuevamente.", [], 401)
  }

  const params = new URLSearchParams({
    formato,
    ...construirParametros(filtros),
  })
  const url = `${obtenerBaseUrl()}/reportes/${codigo}/descargar?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    throw new ReporteApiError(
      error instanceof Error
        ? error.message
        : "No se pudo conectar con el servidor.",
      [],
    )
  }

  if (!response.ok) {
    if (response.status === 401) manejarSesionExpirada()
    throw await leerErrorFetch(response)
  }

  const blob = await response.blob()
  const filename = obtenerNombreArchivo(
    response.headers.get("Content-Disposition"),
    `${codigo}.${formato}`,
  )
  descargarBlob(blob, filename)
}
