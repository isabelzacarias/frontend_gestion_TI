import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Eye,
  FolderKanban,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SquareKanban,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ProjectDetailDialog } from "@/features/projects/components/ProjectDetailDialog"
import {
  ProjectFormDialog,
  type ResponsableOpcion,
} from "@/features/projects/components/ProjectFormDialog"
import {
  ProyectoApiError,
  mensajeProyectoError,
} from "@/features/projects/services/project-api"
import {
  actualizarProyecto,
  crearProyecto,
  eliminarProyecto,
  listarTodosLosProyectos,
} from "@/features/projects/services/proyecto.service"
import type {
  DatosCreacionProyecto,
  DatosEdicionProyecto,
  EstadoProyecto,
  Prioridad,
  ProjectFormDraft,
  Proyecto,
} from "@/features/projects/types/project"
import {
  ESTADOS_PROYECTO,
  ESTADO_PROYECTO_BADGE_CLASS,
  ESTADO_PROYECTO_DOT_CLASS,
  ESTADO_PROYECTO_LABELS,
  PRIORIDADES,
  PRIORIDAD_BADGE_CLASS,
  PRIORIDAD_LABELS,
  estadosProyectoPermitidos,
  formatFecha,
  formatPresupuesto,
  toDateInput,
} from "@/features/projects/utils/project-display"
import {
  listarTodosLosUsuarios,
  obtenerCatalogos,
  type ResumenCatalogo,
  type UsuarioLista,
} from "@/services/usuario.service"
import { useAuthStore } from "@/store/authStore"

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const createEmptyDraft = (): ProjectFormDraft => ({
  nombre: "",
  descripcion: "",
  estado: "PLANIFICADO",
  prioridad: "NORMAL",
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFinPlanificada: new Date().toISOString().slice(0, 10),
  fechaFinReal: "",
  presupuesto: "",
  responsableId: "",
  departamentoId: "",
})

const toFormDraft = (proyecto: Proyecto): ProjectFormDraft => ({
  nombre: proyecto.nombre,
  descripcion: proyecto.descripcion ?? "",
  estado: proyecto.estado,
  prioridad: proyecto.prioridad,
  fechaInicio: toDateInput(proyecto.fechaInicio),
  fechaFinPlanificada: toDateInput(proyecto.fechaFinPlanificada),
  fechaFinReal: toDateInput(proyecto.fechaFinReal),
  presupuesto:
    proyecto.presupuesto === null ? "" : String(proyecto.presupuesto),
  responsableId: proyecto.responsable.id,
  departamentoId:
    proyecto.departamento === null ? "" : String(proyecto.departamento.id),
})

interface ProjectsBoardProps {
  proyectos: Proyecto[]
  loading: boolean
  selectedId: number | null
  puedeEditar: boolean
  onOpen: (proyecto: Proyecto) => void
  onEdit: (proyecto: Proyecto) => void
}

function ProjectBoardCard({
  proyecto,
  selected,
  puedeEditar,
  onOpen,
  onEdit,
}: {
  proyecto: Proyecto
  selected: boolean
  puedeEditar: boolean
  onOpen: (proyecto: Proyecto) => void
  onEdit: (proyecto: Proyecto) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir ${proyecto.nombre}`}
      onClick={() => onOpen(proyecto)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(proyecto)
        }
      }}
      className={`w-full cursor-pointer rounded-2xl border border-border/70 bg-background p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
        selected ? "border-primary/60 ring-2 ring-primary/15" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-muted-foreground">
          {proyecto.codigo}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={PRIORIDAD_BADGE_CLASS[proyecto.prioridad]}>
            {PRIORIDAD_LABELS[proyecto.prioridad]}
          </Badge>
          {!proyecto.activo && (
            <Badge className="border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400">
              Inactivo
            </Badge>
          )}
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
        {proyecto.nombre}
      </p>
      {proyecto.descripcion ? (
        <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
          {proyecto.descripcion}
        </p>
      ) : null}

      <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <User aria-hidden="true" className="size-3.5" />
          {proyecto.responsable.nombre}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarClock aria-hidden="true" className="size-3.5" />
          Fin: {formatFecha(proyecto.fechaFinPlanificada)}
        </p>
        <p className="flex items-center gap-1.5">
          <Wallet aria-hidden="true" className="size-3.5" />
          {formatPresupuesto(proyecto.presupuesto)}
        </p>
      </div>

      {puedeEditar && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(proyecto)
            }}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            Editar
          </Button>
        </div>
      )}
    </div>
  )
}

