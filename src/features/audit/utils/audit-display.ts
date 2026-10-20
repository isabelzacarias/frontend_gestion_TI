import type {
  AccionAuditoria,
  ModuloAuditoria,
} from "@/features/audit/types/audit"

export const AUDIT_MODULE_LABELS: Record<ModuloAuditoria, string> = {
  SECRETOS: "Secretos",
  ACTIVOS: "Activos",
  USUARIOS: "Usuarios",
  ROLES: "Roles",
  CATALOGOS: "Catálogos",
  LICENCIAS: "Licencias",
  INCIDENCIAS: "Incidencias",
  ASIGNACIONES: "Asignaciones",
  IMPORTACIONES: "Importaciones",
  MANTENIMIENTO: "Mantenimiento",
}

export const AUDIT_MODULE_BADGE_CLASS: Record<ModuloAuditoria, string> = {
  SECRETOS:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  ACTIVOS:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  USUARIOS:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  ROLES:
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  CATALOGOS:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  LICENCIAS:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  INCIDENCIAS:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ASIGNACIONES:
    "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  IMPORTACIONES:
    "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
  MANTENIMIENTO:
    "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400",
}

export const AUDIT_ACTION_LABELS: Record<AccionAuditoria, string> = {
  CREAR: "Crear",
  ACTUALIZAR: "Actualizar",
  DESACTIVAR: "Desactivar",
  REVELAR: "Revelar",
  IMPORTAR: "Importar",
  ASIGNAR: "Asignar",
  DEVOLVER: "Devolver",
  ELIMINAR: "Eliminar",
}

export const AUDIT_ACTION_BADGE_CLASS: Record<AccionAuditoria, string> = {
  CREAR:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  ACTUALIZAR:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  DESACTIVAR:
    "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400",
  REVELAR:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  IMPORTAR:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  ASIGNAR:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  DEVOLVER:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  ELIMINAR:
    "border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-300",
}
