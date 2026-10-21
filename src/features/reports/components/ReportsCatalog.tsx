import { useMemo, useState } from "react"
import {
  AlertCircle,
  ChartBar,
  FileDown,
  Lock,
  RefreshCw,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ReporteMetadata } from "@/features/reports/types/report"
import {
  FORMATO_LABELS,
  formatNumero,
} from "@/features/reports/utils/report-display"

interface ReportsCatalogProps {
  reportes: ReporteMetadata[]
  loading: boolean
  error: string | null
  bloqueados: Record<string, string[]>
  onRetry: () => void
  onOpenReport: (reporte: ReporteMetadata) => void
}

export function ReportsCatalog({
  reportes,
  loading,
  error,
  bloqueados,
  onRetry,
  onOpenReport,
}: ReportsCatalogProps) {
  const [search, setSearch] = useState("")

  const filtrados = useMemo(() => {
    const termino = search.trim().toLowerCase()
    if (!termino) return reportes
    return reportes.filter((reporte) =>
      [reporte.nombre, reporte.descripcion, reporte.modulo, reporte.codigo]
        .join(" ")
        .toLowerCase()
        .includes(termino),
    )
  }, [reportes, search])

  const grupos = useMemo(() => {
    const mapa = new Map<string, ReporteMetadata[]>()
    filtrados.forEach((reporte) => {
      const actuales = mapa.get(reporte.modulo) ?? []
      actuales.push(reporte)
      mapa.set(reporte.modulo, actuales)
    })
    return Array.from(mapa.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "es"),
    )
  }, [filtrados])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl bg-muted/60"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
        <div className="flex items-center gap-2">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8 rounded-xl px-3 text-xs font-semibold"
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (reportes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
        No hay reportes disponibles.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar reporte por nombre, módulo o código..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-background/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No se encontraron reportes con ese criterio.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {grupos.map(([modulo, items]) => (
            <section key={modulo} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/70">
                  {modulo}
                </h3>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {items.length}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {items.map((reporte) => {
                  const faltantes = bloqueados[reporte.codigo]
                  const bloqueado = Boolean(faltantes)

                  return (
                    <article
                      key={reporte.codigo}
                      className={`flex flex-col rounded-2xl border border-border/70 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-card/60 ${
                        items.length === 1 ? "flex-1" : ""
                      }`}
                    >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <ChartBar aria-hidden="true" className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="break-words text-sm font-semibold text-foreground">
                          {reporte.nombre}
                        </h4>
                        <p className="mt-1 line-clamp-3 break-words text-xs leading-5 text-muted-foreground">
                          {reporte.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      {reporte.formatos.map((formato) => (
                        <Badge
                          key={formato}
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {FORMATO_LABELS[formato]}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="text-[10px]">
                        Máx. {formatNumero(reporte.maxFilas)} filas
                      </Badge>
                      {bloqueado && (
                        <Badge className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400">
                          <Lock aria-hidden="true" className="size-3" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Requiere
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {reporte.permisos.map((permiso) => (
                          <Badge
                            key={permiso}
                            variant="secondary"
                            className="font-mono text-[10px]"
                          >
                            {permiso}
                          </Badge>
                        ))}
                      </div>
                      {bloqueado && faltantes ? (
                        <p className="mt-2 break-words text-[11px] text-amber-700 dark:text-amber-300">
                          Falta: {faltantes.join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {reporte.codigo}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        disabled={bloqueado}
                        onClick={() => onOpenReport(reporte)}
                        className="h-9 rounded-xl px-3 text-xs font-semibold"
                      >
                        <FileDown aria-hidden="true" className="size-3.5" />
                        Generar reporte
                      </Button>
                    </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
