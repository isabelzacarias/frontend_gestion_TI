import type { ReactNode } from "react"
import { UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DetailDialog, type DetailSection } from "@/components/ui/detail-dialog"
import { permisoLabel } from "@/features/user/data/permissions"
import type { UsuarioLista } from "@/services/usuario.service"

import { catalogoNombre, formatearFecha } from "../utils/user-format"

interface UserDetailDialogProps {
  usuario: UsuarioLista | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  editLabel?: string
  editIcon?: ReactNode
}

function PermisosBadges({
  permisos,
  vacio,
}: {
  permisos: string[] | undefined
  vacio: string
}) {
  if (!permisos || permisos.length === 0) {
    return <span className="text-sm text-muted-foreground">{vacio}</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {permisos.map((permiso) => (
        <Badge
          key={permiso}
          variant="outline"
          className="px-2 py-0.5 text-xs font-medium"
        >
          {permisoLabel(permiso)}
        </Badge>
      ))}
    </div>
  )
}

export function UserDetailDialog({
  usuario,
  open,
  onOpenChange,
  onEdit,
  editLabel,
  editIcon,
}: UserDetailDialogProps) {
  if (!usuario) return null

  const sections: DetailSection[] = [
    {
      title: "Información general",
      color: "primary",
      fields: [
        { key: "id", label: "ID", value: usuario.id },
        {
          key: "nombre",
          label: "Nombre completo",
          value: usuario.nombre,
          colSpan: "sm:col-span-2",
        },
        { key: "email", label: "Correo electrónico", value: usuario.email ?? "—" },
        {
          key: "activo",
          label: "Estado",
          value: usuario.activo ? (
            <Badge className="border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400">
              Activa
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-slate-400/30 bg-slate-400/10 font-medium text-slate-600 dark:text-slate-400"
            >
              Inactiva
            </Badge>
          ),
        },
      ],
    },
    {
      title: "Organización",
      color: "cyan",
      fields: [
        {
          key: "departamento",
          label: "Departamento",
          value: catalogoNombre(usuario.departamento),
        },
        {
          key: "ubicacion",
          label: "Ubicación",
          value: catalogoNombre(usuario.ubicacion),
        },
        {
          key: "puesto",
          label: "Puesto",
          value: catalogoNombre(usuario.puesto),
        },
        {
          key: "tipoUsuario",
          label: "Tipo de usuario",
          value: catalogoNombre(usuario.tipoUsuario),
        },
        { key: "rol", label: "Rol", value: catalogoNombre(usuario.rol) },
      ],
    },
    {
      title: "Fechas",
      color: "violet",
      fields: [
        {
          key: "fechaInicio",
          label: "Fecha de inicio",
          value: formatearFecha(usuario.fechaInicio),
        },
        {
          key: "fechaFin",
          label: "Fecha de fin",
          value: formatearFecha(usuario.fechaFin),
        },
      ],
    },
    {
      title: "Permisos",
      color: "amber",
      fields: [
        {
          key: "permisosExtra",
          label: "Adicionales (concedidos)",
          colSpan: "sm:col-span-2",
          value: <PermisosBadges permisos={usuario.permisosExtra} vacio="Sin permisos adicionales" />,
        },
        {
          key: "permisosRevocados",
          label: "Revocados del rol",
          colSpan: "sm:col-span-2",
          value: (
            <PermisosBadges
              permisos={usuario.permisosRevocados}
              vacio="Sin permisos revocados"
            />
          ),
        },
      ],
    },
  ]

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={usuario.nombre}
      description="Consulta detallada del usuario."
      icon={<UserRound className="size-6 text-white" />}
      sections={sections}
      onEdit={onEdit}
      editLabel={editLabel}
      editIcon={editIcon}
    />
  )
}
