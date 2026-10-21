export type EstadoProyecto =
  | "PLANIFICADO"
  | "EN_PROGRESO"
  | "PAUSADO"
  | "COMPLETADO"
  | "CANCELADO"

export type Prioridad = "BAJA" | "NORMAL" | "ALTA" | "CRITICA"

export type RolProyecto = "LIDER" | "DESARROLLADOR" | "QA" | "STAKEHOLDER"

export type EstadoTarea =
  | "PENDIENTE"
  | "EN_PROGRESO"
  | "COMPLETADA"
  | "CANCELADA"

export type EstadoHito = "PENDIENTE" | "COMPLETADO" | "CANCELADO"

export interface UsuarioResumen {
  id: string
  nombre: string
  email: string | null
}

export interface DepartamentoResumen {
  id: number
  nombre: string
}

export interface Proyecto {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  estado: EstadoProyecto
  prioridad: Prioridad
  fechaInicio: string
  fechaFinPlanificada: string
  fechaFinReal: string | null
  presupuesto: number | null
  activo: boolean
  responsable: UsuarioResumen
  departamento: DepartamentoResumen | null
  createdAt: string
  updatedAt: string
}

export interface ProyectoMiembro {
  proyectoId: number
  usuarioId: string
  rol: RolProyecto
  usuario: UsuarioResumen
  createdAt: string
}

export interface ResumenTareasProyecto {
  total: number
  completadas: number
  pendientes: number
  enProgreso: number
  canceladas: number
  subtareasTotal: number
  subtareasCompletadas: number
}

export interface ResumenHorasProyecto {
  totalHoras: number
  totalRegistros: number
}

export interface ProyectoDetalle extends Proyecto {
  miembros: ProyectoMiembro[]
  progreso: number
  resumenTareas: ResumenTareasProyecto
  resumenHoras: ResumenHorasProyecto
}

export interface Tarea {
  id: number
  proyectoId: number
  parentId: number | null
  titulo: string
  descripcion: string | null
  estado: EstadoTarea
  prioridad: Prioridad
  asignadoAId: string | null
  asignadoA: UsuarioResumen | null
  fechaInicio: string | null
  fechaVencimiento: string | null
  fechaCompletada: string | null
  orden: number
  activo: boolean
  subtareas: Tarea[]
  createdAt: string
  updatedAt: string
}

export interface TareaDependencia {
  id: number
  titulo: string
  estado: EstadoTarea
  parentId: number | null
}

export interface DependenciasTarea {
  dependeDe: TareaDependencia[]
  dependientes: TareaDependencia[]
}

export interface Hito {
  id: number
  proyectoId: number
  titulo: string
  descripcion: string | null
  estado: EstadoHito
  fechaPlanificada: string
  fechaCompletada: string | null
  orden: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface RegistroHoras {
  id: number
  proyectoId: number
  tareaId: number | null
  tarea: { id: number; titulo: string } | null
  usuarioId: string
  usuario: UsuarioResumen
  fecha: string
  horas: number
  descripcion: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface ParametrosListadoProyectos {
  page?: number
  limit?: number
  q?: string
  estado?: EstadoProyecto
  prioridad?: Prioridad
  responsableId?: string
  departamentoId?: number
  activo?: boolean
}

export interface ParametrosListadoTareas {
  page?: number
  limit?: number
  q?: string
  estado?: EstadoTarea
  prioridad?: Prioridad
  asignadoAId?: string
}

export interface ParametrosListadoHoras {
  page?: number
  limit?: number
  tareaId?: number
  usuarioId?: string
  desde?: string
  hasta?: string
}

export interface DatosCreacionProyecto {
  nombre: string
  descripcion: string | null
  estado: EstadoProyecto
  prioridad: Prioridad
  fechaInicio: string
  fechaFinPlanificada: string
  fechaFinReal: string | null
  presupuesto: number | null
  responsableId: string
  departamentoId: number | null
}

export interface DatosEdicionProyecto
  extends Partial<DatosCreacionProyecto> {
  activo?: boolean
}

export interface DatosMiembro {
  usuarioId: string
  rol: RolProyecto
}

export interface DatosCreacionTarea {
  titulo: string
  descripcion: string | null
  estado: EstadoTarea
  prioridad: Prioridad
  parentId: number | null
  asignadoAId: string | null
  fechaInicio: string | null
  fechaVencimiento: string | null
  fechaCompletada: string | null
  orden: number
}

export interface DatosEdicionTarea {
  titulo?: string
  descripcion?: string | null
  estado?: EstadoTarea
  prioridad?: Prioridad
  asignadoAId?: string | null
  fechaInicio?: string | null
  fechaVencimiento?: string | null
  fechaCompletada?: string | null
  orden?: number
}

export interface DatosCreacionHito {
  titulo: string
  descripcion: string | null
  estado: EstadoHito
  fechaPlanificada: string
  fechaCompletada: string | null
  orden: number
}

export interface DatosEdicionHito {
  titulo?: string
  descripcion?: string | null
  estado?: EstadoHito
  fechaPlanificada?: string
  fechaCompletada?: string | null
  orden?: number
}

export interface DatosCreacionHoras {
  tareaId: number | null
  usuarioId: string
  fecha: string
  horas: number
  descripcion: string | null
}

export interface DatosEdicionHoras {
  tareaId?: number | null
  usuarioId?: string
  fecha?: string
  horas?: number
  descripcion?: string | null
}

export interface ProjectFormDraft extends Record<string, unknown> {
  nombre: string
  descripcion: string
  estado: string
  prioridad: string
  fechaInicio: string
  fechaFinPlanificada: string
  fechaFinReal: string
  presupuesto: string
  responsableId: string
  departamentoId: string
}

export interface MemberFormDraft extends Record<string, unknown> {
  usuarioId: string
  rol: string
}

export interface TaskFormDraft extends Record<string, unknown> {
  titulo: string
  descripcion: string
  estado: string
  prioridad: string
  asignadoAId: string
  fechaInicio: string
  fechaVencimiento: string
  fechaCompletada: string
  orden: string
}

export interface MilestoneFormDraft extends Record<string, unknown> {
  titulo: string
  descripcion: string
  estado: string
  fechaPlanificada: string
  fechaCompletada: string
  orden: string
}

export interface HoursFormDraft extends Record<string, unknown> {
  tareaId: string
  usuarioId: string
  fecha: string
  horas: string
  descripcion: string
}
