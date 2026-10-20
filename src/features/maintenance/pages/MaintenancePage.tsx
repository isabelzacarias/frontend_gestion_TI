import { useMemo, useState, type FormEvent } from "react"
import {
  CalendarClock,
  CircleDot,
  Flame,
  Pencil,
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
  SAMPLE_ACTIVOS,
  SAMPLE_MAINTENANCE_ORDERS,
  SAMPLE_TECNICOS,
} from "@/features/maintenance/data/maintenanceData"
import type {
  MaintenanceFormDraft,
  MaintenanceOrder,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "@/features/maintenance/types/maintenance"
import {
  MAINTENANCE_PRIORITY_BADGE_CLASS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_BADGE_CLASS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_BADGE_CLASS,
  MAINTENANCE_TYPE_LABELS,
} from "@/features/maintenance/utils/maintenance-display"

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function formatDate(value: string | null): string {
  if (!value) return "—"
  const [year, month, day] = value.split("-")
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

const createEmptyDraft = (): MaintenanceFormDraft => ({
  activoId: "",
  tipo: "PREVENTIVO",
  estado: "PROGRAMADO",
  prioridad: "MEDIA",
  tecnico: "",
  fechaProgramada: new Date().toISOString().slice(0, 10),
  fechaRealizada: "",
  costo: "",
  descripcion: "",
})

const toFormDraft = (order: MaintenanceOrder): MaintenanceFormDraft => ({
  activoId: order.activoId,
  tipo: order.tipo,
  estado: order.estado,
  prioridad: order.prioridad,
  tecnico: order.tecnico,
  fechaProgramada: order.fechaProgramada,
  fechaRealizada: order.fechaRealizada ?? "",
  costo: order.costo === null ? "" : String(order.costo),
  descripcion: order.descripcion,
})

function MaintenancePage() {
  const [orders, setOrders] = useState<MaintenanceOrder[]>(
    SAMPLE_MAINTENANCE_ORDERS,
  )
  const [search, setSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [draft, setDraft] = useState<MaintenanceFormDraft>(createEmptyDraft())

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
      const matchSearch =
        term.length === 0 ||
        order.folio.toLowerCase().includes(term) ||
        order.activoLabel.toLowerCase().includes(term) ||
        order.tecnico.toLowerCase().includes(term) ||
        order.descripcion.toLowerCase().includes(term)

      return (
        matchSearch &&
        matchDimension("tipo", order.tipo) &&
        matchDimension("estado", order.estado) &&
        matchDimension("prioridad", order.prioridad) &&
        matchDimension("tecnico", order.tecnico)
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
        options: SAMPLE_TECNICOS.map((tecnico) => ({
          value: tecnico,
          label: tecnico,
        })),
      },
    ],
    [],
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
    if (!draft.tecnico) {
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

  const buildOrderData = () => {
    const activo = SAMPLE_ACTIVOS.find((item) => item.id === draft.activoId)
    const costo = draft.costo.trim() === "" ? null : Number(draft.costo)

    return {
      activoId: draft.activoId,
      activoLabel: activo?.label ?? draft.activoId,
      tipo: draft.tipo as MaintenanceType,
      estado: draft.estado as MaintenanceStatus,
      prioridad: draft.prioridad as MaintenancePriority,
      tecnico: draft.tecnico,
      fechaProgramada: draft.fechaProgramada,
      fechaRealizada: draft.fechaRealizada ? draft.fechaRealizada : null,
      costo,
      descripcion: draft.descripcion.trim(),
    }
  }

  const handleCreateOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validarDraft()) return

    const nextId = orders.reduce((max, order) => Math.max(max, order.id), 0) + 1
    const nuevaOrden: MaintenanceOrder = {
      id: nextId,
      folio: `MTO-${String(nextId).padStart(4, "0")}`,
      ...buildOrderData(),
    }

    setOrders((prev) => [nuevaOrden, ...prev])
    setIsAddDialogOpen(false)
    toast.success(`Orden ${nuevaOrden.folio} creada correctamente.`)
  }

  const handleUpdateOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedOrderId === null || !validarDraft()) return

    const datos = buildOrderData()
    setOrders((prev) =>
      prev.map((order) =>
        order.id === selectedOrderId
          ? { ...order, ...datos, id: order.id, folio: order.folio }
          : order,
      ),
    )
    setIsEditDialogOpen(false)
    toast.success("Orden de mantenimiento actualizada correctamente.")
  }

  const handleDeleteOrder = () => {
    if (selectedOrderId === null) return
    setOrders((prev) => prev.filter((order) => order.id !== selectedOrderId))
    setIsConfirmDeleteOpen(false)
    setIsEditDialogOpen(false)
    setSelectedOrderId(null)
    toast.success("Orden de mantenimiento eliminada.")
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
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[260px]",
      render: (order) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wrench aria-hidden="true" className="size-4" />
          </span>
          <span className="max-w-xs truncate font-semibold text-foreground">
            {order.activoLabel}
          </span>
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
          <span className="truncate text-xs font-medium">{order.tecnico}</span>
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
      render: (order) => (
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
      ),
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
        onRowDoubleClick={(order) => handleOpenEditDialog(order)}
        selectedRowKey={selectedOrderId}
        emptyMessage="No se encontraron órdenes con los criterios de búsqueda seleccionados."
      />

      <MaintenanceFormDialog
        open={isAddDialogOpen}
        draft={draft}
        mode="create"
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleCreateOrder}
      />

      <MaintenanceFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        onOpenChange={setIsEditDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleUpdateOrder}
        onDelete={() => setIsConfirmDeleteOpen(true)}
      />

      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        title="Eliminar orden de mantenimiento"
        itemName={selectedOrder?.folio ?? "esta orden"}
        description="La orden se eliminará de la simulación. Esta acción no se puede deshacer."
        confirmLabel="Eliminar Orden"
        onConfirm={handleDeleteOrder}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  )
}

export default MaintenancePage
