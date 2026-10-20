import type {
  AuditAction,
  AuditModule,
  AuditResult,
} from "@/features/audit/types/audit"

export const AUDIT_MODULE_LABELS: Record<AuditModule, string> = {
  TICKETS: "Tickets",
  INVENTARIO: "Inventario",
  LICENCIAS: "Licencias",
  CONTRASENAS: "Contraseñas",
  ASIGNACIONES: "Asignaciones",
  USUARIOS: "Usuarios",
  MANTENIMIENTO: "Mantenimiento",
  AUTENTICACION: "Autenticación",
  AUDITORIA: "Auditoría",
}

export const AUDIT_MODULE_BADGE_CLASS: Record<AuditModule, string> = {
  TICKETS: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  INVENTARIO:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  LICENCIAS:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CONTRASENAS:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  ASIGNACIONES:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  USUARIOS:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  MANTENIMIENTO:
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  AUTENTICACION:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  AUDITORIA:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREAR: "Crear",
  ACTUALIZAR: "Actualizar",
  ELIMINAR: "Eliminar",
  IMPORTAR: "Importar",
  CONSULTAR: "Consultar",
  LOGIN: "Inicio de sesión",
  LOGOUT: "Cierre de sesión",
}

export const AUDIT_ACTION_BADGE_CLASS: Record<AuditAction, string> = {
  CREAR:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  ACTUALIZAR:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ELIMINAR:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  IMPORTAR:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  CONSULTAR:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  LOGIN: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  LOGOUT:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
}

export const AUDIT_RESULT_LABELS: Record<AuditResult, string> = {
  EXITO: "Exitoso",
  FALLO: "Fallido",
}

export const AUDIT_RESULT_BADGE_CLASS: Record<AuditResult, string> = {
  EXITO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  FALLO: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}
