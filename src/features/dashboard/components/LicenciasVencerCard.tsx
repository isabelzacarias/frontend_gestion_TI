import { Link } from "react-router"
import { AlertTriangle, ArrowRight, Calendar, KeyRound, ShieldCheck, User } from "lucide-react"

import type { LicenciaPorVencer } from "@/features/dashboard/types/dashboard.types"

interface LicenciasVencerCardProps {
  licencias: LicenciaPorVencer[]
  loading?: boolean
}

function calcularDiasRestantes(fechaStr: string): number {
  const fecha = new Date(fechaStr)
  const hoy = new Date()
  const diffTime = fecha.getTime() - hoy.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatearFecha(fechaStr: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(fechaStr))
  } catch {
    return fechaStr
  }
}

export function LicenciasVencerCard({
  licencias,
  loading = false,
}: LicenciasVencerCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Licencias por Vencer
            </h3>
            <p className="text-xs text-muted-foreground">
              Software que requiere renovación próxima
            </p>
          </div>
        </div>

        <Link
          to="/licenses"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-700"
        >
          Ver todas
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex-1 space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-muted/60"
            />
          ))
        ) : licencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
            <ShieldCheck className="size-8 text-emerald-500" />
            <p className="mt-2 text-xs font-medium text-foreground">
              Todas las licencias están al día
            </p>
            <p className="text-[11px] text-muted-foreground">
              No hay vencimientos próximos registrados
            </p>
          </div>
        ) : (
          licencias.slice(0, 4).map((lic) => {
            const dias = calcularDiasRestantes(lic.fechaVencimiento)
            const esCritico = dias <= 30
            const esAlerta = dias > 30 && dias <= 90

            return (
              <div
                key={lic.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-colors hover:border-amber-500/30 hover:bg-background/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {lic.software}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      • {lic.proveedor}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatearFecha(lic.fechaVencimiento)}
                    </span>
                    {lic.asignadaA && (
                      <span className="flex items-center gap-1 truncate">
                        <User className="size-3" />
                        {lic.asignadaA.nombre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      esCritico
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : esAlerta
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {esCritico && <AlertTriangle className="size-2.5" />}
                    {dias <= 0 ? "Vencida" : `${dias} días`}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
