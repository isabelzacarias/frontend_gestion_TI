import { useEffect, useMemo, useRef, useState } from "react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import type { DropResult } from "@hello-pangea/dnd"
import { Flag, LayoutGrid, Loader2, RefreshCw, Search, Tag, User, X } from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetOption,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { useIncidenciasSyncStore } from "@/features/kanban/store/incidenciasSyncStore"
import {
  PRIORIDADES,
  TIPOS,
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

const RESPONSABLE_SIN_ASIGNAR = "SIN_ASIGNAR"

interface Filtros {
  prioridades: string[]
  tipos: string[]
  responsables: string[]
  texto: string
}

const controlBase =
  "h-10 rounded-2xl border border-border/80 bg-background/80 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"

function coincideConFiltros(ticket: Ticket, filtros: Filtros): boolean {
  if (
    filtros.prioridades.length > 0 &&
    !filtros.prioridades.includes(ticket.prioridad)
  ) {
    return false
  }

  if (
    filtros.tipos.length > 0 &&
    !filtros.tipos.includes(ticket.tipoRequerimiento)
  ) {
    return false
  }

  if (filtros.responsables.length > 0) {
    const responsableId = ticket.asignadoA?.id ?? RESPONSABLE_SIN_ASIGNAR
    if (!filtros.responsables.includes(responsableId)) {
      return false
    }
  }

  const texto = filtros.texto.trim().toLowerCase()
  if (texto) {
    const coincideTitulo = ticket.titulo.toLowerCase().includes(texto)
    const coincideId =
      String(ticket.id).includes(texto) || `#${ticket.id}`.includes(texto)
    const coincideSolicitante = ticket.solicitante.nombre
      .toLowerCase()
      .includes(texto)

    if (!coincideTitulo && !coincideId && !coincideSolicitante) {
      return false
    }
  }

  return true
}

function KanbanPage() {
  const [tablero, setTablero] = useState<Tablero>(crearTableroVacio)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingIds, setPendingIds] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [prioridadesSeleccionadas, setPrioridadesSeleccionadas] = useState<
    string[]
  >([])
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([])
  const [responsablesSeleccionados, setResponsablesSeleccionados] = useState<
    string[]
  >([])

  const pendingIdsRef = useRef<number[]>([])

  useEffect(() => {
    pendingIdsRef.current = pendingIds
  }, [pendingIds])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

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

  const filtros = useMemo<Filtros>(
    () => ({
      prioridades: prioridadesSeleccionadas,
      tipos: tiposSeleccionados,
      responsables: responsablesSeleccionados,
      texto: debouncedSearch,
    }),
    [
      prioridadesSeleccionadas,
      tiposSeleccionados,
      responsablesSeleccionados,
      debouncedSearch,
    ],
  )

  const ticketsVisibles = useMemo<Tablero>(() => {
    return ESTADOS.reduce<Tablero>((acc, estado) => {
      acc[estado] = tablero[estado].filter((ticket) =>
        coincideConFiltros(ticket, filtros),
      )
      return acc
    }, {} as Tablero)
  }, [tablero, filtros])

  const responsablesDisponibles = useMemo<FacetOption[]>(() => {
    const porId = new Map<string, string>()
    let haySinAsignar = false

    for (const estado of ESTADOS) {
      for (const ticket of tablero[estado]) {
        if (ticket.asignadoA) {
          porId.set(ticket.asignadoA.id, ticket.asignadoA.nombre)
        } else {
          haySinAsignar = true
        }
      }
    }

    const opciones = [...porId.entries()]
      .map<FacetOption>(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))

    if (haySinAsignar) {
      opciones.push({ value: RESPONSABLE_SIN_ASIGNAR, label: "Sin asignar" })
    }

    return opciones
  }, [tablero])

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "responsables",
        label: "Persona asignada",
        icon: User,
        options: responsablesDisponibles,
      },
      {
        id: "prioridades",
        label: "Prioridad",
        icon: Flag,
        options: PRIORIDADES.map<FacetOption>((value) => ({
          value,
          label: prioridadLabels[value],
        })),
      },
      {
        id: "tipos",
        label: "Tipo de requerimiento",
        icon: Tag,
        options: TIPOS.map<FacetOption>((value) => ({
          value,
          label: tipoLabels[value],
        })),
      },
    ],
    [responsablesDisponibles],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({
      responsables: responsablesSeleccionados,
      prioridades: prioridadesSeleccionadas,
      tipos: tiposSeleccionados,
    }),
    [responsablesSeleccionados, prioridadesSeleccionadas, tiposSeleccionados],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "responsables") {
      setResponsablesSeleccionados(values)
    } else if (dimensionId === "prioridades") {
      setPrioridadesSeleccionadas(values)
    } else if (dimensionId === "tipos") {
      setTiposSeleccionados(values)
    }
  }

  const hayFiltros =
    filtros.prioridades.length > 0 ||
    filtros.tipos.length > 0 ||
    filtros.responsables.length > 0 ||
    filtros.texto !== ""

  const totalTickets = useMemo(
    () => ESTADOS.reduce((total, estado) => total + tablero[estado].length, 0),
    [tablero],
  )

  const totalVisibles = useMemo(
    () =>
      ESTADOS.reduce(
        (total, estado) => total + ticketsVisibles[estado].length,
        0,
      ),
    [ticketsVisibles],
  )

  function borrarFacetas() {
    setPrioridadesSeleccionadas([])
    setTiposSeleccionados([])
    setResponsablesSeleccionados([])
  }

  function limpiarFiltros() {
    setSearch("")
    setDebouncedSearch("")
    borrarFacetas()
  }

  async function handleDragEnd(result: DropResult) {
    const { draggableId, source, destination } = result
    if (!destination) return

    const origen = source.droppableId as TicketEstado
    const destino = destination.droppableId as TicketEstado
    if (!ESTADOS_VALIDOS.has(origen) || !ESTADOS_VALIDOS.has(destino)) return

    const id = Number(draggableId)
    if (pendingIdsRef.current.includes(id)) return

    if (origen === destino && source.index === destination.index) return

    const snapshot = tablero
    const siguiente = clonarTablero(tablero)

    const indiceOrigen = siguiente[origen].findIndex(
      (ticket) => ticket.id === id,
    )
    if (indiceOrigen < 0) return
    const [movido] = siguiente[origen].splice(indiceOrigen, 1)
    if (!movido) return

    const columnaDestino = siguiente[destino]
    const visiblesDestino = columnaDestino.filter((ticket) =>
      coincideConFiltros(ticket, filtros),
    )
    const vecinoPosterior = visiblesDestino[destination.index]
    const ordenDestino = vecinoPosterior
      ? columnaDestino.findIndex((ticket) => ticket.id === vecinoPosterior.id)
      : columnaDestino.length

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Mesa de Ayuda TI"
        title="Tablero Kanban"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Actualizar
          </Button>
        }
        filters={
          <>
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por título, #id o solicitante..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${controlBase} w-full pl-10 pr-4`}
              />
            </div>

            <FacetedFilter
              dimensions={facetDimensions}
              selections={facetSelecciones}
              onChange={handleFacetChange}
              onClearAll={borrarFacetas}
            />

            {hayFiltros && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-muted-foreground"
              >
                <X />
                Borrar filtros
              </Button>
            )}
          </>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <LayoutGrid className="size-3.5 text-violet-700 dark:text-violet-200" />
            {loading
              ? "Cargando..."
              : (loadError ??
                (hayFiltros
                  ? `${totalVisibles} de ${totalTickets} tickets`
                  : `${totalTickets} tickets`))}
          </span>
        }
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          role="region"
          aria-label="Columnas del tablero Kanban"
          className="-mx-1 flex min-h-0 flex-1 overflow-hidden px-1 pb-3"
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 gap-4">
            {columns.map(({ estado, statusColor }) => {
              const headingId = `kanban-column-${estado.toLowerCase()}`
              const columnTickets = ticketsVisibles[estado]

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
                            {hayFiltros ? "Sin coincidencias" : "Sin tickets"}
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
    </div>
  )
}

export default KanbanPage
