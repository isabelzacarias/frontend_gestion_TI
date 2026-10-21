import { useEffect, useState } from "react"
import {
  AlertCircle,
  ChartBar,
  History,
  Lock,
  RefreshCw,
} from "lucide-react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ReportFilterDialog } from "@/features/reports/components/ReportFilterDialog"
import { ReportsCatalog } from "@/features/reports/components/ReportsCatalog"
import { ReportsHistory } from "@/features/reports/components/ReportsHistory"
import {
  ReporteApiError,
  obtenerCatalogoReportes,
} from "@/features/reports/services/reporte.service"
import type {
  ReporteGeneracion,
  ReporteMetadata,
} from "@/features/reports/types/report"

type VistaReportes = "catalogo" | "historial"

function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const vista: VistaReportes =
    searchParams.get("vista") === "historial" ? "historial" : "catalogo"

  const [catalogo, setCatalogo] = useState<ReporteMetadata[]>([])
  const [catalogoLoading, setCatalogoLoading] = useState(true)
  const [catalogoError, setCatalogoError] = useState<string | null>(null)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [catalogoReloadKey, setCatalogoReloadKey] = useState(0)
  const [historialReloadKey, setHistorialReloadKey] = useState(0)
  const [bloqueados, setBloqueados] = useState<Record<string, string[]>>({})

  const [selectedReport, setSelectedReport] = useState<ReporteMetadata | null>(
    null,
  )
  const [retryGeneration, setRetryGeneration] =
    useState<ReporteGeneracion | null>(null)

  useEffect(() => {
    let cancelado = false

    async function cargarCatalogo() {
      setCatalogoLoading(true)
      setCatalogoError(null)
      setSinPermiso(false)

      try {
        const data = await obtenerCatalogoReportes()
        if (!cancelado) {
          setCatalogo(data)
          setBloqueados({})
        }
      } catch (error) {
        if (cancelado) return
        setCatalogo([])
        if (error instanceof ReporteApiError && error.status === 403) {
          setSinPermiso(true)
        } else {
          setCatalogoError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el catálogo de reportes.",
          )
        }
      } finally {
        if (!cancelado) setCatalogoLoading(false)
      }
    }

    void cargarCatalogo()

    return () => {
      cancelado = true
    }
  }, [catalogoReloadKey])

  function cambiarVista(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next === "historial") {
      params.set("vista", "historial")
    } else {
      params.delete("vista")
    }
    setSearchParams(params, { replace: true })
  }

  function recargarTodo() {
    setCatalogoReloadKey((key) => key + 1)
    setHistorialReloadKey((key) => key + 1)
  }

  function handleOpenReport(reporte: ReporteMetadata) {
    const faltantes = bloqueados[reporte.codigo]
    if (faltantes && faltantes.length > 0) {
      toast.error(`Requiere: ${faltantes.join(", ")}`)
      return
    }
    setRetryGeneration(null)
    setSelectedReport(reporte)
  }

  function handlePermisoDenegado(codigo: string, faltantes: string[]) {
    setBloqueados((prev) => ({ ...prev, [codigo]: faltantes }))
  }

  function handleAsyncCreated() {
    setSelectedReport(null)
    setRetryGeneration(null)
    cambiarVista("historial")
    setHistorialReloadKey((key) => key + 1)
  }

  function handleRetry(generation: ReporteGeneracion) {
    const metadata = catalogo.find(
      (reporte) => reporte.codigo === generation.codigo,
    )
    if (!metadata) {
      toast.error("El reporte de esta generación ya no está disponible.")
      return
    }
    setRetryGeneration(generation)
    setSelectedReport(metadata)
  }

  const viewSwitcher = (
    <TabsList aria-label="Vistas de reportes">
      <TabsTrigger value="catalogo">
        <ChartBar />
        Catálogo
      </TabsTrigger>
      <TabsTrigger value="historial">
        <History />
        Historial
      </TabsTrigger>
    </TabsList>
  )

  return (
    <Tabs
      value={vista}
      onValueChange={cambiarVista}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <ModuleHeader
        eyebrow="Análisis y Exportación"
        title="Reportes"
        actions={
          sinPermiso ? undefined : (
            <div className="flex flex-wrap items-center gap-2">
              {viewSwitcher}
              <Button
                type="button"
                variant="outline"
                onClick={recargarTodo}
                disabled={catalogoLoading}
                className="h-10 rounded-2xl px-3 text-xs font-semibold"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`size-4 ${catalogoLoading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>
          )
        }
        summary={
          <span className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-1.5 font-semibold text-violet-800 shadow-[0_4px_12px_rgba(124,58,237,0.14)] dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200">
            <ChartBar className="size-3.5 text-violet-700 dark:text-violet-200" />
            {sinPermiso
              ? "Sin acceso"
              : catalogoLoading
                ? "Cargando..."
                : `${catalogo.length} reportes`}
          </span>
        }
      />

      {sinPermiso ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 p-8 text-center">
          <Lock className="size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No tienes permiso para consultar los reportes
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Solicita el permiso reportes:leer a un administrador.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCatalogoReloadKey((key) => key + 1)}
            className="mt-4 h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <TabsContent
            value="catalogo"
            className="m-0 min-h-0 flex-1 overflow-y-auto"
          >
            <ReportsCatalog
              reportes={catalogo}
              loading={catalogoLoading}
              error={catalogoError}
              bloqueados={bloqueados}
              onRetry={() => setCatalogoReloadKey((key) => key + 1)}
              onOpenReport={handleOpenReport}
            />
          </TabsContent>

          <TabsContent
            value="historial"
            className="m-0 min-h-0 flex-1 overflow-y-auto"
          >
            <ReportsHistory
              key={historialReloadKey}
              catalog={catalogo}
              refreshKey={historialReloadKey}
              onRetry={handleRetry}
            />
          </TabsContent>
        </>
      )}

      {selectedReport && (
        <ReportFilterDialog
          key={`${selectedReport.codigo}-${retryGeneration?.id ?? "new"}`}
          metadata={selectedReport}
          retryGeneration={retryGeneration}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedReport(null)
              setRetryGeneration(null)
            }
          }}
          onAsyncCreated={handleAsyncCreated}
          onPermisoDenegado={handlePermisoDenegado}
        />
      )}

      {catalogoError && !sinPermiso && vista === "historial" && (
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          El catálogo no está disponible; el historial sigue operativo.
        </div>
      )}
    </Tabs>
  )
}

export default ReportsPage
