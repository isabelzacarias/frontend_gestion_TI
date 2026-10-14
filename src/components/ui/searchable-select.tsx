import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { cn } from "cn"

export interface SearchableSelectOption {
  value: string
  label: string
}

/**
 * A partir de esta cantidad de opciones los selects de `FormDialog` pasan a ser
 * escribibles; por debajo se mantiene el `<select>` nativo (listas cortas).
 */
export const SEARCHABLE_SELECT_MIN_OPTIONS = 8

export interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  id?: string
  ariaLabel?: string
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  required?: boolean
  className?: string
  contentClassName?: string
}

const wrapperClass =
  "relative flex h-8 w-full items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-3 text-[13px] text-foreground shadow-sm transition focus-within:border-primary has-disabled:cursor-not-allowed has-disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/55"

const inputClass =
  "h-full w-full min-w-0 bg-transparent text-inherit outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function SearchableSelect({
  value,
  onChange,
  options,
  id,
  ariaLabel,
  placeholder = "Seleccionar...",
  emptyMessage = "Sin resultados",
  disabled = false,
  required = false,
  className,
  contentClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [texto, setTexto] = React.useState("")
  const [escribiendo, setEscribiendo] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [ancho, setAncho] = React.useState<number | undefined>(undefined)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  const seleccionada = options.find((option) => option.value === value)
  const textoMostrado = open ? texto : (seleccionada?.label ?? "")

  const opcionesFiltradas = React.useMemo(() => {
    if (!escribiendo) return options
    const termino = normalizar(texto.trim())
    if (!termino) return options
    return options.filter(
      (option) =>
        normalizar(option.label).includes(termino) ||
        normalizar(option.value).includes(termino),
    )
  }, [options, texto, escribiendo])

  React.useEffect(() => {
    if (!open) return
    const activo = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    )
    activo?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open])

  function abrir() {
    if (disabled) return
    setAncho(anchorRef.current?.offsetWidth)
    setTexto("")
    setEscribiendo(false)
    const indice = options.findIndex((option) => option.value === value)
    setActiveIndex(indice >= 0 ? indice : 0)
    setOpen(true)
  }

  function cerrar() {
    setOpen(false)
    setEscribiendo(false)
    setTexto("")
  }

  function seleccionar(option: SearchableSelectOption) {
    onChange(option.value)
    setOpen(false)
    setEscribiendo(false)
    setTexto("")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!open) {
        abrir()
        return
      }
      setActiveIndex((indice) =>
        Math.min(indice + 1, opcionesFiltradas.length - 1),
      )
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) {
        abrir()
        return
      }
      setActiveIndex((indice) => Math.max(indice - 1, 0))
    } else if (event.key === "Enter") {
      if (open) {
        event.preventDefault()
        const option = opcionesFiltradas[activeIndex]
        if (option) seleccionar(option)
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault()
        cerrar()
      }
    } else if (event.key === "Tab") {
      cerrar()
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) cerrar()
      }}
    >
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn(wrapperClass, className)}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-required={required}
            aria-activedescendant={
              open && opcionesFiltradas[activeIndex]
                ? `${listId}-option-${activeIndex}`
                : undefined
            }
            className={inputClass}
            value={textoMostrado}
            placeholder={placeholder}
            onFocus={abrir}
            onChange={(event) => {
              setTexto(event.target.value)
              setEscribiendo(true)
              setActiveIndex(0)
              if (!open) {
                setAncho(anchorRef.current?.offsetWidth)
                setOpen(true)
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={cerrar}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) {
                cerrar()
              } else {
                inputRef.current?.focus()
                abrir()
              }
            }}
            className="absolute inset-y-0 right-1 flex w-6 items-center justify-center rounded-md text-muted-foreground"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        style={ancho ? { width: ancho } : undefined}
        className={cn("min-w-56 p-0", contentClassName)}
      >
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          onMouseDown={(event) => event.preventDefault()}
          className="max-h-64 overflow-y-auto p-1"
        >
          {opcionesFiltradas.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            opcionesFiltradas.map((option, index) => {
              const activa = index === activeIndex
              const selected = option.value === value
              return (
                <button
                  key={option.value || "__vacio"}
                  id={`${listId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-index={index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => seleccionar(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    activa && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {selected && <Check className="size-3.5 text-primary" />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
