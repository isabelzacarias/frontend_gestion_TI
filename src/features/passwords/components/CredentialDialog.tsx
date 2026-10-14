import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react"
import { Check, Copy, Eye, EyeOff, Loader2,  } from "lucide-react"
import { toast } from "sonner"
import { Import } from "lucide-react"
import { FileDown } from "lucide-react"
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

export type CredentialFormMode = "create" | "edit" | "view"

interface CredentialDialogProps {
  open: boolean
  draft: CredentialDraft
  mode?: CredentialFormMode
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof CredentialDraft>(field: K, value: CredentialDraft[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: () => void
  editLabel?: string
  editIcon?: ReactNode
  onImport?: (records: CredentialDraft[]) => void
  /** Acción para cambiar el estado de la credencial (baja/alta lógica) */
  onToggleState?: () => void
  onReveal?: () => Promise<string>
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

function CredentialPasswordField({
  value,
  onChange,
  optional = false,
}: CustomStringFieldProps & { optional?: boolean }) {
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
          required={!optional}
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
      {optional ? (
        <p className="text-xs text-muted-foreground">
          Déjala vacía para conservar la contraseña actual.
        </p>
      ) : null}
      <PasswordStrengthIndicator password={value} />
    </div>
  )
}

function CredentialPasswordReveal({
  onReveal,
}: {
  onReveal?: () => Promise<string>
}) {
  const [password, setPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  async function handleReveal() {
    if (password !== null) {
      setIsVisible((visible) => !visible)
      return
    }
    if (!onReveal) return

    setIsLoading(true)
    try {
      const value = await onReveal()
      setPassword(value)
      setIsVisible(true)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo revelar la contraseña.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-8 items-center gap-2">
      <span className="break-all py-1 font-mono text-sm text-foreground">
        {password !== null && isVisible ? password : "••••••••••••"}
      </span>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        aria-label={password !== null && isVisible ? "Ocultar contraseña" : "Revelar contraseña"}
        aria-pressed={password !== null && isVisible}
        disabled={isLoading}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void handleReveal()
        }}
      >
        {isLoading ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : password !== null && isVisible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
      {password !== null && isVisible ? (
        <CopyButton value={password} label="la contraseña" />
      ) : null}
    </div>
  )
}

function buildSections(isEdit: boolean): FormSection<CredentialDraft>[] {
  return [
    {
      title: "Información general",
      color: "primary",
      gridCols: "sm:grid-cols-2",
      fields: [
        { key: "nombre", label: "Nombre", placeholder: "Portal interno", required: true },
        { key: "tipo", label: "Tipo", placeholder: "Cloud", required: true },
      ],
    },
    {
      title: "Datos de acceso",
      color: "cyan",
      gridCols: "sm:grid-cols-2",
      fields: [
        { key: "usuario", label: "Usuario", placeholder: "soporte.admin", required: true },
        {
          key: "password",
          label: isEdit ? "Nueva contraseña (opcional)" : "Contraseña",
          colSpan: "sm:col-span-2",
          render: (value, onChange) => (
            <CredentialPasswordField
              value={value as string}
              onChange={onChange as (value: string) => void}
              optional={isEdit}
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
          key: "comentario",
          label: "Comentario",
          type: "textarea",
          placeholder: "Describe el uso, acceso o política de esta credencial.",
          rows: 4,
        },
      ],
    },
  ]
}

const modeConfig = {
  create: {
    title: "Registrar credencial",
    description: "Completa los datos para agregar una nueva credencial al módulo de seguridad.",
    submitLabel: "Crear Contraseña",
    icon: <span className="text-lg font-bold">+</span>,
  },
  edit: {
    title: "Editar credencial",
    description: "Actualiza la información de la credencial seleccionada.",
    submitLabel: "Guardar Cambios",
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
  editLabel,
  editIcon,
  onImport,
  onToggleState,
  onReveal,
}: CredentialDialogProps) {
  const config = mode === "edit" ? modeConfig.edit : modeConfig.create
  const isEdit = mode === "edit"
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<CredentialDraft[]>([])
  const importInputRef = useRef<HTMLInputElement>(null)
  const sections = buildSections(isEdit)

  const detailSections: DetailSection[] = [
    {
      title: "Información general",
      color: "primary",
      fields: [
        { key: "nombre", label: "Nombre", value: draft.nombre || "—" },
        { key: "tipo", label: "Tipo", value: draft.tipo || "—" },
      ],
    },
    {
      title: "Datos de acceso",
      color: "cyan",
      fields: [
        {
          key: "usuario",
          label: "Usuario",
          value: (
            <CredentialTextDisplay value={draft.usuario} label="el usuario" />
          ),
        },
        {
          key: "password",
          label: "Contraseña",
          value: onReveal ? (
            <CredentialPasswordReveal onReveal={onReveal} />
          ) : (
            <span className="text-sm italic text-muted-foreground">
              No disponible (credencial inactiva)
            </span>
          ),
        },
      ],
    },
    {
      title: "Notas",
      color: "violet",
      fields: [
        {
          key: "comentario",
          label: "Comentario",
          value: draft.comentario || "—",
        },
      ],
    },
  ]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (mode === "view") {
      event.preventDefault()
      return
    }

    onSubmit(event)
  }

  const handleDeactivateClick = () => {
    if (mode === "edit" && onToggleState) {
      setIsConfirmOpen(true)
    }
  }

  const handleConfirmDeactivate = () => {
    onToggleState?.()
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
          title={draft.nombre || "Consultar credencial"}
          description="Consulta la información guardada de esta credencial."
          sections={detailSections}
          onOpenChange={onOpenChange}
          onEdit={onEdit}
          editLabel={editLabel}
          editIcon={editIcon}
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
          deleteDisabled={isEdit}
          deleteLabel="Eliminar"
          onToggleState={isEdit ? handleDeactivateClick : undefined}
          toggleStateLabel="Desactivar"
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
                      <FileDown aria-hidden="true" />
                      Descargar plantilla de registro
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl px-3 text-xs font-semibold"
                      onClick={() => importInputRef.current?.click()}
                    >
                      <Import aria-hidden="true" />
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
        title="Desactivar credencial"
        itemName={draft.nombre || "esta credencial"}
        description={`¿Deseas desactivar la credencial de ${draft.nombre || "este servicio"}? Pasará a estado inactivo (baja lógica) y podrás reactivarla más adelante.`}
        confirmLabel="Desactivar"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}

export default CredentialDialog
