import { useMemo, type FormEvent } from "react"
import { Ban, CheckCircle2, Play, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import {
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from "@/features/maintenance/utils/maintenance-display"
import type {
  MaintenanceFormDraft,
  MaintenanceStatus,
} from "@/features/maintenance/types/maintenance"
import type { ActivoResumen } from "@/types/activo"
import type { UsuarioLista } from "@/services/usuario.service"

interface MaintenanceFormDialogProps {
  open: boolean
  draft: MaintenanceFormDraft
  mode?: "create" | "edit"
  estado?: MaintenanceStatus
  activos: ActivoResumen[]
  tecnicos: UsuarioLista[]
  isSaving?: boolean
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof MaintenanceFormDraft>(
    field: K,
    value: MaintenanceFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
  onIniciar?: () => void
  onCompletar?: () => void
  onCancelar?: () => void
}

const etiquetaActivo = (activo: ActivoResumen): string => {
  const clave = activo.cb23 ?? activo.claveActivo ?? `#${activo.id}`
  return `${clave} · ${activo.tipo}`
}

const etiquetaTecnico = (tecnico: UsuarioLista): string =>
  tecnico.email ? `${tecnico.nombre} · ${tecnico.email}` : tecnico.nombre

const buildSections = (
  activos: ActivoResumen[],
  tecnicos: UsuarioLista[],
  esTerminal: boolean,
  esEnProceso: boolean,
  activoActualId: string,
): FormSection<MaintenanceFormDraft>[] => {
  const activosDisponibles = activos.filter(
    (activo) =>
      activo.estado !== "DE_BAJA" || String(activo.id) === activoActualId,
  )

  return [
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
          disabled: esTerminal || esEnProceso,
          options: [
            { value: "", label: "Selecciona un activo" },
            ...activosDisponibles.map((activo) => ({
              value: String(activo.id),
              label: etiquetaActivo(activo),
            })),
          ],
        },
        {
          key: "tipo",
          label: "Tipo de mantenimiento",
          type: "select",
          required: true,
          disabled: esTerminal,
          options: Object.entries(MAINTENANCE_TYPE_LABELS).map(
            ([value, label]) => ({ value, label }),
          ),
        },
        {
          key: "prioridad",
          label: "Prioridad",
          type: "select",
          required: true,
          disabled: esTerminal,
          options: Object.entries(MAINTENANCE_PRIORITY_LABELS).map(
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
          key: "tecnicoId",
          label: "Técnico responsable",
          type: "select",
          required: true,
          disabled: esTerminal,
          options: [
            { value: "", label: "Selecciona un técnico" },
            ...tecnicos.map((tecnico) => ({
              value: tecnico.id,
              label: etiquetaTecnico(tecnico),
            })),
          ],
        },
        {
          key: "costo",
          label: "Costo estimado (MXN)",
          type: "number",
          placeholder: "0.00",
          disabled: esTerminal,
        },
        {
          key: "fechaProgramada",
          label: "Fecha programada",
          placeholder: "AAAA-MM-DD",
          required: true,
          disabled: esTerminal,
        },
        {
          key: "fechaRealizada",
          label: "Fecha realizada",
          placeholder: "AAAA-MM-DD (opcional)",
          disabled: esTerminal,
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
          disabled: esTerminal,
        },
      ],
    },
  ]
}

export function MaintenanceFormDialog({
  open,
  draft,
  mode = "create",
  estado,
  activos,
  tecnicos,
  isSaving = false,
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
  onIniciar,
  onCompletar,
  onCancelar,
}: MaintenanceFormDialogProps) {
  const isEdit = mode === "edit"
  const esTerminal = estado === "COMPLETADO" || estado === "CANCELADO"
  const esEnProceso = estado === "EN_PROCESO"
  const sections = useMemo(
    () =>
      buildSections(activos, tecnicos, esTerminal, esEnProceso, draft.activoId),
    [activos, tecnicos, esTerminal, esEnProceso, draft.activoId],
  )

  const mostrarIniciar = estado === "PROGRAMADO" && Boolean(onIniciar)
  const mostrarCompletar = esEnProceso && Boolean(onCompletar)
  const mostrarCancelar =
    (estado === "PROGRAMADO" ||
      estado === "EN_PROCESO" ||
      estado === "COMPLETADO") &&
    Boolean(onCancelar)

  const formActions = isEdit ? (
    <div className="flex flex-wrap items-center gap-2">
      {mostrarIniciar && (
        <Button
          type="button"
          onClick={onIniciar}
          disabled={isSaving}
          className="h-9 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-3 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)] hover:brightness-110"
        >
          <Play aria-hidden="true" className="size-3.5" />
          Iniciar
        </Button>
      )}
      {mostrarCompletar && (
        <Button
          type="button"
          onClick={onCompletar}
          disabled={isSaving}
          className="h-9 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
        >
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          Completar
        </Button>
      )}
      {mostrarCancelar && (
        <Button
          type="button"
          onClick={onCancelar}
          disabled={isSaving}
          className="h-9 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
        >
          <Ban aria-hidden="true" className="size-3.5" />
          Cancelar orden
        </Button>
      )}
    </div>
  ) : undefined

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
      formActions={formActions}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
      deleteLabel="Eliminar"
      deleteDisabled={esEnProceso}
      deleteDisabledTitle="No se puede eliminar una orden en proceso; cancélala primero."
      submitDisabled={esTerminal || isSaving}
      submitLabel={isEdit ? "Guardar Cambios" : "Crear Orden"}
    />
  )
}
