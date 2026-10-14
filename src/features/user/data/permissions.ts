import type { MultiSelectOption } from "@/components/ui/multi-select"

/**
 * Catálogo de permisos disponibles en el backend.
 * Debe permanecer sincronizado con `PERMISOS_DISPONIBLES` de
 * `backend_gestion_TI/src/models/rol.model.ts`.
 */
export const PERMISO_VALUES = [
  "incidencias:leer",
  "incidencias:crear",
  "incidencias:editar",
  "notificaciones:leer",
  "dashboard:leer",
  "activos:leer",
  "activos:crear",
  "activos:editar",
  "activos:estado",
  "activos:asignar",
  "activos:eliminar",
  "usuarios:administrar",
  "roles:administrar",
  "catalogos:administrar",
  "licencias:administrar",
  "licencias:eliminar",
  "secretos:leer",
  "secretos:revelar",
  "secretos:administrar",
  "secretos:importar",
  "secretos:eliminar",
  "auditoria:leer",
] as const

export type Permiso = (typeof PERMISO_VALUES)[number]

const PERMISO_LABELS: Record<Permiso, string> = {
  "incidencias:leer": "Ver incidencias",
  "incidencias:crear": "Crear incidencias",
  "incidencias:editar": "Editar incidencias",
  "notificaciones:leer": "Ver notificaciones",
  "dashboard:leer": "Ver dashboard",
  "activos:leer": "Ver activos",
  "activos:crear": "Crear activos",
  "activos:editar": "Editar activos",
  "activos:estado": "Cambiar estado de activos",
  "activos:asignar": "Asignar activos",
  "activos:eliminar": "Eliminar activos",
  "usuarios:administrar": "Administrar usuarios",
  "roles:administrar": "Administrar roles",
  "catalogos:administrar": "Administrar catálogos",
  "licencias:administrar": "Administrar licencias",
  "licencias:eliminar": "Eliminar licencias",
  "secretos:leer": "Ver secretos",
  "secretos:revelar": "Revelar secretos",
  "secretos:administrar": "Administrar secretos",
  "secretos:importar": "Importar secretos",
  "secretos:eliminar": "Eliminar secretos",
  "auditoria:leer": "Ver auditoría",
}

export const PERMISO_OPTIONS: MultiSelectOption[] = PERMISO_VALUES.map(
  (value) => ({ value, label: PERMISO_LABELS[value] }),
)

export function permisoLabel(value: string): string {
  return value in PERMISO_LABELS
    ? PERMISO_LABELS[value as Permiso]
    : value
}
