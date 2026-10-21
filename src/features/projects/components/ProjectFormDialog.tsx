import { useMemo, type FormEvent } from "react"
import { FolderKanban } from "lucide-react"

import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import type { ResumenCatalogo } from "@/services/usuario.service"
import type {
  EstadoProyecto,
  ProjectFormDraft,
} from "@/features/projects/types/project"

export interface ResponsableOpcion {
  id: string
  nombre: string
  email: string | null
}
import {
  ESTADO_PROYECTO_LABELS,
  ESTADOS_PROYECTO,
  PRIORIDADES,
  PRIORIDAD_LABELS,
} from "@/features/projects/utils/project-display"

interface ProjectFormDialogProps {
  open: boolean
  draft: ProjectFormDraft
  mode?: "create" | "edit"
  usuarios: ResponsableOpcion[]
  departamentos: ResumenCatalogo[]
  estadosPermitidos?: EstadoProyecto[]
  isSaving?: boolean
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof ProjectFormDraft>(
    field: K,
    value: ProjectFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
}

const buildSections = (
  usuarios: ResponsableOpcion[],
  departamentos: ResumenCatalogo[],
  estados: EstadoProyecto[],
): FormSection<ProjectFormDraft>[] => [
  {
    title: "Datos generales",
    color: "primary",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "nombre",
        label: "Nombre del proyecto",
        type: "text",
        required: true,
        colSpan: "sm:col-span-2",
        placeholder: "Ej. Migración de infraestructura",
      },
      {
        key: "descripcion",
        label: "Descripción",
        type: "textarea",
        rows: 3,
        colSpan: "sm:col-span-2",
        placeholder: "Objetivo y alcance del proyecto...",
      },
      {
        key: "estado",
        label: "Estado",
        type: "select",
        required: true,
        options: estados.map((estado) => ({
          value: estado,
          label: ESTADO_PROYECTO_LABELS[estado],
        })),
      },
      {
        key: "prioridad",
        label: "Prioridad",
        type: "select",
        required: true,
        options: PRIORIDADES.map((prioridad) => ({
          value: prioridad,
          label: PRIORIDAD_LABELS[prioridad],
        })),
      },
    ],
  },
  {
    title: "Fechas y presupuesto",
    color: "cyan",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "fechaInicio",
        label: "Fecha de inicio",
        type: "date",
        required: true,
      },
      {
        key: "fechaFinPlanificada",
        label: "Fecha fin planificada",
        type: "date",
        required: true,
      },
      {
        key: "fechaFinReal",
        label: "Fecha fin real (opcional)",
        type: "date",
      },
      {
        key: "presupuesto",
        label: "Presupuesto (MXN)",
        type: "number",
        step: "0.01",
        placeholder: "0.00",
      },
    ],
  },
  {
    title: "Responsable y área",
    color: "violet",
    gridCols: "sm:grid-cols-2",
    fields: [
      {
        key: "responsableId",
        label: "Responsable",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Selecciona un responsable" },
          ...usuarios.map((usuario) => ({
            value: usuario.id,
            label: usuario.email
              ? `${usuario.nombre} · ${usuario.email}`
              : usuario.nombre,
          })),
        ],
      },
      {
        key: "departamentoId",
        label: "Departamento",
        type: "select",
        options: [
          { value: "", label: "Sin departamento" },
          ...departamentos.map((departamento) => ({
            value: String(departamento.id),
            label: departamento.nombre,
          })),
        ],
      },
    ],
  },
]

export function ProjectFormDialog({
  open,
  draft,
  mode = "create",
  usuarios,
  departamentos,
  estadosPermitidos,
  isSaving = false,
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
}: ProjectFormDialogProps) {
  const isEdit = mode === "edit"
  const estados = estadosPermitidos ?? ESTADOS_PROYECTO
  const sections = useMemo(
    () => buildSections(usuarios, departamentos, estados),
    [usuarios, departamentos, estados],
  )

  return (
    <FormDialog<ProjectFormDraft>
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Proyecto" : "Nuevo Proyecto"}
      description={
        isEdit
          ? "Actualiza los datos del proyecto seleccionado."
          : "Registra un nuevo proyecto y su planificación."
      }
      icon={<FolderKanban aria-hidden="true" className="size-5" />}
      draft={draft}
      sections={sections}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
      deleteLabel="Eliminar"
      submitDisabled={isSaving}
      submitLabel={isEdit ? "Guardar Cambios" : "Crear Proyecto"}
      size="wide"
    />
  )
}
