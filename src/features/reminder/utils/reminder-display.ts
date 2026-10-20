import type {
  PrioridadRecordatorio,
  Recordatorio,
} from "@/features/reminder/types/reminder"

export const PRIORIDADES_RECORDATORIO: PrioridadRecordatorio[] = [
  "BAJA",
  "MEDIA",
  "ALTA",
]

export const PRIORIDAD_LABELS: Record<PrioridadRecordatorio, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
}

export const PRIORIDAD_BADGE_CLASS: Record<PrioridadRecordatorio, string> = {
  BAJA: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  MEDIA:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ALTA: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

export type EstadoRecordatorio = "COMPLETADO" | "VENCIDO" | "PENDIENTE"

export const ESTADO_RECORDATORIO_LABELS: Record<EstadoRecordatorio, string> = {
  COMPLETADO: "Completado",
  VENCIDO: "Vencido",
  PENDIENTE: "Pendiente",
}

export const ESTADO_RECORDATORIO_BADGE_CLASS: Record<
  EstadoRecordatorio,
  string
> = {
  COMPLETADO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  VENCIDO:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  PENDIENTE:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export function esFechaVencida(fecha: string | null): boolean {
  if (!fecha) return false
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}

export function estadoRecordatorio(
  recordatorio: Pick<Recordatorio, "fecha" | "completado">,
): EstadoRecordatorio {
  if (recordatorio.completado) return "COMPLETADO"
  return esFechaVencida(recordatorio.fecha) ? "VENCIDO" : "PENDIENTE"
}

export function formatFechaRecordatorio(fecha: string | null): string {
  if (!fecha) return "Sin fecha"
  const [year, month, day] = fecha.slice(0, 10).split("-")
  if (!year || !month || !day) return fecha
  return `${day}/${month}/${year}`
}
