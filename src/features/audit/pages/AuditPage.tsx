import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Boxes,
  CalendarClock,
  CalendarDays,
  RefreshCw,
  ScrollText,
  Search,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  AuditoriaApiError,
  listarTodosLosEventosAuditoria,
  obtenerAuditoria,
} from "@/features/audit/services/auditoria.service"
import type { AuditoriaGlobal } from "@/features/audit/types/audit"
import {
  AUDIT_ACTION_BADGE_CLASS,
  AUDIT_ACTION_LABELS,
  AUDIT_MODULE_BADGE_CLASS,
  AUDIT_MODULE_LABELS,
} from "@/features/audit/utils/audit-display"
import { AuditDetailView } from "@/features/audit/utils/audit-detail"
import { resumenDetalle } from "@/features/audit/utils/audit-detail-format"

const ITEMS_PER_PAGE = 20
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const dateFieldClass =
  "h-9 w-full rounded-xl border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"

const MODULO_OPTIONS = Object.entries(AUDIT_MODULE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

const ACCION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
)

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

function mensajeDeError(error: unknown): string {
  if (error instanceof AuditoriaApiError) {
    if (error.status === 403) {
      return "No tienes permiso para consultar la auditoría (auditoria:leer)."
    }
    return error.message
  }
  return "No se pudo completar la operación."
}

