import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { RespuestaPaginada } from "@/types/activo"
import {
  ProyectoApiError,
  toProyectoApiError,
} from "@/features/projects/services/project-api"
import type {
  DatosCreacionProyecto,
  DatosEdicionProyecto,
  DatosMiembro,
  ParametrosListadoProyectos,
  Proyecto,
  ProyectoDetalle,
  ProyectoMiembro,
  RolProyecto,
} from "@/features/projects/types/project"

export interface ListadoProyectos {
  proyectos: Proyecto[]
  meta: RespuestaPaginada<Proyecto>["meta"]
}

export async function listarProyectos(
  parametros: ParametrosListadoProyectos = {},
): Promise<ListadoProyectos> {
  try {
    const response = await api.get<RespuestaPaginada<Proyecto>>("/proyectos", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new ProyectoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { proyectos: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toProyectoApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodosLosProyectos(): Promise<Proyecto[]> {
  const primera = await listarProyectos({ page: 1, limit: LIMITE_LISTADO })
  const proyectos = [...primera.proyectos]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarProyectos({
      page,
      limit: LIMITE_LISTADO,
    })
    proyectos.push(...siguiente.proyectos)
  }

  return proyectos
}

export async function obtenerProyecto(id: number): Promise<ProyectoDetalle> {
  try {
    const response = await api.get<RespuestaApi<ProyectoDetalle>>(
      `/proyectos/${id}`,
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

export async function crearProyecto(
  datos: DatosCreacionProyecto,
): Promise<Proyecto> {
  try {
    const response = await api.post<RespuestaApi<Proyecto>>(
      "/proyectos",
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

export async function actualizarProyecto(
  id: number,
  datos: DatosEdicionProyecto,
): Promise<Proyecto> {
  try {
    const response = await api.patch<RespuestaApi<Proyecto>>(
      `/proyectos/${id}`,
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

export async function eliminarProyecto(id: number): Promise<Proyecto> {
  try {
    const response = await api.delete<RespuestaApi<Proyecto>>(
      `/proyectos/${id}`,
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

export async function listarMiembros(
  proyectoId: number,
): Promise<ProyectoMiembro[]> {
  try {
    const response = await api.get<RespuestaApi<ProyectoMiembro[]>>(
      `/proyectos/${proyectoId}/miembros`,
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

export async function agregarMiembro(
  proyectoId: number,
  datos: DatosMiembro,
): Promise<ProyectoMiembro> {
  try {
    const response = await api.post<RespuestaApi<ProyectoMiembro>>(
      `/proyectos/${proyectoId}/miembros`,
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

export async function actualizarRolMiembro(
  proyectoId: number,
  usuarioId: string,
  rol: RolProyecto,
): Promise<ProyectoMiembro> {
  try {
    const response = await api.patch<RespuestaApi<ProyectoMiembro>>(
      `/proyectos/${proyectoId}/miembros/${usuarioId}`,
      { rol },
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

export async function eliminarMiembro(
  proyectoId: number,
  usuarioId: string,
): Promise<void> {
  try {
    await api.delete(`/proyectos/${proyectoId}/miembros/${usuarioId}`)
  } catch (error) {
    throw toProyectoApiError(error)
  }
}
