import { useState } from "react"
import { useNavigate } from "react-router"
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Eye,
  Inbox,
  Loader2,
  RefreshCw,
  Ticket as TicketIcon,
  UserRound,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import type {
  Ticket,
  TicketPrioridad,
  TipoRequerimiento,
} from "@/features/tickets/types/ticket"

interface NewTicketsPanelProps {
  tickets: Ticket[]
  total: number | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onClose: () => void
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

export function NewTicketsPanel({
  tickets,
  total,
  isLoading,
  error,
  onRefresh,
  onClose,
}: NewTicketsPanelProps) {
  const navigate = useNavigate()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  function handleOpenDetail(ticket: Ticket) {
    setSelectedTicket(ticket)
    setIsDetailOpen(true)
  }

  const detailSections: DetailSection[] = selectedTicket
    ? [
        {
          title: "Información General",
          color: "primary",
          fields: [
            {
              key: "id",
              label: "ID Incidencia",
              value: `#${selectedTicket.id}`,
            },
            {
              key: "titulo",
              label: "Título",
              value: selectedTicket.titulo,
              colSpan: "sm:col-span-2",
            },
            {
              key: "estado",
              label: "Estado",
              value: (
                <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold">
                  Nuevo
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
              label: "Tipo",
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
              key: "asignadoA",
              label: "Técnico Asignado",
              value: selectedTicket.asignadoA?.nombre ?? "Sin asignar (Pendiente)",
            },
            {
              key: "departamento",
              label: "Departamento",
              value: selectedTicket.departamento ?? "No especificado",
            },
          ],
        },
        {
          title: "Fechas",
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
    <section className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/85 p-6 shadow-[0_20px_60px_rgba(91,36,128,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-card/80 transition-all duration-300">
      {/* Cabecera del panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-700 text-white shadow-md">
            <Inbox className="size-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Incidencias Nuevas Pendientes
              </h2>
              {total !== null && (
                <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold">
                  {total} en total
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consulta en tiempo real vía <code className="text-primary font-mono text-[11px]">/api/incidencias?estado=NUEVO</code>
            </p>
          </div>
        </div>

        {/* Acciones de la cabecera */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-xl border-border/70 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            size="sm"
            onClick={() => navigate("/tickets?estado=NUEVO")}
            className="rounded-xl bg-gradient-to-r from-primary to-primary-600 text-white gap-1.5 text-xs font-semibold shadow-[0_8px_20px_rgba(91,36,128,0.22)] hover:brightness-105"
          >
            Ver todas en Mesa de Ayuda
            <ExternalLink className="size-3.5" />
          </Button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Contenido / Estado de Carga o Error */}
      <div className="mt-5">
        {isLoading && tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Cargando incidencias nuevas desde la API...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
            <AlertCircle className="size-8 text-rose-500 mb-2" />
            <h4 className="font-semibold text-foreground">Error al consultar la API</h4>
            <p className="text-xs text-muted-foreground max-w-md mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-4 rounded-xl text-xs"
            >
              Reintentar conexión
            </Button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 mb-3">
              <Inbox className="size-6" />
            </div>
            <h4 className="font-semibold text-foreground">¡Todo al día!</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              No se encontraron incidencias nuevas con estado NUEVO pendientes de atención.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-background/60 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-primary to-primary-600 text-white font-semibold">
                    <th className="py-3 px-4 font-mono">ID</th>
                    <th className="py-3 px-4">Título</th>
                    <th className="py-3 px-4">Solicitante</th>
                    <th className="py-3 px-4">Prioridad</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Fecha Notificación</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tickets.map((ticket, index) => (
                    <tr
                      key={ticket.id}
                      onClick={() => handleOpenDetail(ticket)}
                      className={`cursor-pointer transition-colors hover:bg-primary/[0.06] ${
                        index % 2 === 1
                          ? "bg-[rgba(91,36,128,0.02)] dark:bg-white/[0.02]"
                          : "bg-transparent"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        #{ticket.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground max-w-[280px] truncate">
                        {ticket.titulo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserRound className="size-3.5" />
                          </div>
                          <div className="truncate max-w-[160px]">
                            <p className="font-medium text-foreground truncate">
                              {ticket.solicitante.nombre}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {ticket.solicitante.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={prioridadClasses[ticket.prioridad]}>
                          {ticket.prioridad}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={reqClasses[ticket.tipoRequerimiento]}>
                          {ticket.tipoRequerimiento}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(ticket.fechaNotificacion)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDetail(ticket)
                          }}
                          className="h-7 px-2.5 rounded-lg text-primary hover:text-primary hover:bg-primary/10 text-xs font-semibold gap-1"
                        >
                          <Eye className="size-3.5" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Barra inferior del panel */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-t border-border/60 text-xs text-muted-foreground">
              <span>
                Mostrando las primeras {tickets.length} incidencias en estado NUEVO.
              </span>
              <button
                type="button"
                onClick={() => navigate("/tickets?estado=NUEVO")}
                className="flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                Explorar todos los registros con paginación completa en Tickets
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalle que cumple estrictamente la Regla de Oro del Roadmap */}
      {selectedTicket && (
        <DetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          title={`Incidencia #${selectedTicket.id}`}
          description="Consulta detallada de la incidencia en estado NUEVO."
          icon={<TicketIcon className="size-6 text-white" />}
          sections={detailSections}
        />
      )}
    </section>
  )
}
