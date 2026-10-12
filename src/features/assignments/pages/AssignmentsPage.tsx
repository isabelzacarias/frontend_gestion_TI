import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Laptop,
  Plus,
  RotateCcw,
  Search,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import {
  AssignmentFormDialog,
  type AssignmentFormDraft,
} from "@/features/assignments/components/AssignmentFormDialog"
import {
  assignmentAssetOptions,
  assignmentUserOptions,
  sampleAssignments,
} from "@/features/assignments/data/assignmentsData"
import type {
  Assignment,
  AssignmentAsset,
  AssignmentUser,
} from "@/features/assignments/types/assignment"

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
  usuarioId: assignmentUserOptions[0]?.id ?? "",
  activoId: String(assignmentAssetOptions[0]?.id ?? ""),
  nombreEquipo: "",
  numeroActivo: "",
  anioCompra: String(new Date().getFullYear()),
  fechaAsignacion: new Date().toISOString().slice(0, 10),
  fechaDevolucion: "",
  activa: "true",
  observacion: "",
})

const toAssignmentDraft = (item: Assignment): AssignmentFormDraft => ({
  usuarioId: item.usuario.id,
  activoId: String(item.activo.id),
  nombreEquipo: item.nombreEquipo ?? "",
  numeroActivo: item.numeroActivo ?? "",
  anioCompra: item.anioCompra !== null ? String(item.anioCompra) : "",
  fechaAsignacion: item.fechaAsignacion ? item.fechaAsignacion.slice(0, 10) : "",
  fechaDevolucion: item.fechaDevolucion ? item.fechaDevolucion.slice(0, 10) : "",
  activa: item.activa ? "true" : "false",
  observacion: item.observacion ?? "",
})

function resolveAsset(activoId: string): AssignmentAsset {
  return (
    assignmentAssetOptions.find((asset) => String(asset.id) === activoId) ??
    assignmentAssetOptions[0]
  )
}

function resolveUser(usuarioId: string): AssignmentUser {
  return (
    assignmentUserOptions.find((user) => user.id === usuarioId) ??
    assignmentUserOptions[0]
  )
}

function createAssignmentFromDraft(record: AssignmentFormDraft, id: number): Assignment {
  const isActive = record.activa === "true"
  const nowIso = new Date().toISOString()

  return {
    id,
    activa: isActive,
    fechaAsignacion: record.fechaAsignacion
      ? `${record.fechaAsignacion}T00:00:00.000Z`
      : nowIso,
    fechaDevolucion: isActive
      ? null
      : record.fechaDevolucion
        ? `${record.fechaDevolucion}T00:00:00.000Z`
        : nowIso,
    anioCompra: record.anioCompra ? Number(record.anioCompra) : null,
    numeroActivo: record.numeroActivo.trim() || null,
    nombreEquipo: record.nombreEquipo.trim() || null,
    observacion: record.observacion.trim() || null,
    usuario: resolveUser(record.usuarioId),
    activo: resolveAsset(record.activoId),
  }
}

