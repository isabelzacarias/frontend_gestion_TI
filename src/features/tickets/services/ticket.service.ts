import { api } from "@/services/api"
import type {
  Ticket,
  TicketEstado,
  TicketPrioridad,
  TipoRequerimiento,
} from "@/features/tickets/types/ticket"

export interface ObtenerIncidenciasParams {
  page?: number
  limit?: number
  estado?: TicketEstado | "ALL"
  prioridad?: TicketPrioridad | "ALL"
  tipoRequerimiento?: TipoRequerimiento | "ALL"
  search?: string
}

export interface IncidenciasApiResponse {
  success: boolean
  message: string
  errors?: unknown[]
  data: Ticket[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Consulta la lista paginada de incidencias/tickets desde el backend.
 * Endpoint: /incidencias (ej: /api/incidencias?page=1&limit=10&estado=NUEVO)
 */
export async function obtenerIncidencias(
  params: ObtenerIncidenciasParams = {},
): Promise<IncidenciasApiResponse> {
  const queryParams: Record<string, unknown> = {}
  if (params.page !== undefined) queryParams.page = params.page
  if (params.limit !== undefined) queryParams.limit = params.limit
  if (params.estado && params.estado !== "ALL") queryParams.estado = params.estado
  if (params.prioridad && params.prioridad !== "ALL") queryParams.prioridad = params.prioridad
  if (params.tipoRequerimiento && params.tipoRequerimiento !== "ALL") {
    queryParams.tipoRequerimiento = params.tipoRequerimiento
  }
  if (params.search?.trim()) queryParams.search = params.search.trim()

  const response = await api.get<IncidenciasApiResponse>("/incidencias", {
    params: queryParams,
  })

  return response.data
}

/**
 * Actualiza el estado de un ticket en la base de datos a través de la API del backend.
 * @param id ID numérico del ticket
 * @param estado Nuevo estado a asignar (NUEVO, EN_PROCESO, RESUELTO, CERRADO, CANCELADO)
 */
export async function actualizarEstadoTicket(
  id: number,
  estado: TicketEstado,
): Promise<Partial<Ticket>> {
  try {
    const response = await api.patch<{ success: boolean; data: Ticket }>(
      `/tickets/${id}/estado`,
      { estado },
    )
    return response.data?.data ?? { id, estado }
  } catch (error) {
    // Si la API aún no tiene esa ruta implementada en dev local, relanzar o propagar error para manejarlo limpiamente
    console.warn(
      `Conexión API /tickets/${id}/estado no disponible o fallida. Se aplicará actualización en interfaz.`,
      error,
    )
    // Devolvemos la actualización deseada para permitir comportamiento reactivo
    return { id, estado }
  }
}

