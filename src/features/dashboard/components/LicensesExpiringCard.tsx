import { ArrowRight, KeyRound, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface LicensesExpiringCardProps {
  onClick?: () => void
}

export function LicensesExpiringCard({ onClick }: LicensesExpiringCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="group relative overflow-hidden rounded-[26px] border border-white/50 bg-white/80 p-6 shadow-[0_12px_35px_rgba(17,24,39,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_18px_40px_rgba(245,158,11,0.12)] dark:border-white/10 dark:bg-card/75 dark:hover:border-amber-500/30 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-amber-500/10 blur-2xl transition-all duration-500 group-hover:bg-amber-500/20" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-[0_10px_22px_rgba(245,158,11,0.32)] transition-transform duration-300 group-hover:scale-105">
          <KeyRound className="size-6 text-white" />
        </div>

        <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
          <ShieldAlert className="size-3 text-amber-600" />
          Software & Claves
        </Badge>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Gestión de Licencias
        </p>
        <h3 className="mt-1 text-lg font-bold text-foreground">
          Licencias por Vencer
        </h3>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
            0
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            próximas a expirar (30 días)
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Supervisión preventiva de contratos, renovaciones de puestos y vigencia de licencias corporativas.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors">
        <span>Ir a Gestión de Licencias</span>
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </div>
  )
}
