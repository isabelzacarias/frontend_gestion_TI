import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ArrowUpDown,
  Building2,
  CircleDot,
  Download,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetOption,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import {
  AssetFormDialog,
  type AssetFormDraft,
} from "@/features/inventory/components/AssetFormDialog"
import {
  ImportResultDialog,
  type ImportResultRow,
} from "@/components/ui/import-result-dialog"
import { type InventoryItem } from "@/features/inventory/data/inventoryData"
import {
  downloadAssetImportErrors,
  transformDraftsToImportRows,
} from "@/features/inventory/utils/asset-import"
import { exportActivosToCsv } from "@/features/inventory/utils/asset-export"
import {
  ActivoApiError,
  confirmarImportacionActivos,
  listarTodosLosActivos,
  validarImportacionActivos,
} from "@/services/activo.service"
import type {
  ActivoImportRow,
  ActivoResumen,
  ErrorPeticion,
  EstadoActivo,
  FilaConfirmacionImportacion,
  FilaValidacionImportacion,
} from "@/types/activo"

interface ImportDialogState {
  title: string
  description: string
  total: number
  okCount: number
  errorCount: number
  okLabel: string
  errorLabel: string
  rows: ImportResultRow[]
  primaryAction?: { label: string; onClick: () => void }
  onDownloadErrors?: () => void
}

function toValidationRows(
  filas: FilaValidacionImportacion[],
): ImportResultRow[] {
  return filas
    .filter((fila) => !fila.valido || fila.advertencias.length > 0)
    .map((fila) => ({
      fila: fila.fila,
      status: fila.valido ? "warning" : "error",
      mensajes: fila.valido ? fila.advertencias : fila.errores,
    }))
}

function toConfirmationRows(
  filas: FilaConfirmacionImportacion[],
): ImportResultRow[] {
  return filas
    .filter((fila) => !fila.creado || fila.advertencias.length > 0)
    .map((fila) => ({
      fila: fila.fila,
      status: fila.creado ? "warning" : "error",
      mensajes: fila.creado ? fila.advertencias : fila.errores,
    }))
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ActivoApiError) {
    if (error.status === 403) {
      return "No tienes permiso para importar activos (activos:crear)."
    }

    const campos = error.errors
      .map((detalle) =>
        typeof detalle === "object" && detalle !== null && "campo" in detalle
          ? String((detalle as ErrorPeticion).campo)
          : "",
      )
      .filter((campo) => campo.length > 0)

    return campos.length > 0
      ? `${error.message} (campos: ${campos.join(", ")})`
      : error.message
  }

  if (error instanceof Error) return error.message

  return "No se pudo completar la importación masiva."
}

const stateClasses: Record<InventoryItem["estado"], string> = {
  EN_USO: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  EN_ALMACEN: "border border-sky-500/30 bg-sky-500/10 text-sky-600",
  EN_MANTENIMIENTO:
    "border border-amber-500/30 bg-amber-500/10 text-amber-600",
  DE_BAJA: "border border-rose-500/30 bg-rose-500/10 text-rose-600",
}

const generalClasses: Record<InventoryItem["estadoGeneral"], string> = {
  Excelente: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  Bueno: "border border-violet-500/30 bg-violet-500/10 text-violet-600",
  Regular: "border border-amber-500/30 bg-amber-500/10 text-amber-600",
  Crítico: "border border-rose-500/30 bg-rose-500/10 text-rose-600",
}

const stateLabels: Record<InventoryItem["estado"], string> = {
  EN_USO: "En uso",
  EN_ALMACEN: "En almacén",
  EN_MANTENIMIENTO: "En mantenimiento",
  DE_BAJA: "De baja",
}

const ITEMS_PER_PAGE = 10

const ESTADOS_ACTIVO: EstadoActivo[] = [
  "EN_USO",
  "EN_ALMACEN",
  "EN_MANTENIMIENTO",
  "DE_BAJA",
]

const SUCURSALES = ["PLAYA", "CANCUN"]

function toActivoResumen(item: InventoryItem): ActivoResumen {
  const clean = (value: string) => (value === "—" ? null : value)
  return {
    id: item.id,
    claveActivo: item.claveActivo,
    cb23: clean(item.cb23),
    tipo: item.tipo,
    marca: clean(item.marca),
    modelo: clean(item.modelo),
    numeroSerie: clean(item.numeroSerie),
    sucursal: clean(item.sucursal),
    estado: item.estado,
    estadoGeneral: clean(item.estadoGeneral),
    nombreRed: clean(item.nombreRed),
    responsable: item.responsable.id
      ? {
          id: item.responsable.id,
          nombre: item.responsable.nombre,
          email: item.responsable.email || null,
        }
      : null,
  }
}

