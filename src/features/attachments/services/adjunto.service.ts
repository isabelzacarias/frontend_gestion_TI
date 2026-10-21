import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { MetadatosPaginacion } from "@/types/activo"
import type {
  Adjunto,
  DatosSubidaAdjunto,
  DescargaAdjunto,
  EntidadAdjunto,
  ParametrosListadoAdjuntos,
} from "@/features/attachments/types/attachment"

export class AdjuntoApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "AdjuntoApiError"
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

function toAdjuntoApiError(error: unknown): AdjuntoApiError {
  if (error instanceof AdjuntoApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new AdjuntoApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new AdjuntoApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new AdjuntoApiError(error.message, [])
  }

  return new AdjuntoApiError("No se pudo completar la solicitud.", [])
}

interface RespuestaPaginadaAdjuntos {
  success: boolean
  message: string
  errors: unknown[]
  data: Adjunto[]
  meta: MetadatosPaginacion
}

export interface ListadoAdjuntos {
  adjuntos: Adjunto[]
  meta: MetadatosPaginacion
}

export interface OpcionesSubidaAdjunto {
  onProgress?: (porcentaje: number) => void
}

export async function subirAdjunto(
  datos: DatosSubidaAdjunto,
  opciones: OpcionesSubidaAdjunto = {},
): Promise<Adjunto> {
  const formData = new FormData()
  formData.append("archivo", datos.archivo)
  formData.append("entidadTipo", datos.entidadTipo)
  formData.append("entidadId", datos.entidadId)

  try {
    const response = await api.post<RespuestaApi<Adjunto>>(
      "/adjuntos",
      formData,
      {
        onUploadProgress: (event) => {
          if (!opciones.onProgress || !event.total) return
          opciones.onProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          )
        },
      },
    )

    if (!response.data.success || !response.data.data) {
      throw new AdjuntoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toAdjuntoApiError(error)
  }
}

export async function listarAdjuntos(
  parametros: ParametrosListadoAdjuntos,
): Promise<ListadoAdjuntos> {
  try {
    const response = await api.get<RespuestaPaginadaAdjuntos>("/adjuntos", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new AdjuntoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { adjuntos: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toAdjuntoApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodosLosAdjuntos(
  entidadTipo: EntidadAdjunto,
  entidadId: string,
): Promise<Adjunto[]> {
  const primera = await listarAdjuntos({
    entidadTipo,
    entidadId,
    page: 1,
    limit: LIMITE_LISTADO,
  })

  const adjuntos = [...primera.adjuntos]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarAdjuntos({
      entidadTipo,
      entidadId,
      page,
      limit: LIMITE_LISTADO,
    })
    adjuntos.push(...siguiente.adjuntos)
  }

  return adjuntos
}

export async function obtenerDescargaAdjunto(
  id: number,
): Promise<DescargaAdjunto> {
  try {
    const response = await api.get<RespuestaApi<DescargaAdjunto>>(
      `/adjuntos/${id}/descarga`,
    )

    if (!response.data.success || !response.data.data) {
      throw new AdjuntoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toAdjuntoApiError(error)
  }
}

export async function eliminarAdjunto(id: number): Promise<void> {
  try {
    await api.delete(`/adjuntos/${id}`)
  } catch (error) {
    throw toAdjuntoApiError(error)
  }
}
