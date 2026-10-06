import { useState, type FormEvent } from "react"

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import type { CredentialDraft } from "@/features/passwords/types/credential"

export type CredentialFormMode = "create" | "edit"

interface CredentialDialogProps {
  open: boolean
  draft: CredentialDraft
  mode?: CredentialFormMode
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof CredentialDraft>(field: K, value: CredentialDraft[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
}

const sections: FormSection<CredentialDraft>[] = [
  {
    title: "Información general",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      { key: "service", label: "Servicio", placeholder: "Portal interno" },
      { key: "category", label: "Categoría", placeholder: "Cloud" },
    ],
  },
  {
    title: "Datos de acceso",
    color: "cyan",
    gridCols: "sm:grid-cols-2",
    fields: [
      { key: "account", label: "Cuenta / correo", placeholder: "soporte@empresa.test" },
      { key: "username", label: "Nombre de usuario", placeholder: "soporte.admin" },
      { key: "password", label: "Contraseña", type: "password", placeholder: "••••••••••••", colSpan: "sm:col-span-2" },
      { key: "website", label: "Sitio web", type: "url", placeholder: "https://portal.empresa.com", colSpan: "sm:col-span-2" },
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
  onDelete,
}: CredentialDialogProps) {
  const config = modeConfig[mode]
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

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
        onSubmit={onSubmit}
        title={config.title}
        description={config.description}
        submitLabel={config.submitLabel}
        icon={config.icon}
        sections={sections}
        onDelete={mode === "edit" ? handleDeleteClick : undefined}
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
