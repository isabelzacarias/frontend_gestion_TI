import { useMemo, type FormEvent } from "react"
import { Wrench } from "lucide-react"

import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import {
  SAMPLE_ACTIVOS,
  SAMPLE_TECNICOS,
} from "@/features/maintenance/data/maintenanceData"
import {
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from "@/features/maintenance/utils/maintenance-display"
import type { MaintenanceFormDraft } from "@/features/maintenance/types/maintenance"

interface MaintenanceFormDialogProps {
  open: boolean
  draft: MaintenanceFormDraft
  mode?: "create" | "edit"
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof MaintenanceFormDraft>(
    field: K,
    value: MaintenanceFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
}

const buildSections = (): FormSection<MaintenanceFormDraft>[] => [
  {
    title: "Orden de Mantenimiento",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "activoId",
        label: "Activo",
        type: "select",
        required: true,
        colSpan: "sm:col-span-2",
        options: [
          { value: "", label: "Selecciona un activo" },
          ...SAMPLE_ACTIVOS.map((activo) => ({
            value: activo.id,
            label: activo.label,
          })),
        ],
      },
      {
        key: "tipo",
        label: "Tipo de mantenimiento",
        type: "select",
        required: true,
        options: Object.entries(MAINTENANCE_TYPE_LABELS).map(
          ([value, label]) => ({ value, label }),
        ),
      },
      {
        key: "prioridad",
        label: "Prioridad",
        type: "select",
        required: true,
        options: Object.entries(MAINTENANCE_PRIORITY_LABELS).map(
          ([value, label]) => ({ value, label }),
        ),
      },
      {
        key: "estado",
        label: "Estado",
        type: "select",
        required: true,
        options: Object.entries(MAINTENANCE_STATUS_LABELS).map(
          ([value, label]) => ({ value, label }),
        ),
      },
    ],
  },
  {
    title: "Programación y Responsable",
    color: "cyan",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "tecnico",
        label: "Técnico responsable",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Selecciona un técnico" },
          ...SAMPLE_TECNICOS.map((tecnico) => ({
            value: tecnico,
            label: tecnico,
          })),
        ],
      },
      {
        key: "costo",
        label: "Costo estimado (MXN)",
        type: "number",
        placeholder: "0.00",
      },
      {
        key: "fechaProgramada",
        label: "Fecha programada",
        placeholder: "AAAA-MM-DD",
        required: true,
      },
      {
        key: "fechaRealizada",
        label: "Fecha realizada",
        placeholder: "AAAA-MM-DD (opcional)",
      },
    ],
  },
  {
    title: "Detalle del Trabajo",
    color: "amber",
    gridCols: "sm:grid-cols-1",
    fields: [
      {
        key: "descripcion",
        label: "Descripción",
        type: "textarea",
        rows: 4,
        placeholder: "Describe el trabajo a realizar o realizado...",
      },
    ],
  },
]

export function MaintenanceFormDialog({
  open,
  draft,
  mode = "create",
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
}: MaintenanceFormDialogProps) {
  const isEdit = mode === "edit"
  const sections = useMemo(() => buildSections(), [])

  return (
    <FormDialog<MaintenanceFormDraft>
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Orden de Mantenimiento" : "Registrar Orden de Mantenimiento"}
      description={
        isEdit
          ? "Modifica los datos de la orden de mantenimiento seleccionada."
          : "Captura la información para programar una nueva orden de mantenimiento."
      }
      icon={<Wrench aria-hidden="true" className="size-5" />}
      draft={draft}
      sections={sections}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
      deleteLabel="Eliminar"
      submitLabel={isEdit ? "Guardar Cambios" : "Crear Orden"}
    />
  )
}
