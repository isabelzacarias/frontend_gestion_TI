import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { RespuestaPaginada } from "@/types/activo"
import {
  ProyectoApiError,
  toProyectoApiError,
} from "@/features/projects/services/project-api"
import type {
  DatosCreacionHoras,
  DatosEdicionHoras,
  ParametrosListadoHoras,
  RegistroHoras,
} from "@/features/projects/types/project"

export interface ListadoHoras {
  registros: RegistroHoras[]
  meta: RespuestaPaginada<RegistroHoras>["meta"]
}

export async function listarHoras(
  proyectoId: number,
  parametros: ParametrosListadoHoras = {},
): Promise<ListadoHoras> {
  try {
    const response = await api.get<RespuestaPaginada<RegistroHoras>>(
      `/proyectos/${proyectoId}/horas`,
      { params: parametros },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { registros: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodasLasHoras(
  proyectoId: number,
): Promise<RegistroHoras[]> {
  const primera = await listarHoras(proyectoId, {
    page: 1,
    limit: LIMITE_LISTADO,
  })
  const registros = [...primera.registros]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarHoras(proyectoId, {
      page,
      limit: LIMITE_LISTADO,
    })
    registros.push(...siguiente.registros)
  }

  return registros
}

export async function crearHoras(
  proyectoId: number,
  datos: DatosCreacionHoras,
): Promise<RegistroHoras> {
  try {
    const response = await api.post<RespuestaApi<RegistroHoras>>(
      `/proyectos/${proyectoId}/horas`,
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

export async function actualizarHoras(
  proyectoId: number,
  registroId: number,
  datos: DatosEdicionHoras,
): Promise<RegistroHoras> {
  try {
    const response = await api.patch<RespuestaApi<RegistroHoras>>(
      `/proyectos/${proyectoId}/horas/${registroId}`,
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

export async function eliminarHoras(
  proyectoId: number,
  registroId: number,
): Promise<RegistroHoras> {
  try {
    const response = await api.delete<RespuestaApi<RegistroHoras>>(
      `/proyectos/${proyectoId}/horas/${registroId}`,
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
