import type { FormEvent } from "react"
import { KeyRound } from "lucide-react"

import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import type { LicenseFormDraft } from "@/features/licenses/types/license"

interface LicenseFormDialogProps {
  open: boolean
  draft: LicenseFormDraft
  mode?: "create" | "edit"
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof LicenseFormDraft>(
    field: K,
    value: LicenseFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
}

const sections: FormSection<LicenseFormDraft>[] = [
  {
    title: "Datos Principales de la Licencia",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "software",
        label: "Nombre del Software / Licencia",
        placeholder: "Ej. Licencia Bruno 1791479197775",
        required: true,
        colSpan: "sm:col-span-2",
      },
      {
        key: "proveedor",
        label: "Proveedor",
        placeholder: "Ej. Proveedor Bruno 1791479197775",
      },
      {
        key: "clave",
        label: "Clave de Licencia (Secret Key)",
        type: "password",
        placeholder: "BRUNO-LICENSE-SECRET-12345",
      },
    ],
  },
  {
    title: "Asignación y Estado",
    color: "cyan",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "asignadaAId",
        label: "Asignado A",
        type: "select",
        options: [
          { value: "", label: "Sin asignar" },
          { value: "ADMIN", label: "ADMIN - Administrador (admin@horbismex.com)" },
          { value: "TECH-01", label: "TECH-01 - Carlos Ramírez" },
          { value: "TECH-02", label: "TECH-02 - Daniel Valdés" },
        ],
      },
      {
        key: "activa",
        label: "Estado de la Licencia",
        type: "select",
        options: [
          { value: "true", label: "Activa" },
          { value: "false", label: "Inactiva" },
        ],
        required: true,
        render: (value, onChange) => (
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value === "true")}
            className="h-8 w-full rounded-xl border border-white/70 bg-white/80 px-3 text-[13px] text-foreground shadow-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55 cursor-pointer"
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        ),
      },
    ],
  },
  {
    title: "Vigencia y Fechas",
    color: "amber",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "fechaCompra",
        label: "Fecha de Compra",
        type: "text",
        placeholder: "AAAA-MM-DD (Ej. 2026-01-01)",
      },
      {
        key: "fechaVencimiento",
        label: "Fecha de Vencimiento",
        type: "text",
        placeholder: "AAAA-MM-DD (Ej. 2027-01-06)",
      },
    ],
  },
]

export function LicenseFormDialog({
  open,
  draft,
  mode = "create",
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
}: LicenseFormDialogProps) {
  const isEdit = mode === "edit"

  return (
    <FormDialog<LicenseFormDraft>
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Licencia" : "Registrar Licencia"}
      description={
        isEdit
          ? "Modifica los datos de la licencia de software en el sistema."
          : "Ingresa la información requerida para agregar una nueva licencia."
      }
      icon={<KeyRound aria-hidden="true" className="size-5" />}
      draft={draft}
      sections={sections}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
      deleteLabel="Eliminar Licencia"
      submitLabel={isEdit ? "Guardar Cambios" : "Crear Licencia"}
    />
  )
}
