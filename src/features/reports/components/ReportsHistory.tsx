import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import {
  ReporteApiError,
  listarGeneraciones,
  obtenerDescargaGeneracion,
  obtenerGeneracion,
} from "@/features/reports/services/reporte.service"
import type {
  ListadoGeneraciones,
  ReporteGeneracion,
  ReporteMetadata,
} from "@/features/reports/types/report"
import {
  ESTADO_GENERACION_BADGE_CLASS,
  ESTADO_GENERACION_LABELS,
  FORMATO_LABELS,
  formatBytes,
  formatFechaHora,
} from "@/features/reports/utils/report-display"

interface ReportsHistoryProps {
  catalog: ReporteMetadata[]
  refreshKey: number
  onRetry: (generation: ReporteGeneracion) => void
}

const ITEMS_PER_PAGE = 20
const cellBase = "border-b border-border/70 px-4 py-3 text-foreground/90"
const POLL_INTERVAL_MS = 2500
const POLL_LIMIT_MS = 120000

function abrirUrl(url: string): void {
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.target = "_blank"
  enlace.rel = "noopener"
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
}

export function ReportsHistory({
  catalog,
  refreshKey,
  onRetry,
}: ReportsHistoryProps) {
  const [generaciones, setGeneraciones] = useState<ReporteGeneracion[]>([])
  const [meta, setMeta] = useState<ListadoGeneraciones["meta"]>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [consultandoId, setConsultandoId] = useState<number | null>(null)
  const [pollingStopped, setPollingStopped] = useState(false)

  const pollStartRef = useRef<number | null>(null)

  const catalogPorCodigo = useMemo(() => {
    const mapa = new Map<string, ReporteMetadata>()
    catalog.forEach((reporte) => mapa.set(reporte.codigo, reporte))
    return mapa
  }, [catalog])

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setLoading(true)
      setError(null)
      setPollingStopped(false)

      try {
        const data = await listarGeneraciones(page, ITEMS_PER_PAGE)
        if (!cancelado) {
          setGeneraciones(data.generaciones)
          setMeta(data.meta)
        }
      } catch (err) {
        if (cancelado) return
        setGeneraciones([])
        setMeta({
          page,
          limit: ITEMS_PER_PAGE,
          total: 0,
          totalPages: 1,
        })
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el historial de reportes.",
        )
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    void cargar()

    return () => {
      cancelado = true
    }
  }, [page, refreshKey, reloadKey])

  useEffect(() => {
    pollStartRef.current = null
  }, [page, refreshKey, reloadKey])

  const activeKey = generaciones
    .filter(
      (generacion) =>
        generacion.estado === "PENDIENTE" ||
        generacion.estado === "GENERANDO",
    )
    .map((generacion) => generacion.id)
    .sort((a, b) => a - b)
    .join(",")

  useEffect(() => {
    if (!activeKey || pollingStopped) {
      if (!activeKey) pollStartRef.current = null
      return
    }

    if (pollStartRef.current === null) {
      pollStartRef.current = Date.now()
    }

    let cancelado = false
    let timer: number | undefined
    const ids = activeKey.split(",").map(Number)

    async function tick() {
      if (cancelado) return

      const inicio = pollStartRef.current ?? Date.now()
      if (Date.now() - inicio > POLL_LIMIT_MS) {
        setPollingStopped(true)
        toast.info(
          "La generación sigue en proceso. Usa Actualizar para consultar manualmente.",
        )
        return
      }

      const resultados = await Promise.allSettled(
        ids.map((id) => obtenerGeneracion(id)),
      )

      if (cancelado) return

      setGeneraciones((prev) =>
        prev.map((generacion) => {
          const indice = ids.indexOf(generacion.id)
          if (indice === -1) return generacion
          const resultado = resultados[indice]
          return resultado.status === "fulfilled"
            ? resultado.value
            : generacion
        }),
      )

      if (!cancelado) {
        timer = window.setTimeout(tick, POLL_INTERVAL_MS)
      }
    }

    timer = window.setTimeout(tick, POLL_INTERVAL_MS)

    return () => {
      cancelado = true
      if (timer) window.clearTimeout(timer)
    }
  }, [activeKey, pollingStopped, page, refreshKey, reloadKey])

  const activas = generaciones.filter(
    (generacion) =>
      generacion.estado === "PENDIENTE" ||
      generacion.estado === "GENERANDO",
  ).length

  const recargar = () => {
    setPollingStopped(false)
    setReloadKey((key) => key + 1)
  }

  async function descargar(generacion: ReporteGeneracion) {
    setDownloadingId(generacion.id)
    try {
      const descarga = await obtenerDescargaGeneracion(generacion.id)
      abrirUrl(descarga.url)
      toast.success("Descarga lista.")
    } catch (err) {
      if (err instanceof ReporteApiError && err.status === 409) {
        toast.error("El reporte aún no está disponible.")
        recargar()
      } else {
        toast.error(
          err instanceof Error
            ? err.message
            : "No se pudo descargar el reporte.",
        )
      }
    } finally {
      setDownloadingId(null)
    }
  }

  async function consultar(generacion: ReporteGeneracion) {
    setConsultandoId(generacion.id)
    try {
      const actualizada = await obtenerGeneracion(generacion.id)
      setGeneraciones((prev) =>
        prev.map((item) =>
          item.id === generacion.id ? actualizada : item,
        ),
      )
      toast.success("Estado actualizado.")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo consultar la generación.",
      )
    } finally {
      setConsultandoId(null)
    }
  }

  const columns: DataTableColumn<ReporteGeneracion>[] = [
    {
      key: "reporte",
      header: "Reporte",
      cellClassName: `${cellBase} min-w-[240px]`,
      render: (generacion) => {
        const metadata = catalogPorCodigo.get(generacion.codigo)
        return (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {metadata?.nombre ?? generacion.codigo}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {generacion.codigo}
            </p>
          </div>
        )
      },
    },
    {
      key: "formato",
      header: "Formato",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (generacion) => (
        <Badge variant="outline" className="font-mono text-[10px]">
          {FORMATO_LABELS[generacion.formato]}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cellClassName: "border-b border-border/70 px-4 py-3 whitespace-nowrap",
      render: (generacion) => (
        <Badge
          className={ESTADO_GENERACION_BADGE_CLASS[generacion.estado]}
        >
          {ESTADO_GENERACION_LABELS[generacion.estado]}
        </Badge>
      ),
    },
    {
      key: "creado",
      header: "Creado",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (generacion) => formatFechaHora(generacion.creadoEn),
    },
    {
      key: "tamano",
      header: "Tamaño",
      cellClassName: `${cellBase} whitespace-nowrap text-xs text-muted-foreground`,
      render: (generacion) => formatBytes(generacion.tamano),
    },
    {
      key: "error",
      header: "Error",
      cellClassName: `${cellBase} max-w-[220px] text-xs text-rose-600 dark:text-rose-400`,
      render: (generacion) =>
        generacion.error ? (
          <span className="block truncate" title={generacion.error}>
            {generacion.error}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "acciones",
      header: "",
      cellClassName: "border-b border-border/70 px-4 py-3 text-right",
      render: (generacion) => {
        const descargando = downloadingId === generacion.id
        const consultando = consultandoId === generacion.id

        if (generacion.estado === "COMPLETADO") {
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={descargando}
              onClick={() => void descargar(generacion)}
              className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            >
              {descargando ? (
                <Loader2
                  aria-hidden="true"
                  className="size-3.5 animate-spin"
                />
              ) : (
                <Download aria-hidden="true" className="size-3.5" />
              )}
              Descargar
            </Button>
          )
        }

        if (generacion.estado === "FALLIDO") {
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRetry(generacion)}
              className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Reintentar
            </Button>
          )
        }

        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={consultando}
            onClick={() => void consultar(generacion)}
            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold"
          >
            {consultando ? (
              <Loader2
                aria-hidden="true"
                className="size-3.5 animate-spin"
              />
            ) : (
              <RefreshCw aria-hidden="true" className="size-3.5" />
            )}
            Consultar
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{meta.total} generación(es) registradas.</span>
          {activas > 0 && !pollingStopped && (
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1 text-[10px]"
            >
              <Loader2
                aria-hidden="true"
                className="size-3 animate-spin"
              />
              Actualizando {activas}...
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={recargar}
          className="h-9 rounded-xl px-3 text-xs font-semibold"
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={recargar}
            className="h-8 rounded-xl px-3 text-xs font-semibold"
          >
            Reintentar
          </Button>
        </div>
      )}

      <DataTable<ReporteGeneracion>
        columns={columns}
        data={generaciones}
        rowKey={(generacion) => generacion.id}
        page={meta.page}
        totalPages={meta.totalPages}
        totalFiltered={meta.total}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
        emptyMessage={
          loading
            ? "Cargando generaciones..."
            : "No has generado reportes todavía."
        }
      />
    </div>
  )
}
