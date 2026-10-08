import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"

import type {
  IncidentNotification,
  LicenseNotification,
} from "@/features/notifications/types/notification"

interface NotificationSocketHandlers {
  onConnect: () => void
  onDisconnect: (reason: string, willReconnect: boolean) => void
  onConnectError: (message: string) => void
  onNewIncident: (notification: IncidentNotification) => void
  onLicenseExpiring: (notification: LicenseNotification) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseIncidentNotification(
  value: unknown,
): IncidentNotification | null {
  if (
    !isRecord(value) ||
    !(
      (typeof value.id === "string" && value.id.trim().length > 0) ||
      (typeof value.id === "number" && Number.isFinite(value.id))
    ) ||
    !(
      (typeof value.notificacionId === "string" &&
        value.notificacionId.trim().length > 0) ||
      (typeof value.notificacionId === "number" &&
        Number.isFinite(value.notificacionId))
    ) ||
    typeof value.titulo !== "string" ||
    value.titulo.trim().length === 0 ||
    typeof value.estado !== "string" ||
    value.estado.trim().length === 0 ||
    typeof value.prioridad !== "string" ||
    value.prioridad.trim().length === 0 ||
    typeof value.fechaNotificacion !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T/.test(value.fechaNotificacion) ||
    !Number.isFinite(Date.parse(value.fechaNotificacion))
  ) {
    console.error(
      "Se recibió una notificación de incidencia con un formato inválido.",
    )
    return null
  }

  return {
    id: String(value.id),
    notificacionId: String(value.notificacionId),
    titulo: value.titulo,
    estado: value.estado,
    prioridad: value.prioridad,
    fechaNotificacion: value.fechaNotificacion,
  }
}

function parseLicenseNotification(
  value: unknown,
): LicenseNotification | null {
  if (
    !isRecord(value) ||
    !(
      (typeof value.notificacionId === "string" &&
        value.notificacionId.trim().length > 0) ||
      (typeof value.notificacionId === "number" &&
        Number.isFinite(value.notificacionId))
    ) ||
    !(
      (typeof value.licenciaId === "string" &&
        value.licenciaId.trim().length > 0) ||
      (typeof value.licenciaId === "number" &&
        Number.isFinite(value.licenciaId))
    ) ||
    typeof value.software !== "string" ||
    value.software.trim().length === 0 ||
    typeof value.fechaVencimiento !== "string" ||
    !Number.isFinite(Date.parse(value.fechaVencimiento)) ||
    typeof value.diasRestantes !== "number" ||
    !Number.isInteger(value.diasRestantes) ||
    typeof value.hitoDias !== "number" ||
    !Number.isInteger(value.hitoDias) ||
    typeof value.creadaEn !== "string" ||
    !Number.isFinite(Date.parse(value.creadaEn))
  ) {
    console.error(
      "Se recibió un recordatorio de licencia con un formato inválido.",
    )
    return null
  }

  return {
    notificacionId: String(value.notificacionId),
    licenciaId: String(value.licenciaId),
    software: value.software,
    fechaVencimiento: value.fechaVencimiento,
    diasRestantes: value.diasRestantes,
    hitoDias: value.hitoDias,
    creadaEn: value.creadaEn,
  }
}

function getSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"
  try {
    return new URL(apiUrl, window.location.origin).origin
  } catch (error) {
    throw new Error(
      "La URL de la API no permite determinar el servidor de notificaciones. Define VITE_SOCKET_URL.",
      { cause: error },
    )
  }
}

export function connectNotificationSocket(
  token: string,
  handlers: NotificationSocketHandlers,
): () => void {
  const socket: Socket = io(getSocketUrl(), {
    auth: { token },
    autoConnect: false,
  })

  function handleDisconnect(reason: string) {
    handlers.onDisconnect(reason, socket.active)
  }

  function handleNewIncident(value: unknown) {
    const notification = parseIncidentNotification(value)
    if (notification) {
      handlers.onNewIncident(notification)
    }
  }

  function handleLicenseExpiring(value: unknown) {
    const notification = parseLicenseNotification(value)
    if (notification) {
      handlers.onLicenseExpiring(notification)
    }
  }

  socket.on("connect", handlers.onConnect)
  socket.on("disconnect", handleDisconnect)
  socket.on("connect_error", (error) => {
    handlers.onConnectError(error.message)
  })
  socket.on("incidencias:nueva", handleNewIncident)
  socket.on("licencias:por-vencer", handleLicenseExpiring)
  socket.connect()

  return () => {
    socket.off("connect", handlers.onConnect)
    socket.off("disconnect", handleDisconnect)
    socket.off("connect_error")
    socket.off("incidencias:nueva", handleNewIncident)
    socket.off("licencias:por-vencer", handleLicenseExpiring)
    socket.disconnect()
  }
}
