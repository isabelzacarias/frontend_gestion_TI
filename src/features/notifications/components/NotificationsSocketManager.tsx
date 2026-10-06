import { useEffect, useRef } from "react"
import { toast } from "sonner"

import { connectNotificationSocket } from "@/features/notifications/services/notification-socket"
import { useNotificationsStore } from "@/features/notifications/store/notificationsStore"
import { useAuthStore } from "@/store/authStore"

function NotificationsSocketManager() {
  const token = useAuthStore((state) => state.token)
  const authStatus = useAuthStore((state) => state.status)
  const previousToken = useRef<string | null>(null)

  useEffect(() => {
    const { clearNotifications, setConnectionStatus } =
      useNotificationsStore.getState()

    if (authStatus !== "authenticated" || !token) {
      previousToken.current = null
      clearNotifications()
      setConnectionStatus("idle")
      return
    }

    if (previousToken.current && previousToken.current !== token) {
      clearNotifications()
    }
    previousToken.current = token
    setConnectionStatus("connecting")

    try {
      return connectNotificationSocket(token, {
        onConnect() {
          setConnectionStatus("connected")
        },
        onDisconnect(_reason, willReconnect) {
          setConnectionStatus(willReconnect ? "reconnecting" : "disconnected")
        },
        onConnectError(message) {
          console.error("No se pudo conectar a notificaciones:", message)
          setConnectionStatus("reconnecting")
        },
        onNewIncident(notification) {
          const added = useNotificationsStore
            .getState()
            .addNotification(notification)
          if (added) {
            toast.info("Nueva incidencia", {
              description: notification.titulo,
            })
          }
        },
      })
    } catch (error) {
      console.error("No se pudo iniciar la conexión de notificaciones.", error)
      setConnectionStatus("disconnected")
    }
  }, [authStatus, token])

  return null
}

export { NotificationsSocketManager }
