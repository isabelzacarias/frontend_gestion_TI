import { useMemo, useState } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Loader2,
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
import { sampleTickets } from "@/features/tickets/data/sampleTickets"
import { actualizarEstadoTicket } from "@/features/tickets/services/ticket.service"
import type {
  Ticket,
  TicketEstado,
  TicketPrioridad,
  TipoRequerimiento,
} from "@/features/tickets/types/ticket"

/* ──────────────────────────────────────────────
 * Mapeo de estilos y etiquetas para Badges y Selects
 * ────────────────────────────────────────────── */
const estadoClasses: Record<TicketEstado, string> = {
  NUEVO: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold focus:ring-sky-500/30",
  EN_PROCESO: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold focus:ring-amber-500/30",
  RESUELTO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold focus:ring-emerald-500/30",
  CERRADO: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400 font-semibold focus:ring-slate-500/30",
  CANCELADO: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold focus:ring-rose-500/30",
}

const estadoLabels: Record<TicketEstado, string> = {
  NUEVO: "Nuevo",
  EN_PROCESO: "En Proceso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
}

const prioridadClasses: Record<TicketPrioridad, string> = {
  BAJA: "border border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300 font-medium",
  NORMAL: "border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium",
  ALTA: "border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold",
  URGENTE: "border border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold animate-pulse",
}

