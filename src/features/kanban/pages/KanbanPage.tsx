import { Fragment, useState, type DragEvent } from "react"
import { GripVertical } from "lucide-react"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Badge } from "@/components/ui/badge"

// ─── Columnas ─────────────────────────────────────────────────────────────────

const columns = [
  { title: "Nuevo", statusColor: "bg-info" },
  { title: "En curso", statusColor: "bg-warning" },
  { title: "Completado", statusColor: "bg-success" },
  { title: "Duplicado", statusColor: "bg-destructive" },
  { title: "En análisis", statusColor: "bg-primary" },
] as const

type TicketStatus = (typeof columns)[number]["title"]
type TicketPriority = "Alta" | "Media" | "Baja"

interface KanbanTicket {
  id: string
  title: string
  category: string
  priority: TicketPriority
  owner: string
  status: TicketStatus
}

interface DropTarget {
  status: TicketStatus
  /** Índice de inserción relativo a todos los tickets visibles de la columna. */
  index: number
}

// ─── Datos de muestra ─────────────────────────────────────────────────────────

const sampleTickets: KanbanTicket[] = [
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

// ─── Estilos de prioridad ─────────────────────────────────────────────────────

const priorityStyles: Record<TicketPriority, string> = {
  Alta: "border-destructive/30 bg-destructive/10 text-destructive",
  Media: "border-warning/30 bg-warning/10 text-warning-foreground",
  Baja: "border-border bg-muted text-muted-foreground",
}

// ─── Indicador de posición de drop ───────────────────────────────────────────

function DropIndicator() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex animate-in fade-in items-center gap-1.5 duration-100"
    >
      <span className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="h-0.5 flex-1 rounded-full bg-primary" />
      <span className="size-2 shrink-0 rounded-full bg-primary" />
    </div>
  )
}

// ─── Página Kanban ────────────────────────────────────────────────────────────

