import { useState } from "react"
import {
  AlertCircle,
  ChartBar,
  Clock3,
  Download,
  Loader2,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ReporteApiError,
  crearGeneracionReporte,
  descargarReporteSincrono,
} from "@/features/reports/services/reporte.service"
import type {
  FormatoReporte,
  ReporteGeneracion,
  ReporteMetadata,
} from "@/features/reports/types/report"
import {
  FORMATO_LABELS,
  crearFiltrosIniciales,
  etiquetaCampo,
  etiquetaOpcion,
  extraerPermisosFaltantes,
  formatNumero,
} from "@/features/reports/utils/report-display"

interface ReportFilterDialogProps {
  metadata: ReporteMetadata
  retryGeneration?: ReporteGeneracion | null
  onOpenChange: (open: boolean) => void
  onAsyncCreated: (generation: ReporteGeneracion) => void
  onPermisoDenegado: (codigo: string, faltantes: string[]) => void
}

const inputClass =
  "h-9 w-full rounded-xl border border-input bg-transparent px-3 text-xs text-foreground outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"
const selectClass =
  "h-9 w-full rounded-xl border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"

export function ReportFilterDialog({
  metadata,
  retryGeneration,
  onOpenChange,
  onAsyncCreated,
  onPermisoDenegado,
}: ReportFilterDialogProps) {
  const [formato, setFormato] = useState<FormatoReporte>(() => {
    if (retryGeneration && metadata.formatos.includes(retryGeneration.formato)) {
      return retryGeneration.formato
    }
    return metadata.formatos[0] ?? "xlsx"
  })
  const [filtros, setFiltros] = useState<Record<string, string>>(() =>
    crearFiltrosIniciales(metadata, retryGeneration),
  )
  const [descargando, setDescargando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permisosFaltantes, setPermisosFaltantes] = useState<string[]>([])

  const ocupado = descargando || generando
  const bloqueado = permisosFaltantes.length > 0

  function actualizarFiltro(nombre: string, valor: string) {
    setFiltros((prev) => ({ ...prev, [nombre]: valor }))
  }

  function validar(): boolean {
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      setError('"Desde" no puede ser posterior a "Hasta".')
      return false
    }

    if (filtros.dias && filtros.dias.trim() !== "") {
      const dias = Number(filtros.dias)
      if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
        setError('"Días de aviso" debe ser un entero entre 1 y 365.')
        return false
      }
    }

    return true
  }

  function manejarError(err: unknown) {
    if (err instanceof ReporteApiError) {
      if (err.status === 403) {
        const faltantes = extraerPermisosFaltantes(err)
        const lista = faltantes.length > 0 ? faltantes : metadata.permisos
        setPermisosFaltantes(lista)
        setError(err.message)
        onPermisoDenegado(metadata.codigo, lista)
        return
      }
      setError(err.message)
      return
    }

    setError(
      err instanceof Error
        ? err.message
        : "No se pudo completar la operación.",
    )
  }

  async function handleDescargar() {
    if (ocupado || bloqueado) return
    setError(null)
    setPermisosFaltantes([])
    if (!validar()) return

    setDescargando(true)
    try {
      await descargarReporteSincrono(metadata.codigo, formato, filtros)
      toast.success("Descarga iniciada.")
      onOpenChange(false)
    } catch (err) {
      manejarError(err)
    } finally {
      setDescargando(false)
    }
  }

  async function handleGenerar() {
    if (ocupado || bloqueado) return
    setError(null)
    setPermisosFaltantes([])
    if (!validar()) return

    setGenerando(true)
    try {
      const generacion = await crearGeneracionReporte(
        metadata.codigo,
        formato,
        filtros,
      )
      toast.success("Generación de reporte programada.")
      onAsyncCreated(generacion)
    } catch (err) {
      manejarError(err)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,900px)] w-[min(96vw,900px)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border border-border/70 bg-background p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ChartBar aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {metadata.nombre}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-muted-foreground">
                {metadata.descripcion}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {metadata.modulo}
                </Badge>
                {metadata.formatos.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="font-mono text-[10px]"
                  >
                    {FORMATO_LABELS[item]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Permisos requeridos
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {metadata.permisos.map((permiso) => (
                <Badge
                  key={permiso}
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {permiso}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
            <span>
              Este reporte permite hasta {formatNumero(metadata.maxFilas)} filas.
              Si se supera el límite, aplica más filtros.
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Formato</p>
            <div className="flex flex-wrap gap-2">
              {metadata.formatos.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={formato === item ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormato(item)}
                  disabled={ocupado}
                  className="h-9 rounded-xl px-4 text-xs font-semibold"
                >
                  {FORMATO_LABELS[item]}
                </Button>
              ))}
            </div>
          </div>

          {metadata.filtros.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold text-foreground">
                Filtros
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {metadata.filtros.map((filtro) => {
                  const valor = filtros[filtro.nombre] ?? ""
                  return (
                    <div key={filtro.nombre} className="space-y-1.5">
                      <label
                        htmlFor={`filtro-${filtro.nombre}`}
                        className="text-[11px] font-medium text-foreground"
                      >
                        {etiquetaCampo(filtro.nombre)}
                      </label>

                      {filtro.tipo === "enum" ? (
                        <select
                          id={`filtro-${filtro.nombre}`}
                          value={valor}
                          onChange={(event) =>
                            actualizarFiltro(filtro.nombre, event.target.value)
                          }
                          disabled={ocupado}
                          className={selectClass}
                        >
                          <option value="">Todos</option>
                          {(filtro.opciones ?? []).map((opcion) => (
                            <option key={opcion} value={opcion}>
                              {etiquetaOpcion(opcion)}
                            </option>
                          ))}
                        </select>
                      ) : filtro.tipo === "booleano" ? (
                        <select
                          id={`filtro-${filtro.nombre}`}
                          value={valor}
                          onChange={(event) =>
                            actualizarFiltro(filtro.nombre, event.target.value)
                          }
                          disabled={ocupado}
                          className={selectClass}
                        >
                          <option value="">Predeterminado</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          id={`filtro-${filtro.nombre}`}
                          type={
                            filtro.tipo === "fecha"
                              ? "date"
                              : filtro.nombre === "dias"
                                ? "number"
                                : "text"
                          }
                          min={filtro.nombre === "dias" ? 1 : undefined}
                          max={filtro.nombre === "dias" ? 365 : undefined}
                          inputMode={
                            filtro.nombre === "dias" ? "numeric" : undefined
                          }
                          value={valor}
                          onChange={(event) =>
                            actualizarFiltro(filtro.nombre, event.target.value)
                          }
                          disabled={ocupado}
                          className={inputClass}
                        />
                      )}

                      <p className="text-[11px] leading-4 text-muted-foreground">
                        {filtro.descripcion}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0"
                />
                <div className="space-y-1">
                  <p>{error}</p>
                  {permisosFaltantes.length > 0 && (
                    <p className="font-semibold">
                      Permisos faltantes: {permisosFaltantes.join(", ")}
                    </p>
                  )}
                  {error.toLowerCase().includes("límite") && (
                    <p>Aplica más filtros para reducir el número de filas.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {bloqueado && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <p>
                Este reporte está bloqueado por permisos. Solicita los permisos
                indicados y vuelve a cargar el catálogo.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border/80 bg-transparent p-0">
          <div className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={descargando || generando}
              className="h-9 rounded-xl px-3 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleGenerar()}
                disabled={ocupado || bloqueado}
                className="h-9 rounded-xl px-3 text-xs font-semibold"
              >
                {generando ? (
                  <Loader2
                    aria-hidden="true"
                    className="size-3.5 animate-spin"
                  />
                ) : (
                  <Clock3 aria-hidden="true" className="size-3.5" />
                )}
                Generar en segundo plano
              </Button>
              <Button
                type="button"
                onClick={() => void handleDescargar()}
                disabled={ocupado || bloqueado}
                className="h-9 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-3 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)] hover:brightness-110"
              >
                {descargando ? (
                  <Loader2
                    aria-hidden="true"
                    className="size-3.5 animate-spin"
                  />
                ) : (
                  <Download aria-hidden="true" className="size-3.5" />
                )}
                Descargar ahora
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
