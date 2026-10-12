import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { LicenseFormDialog } from "@/features/licenses/components/LicenseFormDialog"
import { sampleLicenses } from "@/features/licenses/data/licensesData"
import type {
  AsignadaA,
  License,
  LicenseFormDraft,
} from "@/features/licenses/types/license"

function formatDate(isoString: string | null): string {
  if (!isoString) return "—"
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  } catch {
    return isoString
  }
}

const createEmptyLicenseDraft = (): LicenseFormDraft => ({
  software: "",
  clave: "",
  proveedor: "",
  fechaCompra: new Date().toISOString().slice(0, 10),
  fechaVencimiento: "",
  asignadaAId: "ADMIN",
  activa: true,
})

const toLicenseDraft = (item: License): LicenseFormDraft => ({
  software: item.software,
  clave: item.clave ?? "",
  proveedor: item.proveedor ?? "",
  fechaCompra: item.fechaCompra ? item.fechaCompra.slice(0, 10) : "",
  fechaVencimiento: item.fechaVencimiento ? item.fechaVencimiento.slice(0, 10) : "",
  asignadaAId: item.asignadaA?.id ?? "",
  activa: item.activa,
})

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"

const resolveAssignee = (id: string): AsignadaA | null => {
  if (id === "ADMIN") {
    return { id: "ADMIN", nombre: "Administrador", email: "admin@horbismex.com" }
  }
  if (id === "TECH-01") {
    return { id: "TECH-01", nombre: "Carlos Ramírez", email: "carlos.ramirez@horbismex.com" }
  }
  if (id === "TECH-02") {
    return { id: "TECH-02", nombre: "Daniel Valdés", email: "daniel.valdes@horbismex.com" }
  }
  return null
}

const createLicenseFromDraft = (draft: LicenseFormDraft, id: number): License => {
  const tieneClave = Boolean(draft.clave && draft.clave.trim().length > 0)

  return {
    id,
    software: draft.software.trim() || `Licencia #${id}`,
    tieneClave,
    clave: tieneClave ? draft.clave.trim() : null,
    proveedor: draft.proveedor.trim() || null,
    fechaCompra: draft.fechaCompra ? `${draft.fechaCompra}T00:00:00.000Z` : null,
    fechaVencimiento: draft.fechaVencimiento ? `${draft.fechaVencimiento}T00:00:00.000Z` : null,
    activa: String(draft.activa) === "true",
    asignadaA: resolveAssignee(draft.asignadaAId),
  }
}

