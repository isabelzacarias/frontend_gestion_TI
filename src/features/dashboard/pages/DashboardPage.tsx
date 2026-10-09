import { useState } from "react"
import {
  BarChart3,
  Bell,
  Inbox,
  KeyRound,
  Monitor,
  UserCheck,
} from "lucide-react"

import { ModuleHeader } from "@/components/common/ModuleHeader"

/* ──────────────────────────────────────────────
 * Tipo para el filtro de sucursal
 * ────────────────────────────────────────────── */
type Sucursal = "AMBOS" | "CANCUN" | "PLAYA"

const sucursalLabels: Record<Sucursal, string> = {
  AMBOS: "Ambos",
  CANCUN: "Cancún",
  PLAYA: "Playa",
}

/* ──────────────────────────────────────────────
 * Placeholder visual reutilizable para cada sección
 * ────────────────────────────────────────────── */
function SectionPlaceholder({
  number,
  title,
  icon,
  accentColor = "primary",
  className = "",
}: {
  number: number
  title: string
  icon: React.ReactNode
  accentColor?: string
  className?: string
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      glow: "from-primary to-violet-700",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-500/20",
      glow: "from-cyan-500 to-cyan-700",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20",
      glow: "from-emerald-500 to-emerald-700",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
      glow: "from-amber-500 to-orange-600",
    },
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-500/20",
      glow: "from-violet-500 to-purple-700",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/20",
      glow: "from-rose-500 to-rose-700",
    },
  }

  const colors = colorMap[accentColor] ?? colorMap.primary

  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border border-white/50 bg-white/80 p-6 shadow-[0_12px_35px_rgba(17,24,39,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-card/75 ${className}`.trim()}
    >
      {/* Indicador numérico del wireframe */}
      <span
        className={`absolute left-3 top-3 z-10 flex size-6 items-center justify-center rounded-lg text-[10px] font-extrabold ${colors.bg} ${colors.text} ${colors.border} border`}
      >
        {number}
      </span>

      {/* Contenido placeholder */}
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div
          className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.glow} text-white shadow-lg`}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">Pendiente de implementación</p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
 * Dashboard Page — Esqueleto Estructural
 * ────────────────────────────────────────────── */
function DashboardPage() {
  const [sucursal, setSucursal] = useState<Sucursal>("AMBOS")

  return (
    <div className="space-y-6">
      {/* ═══ HEADER con Filtro por Sucursal (5) ═══ */}
      <ModuleHeader
        eyebrow="PANEL PRINCIPAL"
        title="Dashboard de Control Operativo"
        actions={
          <div className="flex items-center gap-2">
            {/* (5) Filtro Segmentado por Sucursal */}
            <span className="flex size-6 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-[10px] font-extrabold text-primary">
              5
            </span>
            <div className="flex rounded-2xl border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/60">
              {(Object.keys(sucursalLabels) as Sucursal[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSucursal(key)}
                  className={`rounded-xl px-5 py-2 text-xs font-semibold transition-all ${
                    sucursal === key
                      ? "bg-gradient-to-r from-primary to-primary-600 text-white shadow-[0_6px_16px_rgba(91,36,128,0.25)]"
                      : "text-muted-foreground hover:bg-primary/[0.06] hover:text-foreground"
                  }`}
                >
                  {sucursalLabels[key]}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* ═══ FILA DE KPIs: (1) Tickets · (4) Total Activos · (6) Equipos Asignados ═══ */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* (1) Total de Tickets Pendientes */}
        <SectionPlaceholder
          number={1}
          title="Total de Tickets Pendientes"
          icon={<Inbox className="size-6" />}
          accentColor="primary"
        />

        {/* (4) Total de Activos */}
        <SectionPlaceholder
          number={4}
          title="Total de Activos"
          icon={<Monitor className="size-6" />}
          accentColor="cyan"
        />

        {/* (6) Total de Equipos Asignados */}
        <SectionPlaceholder
          number={6}
          title="Total de Equipos Asignados"
          icon={<UserCheck className="size-6" />}
          accentColor="emerald"
        />
      </div>

      {/* ═══ FILA INFERIOR: (2) Licencias + (7) Recordatorios | (3) Gráfica ═══ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Columna izquierda: (2) y (7) apilados */}
        <div className="flex flex-col gap-5">
          {/* (2) Licencias por Vencer */}
          <SectionPlaceholder
            number={2}
            title="Licencias por Vencer"
            icon={<KeyRound className="size-6" />}
            accentColor="amber"
          />

          {/* (7) Recordatorios */}
          <SectionPlaceholder
            number={7}
            title="Recordatorios de TI"
            icon={<Bell className="size-6" />}
            accentColor="violet"
          />
        </div>

        {/* Columna derecha: (3) Gráfica de Activos por Tipo (ocupa toda la altura) */}
        <SectionPlaceholder
          number={3}
          title="Gráfica de Activos por Tipo"
          icon={<BarChart3 className="size-6" />}
          accentColor="rose"
          className="lg:row-span-2"
        />
      </div>
    </div>
  )
}

export default DashboardPage