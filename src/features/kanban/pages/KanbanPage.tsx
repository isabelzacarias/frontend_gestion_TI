import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  estadoLabels,
  prioridadClasses,
  prioridadLabels,
  reqClasses,
  tipoLabels,
} from "@/features/tickets/data/ticket-display"
import {
  TicketApiError,
  listarTodosLosTickets,
} from "@/features/tickets/services/ticket.service"
import type { Ticket, TicketEstado } from "@/features/tickets/types/ticket"

const columns: { estado: TicketEstado; statusColor: string }[] = [
  { estado: "NUEVO", statusColor: "bg-info" },
  { estado: "EN_ANALISIS", statusColor: "bg-primary" },
  { estado: "EN_CURSO", statusColor: "bg-warning" },
  { estado: "DUPLICADO", statusColor: "bg-destructive" },
  { estado: "COMPLETADO", statusColor: "bg-success" },
]

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "—"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getErrorMessage(error: unknown): string {
  if (error instanceof TicketApiError) {
    if (error.status === 403) {
      return "No tienes permiso para consultar incidencias (incidencias:leer)."
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return "No se pudieron cargar las incidencias."
}

function KanbanPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelado = false

    async function cargarTickets() {
      setLoading(true)
      setLoadError(null)

      try {
        const lista = await listarTodosLosTickets()
        if (cancelado) return
        setTickets(lista)
      } catch (error) {
        if (cancelado) return
        setLoadError(getErrorMessage(error))
        setTickets([])
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarTickets()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  return (
    <PagePlaceholder
      title="Tablero Kanban"
      description="Incidencias agrupadas por estado. Vista de solo lectura; el arrastre se habilitará cuando el backend permita cambiar el estado."
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {loading
            ? "Cargando..."
            : (loadError ?? `${tickets.length} tickets`)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Actualizar
        </Button>
      </div>

      <div
        role="region"
        aria-label="Columnas del tablero Kanban"
        className="-mx-1 flex min-h-0 flex-1 overflow-hidden px-1 pb-3"
      >
        <div className="flex h-full min-h-0 min-w-0 flex-1 gap-4">
          {columns.map(({ estado, statusColor }) => {
            const headingId = `kanban-column-${estado.toLowerCase()}`
            const columnTickets = tickets.filter((t) => t.estado === estado)

            return (
              <section
                key={estado}
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
                    {estadoLabels[estado]}
                  </h2>
                  <span
                    aria-label={`${columnTickets.length} tickets`}
                    className="ml-auto text-xs tabular-nums text-muted-foreground"
                  >
                    {columnTickets.length}
                  </span>
                </header>

                {/* Área de tarjetas */}
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
                  {columnTickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      aria-label={`#${ticket.id}: ${ticket.titulo}`}
                      className="rounded-lg border border-border bg-background p-3 shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-primary/40 hover:shadow-md"
                    >
                      <p className="font-mono text-xs font-medium text-muted-foreground">
                        #{ticket.id}
                      </p>
                      <h3 className="mt-1 text-sm font-medium leading-snug text-card-foreground">
                        {ticket.titulo}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          className={`h-6 rounded-md px-2 text-[11px] ${reqClasses[ticket.tipoRequerimiento]}`}
                        >
                          {tipoLabels[ticket.tipoRequerimiento]}
                        </Badge>
                        <Badge
                          className={`h-6 rounded-md px-2 text-[11px] ${prioridadClasses[ticket.prioridad]}`}
                        >
                          Prioridad {prioridadLabels[ticket.prioridad].toLowerCase()}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                        <span className="text-xs text-muted-foreground">
                          Asignado a
                        </span>
                        {ticket.asignadoA ? (
                          <span
                            aria-label={`Responsable: ${ticket.asignadoA.nombre}`}
                            className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                          >
                            {getInitials(ticket.asignadoA.nombre)}
                          </span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            Sin asignar
                          </span>
                        )}
                      </div>
                    </article>
                  ))}

                  {columnTickets.length === 0 && !loading && (
                    <p className="flex flex-1 items-center justify-center px-3 py-8 text-center text-sm text-muted-foreground">
                      Sin tickets
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
