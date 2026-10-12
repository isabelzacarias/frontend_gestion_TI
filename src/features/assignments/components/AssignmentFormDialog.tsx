import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Download, Laptop, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ImportConfirmDialog } from "@/components/ui/import-confirm-dialog"
import { Input } from "@/components/ui/input"
import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import type { UsuarioLista } from "@/services/usuario.service"
import type { ActivoResumen } from "@/types/activo"
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
  observacion: string
}

export type AssignmentFormMode = "create" | "edit"

interface AssignmentFormDialogProps {
  open: boolean
  draft: AssignmentFormDraft
  mode?: AssignmentFormMode
  usuarios: UsuarioLista[]
  activos: ActivoResumen[]
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof AssignmentFormDraft>(
    field: K,
    value: AssignmentFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onImport?: (records: AssignmentFormDraft[]) => void
}

function buildSections(
  usuarios: UsuarioLista[],
  activos: ActivoResumen[],
  isEdit: boolean,
): FormSection<AssignmentFormDraft>[] {
  const assetOptions = activos.map((activo) => ({
    value: String(activo.id),
    label: [activo.claveActivo ?? `#${activo.id}`, activo.tipo, activo.marca]
      .filter(Boolean)
      .join(" · "),
  }))

  const userOptions = usuarios.map((usuario) => ({
    value: usuario.id,
    label: `${usuario.id} · ${usuario.nombre}`,
  }))

  const assetField = isEdit
    ? {
        key: "activoId" as const,
        label: "Activo del inventario",
        colSpan: "sm:col-span-2",
        render: (value: AssignmentFormDraft[keyof AssignmentFormDraft]) => {
          const option = assetOptions.find((item) => item.value === value)
          return (
            <Input
              readOnly
              value={option?.label ?? "—"}
              className="h-8 border-white/70 bg-muted/60 text-[13px] text-muted-foreground shadow-sm dark:border-white/10 dark:bg-slate-900/55"
            />
          )
        },
      }
    : {
        key: "activoId" as const,
        label: "Activo del inventario",
        type: "select" as const,
        options: assetOptions,
        colSpan: "sm:col-span-2",
        required: true,
      }

  const userField = isEdit
    ? {
        key: "usuarioId" as const,
        label: "Usuario asignado",
        colSpan: "sm:col-span-2",
        render: (value: AssignmentFormDraft[keyof AssignmentFormDraft]) => {
          const option = userOptions.find((item) => item.value === value)
          return (
            <Input
              readOnly
              value={option?.label ?? "—"}
              className="h-8 border-white/70 bg-muted/60 text-[13px] text-muted-foreground shadow-sm dark:border-white/10 dark:bg-slate-900/55"
            />
          )
        },
      }
    : {
        key: "usuarioId" as const,
        label: "Usuario asignado",
        type: "select" as const,
        options: userOptions,
        colSpan: "sm:col-span-2",
        required: true,
      }

  return [
    {
      title: "Equipo y Activo",
      color: "primary",
      gridCols: "sm:grid-cols-2",
      fields: [
        assetField,
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
      title: "Usuario Asignado",
      color: "cyan",
      gridCols: "sm:grid-cols-2",
      fields: [userField],
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
}

export function AssignmentFormDialog({
  open,
  draft,
  mode = "create",
  usuarios,
  activos,
  onOpenChange,
  onChange,
  onSubmit,
  onImport,
}: AssignmentFormDialogProps) {
  const isEdit = mode === "edit"
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<AssignmentFormDraft[]>([])
  const importInputRef = useRef<HTMLInputElement>(null)

  const sections = useMemo(
    () => buildSections(usuarios, activos, isEdit),
    [usuarios, activos, isEdit],
  )

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

      const importedDrafts = parseAssignmentCsv(await file.text(), {
        activos,
        usuarios,
      })
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
