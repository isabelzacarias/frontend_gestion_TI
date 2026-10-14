import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type {
  Credential,
  CredencialImportRow,
  DatosCreacionSecreto,
  DatosEdicionSecreto,
  MetadatosPaginacion,
  ParametrosListadoSecretos,
  RespuestaPaginada,
  ResultadoConfirmacionImportacionSecretos,
  ResultadoValidacionImportacionSecretos,
} from "@/features/passwords/types/credential"

export class SecretoApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "SecretoApiError"
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

function toSecretoApiError(error: unknown): SecretoApiError {
  if (error instanceof SecretoApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new SecretoApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new SecretoApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new SecretoApiError(error.message, [])
  }

  return new SecretoApiError("No se pudo completar la solicitud.", [])
}

export interface PasswordRevelado {
  id: number
  password: string
}

export interface ListadoSecretos {
  secretos: Credential[]
  meta: MetadatosPaginacion
}

export async function listarSecretos(
  parametros: ParametrosListadoSecretos = {},
): Promise<ListadoSecretos> {
  try {
    const response = await api.get<RespuestaPaginada<Credential>>("/secretos", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { secretos: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toSecretoApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodosLosSecretos(
  filtros: Omit<ParametrosListadoSecretos, "page" | "limit"> = {},
): Promise<Credential[]> {
  const primera = await listarSecretos({
    ...filtros,
    page: 1,
    limit: LIMITE_LISTADO,
  })

  const secretos = [...primera.secretos]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarSecretos({
      ...filtros,
      page,
      limit: LIMITE_LISTADO,
    })
    secretos.push(...siguiente.secretos)
  }

  return secretos
}

export async function crearSecreto(
  datos: DatosCreacionSecreto,
): Promise<Credential> {
  try {
    const response = await api.post<RespuestaApi<Credential>>("/secretos", datos)

    if (!response.data.success || !response.data.data) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toSecretoApiError(error)
  }
}

export async function actualizarSecreto(
  id: number,
  datos: DatosEdicionSecreto,
): Promise<Credential> {
  try {
    const response = await api.patch<RespuestaApi<Credential>>(
      `/secretos/${id}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toSecretoApiError(error)
  }
}

export async function desactivarSecreto(id: number): Promise<Credential> {
  try {
    const response = await api.delete<RespuestaApi<Credential>>(
      `/secretos/${id}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toSecretoApiError(error)
  }
}

export async function validarImportacionSecretos(
  filas: CredencialImportRow[],
): Promise<ResultadoValidacionImportacionSecretos> {
  try {
    const response = await api.post<
      RespuestaApi<ResultadoValidacionImportacionSecretos>
    >("/secretos/importaciones/validar", { filas })

    if (!response.data.success || !response.data.data) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toSecretoApiError(error)
  }
}

export async function confirmarImportacionSecretos(
  filas: CredencialImportRow[],
): Promise<ResultadoConfirmacionImportacionSecretos> {
  try {
    const response = await api.post<
      RespuestaApi<ResultadoConfirmacionImportacionSecretos>
    >("/secretos/importaciones/confirmar", { filas })

    if (!response.data.success || !response.data.data) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toSecretoApiError(error)
  }
}

export async function revelarPasswordSecreto(
  id: number,
): Promise<PasswordRevelado> {
  try {
    const response = await api.get<RespuestaApi<PasswordRevelado>>(
      `/secretos/${id}/password`,
    )

    if (!response.data.success || !response.data.data) {
      throw new SecretoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toSecretoApiError(error)
  }
}
