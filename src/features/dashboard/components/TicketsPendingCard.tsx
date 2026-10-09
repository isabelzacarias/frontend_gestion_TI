import { ArrowRight, Inbox, Loader2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface TicketsPendingCardProps {
  total: number | null
  isLoading: boolean
  isActive: boolean
  onClick: () => void
}

export function TicketsPendingCard({
  total,
  isLoading,
  isActive,
  onClick,
}: TicketsPendingCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={`group relative overflow-hidden rounded-[26px] border transition-all duration-300 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isActive
          ? "border-primary/60 bg-[radial-gradient(ellipse_at_top_left,_rgba(123,64,163,0.18),transparent_60%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(243,232,255,0.85))] shadow-[0_18px_45px_rgba(91,36,128,0.18)] ring-2 ring-primary/40 dark:border-primary/50 dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(123,64,163,0.25),transparent_60%),linear-gradient(135deg,_rgba(26,17,40,0.95),_rgba(17,24,39,0.92))]"
          : "border-white/50 bg-white/80 shadow-[0_12px_35px_rgba(17,24,39,0.06)] hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_rgba(91,36,128,0.12)] dark:border-white/10 dark:bg-card/75 dark:hover:border-primary/30"
      } backdrop-blur-xl p-6`}
    >
      {/* Luz ambiental decorativa superior */}
      <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover:bg-primary/20" />

      <div className="flex items-start justify-between gap-4">
        {/* Icono con contenedor gradiente */}
        <div className="flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary-600 to-violet-700 text-white shadow-[0_10px_22px_rgba(91,36,128,0.32)] transition-transform duration-300 group-hover:scale-105">
          <Inbox className="size-6 text-white" />
        </div>

        {/* Badge de estado NUEVO con punto de pulso */}
        <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-sky-500" />
          </span>
          Estado: NUEVO
        </Badge>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mesa de Ayuda
        </p>
        <h3 className="mt-1 text-lg font-bold text-foreground">
          Tickets Pendientes
        </h3>

        {/* Métrica principal */}
        <div className="mt-3 flex items-baseline gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-sm font-medium">Consultando API...</span>
            </div>
          ) : (
            <>
              <span className="text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
                {total ?? 0}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                incidencias nuevas
              </span>
            </>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Incidencias registradas recientemente que requieren asignación técnica o atención inmediata.
        </p>
      </div>

      {/* Footer interactivo con CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold text-primary transition-colors">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          {isActive ? "Panel desplegado" : "Clic para ver incidencias nuevas"}
        </span>
        <ArrowRight
          className={`size-4 transition-transform duration-300 ${
            isActive ? "rotate-90 text-primary" : "group-hover:translate-x-1"
          }`}
        />
      </div>
    </div>
  )
}