const createEmptyAssetDraft = (): AssetFormDraft => ({
  cb23: "",
  tipo: "Laptop",
  marca: "",
  modelo: "",
  numeroSerie: "",
  sucursal: "PLAYA",
  estado: "EN_ALMACEN",
  estadoGeneral: "Bueno",
  nombreRed: "",
  responsableNombre: "",
  responsableEmail: "",
})

const toAssetDraft = (item: InventoryItem): AssetFormDraft => ({
  cb23: item.cb23,
  tipo: item.tipo,
  marca: item.marca,
  modelo: item.modelo,
  numeroSerie: item.numeroSerie,
  sucursal: item.sucursal,
  estado: item.estado,
  estadoGeneral: item.estadoGeneral,
  nombreRed: item.nombreRed,
  responsableNombre: item.responsable.nombre,
  responsableEmail: item.responsable.email,
})

const createInventoryItem = (draft: AssetFormDraft, id: number): InventoryItem => ({
  id,
  claveActivo: null,
  cb23: draft.cb23.trim() || `CB-${id.toString().slice(-6)}`,
  tipo: draft.tipo,
  marca: draft.marca.trim() || "Sin marca",
  modelo: draft.modelo.trim() || "Sin modelo",
  numeroSerie: draft.numeroSerie.trim() || "N/A",
  sucursal: draft.sucursal,
  estado: draft.estado,
  estadoGeneral: draft.estadoGeneral,
  nombreRed: draft.nombreRed.trim() || "SIN_RED",
  responsable: {
    id: `USR-${id.toString().slice(-4)}`,
    nombre: draft.responsableNombre.trim() || "Sin responsable",
    email: draft.responsableEmail.trim() || "sin.responsable@empresa.com",
  },
})

/* ──────────────────────────────────────────────
 * Definición declarativa de las columnas
 * ────────────────────────────────────────────── */
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const generalFallbackClass =
  "border border-border/60 bg-muted text-muted-foreground"

function toInventoryItem(activo: ActivoResumen): InventoryItem {
  return {
    id: activo.id,
    claveActivo: activo.claveActivo,
    cb23: activo.cb23 ?? "—",
    tipo: activo.tipo,
    marca: activo.marca ?? "—",
    modelo: activo.modelo ?? "—",
    numeroSerie: activo.numeroSerie ?? "—",
    sucursal: activo.sucursal ?? "—",
    estado: activo.estado,
    estadoGeneral: activo.estadoGeneral ?? "—",
    nombreRed: activo.nombreRed ?? "—",
    responsable: {
      id: activo.responsable?.id ?? "",
      nombre: activo.responsable?.nombre ?? "Sin responsable",
      email: activo.responsable?.email ?? "",
    },
  }
}

const columns: DataTableColumn<InventoryItem>[] = [
  {
    key: "id",
    header: "ID",
    cellClassName: "border-b border-border/70 px-4 py-3 font-semibold text-foreground",
    render: (item) => item.id,
  },
  { key: "cb23", header: "CB23", cellClassName: cellBase, render: (item) => item.cb23 },
  { key: "tipo", header: "Tipo", cellClassName: cellBase, render: (item) => item.tipo },
  { key: "marca", header: "Marca", cellClassName: cellBase, render: (item) => item.marca },
  { key: "modelo", header: "Modelo", cellClassName: cellBase, render: (item) => item.modelo },
  { key: "numeroSerie", header: "No. serie", cellClassName: cellBase, render: (item) => item.numeroSerie },
  { key: "sucursal", header: "Sucursal", cellClassName: cellBase, render: (item) => item.sucursal },
  {
    key: "estado",
    header: "Estado",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => <Badge className={stateClasses[item.estado]}>{item.estado}</Badge>,
  },
  {
    key: "estadoGeneral",
    header: "General",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <Badge
        className={generalClasses[item.estadoGeneral] ?? generalFallbackClass}
      >
        {item.estadoGeneral}
      </Badge>
    ),
  },
  { key: "nombreRed", header: "Red", cellClassName: cellBase, render: (item) => item.nombreRed },
  {
    key: "responsable",
    header: "Responsable",
    cellClassName: "border-b border-border/70 px-4 py-3",
    render: (item) => (
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-[rgba(6,182,212,0.12)] text-primary">
          <UserRound className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">
            {item.responsable.nombre}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {item.responsable.email}
          </div>
        </div>
      </div>
    ),
  },
]