function AuditPage() {
  const [eventos, setEventos] = useState<AuditoriaGlobal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [detalleEvento, setDetalleEvento] = useState<AuditoriaGlobal | null>(
    null,
  )
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelado = false

    async function cargarAuditoria() {
      setIsLoading(true)

      try {
        const lista = await listarTodosLosEventosAuditoria()
        if (cancelado) return
        setEventos(lista)
      } catch (error) {
        if (cancelado) return
        setEventos([])
        toast.error(mensajeDeError(error))
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarAuditoria()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  const recargar = () => setReloadKey((key) => key + 1)

  const usuarioOptions = useMemo(() => {
    const usuarios = new Map<string, string>()
    eventos.forEach((event) => {
      if (!usuarios.has(event.usuario.id)) {
        usuarios.set(event.usuario.id, event.usuario.nombre)
      }
    })
    return Array.from(usuarios, ([id, nombre]) => ({
      value: id,
      label: `${nombre} (${id})`,
    }))
  }, [eventos])

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "modulo",
        label: "Módulo",
        icon: Boxes,
        options: MODULO_OPTIONS,
      },
      {
        id: "accion",
        label: "Acción",
        icon: Activity,
        options: ACCION_OPTIONS,
      },
      {
        id: "usuario",
        label: "Usuario",
        icon: User,
        options: usuarioOptions,
      },
    ],
    [usuarioOptions],
  )

  const filteredEvents = useMemo(() => {
    const term = debouncedSearch.toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selected = facetSelecciones[dimensionId] ?? []
      return selected.length === 0 || selected.includes(value)
    }

    return eventos.filter((event) => {
      const matchSearch =
        term.length === 0 ||
        event.modulo.toLowerCase().includes(term) ||
        event.accion.toLowerCase().includes(term) ||
        (event.entidadId ?? "").toLowerCase().includes(term) ||
        event.usuario.nombre.toLowerCase().includes(term) ||
        event.usuario.id.toLowerCase().includes(term)

      const fecha = event.realizadaEn.slice(0, 10)
      const matchDesde = desde === "" || fecha >= desde
      const matchHasta = hasta === "" || fecha <= hasta

      return (
        matchSearch &&
        matchDesde &&
        matchHasta &&
        matchDimension("modulo", event.modulo) &&
        matchDimension("accion", event.accion) &&
        matchDimension("usuario", event.usuario.id)
      )
    })
  }, [eventos, debouncedSearch, facetSelecciones, desde, hasta])

  const hayFiltros =
    search.trim() !== "" ||
    desde !== "" ||
    hasta !== "" ||
    Object.values(facetSelecciones).some((values) => values.length > 0)

  function handleFacetChange(dimensionId: string, values: string[]) {
    setFacetSelecciones((prev) => ({ ...prev, [dimensionId]: values }))
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setDesde("")
    setHasta("")
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

  const openDetail = (event: AuditoriaGlobal) => {
    setSelectedEventId(event.id)
    setDetalleEvento(event)
    setIsDetailDialogOpen(true)

    void obtenerAuditoria(event.id)
      .then((actualizado) => {
        setDetalleEvento((prev) =>
          prev && prev.id === actualizado.id ? actualizado : prev,
        )
      })
      .catch(() => undefined)
  }

  const columns: DataTableColumn<AuditoriaGlobal>[] = [
    {
      key: "fecha",
      header: "Fecha",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (event) => formatDateTime(event.realizadaEn),
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
      key: "usuario",
      header: "Usuario",
      cellClassName: `${cellBase} min-w-[200px]`,
      render: (event) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User aria-hidden="true" className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {event.usuario.nombre}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {event.usuario.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "entidad",
      header: "Entidad",
      cellClassName: `${cellBase} whitespace-nowrap font-mono text-xs`,
      render: (event) => event.entidadId ?? "—",
    },
    {
      key: "detalle",
      header: "Detalle",
      cellClassName: `${cellBase} max-w-[280px] text-xs text-muted-foreground`,
      render: (event) => (
        <span className="block truncate">{resumenDetalle(event.detalle)}</span>
      ),
    },
  ]

  const detailSections: DetailSection[] = detalleEvento
    ? [
        {
          title: "Evento",
          color: "primary",
          gridCols: "sm:grid-cols-2",
          fields: [
            {
              key: "fecha",
              label: "Fecha y hora",
              value: formatDateTime(detalleEvento.realizadaEn),
            },
            {
              key: "modulo",
              label: "Módulo",
              value: (
                <Badge
                  className={AUDIT_MODULE_BADGE_CLASS[detalleEvento.modulo]}
                >
                  {AUDIT_MODULE_LABELS[detalleEvento.modulo]}
                </Badge>
              ),
            },
            {
              key: "accion",
              label: "Acción",
              value: (
                <Badge
                  className={AUDIT_ACTION_BADGE_CLASS[detalleEvento.accion]}
                >
                  {AUDIT_ACTION_LABELS[detalleEvento.accion]}
                </Badge>
              ),
            },
            {
              key: "usuario",
              label: "Usuario",
              value: `${detalleEvento.usuario.nombre} (${detalleEvento.usuario.id})`,
            },
            {
              key: "entidad",
              label: "ID de entidad",
              value: (
                <span className="font-mono text-xs">
                  {detalleEvento.entidadId ?? "—"}
                </span>
              ),
            },
          ],
        },
        {
          title: "Detalle",
          color: "amber",
          gridCols: "sm:grid-cols-1",
          fields: [
            {
              key: "detalle",
              label: "Información registrada",
              value: <AuditDetailView detalle={detalleEvento.detalle} />,
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
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={recargar}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl px-3 text-xs font-semibold"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por módulo, acción, entidad o usuario..."
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
                setDesde("")
                setHasta("")
                setCurrentPage(1)
              }}
              customFilters={[
                {
                  id: "fechas",
                  label: "Fecha",
                  icon: CalendarDays,
                  active: desde !== "" || hasta !== "",
                  onClear: () => {
                    setDesde("")
                    setHasta("")
                    setCurrentPage(1)
                  },
                  content: (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="auditoria-desde"
                          className="text-[11px] font-medium text-foreground"
                        >
                          Desde
                        </label>
                        <input
                          id="auditoria-desde"
                          type="date"
                          value={desde}
                          onChange={(event) => {
                            setDesde(event.target.value)
                            setCurrentPage(1)
                          }}
                          className={dateFieldClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="auditoria-hasta"
                          className="text-[11px] font-medium text-foreground"
                        >
                          Hasta
                        </label>
                        <input
                          id="auditoria-hasta"
                          type="date"
                          value={hasta}
                          onChange={(event) => {
                            setHasta(event.target.value)
                            setCurrentPage(1)
                          }}
                          className={dateFieldClass}
                        />
                      </div>
                    </div>
                  ),
                },
              ]}
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
            {isLoading
              ? "Cargando..."
              : hayFiltros
                ? `${filteredEvents.length} de ${eventos.length} eventos`
                : `${filteredEvents.length} eventos registrados`}
          </span>
        }
      />

      <DataTable<AuditoriaGlobal>
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
        emptyMessage={
          isLoading
            ? "Cargando eventos de auditoría..."
            : "No se encontraron eventos. El módulo puede no estar instrumentado para este filtro."
        }
      />

      {detalleEvento ? (
        <DetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          title={`Evento #${detalleEvento.id}`}
          description={`${AUDIT_ACTION_LABELS[detalleEvento.accion]} · ${
            AUDIT_MODULE_LABELS[detalleEvento.modulo]
          } · ${formatDateTime(detalleEvento.realizadaEn)}`}
          icon={<ScrollText className="size-6 text-white" />}
          sections={detailSections}
        />
      ) : null}
    </div>
  )
}

export default AuditPage
