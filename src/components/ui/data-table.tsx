import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { useRef, type FormEvent, type ReactNode } from "react"

/* ──────────────────────────────────────────────
 * Tipos públicos
 * ────────────────────────────────────────────── */

/** Definición de una columna */
export interface DataTableColumn<T> {
  /** Identificador único de la columna (se usa como key de React) */
  key: string
  /** Texto del encabezado */
  header: string
  /** Función que renderiza la celda para un registro dado.
   *  Puede devolver un string, un número o JSX arbitrario (badges, avatares, etc.) */
  render: (item: T, index: number) => ReactNode
  /** Clases extra para la celda <td> (ej: "font-semibold text-foreground") */
  cellClassName?: string
  /** Clases extra para el <th> */
  headerClassName?: string
}

/** Props del DataTable genérico */
export interface DataTableProps<T> {
  /** Las columnas a renderizar */
  columns: DataTableColumn<T>[]
  /** Los datos ya paginados (el slice de la página actual) */
  data: T[]
  /** Función que devuelve una key única por registro */
  rowKey: (item: T, index: number) => string | number
  /** Número de página actual (1-indexed) */
  page: number
  /** Total de páginas */
  totalPages: number
  /** Total de registros después de filtrar (para el texto "Mostrando X-Y de Z") */
  totalFiltered: number
  /** Registros por página — se usa para calcular "Mostrando X-Y" */
  itemsPerPage: number
  /** Callback para cambiar de página */
  onPageChange: (page: number) => void
  /** Callback al hacer click en una fila */
  onRowClick?: (item: T, index: number) => void
  /** Callback al hacer doble clic en una fila */
  onRowDoubleClick?: (item: T, index: number) => void
  /** Clave seleccionada actualmente */
  selectedRowKey?: string | number | null
  /** Texto del botón "Anterior" — default "Anterior" */
  prevLabel?: string
  /** Texto del botón "Siguiente" — default "Siguiente" */
  nextLabel?: string
  /** Texto antes del rango — default "Mostrando" */
  showingLabel?: string
  /** Texto entre rango y total — default "de" */
  ofLabel?: string
  /** Mensaje cuando no hay registros — default "Sin resultados" */
  emptyMessage?: string
  /** Muestra el control para saltar a una página específica — default true */
  showPageJump?: boolean
}

/* ──────────────────────────────────────────────
 * Estilos constantes
 * ────────────────────────────────────────────── */
const defaultCellClass = "border-b border-border/70 px-4 py-3 text-foreground/90"
const evenRowClass = "bg-background/80"
const oddRowClass = "bg-[rgba(91,36,128,0.04)]"

/* ──────────────────────────────────────────────
 * Componente
 * ────────────────────────────────────────────── */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  page,
  totalPages,
  totalFiltered,
  itemsPerPage,
  onPageChange,
  onRowClick,
  onRowDoubleClick,
  selectedRowKey = null,
  prevLabel = "Anterior",
  nextLabel = "Siguiente",
  showingLabel = "Mostrando",
  ofLabel = "de",
  emptyMessage = "Sin resultados",
  showPageJump = true,
}: DataTableProps<T>) {
  const pageInputRef = useRef<HTMLInputElement>(null)
  const rangeStart = Math.min((page - 1) * itemsPerPage + 1, totalFiltered)
  const rangeEnd = Math.min(page * itemsPerPage, totalFiltered)
  const lastPage = Math.max(1, totalPages)

  const handleJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(pageInputRef.current?.value)
    if (!Number.isFinite(value)) return
    const target = Math.min(Math.max(Math.trunc(value), 1), lastPage)
    if (target !== page) {
      onPageChange(target)
    } else if (pageInputRef.current) {
      pageInputRef.current.value = String(page)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_12px_35px_rgba(17,24,39,0.06)]">
      {/* ─── Scroll area ─── */}
      <div
        className="min-h-0 flex-1 overflow-auto"
        style={{ overscrollBehaviorY: "none", overflowAnchor: "none" }}
      >
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          {/* ─── Header ─── */}
          <thead className="sticky top-0 z-10 bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] text-white shadow-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold tracking-[0.04em] first:rounded-tl-2xl last:rounded-tr-2xl ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* ─── Body ─── */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const currentRowKey = rowKey(item, index)
                const isSelected = selectedRowKey !== null && currentRowKey === selectedRowKey

                return (
                  <tr
                    key={currentRowKey}
                    className={`${index % 2 === 0 ? evenRowClass : oddRowClass}${onRowDoubleClick || onRowClick ? " cursor-pointer transition-colors hover:bg-primary/[0.06] dark:hover:bg-primary/[0.1]" : ""}${isSelected ? " bg-primary/[0.06] ring-1 ring-inset ring-primary/20" : ""}`}
                    onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                    onDoubleClick={
                      onRowDoubleClick
                        ? () => onRowDoubleClick(item, index)
                        : undefined
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={col.cellClassName ?? defaultCellClass}
                      >
                        {col.render(item, index)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
        <span>
          {showingLabel} {rangeStart}-{rangeEnd} {ofLabel} {totalFiltered}
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-label="Primera página"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronsLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            {prevLabel}
          </button>
          <span className="min-w-[72px] text-center font-medium text-foreground">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === lastPage}
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            {nextLabel}
          </button>
          <button
            type="button"
            aria-label="Última página"
            onClick={() => onPageChange(lastPage)}
            disabled={page === lastPage}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronsRight className="size-3.5" />
          </button>

          {showPageJump && (
            <form
              onSubmit={handleJump}
              className="ml-1 flex items-center gap-1.5"
            >
              <input
                ref={pageInputRef}
                key={page}
                type="number"
                min={1}
                max={lastPage}
                defaultValue={page}
                aria-label="Ir a la página"
                className="h-7 w-14 rounded-md border border-border bg-background px-2 text-center text-xs text-foreground outline-none transition focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted"
              >
                Ir
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
