import type { AssetFormDraft } from "@/features/inventory/components/AssetFormDialog"
import type { InventoryItem } from "@/features/inventory/data/inventoryData"
import {
  detectCsvDelimiter,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRowsWithLines,
} from "@/lib/csv"

/**
 * Límite máximo de registros soportado por el backend para importación masiva.
 */
export const MAX_IMPORT_RECORDS = 500

/**
 * Encabezados oficiales de la plantilla según el roadmap:
 * CB23;Tipo;Marca;Modelo;Número de serie;Sucursal;Estado;Estado general;Red
 */
export const ASSET_CSV_TEMPLATE_HEADERS = [
  "CB23",
  "Tipo",
  "Marca",
  "Modelo",
  "Número de serie",
  "Sucursal",
  "Estado",
  "Estado general",
  "Red",
]

/**
 * Mapeo de columnas normalizadas del CSV hacia las propiedades de la entidad.
 */
const headerFields: Record<string, keyof AssetFormDraft> = {
  cb23: "cb23",
  tipo: "tipo",
  marca: "marca",
  modelo: "modelo",
  numerodeserie: "numeroSerie",
  sucursal: "sucursal",
  estado: "estado",
  estadogeneral: "estadoGeneral",
  red: "nombreRed",
  nombrered: "nombreRed",
  nombredered: "nombreRed",
  nombreresponsable: "responsableNombre",
  correoresponsable: "responsableEmail",
}

/**
 * Columnas mínimas obligatorias que deben estar presentes en el archivo CSV.
 */
const requiredNormalizedHeaders = [
  "cb23",
  "tipo",
  "marca",
  "modelo",
  "numerodeserie",
  "sucursal",
  "estado",
  "estadogeneral",
]

/**
 * Formatea o valida el tipo de equipo (permite cualquier tipo no vacío, con mayúscula inicial).
 */
