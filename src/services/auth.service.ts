import axios from "axios"

import { api } from "@/services/api"
import type {
  RespuestaApi,
  RespuestaLogin,
  UsuarioPerfil,
} from "@/types/auth"

export class AuthApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "AuthApiError"
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

function toAuthApiError(error: unknown): AuthApiError {
  if (error instanceof AuthApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new AuthApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new AuthApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new AuthApiError(error.message, [])
  }

  return new AuthApiError("No se pudo completar la solicitud.", [])
}

export async function login(
  email: string,
  password: string,
): Promise<RespuestaLogin> {
  try {
    const response = await api.post<RespuestaApi<RespuestaLogin>>(
      "/auth/login",
      { email, password },
    )

    if (!response.data.success || !response.data.data) {
      throw new AuthApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toAuthApiError(error)
  }
}

export async function obtenerPerfil(): Promise<UsuarioPerfil> {
  try {
    const response = await api.get<RespuestaApi<UsuarioPerfil>>("/auth/me")

    if (!response.data.success || !response.data.data) {
      throw new AuthApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toAuthApiError(error)
  }
}