function KanbanPage() {
  const [tickets, setTickets] = useState(sampleTickets)
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  // Inicia el arrastre
  function handleDragStart(event: DragEvent<HTMLElement>, ticketId: string) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", ticketId)
    setDraggedTicketId(ticketId)
  }

  /**
   * Detecta si el cursor está en la mitad superior o inferior del card.
   * stopPropagation evita que el handler del contenedor sobreescriba el índice.
   */
  function handleCardDragOver(
    event: DragEvent<HTMLElement>,
    status: TicketStatus,
    cardIndex: number,
  ) {
    event.preventDefault()
    event.stopPropagation()
    const { top, height } = event.currentTarget.getBoundingClientRect()
    const isUpperHalf = event.clientY < top + height / 2
    setDropTarget({ status, index: isUpperHalf ? cardIndex : cardIndex + 1 })
  }

  /**
   * Handler del contenedor: solo se activa cuando el cursor está sobre el
   * espacio vacío de la columna (las cards paran la propagación).
   * Establece el índice al final de la columna.
   */
  function handleColumnDragOver(
    event: DragEvent<HTMLElement>,
    status: TicketStatus,
    totalCards: number,
  ) {
    event.preventDefault()
    setDropTarget({ status, index: totalCards })
  }

  // Limpia el indicador al salir de la columna
  function handleColumnDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDropTarget(null)
    }
  }

  // Suelta el ticket en la posición calculada
  function handleDrop(event: DragEvent<HTMLElement>, status: TicketStatus) {
    event.preventDefault()
    const ticketId =
      event.dataTransfer.getData("text/plain") || draggedTicketId

    if (ticketId) {
      setTickets((currentTickets) => {
        const ticket = currentTickets.find((t) => t.id === ticketId)
        if (!ticket) return currentTickets

        // Array sin el ticket arrastrado
        const withoutDragged = currentTickets.filter((t) => t.id !== ticketId)
        // Tickets de la columna destino (sin el arrastrado)
        const columnTickets = withoutDragged.filter((t) => t.status === status)

        // Si se mueve dentro de la misma columna, el índice puede estar desplazado
        // porque el card arrastrado sigue en el DOM mientras se calcula la posición.
        let adjustedIndex = dropTarget?.index ?? columnTickets.length
        if (ticket.status === status) {
          const draggedColIdx = currentTickets
            .filter((t) => t.status === status)
            .findIndex((t) => t.id === ticketId)
          if (draggedColIdx < adjustedIndex) {
            adjustedIndex = Math.max(0, adjustedIndex - 1)
          }
        }

        const clampedIndex = Math.min(adjustedIndex, columnTickets.length)

        // Columna vacía: agregar al final del array
        if (columnTickets.length === 0) {
          return [...withoutDragged, { ...ticket, status }]
        }

        if (clampedIndex >= columnTickets.length) {
          // Insertar después del último ticket de esta columna
          const lastTicket = columnTickets[columnTickets.length - 1]
          const globalIdx = withoutDragged.findIndex(
            (t) => t.id === lastTicket.id,
          )
          const result = [...withoutDragged]
          result.splice(globalIdx + 1, 0, { ...ticket, status })
          return result
        }

        // Insertar antes del ticket en clampedIndex
        const beforeTicket = columnTickets[clampedIndex]
        const globalIdx = withoutDragged.findIndex(
          (t) => t.id === beforeTicket.id,
        )
        const result = [...withoutDragged]
        result.splice(globalIdx, 0, { ...ticket, status })
        return result
      })
    }

    setDraggedTicketId(null)
    setDropTarget(null)
  }

  function handleDragEnd() {
    setDraggedTicketId(null)
    setDropTarget(null)
  }

  return (
    <PagePlaceholder
      title="Tablero Kanban"
      description="Arrastra los tickets entre columnas para cambiar su estado. Son datos de prueba y no se guardan."
      className="overflow-hidden"
    >
      <div
        role="region"
        aria-label="Columnas del tablero Kanban"
        className="-mx-1 flex min-h-0 flex-1 overflow-hidden px-1 pb-3"
      >
        <div className="flex h-full min-h-0 min-w-0 flex-1 gap-4">
          {columns.map(({ title, statusColor }) => {
            const headingId = `kanban-column-${title
              .toLowerCase()
              .replaceAll(" ", "-")}`
            const columnTickets = tickets.filter((t) => t.status === title)
            const isDropTarget = dropTarget?.status === title

            return (
              <section
                key={title}
                aria-labelledby={headingId}
                className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Cabecera de columna */}
                <header className="flex min-h-16 items-center gap-3 border-b border-border px-4">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 shrink-0 rounded-full ${statusColor}`}
                  />
                  <h2
                    id={headingId}
                    className="font-heading text-sm font-semibold text-card-foreground"
                  >
                    {title}
                  </h2>
                  <span
                    aria-label={`${columnTickets.length} tickets`}
                    className="ml-auto text-xs tabular-nums text-muted-foreground"
                  >
                    {columnTickets.length}
                  </span>
                </header>

                {/* Área de cards */}
                <div
                  onDragOver={(e) =>
                    handleColumnDragOver(e, title, columnTickets.length)
                  }
                  onDragLeave={handleColumnDragLeave}
                  onDrop={(e) => handleDrop(e, title)}
                  className={[
                    "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors duration-150",
                    isDropTarget
                      ? "bg-primary/5"
                      : draggedTicketId
                        ? "bg-muted/40"
                        : "",
                  ].join(" ")}
                >
                  {columnTickets.map((ticket, index) => (
                    <Fragment key={ticket.id}>
                      {/* Indicador antes de este ticket */}
                      {isDropTarget && dropTarget.index === index && (
                        <DropIndicator />
                      )}

                      <article
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onDragOver={(e) =>
                          handleCardDragOver(e, title, index)
                        }
                        onDragEnd={handleDragEnd}
                        aria-label={`${ticket.id}: ${ticket.title}. Arrastrar para cambiar de columna.`}
                        className={[
                          "group cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm",
                          "transition-[border-color,box-shadow,opacity,transform] duration-150",
                          "hover:border-primary/40 hover:shadow-md",
                          "active:cursor-grabbing",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          draggedTicketId === ticket.id
                            ? "scale-[0.97] opacity-40 shadow-none"
                            : "",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {ticket.id}
                            </p>
                            <h3 className="mt-1 text-sm font-medium leading-snug text-card-foreground">
                              {ticket.title}
                            </h3>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="h-6 rounded-md px-2 text-[11px] font-normal"
                          >
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
                          <span className="text-xs text-muted-foreground">
                            Asignado a
                          </span>
                          <span
                            aria-label={`Responsable: ${ticket.owner}`}
                            className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                          >
                            {ticket.owner}
                          </span>
                        </div>
                      </article>
                    </Fragment>
                  ))}

                  {/* Indicador al final de la columna */}
                  {isDropTarget &&
                    dropTarget.index === columnTickets.length && (
                      <DropIndicator />
                    )}

                  {/* Mensaje columna vacía */}
                  {columnTickets.length === 0 && !draggedTicketId && (
                    <p className="flex flex-1 items-center justify-center px-3 py-8 text-center text-sm text-muted-foreground">
                      Suelta un ticket aquí
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </PagePlaceholder>
  )
}

export default KanbanPage
