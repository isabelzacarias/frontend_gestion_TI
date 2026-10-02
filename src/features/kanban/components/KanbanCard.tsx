import type { DragEvent } from "react"
import { GripVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { DropTarget, KanbanTicket, TicketPriority, TicketStatus } from "@/features/kanban/types/kanban"

const priorityStyles: Record<TicketPriority, string> = {
  Alta: "border-destructive/30 bg-destructive/10 text-destructive",
  Media:
    "border-warning-300 bg-warning-100 text-warning-800 dark:border-warning-700 dark:bg-warning-1000/60 dark:text-warning-300",
  Baja: "border-border bg-muted text-muted-foreground",
}

interface KanbanCardProps {
  ticket: KanbanTicket
  isDragging: boolean
  columnStatus: TicketStatus
  cardIndex: number
  onDragStart: (event: DragEvent<HTMLElement>, ticketId: string) => void
  onDragOver: (event: DragEvent<HTMLElement>, status: TicketStatus, index: number) => void
  onDragEnd: () => void
  /** Solo para accesibilidad: indica si hay un drop target activo sobre este card. */
  dropTarget: DropTarget | null
}

export function KanbanCard({
  ticket,
  isDragging,
  columnStatus,
  cardIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
}: KanbanCardProps) {
  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id)}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const { top, height } = e.currentTarget.getBoundingClientRect()
        const isUpperHalf = e.clientY < top + height / 2
        onDragOver(e, columnStatus, isUpperHalf ? cardIndex : cardIndex + 1)
      }}
      onDragEnd={onDragEnd}
      aria-label={`${ticket.id}: ${ticket.title}. Arrastrar para cambiar de columna.`}
      className={[
        "group cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm",
        "transition-[border-color,box-shadow,opacity,transform] duration-150",
        "hover:border-primary/40 hover:shadow-md",
        "active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging ? "scale-[0.97] opacity-40 shadow-none" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{ticket.id}</p>
          <h3 className="mt-1 text-sm font-medium leading-snug text-card-foreground">
            {ticket.title}
          </h3>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="h-6 rounded-md px-2 text-[11px] font-normal">
          {ticket.category}
        </Badge>
        <Badge
          variant="outline"
          className={`h-6 rounded-md px-2 text-[11px] ${priorityStyles[ticket.priority]}`}
        >
          Prioridad {ticket.priority.toLowerCase()}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-xs text-muted-foreground">Asignado a</span>
        <span
          aria-label={`Responsable: ${ticket.owner}`}
          className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
        >
          {ticket.owner}
        </span>
      </div>
    </article>
  )
}
