import { useMemo, useState } from "react"
import {
  Activity,
  Boxes,
  CalendarClock,
  ScrollText,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { SAMPLE_AUDIT_EVENTS } from "@/features/audit/data/auditData"
import type { AuditEvent } from "@/features/audit/types/audit"
import {
  AUDIT_ACTION_BADGE_CLASS,
  AUDIT_ACTION_LABELS,
  AUDIT_MODULE_BADGE_CLASS,
  AUDIT_MODULE_LABELS,
  AUDIT_RESULT_BADGE_CLASS,
  AUDIT_RESULT_LABELS,
} from "@/features/audit/utils/audit-display"

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function DiffField({
  previous,
  next,
}: {
  previous: Record<string, string> | null
  next: Record<string, string> | null
}) {
  const keys = Array.from(
    new Set([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})]),
  )

  if (keys.length === 0) {
    return (
      <span className="text-xs italic text-muted-foreground">
        Este evento no registra cambios de valores.
      </span>
    )
  }

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const previousValue = previous?.[key]
        const nextValue = next?.[key]
        const hasPrevious = previousValue !== undefined
        const hasNext = nextValue !== undefined

        return (
          <div
            key={key}
            className="rounded-xl border border-border/70 bg-background/60 px-3 py-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {key}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {hasPrevious ? (
                <span className="rounded-md bg-rose-500/10 px-2 py-0.5 font-mono text-rose-700 line-through dark:text-rose-400">
                  {previousValue}
                </span>
              ) : null}
              {hasPrevious && hasNext ? (
                <span className="text-muted-foreground">→</span>
              ) : null}
              {hasNext ? (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-emerald-700 dark:text-emerald-400">
                  {nextValue}
                </span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AuditPage() {
  const [search, setSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const selectedEvent = useMemo(
    () => SAMPLE_AUDIT_EVENTS.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId],
  )

  const usuarioOptions = useMemo(() => {
    const usuarios = new Map<string, string>()
    SAMPLE_AUDIT_EVENTS.forEach((event) => {
      if (!usuarios.has(event.usuarioEmail)) {
        usuarios.set(event.usuarioEmail, event.usuarioNombre)
      }
    })
    return Array.from(usuarios, ([email, nombre]) => ({
      value: email,
      label: `${nombre} (${email})`,
    }))
  }, [])

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selected = facetSelecciones[dimensionId] ?? []
      return selected.length === 0 || selected.includes(value)
    }

    return SAMPLE_AUDIT_EVENTS.filter((event) => {
      const matchSearch =
        term.length === 0 ||
        event.entidad.toLowerCase().includes(term) ||
        event.descripcion.toLowerCase().includes(term) ||
        event.ip.toLowerCase().includes(term) ||
        event.usuarioNombre.toLowerCase().includes(term) ||
        event.usuarioEmail.toLowerCase().includes(term)

      return (
        matchSearch &&
        matchDimension("usuario", event.usuarioEmail) &&
        matchDimension("modulo", event.modulo) &&
        matchDimension("accion", event.accion) &&
        matchDimension("resultado", event.resultado)
      )
    })
  }, [search, facetSelecciones])

  const hayFiltros =
    search.trim() !== "" ||
    Object.values(facetSelecciones).some((values) => values.length > 0)

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "usuario",
        label: "Usuario",
        icon: User,
        options: usuarioOptions,
      },
      {
        id: "modulo",
        label: "Módulo",
        icon: Boxes,
        options: Object.entries(AUDIT_MODULE_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        id: "accion",
        label: "Acción",
        icon: Activity,
        options: Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        id: "resultado",
        label: "Resultado",
        icon: ShieldCheck,
        options: Object.entries(AUDIT_RESULT_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
    [usuarioOptions],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    setFacetSelecciones((prev) => ({ ...prev, [dimensionId]: values }))
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setFacetSelecciones({})
    setCurrentPage(1)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / ITEMS_PER_PAGE),
  )
  const activePage = Math.min(currentPage, totalPages)
  const paginatedEvents = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEvents, activePage])

  const openDetail = (event: AuditEvent) => {
    setSelectedEventId(event.id)
    setIsDetailDialogOpen(true)
  }

  const columns: DataTableColumn<AuditEvent>[] = [
    {
      key: "fecha",
      header: "Fecha",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (event) => formatDateTime(event.fecha),
    },
    {
      key: "usuario",
      header: "Usuario",
      cellClassName: `${cellBase} min-w-[220px]`,
      render: (event) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User aria-hidden="true" className="size-3.5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-foreground">
              {event.usuarioNombre}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {event.usuarioEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "modulo",
      header: "Módulo",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (event) => (
        <Badge className={AUDIT_MODULE_BADGE_CLASS[event.modulo]}>
          {AUDIT_MODULE_LABELS[event.modulo]}
        </Badge>
      ),
    },
    {
      key: "accion",
      header: "Acción",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (event) => (
        <Badge className={AUDIT_ACTION_BADGE_CLASS[event.accion]}>
          {AUDIT_ACTION_LABELS[event.accion]}
        </Badge>
      ),
    },
    {
      key: "entidad",
      header: "Entidad",
      cellClassName: `${cellBase} min-w-[180px] font-mono text-xs`,
      render: (event) => (
        <span className="block max-w-[220px] truncate">{event.entidad}</span>
      ),
    },
    {
      key: "resultado",
      header: "Resultado",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (event) => (
        <Badge className={AUDIT_RESULT_BADGE_CLASS[event.resultado]}>
          {AUDIT_RESULT_LABELS[event.resultado]}
        </Badge>
      ),
    },
    {
      key: "ip",
      header: "IP",
      cellClassName: `${cellBase} whitespace-nowrap font-mono text-xs text-muted-foreground`,
      render: (event) => event.ip,
    },
  ]

  const detailSections: DetailSection[] = selectedEvent
    ? [
        {
          title: "Evento",
          color: "primary",
          gridCols: "sm:grid-cols-2",
          fields: [
            {
              key: "fecha",
              label: "Fecha y hora",
              value: formatDateTime(selectedEvent.fecha),
            },
            {
              key: "resultado",
              label: "Resultado",
              value: (
                <Badge className={AUDIT_RESULT_BADGE_CLASS[selectedEvent.resultado]}>
                  {AUDIT_RESULT_LABELS[selectedEvent.resultado]}
                </Badge>
              ),
            },
            {
              key: "usuario",
              label: "Usuario",
              value: `${selectedEvent.usuarioNombre} (${selectedEvent.usuarioEmail})`,
            },
            { key: "rol", label: "Rol", value: selectedEvent.rol },
            {
              key: "modulo",
              label: "Módulo",
              value: (
                <Badge className={AUDIT_MODULE_BADGE_CLASS[selectedEvent.modulo]}>
                  {AUDIT_MODULE_LABELS[selectedEvent.modulo]}
                </Badge>
              ),
            },
            {
              key: "accion",
              label: "Acción",
              value: (
                <Badge className={AUDIT_ACTION_BADGE_CLASS[selectedEvent.accion]}>
                  {AUDIT_ACTION_LABELS[selectedEvent.accion]}
                </Badge>
              ),
            },
            {
              key: "entidad",
              label: "Entidad",
              value: (
                <span className="break-all font-mono text-xs">
                  {selectedEvent.entidad}
                </span>
              ),
            },
            {
              key: "descripcion",
              label: "Descripción",
              colSpan: "sm:col-span-2",
              value: selectedEvent.descripcion,
            },
          ],
        },
        {
          title: "Origen",
          color: "cyan",
          gridCols: "sm:grid-cols-1",
          fields: [
            {
              key: "ip",
              label: "Dirección IP",
              value: (
                <span className="font-mono text-xs">{selectedEvent.ip}</span>
              ),
            },
            {
              key: "userAgent",
              label: "Agente de usuario",
              value: (
                <span className="break-all font-mono text-xs">
                  {selectedEvent.userAgent}
                </span>
              ),
            },
          ],
        },
        {
          title: "Cambios registrados",
          color: "amber",
          gridCols: "sm:grid-cols-1",
          fields: [
            {
              key: "diff",
              label: "Antes → Después",
              value: (
                <DiffField
                  previous={selectedEvent.valoresAnteriores}
                  next={selectedEvent.valoresNuevos}
                />
              ),
            },
          ],
        },
      ]
    : []

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Seguridad y Trazabilidad"
        title="Auditoría"
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por entidad, descripción, usuario o IP..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm"
              />
            </div>

            <FacetedFilter
              dimensions={facetDimensions}
              selections={facetSelecciones}
              onChange={handleFacetChange}
              onClearAll={() => {
                setFacetSelecciones({})
                setCurrentPage(1)
              }}
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
            <CalendarClock className="size-3.5 text-violet-700 dark:text-violet-200" />
            {hayFiltros
              ? `${filteredEvents.length} de ${SAMPLE_AUDIT_EVENTS.length} eventos`
              : `${filteredEvents.length} eventos registrados`}
          </span>
        }
      />

      <DataTable<AuditEvent>
        columns={columns}
        data={paginatedEvents}
        rowKey={(event) => event.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredEvents.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onRowClick={openDetail}
        onRowDoubleClick={openDetail}
        selectedRowKey={selectedEventId}
        emptyMessage="No se encontraron eventos con los criterios de búsqueda seleccionados."
      />

      {selectedEvent ? (
        <DetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          title={AUDIT_ACTION_LABELS[selectedEvent.accion]}
          description={`Evento #${selectedEvent.id} · ${AUDIT_MODULE_LABELS[selectedEvent.modulo]} · ${formatDateTime(selectedEvent.fecha)}`}
          icon={<ScrollText className="size-6 text-white" />}
          sections={detailSections}
        />
      ) : null}
    </div>
  )
}

export default AuditPage
