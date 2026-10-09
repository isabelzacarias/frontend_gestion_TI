import { api } from "@/services/api"
import type {
  DashboardData,
  DashboardSummaryApiResponse,
  Sucursal,
} from "@/features/dashboard/types/dashboard.types"

/**
 * Consulta el resumen consolidado del dashboard por sucursal.
 * Endpoint: /dashboard/summary?sucursal=AMBOS|CANCUN|PLAYA
 * Incluye automáticamente el token Bearer vía interceptor de axios en api.ts.
 */
export async function obtenerResumenDashboard(
  sucursal: Sucursal = "AMBOS",
): Promise<DashboardData> {
  const params: Record<string, string> = {}
  if (sucursal !== "AMBOS") {
    params.sucursal = sucursal
  }

  const response = await api.get<DashboardSummaryApiResponse>(
    "/dashboard/summary",
    {
      params,
    },
  )

  return response.data.data
}
