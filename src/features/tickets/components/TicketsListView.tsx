import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpDown,
  CircleDot,
  Flag,
  Search,
  Tag,
  UserCheck,
  UserRound,
  X,
} from "lucide-react"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetOption,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { TicketDetailDialog } from "@/features/tickets/components/TicketDetailDialog"
import {
  TicketApiError,
  listarTodosLosTickets,
} from "@/features/tickets/services/ticket.service"
import {
  ESTADOS,
  PRIORIDADES,
  TIPOS,
  estadoClasses,
  estadoLabels,
  prioridadClasses,
  prioridadLabels,
  reqClasses,
  tipoLabels,
} from "@/features/tickets/data/ticket-display"
import type { Ticket } from "@/features/tickets/types/ticket"

function formatDate(isoString: string | null): string {
  if (!isoString) return "—"
  try {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return "—"
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return isoString
  }
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

interface FiltrosLista {
  estados: string[]
  prioridades: string[]
  tipos: string[]
  texto: string
}

function coincideConFiltros(ticket: Ticket, filtros: FiltrosLista): boolean {
  if (filtros.estados.length > 0 && !filtros.estados.includes(ticket.estado)) {
    return false
  }

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

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"

const columns: DataTableColumn<Ticket>[] = [
  {
    key: "id",
    header: "ID",
    cellClassName:
      "border-b border-border/70 px-4 py-3 font-mono font-semibold text-foreground",
    render: (item) => `#${item.id}`,
  },
  {
    key: "titulo",
    header: "Título de la Incidencia / Solicitud",
    cellClassName: "border-b border-border/70 px-4 py-3 max-w-xs",
    render: (item) => (
      <div className="space-y-0.5">
        <div className="truncate font-semibold text-foreground">{item.titulo}</div>
        {item.originalId !== null && (
          <div className="font-mono text-xs text-muted-foreground">
            Ref: {item.originalId}
          </div>
        )}
      </div>
    ),
  },
  {
    key: "estado",
    header: "Estado",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <Badge className={estadoClasses[item.estado]}>{estadoLabels[item.estado]}</Badge>
    ),
  },
  {
    key: "prioridad",
    header: "Prioridad",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <Badge className={prioridadClasses[item.prioridad]}>
        {prioridadLabels[item.prioridad]}
      </Badge>
    ),
  },
  {
    key: "tipoRequerimiento",
    header: "Tipo",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <Badge className={reqClasses[item.tipoRequerimiento]}>
        {tipoLabels[item.tipoRequerimiento]}
      </Badge>
    ),
  },
  {
    key: "solicitante",
    header: "Solicitante",
    cellClassName: "border-b border-border/70 px-4 py-3 min-w-[180px]",
    render: (item) => (
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[rgba(91,36,128,0.12)] text-primary">
          <UserRound className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-foreground">
            {item.solicitante.nombre}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {item.solicitante.email ?? "—"}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "asignadoA",
    header: "Asignado a",
    cellClassName: "border-b border-border/70 px-4 py-3 min-w-[180px]",
    render: (item) =>
      item.asignadoA ? (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="size-3.5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-foreground">
              {item.asignadoA.nombre}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {item.asignadoA.email ?? "—"}
            </div>
          </div>
        </div>
      ) : (
        <span className="text-xs italic text-muted-foreground">Sin asignar</span>
      ),
  },
  {
    key: "departamento",
    header: "Departamento",
    cellClassName: cellBase,
    render: (item) => item.departamento?.nombre ?? "—",
  },
  {
    key: "fechaNotificacion",
    header: "Fecha Notificación",
    cellClassName:
      "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground whitespace-nowrap",
    render: (item) => formatDate(item.fechaNotificacion),
  },
]

export function TicketsListView() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([])
  const [prioridadesSeleccionadas, setPrioridadesSeleccionadas] = useState<
    string[]
  >([])
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCurrentPage(1)
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
  }, [])

  const filtros = useMemo<FiltrosLista>(
    () => ({
      estados: estadosSeleccionados,
      prioridades: prioridadesSeleccionadas,
      tipos: tiposSeleccionados,
      texto: debouncedSearch,
    }),
    [
      estadosSeleccionados,
      prioridadesSeleccionadas,
      tiposSeleccionados,
      debouncedSearch,
    ],
  )

  const ticketsFiltrados = useMemo(
    () => tickets.filter((ticket) => coincideConFiltros(ticket, filtros)),
    [tickets, filtros],
  )

  const hayFiltros =
    filtros.estados.length > 0 ||
    filtros.prioridades.length > 0 ||
    filtros.tipos.length > 0 ||
    filtros.texto !== ""

  const totalFiltrados = ticketsFiltrados.length
  const totalPages = Math.max(1, Math.ceil(totalFiltrados / ITEMS_PER_PAGE))
  const paginaActual = Math.min(currentPage, totalPages)

  const ticketsPagina = useMemo(
    () =>
      ticketsFiltrados.slice(
        (paginaActual - 1) * ITEMS_PER_PAGE,
        paginaActual * ITEMS_PER_PAGE,
      ),
    [ticketsFiltrados, paginaActual],
  )

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "estados",
        label: "Estado",
        icon: CircleDot,
        options: ESTADOS.map<FacetOption>((value) => ({
          value,
          label: estadoLabels[value],
        })),
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
    [],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({
      estados: estadosSeleccionados,
      prioridades: prioridadesSeleccionadas,
      tipos: tiposSeleccionados,
    }),
    [estadosSeleccionados, prioridadesSeleccionadas, tiposSeleccionados],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "estados") {
      setEstadosSeleccionados(values)
    } else if (dimensionId === "prioridades") {
      setPrioridadesSeleccionadas(values)
    } else if (dimensionId === "tipos") {
      setTiposSeleccionados(values)
    }
    setCurrentPage(1)
  }

  function borrarFacetas() {
    setEstadosSeleccionados([])
    setPrioridadesSeleccionadas([])
    setTiposSeleccionados([])
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setDebouncedSearch("")
    borrarFacetas()
  }

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const handleOpenDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <ModuleHeader
        eyebrow="Mesa de Ayuda TI"
        title="Gestión de Tickets e Incidencias"
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por título, #id o solicitante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {loading
              ? "Cargando..."
              : (loadError ??
                (hayFiltros
                  ? `${totalFiltrados} de ${tickets.length} tickets`
                  : `${tickets.length} tickets registrados`))}
          </span>
        }
      />

      <DataTable<Ticket>
        columns={columns}
        data={ticketsPagina}
        rowKey={(ticket) => ticket.id}
        page={paginaActual}
        totalPages={totalPages}
        totalFiltered={totalFiltrados}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onRowDoubleClick={handleOpenDetails}
        onRowClick={(ticket) => setSelectedTicket(ticket)}
        selectedRowKey={selectedTicket?.id ?? null}
        emptyMessage={
          loading
            ? "Cargando incidencias..."
            : (loadError ?? (hayFiltros ? "Sin coincidencias" : "Sin resultados"))
        }
      />

      <TicketDetailDialog
        ticket={selectedTicket}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
