import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import {
  Download,
  Eye,
  ImageOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ADJUNTOS_ELIMINAR_DISPONIBLE,
  ADJUNTOS_GALERIA_DISPONIBLE,
} from "@/features/attachments/config"
import {
  AdjuntoApiError,
  eliminarAdjunto,
  listarTodosLosAdjuntos,
  obtenerDescargaAdjunto,
  subirAdjunto,
} from "@/features/attachments/services/adjunto.service"
import type {
  Adjunto,
  DescargaAdjunto,
  EntidadAdjunto,
} from "@/features/attachments/types/attachment"
import {
  ADJUNTOS_ACCEPT,
  formatearFechaAdjunto,
  formatearTamanoAdjunto,
  validarArchivoAdjunto,
} from "@/features/attachments/utils/attachment-format"

export interface AttachmentsDataSource {
  listar: () => Promise<Adjunto[]>
  subir: (
    archivo: File,
    opciones?: { onProgress?: (porcentaje: number) => void },
  ) => Promise<Adjunto>
  descargar: (adjuntoId: number) => Promise<DescargaAdjunto>
  eliminar: (adjuntoId: number) => Promise<void>
}

interface AttachmentsSectionProps {
  entidadTipo: EntidadAdjunto
  entidadId: string
  puedeSubir?: boolean
  puedeEliminar?: boolean
  className?: string
  dataSource?: AttachmentsDataSource
}

interface SesionAdjunto {
  url: string
  archivo: File
  adjunto: Adjunto
}

interface VisorAdjunto {
  url: string
  titulo: string
}

function mensajeErrorAdjunto(error: unknown, accion: string): string {
  if (error instanceof AdjuntoApiError) {
    if (error.status === 403) {
      return `No tienes permiso para ${accion}.`
    }
    if (error.status === 404) {
      return "El adjunto o la entidad ya no existe."
    }
    if (error.status === 503) {
      return "El almacenamiento de imágenes no está disponible. Intenta más tarde."
    }
    return error.message
  }
  return "No se pudo completar la operación."
}

function AttachmentThumbnail({
  adjunto,
  descargar,
}: {
  adjunto: Adjunto
  descargar: (adjuntoId: number) => Promise<DescargaAdjunto>
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [fallo, setFallo] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      try {
        const descarga = await descargar(adjunto.id)
        if (!cancelado) {
          setUrl(descarga.url)
          setFallo(false)
        }
      } catch {
        if (!cancelado) setFallo(true)
      }
    }

    void cargar()

    return () => {
      cancelado = true
    }
  }, [adjunto.id, descargar, intento])

  if (fallo) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-muted/50 text-muted-foreground">
        <ImageOff aria-hidden="true" className="size-6" />
      </div>
    )
  }

  if (!url) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-muted/50 text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={adjunto.nombreOriginal}
      loading="lazy"
      className="h-28 w-full object-cover"
      onError={() => {
        if (intento < 1) {
          setUrl(null)
          setIntento((valor) => valor + 1)
        } else {
          setFallo(true)
        }
      }}
    />
  )
}

