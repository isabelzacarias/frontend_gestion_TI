import { Link } from "react-router"
import { ArrowRight, Bell, CalendarClock, ListTodo } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { RecordatorioItem } from "@/features/dashboard/types/dashboard.types"
import {
  PRIORIDAD_BADGE_CLASS,
  PRIORIDAD_LABELS,
  esFechaVencida,
  formatFechaRecordatorio,
} from "@/features/reminder/utils/reminder-display"

interface RecordatoriosCardProps {
  recordatorios?: RecordatorioItem[]
  loading?: boolean
}

export function RecordatoriosCard({
  recordatorios = [],
  loading = false,
}: RecordatoriosCardProps) {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/60 lg:flex-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Bell className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Próximos recordatorios
            </h3>
            <p className="text-xs text-muted-foreground">
              Pendientes con fecha programada
            </p>
          </div>
        </div>

        <Link
          to="/reminder"
          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Ver todos
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
          ))
        ) : recordatorios.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-7 text-center">
            <ListTodo className="size-7 text-muted-foreground/60" />
            <p className="mt-2 text-xs font-medium text-foreground">
              No hay recordatorios próximos
            </p>
            <p className="text-[11px] text-muted-foreground">
              Crea uno con fecha para verlo aquí
            </p>
          </div>
        ) : (
          recordatorios.map((recordatorio) => {
            const vencido = esFechaVencida(recordatorio.fecha)
            return (
              <Link
                key={recordatorio.id}
                to="/reminder"
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-2.5 transition-colors hover:bg-background/80"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <CalendarClock
                    aria-hidden="true"
                    className={`size-4 shrink-0 ${
                      vencido ? "text-rose-500" : "text-muted-foreground/60"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {recordatorio.titulo}
                    </p>
                    <p
                      className={`text-[11px] ${
                        vencido
                          ? "font-semibold text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatFechaRecordatorio(recordatorio.fecha)}
                      {vencido ? " · Vencido" : ""}
                    </p>
                  </div>
                </div>

                <Badge
                  className={`shrink-0 ${PRIORIDAD_BADGE_CLASS[recordatorio.prioridad]}`}
                >
                  {PRIORIDAD_LABELS[recordatorio.prioridad]}
                </Badge>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
