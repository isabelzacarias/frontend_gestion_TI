import { useMemo, useState } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Plus,
  Search,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function InventoryPage() {
  const [search, setSearch] = useState("")
  const [selectedState, setSelectedState] = useState<"ALL" | InventoryItem["estado"]>("ALL")
  const [selectedBranch, setSelectedBranch] = useState<"ALL" | string>("ALL")

  const filteredInventory = useMemo(() => {
    const term = search.toLowerCase().trim()

    return inventoryData.filter((item) => {
      const matchesState = selectedState === "ALL" || item.estado === selectedState
      const matchesBranch = selectedBranch === "ALL" || item.sucursal === selectedBranch

      if (!matchesState || !matchesBranch) return false

      if (!term) return true

      const searchableText = [
        item.tipo,
        item.responsable.nombre,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(term)
    })
  }, [search, selectedState, selectedBranch])

  return (
<<<<<<< Updated upstream
    <PagePlaceholder
      title="Inventario"
      description="Consulta los activos de TI y sus asignaciones."
    />
=======
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="rounded-[30px] border border-border/80 bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.16),transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.18),transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(238,232,245,0.96))] p-4 shadow-[0_18px_45px_rgba(91,36,128,0.08)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.18),transparent_35%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.16),transparent_30%),linear-gradient(135deg,_rgba(17,11,28,0.96),_rgba(14,22,36,0.96))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              Inventario
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Consulta de activos
            </h1>
          </div>

          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/85 px-3 py-2 text-sm text-muted-foreground shadow-inner shadow-primary/5 md:min-w-[290px]">
              <Search className="size-4 text-primary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por activo o usuario..."
                className="w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Buscar inventario"
              />
            </div>

            <div className="relative inline-flex min-w-[180px] items-center">
              <select
                value={selectedState}
                onChange={(event) => setSelectedState(event.target.value as "ALL" | InventoryItem["estado"])}
                className="w-full appearance-none rounded-xl border border-border bg-background/85 px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary"
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
                className="w-full appearance-none rounded-xl border border-border bg-background/85 px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary"
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
            <span className="inline-flex items-center gap-2 rounded-lg bg-[color:rgba(6,182,212,0.12)] px-2.5 py-1.5 text-[var(--secondary-800)] dark:text-[var(--accent-200)]">
              <ArrowUpDown className="size-3.5 text-primary" />
              {filteredInventory.length} registros
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_12px_35px_rgba(17,24,39,0.06)]">
        <div className="min-h-0 flex-1 overflow-auto">
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
              {filteredInventory.map((item, index) => (
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
                    <Badge className={generalClasses[item.estadoGeneral]}>{item.estadoGeneral}</Badge>
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
      </div>
    </div>
>>>>>>> Stashed changes
  )
}

export default InventoryPage
