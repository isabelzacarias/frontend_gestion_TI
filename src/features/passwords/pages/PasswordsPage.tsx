import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ChevronDown,
  Download,
  KeyRound,
  Plus,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import CredentialDialog from "@/features/passwords/components/CredentialDialog"
import type { CredentialFormMode } from "@/features/passwords/components/CredentialDialog"
import { sampleCredentials } from "@/features/passwords/data/sample-credentials"
import type {
  Credential,
  CredentialDraft,
} from "@/features/passwords/types/credential"

const createEmptyCredentialDraft = (): CredentialDraft => ({
  service: "",
  account: "",
  username: "",
  password: "",
  website: "",
  category: "Cloud",
  notes: "",
})

const toCredentialDraft = (credential: Credential): CredentialDraft => ({
  service: credential.service,
  account: credential.account,
  username: credential.username,
  password: credential.password,
  website: credential.website,
  category: credential.category,
  notes: credential.notes,
})

const createCredentialFromDraft = (draft: CredentialDraft, id: number): Credential => ({
  id: `cred-${id}`,
  service: draft.service.trim() || "Nuevo servicio",
  account: draft.account.trim() || "Cuenta no especificada",
  username: draft.username.trim() || "usuario",
  password: draft.password,
  website: draft.website.trim() || "https://example.com",
  category: draft.category.trim() || "Cloud",
  updatedAt: new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date()),
  createdBy: "Usuario actual",
  notes: draft.notes.trim(),
  icon: sampleCredentials[0].icon,
})