function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(sampleAssignments)
  const [search, setSearch] = useState("")
  const [selectedActiva, setSelectedActiva] = useState<"ALL" | "true" | "false">("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  // Modales
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pendingReturnId, setPendingReturnId] = useState<number | null>(null)
  const [draft, setDraft] = useState<AssignmentFormDraft>(createEmptyAssignmentDraft())

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId],
  )

  // Filtrado de asignaciones
  const filteredAssignments = useMemo(() => {
    const term = search.trim().toLowerCase()
    const hasTerm = term.length > 0
    const idTerm = term.replace(/^#/, "")
    // "#4" o "4" => búsqueda por ID; texto => equipo o usuario
    const isIdSearch = term.startsWith("#") || /^\d+$/.test(term)

    return assignments.filter((item) => {
      const matchActiva =
        selectedActiva === "ALL" || String(item.activa) === selectedActiva

      if (!matchActiva) return false
      if (!hasTerm) return true

      if (isIdSearch) {
        return idTerm === "" || item.id.toString().includes(idTerm)
      }

      const searchable = [item.nombreEquipo, item.usuario.nombre, item.usuario.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchable.includes(term)
    })
  }, [assignments, search, selectedActiva])

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedAssignments = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredAssignments.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAssignments, activePage])

  const pendingReturn = assignments.find((item) => item.id === pendingReturnId)

  const handleExport = () => {
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
      item.id,
      item.nombreEquipo ?? "",
      item.activo.claveActivo ?? "",
      item.activo.numeroSerie ?? "",
      item.usuario.nombre,
      item.usuario.email ?? "",
      item.fechaAsignacion,
      item.fechaDevolucion ?? "",
      item.activa ? "Activa" : "Devuelta",
      item.observacion ?? "",
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "asignaciones.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Asignaciones exportadas a CSV.")
  }

  const handleDraftChange = <K extends keyof AssignmentFormDraft>(
    field: K,
    value: AssignmentFormDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleOpenAddDialog = () => {
    setDraft(createEmptyAssignmentDraft())
    setSelectedAssignmentId(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (item: Assignment) => {
    setSelectedAssignmentId(item.id)
    setDraft(toAssignmentDraft(item))
    setIsDetailDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleCreateAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextId = Math.max(...assignments.map((item) => item.id), 0) + 1
    const newAssignment = createAssignmentFromDraft(draft, nextId)

    setAssignments((current) => [newAssignment, ...current])
    setIsAddDialogOpen(false)
    setCurrentPage(1)
    toast.success(`Asignación #${nextId} registrada exitosamente.`)
  }

  const handleImportAssignments = (records: AssignmentFormDraft[]) => {
    const idBase = Math.max(...assignments.map((item) => item.id), 0)
    const importedAssignments = records.map((record, index) =>
      createAssignmentFromDraft(record, idBase + index + 1),
    )

    setAssignments((current) => [...importedAssignments, ...current])
    setIsAddDialogOpen(false)
    setCurrentPage(1)
    toast.success(
      `${importedAssignments.length} ${importedAssignments.length === 1 ? "asignación registrada" : "asignaciones registradas"} correctamente.`,
    )
  }

  const handleUpdateAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedAssignmentId === null) return
    const isActive = draft.activa === "true"
    const nowIso = new Date().toISOString()

    setAssignments((current) =>
      current.map((item) =>
        item.id === selectedAssignmentId
          ? {
              ...item,
              activa: isActive,
              fechaAsignacion: draft.fechaAsignacion
                ? `${draft.fechaAsignacion}T00:00:00.000Z`
                : item.fechaAsignacion,
              fechaDevolucion: isActive
                ? null
                : draft.fechaDevolucion
                  ? `${draft.fechaDevolucion}T00:00:00.000Z`
                  : (item.fechaDevolucion ?? nowIso),
              anioCompra: draft.anioCompra ? Number(draft.anioCompra) : null,
              numeroActivo: draft.numeroActivo.trim() || null,
              nombreEquipo: draft.nombreEquipo.trim() || null,
              observacion: draft.observacion.trim() || null,
              usuario: resolveUser(draft.usuarioId),
              activo: resolveAsset(draft.activoId),
            }
          : item,
      ),
    )
    setIsEditDialogOpen(false)
    toast.success("Asignación actualizada correctamente.")
  }

  const handleRequestReturn = (item: Assignment) => {
    setSelectedAssignmentId(item.id)
    setPendingReturnId(item.id)
    setIsReturnDialogOpen(true)
  }

  const handleConfirmReturn = () => {
    if (pendingReturnId === null) return
    const nowIso = new Date().toISOString()
    setAssignments((current) =>
      current.map((item) =>
        item.id === pendingReturnId
          ? { ...item, activa: false, fechaDevolucion: nowIso }
          : item,
      ),
    )
    setIsReturnDialogOpen(false)
    setPendingReturnId(null)
    setIsDetailDialogOpen(false)
    toast.success("Devolución registrada exitosamente.")
  }

  const handleConfirmDelete = () => {
    if (selectedAssignmentId === null) return
    setAssignments((current) => current.filter((item) => item.id !== selectedAssignmentId))
    setSelectedAssignmentId(null)
    setIsDeleteDialogOpen(false)
    setIsDetailDialogOpen(false)
    setIsEditDialogOpen(false)
    toast.success("Asignación eliminada exitosamente.")
  }

  // Columnas para DataTable
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
              onClick={() => handleRequestReturn(item)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="size-3.5" />
              Devolver
            </button>
          </div>
        ) : null,
    },
  ]

  // Secciones para DetailDialog
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Control de Activos"
        title="Asignaciones de Equipo"
        actions={
          <>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.05)] backdrop-blur-md transition hover:bg-white/90 dark:border-violet-400/30 dark:bg-slate-900/70 dark:text-violet-100 dark:hover:bg-slate-800/90"
            >
              <Download className="size-4" />
              Exportar
            </button>

            <button
              type="button"
              onClick={handleOpenAddDialog}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] transition hover:brightness-110"
            >
              <Plus className="size-4" />
              Asignar Equipo
            </button>
          </>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por ID, equipo o usuario (ej. 18 o #18)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filtro por Estado de la asignación */}
            <div className="relative">
              <select
                value={selectedActiva}
                onChange={(e) => {
                  setSelectedActiva(e.target.value as "ALL" | "true" | "false")
                  setCurrentPage(1)
                }}
                className="h-10 cursor-pointer appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Todas las asignaciones</option>
                <option value="true">Activas</option>
                <option value="false">Devueltas</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {filteredAssignments.length} asignaciones
          </span>
        }
      />

      {/* Tabla de Asignaciones */}
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
        emptyMessage="No se encontraron asignaciones con los criterios de búsqueda seleccionados."
      />

      {/* Modal de Detalle */}
      {selectedAssignment && (
        <DetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          title={selectedAssignment.nombreEquipo ?? `Asignación #${selectedAssignment.id}`}
          description={`Detalle de la asignación #${selectedAssignment.id}`}
          icon={<Laptop className="size-6 text-white" />}
          sections={detailSections}
          onEdit={() => handleOpenEditDialog(selectedAssignment)}
        />
      )}

      {/* Modal de Creación */}
      <AssignmentFormDialog
        open={isAddDialogOpen}
        draft={draft}
        mode="create"
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleCreateAssignment}
        onImport={handleImportAssignments}
      />

      {/* Modal de Edición */}
      <AssignmentFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        onOpenChange={setIsEditDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleUpdateAssignment}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      {/* Diálogo de confirmación de devolución */}
      <ConfirmDeleteDialog
        open={isReturnDialogOpen}
        title="Registrar devolución"
        itemName={pendingReturn?.nombreEquipo ?? "este equipo"}
        description="¿Confirmas la devolución de este equipo? El activo regresará a almacén y la asignación quedará inactiva."
        confirmLabel="Devolver"
        onConfirm={handleConfirmReturn}
        onCancel={() => {
          setIsReturnDialogOpen(false)
          setPendingReturnId(null)
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        title="Eliminar asignación"
        itemName={
          selectedAssignment
            ? `la asignación #${selectedAssignment.id}`
            : "esta asignación"
        }
        description="¿Estás seguro de eliminar esta asignación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  )
}

export default AssignmentsPage
