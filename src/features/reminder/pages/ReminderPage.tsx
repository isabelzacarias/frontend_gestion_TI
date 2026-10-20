import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import { ReminderFormDialog } from "@/features/reminder/components/ReminderFormDialog"
import {
  RecordatorioApiError,
  actualizarRecordatorio,
  completarRecordatorio,
  crearRecordatorio,
  eliminarRecordatorio,
  listarTodosLosRecordatorios,
} from "@/features/reminder/services/recordatorio.service"
import type {
  DatosCreacionRecordatorio,
  PrioridadRecordatorio,
  Recordatorio,
  RecordatorioFormDraft,
} from "@/features/reminder/types/reminder"
import {
  ESTADO_RECORDATORIO_BADGE_CLASS,
  ESTADO_RECORDATORIO_LABELS,
  PRIORIDADES_RECORDATORIO,
  PRIORIDAD_BADGE_CLASS,
  PRIORIDAD_LABELS,
  esFechaVencida,
  estadoRecordatorio,
  formatFechaRecordatorio,
} from "@/features/reminder/utils/reminder-display"

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const dateFieldClass =
  "h-9 w-full rounded-xl border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const ESTADO_OPTIONS = [
  { value: "false", label: "Pendientes" },
  { value: "true", label: "Completados" },
]

const PRIORIDAD_OPTIONS = PRIORIDADES_RECORDATORIO.map((prioridad) => ({
  value: prioridad,
  label: PRIORIDAD_LABELS[prioridad],
}))

function mensajeDeError(error: unknown): string {
  if (error instanceof RecordatorioApiError) {
    if (error.status === 403) {
      return "No tienes permiso para realizar esta acción sobre los recordatorios."
    }
    return error.message
  }
  return "No se pudo completar la operación."
}

const createEmptyDraft = (): RecordatorioFormDraft => ({
  titulo: "",
  descripcion: "",
  fecha: "",
  prioridad: "MEDIA",
})

const toFormDraft = (recordatorio: Recordatorio): RecordatorioFormDraft => ({
  titulo: recordatorio.titulo,
  descripcion: recordatorio.descripcion ?? "",
  fecha: recordatorio.fecha ? recordatorio.fecha.slice(0, 10) : "",
  prioridad: recordatorio.prioridad,
})

