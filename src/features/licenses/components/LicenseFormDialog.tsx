import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Download, Eye, EyeOff, KeyRound, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ImportConfirmDialog } from "@/components/ui/import-confirm-dialog"
import { Input } from "@/components/ui/input"
import {
  FormDialog,
  type FormSection,
} from "@/components/ui/form-dialog"
import type { LicenseFormDraft } from "@/features/licenses/types/license"
import {
  downloadLicenseCsvTemplate,
  parseLicenseCsv,
} from "@/features/licenses/utils/license-import"

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
  onImport?: (records: LicenseFormDraft[]) => void
  onDelete?: () => void
}

function LicenseKeyField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        id="clave"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="BRUNO-LICENSE-SECRET-12345"
        autoComplete="off"
        className="h-8 border-white/70 bg-white/80 pr-9 text-[13px] text-foreground shadow-sm placeholder:text-muted-foreground/80 dark:border-white/10 dark:bg-slate-900/55"
      />
      <button
        type="button"
        className="absolute inset-y-0 right-1 flex w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-3.5" />
        ) : (
          <Eye aria-hidden="true" className="size-3.5" />
        )}
      </button>
    </div>
  )
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
        placeholder: "BRUNO-LICENSE-SECRET-12345",
        render: (value, onChange) => (
          <LicenseKeyField
            value={value as string}
            onChange={onChange as (value: string) => void}
          />
        ),
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
  onImport,
  onDelete,
}: LicenseFormDialogProps) {
  const isEdit = mode === "edit"
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<LicenseFormDraft[]>([])
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

      const importedDrafts = parseLicenseCsv(await file.text())
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
        formActions={
          mode === "create" && onImport ? (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                aria-label="Seleccionar archivo CSV de licencias"
                onChange={(event) => void handleImportFile(event)}
              />
              <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Importar licencias</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Completa la plantilla CSV; después selecciona el archivo para revisar el lote antes de registrarlo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl px-3 text-xs font-semibold"
                    onClick={downloadLicenseCsvTemplate}
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
        recordLabel="licencia"
        recordsLabel="licencias"
        emptyMessage="El archivo contiene 0 licencias. Completa la plantilla CSV con al menos un registro para continuar."
        onOpenChange={(nextOpen) => {
          setIsImportConfirmOpen(nextOpen)
          if (!nextOpen) setPendingImport([])
        }}
        onConfirm={handleConfirmImport}
      />
    </>
  )
}
