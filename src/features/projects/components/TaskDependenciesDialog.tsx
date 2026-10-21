import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Loader2, Plus, Trash2, Workflow } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mensajeProyectoError } from "@/features/projects/services/project-api"
import {
  agregarDependencia,
  eliminarDependencia,
  listarDependencias,
} from "@/features/projects/services/proyecto-tarea.service"
import type {
  DependenciasTarea,
  Tarea,
  TareaDependencia,
} from "@/features/projects/types/project"
import {
  ESTADO_TAREA_BADGE_CLASS,
  ESTADO_TAREA_LABELS,
} from "@/features/projects/utils/project-display"

interface TaskDependenciesDialogProps {
  open: boolean
  proyectoId: number
  tarea: Tarea | null
  tareas: Tarea[]
  puedeEditar: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}

const selectClass =
  "h-9 w-full rounded-xl border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"

function aplanarTareas(tareas: Tarea[]): Tarea[] {
  return tareas.flatMap((tarea) => [tarea, ...tarea.subtareas])
}

function DependenciaItem({
  dependencia,
  onRemove,
}: {
  dependencia: TareaDependencia
  onRemove?: (dependencia: TareaDependencia) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">
          #{dependencia.id} · {dependencia.titulo}
          {dependencia.parentId ? (
            <span className="ml-1 text-[10px] text-muted-foreground">
              (subtarea)
            </span>
          ) : null}
        </p>
        <Badge
          className={`mt-1 ${ESTADO_TAREA_BADGE_CLASS[dependencia.estado]}`}
        >
          {ESTADO_TAREA_LABELS[dependencia.estado]}
        </Badge>
      </div>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Quitar dependencia"
          aria-label={`Quitar dependencia ${dependencia.titulo}`}
          onClick={() => onRemove(dependencia)}
          className="h-7 px-2 text-[11px] text-rose-600 dark:text-rose-400"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

export function TaskDependenciesDialog({
  open,
  proyectoId,
  tarea,
  tareas,
  puedeEditar,
  onOpenChange,
  onChanged,
}: TaskDependenciesDialogProps) {
  const [dependencias, setDependencias] = useState<DependenciasTarea | null>(
    null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || !tarea) return

    let cancelado = false

    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarDependencias(proyectoId, tarea!.id)
        if (!cancelado) setDependencias(data)
      } catch (err) {
        if (!cancelado) setError(mensajeProyectoError(err))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargar()

    return () => {
      cancelado = true
    }
  }, [open, proyectoId, tarea])

  const candidatas = useMemo(() => {
    if (!tarea || !dependencias) return []
    const excluidas = new Set([
      tarea.id,
      ...dependencias.dependeDe.map((item) => item.id),
    ])
    return aplanarTareas(tareas).filter((item) => !excluidas.has(item.id))
  }, [tarea, dependencias, tareas])

  async function handleAgregar() {
    if (!tarea || !seleccion) return

    setIsSaving(true)
    try {
      await agregarDependencia(proyectoId, tarea.id, Number(seleccion))
      const data = await listarDependencias(proyectoId, tarea.id)
      setDependencias(data)
      setSeleccion("")
      toast.success("Dependencia agregada.")
      onChanged?.()
    } catch (err) {
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleQuitar(dependencia: TareaDependencia) {
    if (!tarea) return

    setIsSaving(true)
    try {
      await eliminarDependencia(proyectoId, tarea.id, dependencia.id)
      const data = await listarDependencias(proyectoId, tarea.id)
      setDependencias(data)
      toast.success("Dependencia eliminada.")
      onChanged?.()
    } catch (err) {
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] w-[min(92vw,720px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="border-b border-border/80 px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Workflow aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold">
                Dependencias
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {tarea ? `Tarea #${tarea.id} · ${tarea.titulo}` : "Selecciona una tarea."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : (
            <>
              {puedeEditar && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <label
                      htmlFor="dependencia"
                      className="text-[11px] font-medium text-foreground"
                    >
                      Depende de
                    </label>
                    <select
                      id="dependencia"
                      value={seleccion}
                      onChange={(event) => setSeleccion(event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Selecciona una tarea...</option>
                      {candidatas.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          #{item.id} · {item.titulo}
                          {item.parentId ? " (subtarea)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!seleccion || isSaving}
                    onClick={() => void handleAgregar()}
                    className="h-9 rounded-xl px-3 text-xs font-semibold"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Agregar
                  </Button>
                </div>
              )}

              <section className="space-y-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
                  Esta tarea depende de
                </h3>
                {dependencias && dependencias.dependeDe.length > 0 ? (
                  <div className="space-y-2">
                    {dependencias.dependeDe.map((dependencia) => (
                      <DependenciaItem
                        key={dependencia.id}
                        dependencia={dependencia}
                        onRemove={
                          puedeEditar ? (item) => void handleQuitar(item) : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
                    Sin dependencias previas.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
                  <ArrowRight aria-hidden="true" className="size-3" />
                  Tareas que dependen de esta
                </h3>
                {dependencias && dependencias.dependientes.length > 0 ? (
                  <div className="space-y-2">
                    {dependencias.dependientes.map((dependencia) => (
                      <DependenciaItem
                        key={dependencia.id}
                        dependencia={dependencia}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
                    Ninguna tarea depende de esta todavía.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