function PasswordsPage() {
  const pageSize = 10
  const [credentials, setCredentials] = useState(sampleCredentials)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null)
  const [draft, setDraft] = useState<CredentialDraft>(createEmptyCredentialDraft())
  const [dialogMode, setDialogMode] = useState<CredentialFormMode | null>(null)

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>()
    credentials.forEach((credential) => {
      const key = credential.category.toLocaleLowerCase("es")
      if (!seen.has(key)) seen.set(key, credential.category)
    })
    return [...seen.values()].sort((a, b) => a.localeCompare(b, "es"))
  }, [credentials])

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es")
  const normalizedCategory = categoryFilter.toLocaleLowerCase("es")
  const filteredCredentials = credentials.filter((credential) => {
    const matchesCategory =
      categoryFilter === "all" ||
      credential.category.toLocaleLowerCase("es") === normalizedCategory

    if (!matchesCategory) return false

    return [
      credential.service,
      credential.account,
      credential.category,
      credential.username,
    ].some((value) => value.toLocaleLowerCase("es").includes(normalizedSearch))
  })
  const pageCount = Math.max(1, Math.ceil(filteredCredentials.length / pageSize))
  const activePage = Math.min(currentPage, pageCount)
  const pageStartIndex = (activePage - 1) * pageSize
  const pageCredentials = filteredCredentials.slice(
    pageStartIndex,
    pageStartIndex + pageSize,
  )

  const columns: DataTableColumn<Credential>[] = [
    {
      key: "service",
      header: "Servicio",
      cellClassName: "border-b border-border/70 px-4 py-3 font-semibold text-foreground",
      render: (credential) => {
        const Icon = credential.icon

        return (
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="text-base font-semibold text-foreground">
              {credential.service}
            </span>
          </div>
        )
      },
    },
    {
      key: "account",
      header: "Cuenta",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-muted-foreground",
      render: (credential) => credential.account,
    },
    {
      key: "category",
      header: "Categoría",
      cellClassName: "border-b border-border/70 px-4 py-3",
      render: (credential) => (
        <Badge variant="outline" className="px-2.5 py-1 text-sm font-medium">
          {credential.category}
        </Badge>
      ),
    },
    {
      key: "password",
      header: "Contraseña",
      cellClassName: "border-b border-border/70 px-4 py-3 font-mono text-sm text-muted-foreground",
      render: () => "••••••••••••",
    },
    {
      key: "updatedAt",
      header: "Última actualización",
      cellClassName: "border-b border-border/70 px-4 py-3 text-sm text-muted-foreground",
      render: (credential) => credential.updatedAt,
    },
  ]

  function changeSearch(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function changeCategory(value: string) {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  function changePage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount))
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
    const selectedCredential = credentials.find(
      (credential) => credential.id === selectedCredentialId,
    )
    if (!selectedCredential) return

    setDraft(toCredentialDraft(selectedCredential))
    setDialogMode("edit")
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setDraft(createEmptyCredentialDraft())
      setSelectedCredentialId(null)
      setDialogMode(null)
    }
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextCredential = createCredentialFromDraft(draft, Date.now())

    setCredentials((current) => [nextCredential, ...current])
    setDraft(createEmptyCredentialDraft())
    setDialogMode(null)
    toast.success("Credencial creada correctamente.")
  }

  function importCredentials(records: CredentialDraft[]) {
    const idBase = Date.now()
    const importedCredentials = records.map((record, index) =>
      createCredentialFromDraft(record, idBase + index),
    )

    setCredentials((current) => [...importedCredentials, ...current])
    setDraft(createEmptyCredentialDraft())
    setSearchTerm("")
    setCategoryFilter("all")
    setCurrentPage(1)
    setDialogMode(null)
    toast.success(
      `${importedCredentials.length} ${importedCredentials.length === 1 ? "credencial registrada" : "credenciales registradas"} correctamente.`,
    )
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCredentialId) return

    const updatedAt = new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date())

    setCredentials((current) =>
      current.map((credential) =>
        credential.id === selectedCredentialId
          ? {
              ...credential,
              service: draft.service.trim() || credential.service,
              account: draft.account.trim() || credential.account,
              username: draft.username.trim() || credential.username,
              password: draft.password,
              website: draft.website.trim() || credential.website,
              category: draft.category.trim() || credential.category,
              updatedAt,
              notes: draft.notes.trim(),
            }
          : credential,
      ),
    )

    setDraft(createEmptyCredentialDraft())
    setSelectedCredentialId(null)
    setDialogMode(null)
    toast.success("Cambios aplicados correctamente.")
  }

  function deleteCredential() {
    if (!selectedCredentialId) return

    setCredentials((current) => current.filter((credential) => credential.id !== selectedCredentialId))
    setDraft(createEmptyCredentialDraft())
    setSelectedCredentialId(null)
    setDialogMode(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <ModuleHeader
        eyebrow="Seguridad TI"
        title="Contraseñas"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.05)] backdrop-blur-md hover:bg-white/90 dark:border-violet-400/30 dark:bg-slate-900/70 dark:text-violet-100 dark:hover:bg-slate-800/90"
              onClick={() =>
                toast.info("La exportación de credenciales estará disponible cuando se conecte el backend.")
              }
            >
              <Download className="size-4" />
              Exportar
            </Button>

            <Button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(91,36,128,0.24)] hover:brightness-110"
            >
              <Plus className="size-4" />
              Agregar
            </Button>
          </>
        }
        filters={
          <>
            <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(91,36,128,0.08)] backdrop-blur-md md:min-w-[290px] dark:border-white/10 dark:bg-slate-900/55 dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.12),0_12px_25px_rgba(15,23,42,0.18)]">
              <Search className="size-4 text-primary" />
              <input
                value={searchTerm}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Buscar servicio o cuenta..."
                className="w-full border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Buscar credenciales"
              />
            </div>

            <div className="relative inline-flex min-w-[180px] items-center">
              <select
                value={categoryFilter}
                onChange={(event) => changeCategory(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/60 bg-white/60 px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-[0_8px_20px_rgba(15,23,42,0.05)] outline-none backdrop-blur-md transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55"
                aria-label="Filtrar por categoría"
              >
                <option value="all">Todas las categorías</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted-foreground" />
            </div>
          </>
        }
        summary={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1.5 rounded-md px-2.5 py-1"
              >
                <KeyRound aria-hidden="true" />
                Datos de demostración
              </Badge>
              <span className="text-xs text-muted-foreground">
                Sin conexión a API
              </span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
              {filteredCredentials.length} registros
            </span>
          </>
        }
      />

      <DataTable<Credential>
        columns={columns}
        data={pageCredentials}
        rowKey={(credential) => credential.id}
        page={activePage}
        totalPages={pageCount}
        totalFiltered={filteredCredentials.length}
        itemsPerPage={pageSize}
        onPageChange={changePage}
        onRowDoubleClick={openViewDialog}
        selectedRowKey={selectedCredentialId}
        emptyMessage={
          searchTerm.trim()
            ? `No encontramos credenciales que coincidan con “${searchTerm}”.`
            : "No hay credenciales en la categoría seleccionada."
        }
      />

      <CredentialDialog
        open={dialogMode !== null}
        draft={draft}
        mode={dialogMode ?? "create"}
        onOpenChange={closeDialog}
        onChange={handleDraftChange}
        onSubmit={dialogMode === "edit" ? submitEdit : submitCreate}
        onEdit={startEditing}
        onImport={dialogMode === "create" ? importCredentials : undefined}
        onDelete={dialogMode === "edit" ? deleteCredential : undefined}
      />
    </div>
  )
}

export default PasswordsPage
