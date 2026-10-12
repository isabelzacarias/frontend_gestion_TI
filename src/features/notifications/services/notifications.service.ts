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

export class NotificationsApiError extends Error {
  readonly status?: number

  constructor(
    message: string,
    status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "NotificationsApiError"
    this.status = status
  }
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

function isValidCalendarDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}

function isId(value: unknown): value is string | number {
  return (
    (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "number" && Number.isFinite(value))
  )
}

function parseIncidentSummary(
  value: unknown,
): PersistedNotification["incidencia"] | null {
  if (
    isRecord(value) &&
    isId(value.id) &&
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

function parseLicenseSummary(
  value: unknown,
): PersistedNotification["licencia"] | null {
  if (
    isRecord(value) &&
    isId(value.id) &&
    typeof value.software === "string" &&
    typeof value.proveedor === "string" &&
    isValidCalendarDate(value.fechaVencimiento)
  ) {
    return {
      id: String(value.id),
      software: value.software,
      proveedor: value.proveedor,
      fechaVencimiento: value.fechaVencimiento,
    }
  }
  return null
}

function parsePersistedNotification(
  value: unknown,
): PersistedNotification | null {
  if (
    !isRecord(value) ||
    !isId(value.id) ||
    !(
      value.incidenciaId === null ||
      value.incidenciaId === undefined ||
      isId(value.incidenciaId)
    ) ||
    !(
      value.licenciaId === null ||
      value.licenciaId === undefined ||
      isId(value.licenciaId)
    ) ||
    !isValidDate(value.creadaEn) ||
    (value.leidaEn !== null && !isValidDate(value.leidaEn)) ||
    typeof value.leida !== "boolean" ||
    (value.hitoDias !== null &&
      value.hitoDias !== undefined &&
      !isNonnegativeInteger(value.hitoDias))
  ) {
    return null
  }

  const tipo = value.tipo
  if (tipo !== "INCIDENCIA_NUEVA" && tipo !== "LICENCIA_POR_VENCER") {
    return null
  }

  const incidencia =
    value.incidencia === null || value.incidencia === undefined
      ? null
      : parseIncidentSummary(value.incidencia)
  const licencia =
    value.licencia === null || value.licencia === undefined
      ? null
      : parseLicenseSummary(value.licencia)

  if (
    (tipo === "INCIDENCIA_NUEVA" && (!incidencia || licencia !== null)) ||
    (tipo === "LICENCIA_POR_VENCER" && (!licencia || incidencia !== null)) ||
    (tipo === "INCIDENCIA_NUEVA" &&
      (!isId(value.incidenciaId) ||
        value.licenciaId !== null ||
        (value.hitoDias !== null && value.hitoDias !== undefined))) ||
    (tipo === "LICENCIA_POR_VENCER" &&
      (!isId(value.licenciaId) ||
        value.incidenciaId !== null ||
        !isNonnegativeInteger(value.hitoDias)))
  ) {
    return null
  }

  const base = {
    id: String(value.id),
    creadaEn: value.creadaEn,
    leidaEn: value.leidaEn,
    leida: value.leida,
  }
  if (tipo === "INCIDENCIA_NUEVA" && incidencia && isId(value.incidenciaId)) {
    return {
      ...base,
      tipo,
      incidenciaId: String(value.incidenciaId),
      licenciaId: null,
      hitoDias: null,
      incidencia,
      licencia: null,
    }
  }
  if (
    tipo === "LICENCIA_POR_VENCER" &&
    licencia &&
    isId(value.licenciaId) &&
    isNonnegativeInteger(value.hitoDias)
  ) {
    return {
      ...base,
      tipo,
      incidenciaId: null,
      licenciaId: String(value.licenciaId),
      hitoDias: value.hitoDias,
      incidencia: null,
      licencia,
    }
  }
  return null
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

function toNotificationsApiError(error: unknown): NotificationsApiError {
  if (error instanceof NotificationsApiError) return error
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  return new NotificationsApiError(getApiErrorMessage(error), status, {
    cause: error,
  })
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
    throw toNotificationsApiError(error)
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
    throw toNotificationsApiError(error)
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
    throw toNotificationsApiError(error)
  }
}
