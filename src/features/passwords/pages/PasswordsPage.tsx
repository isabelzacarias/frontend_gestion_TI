import { useState } from "react"
import type { FormEvent } from "react"
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Search,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CredentialDialog from "@/features/passwords/components/CredentialDialog"
import { sampleCredentials } from "@/features/passwords/data/sample-credentials"
import type {
  Credential,
  CredentialDraft,
} from "@/features/passwords/types/credential"

function PasswordsPage() {
  const pageSize = 10
  const [credentials, setCredentials] = useState(sampleCredentials)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(
    null,
  )
  const [editingCredential, setEditingCredential] =
    useState<CredentialDraft | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const selectedCredential = credentials.find(
    (credential) => credential.id === selectedCredentialId,
  )
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es")
  const filteredCredentials = credentials.filter((credential) =>
    [
      credential.service,
      credential.account,
      credential.category,
      credential.username,
    ].some((value) => value.toLocaleLowerCase("es").includes(normalizedSearch)),
  )
  const pageCount = Math.max(1, Math.ceil(filteredCredentials.length / pageSize))
  const activePage = Math.min(currentPage, pageCount)
  const pageStartIndex = (activePage - 1) * pageSize
  const pageCredentials = filteredCredentials.slice(
    pageStartIndex,
    pageStartIndex + pageSize,
  )
  const firstVisibleCredential =
    filteredCredentials.length === 0 ? 0 : pageStartIndex + 1
  const lastVisibleCredential = Math.min(
    pageStartIndex + pageSize,
    filteredCredentials.length,
  )

  function changeSearch(value: string) {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  function changePage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount))
  }

  function openCredential(credential: Credential) {
    setSelectedCredentialId(credential.id)
    setEditingCredential(null)
    setPasswordVisible(false)
  }

  function closeCredential(open: boolean) {
    if (!open) {
      setSelectedCredentialId(null)
      setEditingCredential(null)
      setPasswordVisible(false)
    }
  }

  function startEditing() {
    if (!selectedCredential) return

    setEditingCredential({
      service: selectedCredential.service,
      account: selectedCredential.account,
      username: selectedCredential.username,
      password: selectedCredential.password,
      website: selectedCredential.website,
      category: selectedCredential.category,
      notes: selectedCredential.notes,
    })
    setPasswordVisible(false)
  }

  function updateDraft(field: keyof CredentialDraft, value: string) {
    setEditingCredential((draft) =>
      draft ? { ...draft, [field]: value } : draft,
    )
  }

  function cancelEditing() {
    setEditingCredential(null)
    setPasswordVisible(false)
  }

  function saveEditing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCredential || !editingCredential) return

    const updatedAt = new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date())

    setCredentials((currentCredentials) =>
      currentCredentials.map((credential) =>
        credential.id === selectedCredential.id
          ? { ...credential, ...editingCredential, updatedAt }
          : credential,
      ),
    )
    setEditingCredential(null)
    setPasswordVisible(false)
    toast.success("Cambios aplicados temporalmente. Se perderán al recargar.")
  }

  return (
    <PagePlaceholder
      title="Contraseñas"
      description="Consulta las credenciales guardadas para los servicios de TI."
    >
      <section
        aria-label="Credenciales de ejemplo"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
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
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Bóveda de credenciales
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecciona un servicio para consultar o editar sus datos.
              </p>
            </div>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Buscar credenciales</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Buscar servicio o cuenta"
              className="h-10 pl-9"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-start gap-3 border-b border-border bg-muted/35 px-4 py-3.5 sm:px-5">
            <ShieldAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <p className="text-sm leading-5 text-muted-foreground">
              Todos los registros son ficticios. Las contraseñas permanecen
              ocultas hasta que abras una credencial.
            </p>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Ejemplos ficticios de credenciales almacenadas
              </caption>
              <thead className="bg-muted/20 text-xs font-medium tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="px-6 py-4">
                    Servicio
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Cuenta
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Contraseña
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Última actualización
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageCredentials.map((credential) => {
                  const Icon = credential.icon
                  return (
                    <tr
                      key={credential.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <th
                        scope="row"
                        className="whitespace-nowrap px-6 py-6 font-semibold text-foreground"
                      >
                        <button
                          type="button"
                          className="flex items-center gap-4 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-haspopup="dialog"
                          aria-label={`Ver detalles de ${credential.service}`}
                          onClick={() => openCredential(credential)}
                        >
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon aria-hidden="true" className="size-5" />
                          </span>
                          <span className="text-base underline-offset-4 hover:underline">
                            {credential.service}
                          </span>
                        </button>
                      </th>
                      <td className="whitespace-nowrap px-6 py-6 text-sm text-muted-foreground">
                        {credential.account}
                      </td>
                      <td className="whitespace-nowrap px-6 py-6">
                        <Badge variant="outline" className="px-2.5 py-1 text-sm font-medium">
                          {credential.category}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-6 font-mono text-sm text-muted-foreground">
                        <span aria-label="Contraseña oculta">••••••••••••</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-6 text-sm text-muted-foreground">
                        {credential.updatedAt}
                      </td>
                    </tr>
                  )
                })}
                {pageCredentials.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                      No encontramos credenciales que coincidan con “
                      {searchTerm}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {pageCredentials.map((credential) => {
              const Icon = credential.icon
              return (
                <article
                  key={credential.id}
                  className="px-4 py-4 transition-colors hover:bg-muted/20 sm:px-5"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-haspopup="dialog"
                    aria-label={`Ver detalles de ${credential.service}`}
                    onClick={() => openCredential(credential)}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {credential.service}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Servicio
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  </button>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Acceso
                      </p>
                      <p className="mt-1 break-all text-sm text-foreground">
                        {credential.account}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {credential.username}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Clasificación
                      </p>
                      <div className="mt-1">
                        <Badge variant="outline" className="font-normal">
                          {credential.category}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Actualizada {credential.updatedAt}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
            {pageCredentials.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                No encontramos credenciales que coincidan con “{searchTerm}”.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground">
              {firstVisibleCredential}–{lastVisibleCredential} de{" "}
              {filteredCredentials.length} credenciales
            </p>
            <p className="text-xs text-muted-foreground">
              Los cambios se mantienen mientras esta vista esté abierta.
            </p>
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="Paginación de credenciales"
              className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5"
            >
              <Button
                type="button"
                variant="outline"
                className="min-h-11 gap-1.5"
                disabled={activePage === 1}
                onClick={() => changePage(activePage - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
                <span className="sr-only sm:hidden">Página anterior</span>
              </Button>
              <p
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                Página <span className="font-medium text-foreground">{activePage}</span>{" "}
                de {pageCount}
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 gap-1.5"
                disabled={activePage === pageCount}
                onClick={() => changePage(activePage + 1)}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sr-only sm:hidden">Página siguiente</span>
                <ChevronRight aria-hidden="true" />
              </Button>
            </nav>
          )}
        </div>

        <CredentialDialog
          credential={selectedCredential}
          draft={editingCredential}
          passwordVisible={passwordVisible}
          onOpenChange={closeCredential}
          onEdit={startEditing}
          onCancel={cancelEditing}
          onSave={saveEditing}
          onDraftChange={updateDraft}
          onTogglePassword={() =>
            setPasswordVisible((isVisible) => !isVisible)
          }
        />
      </section>
    </PagePlaceholder>
  )
}

export default PasswordsPage