export function AttachmentsSection({
  entidadTipo,
  entidadId,
  puedeSubir = true,
  puedeEliminar = true,
  className,
  dataSource,
}: AttachmentsSectionProps) {
  const fuente = useMemo<AttachmentsDataSource>(() => {
    if (dataSource) return dataSource
    return {
      listar: () => listarTodosLosAdjuntos(entidadTipo, entidadId),
      subir: (archivo, opciones) =>
        subirAdjunto({ archivo, entidadTipo, entidadId }, opciones),
      descargar: (adjuntoId) => obtenerDescargaAdjunto(adjuntoId),
      eliminar: (adjuntoId) => eliminarAdjunto(adjuntoId),
    }
  }, [dataSource, entidadId, entidadTipo])
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(
    null,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)

  const [sesion, setSesion] = useState<SesionAdjunto[]>([])
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  const [cargando, setCargando] = useState(ADJUNTOS_GALERIA_DISPONIBLE)
  const [errorGaleria, setErrorGaleria] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [permisoSubir, setPermisoSubir] = useState(true)
  const [permisoEliminar, setPermisoEliminar] = useState(true)
  const [eliminarTarget, setEliminarTarget] = useState<Adjunto | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [visor, setVisor] = useState<VisorAdjunto | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const sesionRef = useRef<SesionAdjunto[]>([])

  useEffect(() => {
    previewRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    sesionRef.current = sesion
  }, [sesion])

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      sesionRef.current.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [])

  useEffect(() => {
    if (!ADJUNTOS_GALERIA_DISPONIBLE) return

    let cancelado = false

    async function cargarAdjuntos() {
      setCargando(true)
      setErrorGaleria(null)

      try {
        const lista = await fuente.listar()
        if (!cancelado) setAdjuntos(lista)
      } catch (error) {
        if (cancelado) return
        setAdjuntos([])
        setErrorGaleria(
          mensajeErrorAdjunto(error, "consultar los adjuntos"),
        )
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    void cargarAdjuntos()

    return () => {
      cancelado = true
    }
  }, [fuente, reloadKey])

  const sesionVisibles = sesion.filter(
    (item) => !adjuntos.some((adjunto) => adjunto.id === item.adjunto.id),
  )

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    event.target.value = ""

    if (!archivo) return

    const error = validarArchivoAdjunto(archivo)
    if (error) {
      toast.error(error)
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setArchivoSeleccionado(archivo)
    setPreviewUrl(URL.createObjectURL(archivo))
  }

  function cancelarSeleccion() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setArchivoSeleccionado(null)
    setPreviewUrl(null)
    setProgreso(0)
  }

  async function handleSubir() {
    if (!archivoSeleccionado || subiendo) return

    setSubiendo(true)
    setProgreso(0)

    try {
      const adjunto = await fuente.subir(archivoSeleccionado, {
        onProgress: setProgreso,
      })
      const url = URL.createObjectURL(archivoSeleccionado)
      setSesion((prev) => [
        { url, archivo: archivoSeleccionado, adjunto },
        ...prev,
      ])

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setArchivoSeleccionado(null)
      setPreviewUrl(null)
      toast.success("Imagen subida correctamente.")

      if (ADJUNTOS_GALERIA_DISPONIBLE) {
        setReloadKey((key) => key + 1)
      }
    } catch (error) {
      if (error instanceof AdjuntoApiError && error.status === 403) {
        setPermisoSubir(false)
      }
      toast.error(mensajeErrorAdjunto(error, "subir imágenes"))
    } finally {
      setSubiendo(false)
      setProgreso(0)
    }
  }

  async function handleVer(adjunto: Adjunto) {
    try {
      const descarga = await fuente.descargar(adjunto.id)
      setVisor({ url: descarga.url, titulo: adjunto.nombreOriginal })
    } catch (error) {
      toast.error(mensajeErrorAdjunto(error, "consultar el adjunto"))
    }
  }

  async function handleDescargar(adjunto: Adjunto) {
    try {
      const descarga = await fuente.descargar(adjunto.id)
      const enlace = document.createElement("a")
      enlace.href = descarga.url
      enlace.download = adjunto.nombreOriginal
      enlace.target = "_blank"
      enlace.rel = "noopener"
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
    } catch (error) {
      toast.error(mensajeErrorAdjunto(error, "descargar el adjunto"))
    }
  }

  async function handleEliminar() {
    const target = eliminarTarget
    if (!target) return

    setEliminando(true)

    try {
      await fuente.eliminar(target.id)
      setAdjuntos((prev) => prev.filter((adjunto) => adjunto.id !== target.id))
      setEliminarTarget(null)
      toast.success("Adjunto eliminado.")
    } catch (error) {
      if (error instanceof AdjuntoApiError && error.status === 404) {
        setAdjuntos((prev) =>
          prev.filter((adjunto) => adjunto.id !== target.id),
        )
        setEliminarTarget(null)
        toast.error("El adjunto ya no existe.")
      } else {
        if (error instanceof AdjuntoApiError && error.status === 403) {
          setPermisoEliminar(false)
        }
        toast.error(mensajeErrorAdjunto(error, "eliminar el adjunto"))
      }
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className={className ?? "space-y-3"}>
      <input
        ref={inputRef}
        type="file"
        accept={ADJUNTOS_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Imágenes PNG, JPEG o WebP de hasta 10 MB.
        </p>

        {puedeSubir && permisoSubir && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            Subir imagen
          </Button>
        )}
      </div>

      {!ADJUNTOS_GALERIA_DISPONIBLE && (
        <div className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">
          La galería persistente está deshabilitada. Las imágenes que subas se
          mostrarán solo durante esta sesión.
        </div>
      )}

      {archivoSeleccionado && previewUrl && (
        <div className="rounded-xl border border-border/70 bg-background/60 p-3">
          <div className="flex items-start gap-3">
            <img
              src={previewUrl}
              alt={archivoSeleccionado.name}
              className="size-20 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {archivoSeleccionado.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatearTamanoAdjunto(archivoSeleccionado.size)}
              </p>
              {subiendo && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Subiendo... {progreso}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={subiendo}
              onClick={cancelarSeleccion}
              className="h-8 rounded-xl px-3 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={subiendo}
              onClick={() => void handleSubir()}
              className="h-8 rounded-xl px-3 text-xs font-semibold"
            >
              {subiendo ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <Upload aria-hidden="true" className="size-3.5" />
              )}
              Subir imagen
            </Button>
          </div>
        </div>
      )}

      {ADJUNTOS_GALERIA_DISPONIBLE && (
        <div className="space-y-2">
          {cargando ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-xl bg-muted/60"
                />
              ))}
            </div>
          ) : errorGaleria ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <span>{errorGaleria}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReloadKey((key) => key + 1)}
                className="h-8 rounded-xl px-3 text-xs font-semibold"
              >
                <RefreshCw aria-hidden="true" className="size-3.5" />
                Reintentar
              </Button>
            </div>
          ) : adjuntos.length === 0 && sesionVisibles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
              No hay adjuntos todavía.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {adjuntos.map((adjunto) => (
                <div
                  key={adjunto.id}
                  className="overflow-hidden rounded-xl border border-border/70 bg-background/60"
                >
                  <button
                    type="button"
                    onClick={() => void handleVer(adjunto)}
                    className="block w-full"
                    title="Ver imagen"
                  >
                    <AttachmentThumbnail
                      adjunto={adjunto}
                      descargar={fuente.descargar}
                    />
                  </button>
                  <div className="space-y-1 p-2.5">
                    <p
                      className="truncate text-xs font-semibold text-foreground"
                      title={adjunto.nombreOriginal}
                    >
                      {adjunto.nombreOriginal}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatearTamanoAdjunto(adjunto.tamano)} ·{" "}
                      {formatearFechaAdjunto(adjunto.subidoEn)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleVer(adjunto)}
                        className="h-7 px-2 text-[11px] font-semibold"
                      >
                        <Eye aria-hidden="true" className="size-3.5" />
                        Ver
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDescargar(adjunto)}
                        className="h-7 px-2 text-[11px] font-semibold"
                      >
                        <Download aria-hidden="true" className="size-3.5" />
                        Descargar
                      </Button>
                      {puedeEliminar &&
                        permisoEliminar &&
                        ADJUNTOS_ELIMINAR_DISPONIBLE && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Eliminar adjunto"
                          aria-label={`Eliminar ${adjunto.nombreOriginal}`}
                          disabled={eliminando}
                          onClick={() => setEliminarTarget(adjunto)}
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sesionVisibles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Subidas en esta sesión
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sesionVisibles.map((item) => (
              <div
                key={`${item.adjunto.id}-${item.url}`}
                className="overflow-hidden rounded-xl border border-border/70 bg-background/60"
              >
                <button
                  type="button"
                  onClick={() =>
                    setVisor({
                      url: item.url,
                      titulo: item.adjunto.nombreOriginal,
                    })
                  }
                  className="block w-full"
                  title="Ver imagen"
                >
                  <img
                    src={item.url}
                    alt={item.adjunto.nombreOriginal}
                    className="h-28 w-full object-cover"
                  />
                </button>
                <div className="space-y-1 p-2.5">
                  <p
                    className="truncate text-xs font-semibold text-foreground"
                    title={item.adjunto.nombreOriginal}
                  >
                    {item.adjunto.nombreOriginal}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {formatearTamanoAdjunto(item.adjunto.tamano)}
                    </p>
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      Solo en esta sesión
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setVisor({
                        url: item.url,
                        titulo: item.adjunto.nombreOriginal,
                      })
                    }
                    className="h-7 px-2 text-[11px] font-semibold"
                  >
                    <Eye aria-hidden="true" className="size-3.5" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ADJUNTOS_ELIMINAR_DISPONIBLE && (
        <ConfirmDeleteDialog
          open={eliminarTarget !== null}
          title="Eliminar adjunto"
          itemName={eliminarTarget?.nombreOriginal ?? "este adjunto"}
          description="La imagen se eliminará del almacenamiento. Esta acción no se puede deshacer."
          confirmLabel="Eliminar Adjunto"
          onConfirm={() => void handleEliminar()}
          onCancel={() => setEliminarTarget(null)}
        />
      )}

      <Dialog
        open={visor !== null}
        onOpenChange={(open) => {
          if (!open) setVisor(null)
        }}
      >
        <DialogContent className="w-[min(96vw,1100px)] max-w-none sm:max-w-none">
          <DialogHeader>
            <DialogTitle>{visor?.titulo ?? "Vista previa"}</DialogTitle>
            <DialogDescription>Vista previa del adjunto.</DialogDescription>
          </DialogHeader>
          {visor && (
            <div className="flex max-h-[75vh] items-center justify-center overflow-auto">
              <img
                src={visor.url}
                alt={visor.titulo}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
