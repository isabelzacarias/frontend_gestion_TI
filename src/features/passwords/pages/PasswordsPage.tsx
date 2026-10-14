import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowUpDown,
  Building2,
  CircleDot,
  Cloud,
  Code2,
  Database,
  Download,
  KeyRound,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Server,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { FacetedFilter } from "@/components/ui/faceted-filter"
import type {
  FacetDimension,
  FacetSelections,
} from "@/components/ui/faceted-filter"
import CredentialDialog from "@/features/passwords/components/CredentialDialog"
import type { CredentialFormMode } from "@/features/passwords/components/CredentialDialog"
import {
  SecretoApiError,
  actualizarSecreto,
  confirmarImportacionSecretos,
  crearSecreto,
  desactivarSecreto,
  listarTodosLosSecretos,
  revelarPasswordSecreto,
  validarImportacionSecretos,
} from "@/features/passwords/services/secreto.service"
import type {
  Credential,
  CredencialImportRow,
  CredentialDraft,
  DatosEdicionSecreto,
  FilaConfirmacionImportacionSecretos,
  FilaValidacionImportacionSecretos,
} from "@/features/passwords/types/credential"
import {
  downloadCredentialImportErrors,
  transformDraftsToImportRows,
} from "@/features/passwords/utils/credential-import"
import {
  ImportResultDialog,
  type ImportResultRow,
} from "@/components/ui/import-result-dialog"
import { downloadCsv } from "@/lib/csv"

const ITEMS_PER_PAGE = 10

function getCredentialIcon(tipo: string | null): LucideIcon {
  const value = (tipo ?? "").toLowerCase()
  if (value.includes("cloud") || value.includes("nube")) return Cloud
  if (value.includes("base") || value.includes("dato")) return Database
  if (value.includes("desarrollo") || value.includes("dev") || value.includes("git")) {
    return Code2
  }
  if (value.includes("email") || value.includes("correo")) return Mail
  if (value.includes("infra") || value.includes("servidor") || value.includes("server")) {
    return Server
  }
  if (value.includes("corp")) return Building2
  return KeyRound
}

const createEmptyCredentialDraft = (): CredentialDraft => ({
  nombre: "",
  tipo: "",
  usuario: "",
  password: "",
  comentario: "",
})

const toCredentialDraft = (credential: Credential): CredentialDraft => ({
  nombre: credential.nombre ?? "",
  tipo: credential.tipo ?? "",
  usuario: credential.usuario ?? "",
  password: "",
  comentario: credential.comentario ?? "",
})

function mensajeDeError(error: unknown): string {
  if (error instanceof SecretoApiError) return error.message
  return "No se pudo completar la operación."
}

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
  filas: FilaValidacionImportacionSecretos[],
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
  filas: FilaConfirmacionImportacionSecretos[],
): ImportResultRow[] {
  return filas
    .filter((fila) => !fila.creado || fila.advertencias.length > 0)
    .map((fila) => ({
      fila: fila.fila,
      status: fila.creado ? "warning" : "error",
      mensajes: fila.creado ? fila.advertencias : fila.errores,
    }))
}

function getImportErrorMessage(error: unknown): string {
  if (error instanceof SecretoApiError) {
    if (error.status === 403) {
      return "No tienes permiso para importar secretos (secretos:importar)."
    }
    return error.message
  }
  return "No se pudo completar la importación masiva."
}

function PasswordsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [searchTerm, setSearchTerm] = useState("")
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string[]>([])
  const [activoSeleccionado, setActivoSeleccionado] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedCredentialId, setSelectedCredentialId] = useState<number | null>(null)
  const [draft, setDraft] = useState<CredentialDraft>(createEmptyCredentialDraft())
  const [dialogMode, setDialogMode] = useState<CredentialFormMode | null>(null)
  const [importDialog, setImportDialog] = useState<ImportDialogState | null>(null)

  const recargar = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelado = false

    async function cargarCredenciales() {
      setIsLoading(true)

      try {
        const secretos = await listarTodosLosSecretos()
        if (cancelado) return
        setCredentials(secretos)
      } catch (error) {
        if (cancelado) return
        toast.error(mensajeDeError(error))
      } finally {
        if (!cancelado) setIsLoading(false)
      }
    }

    void cargarCredenciales()

    return () => {
      cancelado = true
    }
  }, [reloadKey])

  const selectedCredential = useMemo(
    () => credentials.find((item) => item.id === selectedCredentialId) ?? null,
    [credentials, selectedCredentialId],
  )

  const tipoOptions = useMemo(() => {
    const seen = new Map<string, string>()
    credentials.forEach((credential) => {
      const tipo = credential.tipo?.trim()
      if (tipo && !seen.has(tipo.toLowerCase())) seen.set(tipo.toLowerCase(), tipo)
    })
    return [...seen.values()]
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((tipo) => ({ value: tipo, label: tipo }))
  }, [credentials])

  const filteredCredentials = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const hasTerm = term.length > 0
    const idTerm = term.replace(/^#/, "")
    const isIdSearch = term.startsWith("#") || /^\d+$/.test(term)

    return credentials.filter((credential) => {
      const matchSearch =
        !hasTerm ||
        (isIdSearch
          ? idTerm === "" || String(credential.id).includes(idTerm)
          : [credential.nombre, credential.tipo, credential.usuario, credential.comentario].some(
              (value) => (value ?? "").toLowerCase().includes(term),
            ))

      const matchTipo =
        tipoSeleccionado.length === 0 ||
        tipoSeleccionado.includes(credential.tipo ?? "")

      const matchActivo =
        activoSeleccionado.length === 0 ||
        activoSeleccionado.includes(String(credential.activo))

      return matchSearch && matchTipo && matchActivo
    })
  }, [credentials, searchTerm, tipoSeleccionado, activoSeleccionado])

  const hayFiltros =
    tipoSeleccionado.length > 0 ||
    activoSeleccionado.length > 0 ||
    searchTerm.trim() !== ""

  const facetDimensions = useMemo<FacetDimension[]>(
    () => [
      { id: "tipo", label: "Tipo", icon: Tag, options: tipoOptions },
      {
        id: "activo",
        label: "Estado",
        icon: CircleDot,
        options: [
          { value: "true", label: "Activas" },
          { value: "false", label: "Inactivas" },
        ],
      },
    ],
    [tipoOptions],
  )

  const facetSelecciones = useMemo<FacetSelections>(
    () => ({
      tipo: tipoSeleccionado,
      activo: activoSeleccionado,
    }),
    [tipoSeleccionado, activoSeleccionado],
  )

  function handleFacetChange(dimensionId: string, values: string[]) {
    if (dimensionId === "tipo") {
      setTipoSeleccionado(values)
    } else if (dimensionId === "activo") {
      setActivoSeleccionado(values)
    }
    setCurrentPage(1)
  }

  function borrarFacetas() {
    setTipoSeleccionado([])
    setActivoSeleccionado([])
    setCurrentPage(1)
  }

  function limpiarFiltros() {
    setSearchTerm("")
    borrarFacetas()
  }

  const totalPages = Math.max(1, Math.ceil(filteredCredentials.length / ITEMS_PER_PAGE))
  const activePage = Math.min(currentPage, totalPages)
  const paginatedCredentials = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE
    return filteredCredentials.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCredentials, activePage])

  const columns: DataTableColumn<Credential>[] = [
    {
      key: "nombre",
      header: "Nombre",
      cellClassName: "border-b border-border/70 px-4 py-3 font-semibold text-foreground",
      render: (credential) => {
        const Icon = getCredentialIcon(credential.tipo)

        return (
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="text-base font-semibold text-foreground">
              {credential.nombre ?? "Sin nombre"}
            </span>
          </div>
        )
      },
    },
    {
      key: "tipo",
      header: "Tipo",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (credential) => (
        <Badge variant="outline" className="px-2.5 py-1 text-sm font-medium">
          {credential.tipo ?? "Sin tipo"}
        </Badge>
      ),
    },
    {
      key: "usuario",
      header: "Usuario",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-muted-foreground",
      render: (credential) => credential.usuario ?? "—",
    },
    {
      key: "password",
      header: "Contraseña",
      cellClassName: "border-b border-border/70 px-4 py-3 font-mono text-sm text-muted-foreground",
      render: () => "••••••••••••",
    },
    {
      key: "activo",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (credential) =>
        credential.activo ? (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">
            Activa
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-slate-400/30 bg-slate-400/10 font-medium text-slate-600 dark:text-slate-400"
          >
            Inactiva
          </Badge>
        ),
    },
  ]

  function changeSearch(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function handleDraftChange<K extends keyof CredentialDraft>(field: K, value: CredentialDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function openCreateDialog() {
    setDraft(createEmptyCredentialDraft())
    setSelectedCredentialId(null)
    setDialogMode("create")
  }

  function openViewDialog(credential: Credential) {
    setSelectedCredentialId(credential.id)
    setDraft(toCredentialDraft(credential))
    setDialogMode("view")
  }

  function startEditing() {
    if (selectedCredential) {
      setDraft(toCredentialDraft(selectedCredential))
    }
    setDialogMode("edit")
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setDraft(createEmptyCredentialDraft())
      setSelectedCredentialId(null)
      setDialogMode(null)
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const nombre = draft.nombre.trim()
    if (!nombre) {
      toast.error("El nombre es obligatorio.")
      return
    }

    setIsSaving(true)
    try {
      const creada = await crearSecreto({
        nombre,
        tipo: draft.tipo.trim() || null,
        usuario: draft.usuario.trim() || null,
        password: draft.password,
        comentario: draft.comentario.trim() || null,
      })
      toast.success(`Credencial "${creada.nombre ?? nombre}" creada exitosamente.`)
      setDraft(createEmptyCredentialDraft())
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
    if (selectedCredentialId === null || isSaving) return

    const nombre = draft.nombre.trim()
    if (!nombre) {
      toast.error("El nombre es obligatorio.")
      return
    }

    const datos: DatosEdicionSecreto = {
      nombre,
      tipo: draft.tipo.trim() || null,
      usuario: draft.usuario.trim() || null,
      comentario: draft.comentario.trim() || null,
    }
    if (draft.password.trim()) {
      datos.password = draft.password
    }

    setIsSaving(true)
    try {
      await actualizarSecreto(selectedCredentialId, datos)
      toast.success("Credencial actualizada correctamente.")
      setDraft(createEmptyCredentialDraft())
      setSelectedCredentialId(null)
      setDialogMode(null)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmarLote = async (
    records: CredentialDraft[],
    filas: CredencialImportRow[],
  ) => {
    const toastId = toast.loading(`Registrando ${filas.length} credencial(es)...`)

    try {
      const confirmacion = await confirmarImportacionSecretos(filas)

      setDraft(createEmptyCredentialDraft())
      setDialogMode(null)
      setCurrentPage(1)
      recargar()

      if (confirmacion.resumen.creadas > 0) {
        toast.success(
          `${confirmacion.resumen.creadas} credencial(es) registradas${
            confirmacion.resumen.rechazadas > 0
              ? `; ${confirmacion.resumen.rechazadas} rechazadas`
              : ""
          }.`,
          { id: toastId },
        )
      } else {
        toast.error("No se registró ninguna credencial del lote.", {
          id: toastId,
        })
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
            ? () => downloadCredentialImportErrors(records, confirmacion.filas)
            : undefined,
      })
    } catch (error) {
      toast.error(getImportErrorMessage(error), { id: toastId })
    }
  }

  async function importCredentials(records: CredentialDraft[]) {
    if (records.length === 0 || isSaving) return

    const toastId = toast.loading(`Validando ${records.length} credencial(es)...`)

    try {
      const filas = transformDraftsToImportRows(records)
      const validacion = await validarImportacionSecretos(filas)
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
            downloadCredentialImportErrors(records, validacion.filas),
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
      toast.error(getImportErrorMessage(error), { id: toastId })
    }
  }

  async function deactivateCredential() {
    if (selectedCredentialId === null || isSaving) return

    setIsSaving(true)
    try {
      await desactivarSecreto(selectedCredentialId)
      toast.success("Credencial desactivada correctamente.")
      setDraft(createEmptyCredentialDraft())
      setSelectedCredentialId(null)
      setDialogMode(null)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function reactivarCredential() {
    if (selectedCredentialId === null || isSaving) return

    setIsSaving(true)
    try {
      await actualizarSecreto(selectedCredentialId, { activo: true })
      toast.success("Credencial reactivada correctamente.")
      setDialogMode(null)
      recargar()
    } catch (error) {
      toast.error(mensajeDeError(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function revealPassword(): Promise<string> {
    if (selectedCredentialId === null) {
      throw new SecretoApiError("No hay credencial seleccionada.", [])
    }
    const { password } = await revelarPasswordSecreto(selectedCredentialId)
    return password
  }

  function handleExport() {
    const header = ["ID", "Nombre", "Tipo", "Usuario", "Comentario", "Estado"]
    const rows = filteredCredentials.map((credential) => [
      String(credential.id),
      credential.nombre ?? "",
      credential.tipo ?? "",
      credential.usuario ?? "",
      credential.comentario ?? "",
      credential.activo ? "Activa" : "Inactiva",
    ])

    downloadCsv(header, rows, "credenciales.csv")
    toast.success("Credenciales exportadas a CSV (sin contraseñas).")
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Seguridad TI"
        title="Contraseñas"
        actions={
          <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
            >
              <Plus className="size-4" />
              Agregar Contraseña
            </Button>
          </div>
        }
        filters={
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, tipo, usuario o ID (ej. 4 o #4)..."
                value={searchTerm}
                onChange={(event) => changeSearch(event.target.value)}
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
              ? `${filteredCredentials.length} de ${credentials.length} credenciales`
              : `${filteredCredentials.length} credenciales registradas`}
          </span>
        }
      />

      <DataTable<Credential>
        columns={columns}
        data={paginatedCredentials}
        rowKey={(credential) => credential.id}
        page={activePage}
        totalPages={totalPages}
        totalFiltered={filteredCredentials.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onRowClick={(credential) => setSelectedCredentialId(credential.id)}
        onRowDoubleClick={openViewDialog}
        selectedRowKey={selectedCredentialId}
        emptyMessage={
          isLoading
            ? "Cargando credenciales..."
            : "No se encontraron credenciales con los criterios seleccionados."
        }
      />

      <CredentialDialog
        open={dialogMode !== null}
        draft={draft}
        mode={dialogMode ?? "create"}
        onOpenChange={closeDialog}
        onChange={handleDraftChange}
        onSubmit={(event) =>
          void (dialogMode === "edit" ? submitEdit(event) : submitCreate(event))
        }
        onEdit={
          selectedCredential?.activo
            ? startEditing
            : () => void reactivarCredential()
        }
        editLabel={selectedCredential?.activo ? "Editar" : "Reactivar"}
        editIcon={
          selectedCredential?.activo ? undefined : <RotateCcw aria-hidden="true" />
        }
        onImport={dialogMode === "create" ? (records) => void importCredentials(records) : undefined}
        onToggleState={dialogMode === "edit" ? () => void deactivateCredential() : undefined}
        onReveal={selectedCredential?.activo ? revealPassword : undefined}
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
    </div>
  )
}

export default PasswordsPage
