import type {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "@/features/maintenance/types/maintenance"

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVO: "Preventivo",
  CORRECTIVO: "Correctivo",
}

export const MAINTENANCE_TYPE_BADGE_CLASS: Record<MaintenanceType, string> = {
  PREVENTIVO:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  CORRECTIVO:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PROGRAMADO: "Programado",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
}

export const MAINTENANCE_STATUS_BADGE_CLASS: Record<MaintenanceStatus, string> = {
  PROGRAMADO:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  EN_PROCESO:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETADO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELADO:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
}

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
}

export const MAINTENANCE_PRIORITY_BADGE_CLASS: Record<
  MaintenancePriority,
  string
> = {
  BAJA: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  MEDIA:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ALTA: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}
