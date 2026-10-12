import { downloadCsv } from "@/lib/csv"
import type { ActivoResumen, EstadoActivo } from "@/types/activo"

export const ASSET_EXPORT_HEADERS = [
  "ID",
  "Clave",
  "CB23",
  "Tipo",
  "Marca",
  "Modelo",
  "Número de serie",
  "Sucursal",
  "Estado",
  "Estado general",
  "Red",
  "Responsable",
  "Correo responsable",
]

export const estadoExportLabels: Record<EstadoActivo, string> = {
  EN_USO: "En uso",
  EN_ALMACEN: "En almacén",
  EN_MANTENIMIENTO: "En mantenimiento",
  DE_BAJA: "De baja",
}

function toText(value: string | null | undefined): string {
  const texto = value?.trim() ?? ""
  return texto
}

export function activosToExportRows(activos: ActivoResumen[]): string[][] {
  return activos.map((activo) => [
    String(activo.id),
    toText(activo.claveActivo),
    toText(activo.cb23),
    toText(activo.tipo),
    toText(activo.marca),
    toText(activo.modelo),
    toText(activo.numeroSerie),
    toText(activo.sucursal),
    estadoExportLabels[activo.estado],
    toText(activo.estadoGeneral),
    toText(activo.nombreRed),
    toText(activo.responsable?.nombre),
    toText(activo.responsable?.email),
  ])
}

function buildExportFileName(): string {
  const ahora = new Date()
  const partes = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
    String(ahora.getHours()).padStart(2, "0"),
    String(ahora.getMinutes()).padStart(2, "0"),
    String(ahora.getSeconds()).padStart(2, "0"),
  ]
  return `inventario_activos_${partes[0]}${partes[1]}${partes[2]}_${partes[3]}${partes[4]}${partes[5]}.csv`
}

export function exportActivosToCsv(
  activos: ActivoResumen[],
  fileName = buildExportFileName(),
) {
  downloadCsv(ASSET_EXPORT_HEADERS, activosToExportRows(activos), fileName)
}
