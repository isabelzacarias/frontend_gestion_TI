import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Button } from "@/components/ui/button"
import { ImportConfirmDialog } from "@/components/ui/import-confirm-dialog"
import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import type { InventoryItem } from "@/features/inventory/data/inventoryData"
import {
  downloadAssetCsvTemplate,
  parseAssetCsv,
} from "@/features/inventory/utils/asset-import"

export type AssetFormDraft = {
  filaOrigen?: number
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
  onImport?: (records: AssetFormDraft[]) => void
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
          { value: "Tablet", label: "Tablet" },
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
  onImport,
  onDelete,
}: AssetFormDialogProps) {
  const config = modeConfig[mode]
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<AssetFormDraft[]>([])
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
        throw new Error("Selecciona un archivo CSV compatible con Excel.")
      }

      const importedDrafts = parseAssetCsv(await file.text())
      setPendingImport(importedDrafts)
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

  const handleDeleteClick = () => {
    if (mode === "edit" && onDelete) {
      setIsConfirmOpen(true)
    }
  }

  const handleConfirmDelete = () => {
    onDelete?.()
    setIsConfirmOpen(false)
  }

  const handleConfirmImport = () => {
    if (pendingImport.length === 0 || !onImport) return
    onImport(pendingImport)
    setPendingImport([])
    setIsImportConfirmOpen(false)
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
        formActions={
          mode === "create" && onImport ? (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                aria-label="Seleccionar archivo CSV de activos"
                onChange={(event) => void handleImportFile(event)}
              />
              <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Importar activos</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Completa la plantilla CSV; después selecciona el archivo para revisar el lote antes de registrarlo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl px-3 text-xs font-semibold"
                    onClick={downloadAssetCsvTemplate}
                  >
                    <Download aria-hidden="true" />
                    Descargar plantilla de registro
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl px-3 text-xs font-semibold"
                    onClick={handleImportClick}
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

      <ImportConfirmDialog
        open={isImportConfirmOpen}
        count={pendingImport.length}
        recordLabel="activo"
        recordsLabel="activos"
        emptyMessage="El archivo contiene 0 activos. Completa la plantilla CSV con al menos un registro para continuar."
        onOpenChange={(nextOpen) => {
          setIsImportConfirmOpen(nextOpen)
          if (!nextOpen) setPendingImport([])
        }}
        onConfirm={handleConfirmImport}
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