import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Flame,
  Pencil,
  Play,
  Plus,
  Search,
  User,
  Wrench,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { MaintenanceFormDialog } from "@/features/maintenance/components/MaintenanceFormDialog"
import {
  MantenimientoApiError,
  actualizarMantenimiento,
  cambiarEstadoMantenimiento,
  crearMantenimiento,
  eliminarMantenimiento,
  listarTodosLosMantenimientos,
} from "@/features/maintenance/services/mantenimiento.service"
import type {
  DatosCreacionMantenimiento,
  DatosEdicionMantenimiento,
  MaintenanceFormDraft,
  MaintenanceOrder,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "@/features/maintenance/types/maintenance"
import { useMantenimientoSyncStore } from "@/features/maintenance/store/mantenimientoSyncStore"
import {
  MAINTENANCE_PRIORITY_BADGE_CLASS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_BADGE_CLASS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_BADGE_CLASS,
  MAINTENANCE_TYPE_LABELS,
} from "@/features/maintenance/utils/maintenance-display"
import { listarTodosLosActivos } from "@/services/activo.service"
import {
  listarTodosLosUsuarios,
  type UsuarioLista,
} from "@/services/usuario.service"
import type { ActivoResumen } from "@/types/activo"

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function toDateInput(value: string | null): string {
  if (!value) return ""
  return value.slice(0, 10)
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  const [year, month, day] = value.slice(0, 10).split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—"
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value)
}

function mensajeDeError(error: unknown): string {
  if (error instanceof MantenimientoApiError) return error.message
  return "No se pudo completar la operación."
}

const createEmptyDraft = (): MaintenanceFormDraft => ({
  activoId: "",
  tipo: "PREVENTIVO",
  prioridad: "MEDIA",
  tecnicoId: "",
  fechaProgramada: new Date().toISOString().slice(0, 10),
  fechaRealizada: "",
  costo: "",
  descripcion: "",
})

const toFormDraft = (order: MaintenanceOrder): MaintenanceFormDraft => ({
  activoId: String(order.activoId),
  tipo: order.tipo,
  prioridad: order.prioridad,
  tecnicoId: order.tecnicoId,
  fechaProgramada: toDateInput(order.fechaProgramada),
  fechaRealizada: toDateInput(order.fechaRealizada),
  costo: order.costo === null ? "" : String(order.costo),
  descripcion: order.descripcion ?? "",
})

