export type ModuloAuditoria =
  | "SECRETOS"
  | "ACTIVOS"
  | "USUARIOS"
  | "ROLES"
  | "CATALOGOS"
  | "LICENCIAS"
  | "INCIDENCIAS"
  | "ASIGNACIONES"
  | "IMPORTACIONES"
  | "MANTENIMIENTO"

export type AccionAuditoria =
  | "CREAR"
  | "ACTUALIZAR"
  | "DESACTIVAR"
  | "REVELAR"
  | "IMPORTAR"
  | "ASIGNAR"
  | "DEVOLVER"
  | "ELIMINAR"

export interface AuditoriaUsuario {
  id: string
  nombre: string
}

export interface AuditoriaGlobal {
  id: number
  modulo: ModuloAuditoria
  accion: AccionAuditoria
  entidadId: string | null
  detalle: unknown | null
  realizadaEn: string
  usuario: AuditoriaUsuario
}

export interface ParametrosListadoAuditoria {
  page?: number
  limit?: number
  modulo?: ModuloAuditoria
  accion?: AccionAuditoria
  usuarioId?: string
  entidadId?: string
  desde?: string
  hasta?: string
  q?: string
}
