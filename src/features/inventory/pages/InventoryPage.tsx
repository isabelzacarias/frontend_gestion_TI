import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Plus,
  Search,
  UserRound,
} from "lucide-react"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import {
  AssetFormDialog,
  type AssetFormDraft,
} from "@/features/inventory/components/AssetFormDialog"
import { inventoryData, type InventoryItem } from "@/features/inventory/data/inventoryData"

const stateClasses: Record<InventoryItem["estado"], string> = {
  EN_USO: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  DISPONIBLE: "border border-sky-500/30 bg-sky-500/10 text-sky-600",
  MANTENIMIENTO: "border border-amber-500/30 bg-amber-500/10 text-amber-600",
  BAJA: "border border-rose-500/30 bg-rose-500/10 text-rose-600",
}

const generalClasses: Record<InventoryItem["estadoGeneral"], string> = {
  Excelente: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  Bueno: "border border-violet-500/30 bg-violet-500/10 text-violet-600",
  Regular: "border border-amber-500/30 bg-amber-500/10 text-amber-600",
  Crítico: "border border-rose-500/30 bg-rose-500/10 text-rose-600",
}

const stateLabels: Record<InventoryItem["estado"], string> = {
  EN_USO: "En uso",
  DISPONIBLE: "Disponible",
  MANTENIMIENTO: "Mantenimiento",
  BAJA: "Baja",
}

const ITEMS_PER_PAGE = 10

const createEmptyAssetDraft = (): AssetFormDraft => ({
  cb23: "",
  tipo: "Laptop",
  marca: "",
  modelo: "",
  numeroSerie: "",
  sucursal: "PLAYA",
  estado: "DISPONIBLE",
  estadoGeneral: "Bueno",
  nombreRed: "",
  responsableNombre: "",
  responsableEmail: "",
})

const toAssetDraft = (item: InventoryItem): AssetFormDraft => ({
  cb23: item.cb23,
  tipo: item.tipo,
  marca: item.marca,
  modelo: item.modelo,
  numeroSerie: item.numeroSerie,
  sucursal: item.sucursal,
  estado: item.estado,
  estadoGeneral: item.estadoGeneral,
  nombreRed: item.nombreRed,
  responsableNombre: item.responsable.nombre,
  responsableEmail: item.responsable.email,
})

/* ──────────────────────────────────────────────
 * Definición declarativa de las columnas
 * ────────────────────────────────────────────── */
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"

const columns: DataTableColumn<InventoryItem>[] = [
  {
    key: "id",
    header: "ID",
    cellClassName: "border-b border-border/70 px-4 py-3 font-semibold text-foreground",
    render: (item) => item.id,
  },
  { key: "cb23", header: "CB23", cellClassName: cellBase, render: (item) => item.cb23 },
  { key: "tipo", header: "Tipo", cellClassName: cellBase, render: (item) => item.tipo },
  { key: "marca", header: "Marca", cellClassName: cellBase, render: (item) => item.marca },
  { key: "modelo", header: "Modelo", cellClassName: cellBase, render: (item) => item.modelo },
  { key: "numeroSerie", header: "No. serie", cellClassName: cellBase, render: (item) => item.numeroSerie },
  { key: "sucursal", header: "Sucursal", cellClassName: cellBase, render: (item) => item.sucursal },
  {
    key: "estado",
    header: "Estado",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => <Badge className={stateClasses[item.estado]}>{item.estado}</Badge>,
  },
  {
    key: "estadoGeneral",
    header: "General",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <Badge className={generalClasses[item.estadoGeneral]}>{item.estadoGeneral}</Badge>
    ),
  },
  { key: "nombreRed", header: "Red", cellClassName: cellBase, render: (item) => item.nombreRed },
  {
    key: "responsable",
    header: "Responsable",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-[rgba(6,182,212,0.12)] text-primary">
          <UserRound className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">
            {item.responsable.nombre}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {item.responsable.email}
          </div>
        </div>
      </div>
    ),
  },
]

