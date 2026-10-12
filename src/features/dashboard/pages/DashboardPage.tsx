import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  Inbox,
  Monitor,
  RefreshCw,
  UserCheck,
} from "lucide-react"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { ActivosChartCard } from "@/features/dashboard/components/ActivosChartCard"
import { KpiCard } from "@/features/dashboard/components/KpiCard"
import { LicenciasVencerCard } from "@/features/dashboard/components/LicenciasVencerCard"
import { RecordatoriosCard } from "@/features/dashboard/components/RecordatoriosCard"
import { obtenerResumenDashboard } from "@/features/dashboard/services/dashboard.service"
import type {
  DashboardData,
  Sucursal,
} from "@/features/dashboard/types/dashboard.types"

/* ──────────────────────────────────────────────
 * Etiquetas para el filtro de sucursal
 * ────────────────────────────────────────────── */
const sucursalLabels: Record<Sucursal, string> = {
  AMBOS: "Ambos",
  CANCUN: "Cancún",
  PLAYA: "Playa",
}

function DashboardPage() {
  const [sucursal, setSucursal] = useState<Sucursal>("AMBOS")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const cargarResumen = useCallback(async (suc: Sucursal) => {
    setLoading(true)
    setError(null)
    try {
      const resumen = await obtenerResumenDashboard(suc)
      setData(resumen)
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err)
      setError(
        "No se pudo cargar la información del dashboard. Por favor intenta de nuevo.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarResumen(sucursal)
  }, [sucursal, cargarResumen])

  return (
    <div className="space-y-6">
      {/* ═══ HEADER con Filtro por Sucursal (5) ═══ */}
      <ModuleHeader
        eyebrow="PANEL PRINCIPAL"
        title="Dashboard de Control Operativo"
        actions={
          <div className="flex items-center gap-3">
            {/* Botón de refrescar */}
            <button
              type="button"
              onClick={() => cargarResumen(sucursal)}
              disabled={loading}
              title="Recargar datos"
              className="flex size-9 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:text-foreground disabled:opacity-50 dark:border-white/10 dark:bg-card/60"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin text-primary" : ""}`}
              />
            </button>

            {/* (5) Filtro Segmentado por Sucursal */}
            <div className="flex rounded-2xl border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/60">
              {(Object.keys(sucursalLabels) as Sucursal[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSucursal(key)}
                  className={`rounded-xl px-5 py-2 text-xs font-semibold transition-all ${
                    sucursal === key
                      ? "bg-primary text-primary-foreground shadow-sm"
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

      {/* Banner de error con botón de reintentar si falla la API */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => cargarResumen(sucursal)}
            className="font-bold underline hover:opacity-80"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ═══ FILA DE KPIs: (1) Tickets · (4) Total Activos · (6) Equipos Asignados ═══ */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* (1) Total de Tickets Pendientes */}
        <KpiCard
          title="Tickets Pendientes"
          value={data?.kpis.ticketsPendientes ?? 0}
          subtitle="Incidencias pendientes de atención"
          badgeText="Prioridad"
          icon={<Inbox className="size-6" />}
          accentColor="primary"
          to="/tickets"
          loading={loading}
        />

        {/* (4) Total de Activos */}
        <KpiCard
          title="Total de Activos"
          value={data?.kpis.totalActivos ?? 0}
          subtitle="Equipos registrados en inventario"
          badgeText="Inventario"
          icon={<Monitor className="size-6" />}
          accentColor="cyan"
          to="/inventory"
          loading={loading}
        />

        {/* (6) Total de Equipos Asignados */}
        <KpiCard
          title="Equipos Asignados"
          value={data?.kpis.equiposAsignados ?? 0}
          subtitle="En uso activo por colaboradores"
          badgeText="Asignados"
          icon={<UserCheck className="size-6" />}
          accentColor="emerald"
          to="/assignments"
          loading={loading}
        />
      </div>

      {/* ═══ FILA INFERIOR: (2) Licencias + (7) Recordatorios | (3) Gráfica ═══ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Columna izquierda: (2) y (7) apilados */}
        <div className="flex flex-col gap-5">
          {/* (2) Licencias por Vencer */}
          <LicenciasVencerCard
            licencias={data?.licenciasPorVencer ?? []}
            loading={loading}
          />

          {/* (7) Recordatorios */}
          <RecordatoriosCard
            initialRecordatorios={data?.recordatorios ?? []}
            loading={loading}
          />
        </div>

        {/* Columna derecha: (3) Gráfica de Activos por Tipo (ocupa toda la altura) */}
        <ActivosChartCard
          data={data?.activosPorTipo ?? []}
          totalActivos={data?.kpis.totalActivos ?? 0}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default DashboardPage