function InventoryPage() {
  const [activos, setActivos] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([])
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<
    string[]
  >([])
  const [currentPage, setCurrentPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
  const [draft, setDraft] = useState(createEmptyAssetDraft())
  const [importDialog, setImportDialog] = useState<ImportDialogState | null>(null)
  const selectedAsset = activos.find((item) => item.id === selectedAssetId)
  const detailSections: DetailSection[] = selectedAsset
    ? [
        {
          title: "Identificación",
          color: "primary",
          fields: [
            { key: "id", label: "ID", value: selectedAsset.id },
            { key: "cb23", label: "CB23", value: selectedAsset.cb23 },
           
            { key: "tipo", label: "Tipo", value: selectedAsset.tipo },
            { key: "marca", label: "Marca", value: selectedAsset.marca },
            { key: "modelo", label: "Modelo", value: selectedAsset.modelo },
            {
              key: "numeroSerie",
              label: "Número de serie",
              value: selectedAsset.numeroSerie,
            },
          ],
        },
        {
          title: "Ubicación y estado",
          color: "cyan",
          fields: [
            { key: "sucursal", label: "Sucursal", value: selectedAsset.sucursal },
            {
              key: "estado",
              label: "Estado",
              value: stateLabels[selectedAsset.estado],
            },
            {
              key: "estadoGeneral",
              label: "Estado general",
              value: selectedAsset.estadoGeneral,
            },
            { key: "nombreRed", label: "Red", value: selectedAsset.nombreRed },
          ],
        },
        {
          title: "Responsable",
          color: "violet",
          fields: [
            {
              key: "responsableNombre",
              label: "Nombre completo",
              value: selectedAsset.responsable.nombre,
            },
            {
              key: "responsableEmail",
              label: "Correo electrónico",
              value: selectedAsset.responsable.email,
            },
          ],
        },
      ]
    : []

  const filtros = useMemo(
    () => ({
      estados: estadosSeleccionados,
      sucursales: sucursalesSeleccionadas,
      texto: debouncedSearch,
    }),
    [estadosSeleccionados, sucursalesSeleccionadas, debouncedSearch],
  )

  const activosFiltrados = useMemo(() => {
    const termino = filtros.texto.trim().toLowerCase()

    return activos.filter((item) => {
      if (filtros.estados.length > 0 && !filtros.estados.includes(item.estado)) {
        return false
      }

      if (
        filtros.sucursales.length > 0 &&
        !filtros.sucursales.includes(item.sucursal)
      ) {
        return false
      }

      if (termino) {
        const coincide = [
          item.cb23,
          item.numeroSerie,
          item.marca,
          item.modelo,
          item.nombreRed,
          item.tipo,
        ].some((valor) => valor.toLowerCase().includes(termino))

        if (!coincide) return false
      }

      return true
    })
  }, [activos, filtros])

  const hayFiltros =
    filtros.estados.length > 0 ||
    filtros.sucursales.length > 0 ||
    filtros.texto !== ""

  const totalFiltrados = activosFiltrados.length
  const totalPages = Math.max(1, Math.ceil(totalFiltrados / ITEMS_PER_PAGE))
  const paginaActual = Math.min(currentPage, totalPages)

  const activosPagina = useMemo(
    () =>
      activosFiltrados.slice(
        (paginaActual - 1) * ITEMS_PER_PAGE,
        paginaActual * ITEMS_PER_PAGE,
      ),
    [activosFiltrados, paginaActual],
  )

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      {
        id: "estados",
        label: "Estado",
        icon: CircleDot,
        options: ESTADOS_ACTIVO.map<FacetOption>((value) => ({
          value,
          label: stateLabels[value],
        })),
      },
      {
        id: "sucursales",
        label: "Sucursal",
        icon: Building2,
        options: SUCURSALES.map<FacetOption>((value) => ({
          value,
          label: value,
        })),
      },
    ],
    [],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({
      estados: estadosSeleccionados,
      sucursales: sucursalesSeleccionadas,
    }),
    [estadosSeleccionados, sucursalesSeleccionadas],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "estados") {
      setEstadosSeleccionados(values)
    } else if (dimensionId === "sucursales") {
      setSucursalesSeleccionadas(values)
    }
    setCurrentPage(1)
  }

  function borrarFacetas() {
    setEstadosSeleccionados([])
    setSucursalesSeleccionadas([])
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearch("")
    setDebouncedSearch("")
    borrarFacetas()
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelado = false

    async function cargarActivos() {
      setLoading(true)
      setLoadError(null)

      try {
        const lista = await listarTodosLosActivos()
        if (cancelado) return
        setActivos(lista.map(toInventoryItem))
      } catch (error) {
        if (cancelado) return
        setLoadError(getApiErrorMessage(error))
        setActivos([])
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargarActivos()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  const recargar = () => setReloadKey((key) => key + 1)

  const handlePageChange = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  const handleExport = () => {
    if (activosFiltrados.length === 0) {
      toast.info("No hay registros para exportar con los filtros actuales.")
      return
    }

    exportActivosToCsv(activosFiltrados.map(toActivoResumen))
    toast.success(
      `${activosFiltrados.length} registro(s) exportados a CSV.`,
    )
  }

  const handleDraftChange = <K extends keyof AssetFormDraft>(field: K, value: AssetFormDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const confirmarLote = async (
    records: AssetFormDraft[],
    filas: ActivoImportRow[],
  ) => {
    const toastId = toast.loading(`Registrando ${filas.length} activo(s)...`)

    try {
      const confirmacion = await confirmarImportacionActivos(filas)

      setDraft(createEmptyAssetDraft())
      setIsAddDialogOpen(false)
      setCurrentPage(1)
      recargar()

      if (confirmacion.resumen.creadas > 0) {
        toast.success(
          `${confirmacion.resumen.creadas} activo(s) registrados${
            confirmacion.resumen.rechazadas > 0
              ? `; ${confirmacion.resumen.rechazadas} rechazados`
              : ""
          }.`,
          { id: toastId },
        )
      } else {
        toast.error("No se registró ningún activo del lote.", { id: toastId })
      }

      setImportDialog({
        title: "Resultado de la importación",
        description:
          confirmacion.resumen.rechazadas > 0
            ? "Algunas filas no se pudieron registrar. Revisa el detalle por fila."
            : "Todas las filas se registraron correctamente.",
        total: confirmacion.resumen.total,
        okCount: confirmacion.resumen.creadas,
        errorCount: confirmacion.resumen.rechazadas,
        okLabel: "registradas",
        errorLabel: "rechazadas",
        rows: toConfirmationRows(confirmacion.filas),
        onDownloadErrors:
          confirmacion.resumen.rechazadas > 0
            ? () => downloadAssetImportErrors(records, confirmacion.filas)
            : undefined,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error), { id: toastId })
    }
  }

  const handleImportAssets = async (records: AssetFormDraft[]) => {
    if (records.length === 0) return

    const toastId = toast.loading(`Validando ${records.length} activo(s)...`)

    try {
      const filas = transformDraftsToImportRows(records)
      const validacion = await validarImportacionActivos(filas)
      toast.dismiss(toastId)

      if (validacion.resumen.invalidas > 0) {
        setImportDialog({
          title: "Revisión del lote",
          description:
            "Hay filas con errores. Puedes importar solo las válidas o cerrar para corregir el archivo.",
          total: validacion.resumen.total,
          okCount: validacion.resumen.validas,
          errorCount: validacion.resumen.invalidas,
          okLabel: "válidas",
          errorLabel: "con errores",
          rows: toValidationRows(validacion.filas),
          onDownloadErrors: () =>
            downloadAssetImportErrors(records, validacion.filas),
          primaryAction: {
            label: `Importar ${validacion.resumen.validas} válida(s)`,
            onClick: () => {
              setImportDialog(null)
              void confirmarLote(records, filas)
            },
          },
        })
        return
      }

      await confirmarLote(records, filas)
    } catch (error) {
      toast.error(getApiErrorMessage(error), { id: toastId })
    }
  }

  const handleCreateAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextItem = createInventoryItem(draft, Date.now())

    setActivos((current) => [nextItem, ...current])
    setDraft(createEmptyAssetDraft())
    setIsAddDialogOpen(false)
    setCurrentPage(1)
  }

  const handleSelectAsset = (item: InventoryItem) => {
    setSelectedAssetId(item.id)
  }

  const handleOpenEditDialog = (item: InventoryItem) => {
    setSelectedAssetId(item.id)
    setDraft(toAssetDraft(item))
    setIsDetailDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleOpenDetails = (item: InventoryItem) => {
    setSelectedAssetId(item.id)
    setIsDetailDialogOpen(true)
  }

  const handleUpdateAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedAssetId === null) return

    setActivos((current) =>
      current.map((item) =>
        item.id === selectedAssetId
          ? {
              ...item,
              cb23: draft.cb23.trim() || item.cb23,
              tipo: draft.tipo,
              marca: draft.marca.trim() || item.marca,
              modelo: draft.modelo.trim() || item.modelo,
              numeroSerie: draft.numeroSerie.trim() || item.numeroSerie,
              sucursal: draft.sucursal,
              estado: draft.estado,
              estadoGeneral: draft.estadoGeneral,
              nombreRed: draft.nombreRed.trim() || item.nombreRed,
              responsable: {
                ...item.responsable,
                nombre: draft.responsableNombre.trim() || item.responsable.nombre,
                email: draft.responsableEmail.trim() || item.responsable.email,
              },
            }
          : item,
      ),
    )

    setDraft(createEmptyAssetDraft())
    setSelectedAssetId(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteAsset = () => {
    if (selectedAssetId === null) return

    setActivos((current) => current.filter((item) => item.id !== selectedAssetId))
    setDraft(createEmptyAssetDraft())
    setSelectedAssetId(null)
    setIsEditDialogOpen(false)
    setCurrentPage(1)
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Inventario TI"
        title="Consulta de activos"
        actions={
          <>
            <Button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.05)] backdrop-blur-md hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-400/30 dark:bg-slate-900/70 dark:text-violet-100 dark:hover:bg-slate-800/90"
            >
              <Download className="size-4" />
              Exportar
            </Button>

            <Button
              type="button"
              onClick={() => setIsAddDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
            >
              <Plus className="size-4" />
              Agregar Activo
            </Button>
          </>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por CB23, serie, marca, modelo o red..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-2xl border border-border/80 bg-background/80 pl-10 pr-4 text-xs font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Buscar inventario"
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
            {loading
              ? "Cargando..."
              : (loadError ??
                (hayFiltros
                  ? `${totalFiltrados} de ${activos.length} registros`
                  : `${activos.length} registros`))}
          </span>
        }
      />

      <DetailDialog
        open={isDetailDialogOpen && selectedAsset !== undefined}
        title={selectedAsset ? `${selectedAsset.tipo} - ${selectedAsset.cb23}` : "Detalle del activo"}
        description="Información del equipo registrado en el inventario TI."
        icon={<UserRound aria-hidden="true" className="size-5" />}
        sections={detailSections}
        onOpenChange={setIsDetailDialogOpen}
        onEdit={() => {
          if (selectedAsset) handleOpenEditDialog(selectedAsset)
        }}
      />

      <AssetFormDialog
        open={isAddDialogOpen}
        draft={draft}
        onOpenChange={setIsAddDialogOpen}
        onChange={handleDraftChange}
        onSubmit={handleCreateAsset}
        onImport={handleImportAssets}
      />

      <AssetFormDialog
        open={isEditDialogOpen}
        draft={draft}
        mode="edit"
        onOpenChange={(nextOpen) => {
          setIsEditDialogOpen(nextOpen)
          if (!nextOpen) {
            setSelectedAssetId(null)
            setDraft(createEmptyAssetDraft())
          }
        }}
        onChange={handleDraftChange}
        onSubmit={handleUpdateAsset}
        onDelete={handleDeleteAsset}
      />

      {importDialog && (
        <ImportResultDialog
          open
          title={importDialog.title}
          description={importDialog.description}
          total={importDialog.total}
          okCount={importDialog.okCount}
          errorCount={importDialog.errorCount}
          okLabel={importDialog.okLabel}
          errorLabel={importDialog.errorLabel}
          rows={importDialog.rows}
          primaryAction={importDialog.primaryAction}
          onDownloadErrors={importDialog.onDownloadErrors}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setImportDialog(null)
          }}
        />
      )}

      <DataTable<InventoryItem>
        columns={columns}
        data={activosPagina}
        rowKey={(item) => item.id}
        page={paginaActual}
        totalPages={totalPages}
        totalFiltered={totalFiltrados}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onRowClick={handleSelectAsset}
        onRowDoubleClick={handleOpenDetails}
        selectedRowKey={selectedAssetId}
        emptyMessage={
          loading
            ? "Cargando activos..."
            : (loadError ?? (hayFiltros ? "Sin coincidencias" : "Sin resultados"))
        }
      />
    </div>
  )
}

export default InventoryPage
