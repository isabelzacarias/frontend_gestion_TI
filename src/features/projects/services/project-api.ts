import axios from "axios"

import type { RespuestaApi } from "@/types/auth"

export class ProyectoApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "ProyectoApiError"
    this.errors = errors
    this.status = status
  }
}

export function esPermisoDenegado(error: unknown): boolean {
  return error instanceof ProyectoApiError && error.status === 403
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

export function toProyectoApiError(error: unknown): ProyectoApiError {
  if (error instanceof ProyectoApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new ProyectoApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new ProyectoApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new ProyectoApiError(error.message, [])
  }

  return new ProyectoApiError("No se pudo completar la solicitud.", [])
}

export function mensajeProyectoError(error: unknown): string {
  if (error instanceof ProyectoApiError) {
    if (error.status === 403) {
      return "No tienes permiso para realizar esta acción en proyectos."
    }
    if (error.status === 404) {
      return "El proyecto o el recurso ya no existe."
    }
    if (error.status === 409) {
      return error.message
    }
    if (error.status === 503) {
      return "El almacenamiento de imágenes no está disponible."
    }
    return error.message
  }
  return "No se pudo completar la operación."
}
