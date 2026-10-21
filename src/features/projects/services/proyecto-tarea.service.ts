import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { RespuestaPaginada } from "@/types/activo"
import {
  ProyectoApiError,
  toProyectoApiError,
} from "@/features/projects/services/project-api"
import type {
  DependenciasTarea,
  DatosCreacionTarea,
  DatosEdicionTarea,
  ParametrosListadoTareas,
  Tarea,
} from "@/features/projects/types/project"

export interface ListadoTareas {
  tareas: Tarea[]
  meta: RespuestaPaginada<Tarea>["meta"]
}

export async function listarTareas(
  proyectoId: number,
  parametros: ParametrosListadoTareas = {},
): Promise<ListadoTareas> {
  try {
    const response = await api.get<RespuestaPaginada<Tarea>>(
      `/proyectos/${proyectoId}/tareas`,
      { params: parametros },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { tareas: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodasLasTareas(
  proyectoId: number,
): Promise<Tarea[]> {
  const primera = await listarTareas(proyectoId, {
    page: 1,
    limit: LIMITE_LISTADO,
  })
  const tareas = [...primera.tareas]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarTareas(proyectoId, {
      page,
      limit: LIMITE_LISTADO,
    })
    tareas.push(...siguiente.tareas)
  }

  return tareas
}

export async function obtenerTarea(
  proyectoId: number,
  tareaId: number,
): Promise<Tarea> {
  try {
    const response = await api.get<RespuestaApi<Tarea>>(
      `/proyectos/${proyectoId}/tareas/${tareaId}`,
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

export async function crearTarea(
  proyectoId: number,
  datos: DatosCreacionTarea,
): Promise<Tarea> {
  try {
    const response = await api.post<RespuestaApi<Tarea>>(
      `/proyectos/${proyectoId}/tareas`,
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

export async function actualizarTarea(
  proyectoId: number,
  tareaId: number,
  datos: DatosEdicionTarea,
): Promise<Tarea> {
  try {
    const response = await api.patch<RespuestaApi<Tarea>>(
      `/proyectos/${proyectoId}/tareas/${tareaId}`,
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

export async function eliminarTarea(
  proyectoId: number,
  tareaId: number,
): Promise<Tarea> {
  try {
    const response = await api.delete<RespuestaApi<Tarea>>(
      `/proyectos/${proyectoId}/tareas/${tareaId}`,
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

export async function listarDependencias(
  proyectoId: number,
  tareaId: number,
): Promise<DependenciasTarea> {
  try {
    const response = await api.get<RespuestaApi<DependenciasTarea>>(
      `/proyectos/${proyectoId}/tareas/${tareaId}/dependencias`,
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

export async function agregarDependencia(
  proyectoId: number,
  tareaId: number,
  dependeDeId: number,
): Promise<void> {
  try {
    const response = await api.post(
      `/proyectos/${proyectoId}/tareas/${tareaId}/dependencias`,
      { dependeDeId },
    )

    if (!response.data.success) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

export async function eliminarDependencia(
  proyectoId: number,
  tareaId: number,
  dependeDeId: number,
): Promise<void> {
  try {
    await api.delete(
      `/proyectos/${proyectoId}/tareas/${tareaId}/dependencias/${dependeDeId}`,
    )
  } catch (error) {
    throw toProyectoApiError(error)
  }
}
