import type {
  EstadoHito,
  EstadoProyecto,
  EstadoTarea,
  Prioridad,
  RolProyecto,
} from "@/features/projects/types/project"

export const ESTADOS_PROYECTO: EstadoProyecto[] = [
  "PLANIFICADO",
  "EN_PROGRESO",
  "PAUSADO",
  "COMPLETADO",
  "CANCELADO",
]

export const PRIORIDADES: Prioridad[] = ["BAJA", "NORMAL", "ALTA", "CRITICA"]

export const ESTADOS_TAREA: EstadoTarea[] = [
  "PENDIENTE",
  "EN_PROGRESO",
  "COMPLETADA",
  "CANCELADA",
]

export const ESTADOS_HITO: EstadoHito[] = [
  "PENDIENTE",
  "COMPLETADO",
  "CANCELADO",
]

export const ROLES_PROYECTO: RolProyecto[] = [
  "LIDER",
  "DESARROLLADOR",
  "QA",
  "STAKEHOLDER",
]

export const ESTADO_PROYECTO_LABELS: Record<EstadoProyecto, string> = {
  PLANIFICADO: "Planificado",
  EN_PROGRESO: "En progreso",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
}

export const ESTADO_PROYECTO_BADGE_CLASS: Record<EstadoProyecto, string> = {
  PLANIFICADO:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  EN_PROGRESO:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  PAUSADO:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETADO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELADO:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
}

export const ESTADO_PROYECTO_DOT_CLASS: Record<EstadoProyecto, string> = {
  PLANIFICADO: "bg-violet-500",
  EN_PROGRESO: "bg-cyan-500",
  PAUSADO: "bg-amber-500",
  COMPLETADO: "bg-emerald-500",
  CANCELADO: "bg-slate-400",
}

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  BAJA: "Baja",
  NORMAL: "Normal",
  ALTA: "Alta",
  CRITICA: "Crítica",
}

export const PRIORIDAD_BADGE_CLASS: Record<Prioridad, string> = {
  BAJA: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  NORMAL:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  ALTA: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CRITICA: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

export const ESTADO_TAREA_LABELS: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
}

export const ESTADO_TAREA_BADGE_CLASS: Record<EstadoTarea, string> = {
  PENDIENTE:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  EN_PROGRESO:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETADA:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELADA:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

export const ESTADO_HITO_LABELS: Record<EstadoHito, string> = {
  PENDIENTE: "Pendiente",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
}

export const ESTADO_HITO_BADGE_CLASS: Record<EstadoHito, string> = {
  PENDIENTE:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETADO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CANCELADO:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
}

export const ROL_PROYECTO_LABELS: Record<RolProyecto, string> = {
  LIDER: "Líder",
  DESARROLLADOR: "Desarrollador",
  QA: "QA",
  STAKEHOLDER: "Stakeholder",
}

export const ROL_PROYECTO_BADGE_CLASS: Record<RolProyecto, string> = {
  LIDER:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  DESARROLLADOR:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  QA: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  STAKEHOLDER:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
}

const TRANSICIONES_PROYECTO: Record<EstadoProyecto, EstadoProyecto[]> = {
  PLANIFICADO: ["PLANIFICADO", "EN_PROGRESO", "CANCELADO"],
  EN_PROGRESO: ["EN_PROGRESO", "PAUSADO", "COMPLETADO", "CANCELADO"],
  PAUSADO: ["PAUSADO", "EN_PROGRESO", "CANCELADO"],
  COMPLETADO: ["COMPLETADO"],
  CANCELADO: ["CANCELADO"],
}

export function estadosProyectoPermitidos(
  estadoActual: EstadoProyecto,
): EstadoProyecto[] {
  return TRANSICIONES_PROYECTO[estadoActual]
}

export function toDateInput(value: string | null): string {
  if (!value) return ""
  return value.slice(0, 10)
}

export function formatFecha(value: string | null): string {
  if (!value) return "—"
  const [year, month, day] = value.slice(0, 10).split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function formatPresupuesto(value: number | null): string {
  if (value === null) return "—"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatHoras(value: number): string {
  return `${new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 2,
  }).format(value)} h`
}

export function nombreUsuario(
  usuario: { nombre: string } | null | undefined,
): string {
  return usuario?.nombre ?? "Sin asignar"
}
