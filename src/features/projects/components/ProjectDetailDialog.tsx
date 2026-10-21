import { useEffect, useState } from "react"
import { FolderKanban, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { AttachmentsSection } from "@/features/attachments/components/AttachmentsSection"
import { ProjectHoursTab } from "@/features/projects/components/tabs/ProjectHoursTab"
import { ProjectMembersTab } from "@/features/projects/components/tabs/ProjectMembersTab"
import { ProjectMilestonesTab } from "@/features/projects/components/tabs/ProjectMilestonesTab"
import { ProjectSummaryTab } from "@/features/projects/components/tabs/ProjectSummaryTab"
import { ProjectTasksTab } from "@/features/projects/components/tabs/ProjectTasksTab"
import { mensajeProyectoError } from "@/features/projects/services/project-api"
import { obtenerProyecto } from "@/features/projects/services/proyecto.service"
import type {
  Proyecto,
  ProyectoDetalle,
} from "@/features/projects/types/project"
import {
  ESTADO_PROYECTO_BADGE_CLASS,
  ESTADO_PROYECTO_LABELS,
} from "@/features/projects/utils/project-display"
import type { UsuarioLista } from "@/services/usuario.service"

interface ProjectDetailDialogProps {
  proyectoId: number | null
  open: boolean
  usuarios: UsuarioLista[]
  puedeEditar: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (proyecto: Proyecto) => void
  onProjectChanged: () => void
}

export function ProjectDetailDialog({
  proyectoId,
  open,
  usuarios,
  puedeEditar,
  onOpenChange,
  onEdit,
  onProjectChanged,
}: ProjectDetailDialogProps) {
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!open || proyectoId === null) return

    let cancelado = false

    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const detalle = await obtenerProyecto(proyectoId!)
        if (!cancelado) setProyecto(detalle)
      } catch (err) {
        if (!cancelado) {
          setProyecto(null)
          setError(mensajeProyectoError(err))
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargar()

    return () => {
      cancelado = true
    }
  }, [open, proyectoId, reloadKey])

  const refrescar = () => {
    setReloadKey((key) => key + 1)
    onProjectChanged()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,880px)] w-[min(96vw,1600px)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border border-border/70 bg-background p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderKanban aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {proyecto ? proyecto.nombre : "Detalle del proyecto"}
              </DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                {proyecto ? (
                  <>
                    <span className="font-mono">{proyecto.codigo}</span>
                    <Badge
                      className={ESTADO_PROYECTO_BADGE_CLASS[proyecto.estado]}
                    >
                      {ESTADO_PROYECTO_LABELS[proyecto.estado]}
                    </Badge>
                  </>
                ) : (
                  "Consulta la información y los subrecursos del proyecto."
                )}
              </DialogDescription>
            </div>
            {proyecto && puedeEditar ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(proyecto)}
                className="h-9 rounded-xl px-3 text-xs font-semibold"
              >
                <Pencil aria-hidden="true" className="size-3.5" />
                Editar
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        {loading && !proyecto ? (
          <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
            Cargando proyecto...
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((key) => key + 1)}
              className="h-9 rounded-xl px-3 text-xs font-semibold"
            >
              Reintentar
            </Button>
          </div>
        ) : proyecto ? (
          <Tabs
            key={proyecto.id}
            defaultValue="resumen"
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="shrink-0 overflow-x-auto border-b border-border/80 px-4 py-2.5 sm:px-6">
              <TabsList
                variant="line"
                aria-label="Secciones del detalle del proyecto"
                className="w-max gap-1"
              >
                <TabsTrigger value="resumen" className="shrink-0 px-3">
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="miembros" className="shrink-0 px-3">
                  Miembros ({proyecto.miembros.length})
                </TabsTrigger>
                <TabsTrigger value="tareas" className="shrink-0 px-3">
                  Tareas
                </TabsTrigger>
                <TabsTrigger value="hitos" className="shrink-0 px-3">
                  Hitos
                </TabsTrigger>
                <TabsTrigger value="horas" className="shrink-0 px-3">
                  Horas
                </TabsTrigger>
                <TabsTrigger value="adjuntos" className="shrink-0 px-3">
                  Adjuntos
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
              <TabsContent value="resumen" className="m-0">
                <ProjectSummaryTab proyecto={proyecto} />
              </TabsContent>
              <TabsContent value="miembros" className="m-0">
                <ProjectMembersTab
                  proyecto={proyecto}
                  usuarios={usuarios}
                  puedeEditar={puedeEditar}
                  onRefresh={refrescar}
                />
              </TabsContent>
              <TabsContent value="tareas" className="m-0">
                <ProjectTasksTab
                  proyecto={proyecto}
                  puedeEditar={puedeEditar}
                  onRefresh={refrescar}
                />
              </TabsContent>
              <TabsContent value="hitos" className="m-0">
                <ProjectMilestonesTab
                  proyecto={proyecto}
                  puedeEditar={puedeEditar}
                  onRefresh={refrescar}
                />
              </TabsContent>
              <TabsContent value="horas" className="m-0">
                <ProjectHoursTab
                  proyecto={proyecto}
                  puedeEditar={puedeEditar}
                  onRefresh={refrescar}
                />
              </TabsContent>
              <TabsContent value="adjuntos" className="m-0">
                <AttachmentsSection
                  entidadTipo="PROYECTO"
                  entidadId={String(proyecto.id)}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
