export const KANBAN_COLUMNS = [
  { title: "Nuevo", statusColor: "bg-info" },
  { title: "En curso", statusColor: "bg-warning" },
  { title: "Completado", statusColor: "bg-success" },
  { title: "Duplicado", statusColor: "bg-destructive" },
  { title: "En análisis", statusColor: "bg-primary" },
] as const

export type TicketStatus = (typeof KANBAN_COLUMNS)[number]["title"]
export type TicketPriority = "Alta" | "Media" | "Baja"

export interface KanbanTicket {
  id: string
  title: string
  category: string
  priority: TicketPriority
  owner: string
  status: TicketStatus
}

export interface DropTarget {
  status: TicketStatus
  /** Índice de inserción dentro de los tickets visibles de la columna. */
  index: number
}
