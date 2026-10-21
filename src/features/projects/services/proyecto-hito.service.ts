import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import {
  ProyectoApiError,
  toProyectoApiError,
} from "@/features/projects/services/project-api"
import type {
  DatosCreacionHito,
  DatosEdicionHito,
  Hito,
} from "@/features/projects/types/project"

export async function listarHitos(proyectoId: number): Promise<Hito[]> {
  try {
    const response = await api.get<RespuestaApi<Hito[]>>(
      `/proyectos/${proyectoId}/hitos`,
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

export async function crearHito(
  proyectoId: number,
  datos: DatosCreacionHito,
): Promise<Hito> {
  try {
    const response = await api.post<RespuestaApi<Hito>>(
      `/proyectos/${proyectoId}/hitos`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

export async function actualizarHito(
  proyectoId: number,
  hitoId: number,
  datos: DatosEdicionHito,
): Promise<Hito> {
  try {
    const response = await api.patch<RespuestaApi<Hito>>(
      `/proyectos/${proyectoId}/hitos/${hitoId}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

export async function eliminarHito(
  proyectoId: number,
  hitoId: number,
): Promise<Hito> {
  try {
    const response = await api.delete<RespuestaApi<Hito>>(
      `/proyectos/${proyectoId}/hitos/${hitoId}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toProyectoApiError(error)
  }
}
