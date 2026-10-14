import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Eye, EyeOff, UserRound } from "lucide-react"

import {
  FormDialog,
  type FormField,
  type FormSection,
  type SelectOption,
} from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import PasswordStrengthIndicator from "@/features/passwords/components/PasswordStrengthIndicator"
import type { UserFormDraft } from "@/features/user/types/user"
import type { Catalogos } from "@/services/usuario.service"

interface UserFormDialogProps {
  open: boolean
  draft: UserFormDraft
  mode?: "create" | "edit"
  catalogs: Catalogos
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof UserFormDraft>(
    field: K,
    value: UserFormDraft[K],
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete?: () => void
  /** Deshabilita el envío mientras el formulario no es válido o hay una operación en curso */
  submitDisabled?: boolean
}

const fieldInputClass =
  "h-8 border-white/70 bg-white/80 text-[13px] text-foreground shadow-sm placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/55"

const selectClass =
  "h-8 w-full cursor-pointer rounded-xl border border-white/70 bg-white/80 px-3 text-[13px] text-foreground shadow-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55"

function UserPasswordField({
  value,
  onChange,
  optional = false,
}: {
  value: string
  onChange: (value: string) => void
  optional?: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          id="password"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={optional ? "Dejar vacío para conservar" : "Mínimo 8 caracteres"}
          autoComplete="new-password"
          required={!optional}
          aria-describedby="password-strength-help"
          className={`${fieldInputClass} pr-9`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-1 flex w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
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
      {optional ? (
        <p className="text-xs text-muted-foreground">
          Déjala vacía para conservar la contraseña actual.
        </p>
      ) : null}
      <PasswordStrengthIndicator password={value} />
    </div>
  )
}

function opcionesCatalogo(
  items: { id: number; nombre: string }[],
  labelVacio: string,
): SelectOption[] {
  return [
    { value: "", label: labelVacio },
    ...items.map((item) => ({ value: String(item.id), label: item.nombre })),
  ]
}

function buildSections(
  catalogs: Catalogos,
  isEdit: boolean,
): FormSection<UserFormDraft>[] {
  const identificacion: FormField<UserFormDraft>[] = [
    {
      key: "nombre",
      label: "Nombre completo",
      placeholder: "Ej. Ana Martínez López",
      required: true,
      colSpan: "sm:col-span-2",
    },
    {
      key: "id",
      label: "ID / Número de empleado",
      required: true,
      render: (value, onChange) => (
        <Input
          id="id"
          type="text"
          value={value as string}
          disabled={isEdit}
          readOnly={isEdit}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ej. EMP-001"
          className={fieldInputClass}
        />
      ),
    },
    {
      key: "email",
      label: "Correo electrónico",
      type: "email",
      placeholder: "ana.martinez@empresa.com",
    },
  ]

  const organizacion: FormField<UserFormDraft>[] = [
    {
      key: "departamentoId",
      label: "Departamento",
      type: "select",
      options: opcionesCatalogo(catalogs.departamentos, "Sin asignar"),
    },
    {
      key: "ubicacionId",
      label: "Ubicación",
      type: "select",
      options: opcionesCatalogo(catalogs.ubicaciones, "Sin asignar"),
    },
    {
      key: "puestoId",
      label: "Puesto",
      type: "select",
      options: opcionesCatalogo(catalogs.puestos, "Sin asignar"),
    },
    {
      key: "tipoUsuarioId",
      label: "Tipo de usuario",
      type: "select",
      options: opcionesCatalogo(catalogs.tiposUsuario, "Sin asignar"),
    },
  ]

  const acceso: FormField<UserFormDraft>[] = [
    {
      key: "rolId",
      label: "Rol del sistema",
      type: "select",
      options: opcionesCatalogo(catalogs.roles, "Sin rol asignado"),
    },
  ]

  if (isEdit) {
    acceso.push({
      key: "activo",
      label: "Estado",
      render: (value, onChange) => (
        <select
          id="activo"
          value={String(value)}
          onChange={(event) => onChange(event.target.value === "true")}
          className={selectClass}
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      ),
    })
    acceso.push({
      key: "password",
      label: "Nueva contraseña (opcional)",
      colSpan: "sm:col-span-2",
      render: (value, onChange) => (
        <UserPasswordField
          value={value as string}
          onChange={onChange as (value: string) => void}
          optional
        />
      ),
    })
  } else {
    acceso.push({
      key: "password",
      label: "Contraseña de acceso",
      required: true,
      colSpan: "sm:col-span-2",
      render: (value, onChange) => (
        <UserPasswordField
          value={value as string}
          onChange={onChange as (value: string) => void}
        />
      ),
    })
  }

  const vigencia: FormField<UserFormDraft>[] = [
    {
      key: "fechaInicio",
      label: "Fecha de inicio",
      type: "text",
      placeholder: "AAAA-MM-DD (Ej. 2026-01-01)",
    },
    {
      key: "fechaFin",
      label: "Fecha de fin",
      type: "text",
      placeholder: "AAAA-MM-DD (Ej. 2026-12-31)",
    },
  ]

  return [
    {
      title: "Identificación del Colaborador",
      color: "primary",
      gridCols: "sm:grid-cols-2",
      fields: identificacion,
    },
    {
      title: "Organización",
      color: "cyan",
      gridCols: "sm:grid-cols-2",
      fields: organizacion,
    },
    {
      title: "Acceso y Seguridad",
      color: "violet",
      gridCols: "sm:grid-cols-2",
      fields: acceso,
    },
    {
      title: "Vigencia",
      color: "amber",
      gridCols: "sm:grid-cols-2",
      fields: vigencia,
    },
  ]
}

export function UserFormDialog({
  open,
  draft,
  mode = "create",
  catalogs,
  onOpenChange,
  onChange,
  onSubmit,
  onDelete,
  submitDisabled = false,
}: UserFormDialogProps) {
  const isEdit = mode === "edit"
  const sections = useMemo(
    () => buildSections(catalogs, isEdit),
    [catalogs, isEdit],
  )

  return (
    <FormDialog<UserFormDraft>
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar Usuario" : "Registrar Usuario"}
      description={
        isEdit
          ? "Modifica los datos del colaborador registrado en el sistema."
          : "Ingresa la información requerida para agregar un nuevo usuario."
      }
      icon={<UserRound aria-hidden="true" className="size-5" />}
      draft={draft}
      sections={sections}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
      deleteLabel="Eliminar"
      submitLabel={isEdit ? "Guardar Cambios" : "Crear Usuario"}
      submitDisabled={submitDisabled}
    />
  )
}
