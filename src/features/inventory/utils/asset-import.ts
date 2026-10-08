import type { AssetFormDraft } from "@/features/inventory/components/AssetFormDialog"
import {
  detectCsvDelimiter,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRows,
} from "@/lib/csv"

const headers = [
  "CB23",
  "Tipo",
  "Marca",
  "Modelo",
  "Número de serie",
  "Sucursal",
  "Estado",
  "Estado general",
  "Red",
  "Nombre responsable",
  "Correo responsable",
]

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
  nombreresponsable: "responsableNombre",
  correoresponsable: "responsableEmail",
}

const requiredHeaders = Object.keys(headerFields)

function parseType(value: string): AssetFormDraft["tipo"] {
  const types: Record<string, AssetFormDraft["tipo"]> = {
    laptop: "Laptop",
    tablet: "Tablet",
    desktop: "Desktop",
    monitor: "Monitor",
    servidor: "Servidor",
    impresora: "Impresora",
    switch: "Switch",
    router: "Router",
  }
  const result = types[normalizeCsvHeader(value)]
  if (!result) throw new Error(`Tipo de equipo no válido: ${value}.`)
  return result
}

function parseBranch(value: string): AssetFormDraft["sucursal"] {
  const branch = normalizeCsvHeader(value).toUpperCase()
  if (branch === "PLAYA" || branch === "MERIDA" || branch === "CANCUN") {
    return branch
  }
  throw new Error(`Sucursal no válida: ${value}. Usa PLAYA, MERIDA o CANCUN.`)
}

function parseState(value: string): AssetFormDraft["estado"] {
  const states: Record<string, AssetFormDraft["estado"]> = {
    enuso: "EN_USO",
    disponible: "DISPONIBLE",
    mantenimiento: "MANTENIMIENTO",
    baja: "BAJA",
  }
  const result = states[normalizeCsvHeader(value)]
  if (!result) {
    throw new Error(`Estado no válido: ${value}. Usa En uso, Disponible, Mantenimiento o Baja.`)
  }
  return result
}

function parseGeneralState(value: string): AssetFormDraft["estadoGeneral"] {
  const states: Record<string, AssetFormDraft["estadoGeneral"]> = {
    excelente: "Excelente",
    bueno: "Bueno",
    regular: "Regular",
    critico: "Crítico",
  }
  const result = states[normalizeCsvHeader(value)]
  if (!result) {
    throw new Error(`Estado general no válido: ${value}. Usa Excelente, Bueno, Regular o Crítico.`)
  }
  return result
}

export function downloadAssetCsvTemplate() {
  downloadCsvTemplate(headers, "plantilla_registro_activos.csv")
}

export function parseAssetCsv(content: string): AssetFormDraft[] {
  const csv = content.replace(/^\uFEFF/, "").trim()
  if (!csv) throw new Error("El archivo está vacío.")

  const rows = parseCsvRows(csv, detectCsvDelimiter(csv))
  const [headerRow, ...dataRows] = rows
  const headersNormalized = headerRow.map(normalizeCsvHeader)
  const missingHeaders = requiredHeaders.filter(
    (header) => !headersNormalized.includes(header),
  )

  if (missingHeaders.length > 0) {
    throw new Error(
      "El archivo no contiene todas las columnas de la plantilla. Descarga la plantilla y úsala para importar.",
    )
  }

  const records = dataRows.filter((record) => record.some((value) => value.length > 0))

  return records.map((record, index) => {
    try {
      const importedFields = new Map<keyof AssetFormDraft, string>()
      headersNormalized.forEach((header, headerIndex) => {
        const field = headerFields[header]
        if (field) importedFields.set(field, record[headerIndex] ?? "")
      })

      const value = (field: keyof AssetFormDraft) => importedFields.get(field) ?? ""
      return {
        cb23: value("cb23"),
        tipo: parseType(value("tipo")),
        marca: value("marca"),
        modelo: value("modelo"),
        numeroSerie: value("numeroSerie"),
        sucursal: parseBranch(value("sucursal")),
        estado: parseState(value("estado")),
        estadoGeneral: parseGeneralState(value("estadoGeneral")),
        nombreRed: value("nombreRed"),
        responsableNombre: value("responsableNombre"),
        responsableEmail: value("responsableEmail"),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registro no válido."
      throw new Error(`Fila ${index + 2}: ${message}`, { cause: error })
    }
  })
}