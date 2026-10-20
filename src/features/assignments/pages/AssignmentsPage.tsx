import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowUpDown,
  CircleDot,
  Download,
  Laptop,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import {
  AssignmentFormDialog,
  type AssignmentFormDraft,
  type AssignmentFormMode,
} from "@/features/assignments/components/AssignmentFormDialog"
import {
  AsignacionApiError,
  actualizarAsignacion,
  crearAsignacion,
  devolverAsignacion,
  listarTodasLasAsignaciones,
} from "@/features/assignments/services/asignacion.service"
import type { Assignment } from "@/features/assignments/types/assignment"
import { listarTodosLosActivos } from "@/services/activo.service"
import {
  UsuarioApiError,
  listarTodosLosUsuarios,
  type UsuarioLista,
} from "@/services/usuario.service"
import type { ActivoResumen } from "@/types/activo"
import { downloadCsv } from "@/lib/csv"

const ITEMS_PER_PAGE = 10

const assetStateLabels: Record<Assignment["activo"]["estado"], string> = {
  EN_USO: "En uso",
  EN_ALMACEN: "En almacén",
  EN_MANTENIMIENTO: "En mantenimiento",
  DE_BAJA: "De baja",
}

const assetStateClasses: Record<Assignment["activo"]["estado"], string> = {
  EN_USO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  EN_ALMACEN: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  EN_MANTENIMIENTO: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DE_BAJA: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

function formatDateTime(isoString: string | null): string {
  if (!isoString) return "—"
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

const createEmptyAssignmentDraft = (): AssignmentFormDraft => ({
  usuarioId: "",
  activoId: "",
  nombreEquipo: "",
  numeroActivo: "",
  anioCompra: String(new Date().getFullYear()),
  observacion: "",
})

const toAssignmentDraft = (item: Assignment): AssignmentFormDraft => ({
  usuarioId: item.usuario.id,
  activoId: String(item.activo.id),
  nombreEquipo: item.nombreEquipo ?? "",
  numeroActivo: item.numeroActivo ?? "",
  anioCompra: item.anioCompra !== null ? String(item.anioCompra) : "",
  observacion: item.observacion ?? "",
})

function mensajeDeError(error: unknown): string {
  if (error instanceof AsignacionApiError || error instanceof UsuarioApiError) {
    return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return "No se pudo completar la operación."
}

function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [activos, setActivos] = useState<ActivoResumen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [searchTerm, setSearchTerm] = useState("")
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<AssignmentFormMode | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [pendingReturnId, setPendingReturnId] = useState<number | null>(null)
  const [draft, setDraft] = useState<AssignmentFormDraft>(createEmptyAssignmentDraft())

  const recargar = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelado = false

    async function cargarDatos() {
      setIsLoading(true)

      try {
        const [listaAsignaciones, listaUsuarios, listaActivos] = await Promise.all([
          listarTodasLasAsignaciones(),
          listarTodosLosUsuarios(),
          listarTodosLosActivos({ estado: "EN_ALMACEN" }),
        ])
        if (cancelado) return
        setAssignments(listaAsignaciones)
        setUsuarios(listaUsuarios)
        setActivos(listaActivos)
      } catch (error) {
        if (cancelado) return
        toast.error(mensajeDeError(error))
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarDatos()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId],
  )

  const usuariosParaForm = useMemo<UsuarioLista[]>(() => {
    if (dialogMode === "edit" && selectedAssignment) {
      const usuario = selectedAssignment.usuario
      if (!usuarios.some((item) => item.id === usuario.id)) {
        return [
          ...usuarios,
          {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            activo: true,
            fechaInicio: null,
            fechaFin: null,
            departamento: null,
            ubicacion: null,
            puesto: null,
            tipoUsuario: null,
            rol: null,
            permisosExtra: [],
            permisosRevocados: [],
          },
        ]
      }
    }
    return usuarios
  }, [usuarios, dialogMode, selectedAssignment])

  const activosParaForm = useMemo<ActivoResumen[]>(() => {
    if (dialogMode === "edit" && selectedAssignment) {
      const activo = selectedAssignment.activo
      if (!activos.some((item) => item.id === activo.id)) {
        return [
          ...activos,
          {
            id: activo.id,
            claveActivo: activo.claveActivo,
            cb23: null,
            tipo: activo.tipo,
            marca: activo.marca,
            modelo: activo.modelo,
            numeroSerie: activo.numeroSerie,
            sucursal: null,
            estado: activo.estado,
            estadoGeneral: null,
            nombreRed: null,
            responsable: null,
          },
        ]
      }
    }
    return activos
  }, [activos, dialogMode, selectedAssignment])

  const filteredAssignments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const hasTerm = term.length > 0
    const idTerm = term.replace(/^#/, "")
    const isIdSearch = term.startsWith("#") || /^\d+$/.test(term)

    return assignments.filter((item) => {
      const matchEstado =
        estadoSeleccionado.length === 0 ||
        estadoSeleccionado.includes(String(item.activa))

      if (!matchEstado) return false
      if (!hasTerm) return true

      if (isIdSearch) {
        return idTerm === "" || String(item.id).includes(idTerm)
      }

      return [
        item.nombreEquipo,
        item.numeroActivo,
        item.activo.claveActivo,
        item.usuario.nombre,
        item.usuario.email,
      ].some((value) => (value ?? "").toLowerCase().includes(term))
    })
  }, [assignments, searchTerm, estadoSeleccionado])

  const hayFiltros = estadoSeleccionado.length > 0 || searchTerm.trim() !== ""

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "estado",
        label: "Estado",
        icon: CircleDot,
        options: [
          { value: "true", label: "Activas" },
          { value: "false", label: "Devueltas" },
        ],
      },
    ],
    [],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({ estado: estadoSeleccionado }),
    [estadoSeleccionado],
  )

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedAssignments = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredAssignments.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAssignments, activePage])

  const pendingReturn = assignments.find((item) => item.id === pendingReturnId)

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "estado") {
      setEstadoSeleccionado(values)
    }
    setCurrentPage(1)
  }

  function borrarFacetas() {
    setEstadoSeleccionado([])
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearchTerm("")
    borrarFacetas()
  }

  function handleDraftChange<K extends keyof AssignmentFormDraft>(
    field: K,
    value: AssignmentFormDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function openCreateDialog() {
    setDraft({
      ...createEmptyAssignmentDraft(),
      activoId: activos[0] ? String(activos[0].id) : "",
      usuarioId: usuarios[0]?.id ?? "",
    })
    setSelectedAssignmentId(null)
    setDialogMode("create")
  }

  function openEditDialog(item: Assignment) {
    setSelectedAssignmentId(item.id)
    setDraft(toAssignmentDraft(item))
    setIsDetailDialogOpen(false)
    setDialogMode("edit")
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setDraft(createEmptyAssignmentDraft())
      setSelectedAssignmentId(null)
      setDialogMode(null)
    }
  }

  function handleExport() {
    const header = [
      "ID",
      "Equipo",
      "Clave activo",
      "No. serie",
      "Usuario",
      "Email",
      "Fecha asignación",
      "Fecha devolución",
      "Estado",
      "Observación",
    ]
    const rows = filteredAssignments.map((item) => [
      String(item.id),
      item.nombreEquipo ?? "",
      item.activo.claveActivo ?? "",
      item.activo.numeroSerie ?? "",
      item.usuario.nombre,
      item.usuario.email ?? "",
      formatDateTime(item.fechaAsignacion),
      formatDateTime(item.fechaDevolucion),
      item.activa ? "Activa" : "Devuelta",
      item.observacion ?? "",
    ])

    downloadCsv(header, rows, "asignaciones.csv")
    toast.success("Asignaciones exportadas a CSV.")
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const activoId = Number(draft.activoId)
    if (!draft.activoId || !Number.isInteger(activoId)) {
      toast.error("Selecciona un activo del inventario.")
      return
    }
    if (!draft.usuarioId) {
      toast.error("Selecciona un usuario.")
      return
    }

    setIsSaving(true)
    try {
      await crearAsignacion(activoId, {
        usuarioId: draft.usuarioId,
        anioCompra: draft.anioCompra ? Number(draft.anioCompra) : null,
        numeroActivo: draft.numeroActivo.trim() || null,
        nombreEquipo: draft.nombreEquipo.trim() || null,
        observacion: draft.observacion.trim() || null,
      })
      toast.success("Asignación registrada exitosamente.")
      setDraft(createEmptyAssignmentDraft())
      setDialogMode(null)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedAssignmentId === null || isSaving) return

    setIsSaving(true)
    try {
      await actualizarAsignacion(selectedAssignmentId, {
        anioCompra: draft.anioCompra ? Number(draft.anioCompra) : null,
        numeroActivo: draft.numeroActivo.trim() || null,
        nombreEquipo: draft.nombreEquipo.trim() || null,
        observacion: draft.observacion.trim() || null,
      })
      toast.success("Asignación actualizada correctamente.")
      setDraft(createEmptyAssignmentDraft())
      setSelectedAssignmentId(null)
      setDialogMode(null)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function importAssignments(records: AssignmentFormDraft[]) {
    if (records.length === 0 || isSaving) return

    setIsSaving(true)
    let exitos = 0
    const fallos: string[] = []

    for (const record of records) {
      const activoId = Number(record.activoId)
      const etiqueta = record.nombreEquipo.trim() || `#${record.activoId}`

      if (!record.usuarioId || !Number.isInteger(activoId)) {
        fallos.push(etiqueta)
        continue
      }

      try {
        await crearAsignacion(activoId, {
          usuarioId: record.usuarioId,
          anioCompra: record.anioCompra ? Number(record.anioCompra) : null,
          numeroActivo: record.numeroActivo.trim() || null,
          nombreEquipo: record.nombreEquipo.trim() || null,
          observacion: record.observacion.trim() || null,
        })
        exitos += 1
      } catch {
        fallos.push(etiqueta)
      }
    }

    setIsSaving(false)
    setDialogMode(null)
    setSearchTerm("")
    setEstadoSeleccionado([])
    recargar()

    if (fallos.length === 0) {
      toast.success(
        `${exitos} ${exitos === 1 ? "asignación registrada" : "asignaciones registradas"} correctamente.`,
      )
    } else {
      toast.warning(
        `${exitos} registradas y ${fallos.length} con error: ${fallos.join(", ")}.`,
      )
    }
  }

  function requestReturn(item: Assignment) {
    setSelectedAssignmentId(item.id)
    setPendingReturnId(item.id)
    setIsReturnDialogOpen(true)
  }

  function handleDeleteAssignment() {
    if (selectedAssignmentId === null) return

    setAssignments((current) =>
      current.filter((item) => item.id !== selectedAssignmentId),
    )
    setDraft(createEmptyAssignmentDraft())
    setSelectedAssignmentId(null)
    setDialogMode(null)
    setCurrentPage(1)
    toast.success("Asignación eliminada.")
  }

  async function confirmReturn() {
    if (pendingReturnId === null || isSaving) return

    setIsSaving(true)
    try {
      await devolverAsignacion(pendingReturnId)
      toast.success("Devolución registrada exitosamente.")
      setIsReturnDialogOpen(false)
      setPendingReturnId(null)
      setIsDetailDialogOpen(false)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const columns: DataTableColumn<Assignment>[] = [
    {
      key: "id",
      header: "ID",
      cellClassName: "border-b border-border/70 px-4 py-3 font-mono font-semibold text-foreground",
      render: (item) => `#${item.id}`,
    },
    {
      key: "equipo",
      header: "Equipo",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[200px]",
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Laptop className="size-4 text-primary" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground">
              {item.nombreEquipo ?? "Sin nombre"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {[item.activo.tipo, item.activo.marca].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "activo",
      header: "Activo",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[180px]",
      render: (item) => (
        <div className="min-w-0 space-y-1">
          <div className="truncate font-mono text-xs font-medium text-foreground">
            {item.activo.claveActivo ?? "—"}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {item.activo.numeroSerie ?? "Sin serie"}
          </div>
        </div>
      ),
    },
    {
      key: "usuario",
      header: "Usuario Asignado",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[200px]",
      render: (item) => (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <UserRound className="size-3.5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-foreground">
              {item.usuario.nombre}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {item.usuario.email ?? "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "fechaAsignacion",
      header: "Asignación",
      cellClassName: "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground whitespace-nowrap",
      render: (item) => formatDateTime(item.fechaAsignacion),
    },
    {
      key: "fechaDevolucion",
      header: "Devolución",
      cellClassName: "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground whitespace-nowrap",
      render: (item) => formatDateTime(item.fechaDevolucion),
    },
    {
      key: "activa",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (item) =>
        item.activa ? (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">
            Activa
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-slate-400/30 bg-slate-400/10 font-medium text-slate-600 dark:text-slate-400"
          >
            Devuelta
          </Badge>
        ),
    },
    {
      key: "observacion",
      header: "Observación",
      cellClassName: "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground max-w-[220px]",
      render: (item) => (
        <span className="line-clamp-1" title={item.observacion ?? undefined}>
          {item.observacion ?? "—"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (item) =>
        item.activa ? (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              title="Registrar devolución"
              aria-label={`Devolver asignación #${item.id}`}
              onClick={() => requestReturn(item)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="size-3.5" />
              Devolver
            </button>
          </div>
        ) : null,
    },
  ]

  const detailSections: DetailSection[] = selectedAssignment
    ? [
        {
          title: "Equipo y Activo",
          color: "primary",
          fields: [
            { key: "nombreEquipo", label: "Nombre del equipo", value: selectedAssignment.nombreEquipo ?? "—" },
            { key: "numeroActivo", label: "Número de activo", value: selectedAssignment.numeroActivo ?? "—" },
            { key: "claveActivo", label: "Clave de activo", value: selectedAssignment.activo.claveActivo ?? "—" },
            { key: "tipo", label: "Tipo", value: selectedAssignment.activo.tipo },
            { key: "marca", label: "Marca", value: selectedAssignment.activo.marca ?? "—" },
            { key: "modelo", label: "Modelo", value: selectedAssignment.activo.modelo ?? "—" },
            { key: "numeroSerie", label: "Número de serie", value: selectedAssignment.activo.numeroSerie ?? "—" },
            {
              key: "estadoActivo",
              label: "Estado del activo",
              value: (
                <Badge className={assetStateClasses[selectedAssignment.activo.estado]}>
                  {assetStateLabels[selectedAssignment.activo.estado]}
                </Badge>
              ),
            },
          ],
        },
        {
          title: "Usuario Asignado",
          color: "emerald",
          fields: [
            { key: "usuarioNombre", label: "Nombre completo", value: selectedAssignment.usuario.nombre },
            { key: "usuarioEmail", label: "Correo electrónico", value: selectedAssignment.usuario.email ?? "—" },
            { key: "usuarioId", label: "ID de usuario", value: selectedAssignment.usuario.id },
          ],
        },
        {
          title: "Detalle de la Asignación",
          color: "cyan",
          fields: [
            {
              key: "activa",
              label: "Estado",
              value: selectedAssignment.activa ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">
                  Activa
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-slate-400/30 bg-slate-400/10 font-medium text-slate-600 dark:text-slate-400"
                >
                  Devuelta
                </Badge>
              ),
            },
            { key: "fechaAsignacion", label: "Fecha de asignación", value: formatDateTime(selectedAssignment.fechaAsignacion) },
            { key: "fechaDevolucion", label: "Fecha de devolución", value: formatDateTime(selectedAssignment.fechaDevolucion) },
            { key: "anioCompra", label: "Año de compra", value: selectedAssignment.anioCompra ?? "—" },
            {
              key: "observacion",
              label: "Observación",
              value: selectedAssignment.observacion ?? "—",
              colSpan: "sm:col-span-2",
            },
          ],
        },
      ]
    : []

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Control de Activos"
        title="Asignaciones de Equipo"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.05)] backdrop-blur-md hover:bg-white/90 dark:border-violet-400/30 dark:bg-slate-900/70 dark:text-violet-100 dark:hover:bg-slate-800/90"
            >
              <Download className="size-4" />
              Exportar
            </Button>

            <Button
              type="button"
              onClick={openCreateDialog}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] transition hover:brightness-110"
            >
              <Plus className="size-4" />
              Asignar Equipo
            </Button>
          </>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por ID, equipo o usuario (ej. 18 o #18)..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <FacetedFilter
              dimensions={facetDimensions}
              selections={facetSelecciones}
              onChange={handleFacetChange}
              onClearAll={borrarFacetas}
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
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {hayFiltros
              ? `${filteredAssignments.length} de ${assignments.length} asignaciones`
              : `${filteredAssignments.length} asignaciones`}
          </span>
        }
      />

      <DataTable<Assignment>
        columns={columns}
        data={paginatedAssignments}
        rowKey={(assignment) => assignment.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredAssignments.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onRowClick={(assignment) => setSelectedAssignmentId(assignment.id)}
        onRowDoubleClick={(assignment) => {
          setSelectedAssignmentId(assignment.id)
          setIsDetailDialogOpen(true)
        }}
        selectedRowKey={selectedAssignmentId}
        emptyMessage={
          isLoading
            ? "Cargando asignaciones..."
            : "No se encontraron asignaciones con los criterios de búsqueda seleccionados."
        }
      />

      {selectedAssignment && (
        <DetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          title={selectedAssignment.nombreEquipo ?? `Asignación #${selectedAssignment.id}`}
          description={`Detalle de la asignación #${selectedAssignment.id}`}
          icon={<Laptop className="size-6 text-white" />}
          sections={detailSections}
          onEdit={
            selectedAssignment.activa
              ? () => openEditDialog(selectedAssignment)
              : undefined
          }
        />
      )}

      <AssignmentFormDialog
        open={dialogMode !== null}
        draft={draft}
        mode={dialogMode ?? "create"}
        usuarios={usuariosParaForm}
        activos={activosParaForm}
        onOpenChange={closeDialog}
        onChange={handleDraftChange}
        onSubmit={(event) =>
          void (dialogMode === "edit" ? submitEdit(event) : submitCreate(event))
        }
        onImport={
          dialogMode === "create"
            ? (records) => void importAssignments(records)
            : undefined
        }
        onDelete={dialogMode === "edit" ? handleDeleteAssignment : undefined}
      />

      <ConfirmDeleteDialog
        open={isReturnDialogOpen}
        title="Registrar devolución"
        itemName={pendingReturn?.nombreEquipo ?? "este equipo"}
        description="¿Confirmas la devolución de este equipo? El activo regresará a almacén y la asignación quedará inactiva."
        confirmLabel="Devolver"
        onConfirm={() => void confirmReturn()}
        onCancel={() => {
          setIsReturnDialogOpen(false)
          setPendingReturnId(null)
        }}
      />
    </div>
  )
}

export default AssignmentsPage