function ReminderPage() {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [sinPermiso, setSinPermiso] = useState(false)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [sinFecha, setSinFecha] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [draft, setDraft] = useState<RecordatorioFormDraft>(createEmptyDraft())

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelado = false

    async function cargarRecordatorios() {
      setIsLoading(true)

      try {
        const lista = await listarTodosLosRecordatorios()
        if (cancelado) return
        setRecordatorios(lista)
        setSinPermiso(false)
      } catch (error) {
        if (cancelado) return
        setRecordatorios([])
        if (error instanceof RecordatorioApiError && error.status === 403) {
          setSinPermiso(true)
        } else {
          toast.error(mensajeDeError(error))
        }
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarRecordatorios()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  const recargar = () => setReloadKey((key) => key + 1)

  const selectedRecordatorio = useMemo(
    () =>
      recordatorios.find((recordatorio) => recordatorio.id === selectedId) ??
      null,
    [recordatorios, selectedId],
  )

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "completado",
        label: "Estado",
        icon: CheckCircle2,
        options: ESTADO_OPTIONS,
      },
      {
        id: "prioridad",
        label: "Prioridad",
        icon: ListTodo,
        options: PRIORIDAD_OPTIONS,
      },
    ],
    [],
  )

  const filteredRecordatorios = useMemo(() => {
    const term = debouncedSearch.toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selected = facetSelecciones[dimensionId] ?? []
      return selected.length === 0 || selected.includes(value)
    }

    return recordatorios.filter((recordatorio) => {
      const matchSearch =
        term.length === 0 ||
        recordatorio.titulo.toLowerCase().includes(term) ||
        (recordatorio.descripcion ?? "").toLowerCase().includes(term)

      const fechaDia = recordatorio.fecha
        ? recordatorio.fecha.slice(0, 10)
        : null
      const matchSinFecha = !sinFecha || recordatorio.fecha === null
      const matchDesde =
        sinFecha ||
        desde === "" ||
        (fechaDia !== null && fechaDia >= desde)
      const matchHasta =
        sinFecha ||
        hasta === "" ||
        (fechaDia !== null && fechaDia <= hasta)

      return (
        matchSearch &&
        matchSinFecha &&
        matchDesde &&
        matchHasta &&
        matchDimension("completado", String(recordatorio.completado)) &&
        matchDimension("prioridad", recordatorio.prioridad)
      )
    })
  }, [recordatorios, debouncedSearch, facetSelecciones, desde, hasta, sinFecha])

  const hayFiltros =
    search.trim() !== "" ||
    desde !== "" ||
    hasta !== "" ||
    sinFecha ||
    Object.values(facetSelecciones).some((values) => values.length > 0)

  function handleFacetChange(dimensionId: string, values: string[]) {
    setFacetSelecciones((prev) => ({ ...prev, [dimensionId]: values }))
    setCurrentPage(1)
  }

  function handleSinFechaChange(checked: boolean) {
    setSinFecha(checked)
    if (checked) {
      setDesde("")
      setHasta("")
    }
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setDesde("")
    setHasta("")
    setSinFecha(false)
    setFacetSelecciones({})
    setCurrentPage(1)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecordatorios.length / ITEMS_PER_PAGE),
  )
  const activePage = Math.min(currentPage, totalPages)
  const paginatedRecordatorios = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredRecordatorios.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredRecordatorios, activePage])

  const handleDraftChange = <K extends keyof RecordatorioFormDraft>(
    field: K,
    value: RecordatorioFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenAddDialog = () => {
    setDraft(createEmptyDraft())
    setSelectedId(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (recordatorio: Recordatorio) => {
    setSelectedId(recordatorio.id)
    setDraft(toFormDraft(recordatorio))
    setIsEditDialogOpen(true)
  }

  const validarDraft = (): boolean => {
    const titulo = draft.titulo.trim()
    if (titulo === "") {
      toast.error("El título es obligatorio.")
      return false
    }
    if (titulo.length > 200) {
      toast.error("El título no puede exceder 200 caracteres.")
      return false
    }
    if (draft.descripcion.length > 10000) {
      toast.error("La descripción no puede exceder 10000 caracteres.")
      return false
    }
    if (draft.fecha !== "" && !datePattern.test(draft.fecha)) {
      toast.error("La fecha debe tener formato AAAA-MM-DD.")
      return false
    }
    if (!PRIORIDADES_RECORDATORIO.includes(draft.prioridad as PrioridadRecordatorio)) {
      toast.error("Selecciona una prioridad válida.")
      return false
    }
    return true
  }

  const buildDatos = (): DatosCreacionRecordatorio => {
    const descripcion = draft.descripcion.trim()

    return {
      titulo: draft.titulo.trim(),
      descripcion: descripcion === "" ? null : descripcion,
      fecha: draft.fecha === "" ? null : draft.fecha,
      prioridad: draft.prioridad as PrioridadRecordatorio,
    }
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validarDraft()) return

    setIsSaving(true)
    try {
      await crearRecordatorio(buildDatos())
      setIsAddDialogOpen(false)
      toast.success("Recordatorio creado correctamente.")
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedId === null || !validarDraft()) return

    setIsSaving(true)
    try {
      await actualizarRecordatorio(selectedId, buildDatos())
      setIsEditDialogOpen(false)
      toast.success("Recordatorio actualizado correctamente.")
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleCompletado = async (recordatorio: Recordatorio) => {
    setIsSaving(true)
    try {
      await completarRecordatorio(recordatorio.id, !recordatorio.completado)
      toast.success(
        recordatorio.completado
          ? "Recordatorio reabierto."
          : "Recordatorio completado.",
      )
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (selectedId === null) return

    setIsSaving(true)
    try {
      await eliminarRecordatorio(selectedId)
      setIsConfirmDeleteOpen(false)
      setIsEditDialogOpen(false)
      setSelectedId(null)
      toast.success("Recordatorio eliminado.")
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const columns: DataTableColumn<Recordatorio>[] = [
    {
      key: "titulo",
      header: "Recordatorio",
      cellClassName: `${cellBase} min-w-[280px]`,
      render: (recordatorio) => {
        const completado = recordatorio.completado
        return (
          <div className="flex items-start gap-3">
            <button
              type="button"
              title={completado ? "Reabrir recordatorio" : "Completar recordatorio"}
              aria-label={
                completado
                  ? `Reabrir ${recordatorio.titulo}`
                  : `Completar ${recordatorio.titulo}`
              }
              disabled={isSaving}
              onClick={(event) => {
                event.stopPropagation()
                void handleToggleCompletado(recordatorio)
              }}
              className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {completado ? (
                <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-500" />
              ) : (
                <Circle aria-hidden="true" className="size-4" />
              )}
            </button>
            <div className="min-w-0">
              <p
                className={`truncate text-xs font-semibold ${
                  completado
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {recordatorio.titulo}
              </p>
              {recordatorio.descripcion ? (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                  {recordatorio.descripcion}
                </p>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (recordatorio) => (
        <Badge className={PRIORIDAD_BADGE_CLASS[recordatorio.prioridad]}>
          {PRIORIDAD_LABELS[recordatorio.prioridad]}
        </Badge>
      ),
    },
    {
      key: "fecha",
      header: "Fecha",
      cellClassName: `${cellBase} whitespace-nowrap text-xs`,
      render: (recordatorio) => (
        <span
          className={
            !recordatorio.completado && esFechaVencida(recordatorio.fecha)
              ? "font-semibold text-rose-600 dark:text-rose-400"
              : "text-muted-foreground"
          }
        >
          {formatFechaRecordatorio(recordatorio.fecha)}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (recordatorio) => {
        const estado = estadoRecordatorio(recordatorio)
        return (
          <Badge className={ESTADO_RECORDATORIO_BADGE_CLASS[estado]}>
            {ESTADO_RECORDATORIO_LABELS[estado]}
          </Badge>
        )
      },
    },
    {
      key: "acciones",
      header: "",
      cellClassName: "border-b border-border/70 px-4 py-3 text-right",
      render: (recordatorio) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            title={recordatorio.completado ? "Reabrir" : "Completar"}
            aria-label={
              recordatorio.completado
                ? `Reabrir ${recordatorio.titulo}`
                : `Completar ${recordatorio.titulo}`
            }
            disabled={isSaving}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            onClick={(event) => {
              event.stopPropagation()
              void handleToggleCompletado(recordatorio)
            }}
          >
            {recordatorio.completado ? (
              <RotateCcw aria-hidden="true" className="size-3.5" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            onClick={(event) => {
              event.stopPropagation()
              handleOpenEditDialog(recordatorio)
            }}
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Eliminar"
            aria-label={`Eliminar ${recordatorio.titulo}`}
            disabled={isSaving}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            onClick={(event) => {
              event.stopPropagation()
              setSelectedId(recordatorio.id)
              setIsConfirmDeleteOpen(true)
            }}
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Organización Personal"
        title="Recordatorios"
        actions={
          sinPermiso ? undefined : (
            <Button
              type="button"
              onClick={handleOpenAddDialog}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
            >
              <Plus className="size-4" />
              Nuevo Recordatorio
            </Button>
          )
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm"
              />
            </div>

            <FacetedFilter
              dimensions={facetDimensions}
              selections={facetSelecciones}
              onChange={handleFacetChange}
              onClearAll={() => {
                setFacetSelecciones({})
                setDesde("")
                setHasta("")
                setSinFecha(false)
                setCurrentPage(1)
              }}
              customFilters={[
                {
                  id: "fecha",
                  label: "Fecha",
                  icon: CalendarDays,
                  active: sinFecha || desde !== "" || hasta !== "",
                  onClear: () => {
                    setSinFecha(false)
                    setDesde("")
                    setHasta("")
                    setCurrentPage(1)
                  },
                  content: (
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                        <Checkbox
                          checked={sinFecha}
                          onCheckedChange={(checked) =>
                            handleSinFechaChange(checked === true)
                          }
                        />
                        Solo sin fecha
                      </label>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="recordatorio-desde"
                          className="text-[11px] font-medium text-foreground"
                        >
                          Desde
                        </label>
                        <input
                          id="recordatorio-desde"
                          type="date"
                          value={desde}
                          disabled={sinFecha}
                          onChange={(event) => {
                            setDesde(event.target.value)
                            if (event.target.value !== "") setSinFecha(false)
                            setCurrentPage(1)
                          }}
                          className={dateFieldClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="recordatorio-hasta"
                          className="text-[11px] font-medium text-foreground"
                        >
                          Hasta
                        </label>
                        <input
                          id="recordatorio-hasta"
                          type="date"
                          value={hasta}
                          disabled={sinFecha}
                          onChange={(event) => {
                            setHasta(event.target.value)
                            if (event.target.value !== "") setSinFecha(false)
                            setCurrentPage(1)
                          }}
                          className={dateFieldClass}
                        />
                      </div>
                    </div>
                  ),
                },
              ]}
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
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ListTodo className="size-3.5 text-violet-700 dark:text-violet-200" />
            {isLoading
              ? "Cargando..."
              : hayFiltros
                ? `${filteredRecordatorios.length} de ${recordatorios.length} recordatorios`
                : `${filteredRecordatorios.length} recordatorios`}
          </span>
        }
      />

      {sinPermiso ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 p-8 text-center">
          <ListTodo className="size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No tienes permiso para consultar tus recordatorios
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Solicita el permiso recordatorios:leer a un administrador.
          </p>
        </div>
      ) : (
        <DataTable<Recordatorio>
          columns={columns}
          data={paginatedRecordatorios}
          rowKey={(recordatorio) => recordatorio.id}
          page={activePage}
          totalPages={totalPages}
          totalFiltered={filteredRecordatorios.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          onRowClick={(recordatorio) => setSelectedId(recordatorio.id)}
          onRowDoubleClick={handleOpenEditDialog}
          selectedRowKey={selectedId}
          emptyMessage={
            isLoading
              ? "Cargando recordatorios..."
              : "No se encontraron recordatorios con los criterios de búsqueda seleccionados."
          }
        />
      )}

      <ReminderFormDialog
        open={isAddDialogOpen}
        draft={draft}
        mode="create"
        isSaving={isSaving}
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleCreate(event)}
      />

      <ReminderFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        isSaving={isSaving}
        onOpenChange={setIsEditDialogOpen}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleUpdate(event)}
        onDelete={() => setIsConfirmDeleteOpen(true)}
      />

      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        title="Eliminar recordatorio"
        itemName={selectedRecordatorio?.titulo ?? "este recordatorio"}
        description="El recordatorio se eliminará de tu lista. Esta acción no se puede deshacer."
        confirmLabel="Eliminar Recordatorio"
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  )
}

export default ReminderPage
