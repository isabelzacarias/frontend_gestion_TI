import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowUpDown,
  CircleDot,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
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
import { LicenseFormDialog } from "@/features/licenses/components/LicenseFormDialog"
import {
  LicenseApiError,
  actualizarLicencia,
  crearLicencia,
  desactivarLicencia,
  listarTodasLasLicencias,
} from "@/features/licenses/services/license.service"
import type {
  DatosCreacionLicencia,
  DatosEdicionLicencia,
  License,
  LicenseFormDraft,
} from "@/features/licenses/types/license"
import {
  listarTodosLosUsuarios,
  type UsuarioLista,
} from "@/services/usuario.service"

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

const datePattern = /^\d{4}-\d{2}-\d{2}$/

const esFechaValida = (value: string): boolean => datePattern.test(value)

const createEmptyLicenseDraft = (): LicenseFormDraft => ({
  software: "",
  clave: "",
  proveedor: "",
  fechaCompra: new Date().toISOString().slice(0, 10),
  fechaVencimiento: "",
  asignadaAId: "",
  activa: true,
})

const toLicenseDraft = (item: License): LicenseFormDraft => ({
  software: item.software,
  clave: "",
  proveedor: item.proveedor ?? "",
  fechaCompra: item.fechaCompra ? item.fechaCompra.slice(0, 10) : "",
  fechaVencimiento: item.fechaVencimiento
    ? item.fechaVencimiento.slice(0, 10)
    : "",
  asignadaAId: item.asignadaA?.id ?? "",
  activa: item.activa,
})

const ITEMS_PER_PAGE = 10
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"

function mensajeDeError(error: unknown): string {
  if (error instanceof LicenseApiError) return error.message
  return "No se pudo completar la operación."
}

