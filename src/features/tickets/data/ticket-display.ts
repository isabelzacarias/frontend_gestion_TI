import type {
  TicketEstado,
  TicketPrioridad,
  TipoRequerimiento,
} from "@/features/tickets/types/ticket"

export const estadoClasses: Record<TicketEstado, string> = {
  NUEVO: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold",
  EN_ANALISIS:
    "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold",
  EN_CURSO:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold",
  COMPLETADO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
  DUPLICADO:
    "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 font-semibold",
}

export const estadoLabels: Record<TicketEstado, string> = {
  NUEVO: "Nuevo",
  EN_ANALISIS: "En análisis",
  EN_CURSO: "En curso",
  COMPLETADO: "Completado",
  DUPLICADO: "Duplicado",
}

export const ESTADOS: TicketEstado[] = [
  "NUEVO",
  "EN_ANALISIS",
  "EN_CURSO",
  "COMPLETADO",
  "DUPLICADO",
]

export const prioridadClasses: Record<TicketPrioridad, string> = {
  BAJA: "border border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300 font-medium",
  NORMAL:
    "border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium",
  ALTA: "border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold",
  CRITICA:
    "border border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold",
}

export const prioridadLabels: Record<TicketPrioridad, string> = {
  BAJA: "Baja",
  NORMAL: "Normal",
  ALTA: "Alta",
  CRITICA: "Crítica",
}

export const PRIORIDADES: TicketPrioridad[] = ["BAJA", "NORMAL", "ALTA", "CRITICA"]

export const reqClasses: Record<TipoRequerimiento, string> = {
  NETSUITE:
    "border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300",
  OTROS: "border border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  OFFICE: "border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300",
  EMAIL: "border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
  IMPRESION:
    "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  ERROR_EN_EQUIPO:
    "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  SOLICITUD_DE_EQUIPO:
    "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  INTRANET: "border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300",
  CONEXION_DE_RED:
    "border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
}

export const tipoLabels: Record<TipoRequerimiento, string> = {
  NETSUITE: "NetSuite",
  OTROS: "Otros",
  OFFICE: "Office",
  EMAIL: "Email",
  IMPRESION: "Impresión",
  ERROR_EN_EQUIPO: "Error en equipo",
  SOLICITUD_DE_EQUIPO: "Solicitud de equipo",
  INTRANET: "Intranet",
  CONEXION_DE_RED: "Conexión de red",
}

export const TIPOS: TipoRequerimiento[] = [
  "NETSUITE",
  "OTROS",
  "OFFICE",
  "EMAIL",
  "IMPRESION",
  "ERROR_EN_EQUIPO",
  "SOLICITUD_DE_EQUIPO",
  "INTRANET",
  "CONEXION_DE_RED",
]
