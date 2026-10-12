import axios from "axios"

import { api } from "@/services/api"
import type { RespuestaApi } from "@/types/auth"
import type {
  MetadatosPaginacion,
  ParametrosListadoTickets,
  RespuestaPaginada,
  Ticket,
  TicketDetalle,
} from "@/features/tickets/types/ticket"

export class TicketApiError extends Error {
  readonly errors: unknown[]
  readonly status: number | undefined

  constructor(message: string, errors: unknown[], status?: number) {
    super(message)
    this.name = "TicketApiError"
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

function toTicketApiError(error: unknown): TicketApiError {
  if (error instanceof TicketApiError) return error

  if (axios.isAxiosError<unknown>(error)) {
    const response = error.response?.data
    if (isApiErrorResponse(response)) {
      return new TicketApiError(
        response.message,
        response.errors,
        error.response?.status,
      )
    }

    return new TicketApiError(
      error.message || "No se pudo conectar con el servidor.",
      [],
      error.response?.status,
    )
  }

  if (error instanceof Error) {
    return new TicketApiError(error.message, [])
  }

  return new TicketApiError("No se pudo completar la solicitud.", [])
}

export interface ListadoTickets {
  tickets: Ticket[]
  meta: MetadatosPaginacion
}

export async function listarTickets(
  parametros: ParametrosListadoTickets = {},
): Promise<ListadoTickets> {
  try {
    const response = await api.get<RespuestaPaginada<Ticket>>("/incidencias", {
      params: parametros,
    })

    if (!response.data.success || !Array.isArray(response.data.data)) {
      throw new TicketApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return { tickets: response.data.data, meta: response.data.meta }
  } catch (error) {
    throw toTicketApiError(error)
  }
}

const LIMITE_KANBAN = 100
const MAX_PAGINAS_KANBAN = 50

export async function listarTodosLosTickets(
  parametros: Omit<ParametrosListadoTickets, "page" | "limit"> = {},
): Promise<Ticket[]> {
  const primera = await listarTickets({
    ...parametros,
    page: 1,
    limit: LIMITE_KANBAN,
  })

  const tickets = [...primera.tickets]
  const totalPaginas = Math.min(
    primera.meta.totalPages,
    MAX_PAGINAS_KANBAN,
  )

  for (let page = 2; page <= totalPaginas; page += 1) {
    const siguiente = await listarTickets({
      ...parametros,
      page,
      limit: LIMITE_KANBAN,
    })
    tickets.push(...siguiente.tickets)
  }

  return tickets
}

export async function obtenerTicket(id: number): Promise<TicketDetalle> {
  try {
    const response = await api.get<RespuestaApi<TicketDetalle>>(
      `/incidencias/${id}`,
    )

    if (!response.data.success || !response.data.data) {
      throw new TicketApiError(
        response.data.message,
        response.data.errors,
        response.status,
      )
    }

    return response.data.data
  } catch (error) {
    throw toTicketApiError(error)
  }
}
