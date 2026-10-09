import type { LicenseFormDraft } from "@/features/licenses/types/license"
import {
  detectCsvDelimiter,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRows,
} from "@/lib/csv"

const headers = [
  "Software",
  "Proveedor",
  "Clave de licencia",
  "Fecha de compra",
  "Fecha de vencimiento",
  "Asignado a",
  "Estado",
]

const headerFields: Record<string, string> = {
  software: "software",
  proveedor: "proveedor",
  clavedelicencia: "clave",
  clave: "clave",
  fechadecompra: "fechaCompra",
  fechadevencimiento: "fechaVencimiento",
  asignadoa: "asignadaAId",
  estado: "activa",
}

const requiredHeaders = [
  "software",
  "proveedor",
  "fechadecompra",
  "fechadevencimiento",
  "asignadoa",
  "estado",
]

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function parseAssignee(value: string): string {
  const normalized = normalizeCsvHeader(value)

  if (normalized === "" || normalized === "sinasignar" || normalized === "ninguno") {
    return ""
  }
  if (normalized === "admin" || normalized === "administrador") return "ADMIN"
  if (normalized === "tech01" || normalized === "carlosramirez" || normalized === "carlos") {
    return "TECH-01"
  }
  if (normalized === "tech02" || normalized === "danielvaldes" || normalized === "daniel") {
    return "TECH-02"
  }

  throw new Error(
    `Asignado a no válido: ${value}. Usa ADMIN, TECH-01, TECH-02 o déjalo vacío.`,
  )
}

function parseActive(value: string): boolean {
  const normalized = normalizeCsvHeader(value)

  if (
    normalized === "" ||
    normalized === "activa" ||
    normalized === "activo" ||
    normalized === "si" ||
    normalized === "true" ||
    normalized === "1"
  ) {
    return true
  }
  if (
    normalized === "inactiva" ||
    normalized === "inactivo" ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "0"
  ) {
    return false
  }

  throw new Error(`Estado no válido: ${value}. Usa Activa o Inactiva.`)
}

function parseDate(value: string, label: string): string {
  const trimmed = value.trim()
  if (trimmed === "") return ""
  if (!datePattern.test(trimmed)) {
    throw new Error(`${label} no válida: ${value}. Usa el formato AAAA-MM-DD.`)
  }
  return trimmed
}

export function downloadLicenseCsvTemplate() {
  downloadCsvTemplate(headers, "plantilla_registro_licencias.csv")
}

export function parseLicenseCsv(content: string): LicenseFormDraft[] {
  const csv = content.replace(/^\uFEFF/, "").trim()
  if (!csv) throw new Error("El archivo está vacío.")

  const rows = parseCsvRows(csv, detectCsvDelimiter(csv))
  const [headerRow, ...dataRows] = rows
  const normalizedHeaders = headerRow.map(normalizeCsvHeader)
  const missingHeaders = requiredHeaders.filter(
    (header) => !normalizedHeaders.includes(header),
  )

  if (missingHeaders.length > 0) {
    throw new Error(
      "El archivo no contiene todas las columnas de la plantilla. Descarga la plantilla y úsala para importar.",
    )
  }

  const records = dataRows.filter((record) => record.some((value) => value.length > 0))

  return records.map((record, index) => {
    try {
      const fields = new Map<string, string>()
      normalizedHeaders.forEach((header, columnIndex) => {
        const field = headerFields[header]
        if (field) fields.set(field, record[columnIndex] ?? "")
      })

      const value = (field: string) => fields.get(field)?.trim() ?? ""
      const software = value("software")
      if (!software) throw new Error("El nombre del software es obligatorio.")

      return {
        software,
        clave: value("clave"),
        proveedor: value("proveedor"),
        fechaCompra: parseDate(value("fechaCompra"), "Fecha de compra"),
        fechaVencimiento: parseDate(value("fechaVencimiento"), "Fecha de vencimiento"),
        asignadaAId: parseAssignee(value("asignadaAId")),
        activa: parseActive(value("activa")),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registro no válido."
      throw new Error(`Fila ${index + 2}: ${message}`, { cause: error })
    }
  })
}