function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>(sampleLicenses)
  const [search, setSearch] = useState("")
  const [selectedActiva, setSelectedActiva] = useState<"ALL" | "true" | "false">("ALL")
  const [selectedTieneClave, setSelectedTieneClave] = useState<"ALL" | "true" | "false">("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  // Modales
  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDetailKeyVisible, setIsDetailKeyVisible] = useState(false)
  const [draft, setDraft] = useState<LicenseFormDraft>(createEmptyLicenseDraft())

  const selectedLicense = useMemo(
    () => licenses.find((item) => item.id === selectedLicenseId) ?? null,
    [licenses, selectedLicenseId],
  )

  // Filtrado de licencias
  const filteredLicenses = useMemo(() => {
    const term = search.trim().toLowerCase()
    const hasTerm = term.length > 0
    const idTerm = term.replace(/^#/, "")
    // "#4" o "4" => búsqueda por ID; texto => nombre/proveedor/usuario
    const isIdSearch = term.startsWith("#") || /^\d+$/.test(term)

    return licenses.filter((item) => {
      const matchSearch =
        !hasTerm ||
        (isIdSearch
          ? idTerm === "" || item.id.toString().includes(idTerm)
          : item.software.toLowerCase().includes(term) ||
            (item.proveedor?.toLowerCase().includes(term) ?? false) ||
            (item.asignadaA?.nombre.toLowerCase().includes(term) ?? false) ||
            (item.asignadaA?.email.toLowerCase().includes(term) ?? false))

      const matchActiva =
        selectedActiva === "ALL" || String(item.activa) === selectedActiva

      const matchTieneClave =
        selectedTieneClave === "ALL" || String(item.tieneClave) === selectedTieneClave

      return matchSearch && matchActiva && matchTieneClave
    })
  }, [licenses, search, selectedActiva, selectedTieneClave])

  const totalPages = Math.max(1, Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedLicenses = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredLicenses.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredLicenses, activePage])

  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiada al portapapeles`)
  }

  const handleDraftChange = <K extends keyof LicenseFormDraft>(
    field: K,
    value: LicenseFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenAddDialog = () => {
    setDraft(createEmptyLicenseDraft())
    setSelectedLicenseId(null)
    setIsAddDialogOpen(true)
  }

  const handleOpenEditDialog = (item: License) => {
    setSelectedLicenseId(item.id)
    setDraft(toLicenseDraft(item))
    setIsDetailDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleCreateLicense = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextId = Math.max(...licenses.map((l) => l.id), 0) + 1
    const newLicense = createLicenseFromDraft(draft, nextId)

    setLicenses((prev) => [newLicense, ...prev])
    setIsAddDialogOpen(false)
    toast.success(`Licencia "${newLicense.software}" creada exitosamente.`)
  }

  const handleImportLicenses = (records: LicenseFormDraft[]) => {
    const idBase = Math.max(...licenses.map((l) => l.id), 0)
    const importedLicenses = records.map((record, index) =>
      createLicenseFromDraft(record, idBase + index + 1),
    )

    setLicenses((prev) => [...importedLicenses, ...prev])
    setIsAddDialogOpen(false)
    setCurrentPage(1)
    toast.success(
      `${importedLicenses.length} ${importedLicenses.length === 1 ? "licencia registrada" : "licencias registradas"} correctamente.`,
    )
  }

  const handleUpdateLicense = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedLicenseId === null) return

    const tieneClave = Boolean(draft.clave && draft.clave.trim().length > 0)
    const asignadaAObj = resolveAssignee(draft.asignadaAId)

    setLicenses((prev) =>
      prev.map((item) =>
        item.id === selectedLicenseId
          ? {
              ...item,
              software: draft.software.trim() || item.software,
              tieneClave,
              clave: tieneClave ? draft.clave.trim() : item.clave,
              proveedor: draft.proveedor.trim() || null,
              fechaCompra: draft.fechaCompra ? `${draft.fechaCompra}T00:00:00.000Z` : null,
              fechaVencimiento: draft.fechaVencimiento ? `${draft.fechaVencimiento}T00:00:00.000Z` : null,
              activa: String(draft.activa) === "true",
              asignadaA: asignadaAObj,
            }
          : item,
      ),
    )
    setIsEditDialogOpen(false)
    toast.success("Licencia actualizada correctamente.")
  }

  const handleDeleteLicense = () => {
    if (selectedLicenseId === null) return
    setLicenses((prev) => prev.filter((l) => l.id !== selectedLicenseId))
    setIsConfirmDeleteOpen(false)
    setIsEditDialogOpen(false)
    setIsDetailDialogOpen(false)
    toast.success("Licencia eliminada exitosamente.")
  }

  // Columnas para DataTable
  const columns: DataTableColumn<License>[] = [
    {
      key: "id",
      header: "ID",
      cellClassName: "border-b border-border/70 px-4 py-3 font-mono font-semibold text-foreground",
      render: (item) => `#${item.id}`,
    },
    {
      key: "software",
      header: "Software / Licencia",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[220px]",
      render: (item) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-4 text-primary" />
          </span>
          <div className="font-semibold text-foreground truncate max-w-xs">
            {item.software}
          </div>
        </div>
      ),
    },
    {
      key: "tieneClave",
      header: "Clave Secret",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (item) =>
        item.tieneClave ? (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
            <KeyRound className="size-3" />
            Con clave
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-slate-400/30 bg-slate-400/10 text-slate-500 font-medium"
          >
            Sin clave
          </Badge>
        ),
    },
    {
      key: "proveedor",
      header: "Proveedor",
      cellClassName: cellBase,
      render: (item) => item.proveedor ?? "—",
    },
    {
      key: "activa",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (item) =>
        item.activa ? (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            Activa
          </Badge>
        ) : (
          <Badge className="border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-400 font-medium">
            Inactiva
          </Badge>
        ),
    },
    {
      key: "asignadaA",
      header: "Asignada A",
      cellClassName: "border-b border-border/70 px-4 py-3 min-w-[180px]",
      render: (item) =>
        item.asignadaA ? (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground text-xs">
                {item.asignadaA.nombre}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {item.asignadaA.email}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground">Sin asignar</span>
        ),
    },
    {
      key: "fechaCompra",
      header: "Fecha Compra",
      cellClassName: "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground whitespace-nowrap",
      render: (item) => formatDate(item.fechaCompra),
    },
    {
      key: "fechaVencimiento",
      header: "Fecha Vencimiento",
      cellClassName: "border-b border-border/70 px-4 py-3 text-xs text-muted-foreground whitespace-nowrap",
      render: (item) => formatDate(item.fechaVencimiento),
    },
  ]

  // Secciones para DetailDialog
  const detailSections: DetailSection[] = selectedLicense
    ? [
        {
          title: "Información General del Software",
          color: "primary",
          fields: [
            { key: "id", label: "ID Licencia", value: `#${selectedLicense.id}` },
            { key: "software", label: "Nombre Software", value: selectedLicense.software },
            { key: "proveedor", label: "Proveedor", value: selectedLicense.proveedor ?? "No especificado" },
            {
              key: "tieneClave",
              label: "Clave Secreta",
              value:
                selectedLicense.tieneClave && selectedLicense.clave ? (
                  <div className="flex min-h-8 items-center gap-2">
                    <span className="break-all py-1 font-mono text-sm text-foreground">
                      {isDetailKeyVisible ? selectedLicense.clave : "••••-••••-••••"}
                    </span>
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={isDetailKeyVisible ? "Ocultar clave" : "Mostrar clave"}
                      aria-pressed={isDetailKeyVisible}
                      onClick={() => setIsDetailKeyVisible((current) => !current)}
                    >
                      {isDetailKeyVisible ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Copiar clave"
                      onClick={(e) =>
                        copyToClipboard(selectedLicense.clave!, "Clave de licencia", e)
                      }
                    >
                      <Copy aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-slate-400/30 bg-slate-400/10 text-slate-500"
                  >
                    Sin clave
                  </Badge>
                ),
            },
          ],
        },
        {
          title: "Estado y Asignación",
          color: "cyan",
          fields: [
            {
              key: "activa",
              label: "Estado Operativo",
              value: selectedLicense.activa ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-semibold">
                  Activa
                </Badge>
              ) : (
                <Badge className="border-slate-400/30 bg-slate-400/10 text-slate-500">
                  Inactiva
                </Badge>
              ),
            },
            {
              key: "asignadaNombre",
              label: "Usuario Asignado",
              value: selectedLicense.asignadaA ? selectedLicense.asignadaA.nombre : "Sin asignar",
            },
            {
              key: "asignadaEmail",
              label: "Correo Asignado",
              value: selectedLicense.asignadaA ? selectedLicense.asignadaA.email : "—",
            },
          ],
        },
        {
          title: "Vigencia y Fechas de Registro",
          color: "amber",
          fields: [
            { key: "fechaCompra", label: "Fecha de Compra", value: formatDate(selectedLicense.fechaCompra) },
            { key: "fechaVencimiento", label: "Fecha de Vencimiento", value: formatDate(selectedLicense.fechaVencimiento) },
          ],
        },
      ]
    : []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Inventario de Software"
        title="Gestión de Licencias"
        actions={
          <Button
            type="button"
            onClick={handleOpenAddDialog}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
          >
            <Plus className="size-4" />
            Agregar Licencia
          </Button>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por software, proveedor, usuario o ID (ej. 4 o #4)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm"
              />
            </div>

            {/* Filtro por Estado (Activa / Inactiva) */}
            <div className="relative">
              <select
                value={selectedActiva}
                onChange={(e) => {
                  setSelectedActiva(e.target.value as "ALL" | "true" | "false")
                  setCurrentPage(1)
                }}
                className="h-10 appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Filtro por Tiene Clave */}
            <div className="relative">
              <select
                value={selectedTieneClave}
                onChange={(e) => {
                  setSelectedTieneClave(e.target.value as "ALL" | "true" | "false")
                  setCurrentPage(1)
                }}
                className="h-10 appearance-none rounded-2xl border border-border/80 bg-background/80 pl-4 pr-9 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm cursor-pointer"
              >
                <option value="ALL">Todas las licencias</option>
                <option value="true">Con Clave</option>
                <option value="false">Sin Clave</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ArrowUpDown className="size-3.5 text-violet-700 dark:text-violet-200" />
            {filteredLicenses.length} licencias registradas
          </span>
        }
      />

      {/* Tabla de Licencias */}
      <DataTable<License>
        columns={columns}
        data={paginatedLicenses}
        rowKey={(license) => license.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredLicenses.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onRowDoubleClick={(license) => {
          setSelectedLicenseId(license.id)
          setIsDetailDialogOpen(true)
        }}
        onRowClick={(license) => setSelectedLicenseId(license.id)}
        selectedRowKey={selectedLicenseId}
        emptyMessage="No se encontraron licencias con los criterios de búsqueda seleccionados."
      />

      {/* Modal de Detalle */}
      {selectedLicense && (
        <DetailDialog
          open={isDetailDialogOpen}
          onOpenChange={(open) => {
            setIsDetailDialogOpen(open)
            if (!open) setIsDetailKeyVisible(false)
          }}
          title={selectedLicense.software}
          description={`Detalle de la licencia #${selectedLicense.id}`}
          icon={<KeyRound className="size-6 text-white" />}
          sections={detailSections}
          onEdit={() => handleOpenEditDialog(selectedLicense)}
        />
      )}

      {/* Modal de Creación */}
      <LicenseFormDialog
        open={isAddDialogOpen}
        draft={draft}
        mode="create"
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleCreateLicense}
        onImport={handleImportLicenses}
      />

      {/* Modal de Edición */}
      <LicenseFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        onOpenChange={setIsEditDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleUpdateLicense}
        onDelete={() => setIsConfirmDeleteOpen(true)}
      />

      {/* Diálogo de Confirmación de Borrado */}
      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        title="Eliminar licencia"
        itemName={selectedLicense?.software ?? "esta licencia"}
        description="¿Estás seguro de eliminar esta licencia del sistema? Esta acción no se puede deshacer."
        confirmLabel="Eliminar Licencia"
        onConfirm={handleDeleteLicense}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  )
}

export default LicensesPage
