import type { KanbanTicket } from "@/features/kanban/types/kanban"

/**
 * Datos de muestra para desarrollo y diseño.
 * Reemplazar por una llamada a la API cuando esté disponible:
 *   GET /api/tickets?view=kanban
 */
export const sampleTickets: KanbanTicket[] = [
  {
    id: "TI-1042",
    title: "Restablecer acceso al correo",
    category: "Cuentas y accesos",
    priority: "Alta",
    owner: "LM",
    status: "Nuevo",
  },
  {
    id: "TI-1043",
    title: "Preparar equipo para nueva incorporación",
    category: "Equipos",
    priority: "Media",
    owner: "CR",
    status: "En curso",
  },
  {
    id: "TI-1038",
    title: "Actualizar cliente VPN",
    category: "Software",
    priority: "Baja",
    owner: "AS",
    status: "Completado",
  },
  {
    id: "TI-1044",
    title: "Revisar lentitud en la red de oficina",
    category: "Redes",
    priority: "Alta",
    owner: "JP",
    status: "Duplicado",
  },
  {
    id: "TI-1045",
    title: "Validar permisos de carpeta compartida",
    category: "Cuentas y accesos",
    priority: "Media",
    owner: "EG",
    status: "En análisis",
  },
  {
    id: "TI-1046",
    title: "Instalar actualizaciones de seguridad",
    category: "Software",
    priority: "Alta",
    owner: "MR",
    status: "Nuevo",
  },
  {
    id: "TI-1047",
    title: "Configurar impresora del área de Finanzas",
    category: "Periféricos",
    priority: "Baja",
    owner: "DV",
    status: "En curso",
  },
  {
    id: "TI-1048",
    title: "Crear respaldo de archivos del equipo",
    category: "Respaldo",
    priority: "Media",
    owner: "SL",
    status: "En curso",
  },
  {
    id: "TI-1049",
    title: "Resolver error de conexión a intranet",
    category: "Redes",
    priority: "Alta",
    owner: "AC",
    status: "En análisis",
  },
  {
    id: "TI-1050",
    title: "Revisar solicitud repetida de acceso a sistema",
    category: "Cuentas y accesos",
    priority: "Baja",
    owner: "JP",
    status: "Duplicado",
  },
]
