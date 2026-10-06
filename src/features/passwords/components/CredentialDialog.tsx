import { useState, type FormEvent } from "react"
import { ExternalLink, Eye, EyeOff } from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import PasswordStrengthIndicator from "@/features/passwords/components/PasswordStrengthIndicator"
import type { CredentialDraft } from "@/features/passwords/types/credential"
import { evaluatePasswordStrength } from "@/features/passwords/utils/password-strength"

export type CredentialFormMode = "create" | "edit" | "view"

interface CredentialDialogProps {
  open: boolean
  draft: CredentialDraft
  mode?: CredentialFormMode
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof CredentialDraft>(field: K, value: CredentialDraft[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit?: () => void
  onDelete?: () => void
}

interface CustomStringFieldProps {
  value: string
  onChange: (value: string) => void
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
        renderReadOnly: (value) => (
          <CredentialPasswordDisplay value={String(value ?? "")} />
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
        renderReadOnly: (value) => {
          const safeUrl = getSafeWebsiteUrl(String(value ?? ""))

          return safeUrl ? (
            <a
              href={safeUrl.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 max-w-full items-center gap-1.5 break-all py-1 text-sm font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{safeUrl.href}</span>
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
            </a>
          ) : (
            <span className="inline-flex min-h-8 items-center py-1 text-sm text-muted-foreground">
              —
            </span>
          )
        },
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
  view: {
    title: "Consultar credencial",
    description: "Consulta la información guardada de esta credencial.",
    submitLabel: "",
    icon: <span className="text-lg font-bold">i</span>,
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
  onDelete,
}: CredentialDialogProps) {
  const config = modeConfig[mode]
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const passwordIsStrong = evaluatePasswordStrength(draft.password).isStrong

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

  return (
    <>
      <FormDialog<CredentialDraft>
        open={open}
        draft={draft}
        onOpenChange={onOpenChange}
        onChange={onChange}
        onSubmit={handleSubmit}
        title={mode === "view" ? draft.service || config.title : config.title}
        description={config.description}
        submitLabel={config.submitLabel}
        cancelLabel={mode === "view" ? "Cerrar" : "Cancelar"}
        icon={config.icon}
        sections={sections}
        onDelete={mode === "edit" ? handleDeleteClick : undefined}
        submitDisabled={!passwordIsStrong}
        readOnly={mode === "view"}
        onEdit={onEdit}
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
