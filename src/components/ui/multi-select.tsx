import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  /** Valores actualmente seleccionados. */
  values: string[]
  onChange: (values: string[]) => void
  /** Texto mostrado cuando no hay selección. */
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  id?: string
  /** Valores seleccionados en otro control: se muestran deshabilitados. */
  excludedValues?: string[]
  /** Etiqueta mostrada junto a las opciones excluidas. */
  excludedHint?: string
  className?: string
}

const triggerClass =
  "flex h-8 w-full items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-3 text-[13px] text-foreground shadow-sm transition outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/55"

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  disabled = false,
  id,
  excludedValues = [],
  excludedHint = "Ya incluido",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [busqueda, setBusqueda] = React.useState("")

  const seleccionados = React.useMemo(() => new Set(values), [values])
  const excluidos = React.useMemo(
    () => new Set(excludedValues),
    [excludedValues],
  )

  const filtradas = React.useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(termino) ||
        option.value.toLowerCase().includes(termino),
    )
  }, [options, busqueda])

  function toggleOpcion(value: string) {
    if (seleccionados.has(value)) {
      onChange(values.filter((seleccion) => seleccion !== value))
    } else {
      onChange([...values, value])
    }
  }

  const etiquetas = values.map(
    (value) =>
      options.find((option) => option.value === value)?.label ?? value,
  )

  const resumen =
    etiquetas.length === 0
      ? placeholder
      : etiquetas.length <= 2
        ? etiquetas.join(", ")
        : `${etiquetas.length} seleccionados`

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setBusqueda("")
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            triggerClass,
            values.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex-1 truncate text-left">{resumen}</span>
          {values.length > 0 && (
            <Badge className="h-5 min-w-5 shrink-0 justify-center rounded-md px-1 text-[11px]">
              {values.length}
            </Badge>
          )}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[min(360px,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center gap-2 border-b border-border p-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="max-h-64 min-h-32 overflow-y-auto p-1">
          {filtradas.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            filtradas.map((option) => {
              const checked = seleccionados.has(option.value)
              const excluded = !checked && excluidos.has(option.value)
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50",
                    checked && "bg-accent/40",
                    excluded &&
                      "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={excluded}
                    onCheckedChange={() => {
                      if (excluded) return
                      toggleOpcion(option.value)
                    }}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {excluded && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {excludedHint}
                    </span>
                  )}
                  {checked && <Check className="size-3.5 text-primary" />}
                </label>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <span className="text-xs text-muted-foreground">
            {values.length > 0
              ? `${values.length} seleccionado${values.length === 1 ? "" : "s"}`
              : "Sin selección"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => onChange([])}
            disabled={values.length === 0}
          >
            <X />
            Limpiar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
