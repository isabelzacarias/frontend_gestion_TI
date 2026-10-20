import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type { MetadatosPaginacion } from "@/types/activo"
import type {
  DatosCreacionMantenimiento,
  DatosEdicionMantenimiento,
  MaintenanceOrder,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "@/features/maintenance/types/maintenance"

export interface ParametrosListadoMantenimiento {
  page?: number
  limit?: number
  q?: string
  tipo?: MaintenanceType
  estado?: MaintenanceStatus
  prioridad?: MaintenancePriority
  tecnicoId?: string
  activoId?: number
}

export class MantenimientoApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "MantenimientoApiError"
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

function toMantenimientoApiError(error: unknown): MantenimientoApiError {
  if (error instanceof MantenimientoApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new MantenimientoApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new MantenimientoApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new MantenimientoApiError(error.message, [])
  }

  return new MantenimientoApiError("No se pudo completar la solicitud.", [])
}

export interface ListadoMantenimientos {
  mantenimientos: MaintenanceOrder[]
  meta: MetadatosPaginacion
}

interface RespuestaPaginadaMantenimientos {
  success: boolean
  message: string
  errors: unknown[]
  data: MaintenanceOrder[]
  meta: MetadatosPaginacion
}

export async function listarMantenimientos(
  parametros: ParametrosListadoMantenimiento = {},
): Promise<ListadoMantenimientos> {
  try {
    const response = await api.get<RespuestaPaginadaMantenimientos>(
      "/mantenimiento",
      { params: parametros },
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new MantenimientoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return {
      mantenimientos: response.data.data,
      meta: response.data.meta,
    }
  } catch (error) {
    throw toMantenimientoApiError(error)
  }
}

const LIMITE_LISTADO = 100
const MAX_PAGINAS_LISTADO = 100

export async function listarTodosLosMantenimientos(
  filtros: Omit<ParametrosListadoMantenimiento, "page" | "limit"> = {},
): Promise<MaintenanceOrder[]> {
  const primera = await listarMantenimientos({
    ...filtros,
    page: 1,
    limit: LIMITE_LISTADO,
  })

  const mantenimientos = [...primera.mantenimientos]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_LISTADO,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarMantenimientos({
      ...filtros,
      page,
      limit: LIMITE_LISTADO,
    })
    mantenimientos.push(...siguiente.mantenimientos)
  }

  return mantenimientos
}

export async function obtenerMantenimiento(
  id: number,
): Promise<MaintenanceOrder> {
  try {
    const response = await api.get<RespuestaApi<MaintenanceOrder>>(
      `/mantenimiento/${id}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new MantenimientoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toMantenimientoApiError(error)
  }
}

export async function listarMantenimientosPorActivo(
  activoId: number,
): Promise<MaintenanceOrder[]> {
  try {
    const response = await api.get<RespuestaApi<MaintenanceOrder[]>>(
      `/mantenimiento/activo/${activoId}`,
    )

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new MantenimientoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toMantenimientoApiError(error)
  }
}

export async function crearMantenimiento(
  datos: DatosCreacionMantenimiento,
): Promise<MaintenanceOrder> {
  try {
    const response = await api.post<RespuestaApi<MaintenanceOrder>>(
      "/mantenimiento",
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new MantenimientoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toMantenimientoApiError(error)
  }
}

export async function actualizarMantenimiento(
  id: number,
  datos: DatosEdicionMantenimiento,
): Promise<MaintenanceOrder> {
  try {
    const response = await api.patch<RespuestaApi<MaintenanceOrder>>(
      `/mantenimiento/${id}`,
      datos,
    )

    if (!response.data.success || !response.data.data) {
      throw new MantenimientoApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toMantenimientoApiError(error)
  }
}

export async function cambiarEstadoMantenimiento(
  id: number,
  estado: MaintenanceStatus,
): Promise<MaintenanceOrder> {
  return actualizarMantenimiento(id, { estado })
}

export async function eliminarMantenimiento(id: number): Promise<void> {
  try {
    await api.delete(`/mantenimiento/${id}`)
  } catch (error) {
    throw toMantenimientoApiError(error)
  }
}
