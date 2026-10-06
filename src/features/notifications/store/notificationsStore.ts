import { create } from "zustand"

import {
  listUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/services/notifications.service"
import type {
  IncidentNotification,
  NotificationConnectionStatus,
  NotificationsMeta,
  PersistedNotification,
} from "@/features/notifications/types/notification"

const PAGE_LIMIT = 20

interface NotificationsState {
  notifications: PersistedNotification[]
  connectionStatus: NotificationConnectionStatus
  noLeidas: number
  page: number
  totalPages: number
  isLoading: boolean
  loadingMore: boolean
  loadError: string | null
  pendingReadIds: string[]
  isMarkingAllRead: boolean
  processedNotificationIds: string[]
  pendingSocketNotificationIds: string[]
  addSocketNotification: (notification: IncidentNotification) => boolean
  loadUnread: (options?: { append?: boolean }) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  reset: () => void
  setConnectionStatus: (status: NotificationConnectionStatus) => void
}

const initialState = {
  notifications: [],
  connectionStatus: "idle" as const,
  noLeidas: 0,
  page: 0,
  totalPages: 0,
  isLoading: false,
  loadingMore: false,
  loadError: null,
  pendingReadIds: [],
  isMarkingAllRead: false,
  processedNotificationIds: [],
  pendingSocketNotificationIds: [],
}

function toPersistedNotification(
  event: IncidentNotification,
): PersistedNotification {
  return {
    id: event.notificacionId,
    incidenciaId: event.id,
    creadaEn: event.fechaNotificacion,
    leidaEn: null,
    leida: false,
    incidencia: {
      id: event.id,
      titulo: event.titulo,
      estado: event.estado,
      prioridad: event.prioridad,
      fechaNotificacion: event.fechaNotificacion,
    },
  }
}

function mergeNotifications(
  existing: PersistedNotification[],
  incoming: PersistedNotification[],
): PersistedNotification[] {
  const byId = new Map(existing.map((notification) => [notification.id, notification]))
  for (const notification of incoming) {
    byId.set(notification.id, notification)
  }
  return [...byId.values()].sort(
    (left, right) =>
      Date.parse(right.creadaEn) - Date.parse(left.creadaEn),
  )
}

const useNotificationsStore = create<NotificationsState>((set, get) => ({
  ...initialState,
  addSocketNotification(notification) {
    const id = notification.notificacionId
    if (get().processedNotificationIds.includes(id)) return false

    set((state) => ({
      notifications: mergeNotifications(state.notifications, [
        toPersistedNotification(notification),
      ]),
      noLeidas: state.noLeidas + 1,
      processedNotificationIds: [...state.processedNotificationIds, id],
      pendingSocketNotificationIds: [
        ...state.pendingSocketNotificationIds,
        id,
      ],
    }))
    return true
  },
  async loadUnread({ append = false } = {}) {
    const state = get()
    if (state.isLoading || state.loadingMore) return

    const nextPage = append ? state.page + 1 : 1
    if (append && nextPage > state.totalPages) return

    set({
      isLoading: !append,
      loadingMore: append,
      loadError: null,
    })

    try {
      const result = await listUnreadNotifications(nextPage, PAGE_LIMIT)
      set((currentState) => {
        const incomingIds = new Set(result.data.map(({ id }) => id))
        const unconfirmedSocketNotifications =
          currentState.notifications.filter(
            ({ id }) =>
              currentState.pendingSocketNotificationIds.includes(id) &&
              !incomingIds.has(id),
          )
        const pageNotifications = mergeNotifications(
          result.data,
          unconfirmedSocketNotifications,
        )
        const notifications = append
          ? mergeNotifications(currentState.notifications, pageNotifications)
          : pageNotifications

        return {
          notifications,
          noLeidas:
            result.meta.noLeidas + unconfirmedSocketNotifications.length,
          page: result.meta.page,
          totalPages: result.meta.totalPages,
          processedNotificationIds: [
            ...new Set([
              ...currentState.processedNotificationIds,
              ...result.data.map(({ id }) => id),
            ]),
          ],
          pendingSocketNotificationIds:
            currentState.pendingSocketNotificationIds.filter(
              (id) => !incomingIds.has(id),
            ),
        }
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las notificaciones."
      set({ loadError: message })
      throw error
    } finally {
      set({ isLoading: false, loadingMore: false })
    }
  },
  async markRead(id) {
    if (get().pendingReadIds.includes(id)) return
    set((state) => ({ pendingReadIds: [...state.pendingReadIds, id] }))

    try {
      await markNotificationRead(id)
      set((state) => {
        const wasUnread = state.notifications.some(
          (notification) => notification.id === id && !notification.leida,
        )
        return {
          notifications: state.notifications.filter(
            (notification) => notification.id !== id,
          ),
          noLeidas: Math.max(0, state.noLeidas - (wasUnread ? 1 : 0)),
        }
      })
    } finally {
      set((state) => ({
        pendingReadIds: state.pendingReadIds.filter(
          (pendingId) => pendingId !== id,
        ),
      }))
    }
  },
  async markAllRead() {
    if (get().isMarkingAllRead) return
    const notificationIdsAtRequest = new Set(
      get().notifications.map(({ id }) => id),
    )
    set({ isMarkingAllRead: true })

    try {
      const markedCount = await markAllNotificationsRead()
      set((state) => ({
        notifications: state.notifications.filter(
          ({ id }) => !notificationIdsAtRequest.has(id),
        ),
        noLeidas: Math.max(0, state.noLeidas - markedCount),
      }))
    } finally {
      set({ isMarkingAllRead: false })
    }
  },
  reset() {
    set(initialState)
  },
  setConnectionStatus(connectionStatus) {
    set({ connectionStatus })
  },
}))

export { useNotificationsStore }
export type { NotificationsMeta }
