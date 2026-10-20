export type AuditModule =
  | "TICKETS"
  | "INVENTARIO"
  | "LICENCIAS"
  | "CONTRASENAS"
  | "ASIGNACIONES"
  | "USUARIOS"
  | "MANTENIMIENTO"
  | "AUTENTICACION"
  | "AUDITORIA"

export type AuditAction =
  | "CREAR"
  | "ACTUALIZAR"
  | "ELIMINAR"
  | "IMPORTAR"
  | "CONSULTAR"
  | "LOGIN"
  | "LOGOUT"

export type AuditResult = "EXITO" | "FALLO"

export interface AuditEvent {
  id: number
  fecha: string
  usuarioNombre: string
  usuarioEmail: string
  rol: string
  modulo: AuditModule
  accion: AuditAction
  entidad: string
  descripcion: string
  ip: string
  userAgent: string
  resultado: AuditResult
  valoresAnteriores: Record<string, string> | null
  valoresNuevos: Record<string, string> | null
}