function MaintenancePage() {
  const [orders, setOrders] = useState<MaintenanceOrder[]>([])
  const [activos, setActivos] = useState<ActivoResumen[]>([])
  const [tecnicos, setTecnicos] = useState<UsuarioLista[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<MaintenanceOrder | null>(null)
  const [draft, setDraft] = useState<MaintenanceFormDraft>(createEmptyDraft())

  const recargar = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelado = false

    async function cargarMantenimientos() {
      setIsLoading(true)

      try {
        const [mantenimientos, activosLista, tecnicosLista] = await Promise.all([
          listarTodosLosMantenimientos(),
          listarTodosLosActivos(),
          listarTodosLosUsuarios({ activo: true }),
        ])
        if (cancelado) return
        setOrders(mantenimientos)
        setActivos(activosLista)
        setTecnicos(tecnicosLista)
      } catch (error) {
        if (cancelado) return
        toast.error(mensajeDeError(error))
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarMantenimientos()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  useEffect(() => {
    const unsubscribe = useMantenimientoSyncStore.subscribe((state, prev) => {
      if (state.lastEvent === prev.lastEvent) return
      setReloadKey((key) => key + 1)
    })
    return unsubscribe
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  )

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selected = facetSelecciones[dimensionId] ?? []
      return selected.length === 0 || selected.includes(value)
    }

    return orders.filter((order) => {
      const claveActivo = order.activo.cb23 ?? ""
      const matchSearch =
        term.length === 0 ||
        order.folio.toLowerCase().includes(term) ||
        claveActivo.toLowerCase().includes(term) ||
        order.activo.tipo.toLowerCase().includes(term) ||
        order.tecnico.nombre.toLowerCase().includes(term) ||
        (order.descripcion ?? "").toLowerCase().includes(term)

      return (
        matchSearch &&
        matchDimension("tipo", order.tipo) &&
        matchDimension("estado", order.estado) &&
        matchDimension("prioridad", order.prioridad) &&
        matchDimension("tecnico", order.tecnicoId)
      )
    })
  }, [orders, search, facetSelecciones])

  const hayFiltros =
    search.trim() !== "" ||
    Object.values(facetSelecciones).some((values) => values.length > 0)

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "tipo",
        label: "Tipo",
        icon: Wrench,
        options: Object.entries(MAINTENANCE_TYPE_LABELS).map(
          ([value, label]) => ({ value, label }),
        ),
      },
      {
        id: "estado",
        label: "Estado",
        icon: CircleDot,
        options: Object.entries(MAINTENANCE_STATUS_LABELS).map(
          ([value, label]) => ({ value, label }),
        ),
      },
      {
        id: "prioridad",
        label: "Prioridad",
        icon: Flame,
        options: Object.entries(MAINTENANCE_PRIORITY_LABELS).map(
          ([value, label]) => ({ value, label }),
        ),
      },
      {
        id: "tecnico",
        label: "Técnico",
        icon: User,
        options: tecnicos.map((tecnico) => ({
          value: tecnico.id,
          label: tecnico.nombre,
        })),
      },
    ],
    [tecnicos],
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
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  )
  const activePage = Math.min(currentPage, totalPages)
  const paginatedOrders = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredOrders, activePage])

  const handleDraftChange = <K extends keyof MaintenanceFormDraft>(
    field: K,
    value: MaintenanceFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenAddDialog = () => {
    setDraft(createEmptyDraft())
    setSelectedOrderId(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (order: MaintenanceOrder) => {
    setSelectedOrderId(order.id)
    setDraft(toFormDraft(order))
    setIsEditDialogOpen(true)
  }

  const validarDraft = (): boolean => {
    if (!draft.activoId) {
      toast.error("Selecciona el activo de la orden.")
      return false
    }
    if (!draft.tecnicoId) {
      toast.error("Selecciona el técnico responsable.")
      return false
    }
    if (!datePattern.test(draft.fechaProgramada)) {
      toast.error("La fecha programada debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaRealizada && !datePattern.test(draft.fechaRealizada)) {
      toast.error("La fecha realizada debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.costo.trim() !== "") {
      const costo = Number(draft.costo)
      if (!Number.isFinite(costo) || costo < 0) {
        toast.error("El costo debe ser un número mayor o igual a cero.")
        return false
      }
    }
    return true
  }

  const buildDatos = (): DatosCreacionMantenimiento => {
    const costo = draft.costo.trim() === "" ? null : Number(draft.costo)
    const descripcion = draft.descripcion.trim()

    return {
      activoId: Number(draft.activoId),
      tipo: draft.tipo as MaintenanceType,
      prioridad: draft.prioridad as MaintenancePriority,
      tecnicoId: draft.tecnicoId,
      fechaProgramada: draft.fechaProgramada,
      fechaRealizada: draft.fechaRealizada ? draft.fechaRealizada : null,
      costo,
      descripcion: descripcion === "" ? null : descripcion,
    }
  }

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validarDraft()) return

    setIsSaving(true)
    try {
      const nuevaOrden = await crearMantenimiento(buildDatos())
      setIsAddDialogOpen(false)
      toast.success(`Orden ${nuevaOrden.folio} creada correctamente.`)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedOrderId === null || !validarDraft()) return

    const datos: DatosEdicionMantenimiento = buildDatos()
    if (selectedOrder?.estado === "EN_PROCESO") {
      delete datos.activoId
    }

    setIsSaving(true)
    try {
      await actualizarMantenimiento(selectedOrderId, datos)
      setIsEditDialogOpen(false)
      toast.success("Orden de mantenimiento actualizada correctamente.")
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCambiarEstado = async (
    order: MaintenanceOrder,
    estado: MaintenanceStatus,
  ) => {
    setIsSaving(true)
    try {
      await cambiarEstadoMantenimiento(order.id, estado)
      toast.success(`La orden ${order.folio} cambió a ${MAINTENANCE_STATUS_LABELS[estado].toLowerCase()}.`)
      setIsEditDialogOpen(false)
      setCancelTarget(null)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
      recargar()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (selectedOrderId === null) return

    setIsSaving(true)
    try {
      await eliminarMantenimiento(selectedOrderId)
      setIsConfirmDeleteOpen(false)
      setIsEditDialogOpen(false)
      setSelectedOrderId(null)
      toast.success("Orden de mantenimiento eliminada.")
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const renderAcciones = (order: MaintenanceOrder) => {
    const pendiente = isSaving

    return (
      <div className="flex items-center justify-end gap-1.5">
        {order.estado === "PROGRAMADO" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Iniciar mantenimiento"
            aria-label={`Iniciar orden ${order.folio}`}
            disabled={pendiente}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            onClick={(event) => {
              event.stopPropagation()
              void handleCambiarEstado(order, "EN_PROCESO")
            }}
          >
            <Play aria-hidden="true" className="size-3.5" />
          </Button>
        )}
        {order.estado === "EN_PROCESO" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Completar mantenimiento"
            aria-label={`Completar orden ${order.folio}`}
            disabled={pendiente}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            onClick={(event) => {
              event.stopPropagation()
              void handleCambiarEstado(order, "COMPLETADO")
            }}
          >
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
          </Button>
        )}
        {(order.estado === "PROGRAMADO" ||
          order.estado === "EN_PROCESO" ||
          order.estado === "COMPLETADO") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Cancelar orden"
            aria-label={`Cancelar orden ${order.folio}`}
            disabled={pendiente}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            onClick={(event) => {
              event.stopPropagation()
              setCancelTarget(order)
            }}
          >
            <Ban aria-hidden="true" className="size-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
          onClick={(event) => {
            event.stopPropagation()
            handleOpenEditDialog(order)
          }}
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          Editar
        </Button>
      </div>
    )
  }

  const columns: DataTableColumn<MaintenanceOrder>[] = [
    {
      key: "folio",
      header: "Folio",
      cellClassName:
        "border-b border-border/70 px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap",
      render: (order) => order.folio,
    },
    {
      key: "activo",
      header: "Activo",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[240px]",
      render: (order) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wrench aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {order.activo.cb23 ?? `#${order.activo.id}`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {order.activo.tipo}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (order) => (
        <Badge className={MAINTENANCE_TYPE_BADGE_CLASS[order.tipo]}>
          {MAINTENANCE_TYPE_LABELS[order.tipo]}
        </Badge>
      ),
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (order) => (
        <Badge className={MAINTENANCE_PRIORITY_BADGE_CLASS[order.prioridad]}>
          {MAINTENANCE_PRIORITY_LABELS[order.prioridad]}
        </Badge>
      ),
    },
    {
      key: "tecnico",
      header: "Técnico",
      cellClassName: `${cellBase} min-w-[200px]`,
      render: (order) => (
        <div className="flex items-center gap-2">
          <User
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <span className="truncate text-xs font-medium">
            {order.tecnico.nombre}
          </span>
        </div>
      ),
    },
    {
      key: "fechaProgramada",
      header: "Programada",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (order) => formatDate(order.fechaProgramada),
    },
    {
      key: "estado",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (order) => (
        <Badge className={MAINTENANCE_STATUS_BADGE_CLASS[order.estado]}>
          {MAINTENANCE_STATUS_LABELS[order.estado]}
        </Badge>
      ),
    },
    {
      key: "costo",
      header: "Costo",
      cellClassName: `${cellBase} whitespace-nowrap text-xs font-medium`,
      render: (order) => formatCurrency(order.costo),
    },
    {
      key: "acciones",
      header: "",
      cellClassName: "border-b border-border/70 px-4 py-3 text-right",
      render: renderAcciones,
    },
  ]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Gestión de Activos"
        title="Mantenimiento"
        actions={
          <Button
            type="button"
            onClick={handleOpenAddDialog}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
          >
            <Plus className="size-4" />
            Nueva Orden
          </Button>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por folio, activo, técnico o descripción..."
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
              ? `${filteredOrders.length} de ${orders.length} órdenes`
              : `${filteredOrders.length} órdenes registradas`}
          </span>
        }
      />

      <DataTable<MaintenanceOrder>
        columns={columns}
        data={paginatedOrders}
        rowKey={(order) => order.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredOrders.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onRowClick={(order) => setSelectedOrderId(order.id)}
        onRowDoubleClick={handleOpenEditDialog}
        selectedRowKey={selectedOrderId}
        emptyMessage={
          isLoading
            ? "Cargando órdenes de mantenimiento..."
            : "No se encontraron órdenes con los criterios de búsqueda seleccionados."
        }
      />

      <MaintenanceFormDialog
        open={isAddDialogOpen}
        draft={draft}
        mode="create"
        activos={activos}
        tecnicos={tecnicos}
        isSaving={isSaving}
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleCreateOrder(event)}
      />

      <MaintenanceFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        estado={selectedOrder?.estado}
        activos={activos}
        tecnicos={tecnicos}
        isSaving={isSaving}
        onOpenChange={setIsEditDialogOpen}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleUpdateOrder(event)}
        onDelete={() => setIsConfirmDeleteOpen(true)}
        onIniciar={() => {
          if (selectedOrder) void handleCambiarEstado(selectedOrder, "EN_PROCESO")
        }}
        onCompletar={() => {
          if (selectedOrder) void handleCambiarEstado(selectedOrder, "COMPLETADO")
        }}
        onCancelar={() => {
          if (selectedOrder) setCancelTarget(selectedOrder)
        }}
      />

      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        title="Eliminar orden de mantenimiento"
        itemName={selectedOrder?.folio ?? "esta orden"}
        description="La orden se eliminará del listado. Esta acción no se puede deshacer."
        confirmLabel="Eliminar Orden"
        onConfirm={() => void handleDeleteOrder()}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />

      <ConfirmDeleteDialog
        open={cancelTarget !== null}
        title="Cancelar orden de mantenimiento"
        itemName={cancelTarget?.folio ?? "esta orden"}
        description="La orden pasará a cancelada y el activo se liberará. Esta acción no se puede deshacer."
        confirmLabel="Cancelar Orden"
        onConfirm={() => {
          if (cancelTarget) void handleCambiarEstado(cancelTarget, "CANCELADO")
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}

export default MaintenancePage
