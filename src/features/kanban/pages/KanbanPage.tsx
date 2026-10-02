import { useState, type DragEvent } from "react"
import { GripVertical } from "lucide-react"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Badge } from "@/components/ui/badge"

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

const priorityStyles: Record<TicketPriority, string> = {
  Alta: "border-destructive/30 bg-destructive/10 text-destructive",
  Media: "border-warning/30 bg-warning/10 text-warning-foreground",
  Baja: "border-border bg-muted text-muted-foreground",
}

function KanbanPage() {
  const [tickets, setTickets] = useState(sampleTickets)
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null)

  function handleDragStart(event: DragEvent<HTMLElement>, ticketId: string) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", ticketId)
    setDraggedTicketId(ticketId)
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TicketStatus) {
    event.preventDefault()
    const ticketId =
      event.dataTransfer.getData("text/plain") || draggedTicketId

    if (ticketId) {
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status } : ticket,
        ),
      )
    }

    setDraggedTicketId(null)
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
            const columnTickets = tickets.filter(
              (ticket) => ticket.status === title,
            )

            return (
              <section
                key={title}
                aria-labelledby={headingId}
                className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
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
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, title)}
                  className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 transition-colors ${
                    draggedTicketId
                      ? "bg-muted/50"
                      : ""
                  }`}
                >
                  {columnTickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      draggable
                      onDragStart={(event) =>
                        handleDragStart(event, ticket.id)
                      }
                      onDragEnd={() => setDraggedTicketId(null)}
                      aria-label={`${ticket.id}: ${ticket.title}. Arrastrar para cambiar de columna.`}
                      className={`group cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm transition-[border-color,box-shadow,opacity] hover:border-primary/40 hover:shadow-md active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        draggedTicketId === ticket.id ? "opacity-40" : ""
                      }`}
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
                  ))}
                  {columnTickets.length === 0 && (
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
