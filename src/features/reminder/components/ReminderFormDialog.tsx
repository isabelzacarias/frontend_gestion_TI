import { useMemo, type FormEvent } from "react"
import { Bell } from "lucide-react"

import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import type { RecordatorioFormDraft } from "@/features/reminder/types/reminder"
import { PRIORIDAD_LABELS } from "@/features/reminder/utils/reminder-display"

interface ReminderFormDialogProps {
  open: boolean
  draft: RecordatorioFormDraft
  mode?: "create" | "edit"
  isSaving?: boolean
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof RecordatorioFormDraft>(
    field: K,
    value: RecordatorioFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
}

const buildSections = (): FormSection<RecordatorioFormDraft>[] => [
  {
    title: "Recordatorio",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "titulo",
        label: "Título",
        type: "text",
        required: true,
        colSpan: "sm:col-span-2",
        placeholder: "Ej. Renovar certificado SSL",
      },
      {
        key: "prioridad",
        label: "Prioridad",
        type: "select",
        required: true,
        options: Object.entries(PRIORIDAD_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        key: "fecha",
        label: "Fecha (opcional)",
        type: "date",
      },
    ],
  },
  {
    title: "Notas",
    color: "cyan",
    gridCols: "sm:grid-cols-1",
    fields: [
      {
        key: "descripcion",
        label: "Descripción (opcional)",
        type: "textarea",
        rows: 4,
        placeholder: "Detalles o pasos a seguir...",
      },
    ],
  },
]

export function ReminderFormDialog({
  open,
  draft,
  mode = "create",
  isSaving = false,
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
}: ReminderFormDialogProps) {
  const isEdit = mode === "edit"
  const sections = useMemo(() => buildSections(), [])

  return (
    <FormDialog<RecordatorioFormDraft>
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Recordatorio" : "Nuevo Recordatorio"}
      description={
        isEdit
          ? "Actualiza los datos del recordatorio seleccionado."
          : "Captura el recordatorio que quieres dar seguimiento."
      }
      icon={<Bell aria-hidden="true" className="size-5" />}
      draft={draft}
      sections={sections}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
      deleteLabel="Eliminar"
      submitDisabled={isSaving}
      submitLabel={isEdit ? "Guardar Cambios" : "Crear Recordatorio"}
    />
  )
}
