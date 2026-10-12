import { create } from "zustand"

import type { IncidentStatusChange } from "@/features/notifications/types/notification"

interface IncidenciasSyncState {
  lastChange: IncidentStatusChange | null
  publishChange: (change: IncidentStatusChange) => void
}

const useIncidenciasSyncStore = create<IncidenciasSyncState>((set) => ({
  lastChange: null,
  publishChange(change) {
    set({ lastChange: change })
  },
}))

export { useIncidenciasSyncStore }
