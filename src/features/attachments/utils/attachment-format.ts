export const ADJUNTOS_MIME_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const

export const ADJUNTO_TAMANO_MAXIMO = 10 * 1024 * 1024

export const ADJUNTOS_ACCEPT = ADJUNTOS_MIME_PERMITIDOS.join(",")

export function validarArchivoAdjunto(archivo: File): string | null {
  if (
    !(ADJUNTOS_MIME_PERMITIDOS as readonly string[]).includes(archivo.type)
  ) {
    return "Solo se permiten imágenes PNG, JPEG o WebP."
  }

  if (archivo.size <= 0) {
    return "El archivo está vacío."
  }

  if (archivo.size > ADJUNTO_TAMANO_MAXIMO) {
    return "La imagen no puede superar los 10 MB."
  }

  return null
}

export function formatearTamanoAdjunto(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatearFechaAdjunto(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
