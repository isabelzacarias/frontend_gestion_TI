import { useEffect, useState } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Search,
  Ticket as TicketIcon,
  UserCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import {
  TicketApiError,
  listarTickets,
  obtenerTicket,
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
import type {
  MetadatosPaginacion,
  Ticket,
  TicketDetalle,
  TicketEstado,
  TicketPrioridad,
  TipoRequerimiento,
} from "@/features/tickets/types/ticket"

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
  const [meta, setMeta] = useState<MetadatosPaginacion>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  })
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedEstado, setSelectedEstado] = useState<"ALL" | TicketEstado>("ALL")
  const [selectedPrioridad, setSelectedPrioridad] = useState<"ALL" | TicketPrioridad>(
    "ALL",
  )
  const [selectedTipo, setSelectedTipo] = useState<"ALL" | TipoRequerimiento>("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [ticketDetail, setTicketDetail] = useState<TicketDetalle | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
        const { tickets: lista, meta: metaRespuesta } = await listarTickets({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          ...(selectedEstado !== "ALL" ? { estado: selectedEstado } : {}),
          ...(selectedPrioridad !== "ALL"
            ? { prioridad: selectedPrioridad }
            : {}),
          ...(selectedTipo !== "ALL" ? { tipoRequerimiento: selectedTipo } : {}),
          ...(debouncedSearch ? { q: debouncedSearch } : {}),
        })

        if (cancelado) return
        setTickets(lista)
        setMeta(metaRespuesta)
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
  }, [
    currentPage,
    selectedEstado,
    selectedPrioridad,
    selectedTipo,
    debouncedSearch,
  ])

  useEffect(() => {
    if (!isDetailOpen || !selectedTicket) return

    let cancelado = false

    async function cargarDetalle() {
      setDetailLoading(true)
      try {
        const detalle = await obtenerTicket(selectedTicket!.id)
        if (!cancelado) setTicketDetail(detalle)
      } catch (error) {
        if (!cancelado) toast.error(getErrorMessage(error))
      } finally {
        if (!cancelado) setDetailLoading(false)
      }
    }

    void cargarDetalle()

    return () => {
      cancelado = true
    }
  }, [isDetailOpen, selectedTicket])

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), meta.totalPages))
  }

  const handleOpenDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setTicketDetail(null)
    setIsDetailOpen(true)
  }

  const detailSections: DetailSection[] = selectedTicket
    ? [
        {
          title: "Información General",
          color: "primary",
          fields: [
            { key: "id", label: "ID Ticket", value: `#${selectedTicket.id}` },
            {
              key: "originalId",
              label: "ID Original / Referencia",
              value: selectedTicket.originalId ?? "N/A",
            },
            {
              key: "titulo",
              label: "Título de la Incidencia",
              value: selectedTicket.titulo,
              colSpan: "sm:col-span-2",
            },
            {
              key: "estado",
              label: "Estado Actual",
              value: (
                <Badge className={estadoClasses[selectedTicket.estado]}>
                  {estadoLabels[selectedTicket.estado]}
                </Badge>
              ),
            },
            {
              key: "prioridad",
              label: "Prioridad",
              value: (
                <Badge className={prioridadClasses[selectedTicket.prioridad]}>
                  {prioridadLabels[selectedTicket.prioridad]}
                </Badge>
              ),
            },
            {
              key: "tipoRequerimiento",
              label: "Tipo de Requerimiento",
              value: (
                <Badge className={reqClasses[selectedTicket.tipoRequerimiento]}>
                  {tipoLabels[selectedTicket.tipoRequerimiento]}
                </Badge>
              ),
            },
            {
              key: "descripcion",
              label: "Descripción",
              value: detailLoading
                ? "Cargando..."
                : (ticketDetail?.descripcion ?? "—"),
              colSpan: "sm:col-span-2",
            },
            {
              key: "evidenciaUrl",
              label: "Evidencia",
              value: ticketDetail?.evidenciaUrl ?? "—",
            },
          ],
        },
        {
          title: "Solicitante y Asignación",
          color: "cyan",
          fields: [
            {
              key: "solicitanteNombre",
              label: "Solicitante",
              value: selectedTicket.solicitante.nombre,
            },
            {
              key: "solicitanteEmail",
              label: "Correo Solicitante",
              value: selectedTicket.solicitante.email ?? "—",
            },
            {
              key: "asignadoNombre",
              label: "Técnico Asignado",
              value: selectedTicket.asignadoA
                ? selectedTicket.asignadoA.nombre
                : "Sin asignar",
            },
            {
              key: "asignadoEmail",
              label: "Correo Asignado",
              value: selectedTicket.asignadoA?.email ?? "—",
            },
            {
              key: "departamento",
              label: "Departamento",
              value: selectedTicket.departamento?.nombre ?? "No especificado",
            },
          ],
        },
        {
          title: "Fechas y Registro",
          color: "violet",
          fields: [
            {
              key: "fechaNotificacion",
              label: "Fecha de Notificación",
              value: formatDate(selectedTicket.fechaNotificacion),
            },
            {
              key: "fechaResolucion",
              label: "Fecha de Resolución",
              value: formatDate(selectedTicket.fechaResolucion),
            },
            {
              key: "totalActualizaciones",
              label: "Actualizaciones",
              value: String(selectedTicket.totalActualizaciones),
            },
          ],
        },
        ...(ticketDetail && ticketDetail.actualizaciones.length > 0
          ? [
              {
                title: "Seguimiento",
                color: "emerald" as const,
                fields: ticketDetail.actualizaciones.map((actualizacion) => ({
                  key: `actualizacion-${actualizacion.id}`,
                  label: formatDate(actualizacion.creadaEn),
                  value: actualizacion.texto,
                  colSpan: "sm:col-span-2",
                })),
              },
            ]
          : []),
      ]
    : []

  return (
    <div className="space-y-6">
      <ModuleHeader
        eyebrow="Mesa de Ayuda TI"
        title="Gestión de Tickets e Incidencias"
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por título o solicitante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="relative">
              <select
                value={selectedEstado}
                onChange={(e) => {
                  setSelectedEstado(e.target.value as "ALL" | TicketEstado)
                  setCurrentPage(1)
                }}
                className="h-10 cursor-pointer appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Todos los Estados</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estadoLabels[estado]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="relative">
              <select
                value={selectedPrioridad}
                onChange={(e) => {
                  setSelectedPrioridad(e.target.value as "ALL" | TicketPrioridad)
                  setCurrentPage(1)
                }}
                className="h-10 cursor-pointer appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Todas las Prioridades</option>
                {PRIORIDADES.map((prioridad) => (
                  <option key={prioridad} value={prioridad}>
                    {prioridadLabels[prioridad]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="relative">
              <select
                value={selectedTipo}
                onChange={(e) => {
                  setSelectedTipo(e.target.value as "ALL" | TipoRequerimiento)
                  setCurrentPage(1)
                }}
                className="h-10 cursor-pointer appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Todos los Tipos</option>
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipoLabels[tipo]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {loading ? "Cargando..." : `${meta.total} tickets registrados`}
          </span>
        }
      />

      <DataTable<Ticket>
        columns={columns}
        data={tickets}
        rowKey={(ticket) => ticket.id}
        page={meta.page}
        totalPages={meta.totalPages}
        totalFiltered={meta.total}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onRowDoubleClick={handleOpenDetails}
        onRowClick={(ticket) => setSelectedTicket(ticket)}
        selectedRowKey={selectedTicket?.id ?? null}
        emptyMessage={
          loading ? "Cargando incidencias..." : (loadError ?? "Sin resultados")
        }
      />

      {selectedTicket && (
        <DetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          title={`Ticket #${selectedTicket.id}`}
          description="Consulta detallada de la incidencia o solicitud."
          icon={<TicketIcon className="size-6 text-white" />}
          sections={detailSections}
        />
      )}
    </div>
  )
}
