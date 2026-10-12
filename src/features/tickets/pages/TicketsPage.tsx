<<<<<<< Updated upstream
import { PagePlaceholder } from "@/components/common/PagePlaceholder"
=======
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
>>>>>>> Stashed changes

function TicketsPage() {
  return (
    <PagePlaceholder
      title="Tickets"
      description="Gestiona incidencias y solicitudes del area de TI."
    />
  )
}

export default TicketsPage
