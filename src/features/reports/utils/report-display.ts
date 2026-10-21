import type {
  ReporteApiError,
} from "@/features/reports/services/reporte.service"
import type {
  FormatoReporte,
  ReporteGeneracion,
  ReporteMetadata,
} from "@/features/reports/types/report"

export const FORMATO_LABELS: Record<FormatoReporte, string> = {
  xlsx: "XLSX",
  csv: "CSV",
  pdf: "PDF",
}

export const ESTADO_GENERACION_LABELS: Record<
  ReporteGeneracion["estado"],
  string
> = {
  PENDIENTE: "Pendiente",
  GENERANDO: "Generando",
  COMPLETADO: "Completado",
  FALLIDO: "Fallido",
}

export const ESTADO_GENERACION_BADGE_CLASS: Record<
  ReporteGeneracion["estado"],
  string
> = {
  PENDIENTE:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  GENERANDO:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  COMPLETADO:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  FALLIDO:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

export const REPORTES_CON_PERIODO = new Set([
  "mantenimientos-periodo",
  "incidencias-periodo",
  "auditoria-periodo",
  "ejecutivo-mensual",
])

const ETIQUETAS_CAMPO: Record<string, string> = {
  estado: "Estado",
  tipo: "Tipo",
  sucursal: "Sucursal",
  q: "Búsqueda",
  vigencia: "Vigencia",
  dias: "Días de aviso",
  activa: "Activa",
  activo: "Activo",
  proveedor: "Proveedor",
  desde: "Desde",
  hasta: "Hasta",
  prioridad: "Prioridad",
  tecnicoId: "ID del técnico",
  activoId: "ID del activo",
  responsableId: "ID del responsable",
  departamentoId: "ID del departamento",
  tipoRequerimiento: "Tipo de requerimiento",
  solicitanteId: "ID del solicitante",
  asignadoAId: "ID del usuario asignado",
  modulo: "Módulo",
  accion: "Acción",
  usuarioId: "ID del usuario",
  entidadId: "ID de la entidad",
  rolId: "ID del rol",
  ubicacionId: "ID de la ubicación",
  puestoId: "ID del puesto",
  tipoUsuarioId: "ID del tipo de usuario",
}

const ETIQUETAS_OPCION: Record<string, string> = {
  EN_USO: "En uso",
  EN_ALMACEN: "En almacén",
  EN_MANTENIMIENTO: "En mantenimiento",
  DE_BAJA: "De baja",
  PLANIFICADO: "Planificado",
  EN_PROGRESO: "En progreso",
  PAUSADO: "Pausado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
  PROGRAMADO: "Programado",
  EN_PROCESO: "En proceso",
  PENDIENTE: "Pendiente",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  NUEVO: "Nuevo",
  EN_ANALISIS: "En análisis",
  EN_CURSO: "En curso",
  DUPLICADO: "Duplicado",
  BAJA: "Baja",
  MEDIA: "Media",
  NORMAL: "Normal",
  ALTA: "Alta",
  CRITICA: "Crítica",
  PREVENTIVO: "Preventivo",
  CORRECTIVO: "Correctivo",
  TODAS: "Todas",
  VIGENTES: "Vigentes",
  POR_VENCER: "Por vencer",
  VENCIDAS: "Vencidas",
  NETSUITE: "NetSuite",
  OTROS: "Otros",
  OFFICE: "Office",
  EMAIL: "Email",
  IMPRESION: "Impresión",
  ERROR_EN_EQUIPO: "Error en equipo",
  SOLICITUD_DE_EQUIPO: "Solicitud de equipo",
  INTRANET: "Intranet",
  CONEXION_DE_RED: "Conexión de red",
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
  CREAR: "Crear",
  ACTUALIZAR: "Actualizar",
  DESACTIVAR: "Desactivar",
  REVELAR: "Revelar",
  IMPORTAR: "Importar",
  ASIGNAR: "Asignar",
  DEVOLVER: "Devolver",
  ELIMINAR: "Eliminar",
}

export function etiquetaCampo(nombre: string): string {
  return (
    ETIQUETAS_CAMPO[nombre] ??
    nombre.replace(/([A-Z])/g, " $1").replace(/^./, (letra) =>
      letra.toUpperCase(),
    )
  )
}

export function etiquetaOpcion(valor: string): string {
  return ETIQUETAS_OPCION[valor] ?? valor
}

export function crearFiltrosIniciales(
  metadata: ReporteMetadata,
  retryGeneration?: ReporteGeneracion | null,
): Record<string, string> {
  const filtros: Record<string, string> = {}
  metadata.filtros.forEach((filtro) => {
    filtros[filtro.nombre] = ""
  })

  if (REPORTES_CON_PERIODO.has(metadata.codigo)) {
    const rango = mesActualRango()
    if ("desde" in filtros) filtros.desde = rango.desde
    if ("hasta" in filtros) filtros.hasta = rango.hasta
  }

  if (retryGeneration?.parametros) {
    metadata.filtros.forEach((filtro) => {
      const valor = retryGeneration.parametros?.[filtro.nombre]
      if (valor !== undefined && valor !== null) {
        filtros[filtro.nombre] = String(valor)
      }
    })
  }

  return filtros
}

export function construirParametros(
  filtros: Record<string, string>,
): Record<string, string> {
  const parametros: Record<string, string> = {}
  Object.entries(filtros).forEach(([nombre, valor]) => {
    const texto = valor.trim()
    if (texto !== "") parametros[nombre] = texto
  })
  return parametros
}

export function mesActualRango(): { desde: string; hasta: string } {
  const ahora = new Date()
  const desde = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1),
  )
  const hasta = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0),
  )
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
  }
}

export function extraerPermisosFaltantes(
  error: ReporteApiError,
): string[] {
  for (const item of error.errors) {
    if (
      typeof item === "object" &&
      item !== null &&
      "faltantes" in item &&
      Array.isArray((item as { faltantes?: unknown }).faltantes)
    ) {
      return (item as { faltantes: unknown[] }).faltantes.map(String)
    }
  }
  return []
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes <= 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatFechaHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha)
}

export function formatNumero(valor: number): string {
  return new Intl.NumberFormat("es-MX").format(valor)
}
