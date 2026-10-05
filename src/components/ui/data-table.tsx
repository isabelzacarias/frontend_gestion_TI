import type { ReactNode } from "react"

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
  prevLabel = "Anterior",
  nextLabel = "Siguiente",
  showingLabel = "Mostrando",
  ofLabel = "de",
  emptyMessage = "Sin resultados",
}: DataTableProps<T>) {
  const rangeStart = Math.min((page - 1) * itemsPerPage + 1, totalFiltered)
  const rangeEnd = Math.min(page * itemsPerPage, totalFiltered)

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
              data.map((item, index) => (
                <tr
                  key={rowKey(item, index)}
                  className={index % 2 === 0 ? evenRowClass : oddRowClass}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      <div className="flex items-center justify-between gap-3 border-t border-border/80 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
        <span>
          {showingLabel} {rangeStart}-{rangeEnd} {ofLabel} {totalFiltered}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            {prevLabel}
          </button>
          <span className="min-w-[72px] text-center font-medium text-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded-md border border-border bg-background px-2.5 py-1 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
