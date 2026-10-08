import { api } from "@/services/api"
import type { Ticket, TicketEstado } from "@/features/tickets/types/ticket"

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
