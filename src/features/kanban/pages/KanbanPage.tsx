import { useEffect, useMemo, useRef, useState } from "react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import type { DropResult } from "@hello-pangea/dnd"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIncidenciasSyncStore } from "@/features/kanban/store/incidenciasSyncStore"
import {
  estadoLabels,
  prioridadClasses,
  prioridadLabels,
  reqClasses,
  tipoLabels,
} from "@/features/tickets/data/ticket-display"
import {
  actualizarEstadoTicket,
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

const ESTADOS: TicketEstado[] = columns.map(({ estado }) => estado)
const ESTADOS_VALIDOS = new Set<string>(ESTADOS)

type Tablero = Record<TicketEstado, Ticket[]>

function crearTableroVacio(): Tablero {
  return ESTADOS.reduce<Tablero>((acc, estado) => {
    acc[estado] = []
    return acc
  }, {} as Tablero)
}

function clonarTablero(tablero: Tablero): Tablero {
  return ESTADOS.reduce<Tablero>((acc, estado) => {
    acc[estado] = [...tablero[estado]]
    return acc
  }, {} as Tablero)
}

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

function getUpdateErrorMessage(error: unknown): string {
  if (error instanceof TicketApiError && error.status === 403) {
    return "No tienes permiso para cambiar el estado (incidencias:editar)."
  }
  if (error instanceof TicketApiError) return error.message
  if (error instanceof Error) return error.message
  return "No se pudo actualizar el estado de la incidencia."
}

function KanbanPage() {
  const [tablero, setTablero] = useState<Tablero>(crearTableroVacio)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingIds, setPendingIds] = useState<number[]>([])

  const pendingIdsRef = useRef<number[]>([])

  useEffect(() => {
    pendingIdsRef.current = pendingIds
  }, [pendingIds])

  useEffect(() => {
    let cancelado = false

    async function cargarTickets() {
      setLoading(true)
      setLoadError(null)

      try {
        const lista = await listarTodosLosTickets()
        if (cancelado) return

        const siguiente = crearTableroVacio()
        for (const ticket of lista) {
          siguiente[ticket.estado].push(ticket)
        }
        for (const estado of ESTADOS) {
          siguiente[estado].sort((a, b) => a.orden - b.orden || a.id - b.id)
        }

        setTablero(siguiente)
      } catch (error) {
        if (cancelado) return
        setLoadError(getErrorMessage(error))
        setTablero(crearTableroVacio())
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarTickets()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  useEffect(() => {
    const unsubscribe = useIncidenciasSyncStore.subscribe((state, prevState) => {
      if (state.lastChange === prevState.lastChange) return

      const change = state.lastChange
      if (!change || !ESTADOS_VALIDOS.has(change.estado)) return

      const id = Number(change.id)
      if (!Number.isInteger(id) || pendingIdsRef.current.includes(id)) return

      const destino = change.estado as TicketEstado

      setTablero((prev) => {
        const origen = ESTADOS.find((estado) =>
          prev[estado].some((ticket) => ticket.id === id),
        )
        if (!origen || origen === destino) return prev

        const siguiente = clonarTablero(prev)
        const indice = siguiente[origen].findIndex((ticket) => ticket.id === id)
        const [movido] = siguiente[origen].splice(indice, 1)
        if (!movido) return prev

        siguiente[destino] = [
          ...siguiente[destino],
          { ...movido, estado: destino },
        ]
        return siguiente
      })
    })

    return unsubscribe
  }, [])

  const totalTickets = useMemo(
    () => ESTADOS.reduce((total, estado) => total + tablero[estado].length, 0),
    [tablero],
  )

  async function handleDragEnd(result: DropResult) {
    const { draggableId, source, destination } = result
    if (!destination) return

    const origen = source.droppableId as TicketEstado
    const destino = destination.droppableId as TicketEstado
    if (!ESTADOS_VALIDOS.has(origen) || !ESTADOS_VALIDOS.has(destino)) return

    const id = Number(draggableId)
    if (pendingIdsRef.current.includes(id)) return

    const snapshot = tablero
    const siguiente = clonarTablero(tablero)
    const [movido] = siguiente[origen].splice(source.index, 1)
    if (!movido) return

    if (movido.estado === destino && source.index === destination.index) {
      return
    }

    const ordenDestino = destination.index
    siguiente[destino].splice(ordenDestino, 0, { ...movido, estado: destino })

    setTablero(siguiente)
    setPendingIds((prev) => (prev.includes(id) ? prev : [...prev, id]))

    try {
      const actualizado = await actualizarEstadoTicket(id, destino, ordenDestino)
      setTablero((prev) => {
        const next = clonarTablero(prev)
        next[destino] = next[destino].map((ticket) =>
          ticket.id === id ? actualizado : ticket,
        )
        return next
      })
    } catch (error) {
      setTablero(snapshot)
      toast.error("No se pudo mover la incidencia", {
        description: getUpdateErrorMessage(error),
      })
    } finally {
      setPendingIds((prev) => prev.filter((pendingId) => pendingId !== id))
    }
  }

  return (
    <PagePlaceholder
      title="Tablero Kanban"
      description="Incidencias agrupadas por estado. Arrastra una tarjeta para cambiar su estado o reordenarla dentro de la columna."
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {loading
            ? "Cargando..."
            : (loadError ?? `${totalTickets} tickets`)}
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          role="region"
          aria-label="Columnas del tablero Kanban"
          className="-mx-1 flex min-h-0 flex-1 overflow-hidden px-1 pb-3"
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 gap-4">
            {columns.map(({ estado, statusColor }) => {
              const headingId = `kanban-column-${estado.toLowerCase()}`
              const columnTickets = tablero[estado]

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
                  <Droppable droppableId={estado}>
                    {(dropProvided, dropSnapshot) => (
                      <div
                        ref={dropProvided.innerRef}
                        {...dropProvided.droppableProps}
                        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors ${
                          dropSnapshot.isDraggingOver ? "bg-accent/40" : ""
                        }`}
                      >
                        {columnTickets.map((ticket, index) => (
                          <Draggable
                            key={ticket.id}
                            draggableId={String(ticket.id)}
                            index={index}
                            isDragDisabled={loading || pendingIds.includes(ticket.id)}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <article
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={dragProvided.draggableProps.style}
                                aria-label={`#${ticket.id}: ${ticket.titulo}`}
                                aria-busy={pendingIds.includes(ticket.id)}
                                className={`rounded-lg border border-border bg-background p-3 shadow-sm transition-[border-color,box-shadow,opacity] duration-150 hover:border-primary/40 hover:shadow-md ${
                                  pendingIds.includes(ticket.id)
                                    ? "cursor-wait opacity-60"
                                    : "cursor-grab active:cursor-grabbing"
                                } ${
                                  dragSnapshot.isDragging
                                    ? "border-primary/60 shadow-lg ring-2 ring-primary/30"
                                    : ""
                                }`}
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
                                    Prioridad{" "}
                                    {prioridadLabels[ticket.prioridad].toLowerCase()}
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
                            )}
                          </Draggable>
                        ))}

                        {dropProvided.placeholder}

                        {columnTickets.length === 0 && !loading && (
                          <p className="flex flex-1 items-center justify-center px-3 py-8 text-center text-sm text-muted-foreground">
                            Sin tickets
                          </p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </section>
              )
            })}
          </div>
        </div>
      </DragDropContext>
    </PagePlaceholder>
  )
}

export default KanbanPage