const reqClasses: Record<TipoRequerimiento, string> = {
  OTROS: "border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300",
  HARDWARE: "border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
  SOFTWARE: "border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  REDES: "border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300",
  ACCESOS: "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  MANTENIMIENTO: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "—"
  try {
    const date = new Date(isoString)
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

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"

function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(sampleTickets)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [selectedEstado, setSelectedEstado] = useState<"ALL" | TicketEstado>("ALL")
  const [selectedPrioridad, setSelectedPrioridad] = useState<"ALL" | TicketPrioridad>("ALL")
  const [selectedTipo, setSelectedTipo] = useState<"ALL" | TipoRequerimiento>("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  // Estado del Modal de Detalle
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  )

  /**
   * Cambia el estado directamente desde la celda de la tabla y sincroniza en DB
   */
  async function handleEstadoChange(ticketId: number, nuevoEstado: TicketEstado) {
    setUpdatingId(ticketId)
    try {
      await actualizarEstadoTicket(ticketId, nuevoEstado)

      const fechaResolucionActualizada =
        nuevoEstado === "RESUELTO" || nuevoEstado === "CERRADO"
          ? new Date().toISOString()
          : null

      setTickets((prev) =>
        prev.map((item) =>
          item.id === ticketId
            ? {
              ...item,
              estado: nuevoEstado,
              fechaResolucion: fechaResolucionActualizada ?? item.fechaResolucion,
            }
            : item,
        ),
      )

      toast.success(`Ticket #${ticketId} actualizado a "${estadoLabels[nuevoEstado]}"`)
    } catch (error) {
      console.error(error)
      toast.error(`Error al actualizar el estado del ticket #${ticketId}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Columns definition incorporating inline editable status select
  const columns: DataTableColumn<Ticket>[] = [
    {
      key: "id",
      header: "ID",
      cellClassName: "border-b border-border/70 px-4 py-3 font-mono font-semibold text-foreground",
      render: (item) => `#${item.id}`,
    },
    {
      key: "titulo",
      header: "Título de la Incidencia / Solicitud",
      cellClassName: "border-b border-border/70 px-4 py-3 max-w-xs",
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground truncate">{item.titulo}</div>
          {item.originalId && (
            <div className="text-xs font-mono text-muted-foreground">
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
        <div
          className="relative inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <select
            value={item.estado}
            disabled={updatingId === item.id}
            onChange={(e) =>
              handleEstadoChange(item.id, e.target.value as TicketEstado)
            }
            aria-label={`Cambiar estado del ticket #${item.id}`}
            className={`h-8 appearance-none rounded-xl border px-3 pr-7 text-xs shadow-xs outline-none transition-all cursor-pointer ${estadoClasses[item.estado]
              }`}
          >
            <option value="NUEVO">Nuevo</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="CERRADO">Cerrado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          {updatingId === item.id ? (
            <Loader2 className="pointer-events-none absolute right-2 size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-2 size-3.5 opacity-70" />
          )}
        </div>
      ),
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (item) => (
        <Badge className={prioridadClasses[item.prioridad]}>
          {item.prioridad}
        </Badge>
      ),
    },
    {
      key: "tipoRequerimiento",
      header: "Tipo",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (item) => (
        <Badge className={reqClasses[item.tipoRequerimiento]}>
          {item.tipoRequerimiento}
        </Badge>
      ),
    },
    {
      key: "solicitante",
      header: "Solicitante",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[180px]",
      render: (item) => (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-[rgba(91,36,128,0.12)] text-primary shrink-0">
            <UserRound className="size-3.5" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground text-xs">
              {item.solicitante.nombre}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {item.solicitante.email}
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
            <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground text-xs">
                {item.asignadoA.nombre}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {item.asignadoA.email}
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
      render: (item) => item.departamento ?? "—",
    },
    {
      key: "fechaNotificacion",
      header: "Fecha Notificación",
      cellClassName: "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground whitespace-nowrap",
      render: (item) => formatDate(item.fechaNotificacion),
    },
  ]

  // Filtrado reactivo de tickets
  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchSearch =
        !term ||
        ticket.id.toString().includes(term) ||
        ticket.titulo.toLowerCase().includes(term) ||
        ticket.solicitante.nombre.toLowerCase().includes(term) ||
        ticket.solicitante.email.toLowerCase().includes(term) ||
        (ticket.departamento && ticket.departamento.toLowerCase().includes(term)) ||
        (ticket.originalId && ticket.originalId.toString().toLowerCase().includes(term))

      const matchEstado = selectedEstado === "ALL" || ticket.estado === selectedEstado
      const matchPrioridad = selectedPrioridad === "ALL" || ticket.prioridad === selectedPrioridad
      const matchTipo = selectedTipo === "ALL" || ticket.tipoRequerimiento === selectedTipo

      return matchSearch && matchEstado && matchPrioridad && matchTipo
    })
  }, [tickets, search, selectedEstado, selectedPrioridad, selectedTipo])

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedTickets = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredTickets.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTickets, activePage])

  const handleRowDoubleClick = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id)
    setIsDetailOpen(true)
  }

  // Estructuración declarativa para el DetailDialog del Ticket
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
                {selectedTicket.prioridad}
              </Badge>
            ),
          },
          {
            key: "tipoRequerimiento",
            label: "Tipo de Requerimiento",
            value: (
              <Badge className={reqClasses[selectedTicket.tipoRequerimiento]}>
                {selectedTicket.tipoRequerimiento}
              </Badge>
            ),
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
            value: selectedTicket.solicitante.email,
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
            value: selectedTicket.asignadoA
              ? selectedTicket.asignadoA.email
              : "—",
          },
          {
            key: "departamento",
            label: "Departamento",
            value: selectedTicket.departamento ?? "No especificado",
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
        ],
      },
    ]
    : []

  return (
    <div className="space-y-6">
      <ModuleHeader
        eyebrow="Mesa de Ayuda TI"
        title="Gestión de Tickets e Incidencias"
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Campo de búsqueda */}
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por ID, título, solicitante o departamento..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm"
              />
            </div>

            {/* Filtro Estado */}
            <div className="relative">
              <select
                value={selectedEstado}
                onChange={(e) => {
                  setSelectedEstado(e.target.value as "ALL" | TicketEstado)
                  setCurrentPage(1)
                }}
                className="h-10 appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="NUEVO">Nuevo</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="RESUELTO">Resuelto</option>
                <option value="CERRADO">Cerrado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Filtro Prioridad */}
            <div className="relative">
              <select
                value={selectedPrioridad}
                onChange={(e) => {
                  setSelectedPrioridad(e.target.value as "ALL" | TicketPrioridad)
                  setCurrentPage(1)
                }}
                className="h-10 appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm cursor-pointer"
              >
                <option value="ALL">Todas las Prioridades</option>
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Filtro Tipo de Requerimiento */}
            <div className="relative">
              <select
                value={selectedTipo}
                onChange={(e) => {
                  setSelectedTipo(e.target.value as "ALL" | TipoRequerimiento)
                  setCurrentPage(1)
                }}
                className="h-10 appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm cursor-pointer"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="OTROS">Otros</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="REDES">Redes</option>
                <option value="ACCESOS">Accesos</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {filteredTickets.length} tickets registrados
          </span>
        }
      />

      {/* Tabla Principal usando el componente base DataTable */}
      <DataTable<Ticket>
        columns={columns}
        data={paginatedTickets}
        rowKey={(ticket) => ticket.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredTickets.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onRowDoubleClick={handleRowDoubleClick}
        onRowClick={(ticket) => setSelectedTicketId(ticket.id)}
        selectedRowKey={selectedTicketId}
        emptyMessage="No se encontraron tickets con los criterios de búsqueda seleccionados."
      />

      {/* Modal de Detalle de Ticket usando el componente base DetailDialog (sin botón de editar) */}
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

export default TicketsPage
