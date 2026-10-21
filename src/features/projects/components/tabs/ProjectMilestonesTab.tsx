import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarCheck,
  Flag,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import {
  ProyectoApiError,
  mensajeProyectoError,
} from "@/features/projects/services/project-api"
import {
  actualizarHito,
  crearHito,
  eliminarHito,
  listarHitos,
} from "@/features/projects/services/proyecto-hito.service"
import type {
  DatosCreacionHito,
  DatosEdicionHito,
  EstadoHito,
  Hito,
  MilestoneFormDraft,
  ProyectoDetalle,
} from "@/features/projects/types/project"
import {
  ESTADOS_HITO,
  ESTADO_HITO_BADGE_CLASS,
  ESTADO_HITO_LABELS,
  formatFecha,
  toDateInput,
} from "@/features/projects/utils/project-display"

interface ProjectMilestonesTabProps {
  proyecto: ProyectoDetalle
  puedeEditar: boolean
  onRefresh: () => void
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/

const createEmptyDraft = (): MilestoneFormDraft => ({
  titulo: "",
  descripcion: "",
  estado: "PENDIENTE",
  fechaPlanificada: new Date().toISOString().slice(0, 10),
  fechaCompletada: "",
  orden: "0",
})

const toDraft = (hito: Hito): MilestoneFormDraft => ({
  titulo: hito.titulo,
  descripcion: hito.descripcion ?? "",
  estado: hito.estado,
  fechaPlanificada: toDateInput(hito.fechaPlanificada),
  fechaCompletada: toDateInput(hito.fechaCompletada),
  orden: String(hito.orden),
})

export function ProjectMilestonesTab({
  proyecto,
  puedeEditar,
  onRefresh,
}: ProjectMilestonesTabProps) {
  const [hitos, setHitos] = useState<Hito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [sinPermiso, setSinPermiso] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<MilestoneFormDraft>(createEmptyDraft())
  const [selected, setSelected] = useState<Hito | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Hito | null>(null)

  useEffect(() => {
    let cancelado = false

    async function cargarHitos() {
      setLoading(true)
      setError(null)
      try {
        const lista = await listarHitos(proyecto.id)
        if (!cancelado) setHitos(lista)
      } catch (err) {
        if (cancelado) return
        setHitos([])
        setError(mensajeProyectoError(err))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarHitos()

    return () => {
      cancelado = true
    }
  }, [proyecto.id, reloadKey])

  const recargar = () => {
    setReloadKey((key) => key + 1)
    onRefresh()
  }

  const handleDraftChange = <K extends keyof MilestoneFormDraft>(
    field: K,
    value: MilestoneFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const abrirCrear = () => {
    setSelected(null)
    setDraft(createEmptyDraft())
    setIsFormOpen(true)
  }

  const abrirEditar = (hito: Hito) => {
    setSelected(hito)
    setDraft(toDraft(hito))
    setIsFormOpen(true)
  }

  const validar = (): boolean => {
    if (!draft.titulo.trim()) {
      toast.error("El título del hito es obligatorio.")
      return false
    }
    if (!datePattern.test(draft.fechaPlanificada)) {
      toast.error("La fecha planificada debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaCompletada && !datePattern.test(draft.fechaCompletada)) {
      toast.error("La fecha completada debe tener formato AAAA-MM-DD.")
      return false
    }
    return true
  }

  const buildDatos = (): DatosCreacionHito => {
    const descripcion = draft.descripcion.trim()
    return {
      titulo: draft.titulo.trim(),
      descripcion: descripcion === "" ? null : descripcion,
      estado: draft.estado as EstadoHito,
      fechaPlanificada: draft.fechaPlanificada,
      fechaCompletada:
        draft.estado === "COMPLETADO" && draft.fechaCompletada !== ""
          ? draft.fechaCompletada
          : null,
      orden: Number(draft.orden) || 0,
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validar()) return

    setIsSaving(true)
    try {
      if (selected) {
        const datos: DatosEdicionHito = buildDatos()
        await actualizarHito(proyecto.id, selected.id, datos)
        toast.success("Hito actualizado correctamente.")
      } else {
        await crearHito(proyecto.id, buildDatos())
        toast.success("Hito creado correctamente.")
      }
      setIsFormOpen(false)
      recargar()
    } catch (err) {
      if (err instanceof ProyectoApiError && err.status === 403) {
        setSinPermiso(true)
      }
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsSaving(true)
    try {
      await eliminarHito(proyecto.id, deleteTarget.id)
      setDeleteTarget(null)
      toast.success("Hito eliminado.")
      recargar()
    } catch (err) {
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  const puedeGestionar = puedeEditar && !sinPermiso
  const completados = hitos.filter(
    (hito) => hito.estado === "COMPLETADO",
  ).length
  const pendientes = hitos.filter(
    (hito) => hito.estado === "PENDIENTE",
  ).length

  const sections: FormSection<MilestoneFormDraft>[] = useMemo(
    () => [
      {
        title: "Hito",
        color: "primary",
        gridCols: "sm:grid-cols-2",
        fields: [
          {
            key: "titulo",
            label: "Título",
            type: "text",
            required: true,
            colSpan: "sm:col-span-2",
            placeholder: "Ej. Entrega fase 1",
          },
          {
            key: "descripcion",
            label: "Descripción",
            type: "textarea",
            rows: 3,
            colSpan: "sm:col-span-2",
            placeholder: "Detalle del hito...",
          },
          {
            key: "estado",
            label: "Estado",
            type: "select",
            required: true,
            options: ESTADOS_HITO.map((estado) => ({
              value: estado,
              label: ESTADO_HITO_LABELS[estado],
            })),
          },
          {
            key: "orden",
            label: "Orden",
            type: "number",
            placeholder: "0",
          },
          {
            key: "fechaPlanificada",
            label: "Fecha planificada",
            type: "date",
            required: true,
          },
          {
            key: "fechaCompletada",
            label: "Fecha completada",
            type: "date",
            disabled: draft.estado !== "COMPLETADO",
          },
        ],
      },
    ],
    [draft.estado],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {hitos.length} hito(s) registrado(s).
        </p>
        {puedeGestionar && (
          <Button
            type="button"
            size="sm"
            onClick={abrirCrear}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo hito
          </Button>
        )}
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span>{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((key) => key + 1)}
            className="h-8 rounded-xl px-3 text-xs font-semibold"
          >
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <p className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Cargando hitos...
        </p>
      ) : hitos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Este proyecto aún no tiene hitos.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Total de hitos
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {hitos.length}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                Completados
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {completados}
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                Pendientes
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {pendientes}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {hitos.map((hito, index) => (
              <div key={hito.id} className="flex gap-3 sm:gap-4">
                <div className="flex w-9 shrink-0 flex-col items-center">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full border ${
                      hito.estado === "COMPLETADO"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : hito.estado === "CANCELADO"
                          ? "border-slate-400/30 bg-slate-400/10 text-slate-500 dark:text-slate-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <Flag aria-hidden="true" className="size-4" />
                  </span>
                  {index < hitos.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-border" />
                  )}
                </div>

                <article className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-background/50 p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={ESTADO_HITO_BADGE_CLASS[hito.estado]}
                        >
                          {ESTADO_HITO_LABELS[hito.estado]}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          Orden {hito.orden}
                        </span>
                      </div>
                      <h3 className="mt-2 break-words text-base font-semibold text-foreground sm:text-lg">
                        {hito.titulo}
                      </h3>
                      {hito.descripcion ? (
                        <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-muted-foreground">
                          {hito.descripcion}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm italic text-muted-foreground/70">
                          Sin descripción.
                        </p>
                      )}
                    </div>

                    {puedeGestionar && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Acciones de ${hito.titulo}`}
                            className="size-9 shrink-0 rounded-xl"
                          >
                            <MoreHorizontal
                              aria-hidden="true"
                              className="size-4"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          <DropdownMenuItem
                            onSelect={() => abrirEditar(hito)}
                          >
                            <Pencil aria-hidden="true" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isSaving}
                            onSelect={() => setDeleteTarget(hito)}
                          >
                            <Trash2 aria-hidden="true" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        <CalendarCheck
                          aria-hidden="true"
                          className="size-3.5"
                        />
                        Planificada
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-foreground">
                        {formatFecha(hito.fechaPlanificada)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        <CalendarCheck
                          aria-hidden="true"
                          className="size-3.5"
                        />
                        Completada
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-foreground">
                        {hito.fechaCompletada
                          ? formatFecha(hito.fechaCompletada)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      )}

      <FormDialog<MilestoneFormDraft>
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selected ? "Editar Hito" : "Nuevo Hito"}
        description={
          selected
            ? "Actualiza los datos del hito seleccionado."
            : "Registra un hito en la planificación del proyecto."
        }
        draft={draft}
        sections={sections}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleSubmit(event)}
        submitDisabled={isSaving}
        submitLabel={selected ? "Guardar Cambios" : "Crear Hito"}
        size="wide"
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar hito"
        itemName={deleteTarget?.titulo ?? "este hito"}
        description="El hito se dará de baja. Esta acción no se puede deshacer."
        confirmLabel="Eliminar Hito"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
