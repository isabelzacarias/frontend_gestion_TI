import { create } from "zustand"

import type {
  MaintenanceDeletedEvent,
  MaintenanceSocketEvent,
} from "@/features/maintenance/types/maintenance"

export type MaintenanceSyncEvent =
  | { tipo: "creado"; mantenimiento: MaintenanceSocketEvent }
  | { tipo: "actualizado"; mantenimiento: MaintenanceSocketEvent }
  | { tipo: "eliminado"; eliminado: MaintenanceDeletedEvent }
  | { tipo: "resync" }

interface MantenimientoSyncState {
  lastEvent: MaintenanceSyncEvent | null
  publishEvent: (event: MaintenanceSyncEvent) => void
}

const useMantenimientoSyncStore = create<MantenimientoSyncState>((set) => ({
  lastEvent: null,
  publishEvent(event) {
    set({ lastEvent: event })
  },
}))

export { useMantenimientoSyncStore }