function InventoryPage() {
  const [inventory, setInventory] = useState(inventoryData)
  const [search, setSearch] = useState("")
  const [selectedState, setSelectedState] = useState<"ALL" | InventoryItem["estado"]>("ALL")
  const [selectedBranch, setSelectedBranch] = useState<"ALL" | string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
  const [draft, setDraft] = useState(createEmptyAssetDraft())
  const selectedAsset = inventory.find((item) => item.id === selectedAssetId)
  const detailSections: DetailSection[] = selectedAsset
    ? [
        {
          title: "Identificación",
          color: "primary",
          fields: [
            { key: "id", label: "ID", value: selectedAsset.id },
            { key: "cb23", label: "CB23", value: selectedAsset.cb23 },
           
            { key: "tipo", label: "Tipo", value: selectedAsset.tipo },
            { key: "marca", label: "Marca", value: selectedAsset.marca },
            { key: "modelo", label: "Modelo", value: selectedAsset.modelo },
            {
              key: "numeroSerie",
              label: "Número de serie",
              value: selectedAsset.numeroSerie,
            },
          ],
        },
        {
          title: "Ubicación y estado",
          color: "cyan",
          fields: [
            { key: "sucursal", label: "Sucursal", value: selectedAsset.sucursal },
            {
              key: "estado",
              label: "Estado",
              value: stateLabels[selectedAsset.estado],
            },
            {
              key: "estadoGeneral",
              label: "Estado general",
              value: selectedAsset.estadoGeneral,
            },
            { key: "nombreRed", label: "Red", value: selectedAsset.nombreRed },
          ],
        },
        {
          title: "Responsable",
          color: "violet",
          fields: [
            {
              key: "responsableNombre",
              label: "Nombre completo",
              value: selectedAsset.responsable.nombre,
            },
            {
              key: "responsableEmail",
              label: "Correo electrónico",
              value: selectedAsset.responsable.email,
            },
          ],
        },
      ]
    : []

  const filteredInventory = useMemo(() => {
    const term = search.toLowerCase().trim()

    return inventory.filter((item) => {
      const matchesState = selectedState === "ALL" || item.estado === selectedState
      const matchesBranch = selectedBranch === "ALL" || item.sucursal === selectedBranch

      if (!matchesState || !matchesBranch) return false

      if (!term) return true

      const searchableText = [item.tipo, item.responsable.nombre, item.marca, item.modelo].join(" ").toLowerCase()

      return searchableText.includes(term)
    })
  }, [inventory, search, selectedState, selectedBranch])

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / ITEMS_PER_PAGE))
  const page = Math.min(currentPage, totalPages)
  const paginatedInventory = filteredInventory.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const handleDraftChange = <K extends keyof AssetFormDraft>(field: K, value: AssetFormDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleCreateAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextItem: InventoryItem = {
      id: Date.now(),
      claveActivo: null,
      cb23: draft.cb23.trim() || `CB-${Date.now().toString().slice(-6)}`,
      tipo: draft.tipo,
      marca: draft.marca.trim() || "Sin marca",
      modelo: draft.modelo.trim() || "Sin modelo",
      numeroSerie: draft.numeroSerie.trim() || "N/A",
      sucursal: draft.sucursal,
      estado: draft.estado,
      estadoGeneral: draft.estadoGeneral,
      nombreRed: draft.nombreRed.trim() || "SIN_RED",
      responsable: {
        id: `USR-${Date.now().toString().slice(-4)}`,
        nombre: draft.responsableNombre.trim() || "Sin responsable",
        email: draft.responsableEmail.trim() || "sin.responsable@empresa.com",
      },
    }

    setInventory((current) => [nextItem, ...current])
    setDraft(createEmptyAssetDraft())
    setIsAddDialogOpen(false)
    setCurrentPage(1)
  }

  const handleSelectAsset = (item: InventoryItem) => {
    setSelectedAssetId(item.id)
  }

  const handleOpenEditDialog = (item: InventoryItem) => {
    setSelectedAssetId(item.id)
    setDraft(toAssetDraft(item))
    setIsDetailDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleOpenDetails = (item: InventoryItem) => {
    setSelectedAssetId(item.id)
    setIsDetailDialogOpen(true)
  }

  const handleUpdateAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedAssetId === null) return

    setInventory((current) =>
      current.map((item) =>
        item.id === selectedAssetId
          ? {
              ...item,
              cb23: draft.cb23.trim() || item.cb23,
              tipo: draft.tipo,
              marca: draft.marca.trim() || item.marca,
              modelo: draft.modelo.trim() || item.modelo,
              numeroSerie: draft.numeroSerie.trim() || item.numeroSerie,
              sucursal: draft.sucursal,
              estado: draft.estado,
              estadoGeneral: draft.estadoGeneral,
              nombreRed: draft.nombreRed.trim() || item.nombreRed,
              responsable: {
                ...item.responsable,
                nombre: draft.responsableNombre.trim() || item.responsable.nombre,
                email: draft.responsableEmail.trim() || item.responsable.email,
              },
            }
          : item,
      ),
    )

    setDraft(createEmptyAssetDraft())
    setSelectedAssetId(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteAsset = () => {
    if (selectedAssetId === null) return

    setInventory((current) => current.filter((item) => item.id !== selectedAssetId))
    setDraft(createEmptyAssetDraft())
    setSelectedAssetId(null)
    setIsEditDialogOpen(false)
    setCurrentPage(1)
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Inventario TI"
        title="Consulta de activos"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.05)] backdrop-blur-md hover:bg-white/90 dark:border-violet-400/30 dark:bg-slate-900/70 dark:text-violet-100 dark:hover:bg-slate-800/90"
            >
              <Download className="size-4" />
              Exportar
            </Button>

            <Button
              type="button"
              onClick={() => setIsAddDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
            >
              <Plus className="size-4" />
              Agregar
            </Button>
          </>
        }
        filters={
          <>
            <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(91,36,128,0.08)] backdrop-blur-md md:min-w-[290px] dark:border-white/10 dark:bg-slate-900/55 dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),0_12px_25px_rgba(15,23,42,0.18)]">
              <Search className="size-4 text-primary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar activo o responsable..."
                className="w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Buscar inventario"
              />
            </div>

            <div className="relative inline-flex min-w-[180px] items-center">
              <select
                value={selectedState}
                onChange={(event) =>
                  setSelectedState(event.target.value as "ALL" | InventoryItem["estado"])
                }
                className="w-full appearance-none rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.05)] outline-none backdrop-blur-md transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55"
                aria-label="Filtrar por estado"
              >
                <option value="ALL">Todos los estados</option>
                <option value="EN_USO">En uso</option>
                <option value="DISPONIBLE">Disponible</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="BAJA">Baja</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
            </div>

            <div className="relative inline-flex min-w-[180px] items-center">
              <select
                value={selectedBranch}
                onChange={(event) => setSelectedBranch(event.target.value as "ALL" | string)}
                className="w-full appearance-none rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.05)] outline-none backdrop-blur-md transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55"
                aria-label="Filtrar por sucursal"
              >
                <option value="ALL">Todas las sucursales</option>
                <option value="PLAYA">PLAYA</option>
                <option value="MERIDA">MERIDA</option>
                <option value="CANCUN">CANCUN</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
            </div>
          </>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {filteredInventory.length} registros
          </span>
        }
      />

      <DetailDialog
        open={isDetailDialogOpen && selectedAsset !== undefined}
        title={selectedAsset ? `${selectedAsset.tipo} - ${selectedAsset.cb23}` : "Detalle del activo"}
        description="Información del equipo registrado en el inventario TI."
        icon={<UserRound aria-hidden="true" className="size-5" />}
        sections={detailSections}
        onOpenChange={setIsDetailDialogOpen}
        onEdit={() => {
          if (selectedAsset) handleOpenEditDialog(selectedAsset)
        }}
      />

      <AssetFormDialog
        open={isAddDialogOpen}
        draft={draft}
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleCreateAsset}
      />

      <AssetFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        onOpenChange={(nextOpen) => {
          setIsEditDialogOpen(nextOpen)
          if (!nextOpen) {
            setSelectedAssetId(null)
            setDraft(createEmptyAssetDraft())
          }
        }}
        onChange={handleDraftChange}
        onSubmit={handleUpdateAsset}
        onDelete={handleDeleteAsset}
      />

      <DataTable<InventoryItem>
        columns={columns}
        data={paginatedInventory}
        rowKey={(item) => item.id}
        page={page}
        totalPages={totalPages}
        totalFiltered={filteredInventory.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onRowClick={handleSelectAsset}
        onRowDoubleClick={handleOpenDetails}
        selectedRowKey={selectedAssetId}
      />
    </div>
  )
}

export default InventoryPage
