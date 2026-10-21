import { useMemo, useState, type FormEvent } from "react"
import { Plus, ShieldCheck, Trash2, UserCog } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { FormDialog, type FormSection } from "@/components/ui/form-dialog"
import {
  ProyectoApiError,
  mensajeProyectoError,
} from "@/features/projects/services/project-api"
import {
  actualizarRolMiembro,
  agregarMiembro,
  eliminarMiembro,
} from "@/features/projects/services/proyecto.service"
import type {
  MemberFormDraft,
  ProyectoDetalle,
  ProyectoMiembro,
} from "@/features/projects/types/project"
import {
  ROLES_PROYECTO,
  ROL_PROYECTO_BADGE_CLASS,
  ROL_PROYECTO_LABELS,
} from "@/features/projects/utils/project-display"
import type { UsuarioLista } from "@/services/usuario.service"

interface ProjectMembersTabProps {
  proyecto: ProyectoDetalle
  usuarios: UsuarioLista[]
  puedeEditar: boolean
  onRefresh: () => void
}

const createEmptyDraft = (): MemberFormDraft => ({
  usuarioId: "",
  rol: "DESARROLLADOR",
})

const toDraft = (miembro: ProyectoMiembro): MemberFormDraft => ({
  usuarioId: miembro.usuarioId,
  rol: miembro.rol,
})

export function ProjectMembersTab({
  proyecto,
  usuarios,
  puedeEditar,
  onRefresh,
}: ProjectMembersTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<MemberFormDraft>(createEmptyDraft())
  const [selected, setSelected] = useState<ProyectoMiembro | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProyectoMiembro | null>(null)
  const [sinPermiso, setSinPermiso] = useState(false)

  const miembrosIds = useMemo(
    () => new Set(proyecto.miembros.map((miembro) => miembro.usuarioId)),
    [proyecto.miembros],
  )

  const usuariosDisponibles = useMemo(
    () => usuarios.filter((usuario) => !miembrosIds.has(usuario.id)),
    [usuarios, miembrosIds],
  )

  const sections: FormSection<MemberFormDraft>[] = useMemo(
    () => [
      {
        title: "Miembro del proyecto",
        color: "primary",
        gridCols: "sm:grid-cols-2",
        fields: [
          {
            key: "usuarioId",
            label: "Usuario",
            type: "select",
            required: true,
            disabled: isEditOpen,
            options: [
              { value: "", label: "Selecciona un usuario" },
              ...(isEditOpen && selected
                ? [
                    {
                      value: selected.usuarioId,
                      label: selected.usuario.nombre,
                    },
                  ]
                : usuariosDisponibles.map((usuario) => ({
                    value: usuario.id,
                    label: usuario.email
                      ? `${usuario.nombre} · ${usuario.email}`
                      : usuario.nombre,
                  }))),
            ],
          },
          {
            key: "rol",
            label: "Rol en el proyecto",
            type: "select",
            required: true,
            options: ROLES_PROYECTO.map((rol) => ({
              value: rol,
              label: ROL_PROYECTO_LABELS[rol],
            })),
          },
        ],
      },
    ],
    [isEditOpen, selected, usuariosDisponibles],
  )

  const handleDraftChange = <K extends keyof MemberFormDraft>(
    field: K,
    value: MemberFormDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.usuarioId) {
      toast.error("Selecciona un usuario.")
      return
    }

    setIsSaving(true)
    try {
      await agregarMiembro(proyecto.id, {
        usuarioId: draft.usuarioId,
        rol: draft.rol as ProyectoMiembro["rol"],
      })
      setIsAddOpen(false)
      toast.success("Miembro agregado correctamente.")
      onRefresh()
    } catch (error) {
      if (error instanceof ProyectoApiError && error.status === 403) {
        setSinPermiso(true)
      }
      toast.error(mensajeProyectoError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return

    setIsSaving(true)
    try {
      await actualizarRolMiembro(
        proyecto.id,
        selected.usuarioId,
        draft.rol as ProyectoMiembro["rol"],
      )
      setIsEditOpen(false)
      toast.success("Rol actualizado correctamente.")
      onRefresh()
    } catch (error) {
      if (error instanceof ProyectoApiError && error.status === 403) {
        setSinPermiso(true)
      }
      toast.error(mensajeProyectoError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsSaving(true)
    try {
      await eliminarMiembro(proyecto.id, deleteTarget.usuarioId)
      setDeleteTarget(null)
      toast.success("Miembro eliminado del proyecto.")
      onRefresh()
    } catch (error) {
      toast.error(mensajeProyectoError(error))
    } finally {
      setIsSaving(false)
    }
  }

  const puedeGestionar = puedeEditar && !sinPermiso

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {proyecto.miembros.length} miembro(s) en el proyecto.
        </p>
        {puedeGestionar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(createEmptyDraft())
              setSelected(null)
              setIsAddOpen(true)
            }}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Agregar miembro
          </Button>
        )}
      </div>

      {proyecto.miembros.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Este proyecto aún no tiene miembros.
        </p>
      ) : (
        <div className="space-y-2">
          {proyecto.miembros.map((miembro) => (
            <div
              key={miembro.usuarioId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {miembro.usuario.nombre}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {miembro.usuario.email ?? miembro.usuarioId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={ROL_PROYECTO_BADGE_CLASS[miembro.rol]}>
                  {ROL_PROYECTO_LABELS[miembro.rol]}
                </Badge>
                {puedeGestionar && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Cambiar rol"
                      aria-label={`Cambiar rol de ${miembro.usuario.nombre}`}
                      onClick={() => {
                        setSelected(miembro)
                        setDraft(toDraft(miembro))
                        setIsEditOpen(true)
                      }}
                      className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
                    >
                      <UserCog aria-hidden="true" className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Quitar miembro"
                      aria-label={`Quitar a ${miembro.usuario.nombre}`}
                      onClick={() => setDeleteTarget(miembro)}
                      className="h-8 rounded-xl px-2.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDialog<MemberFormDraft>
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Agregar miembro"
        description="Selecciona el usuario y su rol dentro del proyecto."
        draft={draft}
        sections={sections}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleAdd(event)}
        submitDisabled={isSaving}
        submitLabel="Agregar Miembro"
        size="wide"
      />

      <FormDialog<MemberFormDraft>
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Cambiar rol del miembro"
        description="Actualiza el rol del usuario dentro del proyecto."
        draft={draft}
        sections={sections}
        onChange={handleDraftChange}
        onSubmit={(event) => void handleEdit(event)}
        submitDisabled={isSaving}
        submitLabel="Guardar Cambios"
        size="wide"
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Quitar miembro del proyecto"
        itemName={deleteTarget?.usuario.nombre ?? "este miembro"}
        description="El usuario dejará de formar parte del proyecto. Esta acción no se puede deshacer."
        confirmLabel="Quitar Miembro"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