function ProjectsBoard({
  proyectos,
  loading,
  selectedId,
  puedeEditar,
  onOpen,
  onEdit,
}: ProjectsBoardProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Cargando proyectos...
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 gap-4 overflow-x-auto pb-2">
      {ESTADOS_PROYECTO.map((estado) => {
        const items = proyectos.filter((proyecto) => proyecto.estado === estado)
        return (
          <section
            key={estado}
            className="flex h-full w-[340px] shrink-0 flex-col rounded-2xl border border-border/70 bg-muted/20"
          >
            <header className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2.5 rounded-full ${ESTADO_PROYECTO_DOT_CLASS[estado]}`}
                />
                <h3 className="text-sm font-semibold text-foreground">
                  {ESTADO_PROYECTO_LABELS[estado]}
                </h3>
              </div>
              <Badge
                variant="secondary"
                className="h-5 min-w-5 justify-center rounded-md px-1 text-[11px]"
              >
                {items.length}
              </Badge>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-6 text-center text-xs text-muted-foreground">
                  Sin proyectos
                </p>
              ) : (
                items.map((proyecto) => (
                  <ProjectBoardCard
                    key={proyecto.id}
                    proyecto={proyecto}
                    selected={selectedId === proyecto.id}
                    puedeEditar={puedeEditar}
                    onOpen={onOpen}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ProjectsPage() {
  const usuarioActual = useAuthStore((state) => state.usuario)
  const [searchParams, setSearchParams] = useSearchParams()
  const vista = searchParams.get("vista") === "kanban" ? "kanban" : "tabla"

  function cambiarVista(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next === "kanban") {
      params.set("vista", "kanban")
    } else {
      params.delete("vista")
    }
    setSearchParams(params, { replace: true })
  }

  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [departamentos, setDepartamentos] = useState<ResumenCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sinPermisoListado, setSinPermisoListado] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [facetSelecciones, setFacetSelecciones] = useState<FacetSelections>({})
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Proyecto | null>(null)
  const [draft, setDraft] = useState<ProjectFormDraft>(createEmptyDraft())
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Proyecto | null>(null)

  const [puedeCrear, setPuedeCrear] = useState(true)
  const [puedeEditar, setPuedeEditar] = useState(true)
  const [puedeEliminar, setPuedeEliminar] = useState(true)
  const [reactivandoId, setReactivandoId] = useState<number | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setLoading(true)
      setError(null)
      setSinPermisoListado(false)

      try {
        const [lista, usuariosLista, catalogos] = await Promise.all([
          listarTodosLosProyectos(),
          listarTodosLosUsuarios({ activo: true }).catch(
            () => [] as UsuarioLista[],
          ),
          obtenerCatalogos().catch(() => null),
        ])
        if (cancelado) return
        setProyectos(lista)
        setUsuarios(usuariosLista)
        setDepartamentos(catalogos?.departamentos ?? [])
      } catch (err) {
        if (cancelado) return
        setProyectos([])
        if (err instanceof ProyectoApiError && err.status === 403) {
          setSinPermisoListado(true)
        } else {
          setError(mensajeProyectoError(err))
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargar()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  const recargar = () => setReloadKey((key) => key + 1)

  const responsables = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach((proyecto) => {
      map.set(proyecto.responsable.id, proyecto.responsable.nombre)
    })
    return Array.from(map, ([id, nombre]) => ({ value: id, label: nombre }))
  }, [proyectos])

  const departamentosDisponibles = useMemo(() => {
    const map = new Map<number, string>()
    proyectos.forEach((proyecto) => {
      if (proyecto.departamento) {
        map.set(proyecto.departamento.id, proyecto.departamento.nombre)
      }
    })
    departamentos.forEach((departamento) => {
      map.set(departamento.id, departamento.nombre)
    })
    return Array.from(map, ([id, nombre]) => ({
      value: String(id),
      label: nombre,
    }))
  }, [proyectos, departamentos])

  const responsablesDisponibles = useMemo<ResponsableOpcion[]>(() => {
    const map = new Map<string, ResponsableOpcion>()
    usuarios.forEach((usuario) => {
      map.set(usuario.id, {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      })
    })
    if (usuarioActual) {
      map.set(usuarioActual.id, {
        id: usuarioActual.id,
        nombre: usuarioActual.nombre,
        email: usuarioActual.email,
      })
    }
    return Array.from(map.values())
  }, [usuarios, usuarioActual])

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "estado",
        label: "Estado",
        icon: CheckCircle2,
        options: ESTADOS_PROYECTO.map((estado) => ({
          value: estado,
          label: ESTADO_PROYECTO_LABELS[estado],
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
        id: "responsable",
        label: "Responsable",
        icon: User,
        options: responsables,
      },
      {
        id: "departamento",
        label: "Departamento",
        icon: FolderKanban,
        options: departamentosDisponibles,
      },
      {
        id: "activo",
        label: "Registro",
        icon: FolderKanban,
        options: [
          { value: "true", label: "Activos" },
          { value: "false", label: "Inactivos" },
        ],
      },
    ],
    [responsables, departamentosDisponibles],
  )

  const filteredProyectos = useMemo(() => {
    const term = debouncedSearch.toLowerCase()

    const matchDimension = (dimensionId: string, value: string) => {
      const selected = facetSelecciones[dimensionId] ?? []
      return selected.length === 0 || selected.includes(value)
    }

    return proyectos.filter((proyecto) => {
      const matchSearch =
        term.length === 0 ||
        proyecto.codigo.toLowerCase().includes(term) ||
        proyecto.nombre.toLowerCase().includes(term) ||
        (proyecto.descripcion ?? "").toLowerCase().includes(term)

      return (
        matchSearch &&
        matchDimension("estado", proyecto.estado) &&
        matchDimension("prioridad", proyecto.prioridad) &&
        matchDimension("responsable", proyecto.responsable.id) &&
        matchDimension(
          "departamento",
          proyecto.departamento ? String(proyecto.departamento.id) : "SIN_DEPARTAMENTO",
        ) &&
        matchDimension("activo", String(proyecto.activo))
      )
    })
  }, [proyectos, debouncedSearch, facetSelecciones])

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

  const viewSwitcher = (
    <TabsList aria-label="Formato de la vista de proyectos">
      <TabsTrigger value="tabla">
        <List />
        Tabla
      </TabsTrigger>
      <TabsTrigger value="kanban">
        <SquareKanban />
        Kanban
      </TabsTrigger>
    </TabsList>
  )

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProyectos.length / ITEMS_PER_PAGE),
  )
  const activePage = Math.min(currentPage, totalPages)
  const paginatedProyectos = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredProyectos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProyectos, activePage])

  const handleDraftChange = <K extends keyof ProjectFormDraft>(
    field: K,
    value: ProjectFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const abrirCrear = () => {
    setEditingProject(null)
    setDraft(createEmptyDraft())
    setIsFormOpen(true)
  }

  const abrirEditar = (proyecto: Proyecto) => {
    setEditingProject(proyecto)
    setDraft(toFormDraft(proyecto))
    setIsDetailOpen(false)
    setSelectedProjectId(null)
    setIsFormOpen(true)
  }

  const handleOpenCard = (proyecto: Proyecto) => {
    if (proyecto.activo) {
      setSelectedProjectId(proyecto.id)
      setIsDetailOpen(true)
      return
    }
    if (puedeEditar) {
      abrirEditar(proyecto)
    }
  }

  const validar = (): boolean => {
    if (!draft.nombre.trim()) {
      toast.error("El nombre del proyecto es obligatorio.")
      return false
    }
    if (!datePattern.test(draft.fechaInicio)) {
      toast.error("La fecha de inicio debe tener formato AAAA-MM-DD.")
      return false
    }
    if (!datePattern.test(draft.fechaFinPlanificada)) {
      toast.error("La fecha fin planificada debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaFinReal && !datePattern.test(draft.fechaFinReal)) {
      toast.error("La fecha fin real debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaFinPlanificada < draft.fechaInicio) {
      toast.error("La fecha fin planificada no puede ser anterior al inicio.")
      return false
    }
    if (draft.presupuesto.trim() !== "") {
      const presupuesto = Number(draft.presupuesto)
      if (!Number.isFinite(presupuesto) || presupuesto < 0) {
        toast.error("El presupuesto debe ser un número mayor o igual a cero.")
        return false
      }
    }
    if (!draft.responsableId) {
      toast.error("Selecciona un responsable.")
      return false
    }
    return true
  }

  const buildDatos = (): DatosCreacionProyecto => {
    const descripcion = draft.descripcion.trim()
    return {
      nombre: draft.nombre.trim(),
      descripcion: descripcion === "" ? null : descripcion,
      estado: draft.estado as EstadoProyecto,
      prioridad: draft.prioridad as Prioridad,
      fechaInicio: draft.fechaInicio,
      fechaFinPlanificada: draft.fechaFinPlanificada,
      fechaFinReal: draft.fechaFinReal === "" ? null : draft.fechaFinReal,
      presupuesto:
        draft.presupuesto.trim() === "" ? null : Number(draft.presupuesto),
      responsableId: draft.responsableId,
      departamentoId:
        draft.departamentoId === "" ? null : Number(draft.departamentoId),
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validar()) return

    setIsSaving(true)
    try {
      if (editingProject) {
        const datos: DatosEdicionProyecto = buildDatos()
        await actualizarProyecto(editingProject.id, datos)
        toast.success("Proyecto actualizado correctamente.")
      } else {
        await crearProyecto(buildDatos())
        toast.success("Proyecto creado correctamente.")
      }
      setIsFormOpen(false)
      setEditingProject(null)
      recargar()
    } catch (err) {
      if (err instanceof ProyectoApiError && err.status === 403) {
        if (editingProject) setPuedeEditar(false)
        else setPuedeCrear(false)
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
      await eliminarProyecto(deleteTarget.id)
      setDeleteTarget(null)
      setIsFormOpen(false)
      setEditingProject(null)
      setIsDetailOpen(false)
      setSelectedProjectId(null)
      toast.success("Proyecto dado de baja correctamente.")
      recargar()
    } catch (err) {
      if (err instanceof ProyectoApiError && err.status === 403) {
        setPuedeEliminar(false)
      }
      toast.error(mensajeProyectoError(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReactivar = async (proyecto: Proyecto) => {
    setReactivandoId(proyecto.id)
    try {
      await actualizarProyecto(proyecto.id, { activo: true })
      toast.success("Proyecto reactivado correctamente.")
      recargar()
    } catch (err) {
      if (err instanceof ProyectoApiError && err.status === 403) {
        setPuedeEditar(false)
      }
      toast.error(mensajeProyectoError(err))
    } finally {
      setReactivandoId(null)
    }
  }

  const columns: DataTableColumn<Proyecto>[] = [
    {
      key: "codigo",
      header: "Código",
      cellClassName:
        "border-b border-border/70 px-4 py-3 font-mono text-xs font-semibold text-foreground whitespace-nowrap",
      render: (proyecto) => proyecto.codigo,
    },
    {
      key: "nombre",
      header: "Proyecto",
      cellClassName: `${cellBase} min-w-[260px]`,
      render: (proyecto) => (
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderKanban aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {proyecto.nombre}
            </p>
            {proyecto.descripcion ? (
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                {proyecto.descripcion}
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
      render: (proyecto) => (
        <div className="flex items-center gap-1.5">
          <Badge className={ESTADO_PROYECTO_BADGE_CLASS[proyecto.estado]}>
            {ESTADO_PROYECTO_LABELS[proyecto.estado]}
          </Badge>
          {!proyecto.activo && (
            <Badge className="border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400">
              Inactivo
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "prioridad",
      header: "Prioridad",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (proyecto) => (
        <Badge className={PRIORIDAD_BADGE_CLASS[proyecto.prioridad]}>
          {PRIORIDAD_LABELS[proyecto.prioridad]}
        </Badge>
      ),
    },
    {
      key: "responsable",
      header: "Responsable",
      cellClassName: `${cellBase} min-w-[160px] text-xs`,
      render: (proyecto) => proyecto.responsable.nombre,
    },
    {
      key: "fechaFinPlanificada",
      header: "Fin planificado",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (proyecto) => formatFecha(proyecto.fechaFinPlanificada),
    },
    {
      key: "presupuesto",
      header: "Presupuesto",
      cellClassName: `${cellBase} whitespace-nowrap text-xs font-medium`,
      render: (proyecto) => formatPresupuesto(proyecto.presupuesto),
    },
    {
      key: "acciones",
      header: "",
      cellClassName: "border-b border-border/70 px-4 py-3 text-right",
      render: (proyecto) => (
        <div className="flex items-center justify-end gap-1.5">
          {proyecto.activo ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Ver detalle"
                aria-label={`Ver ${proyecto.nombre}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedProjectId(proyecto.id)
                  setIsDetailOpen(true)
                }}
                className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
              >
                <Eye aria-hidden="true" className="size-3.5" />
              </Button>
              {puedeEditar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
                  onClick={(event) => {
                    event.stopPropagation()
                    abrirEditar(proyecto)
                  }}
                >
                  <Pencil aria-hidden="true" className="size-3.5" />
                  Editar
                </Button>
              )}
              {puedeEliminar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Dar de baja"
                  aria-label={`Dar de baja ${proyecto.nombre}`}
                  disabled={isSaving}
                  onClick={(event) => {
                    event.stopPropagation()
                    setDeleteTarget(proyecto)
                  }}
                  className="h-8 rounded-xl px-2.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </Button>
              )}
            </>
          ) : (
            puedeEditar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Reactivar proyecto"
                aria-label={`Reactivar ${proyecto.nombre}`}
                disabled={reactivandoId === proyecto.id}
                onClick={(event) => {
                  event.stopPropagation()
                  void handleReactivar(proyecto)
                }}
                className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Reactivar
              </Button>
            )
          )}
        </div>
      ),
    },
  ]

  return (
    <Tabs
      value={vista}
      onValueChange={cambiarVista}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <ModuleHeader
        eyebrow="Gestión de Proyectos"
        title="Proyectos"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {viewSwitcher}
            {puedeCrear && !sinPermisoListado ? (
              <Button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
              >
                <Plus className="size-4" />
                Nuevo Proyecto
              </Button>
            ) : null}
          </div>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o descripción..."
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
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <FolderKanban className="size-3.5 text-violet-700 dark:text-violet-200" />
            {loading
              ? "Cargando..."
              : hayFiltros
                ? `${filteredProyectos.length} de ${proyectos.length} proyectos`
                : `${filteredProyectos.length} proyectos registrados`}
          </span>
        }
      />

      {sinPermisoListado ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 p-8 text-center">
          <FolderKanban className="size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No tienes permiso para consultar proyectos
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Solicita el permiso proyectos:leer a un administrador.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={recargar}
                className="h-8 rounded-xl px-3 text-xs font-semibold"
              >
                Reintentar
              </Button>
            </div>
          )}

          <TabsContent
            value="tabla"
            className="m-0 flex min-h-0 flex-1 flex-col"
          >
            <DataTable<Proyecto>
              columns={columns}
              data={paginatedProyectos}
              rowKey={(proyecto) => proyecto.id}
              page={activePage}
              totalPages={totalPages}
              totalFiltered={filteredProyectos.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              onRowClick={(proyecto) => setSelectedProjectId(proyecto.id)}
              onRowDoubleClick={(proyecto) => {
                if (proyecto.activo) {
                  setSelectedProjectId(proyecto.id)
                  setIsDetailOpen(true)
                } else if (puedeEditar) {
                  abrirEditar(proyecto)
                }
              }}
              selectedRowKey={selectedProjectId}
              emptyMessage={
                loading
                  ? "Cargando proyectos..."
                  : hayFiltros
                    ? "No se encontraron proyectos con los criterios de búsqueda seleccionados."
                    : "No hay proyectos visibles. Solo se muestran proyectos activos donde eres responsable o miembro, salvo que tengas el permiso proyectos:ver-todos."
              }
            />
          </TabsContent>

          <TabsContent
            value="kanban"
            className="m-0 min-h-0 flex-1 overflow-hidden"
          >
            <ProjectsBoard
              proyectos={filteredProyectos}
              loading={loading}
              selectedId={selectedProjectId}
              puedeEditar={puedeEditar}
              onOpen={handleOpenCard}
              onEdit={abrirEditar}
            />
          </TabsContent>
        </>
      )}

      <ProjectDetailDialog
        proyectoId={selectedProjectId}
        open={isDetailOpen}
        usuarios={usuarios}
        puedeEditar={puedeEditar}
        onOpenChange={setIsDetailOpen}
        onEdit={abrirEditar}
        onProjectChanged={recargar}
      />

      <ProjectFormDialog
        open={isFormOpen}
        draft={draft}
        mode={editingProject ? "edit" : "create"}
        usuarios={responsablesDisponibles}
        departamentos={departamentos}
        estadosPermitidos={
          editingProject
            ? estadosProyectoPermitidos(editingProject.estado)
            : undefined
        }
        isSaving={isSaving}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingProject(null)
        }}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleSubmit(event)}
        onDelete={
          editingProject && puedeEliminar
            ? () => setDeleteTarget(editingProject)
            : undefined
        }
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Dar de baja el proyecto"
        itemName={deleteTarget?.nombre ?? "este proyecto"}
        description="El proyecto se dará de baja. Sus tareas, horas, hitos, miembros y adjuntos no se borran. Esta acción se puede revertir reactivándolo."
        confirmLabel="Dar de Baja"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </Tabs>
  )
}

export default ProjectsPage
