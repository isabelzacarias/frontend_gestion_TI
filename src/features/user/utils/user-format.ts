import type { ResumenCatalogo } from "@/services/usuario.service"

export function formatearFecha(value: string | null | undefined): string {
  if (!value) return "—"

  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return value

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function catalogoNombre(
  catalogo: ResumenCatalogo | null | undefined,
): string {
  return catalogo?.nombre ?? "—"
}