function parseType(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error("El campo 'Tipo' no puede estar vacío.")
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Valida y normaliza la sucursal (CANCUN | PLAYA | MERIDA).
 */
function parseBranch(value: string): string {
  const branch = normalizeCsvHeader(value).toUpperCase()
  if (branch === "PLAYA" || branch === "MERIDA" || branch === "CANCUN") {
    return branch
  }
  throw new Error(
    `Sucursal no válida: "${value}". Valores permitidos: CANCUN, PLAYA o MERIDA.`,
  )
}

/**
 * Normaliza el estado del activo (EN_USO, DISPONIBLE, MANTENIMIENTO, BAJA).
 */
function parseState(value: string): InventoryItem["estado"] {
  const norm = normalizeCsvHeader(value)
  const states: Record<string, InventoryItem["estado"]> = {
    enuso: "EN_USO",
    disponible: "DISPONIBLE",
    mantenimiento: "MANTENIMIENTO",
    baja: "BAJA",
  }
  const result = states[norm]
  if (!result) {
    throw new Error(
      `Estado no válido: "${value}". Usa En uso, Disponible, Mantenimiento o Baja.`,
    )
  }
  return result
}

/**
 * Normaliza el estado general del activo (Excelente, Bueno, Regular, Crítico).
 */
function parseGeneralState(value: string): InventoryItem["estadoGeneral"] {
  const norm = normalizeCsvHeader(value)
  const states: Record<string, InventoryItem["estadoGeneral"]> = {
    excelente: "Excelente",
    bueno: "Bueno",
    regular: "Regular",
    critico: "Crítico",
  }
  const result = states[norm]
  if (!result) {
    throw new Error(
      `Estado general no válido: "${value}". Usa Excelente, Bueno, Regular o Crítico.`,
    )
  }
  return result
}

/**
 * Descarga la plantilla CSV con delimitador ';' y codificación UTF-8 con BOM.
 */
export function downloadAssetCsvTemplate() {
  downloadCsvTemplate(ASSET_CSV_TEMPLATE_HEADERS, "plantilla_registro_activos.csv")
}

/**
 * Representación en formato JSON lista para ser enviada al backend en importación masiva.
 */
export interface AssetBulkJsonPayloadItem {
  filaOrigen: number
  cb23: string
  tipo: string
  marca: string
  modelo: string
  numeroSerie: string
  sucursal: string
  estado: string
  estadoGeneral: string
  nombreRed: string
  responsableNombre?: string
  responsableEmail?: string
}

/**
 * Transforma un conjunto de borradores de activos al formato JSON esperado por el backend.
 */
export function transformDraftsToBulkJson(
  records: AssetFormDraft[],
): AssetBulkJsonPayloadItem[] {
  return records.map((record, index) => ({
    filaOrigen: record.filaOrigen ?? index + 2,
    cb23: record.cb23.trim(),
    tipo: record.tipo.trim(),
    marca: record.marca.trim(),
    modelo: record.modelo.trim(),
    numeroSerie: record.numeroSerie.trim(),
    sucursal: record.sucursal.trim(),
    estado: record.estado,
    estadoGeneral: record.estadoGeneral,
    nombreRed: record.nombreRed.trim(),
    ...(record.responsableNombre?.trim()
      ? { responsableNombre: record.responsableNombre.trim() }
      : {}),
    ...(record.responsableEmail?.trim()
      ? { responsableEmail: record.responsableEmail.trim() }
      : {}),
  }))
}

/**
 * Analiza y parsea localmente el archivo CSV de activos en el frontend:
 * - Soporta UTF-8 con o sin BOM (\uFEFF)
 * - Autodetecta delimitador (priorizando ';')
 * - Maneja campos entre comillas
 * - Valida encabezados requeridos (acentuados / normalizados)
 * - Valida límite máximo de 500 registros
 * - Preserva el número de fila de origen para reporte de errores
 */
export function parseAssetCsv(content: string): AssetFormDraft[] {
  const csv = content.replace(/^\uFEFF/, "").trim()
  if (!csv) {
    throw new Error("El archivo está vacío.")
  }

  const delimiter = detectCsvDelimiter(csv)
  const rows = parseCsvRowsWithLines(csv, delimiter)

  if (rows.length === 0) {
    throw new Error("El archivo no contiene filas legibles.")
  }

  const [headerRow, ...dataRows] = rows
  const headersNormalized = headerRow.values.map(normalizeCsvHeader)

  // Validar presencia de columnas obligatorias
  const missingHeaders = requiredNormalizedHeaders.filter(
    (header) => !headersNormalized.includes(header),
  )

  // Validar también la columna 'red' (puede llamarse red, nombrered o nombredered)
  const hasRedHeader = headersNormalized.some((h) =>
    ["red", "nombrered", "nombredered"].includes(h),
  )
  if (!hasRedHeader) {
    missingHeaders.push("red")
  }

  if (missingHeaders.length > 0) {
    throw new Error(
      "El archivo no contiene todas las columnas requeridas (CB23, Tipo, Marca, Modelo, Número de serie, Sucursal, Estado, Estado general, Red). Por favor descarga y usa la plantilla oficial.",
    )
  }

  // Filtrar solo filas con al menos una celda con contenido
  const records = dataRows.filter((record) =>
    record.values.some((value) => value.length > 0),
  )

  if (records.length === 0) {
    throw new Error("El archivo no contiene filas de datos para registrar.")
  }

  // Validación mandatoria de límite máximo (500 registros)
  if (records.length > MAX_IMPORT_RECORDS) {
    throw new Error(
      `El archivo contiene ${records.length} registros. El backend puede procesar un máximo de ${MAX_IMPORT_RECORDS} registros por lote. Por favor divide la carga en lotes de hasta ${MAX_IMPORT_RECORDS}.`,
    )
  }

  return records.map((record) => {
    try {
      const importedFields = new Map<keyof AssetFormDraft, string>()
      headersNormalized.forEach((header, headerIndex) => {
        const field = headerFields[header]
        if (field) {
          importedFields.set(field, record.values[headerIndex] ?? "")
        }
      })

      const value = (field: keyof AssetFormDraft) =>
        importedFields.get(field) ?? ""

      return {
        filaOrigen: record.lineNumber,
        cb23: value("cb23").trim(),
        tipo: parseType(value("tipo")),
        marca: value("marca").trim(),
        modelo: value("modelo").trim(),
        numeroSerie: value("numeroSerie").trim(),
        sucursal: parseBranch(value("sucursal")),
        estado: parseState(value("estado")),
        estadoGeneral: parseGeneralState(value("estadoGeneral")),
        nombreRed: value("nombreRed").trim(),
        responsableNombre: value("responsableNombre").trim(),
        responsableEmail: value("responsableEmail").trim(),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registro no válido."
      throw new Error(`Fila ${record.lineNumber}: ${message}`, { cause: error })
    }
  })
}