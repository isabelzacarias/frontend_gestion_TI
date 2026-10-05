import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Plus,
  Search,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function InventoryPage() {
  const [inventory, setInventory] = useState(inventoryData)
  const [search, setSearch] = useState("")
  const [selectedState, setSelectedState] = useState<"ALL" | InventoryItem["estado"]>("ALL")
  const [selectedBranch, setSelectedBranch] = useState<"ALL" | string>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [draft, setDraft] = useState(createEmptyAssetDraft())

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

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="rounded-[30px] border border-white/40 bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.28),transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(243,232,255,0.82),_rgba(230,247,255,0.86))] p-4 shadow-[0_22px_70px_rgba(91,36,128,0.12)] backdrop-blur-xl ring-1 ring-white/40 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.22),transparent_30%),linear-gradient(135deg,_rgba(17,11,28,0.92),_rgba(14,22,36,0.96),_rgba(17,24,39,0.92))] dark:shadow-[0_26px_80px_rgba(13,18,32,0.42)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80 dark:text-violet-200 dark:drop-shadow-[0_0_10px_rgba(196,181,253,0.35)]">
              Inventario TI
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground dark:text-white dark:drop-shadow-[0_0_14px_rgba(255,255,255,0.12)]">
              Consulta de activos
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
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
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
              <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
              {filteredInventory.length} registros
            </span>
          </div>
        </div>
      </div>

      <AssetFormDialog
        open={isAddDialogOpen}
        draft={draft}
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleCreateAsset}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_12px_35px_rgba(17,24,39,0.06)]">
        <div
          className="min-h-0 flex-1 overflow-auto"
          style={{ overscrollBehaviorY: "none", overflowAnchor: "none" }}
        >
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] text-white shadow-sm">
              <tr>
                {[
                  "ID",
                  "CB23",
                  "Tipo",
                  "Marca",
                  "Modelo",
                  "No. serie",
                  "Sucursal",
                  "Estado",
                  "General",
                  "Red",
                  "Responsable",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 font-semibold tracking-[0.04em] first:rounded-tl-2xl last:rounded-tr-2xl"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-background/80" : "bg-[rgba(91,36,128,0.04)]"}
                >
                  <td className="border-b border-border/70 px-4 py-3 font-semibold text-foreground">
                    {item.id}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.cb23}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.tipo}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.marca}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.modelo}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.numeroSerie}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.sucursal}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3">
                    <Badge className={stateClasses[item.estado]}>{item.estado}</Badge>
                  </td>
                  <td className="border-b border-border/70 px-4 py-3">
                    <Badge className={generalClasses[item.estadoGeneral]}>
                      {item.estadoGeneral}
                    </Badge>
                  </td>
                  <td className="border-b border-border/70 px-4 py-3 text-foreground/90">
                    {item.nombreRed}
                  </td>
                  <td className="border-b border-border/70 px-4 py-3">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/80 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Mostrando {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredInventory.length)}-{Math.min(page * ITEMS_PER_PAGE, filteredInventory.length)} de {filteredInventory.length}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              Anterior
            </button>
            <span className="min-w-[72px] text-center font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryPage
