import { useState } from "react"
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import { BarChart2, PieChart } from "lucide-react"

import type { ActivoPorTipo } from "@/features/dashboard/types/dashboard.types"

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
)

interface ActivosChartCardProps {
  data: ActivoPorTipo[]
  totalActivos?: number
  loading?: boolean
}

const PALETTE = [
  "#5b2480", // Primary
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#7b40a3", // Purple-500
  "#3b82f6", // Blue
  "#f9c030", // Amber
  "#9c6ebb", // Purple-400
  "#0891b2", // Cyan-600
  "#ec4899", // Pink
  "#f37970", // Destructive-400
  "#8b5cf6", // Violet
  "#94a3b8", // Slate
]

export function ActivosChartCard({
  data,
  totalActivos = 0,
  loading = false,
}: ActivosChartCardProps) {
  const [chartType, setChartType] = useState<"doughnut" | "bar">("doughnut")

  // Formatear etiquetas (ej: SIN_DATO -> "Sin especificar")
  const labels = data.map((item) =>
    item.tipo === "SIN_DATO" ? "Sin dato" : item.tipo,
  )
  const values = data.map((item) => item.total)
  const colors = data.map((_, idx) => PALETTE[idx % PALETTE.length])

  const chartData = {
    labels,
    datasets: [
      {
        label: "Cantidad",
        data: values,
        backgroundColor: colors,
        borderColor: "rgba(255,255,255,0.4)",
        borderWidth: 1.5,
        borderRadius: chartType === "bar" ? 6 : 0,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 14,
          font: {
            size: 11,
            family: "sans-serif",
          },
          color: "currentColor",
        },
      },
      tooltip: {
        backgroundColor: "rgba(26, 10, 46, 0.9)",
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: "bold" as const },
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx: { parsed: number }) => {
            const val = ctx.parsed
            const pct =
              totalActivos > 0 ? Math.round((val / totalActivos) * 100) : 0
            return ` ${val} activos (${pct}%)`
          },
        },
      },
    },
    cutout: "68%",
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(26, 10, 46, 0.9)",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "currentColor" },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.15)" },
        ticks: { font: { size: 10 }, stepSize: 10, color: "currentColor" },
      },
    },
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Activos por Tipo
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribución del inventario tecnológico
          </p>
        </div>

        {/* Toggle de Tipo de Gráfica */}
        <div className="flex items-center rounded-xl border border-border/70 bg-background/70 p-0.5">
          <button
            type="button"
            onClick={() => setChartType("doughnut")}
            className={`flex size-7 items-center justify-center rounded-lg text-xs transition-colors ${
              chartType === "doughnut"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vista circular"
          >
            <PieChart className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`flex size-7 items-center justify-center rounded-lg text-xs transition-colors ${
              chartType === "bar"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vista de barras"
          >
            <BarChart2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex min-h-[320px] flex-1 items-center justify-center">
        {loading ? (
          <div className="flex size-48 animate-pulse rounded-full bg-muted/40" />
        ) : data.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground">
            No hay datos de activos registrados para esta sucursal.
          </div>
        ) : (
          <div className="relative h-full w-full">
            {chartType === "doughnut" ? (
              <>
                <Doughnut data={chartData} options={doughnutOptions} />
                <div className="pointer-events-none absolute inset-0 mb-10 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-foreground">
                    {totalActivos}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Activos
                  </span>
                </div>
              </>
            ) : (
              <Bar data={chartData} options={barOptions} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