function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState("")
  const [activaSeleccionada, setActivaSeleccionada] = useState<string[]>([])
  const [claveSeleccionada, setClaveSeleccionada] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Modales
  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [draft, setDraft] = useState<LicenseFormDraft>(createEmptyLicenseDraft())

  const recargar = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelado = false

    async function cargarLicencias() {
      setIsLoading(true)

      try {
        const [licencias, usuariosActivos] = await Promise.all([
          listarTodasLasLicencias(),
          listarTodosLosUsuarios({ activo: true }).catch(
            () => [] as UsuarioLista[],
          ),
        ])
        if (cancelado) return
        setLicenses(licencias)
        setUsuarios(usuariosActivos)
      } catch (error) {
        if (cancelado) return
        toast.error(mensajeDeError(error))
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarLicencias()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

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
            (item.asignadaA?.email?.toLowerCase().includes(term) ?? false))

      const matchActiva =
        activaSeleccionada.length === 0 ||
        activaSeleccionada.includes(String(item.activa))

      const matchTieneClave =
        claveSeleccionada.length === 0 ||
        claveSeleccionada.includes(String(item.tieneClave))

      return matchSearch && matchActiva && matchTieneClave
    })
  }, [licenses, search, activaSeleccionada, claveSeleccionada])

  const hayFiltros =
    activaSeleccionada.length > 0 ||
    claveSeleccionada.length > 0 ||
    search.trim() !== ""

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "activa",
        label: "Estado",
        icon: CircleDot,
        options: [
          { value: "true", label: "Activas" },
          { value: "false", label: "Inactivas" },
        ],
      },
      {
        id: "tieneClave",
        label: "Clave",
        icon: KeyRound,
        options: [
          { value: "true", label: "Con clave" },
          { value: "false", label: "Sin clave" },
        ],
      },
    ],
    [],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({
      activa: activaSeleccionada,
      tieneClave: claveSeleccionada,
    }),
    [activaSeleccionada, claveSeleccionada],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "activa") {
      setActivaSeleccionada(values)
    } else if (dimensionId === "tieneClave") {
      setClaveSeleccionada(values)
    }
    setCurrentPage(1)
  }

  function borrarFacetas() {
    setActivaSeleccionada([])
    setClaveSeleccionada([])
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    borrarFacetas()
  }

  const totalPages = Math.max(1, Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedLicenses = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredLicenses.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredLicenses, activePage])

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

  const validarDraft = (): boolean => {
    if (!draft.software.trim()) {
      toast.error("El nombre del software es obligatorio.")
      return false
    }
    if (!esFechaValida(draft.fechaVencimiento)) {
      toast.error("La fecha de vencimiento debe tener formato AAAA-MM-DD.")
      return false
    }
    if (draft.fechaCompra && !esFechaValida(draft.fechaCompra)) {
      toast.error("La fecha de compra debe tener formato AAAA-MM-DD.")
      return false
    }
    return true
  }

  const handleCreateLicense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSaving || !validarDraft()) return

    const datos: DatosCreacionLicencia = {
      software: draft.software.trim(),
      clave: draft.clave.trim() ? draft.clave.trim() : null,
      proveedor: draft.proveedor.trim() ? draft.proveedor.trim() : null,
      fechaCompra: draft.fechaCompra ? draft.fechaCompra : null,
      fechaVencimiento: draft.fechaVencimiento,
      asignadaAId: draft.asignadaAId ? draft.asignadaAId : null,
    }

    setIsSaving(true)
    try {
      const creada = await crearLicencia(datos)
      if (String(draft.activa) === "false") {
        await actualizarLicencia(creada.id, { activa: false })
      }
      toast.success(`Licencia "${creada.software}" creada exitosamente.`)
      setIsAddDialogOpen(false)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleImportLicenses = async (records: LicenseFormDraft[]) => {
    if (records.length === 0 || isSaving) return

    setIsSaving(true)
    let exitos = 0
    const fallos: string[] = []

    for (const record of records) {
      const software = record.software.trim()
      if (!software || !esFechaValida(record.fechaVencimiento)) {
        fallos.push(software || "(sin nombre)")
        continue
      }

      const asignada = record.asignadaAId.trim()
      const usuarioId = asignada
        ? usuarios.find(
            (usuario) =>
              usuario.id.toLowerCase() === asignada.toLowerCase() ||
              usuario.nombre.toLowerCase() === asignada.toLowerCase() ||
              (usuario.email?.toLowerCase() ?? "") === asignada.toLowerCase(),
          )?.id ?? null
        : null

      try {
        const creada = await crearLicencia({
          software,
          clave: record.clave.trim() ? record.clave.trim() : null,
          proveedor: record.proveedor.trim() ? record.proveedor.trim() : null,
          fechaCompra: record.fechaCompra ? record.fechaCompra : null,
          fechaVencimiento: record.fechaVencimiento,
          asignadaAId: usuarioId,
        })
        if (String(record.activa) === "false") {
          await actualizarLicencia(creada.id, { activa: false })
        }
        exitos += 1
      } catch {
        fallos.push(software)
      }
    }

    setIsSaving(false)
    setIsAddDialogOpen(false)
    recargar()

    if (fallos.length === 0) {
      toast.success(
        `${exitos} ${exitos === 1 ? "licencia registrada" : "licencias registradas"} correctamente.`,
      )
    } else {
      toast.warning(
        `${exitos} registradas y ${fallos.length} con error: ${fallos.join(", ")}.`,
      )
    }
  }

  const handleUpdateLicense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedLicenseId === null || isSaving || !validarDraft()) return

    const datos: DatosEdicionLicencia = {
      software: draft.software.trim(),
      proveedor: draft.proveedor.trim() ? draft.proveedor.trim() : null,
      fechaCompra: draft.fechaCompra ? draft.fechaCompra : null,
      fechaVencimiento: draft.fechaVencimiento,
      asignadaAId: draft.asignadaAId ? draft.asignadaAId : null,
      activa: String(draft.activa) === "true",
    }
    if (draft.clave.trim()) {
      datos.clave = draft.clave.trim()
    }

    setIsSaving(true)
    try {
      await actualizarLicencia(selectedLicenseId, datos)
      toast.success("Licencia actualizada correctamente.")
      setIsEditDialogOpen(false)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReactivarLicense = async () => {
    if (selectedLicenseId === null || isSaving) return

    setIsSaving(true)
    try {
      await actualizarLicencia(selectedLicenseId, { activa: true })
      toast.success("Licencia reactivada correctamente.")
      setIsDetailDialogOpen(false)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLicense = async () => {
    if (selectedLicenseId === null || isSaving) return

    setIsSaving(true)
    try {
      await desactivarLicencia(selectedLicenseId)
      toast.success("Licencia desactivada correctamente.")
      setIsConfirmDeleteOpen(false)
      setIsEditDialogOpen(false)
      setIsDetailDialogOpen(false)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
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
                {item.asignadaA.email ?? "—"}
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
              value: selectedLicense.tieneClave ? (
                <div className="flex min-h-8 items-center gap-2">
                  <span className="break-all py-1 font-mono text-sm text-foreground">
                    ••••-••••-••••
                  </span>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    Cifrada en el servidor
                  </Badge>
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
              value: selectedLicense.asignadaA ? (selectedLicense.asignadaA.email ?? "—") : "—",
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Inventario de Software"
        title="Gestión de Licencias"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleOpenAddDialog}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
            >
              <Plus className="size-4" />
              Agregar Licencia
            </Button>
          </div>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
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
              ? `${filteredLicenses.length} de ${licenses.length} licencias`
              : `${filteredLicenses.length} licencias registradas`}
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
        emptyMessage={
          isLoading
            ? "Cargando licencias..."
            : "No se encontraron licencias con los criterios de búsqueda seleccionados."
        }
      />

      {/* Modal de Detalle */}
      {selectedLicense && (
        <DetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          title={selectedLicense.software}
          description={`Detalle de la licencia #${selectedLicense.id}`}
          icon={<KeyRound className="size-6 text-white" />}
          sections={detailSections}
          onEdit={
            selectedLicense.activa
              ? () => handleOpenEditDialog(selectedLicense)
              : () => void handleReactivarLicense()
          }
          editLabel={selectedLicense.activa ? "Editar" : "Reactivar"}
          editIcon={
            selectedLicense.activa ? undefined : (
              <RotateCcw aria-hidden="true" />
            )
          }
        />
      )}

      {/* Modal de Creación */}
      <LicenseFormDialog
        open={isAddDialogOpen}
        draft={draft}
        mode="create"
        usuarios={usuarios}
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleCreateLicense(event)}
        onImport={(records) => void handleImportLicenses(records)}
      />

      {/* Modal de Edición */}
      <LicenseFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        usuarios={usuarios}
        onOpenChange={setIsEditDialogOpen}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleUpdateLicense(event)}
        onDelete={() => setIsConfirmDeleteOpen(true)}
      />

      {/* Diálogo de Confirmación de Baja */}
      <ConfirmDeleteDialog
        open={isConfirmDeleteOpen}
        title="Desactivar licencia"
        itemName={selectedLicense?.software ?? "esta licencia"}
        description="La licencia pasará a estado inactivo (baja lógica). Podrás reactivarla más adelante."
        confirmLabel="Desactivar Licencia"
        onConfirm={() => void handleDeleteLicense()}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  )
}

export default LicensesPage
