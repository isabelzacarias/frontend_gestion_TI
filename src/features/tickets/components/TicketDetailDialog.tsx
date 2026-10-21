import { useEffect, useState } from "react"
import { Ticket as TicketIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { AttachmentsSection } from "@/features/attachments/components/AttachmentsSection"
import {
  TicketApiError,
  obtenerTicket,
} from "@/features/tickets/services/ticket.service"
import {
  estadoClasses,
  estadoLabels,
  prioridadClasses,
  prioridadLabels,
  reqClasses,
  tipoLabels,
} from "@/features/tickets/data/ticket-display"
import type { Ticket, TicketDetalle } from "@/features/tickets/types/ticket"

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

interface TicketDetailDialogProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
}: TicketDetailDialogProps) {
  const [ticketDetail, setTicketDetail] = useState<TicketDetalle | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!open || !ticket) return

    let cancelado = false

    async function cargarDetalle() {
      setDetailLoading(true)
      setTicketDetail(null)
      try {
        const detalle = await obtenerTicket(ticket!.id)
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
  }, [open, ticket])

  if (!ticket) return null

  const detailSections: DetailSection[] = [
    {
      title: "Información General",
      color: "primary",
      fields: [
        { key: "id", label: "ID Ticket", value: `#${ticket.id}` },
        {
          key: "originalId",
          label: "ID Original / Referencia",
          value: ticket.originalId ?? "N/A",
        },
        {
          key: "titulo",
          label: "Título de la Incidencia",
          value: ticket.titulo,
          colSpan: "sm:col-span-2",
        },
        {
          key: "estado",
          label: "Estado Actual",
          value: (
            <Badge className={estadoClasses[ticket.estado]}>
              {estadoLabels[ticket.estado]}
            </Badge>
          ),
        },
        {
          key: "prioridad",
          label: "Prioridad",
          value: (
            <Badge className={prioridadClasses[ticket.prioridad]}>
              {prioridadLabels[ticket.prioridad]}
            </Badge>
          ),
        },
        {
          key: "tipoRequerimiento",
          label: "Tipo de Requerimiento",
          value: (
            <Badge className={reqClasses[ticket.tipoRequerimiento]}>
              {tipoLabels[ticket.tipoRequerimiento]}
            </Badge>
          ),
        },
        {
          key: "descripcion",
          label: "Descripción",
          value: detailLoading ? "Cargando..." : (ticketDetail?.descripcion ?? "—"),
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
          value: ticket.solicitante.nombre,
        },
        {
          key: "solicitanteEmail",
          label: "Correo Solicitante",
          value: ticket.solicitante.email ?? "—",
        },
        {
          key: "asignadoNombre",
          label: "Técnico Asignado",
          value: ticket.asignadoA ? ticket.asignadoA.nombre : "Sin asignar",
        },
        {
          key: "asignadoEmail",
          label: "Correo Asignado",
          value: ticket.asignadoA?.email ?? "—",
        },
        {
          key: "departamento",
          label: "Departamento",
          value: ticket.departamento?.nombre ?? "No especificado",
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
          value: formatDate(ticket.fechaNotificacion),
        },
        {
          key: "fechaResolucion",
          label: "Fecha de Resolución",
          value: formatDate(ticket.fechaResolucion),
        },
        {
          key: "totalActualizaciones",
          label: "Actualizaciones",
          value: String(ticket.totalActualizaciones),
        },
      ],
    },
    {
      title: "Adjuntos",
      color: "amber",
      gridCols: "sm:grid-cols-1",
      fields: [],
      content: (
        <AttachmentsSection
          entidadTipo="INCIDENCIA"
          entidadId={String(ticket.id)}
        />
      ),
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

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Ticket #${ticket.id}`}
      description="Consulta detallada de la incidencia o solicitud."
      icon={<TicketIcon className="size-6 text-white" />}
      sections={detailSections}
    />
  )
}
