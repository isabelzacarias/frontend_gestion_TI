import axios from "axios"

import { api } from "@/services/api"
import type {
  NotificationsMeta,
  PersistedNotification,
} from "@/features/notifications/types/notification"

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data?: T
  meta?: unknown
  errors?: unknown[]
}

interface NotificationListResponse {
  data: PersistedNotification[]
  meta: NotificationsMeta
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}

function parseIncidentSummary(
  value: unknown,
): PersistedNotification["incidencia"] | null {
  if (
    isRecord(value) &&
    (typeof value.id === "string" || typeof value.id === "number") &&
    typeof value.titulo === "string" &&
    typeof value.estado === "string" &&
    typeof value.prioridad === "string" &&
    isValidDate(value.fechaNotificacion)
  ) {
    return {
      id: String(value.id),
      titulo: value.titulo,
      estado: value.estado,
      prioridad: value.prioridad,
      fechaNotificacion: value.fechaNotificacion,
    }
  }
  return null
}

function parsePersistedNotification(
  value: unknown,
): PersistedNotification | null {
  if (
    !isRecord(value) ||
    !(
      (typeof value.id === "string" && value.id.trim().length > 0) ||
      (typeof value.id === "number" && Number.isFinite(value.id))
    ) ||
    !(
      (typeof value.incidenciaId === "string" &&
        value.incidenciaId.trim().length > 0) ||
      (typeof value.incidenciaId === "number" &&
        Number.isFinite(value.incidenciaId))
    ) ||
    !isValidDate(value.creadaEn) ||
    (value.leidaEn !== null && !isValidDate(value.leidaEn)) ||
    typeof value.leida !== "boolean"
  ) {
    return null
  }

  const incidencia = parseIncidentSummary(value.incidencia)
  if (!incidencia) return null

  return {
    id: String(value.id),
    incidenciaId: String(value.incidenciaId),
    creadaEn: value.creadaEn,
    leidaEn: value.leidaEn,
    leida: value.leida,
    incidencia,
  }
}

function parseNotificationsMeta(value: unknown): NotificationsMeta | null {
  if (
    isRecord(value) &&
    Number.isInteger(value.page) &&
    Number.isInteger(value.limit) &&
    Number.isInteger(value.total) &&
    Number.isInteger(value.totalPages) &&
    Number.isInteger(value.noLeidas)
  ) {
    return {
      page: Number(value.page),
      limit: Number(value.limit),
      total: Number(value.total),
      totalPages: Number(value.totalPages),
      noLeidas: Number(value.noLeidas),
    }
  }
  return null
}

function isNonnegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0
}

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const response = error.response?.data
    if (response && typeof response.message === "string") {
      return response.message
    }
    if (!error.response) {
      return "No se pudo conectar con el servicio de notificaciones."
    }
  }
  if (error instanceof Error) return error.message
  return "No se pudo completar la solicitud de notificaciones."
}

export async function listUnreadNotifications(
  page = 1,
  limit = 20,
): Promise<NotificationListResponse> {
  try {
    const response = await api.get<ApiEnvelope<unknown>>("/notificaciones", {
      params: { page, limit, leida: false },
    })
    const body = response.data

    if (!body.success || !Array.isArray(body.data)) {
      throw new Error("El servicio devolvió una lista de notificaciones inválida.")
    }

    const data = body.data.map(parsePersistedNotification)
    const meta = parseNotificationsMeta(body.meta)
    if (data.some((notification) => notification === null) || !meta) {
      throw new Error("El servicio devolvió una lista de notificaciones inválida.")
    }

    return {
      data: data.filter(
        (notification): notification is PersistedNotification =>
          notification !== null,
      ),
      meta,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error), { cause: error })
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    const response = await api.patch<ApiEnvelope<unknown> | undefined>(
      `/notificaciones/${encodeURIComponent(id)}/leer`,
    )
    if (
      response.data &&
      response.data.success === false
    ) {
      throw new Error(
        response.data.message ||
          "No se pudo marcar la notificación como leída.",
      )
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error), { cause: error })
  }
}

export async function markAllNotificationsRead(): Promise<number> {
  try {
    const response = await api.patch<ApiEnvelope<unknown>>(
      "/notificaciones/leer-todas",
    )
    const data = response.data.data
    if (
      !response.data.success ||
      !isRecord(data) ||
      !isNonnegativeInteger(data.marcadasComoLeidas)
    ) {
      throw new Error(
        "El servicio devolvió una respuesta inválida al marcar las notificaciones.",
      )
    }

    return data.marcadasComoLeidas
  } catch (error) {
    throw new Error(getApiErrorMessage(error), { cause: error })
  }
}
