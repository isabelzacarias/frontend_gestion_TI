export interface UserFormDraft extends Record<string, unknown> {
  id: string
  nombre: string
  email: string
  password: string
  departamentoId: string
  ubicacionId: string
  puestoId: string
  tipoUsuarioId: string
  rolId: string
  activo: boolean
  fechaInicio: string
  fechaFin: string
}
