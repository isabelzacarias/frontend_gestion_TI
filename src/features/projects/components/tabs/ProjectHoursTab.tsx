import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarClock,
  Clock,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
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
import {
  ProyectoApiError,
  mensajeProyectoError,
} from "@/features/projects/services/project-api"
import {
  actualizarHoras,
  crearHoras,
  eliminarHoras,
  listarTodasLasHoras,
} from "@/features/projects/services/proyecto-horas.service"
import { listarTodasLasTareas } from "@/features/projects/services/proyecto-tarea.service"
import type {
  DatosCreacionHoras,
  DatosEdicionHoras,
  HoursFormDraft,
  ProyectoDetalle,
  RegistroHoras,
  Tarea,
} from "@/features/projects/types/project"
import {
  formatFecha,
  formatHoras,
  toDateInput,
} from "@/features/projects/utils/project-display"
import { useAuthStore } from "@/store/authStore"

interface ProjectHoursTabProps {
  proyecto: ProyectoDetalle
  puedeEditar: boolean
  onRefresh: () => void
}

interface Participante {
  id: string
  nombre: string
}

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const dateFieldClass =
  "h-9 w-full rounded-xl border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"

function aplanarTareas(tareas: Tarea[]): Tarea[] {
  return tareas.flatMap((tarea) => [tarea, ...tarea.subtareas])
}

const createEmptyDraft = (usuarioId: string): HoursFormDraft => ({
  tareaId: "",
  usuarioId,
  fecha: new Date().toISOString().slice(0, 10),
  horas: "",
  descripcion: "",
})

const toDraft = (registro: RegistroHoras): HoursFormDraft => ({
  tareaId: registro.tareaId === null ? "" : String(registro.tareaId),
  usuarioId: registro.usuarioId,
  fecha: toDateInput(registro.fecha),
  horas: String(registro.horas),
  descripcion: registro.descripcion ?? "",
})

