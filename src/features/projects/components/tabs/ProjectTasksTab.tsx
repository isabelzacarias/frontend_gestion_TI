import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CheckCircle2,
  CircleDot,
  CornerDownRight,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Workflow,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import { TaskDependenciesDialog } from "@/features/projects/components/TaskDependenciesDialog"
import {
  ProyectoApiError,
  mensajeProyectoError,
} from "@/features/projects/services/project-api"
import {
  actualizarTarea,
  crearTarea,
  eliminarTarea,
  listarTodasLasTareas,
} from "@/features/projects/services/proyecto-tarea.service"
import type {
  DatosCreacionTarea,
  DatosEdicionTarea,
  EstadoTarea,
  Prioridad,
  ProyectoDetalle,
  Tarea,
  TaskFormDraft,
} from "@/features/projects/types/project"
import {
  ESTADOS_TAREA,
  ESTADO_TAREA_BADGE_CLASS,
  ESTADO_TAREA_LABELS,
  PRIORIDADES,
  PRIORIDAD_BADGE_CLASS,
  PRIORIDAD_LABELS,
  formatFecha,
  toDateInput,
} from "@/features/projects/utils/project-display"

interface ProjectTasksTabProps {
  proyecto: ProyectoDetalle
  puedeEditar: boolean
  onRefresh: () => void
}

interface FilaTarea {
  tarea: Tarea
  esSubtarea: boolean
}

interface Participante {
  id: string
  nombre: string
}

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function aplanarFilas(tareas: Tarea[]): FilaTarea[] {
  return tareas.flatMap((tarea) => [
    { tarea, esSubtarea: false },
    ...tarea.subtareas.map((subtarea) => ({
      tarea: subtarea,
      esSubtarea: true,
    })),
  ])
}

const createEmptyTaskDraft = (): TaskFormDraft => ({
  titulo: "",
  descripcion: "",
  estado: "PENDIENTE",
  prioridad: "NORMAL",
  asignadoAId: "",
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaVencimiento: "",
  fechaCompletada: "",
  orden: "0",
})

const toTaskDraft = (tarea: Tarea): TaskFormDraft => ({
  titulo: tarea.titulo,
  descripcion: tarea.descripcion ?? "",
  estado: tarea.estado,
  prioridad: tarea.prioridad,
  asignadoAId: tarea.asignadoAId ?? "",
  fechaInicio: toDateInput(tarea.fechaInicio),
  fechaVencimiento: toDateInput(tarea.fechaVencimiento),
  fechaCompletada: toDateInput(tarea.fechaCompletada),
  orden: String(tarea.orden),
})

