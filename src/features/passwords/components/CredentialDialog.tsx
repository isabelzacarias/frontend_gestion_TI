import { useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react"
import { Check, Copy, Download, ExternalLink, Eye, EyeOff, Upload } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { ImportConfirmDialog } from "@/components/ui/import-confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import PasswordStrengthIndicator from "@/features/passwords/components/PasswordStrengthIndicator"
import type { CredentialDraft } from "@/features/passwords/types/credential"
import {
  downloadCredentialCsvTemplate,
  parseCredentialCsv,
} from "@/features/passwords/utils/credential-import"
import { evaluatePasswordStrength } from "@/features/passwords/utils/password-strength"

export type CredentialFormMode = "create" | "edit" | "view"

interface CredentialDialogProps {
  open: boolean
  draft: CredentialDraft
  mode?: CredentialFormMode
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof CredentialDraft>(field: K, value: CredentialDraft[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: () => void
  onImport?: (records: CredentialDraft[]) => void
  onDelete?: () => void
}

interface CustomStringFieldProps {
  value: string
  onChange: (value: string) => void
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`Se copió ${label} al portapapeles`)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("No se pudo copiar. Copia el valor manualmente.")
    }
  }

  return (
    <button
      type="button"
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Copiar ${label}`}
      title={`Copiar ${label}`}
      onClick={(event) => void handleCopy(event)}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-4 text-emerald-600" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
    </button>
  )
}

function CredentialTextDisplay({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-8 items-center gap-2">
      <span className="break-all py-1 text-sm text-foreground">{value || "—"}</span>
      {value ? <CopyButton value={value} label={label} /> : null}
    </div>
  )
}

function CredentialPasswordField({ value, onChange }: CustomStringFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          id="password"
          type={passwordVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          minLength={12}
          required
          aria-describedby="password-strength-help"
          className="h-9 border-white/70 bg-white/80 pr-10 text-[13px] shadow-sm dark:border-white/10 dark:bg-slate-900/55"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-1 flex w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={passwordVisible}
          onClick={() => setPasswordVisible((visible) => !visible)}
        >
          {passwordVisible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      <PasswordStrengthIndicator password={value} />
    </div>
  )
}

function CredentialPasswordDisplay({ value }: { value: string }) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <div className="flex min-h-8 items-center gap-2">
      <span className="break-all py-1 font-mono text-sm text-foreground">
        {passwordVisible ? value : "••••••••••••"}
      </span>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={passwordVisible}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setPasswordVisible((visible) => !visible)
        }}
      >
        {passwordVisible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
      <CopyButton value={value} label="la contraseña" />
    </div>
  )
}

function getSafeWebsiteUrl(value: string): URL | null {
  try {
    const parsedUrl = new URL(value)
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl
    }
  } catch {
    return null
  }

  return null
}

const sections: FormSection<CredentialDraft>[] = [
  {
    title: "Información general",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      { key: "service", label: "Servicio", placeholder: "Portal interno", required: true },
      { key: "category", label: "Categoría", placeholder: "Cloud", required: true },
    ],
  },
  {
    title: "Datos de acceso",
    color: "cyan",
    gridCols: "sm:grid-cols-2",
    fields: [
      { key: "account", label: "Cuenta / correo", placeholder: "soporte@empresa.test", required: true },
      { key: "username", label: "Nombre de usuario", placeholder: "soporte.admin", required: true },
      {
        key: "password",
        label: "Nueva contraseña",
        colSpan: "sm:col-span-2",
        render: (value, onChange) => (
          <CredentialPasswordField
            value={value as string}
            onChange={onChange as (value: string) => void}
          />
        ),
      },
      {
        key: "website",
        label: "Sitio web",
        colSpan: "sm:col-span-2",
        type: "url",
        render: (value, onChange) => (
          <Input
            id="website"
            type="url"
            value={value as string}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="url"
            required
            className="h-9 border-white/70 bg-white/80 text-[13px] shadow-sm dark:border-white/10 dark:bg-slate-900/55"
          />
        ),
      },
    ],
  },
  {
    title: "Notas",
    color: "violet",
    gridCols: "sm:grid-cols-1",
    fields: [
      {
        key: "notes",
        label: "Observaciones",
        type: "textarea",
        placeholder: "Describe el uso, acceso o política de esta credencial.",
        rows: 4,
      },
    ],
  },
]

const modeConfig = {
  create: {
    title: "Registrar credencial",
    description: "Completa los datos para agregar una nueva credencial al módulo de seguridad.",
    submitLabel: "Guardar credencial",
    icon: <span className="text-lg font-bold">+</span>,
  },
  edit: {
    title: "Editar credencial",
    description: "Actualiza la información de la credencial seleccionada.",
    submitLabel: "Guardar cambios",
    icon: <span className="text-lg font-bold text-white">+</span>,
  },
} as const

function CredentialDialog({
  open,
  draft,
  mode = "create",
  onOpenChange,
  onChange,
  onSubmit,
  onEdit,
  onImport,
  onDelete,
}: CredentialDialogProps) {
  const config = mode === "edit" ? modeConfig.edit : modeConfig.create
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<CredentialDraft[]>([])
  const importInputRef = useRef<HTMLInputElement>(null)
  const passwordIsStrong = evaluatePasswordStrength(draft.password).isStrong
  const websiteUrl = getSafeWebsiteUrl(draft.website)
  const detailSections: DetailSection[] = [
    {
      title: "Información general",
      color: "primary",
      fields: [
        { key: "service", label: "Servicio", value: draft.service },
        { key: "category", label: "Categoría", value: draft.category },
      ],
    },
    {
      title: "Datos de acceso",
      color: "cyan",
      fields: [
        {
          key: "account",
          label: "Cuenta / correo",
          value: (
            <CredentialTextDisplay
              value={draft.account}
              label="la cuenta / correo"
            />
          ),
        },
        { key: "username", label: "Nombre de usuario", value: draft.username },
        {
          key: "password",
          label: "Contraseña",
          value: <CredentialPasswordDisplay value={draft.password} />,
        },
        {
          key: "website",
          label: "Sitio web",
          value: websiteUrl ? (
            <a
              href={websiteUrl.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 break-all font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{websiteUrl.href}</span>
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
            </a>
          ) : (
            "—"
          ),
        },
      ],
    },
    {
      title: "Notas",
      color: "violet",
      fields: [
        {
          key: "notes",
          label: "Observaciones",
          value: draft.notes || "—",
        },
      ],
    },
  ]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (mode === "view") {
      event.preventDefault()
      return
    }

    if (!passwordIsStrong) {
      event.preventDefault()
      return
    }

    onSubmit(event)
  }

  const handleDeleteClick = () => {
    if (mode === "edit" && onDelete) {
      setIsConfirmOpen(true)
    }
  }

  const handleConfirmDelete = () => {
    onDelete?.()
    setIsConfirmOpen(false)
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
        throw new Error("Selecciona un archivo CSV compatible con Excel.")
      }

      const importedCredentials = parseCredentialCsv(await file.text())
      setPendingImport(importedCredentials)
      setIsImportConfirmOpen(true)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo. Descarga la plantilla e inténtalo de nuevo.",
      )
    } finally {
      event.target.value = ""
    }
  }

  const handleConfirmImport = () => {
    if (pendingImport.length === 0 || !onImport) return
    onImport(pendingImport)
    setPendingImport([])
    setIsImportConfirmOpen(false)
  }

  return (
    <>
      {mode === "view" ? (
        <DetailDialog
          open={open}
          title={draft.service || "Consultar credencial"}
          description="Consulta la información guardada de esta credencial."
          sections={detailSections}
          onOpenChange={onOpenChange}
          onEdit={onEdit}
        />
      ) : (
        <FormDialog<CredentialDraft>
          open={open}
          draft={draft}
          onOpenChange={onOpenChange}
          onChange={onChange}
          onSubmit={handleSubmit}
          title={config.title}
          description={config.description}
          submitLabel={config.submitLabel}
          icon={config.icon}
          sections={sections}
          onDelete={mode === "edit" ? handleDeleteClick : undefined}
          submitDisabled={!passwordIsStrong}
          formActions={
            mode === "create" && onImport ? (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  aria-label="Seleccionar archivo CSV de credenciales"
                  onChange={(event) => void handleImportFile(event)}
                />
                <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Importar credenciales</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Completa la plantilla CSV y selecciónala para revisar el lote antes de registrarlo.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                      El archivo contiene contraseñas sin cifrar. Protégelo y elimínalo después de importarlo.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl px-3 text-xs font-semibold"
                      onClick={downloadCredentialCsvTemplate}
                    >
                      <Download aria-hidden="true" />
                      Descargar plantilla de registro
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl px-3 text-xs font-semibold"
                      onClick={() => importInputRef.current?.click()}
                    >
                      <Upload aria-hidden="true" />
                      Importar
                    </Button>
                  </div>
                </div>
              </>
            ) : undefined
          }
        />
      )}

      <ImportConfirmDialog
        open={isImportConfirmOpen}
        count={pendingImport.length}
        recordLabel="credencial"
        recordsLabel="credenciales"
        emptyMessage="El archivo contiene 0 credenciales. Completa la plantilla CSV con al menos un registro para continuar."
        onOpenChange={(nextOpen) => {
          setIsImportConfirmOpen(nextOpen)
          if (!nextOpen) setPendingImport([])
        }}
        onConfirm={handleConfirmImport}
      />

      <ConfirmDeleteDialog
        open={isConfirmOpen}
        title="Eliminar credencial"
        itemName={draft.service || "esta credencial"}
        description={`¿Deseas eliminar la credencial de ${draft.service || "este servicio"}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}

export default CredentialDialog