export function ProjectHoursTab({
  proyecto,
  puedeEditar,
  onRefresh,
}: ProjectHoursTabProps) {
  const usuarioActual = useAuthStore((state) => state.usuario)

  const [registros, setRegistros] = useState<RegistroHoras[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [sinPermiso, setSinPermiso] = useState(false)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<HoursFormDraft>(createEmptyDraft(""))
  const [selected, setSelected] = useState<RegistroHoras | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RegistroHoras | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  const participantes = useMemo<Participante[]>(() => {
    const map = new Map<string, string>()
    map.set(proyecto.responsable.id, proyecto.responsable.nombre)
    proyecto.miembros.forEach((miembro) => {
      map.set(miembro.usuario.id, miembro.usuario.nombre)
    })
    registros.forEach((registro) => {
      map.set(registro.usuarioId, registro.usuario.nombre)
    })
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [proyecto, registros])

  const usuarioPorDefecto = useMemo(() => {
    if (usuarioActual && participantes.some((item) => item.id === usuarioActual.id)) {
      return usuarioActual.id
    }
    return participantes[0]?.id ?? ""
  }, [usuarioActual, participantes])

  useEffect(() => {
    let cancelado = false

    async function cargarDatos() {
      setLoading(true)
      setError(null)
      try {
        const [horas, tareasProyecto] = await Promise.all([
          listarTodasLasHoras(proyecto.id),
          listarTodasLasTareas(proyecto.id),
        ])
        if (!cancelado) {
          setRegistros(horas)
          setTareas(tareasProyecto)
        }
      } catch (err) {
        if (cancelado) return
        setRegistros([])
        setError(mensajeProyectoError(err))
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarDatos()

    return () => {
      cancelado = true
    }
  }, [proyecto.id, reloadKey])

  const recargar = () => {
    setReloadKey((key) => key + 1)
    onRefresh()
  }

  const tareasPlanas = useMemo(() => aplanarTareas(tareas), [tareas])

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "tarea",
        label: "Tarea",
        icon: ListTodo,
        options: [
          ...tareasPlanas.map((tarea) => ({
            value: String(tarea.id),
            label: `#${tarea.id} · ${tarea.titulo}`,
          })),
          { value: "SIN_TAREA", label: "Sin tarea" },
        ],
      },
      {
        id: "usuario",
        label: "Usuario",
        icon: User,
        options: participantes.map((item) => ({
          value: item.id,
          label: item.nombre,
        })),
      },
    ],
    [tareasPlanas, participantes],
  )

  const filteredRegistros = useMemo(() => {
    const term = debouncedSearch.toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selectedValues = facetSelecciones[dimensionId] ?? []
      return (
        selectedValues.length === 0 || selectedValues.includes(value)
      )
    }

    return registros.filter((registro) => {
      const fechaDia = registro.fecha.slice(0, 10)
      const matchSearch =
        term.length === 0 ||
        (registro.descripcion ?? "").toLowerCase().includes(term) ||
        (registro.tarea?.titulo ?? "").toLowerCase().includes(term) ||
        registro.usuario.nombre.toLowerCase().includes(term)
      const matchDesde = desde === "" || fechaDia >= desde
      const matchHasta = hasta === "" || fechaDia <= hasta

      return (
        matchSearch &&
        matchDesde &&
        matchHasta &&
        matchDimension(
          "tarea",
          registro.tareaId === null ? "SIN_TAREA" : String(registro.tareaId),
        ) &&
        matchDimension("usuario", registro.usuarioId)
      )
    })
  }, [registros, debouncedSearch, facetSelecciones, desde, hasta])

  const hayFiltros =
    search.trim() !== "" ||
    desde !== "" ||
    hasta !== "" ||
    Object.values(facetSelecciones).some((values) => values.length > 0)

  const totalHoras = useMemo(
    () =>
      filteredRegistros.reduce((total, registro) => total + registro.horas, 0),
    [filteredRegistros],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    setFacetSelecciones((prev) => ({ ...prev, [dimensionId]: values }))
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setDesde("")
    setHasta("")
    setFacetSelecciones({})
    setCurrentPage(1)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRegistros.length / ITEMS_PER_PAGE),
  )
  const activePage = Math.min(currentPage, totalPages)
  const paginatedRegistros = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredRegistros.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredRegistros, activePage])

  const handleDraftChange = <K extends keyof HoursFormDraft>(
    field: K,
    value: HoursFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const abrirCrear = () => {
    setSelected(null)
    setDraft(createEmptyDraft(usuarioPorDefecto))
    setIsFormOpen(true)
  }

  const abrirEditar = (registro: RegistroHoras) => {
    setSelected(registro)
    setDraft(toDraft(registro))
    setIsFormOpen(true)
  }

  const validar = (): boolean => {
    if (!draft.usuarioId) {
      toast.error("Selecciona el usuario que registra las horas.")
      return false
    }
    if (!datePattern.test(draft.fecha)) {
      toast.error("La fecha debe tener formato AAAA-MM-DD.")
      return false
    }
    const horas = Number(draft.horas)
    if (!Number.isFinite(horas) || horas <= 0 || horas > 24) {
      toast.error("Las horas deben ser mayores a 0 y menores o iguales a 24.")
      return false
    }
    return true
  }

  const buildDatos = (): DatosCreacionHoras => {
    const descripcion = draft.descripcion.trim()
    return {
      tareaId: draft.tareaId === "" ? null : Number(draft.tareaId),
      usuarioId: draft.usuarioId,
      fecha: draft.fecha,
      horas: Number(draft.horas),
      descripcion: descripcion === "" ? null : descripcion,
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validar()) return

    setIsSaving(true)
    try {
      if (selected) {
        const datos: DatosEdicionHoras = buildDatos()
        await actualizarHoras(proyecto.id, selected.id, datos)
        toast.success("Registro de horas actualizado.")
      } else {
        await crearHoras(proyecto.id, buildDatos())
        toast.success("Horas registradas correctamente.")
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
      await eliminarHoras(proyecto.id, deleteTarget.id)
      setDeleteTarget(null)
      toast.success("Registro de horas eliminado.")
      recargar()
    } catch (err) {
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  const puedeGestionar = puedeEditar && !sinPermiso

  const sections: FormSection<HoursFormDraft>[] = useMemo(
    () => [
      {
        title: "Registro de horas",
        color: "primary",
        gridCols: "sm:grid-cols-2",
        fields: [
          {
            key: "tareaId",
            label: "Tarea",
            type: "select",
            options: [
              { value: "", label: "Sin tarea" },
              ...tareasPlanas.map((tarea) => ({
                value: String(tarea.id),
                label: `#${tarea.id} · ${tarea.titulo}`,
              })),
            ],
          },
          {
            key: "usuarioId",
            label: "Usuario",
            type: "select",
            required: true,
            options: participantes.map((item) => ({
              value: item.id,
              label: item.nombre,
            })),
          },
          {
            key: "fecha",
            label: "Fecha",
            type: "date",
            required: true,
          },
          {
            key: "horas",
            label: "Horas",
            type: "number",
            required: true,
            step: "0.01",
            placeholder: "0.0",
          },
          {
            key: "descripcion",
            label: "Descripción",
            type: "textarea",
            rows: 3,
            colSpan: "sm:col-span-2",
            placeholder: "Actividad realizada...",
          },
        ],
      },
    ],
    [tareasPlanas, participantes],
  )

  const columns: DataTableColumn<RegistroHoras>[] = [
    {
      key: "fecha",
      header: "Fecha",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (registro) => formatFecha(registro.fecha),
    },
    {
      key: "tarea",
      header: "Tarea",
      cellClassName: `${cellBase} min-w-[200px] text-xs`,
      render: (registro) =>
        registro.tarea
          ? `#${registro.tarea.id} · ${registro.tarea.titulo}`
          : "Sin tarea",
    },
    {
      key: "usuario",
      header: "Usuario",
      cellClassName: `${cellBase} min-w-[160px] text-xs`,
      render: (registro) => registro.usuario.nombre,
    },
    {
      key: "horas",
      header: "Horas",
      cellClassName: `${cellBase} whitespace-nowrap`,
      render: (registro) => (
        <Badge className="border-primary/30 bg-primary/10 text-primary">
          {formatHoras(registro.horas)}
        </Badge>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      cellClassName: `${cellBase} max-w-[260px] text-xs text-muted-foreground`,
      render: (registro) => (
        <span className="block truncate">{registro.descripcion ?? "—"}</span>
      ),
    },
    {
      key: "acciones",
      header: "",
      cellClassName: "border-b border-border/70 px-4 py-3 text-right",
      render: (registro) =>
        puedeGestionar ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
              onClick={() => abrirEditar(registro)}
            >
              <Pencil aria-hidden="true" className="size-3.5" />
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              title="Eliminar registro"
              aria-label="Eliminar registro de horas"
              disabled={isSaving}
              onClick={() => setDeleteTarget(registro)}
              className="h-8 rounded-xl px-2.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por tarea, usuario o descripción..."
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
            setDesde("")
            setHasta("")
            setCurrentPage(1)
          }}
          customFilters={[
            {
              id: "fecha",
              label: "Fecha",
              icon: CalendarClock,
              active: desde !== "" || hasta !== "",
              onClear: () => {
                setDesde("")
                setHasta("")
                setCurrentPage(1)
              },
              content: (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="horas-desde"
                      className="text-[11px] font-medium text-foreground"
                    >
                      Desde
                    </label>
                    <input
                      id="horas-desde"
                      type="date"
                      value={desde}
                      onChange={(event) => {
                        setDesde(event.target.value)
                        setCurrentPage(1)
                      }}
                      className={dateFieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="horas-hasta"
                      className="text-[11px] font-medium text-foreground"
                    >
                      Hasta
                    </label>
                    <input
                      id="horas-hasta"
                      type="date"
                      value={hasta}
                      onChange={(event) => {
                        setHasta(event.target.value)
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

        {puedeGestionar && (
          <Button
            type="button"
            size="sm"
            onClick={abrirCrear}
            className="ml-auto h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Registrar horas
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/50 px-2.5 py-1.5 font-semibold text-foreground">
          <Clock aria-hidden="true" className="size-3.5 text-primary" />
          {formatHoras(totalHoras)} en {filteredRegistros.length} registro(s)
        </span>
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
        <DataTable<RegistroHoras>
          columns={columns}
          data={paginatedRegistros}
          rowKey={(registro) => registro.id}
          page={activePage}
          totalPages={totalPages}
          totalFiltered={filteredRegistros.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          emptyMessage={
            loading
              ? "Cargando registros de horas..."
              : "No hay registros de horas con los filtros seleccionados."
          }
        />
      )}

      <FormDialog<HoursFormDraft>
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selected ? "Editar Registro de Horas" : "Registrar Horas"}
        description={
          selected
            ? "Actualiza el registro de horas seleccionado."
            : "Registra las horas dedicadas a una tarea o al proyecto."
        }
        draft={draft}
        sections={sections}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleSubmit(event)}
        submitDisabled={isSaving}
        submitLabel={selected ? "Guardar Cambios" : "Registrar Horas"}
        size="wide"
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar registro de horas"
        itemName={
          deleteTarget
            ? `${formatHoras(deleteTarget.horas)} del ${formatFecha(deleteTarget.fecha)}`
            : "este registro"
        }
        description="El registro se dará de baja. Esta acción no se puede deshacer."
        confirmLabel="Eliminar Registro"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
