import { Fragment, type DragEvent } from "react"

import { DropIndicator } from "@/features/kanban/components/DropIndicator"
import { KanbanCard } from "@/features/kanban/components/KanbanCard"
import type { DropTarget, KanbanTicket, TicketStatus } from "@/features/kanban/types/kanban"

interface KanbanColumnProps {
  title: TicketStatus
  statusColor: string
  tickets: KanbanTicket[]
  draggedTicketId: string | null
  dropTarget: DropTarget | null
  onDragStart: (event: DragEvent<HTMLElement>, ticketId: string) => void
  onDragOver: (event: DragEvent<HTMLElement>, status: TicketStatus, index: number) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onDrop: (event: DragEvent<HTMLElement>, status: TicketStatus) => void
}

export function KanbanColumn({
  title,
  statusColor,
  tickets,
  draggedTicketId,
  dropTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: KanbanColumnProps) {
  const headingId = `kanban-column-${title.toLowerCase().replaceAll(" ", "-")}`
  const isDropTarget = dropTarget?.status === title

  /** Handler del contenedor: activo solo cuando el cursor está en espacio vacío (los cards paran la propagación). */
  function handleContainerDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    onDragOver(event, title, tickets.length)
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Cabecera */}
      <header className="flex min-h-16 items-center gap-3 border-b border-border px-4">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${statusColor}`} />
        <h2 id={headingId} className="font-heading text-sm font-semibold text-card-foreground">
          {title}
        </h2>
        <span
          aria-label={`${tickets.length} tickets`}
          className="ml-auto text-xs tabular-nums text-muted-foreground"
        >
          {tickets.length}
        </span>
      </header>

      {/* Área de drop */}
      <div
        onDragOver={handleContainerDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, title)}
        className={[
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors duration-150",
          isDropTarget ? "bg-primary/5" : draggedTicketId ? "bg-muted/40" : "",
        ].join(" ")}
      >
        {tickets.map((ticket, index) => (
          <Fragment key={ticket.id}>
            {isDropTarget && dropTarget.index === index && <DropIndicator />}
            <KanbanCard
              ticket={ticket}
              isDragging={draggedTicketId === ticket.id}
              columnStatus={title}
              cardIndex={index}
              dropTarget={dropTarget}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            />
          </Fragment>
        ))}

        {/* Indicador al final de la columna */}
        {isDropTarget && dropTarget.index === tickets.length && <DropIndicator />}

        {/* Columna vacía */}
        {tickets.length === 0 && !draggedTicketId && (
          <p className="flex flex-1 items-center justify-center px-3 py-8 text-center text-sm text-muted-foreground">
            Suelta un ticket aquí
          </p>
        )}
      </div>
    </section>
  )
}
