import { create } from "zustand"

import type {
  IncidentNotification,
  NotificationConnectionStatus,
} from "@/features/notifications/types/notification"

interface NotificationsState {
  notifications: IncidentNotification[]
  connectionStatus: NotificationConnectionStatus
  addNotification: (notification: IncidentNotification) => boolean
  clearNotifications: () => void
  setConnectionStatus: (status: NotificationConnectionStatus) => void
}

const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  connectionStatus: "idle",
  addNotification(notification) {
    if (get().notifications.some(({ id }) => id === notification.id)) {
      return false
    }

    set((state) => ({
      notifications: [notification, ...state.notifications],
    }))
    return true
  },
  clearNotifications() {
    set({ notifications: [] })
  },
  setConnectionStatus(connectionStatus) {
    set({ connectionStatus })
  },
}))

export { useNotificationsStore }
