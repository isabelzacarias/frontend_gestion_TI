import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Download, Laptop, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ImportConfirmDialog } from "@/components/ui/import-confirm-dialog"
import { Input } from "@/components/ui/input"
import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import {
  assignmentAssetOptions,
  assignmentUserOptions,
} from "@/features/assignments/data/assignmentsData"
import {
  downloadAssignmentCsvTemplate,
  parseAssignmentCsv,
} from "@/features/assignments/utils/assignment-import"

/** Estado editable de una asignación */
export type AssignmentFormDraft = {
  usuarioId: string
  activoId: string
  nombreEquipo: string
  numeroActivo: string
  anioCompra: string
  fechaAsignacion: string
  fechaDevolucion: string
  activa: "true" | "false"
  observacion: string
}

export type AssignmentFormMode = "create" | "edit"

interface AssignmentFormDialogProps {
  open: boolean
  draft: AssignmentFormDraft
  mode?: AssignmentFormMode
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof AssignmentFormDraft>(
    field: K,
    value: AssignmentFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onImport?: (records: AssignmentFormDraft[]) => void
  /** Callback para eliminar — solo se usa en modo "edit" */
  onDelete?: () => void
}

function DateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 border-white/70 bg-white/80 text-[13px] text-foreground shadow-sm dark:border-white/10 dark:bg-slate-900/55"
    />
  )
}

const assetOptions = assignmentAssetOptions.map((asset) => ({
  value: String(asset.id),
  label: [`#${asset.id}`, asset.tipo, asset.marca]
    .filter(Boolean)
    .join(" · "),
}))

const userOptions = assignmentUserOptions.map((user) => ({
  value: user.id,
  label: `${user.id} · ${user.nombre}`,
}))

const sections: FormSection<AssignmentFormDraft>[] = [
  {
    title: "Equipo y Activo",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "activoId",
        label: "Activo del inventario",
        type: "select",
        options: assetOptions,
        colSpan: "sm:col-span-2",
        required: true,
      },
      {
        key: "nombreEquipo",
        label: "Nombre del equipo",
        placeholder: "Ej. PC-TEST-01",
      },
      {
        key: "numeroActivo",
        label: "Número de activo",
        placeholder: "Ej. ACT-0588",
      },
      {
        key: "anioCompra",
        label: "Año de compra",
        type: "number",
        placeholder: "Ej. 2024",
      },
    ],
  },
  {
    title: "Usuario y Vigencia",
    color: "cyan",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "usuarioId",
        label: "Usuario asignado",
        type: "select",
        options: userOptions,
        colSpan: "sm:col-span-2",
        required: true,
      },
      {
        key: "activa",
        label: "Estado de la asignación",
        type: "select",
        options: [
          { value: "true", label: "Activa" },
          { value: "false", label: "Devuelta" },
        ],
      },
      {
        key: "fechaAsignacion",
        label: "Fecha de asignación",
        render: (value, onChange) => (
          <DateField
            value={value as string}
            onChange={onChange as (value: string) => void}
          />
        ),
      },
      {
        key: "fechaDevolucion",
        label: "Fecha de devolución",
        render: (value, onChange) => (
          <DateField
            value={value as string}
            onChange={onChange as (value: string) => void}
          />
        ),
      },
    ],
  },
  {
    title: "Observaciones",
    color: "amber",
    gridCols: "sm:grid-cols-1",
    fields: [
      {
        key: "observacion",
        label: "Observación",
        type: "textarea",
        rows: 3,
        placeholder: "Motivo o notas de la asignación...",
      },
    ],
  },
]

export function AssignmentFormDialog({
  open,
  draft,
  mode = "create",
  onOpenChange,
  onChange,
  onSubmit,
  onImport,
  onDelete,
}: AssignmentFormDialogProps) {
  const isEdit = mode === "edit"
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<AssignmentFormDraft[]>([])
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

      const importedDrafts = parseAssignmentCsv(await file.text())
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

  const handleConfirmImport = () => {
    if (pendingImport.length === 0 || !onImport) return
    onImport(pendingImport)
    setPendingImport([])
    setIsImportConfirmOpen(false)
  }

  return (
    <>
      <FormDialog<AssignmentFormDraft>
        open={open}
        draft={draft}
        title={isEdit ? "Editar asignación" : "Nueva asignación"}
        description={
          isEdit
            ? "Actualiza los datos de la asignación de equipo."
            : "Registra la asignación de un activo a un usuario."
        }
        submitLabel={isEdit ? "Guardar cambios" : "Registrar asignación"}
        icon={<Laptop className="size-6 text-white" />}
        sections={sections}
        onOpenChange={onOpenChange}
        onChange={onChange}
        onSubmit={onSubmit}
        onDelete={onDelete}
        deleteLabel="Eliminar"
        formActions={
          mode === "create" && onImport ? (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                aria-label="Seleccionar archivo CSV de asignaciones"
                onChange={(event) => void handleImportFile(event)}
              />
              <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Importar asignaciones</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Completa la plantilla CSV; después selecciona el archivo para revisar el lote antes de registrarlo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl px-3 text-xs font-semibold"
                    onClick={downloadAssignmentCsvTemplate}
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
        recordLabel="asignación"
        recordsLabel="asignaciones"
        emptyMessage="El archivo contiene 0 asignaciones. Completa la plantilla CSV con al menos un registro para continuar."
        onOpenChange={(nextOpen) => {
          setIsImportConfirmOpen(nextOpen)
          if (!nextOpen) setPendingImport([])
        }}
        onConfirm={handleConfirmImport}
      />
    </>
  )
}
