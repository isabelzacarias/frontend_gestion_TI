import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import type { ProyectoDetalle } from "@/features/projects/types/project"
import {
  ESTADO_PROYECTO_BADGE_CLASS,
  ESTADO_PROYECTO_LABELS,
  PRIORIDAD_BADGE_CLASS,
  PRIORIDAD_LABELS,
  formatFecha,
  formatHoras,
  formatPresupuesto,
} from "@/features/projects/utils/project-display"

interface ProjectSummaryTabProps {
  proyecto: ProyectoDetalle
}

function Dato({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="break-words text-sm text-foreground">{value}</div>
    </div>
  )
}

export function ProjectSummaryTab({ proyecto }: ProjectSummaryTabProps) {
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-border/70 bg-background/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={ESTADO_PROYECTO_BADGE_CLASS[proyecto.estado]}>
            {ESTADO_PROYECTO_LABELS[proyecto.estado]}
          </Badge>
          <Badge className={PRIORIDAD_BADGE_CLASS[proyecto.prioridad]}>
            {PRIORIDAD_LABELS[proyecto.prioridad]}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            {proyecto.codigo}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Dato label="Responsable" value={proyecto.responsable.nombre} />
          <Dato
            label="Departamento"
            value={proyecto.departamento?.nombre ?? "Sin departamento"}
          />
          <Dato
            label="Presupuesto"
            value={formatPresupuesto(proyecto.presupuesto)}
          />
          <Dato
            label="Inicio"
            value={formatFecha(proyecto.fechaInicio)}
          />
          <Dato
            label="Fin planificado"
            value={formatFecha(proyecto.fechaFinPlanificada)}
          />
          <Dato
            label="Fin real"
            value={formatFecha(proyecto.fechaFinReal)}
          />
        </div>

        {proyecto.descripcion ? (
          <div className="mt-3 border-t border-border/60 pt-3">
            <Dato label="Descripción" value={proyecto.descripcion} />
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border/70 bg-background/50 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
            Progreso
          </h3>
          <span className="text-sm font-semibold text-foreground">
            {proyecto.progreso}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary-600),var(--secondary-500))] transition-all"
            style={{ width: `${Math.max(0, Math.min(100, proyecto.progreso))}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Dato
            label="Tareas"
            value={proyecto.resumenTareas.total}
          />
          <Dato
            label="Completadas"
            value={proyecto.resumenTareas.completadas}
          />
          <Dato
            label="Pendientes"
            value={proyecto.resumenTareas.pendientes}
          />
          <Dato
            label="En progreso"
            value={proyecto.resumenTareas.enProgreso}
          />
          <Dato
            label="Canceladas"
            value={proyecto.resumenTareas.canceladas}
          />
          <Dato
            label="Subtareas"
            value={`${proyecto.resumenTareas.subtareasCompletadas} / ${proyecto.resumenTareas.subtareasTotal}`}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-background/50 p-3">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
          Horas y equipo
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Dato
            label="Horas registradas"
            value={formatHoras(proyecto.resumenHoras.totalHoras)}
          />
          <Dato
            label="Registros de horas"
            value={proyecto.resumenHoras.totalRegistros}
          />
          <Dato label="Miembros" value={proyecto.miembros.length} />
        </div>
      </section>
    </div>
  )
}