export function ProjectTasksTab({
  proyecto,
  puedeEditar,
  onRefresh,
}: ProjectTasksTabProps) {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [sinPermiso, setSinPermiso] = useState(false)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [currentPage, setCurrentPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<TaskFormDraft>(createEmptyTaskDraft())
  const [selectedTask, setSelectedTask] = useState<Tarea | null>(null)
  const [parentTask, setParentTask] = useState<Tarea | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tarea | null>(null)
  const [dependenciesTarget, setDependenciesTarget] = useState<Tarea | null>(
    null,
  )

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelado = false

    async function cargarTareas() {
      setLoading(true)
      setError(null)
      try {
        const lista = await listarTodasLasTareas(proyecto.id)
        if (!cancelado) setTareas(lista)
      } catch (err) {
        if (cancelado) return
        setTareas([])
        setError(mensajeProyectoError(err))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarTareas()

    return () => {
      cancelado = true
    }
  }, [proyecto.id, reloadKey])

  const recargar = () => {
    setReloadKey((key) => key + 1)
    onRefresh()
  }

  const participantes = useMemo<Participante[]>(() => {
    const map = new Map<string, string>()
    map.set(proyecto.responsable.id, proyecto.responsable.nombre)
    proyecto.miembros.forEach((miembro) => {
      map.set(miembro.usuario.id, miembro.usuario.nombre)
    })
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [proyecto])

  const filas = useMemo(() => aplanarFilas(tareas), [tareas])

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "estado",
        label: "Estado",
        icon: CheckCircle2,
        options: ESTADOS_TAREA.map((estado) => ({
          value: estado,
          label: ESTADO_TAREA_LABELS[estado],
        })),
      },
      {
        id: "prioridad",
        label: "Prioridad",
        icon: CircleDot,
        options: PRIORIDADES.map((prioridad) => ({
          value: prioridad,
          label: PRIORIDAD_LABELS[prioridad],
        })),
      },
      {
        id: "asignado",
        label: "Asignado",
        icon: User,
        options: [
          ...participantes.map((item) => ({
            value: item.id,
            label: item.nombre,
          })),
          { value: "SIN_ASIGNAR", label: "Sin asignar" },
        ],
      },
    ],
    [participantes],
  )

  const filteredFilas = useMemo(() => {
    const term = debouncedSearch.toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selected = facetSelecciones[dimensionId] ?? []
      return selected.length === 0 || selected.includes(value)
    }

    return filas.filter(({ tarea }) => {
      const matchSearch =
        term.length === 0 ||
        tarea.titulo.toLowerCase().includes(term) ||
        (tarea.descripcion ?? "").toLowerCase().includes(term)
      return (
        matchSearch &&
        matchDimension("estado", tarea.estado) &&
        matchDimension("prioridad", tarea.prioridad) &&
        matchDimension("asignado", tarea.asignadoAId ?? "SIN_ASIGNAR")
      )
    })
  }, [filas, debouncedSearch, facetSelecciones])

  const hayFiltros =
    search.trim() !== "" ||
    Object.values(facetSelecciones).some((values) => values.length > 0)

  function handleFacetChange(dimensionId: string, values: string[]) {
    setFacetSelecciones((prev) => ({ ...prev, [dimensionId]: values }))
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setFacetSelecciones({})
    setCurrentPage(1)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFilas.length / ITEMS_PER_PAGE),
  )
  const activePage = Math.min(currentPage, totalPages)
  const paginatedFilas = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredFilas.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredFilas, activePage])

  const handleDraftChange = <K extends keyof TaskFormDraft>(
    field: K,
    value: TaskFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const abrirCrear = (parent: Tarea | null) => {
    setSelectedTask(null)
    setParentTask(parent)
    setDraft(createEmptyTaskDraft())
    setIsFormOpen(true)
  }

  const abrirEditar = (tarea: Tarea) => {
    setSelectedTask(tarea)
    setParentTask(null)
    setDraft(toTaskDraft(tarea))
    setIsFormOpen(true)
  }

  const validar = (): boolean => {
    if (!draft.titulo.trim()) {
      toast.error("El título de la tarea es obligatorio.")
      return false
    }
    if (draft.fechaInicio && !datePattern.test(draft.fechaInicio)) {
      toast.error("La fecha de inicio debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaVencimiento && !datePattern.test(draft.fechaVencimiento)) {
      toast.error("La fecha de vencimiento debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaCompletada && !datePattern.test(draft.fechaCompletada)) {
      toast.error("La fecha de completado debe tener formato AAAA-MM-DD.")
      return false
    }
    return true
  }

  const buildDatos = (): DatosCreacionTarea => {
    const descripcion = draft.descripcion.trim()
    const datos: DatosCreacionTarea = {
      titulo: draft.titulo.trim(),
      descripcion: descripcion === "" ? null : descripcion,
      estado: draft.estado as EstadoTarea,
      prioridad: draft.prioridad as Prioridad,
      parentId: parentTask?.id ?? null,
      asignadoAId: draft.asignadoAId === "" ? null : draft.asignadoAId,
      fechaInicio: draft.fechaInicio === "" ? null : draft.fechaInicio,
      fechaVencimiento:
        draft.fechaVencimiento === "" ? null : draft.fechaVencimiento,
      fechaCompletada:
        draft.estado === "COMPLETADA" && draft.fechaCompletada !== ""
          ? draft.fechaCompletada
          : null,
      orden: Number(draft.orden) || 0,
    }
    return datos
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validar()) return

    setIsSaving(true)
    try {
      if (selectedTask) {
        const datosCreacion = buildDatos()
        const datos: DatosEdicionTarea = {
          titulo: datosCreacion.titulo,
          descripcion: datosCreacion.descripcion,
          estado: datosCreacion.estado,
          prioridad: datosCreacion.prioridad,
          asignadoAId: datosCreacion.asignadoAId,
          fechaInicio: datosCreacion.fechaInicio,
          fechaVencimiento: datosCreacion.fechaVencimiento,
          fechaCompletada: datosCreacion.fechaCompletada,
          orden: datosCreacion.orden,
        }
        await actualizarTarea(proyecto.id, selectedTask.id, datos)
        toast.success("Tarea actualizada correctamente.")
      } else {
        await crearTarea(proyecto.id, buildDatos())
        toast.success(
          parentTask ? "Subtarea creada correctamente." : "Tarea creada correctamente.",
        )
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
      await eliminarTarea(proyecto.id, deleteTarget.id)
      setDeleteTarget(null)
      toast.success("Tarea eliminada.")
      recargar()
    } catch (err) {
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  const puedeGestionar = puedeEditar && !sinPermiso

  const sections: FormSection<TaskFormDraft>[] = useMemo(
    () => [
      {
        title: "Tarea",
        color: "primary",
        gridCols: "sm:grid-cols-2",
        fields: [
          {
            key: "titulo",
            label: "Título",
            type: "text",
            required: true,
            colSpan: "sm:col-span-2",
            placeholder: "Ej. Preparar entorno",
          },
          {
            key: "descripcion",
            label: "Descripción",
            type: "textarea",
            rows: 3,
            colSpan: "sm:col-span-2",
            placeholder: "Detalle de la tarea...",
          },
          {
            key: "estado",
            label: "Estado",
            type: "select",
            required: true,
            options: ESTADOS_TAREA.map((estado) => ({
              value: estado,
              label: ESTADO_TAREA_LABELS[estado],
            })),
          },
          {
            key: "prioridad",
            label: "Prioridad",
            type: "select",
            required: true,
            options: PRIORIDADES.map((prioridad) => ({
              value: prioridad,
              label: PRIORIDAD_LABELS[prioridad],
            })),
          },
        ],
      },
      {
        title: "Asignación y fechas",
        color: "cyan",
        gridCols: "sm:grid-cols-2",
        fields: [
          {
            key: "asignadoAId",
            label: "Asignado a",
            type: "select",
            options: [
              { value: "", label: "Sin asignar" },
              ...participantes.map((item) => ({
                value: item.id,
                label: item.nombre,
              })),
            ],
          },
          {
            key: "orden",
            label: "Orden",
            type: "number",
            placeholder: "0",
          },
          {
            key: "fechaInicio",
            label: "Fecha de inicio",
            type: "date",
          },
          {
            key: "fechaVencimiento",
            label: "Fecha de vencimiento",
            type: "date",
          },
          {
            key: "fechaCompletada",
            label: "Fecha completada",
            type: "date",
            disabled: draft.estado !== "COMPLETADA",
          },
        ],
      },
    ],
    [participantes, draft.estado],
  )

  const columns: DataTableColumn<FilaTarea>[] = [
    {
      key: "titulo",
      header: "Tarea",
      cellClassName: `${cellBase} min-w-[280px]`,
      render: ({ tarea, esSubtarea }) => (
        <div className={`flex items-start gap-2 ${esSubtarea ? "pl-6" : ""}`}>
          {esSubtarea ? (
            <CornerDownRight
              aria-hidden="true"
              className="mt-1 size-3.5 shrink-0 text-muted-foreground"
            />
          ) : (
            <ListTodo
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {tarea.titulo}
            </p>
            {tarea.descripcion ? (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                {tarea.descripcion}
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: ({ tarea }) => (
        <Badge className={ESTADO_TAREA_BADGE_CLASS[tarea.estado]}>
          {ESTADO_TAREA_LABELS[tarea.estado]}
        </Badge>
      ),
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: ({ tarea }) => (
        <Badge className={PRIORIDAD_BADGE_CLASS[tarea.prioridad]}>
          {PRIORIDAD_LABELS[tarea.prioridad]}
        </Badge>
      ),
    },
    {
      key: "asignado",
      header: "Asignado",
      cellClassName: `${cellBase} min-w-[160px] text-xs`,
      render: ({ tarea }) => tarea.asignadoA?.nombre ?? "Sin asignar",
    },
    {
      key: "vencimiento",
      header: "Vencimiento",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: ({ tarea }) => formatFecha(tarea.fechaVencimiento),
    },
    {
      key: "acciones",
      header: "",
      cellClassName: "border-b border-border/70 px-4 py-3 text-right",
      render: ({ tarea, esSubtarea }) => (
        <div className="flex items-center justify-end gap-1.5">
          {puedeGestionar && !esSubtarea && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              title="Agregar subtarea"
              aria-label={`Agregar subtarea a ${tarea.titulo}`}
              onClick={(event) => {
                event.stopPropagation()
                abrirCrear(tarea)
              }}
              className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            >
              <Plus aria-hidden="true" className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Dependencias"
            aria-label={`Dependencias de ${tarea.titulo}`}
            onClick={(event) => {
              event.stopPropagation()
              setDependenciesTarget(tarea)
            }}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
          >
            <Workflow aria-hidden="true" className="size-3.5" />
          </Button>
          {puedeGestionar && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
                onClick={(event) => {
                  event.stopPropagation()
                  abrirEditar(tarea)
                }}
              >
                <Pencil aria-hidden="true" className="size-3.5" />
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Eliminar tarea"
                aria-label={`Eliminar ${tarea.titulo}`}
                disabled={isSaving}
                onClick={(event) => {
                  event.stopPropagation()
                  setDeleteTarget(tarea)
                }}
                className="h-8 rounded-xl px-2.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar tarea..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
            className="h-9 w-full rounded-2xl border border-border/80 bg-background/80 pl-9 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <FacetedFilter
          dimensions={facetDimensions}
          selections={facetSelecciones}
          onChange={handleFacetChange}
          onClearAll={() => {
            setFacetSelecciones({})
            setCurrentPage(1)
          }}
        />

        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="text-muted-foreground"
          >
            <X />
            Borrar filtros
          </Button>
        )}

        {puedeGestionar && (
          <Button
            type="button"
            size="sm"
            onClick={() => abrirCrear(null)}
            className="ml-auto h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nueva tarea
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
      ) : (
        <DataTable<FilaTarea>
          columns={columns}
          data={paginatedFilas}
          rowKey={({ tarea }) => tarea.id}
          page={activePage}
          totalPages={totalPages}
          totalFiltered={filteredFilas.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          emptyMessage={
            loading
              ? "Cargando tareas..."
              : "No hay tareas con los criterios seleccionados."
          }
        />
      )}

      <FormDialog<TaskFormDraft>
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={
          selectedTask
            ? "Editar Tarea"
            : parentTask
              ? "Nueva Subtarea"
              : "Nueva Tarea"
        }
        description={
          parentTask
            ? `Subtarea de #${parentTask.id} · ${parentTask.titulo}.`
            : selectedTask
              ? "Actualiza los datos de la tarea seleccionada."
              : "Registra una nueva tarea en el proyecto."
        }
        draft={draft}
        sections={sections}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleSubmit(event)}
        submitDisabled={isSaving}
        submitLabel={selectedTask ? "Guardar Cambios" : "Crear Tarea"}
        size="wide"
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar tarea"
        itemName={deleteTarget?.titulo ?? "esta tarea"}
        description={
          deleteTarget && deleteTarget.subtareas.length > 0
            ? "La tarea y sus subtareas se darán de baja. Esta acción no se puede deshacer."
            : "La tarea se dará de baja. Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar Tarea"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <TaskDependenciesDialog
        open={dependenciesTarget !== null}
        proyectoId={proyecto.id}
        tarea={dependenciesTarget}
        tareas={tareas}
        puedeEditar={puedeGestionar}
        onOpenChange={(open) => {
          if (!open) setDependenciesTarget(null)
        }}
      />
    </div>
  )
}
