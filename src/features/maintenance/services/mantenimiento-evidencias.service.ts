import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { MetadatosPaginacion } from "@/types/activo"
import {
  AdjuntoApiError,
  toAdjuntoApiError,
  type OpcionesSubidaAdjunto,
} from "@/features/attachments/services/adjunto.service"
import type {
  Adjunto,
  DescargaAdjunto,
} from "@/features/attachments/types/attachment"

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

interface RespuestaPaginadaEvidencias {
  success: boolean
  message: string
  errors: unknown[]
  data: Adjunto[]
  meta: MetadatosPaginacion
}

export interface ListadoEvidencias {
  evidencias: Adjunto[]
  meta: MetadatosPaginacion
}

export async function listarEvidenciasMantenimiento(
  mantenimientoId: number,
  page = 1,
  limit = LIMITE_LISTADO,
): Promise<ListadoEvidencias> {
  try {
    const response = await api.get<RespuestaPaginadaEvidencias>(
      `/mantenimiento/${mantenimientoId}/evidencias`,
      { params: { page, limit } },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new AdjuntoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { evidencias: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toAdjuntoApiError(error)
  }
}

export async function listarTodasLasEvidenciasMantenimiento(
  mantenimientoId: number,
): Promise<Adjunto[]> {
  const primera = await listarEvidenciasMantenimiento(
    mantenimientoId,
    1,
    LIMITE_LISTADO,
  )
  const evidencias = [...primera.evidencias]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarEvidenciasMantenimiento(
      mantenimientoId,
      page,
      LIMITE_LISTADO,
    )
    evidencias.push(...siguiente.evidencias)
  }

  return evidencias
}

export async function subirEvidenciaMantenimiento(
  mantenimientoId: number,
  archivo: File,
  opciones: OpcionesSubidaAdjunto = {},
): Promise<Adjunto> {
  const formData = new FormData()
  formData.append("archivo", archivo)

  try {
    const response = await api.post<RespuestaApi<Adjunto>>(
      `/mantenimiento/${mantenimientoId}/evidencias`,
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
    if (axios.isAxiosError(error)) {
      throw toAdjuntoApiError(error)
    }
    throw error
  }
}

export async function obtenerDescargaEvidenciaMantenimiento(
  mantenimientoId: number,
  adjuntoId: number,
): Promise<DescargaAdjunto> {
  try {
    const response = await api.get<RespuestaApi<DescargaAdjunto>>(
      `/mantenimiento/${mantenimientoId}/evidencias/${adjuntoId}/descarga`,
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

export async function eliminarEvidenciaMantenimiento(
  mantenimientoId: number,
  adjuntoId: number,
): Promise<void> {
  try {
    await api.delete(
      `/mantenimiento/${mantenimientoId}/evidencias/${adjuntoId}`,
    )
  } catch (error) {
    throw toAdjuntoApiError(error)
  }
}
