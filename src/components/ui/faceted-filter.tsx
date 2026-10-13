import * as React from "react"
import { ListFilter, Search, X } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface FacetOption {
  value: string
  label: string
}

export interface FacetDimension {
  id: string
  label: string
  options: FacetOption[]
  icon?: React.ComponentType<{ className?: string }>
}

export type FacetSelections = Record<string, string[]>

export interface FacetedFilterProps {
  dimensions: FacetDimension[]
  selections: FacetSelections
  onChange: (dimensionId: string, values: string[]) => void
  onClearAll: () => void
}

export function FacetedFilter({
  dimensions,
  selections,
  onChange,
  onClearAll,
}: FacetedFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [activeDimensionId, setActiveDimensionId] = React.useState(
    () => dimensions[0]?.id ?? ""
  )
  const [busqueda, setBusqueda] = React.useState("")

  const activeDimension =
    dimensions.find((dimension) => dimension.id === activeDimensionId) ??
    dimensions[0]

  const totalSeleccionados = Object.values(selections).reduce(
    (total, values) => total + values.length,
    0
  )

  const seleccionActiva = activeDimension
    ? (selections[activeDimension.id] ?? [])
    : []

  const opcionesFiltradas = React.useMemo(() => {
    if (!activeDimension) return []
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return activeDimension.options
    return activeDimension.options.filter((option) =>
      option.label.toLowerCase().includes(termino)
    )
  }, [activeDimension, busqueda])

  function toggleOpcion(value: string) {
    if (!activeDimension) return
    const siguiente = seleccionActiva.includes(value)
      ? seleccionActiva.filter((seleccion) => seleccion !== value)
      : [...seleccionActiva, value]
    onChange(activeDimension.id, siguiente)
  }

  function seleccionarDimension(dimensionId: string) {
    setActiveDimensionId(dimensionId)
    setBusqueda("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-10 rounded-2xl border border-border/80 px-3 text-xs font-medium",
            totalSeleccionados > 0 && "border-primary/50 bg-primary/5"
          )}
        >
          <ListFilter />
          Filtro
          {totalSeleccionados > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 justify-center rounded-md px-1 text-[11px]">
              {totalSeleccionados}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-[min(460px,calc(100vw-2rem))] p-0">
        <div className="flex min-h-0">
          <div className="flex w-36 shrink-0 flex-col gap-0.5 border-r border-border p-2 sm:w-44">
            <span className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Filtrar por
            </span>
            {dimensions.map((dimension) => {
              const seleccionados = selections[dimension.id]?.length ?? 0
              const activa = dimension.id === activeDimension?.id
              const Icon = dimension.icon
              return (
                <button
                  key={dimension.id}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => seleccionarDimension(dimension.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden transition-colors",
                    activa
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  {Icon && (
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate">{dimension.label}</span>
                  {seleccionados > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 justify-center rounded-md px-1 text-[11px]"
                    >
                      {seleccionados}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-border p-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder={`Buscar ${activeDimension?.label.toLowerCase() ?? ""}...`}
                  className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
              </div>
              {seleccionActiva.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() =>
                    activeDimension && onChange(activeDimension.id, [])
                  }
                >
                  Borrar
                </Button>
              )}
            </div>

            <div className="max-h-64 min-h-32 overflow-y-auto p-1">
              {opcionesFiltradas.length === 0 ? (
                <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                  Sin resultados
                </p>
              ) : (
                opcionesFiltradas.map((option) => {
                  const checked = seleccionActiva.includes(option.value)
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50",
                        checked && "bg-accent/40"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleOpcion(option.value)}
                      />
                      <span className="flex-1 truncate">{option.label}</span>
                    </label>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border p-2">
              <span className="text-xs text-muted-foreground">
                {seleccionActiva.length > 0
                  ? `${seleccionActiva.length} seleccionado${
                      seleccionActiva.length === 1 ? "" : "s"
                    }`
                  : "Sin selección"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={onClearAll}
                disabled={totalSeleccionados === 0}
              >
                <X />
                Borrar todo
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
