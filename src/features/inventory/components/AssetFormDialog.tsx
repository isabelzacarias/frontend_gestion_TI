import { useState, type FormEvent } from "react"

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import type { InventoryItem } from "@/features/inventory/data/inventoryData"

export type AssetFormDraft = {
  cb23: string
  tipo: InventoryItem["tipo"]
  marca: string
  modelo: string
  numeroSerie: string
  sucursal: string
  estado: InventoryItem["estado"]
  estadoGeneral: InventoryItem["estadoGeneral"]
  nombreRed: string
  responsableNombre: string
  responsableEmail: string
}

/** Modo del formulario: crear o editar */
export type AssetFormMode = "create" | "edit"

interface AssetFormDialogProps {
  open: boolean
  draft: AssetFormDraft
  /** Modo del formulario — por defecto "create" */
  mode?: AssetFormMode
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof AssetFormDraft>(field: K, value: AssetFormDraft[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  /** Callback para eliminar — solo se usa en modo "edit" */
  onDelete?: () => void
}

/* ──────────────────────────────────────────────
 * Definición declarativa de secciones y campos
 * ────────────────────────────────────────────── */
const sections: FormSection<AssetFormDraft>[] = [
  {
    title: "Información general",
    color: "primary",
    gridCols: "sm:grid-cols-3",
    fields: [
      { key: "cb23", label: "CB23", placeholder: "200430" },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { value: "Laptop", label: "Laptop" },
          { value: "Desktop", label: "Desktop" },
          { value: "Monitor", label: "Monitor" },
          { value: "Servidor", label: "Servidor" },
          { value: "Impresora", label: "Impresora" },
          { value: "Switch", label: "Switch" },
          { value: "Router", label: "Router" },
        ],
      },
      { key: "marca", label: "Marca", placeholder: "Dell" },
      { key: "modelo", label: "Modelo", placeholder: "Latitude 5450" },
      {
        key: "numeroSerie",
        label: "Número de serie",
        placeholder: "ABC123456",
        colSpan: "sm:col-span-2",
      },
    ],
  },
  {
    title: "Estado y asignación",
    color: "cyan",
    gridCols: "sm:grid-cols-2 lg:grid-cols-4",
    fields: [
      {
        key: "sucursal",
        label: "Sucursal",
        type: "select",
        options: [
          { value: "PLAYA", label: "PLAYA" },
          { value: "MERIDA", label: "MERIDA" },
          { value: "CANCUN", label: "CANCUN" },
        ],
      },
      {
        key: "estado",
        label: "Estado",
        type: "select",
        options: [
          { value: "EN_USO", label: "En uso" },
          { value: "DISPONIBLE", label: "Disponible" },
          { value: "MANTENIMIENTO", label: "Mantenimiento" },
          { value: "BAJA", label: "Baja" },
        ],
      },
      {
        key: "estadoGeneral",
        label: "Estado general",
        type: "select",
        options: [
          { value: "Excelente", label: "Excelente" },
          { value: "Bueno", label: "Bueno" },
          { value: "Regular", label: "Regular" },
          { value: "Crítico", label: "Crítico" },
        ],
      },
      { key: "nombreRed", label: "Red", placeholder: "ADMP-01" },
    ],
  },
  {
    title: "Responsable",
    color: "violet",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "responsableNombre",
        label: "Nombre completo",
        placeholder: "Nombre completo",
      },
      {
        key: "responsableEmail",
        label: "Correo electrónico",
        type: "email",
        placeholder: "responsable@empresa.com",
      },
    ],
  },
]

/* ──────────────────────────────────────────────
 * Textos según modo
 * ────────────────────────────────────────────── */
const modeConfig = {
  create: {
    title: "Registrar activo",
    description: "Completa los datos para agregar un equipo nuevo al inventario TI.",
    submitLabel: "Guardar activo",
    icon: <span className="text-lg font-bold">+</span>,
  },
  edit: {
    title: "Editar activo",
    description: "Modifica los datos del equipo seleccionado.",
    submitLabel: "Actualizar",
    icon: <span className="text-lg font-bold text-white">+</span>,
  },
}

export function AssetFormDialog({
  open,
  draft,
  mode = "create",
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
}: AssetFormDialogProps) {
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
      <FormDialog<AssetFormDraft>
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
        title="Eliminar activo"
        itemName={draft.cb23 || "este activo"}
        description={`¿Deseas eliminar el activo ${draft.cb23 || "seleccionado"}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}