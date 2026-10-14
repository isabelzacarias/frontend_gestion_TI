import type {
  CredencialImportRow,
  CredentialDraft,
} from "@/features/passwords/types/credential"
import {
  detectCsvDelimiter,
  downloadCsv,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRowsWithLines,
} from "@/lib/csv"

export const MAX_IMPORT_RECORDS = 500

const headers = ["Nombre", "Tipo", "Usuario", "Contraseña", "Comentario"]

const headerFields: Record<string, keyof CredentialDraft> = {
  nombre: "nombre",
  tipo: "tipo",
  usuario: "usuario",
  contrasena: "password",
  comentario: "comentario",
}

const requiredFields: Array<keyof CredentialDraft> = ["nombre", "password"]

const fieldLabels: Record<keyof CredentialDraft, string> = {
  nombre: "Nombre",
  tipo: "Tipo",
  usuario: "Usuario",
  password: "Contraseña",
  comentario: "Comentario",
}

function resolveHeaderField(header: string): keyof CredentialDraft | undefined {
  const exactField = headerFields[header]
  if (exactField) return exactField

  if (
    header === "password" ||
    header === "clave" ||
    header.startsWith("contrasena")
  ) {
    return "password"
  }

  if (
    header === "notas" ||
    header === "notes" ||
    header.startsWith("observacion") ||
    header.startsWith("comentario")
  ) {
    return "comentario"
  }

  return undefined
}

export function downloadCredentialCsvTemplate() {
  downloadCsvTemplate(headers, "plantilla_registro_credenciales.csv")
}

export function parseCredentialCsv(content: string): CredentialDraft[] {
  const csv = content.replace(/^\uFEFF/, "").trim()
  if (!csv) throw new Error("El archivo está vacío.")

  const delimiter = detectCsvDelimiter(csv)
  const rows = parseCsvRowsWithLines(csv, delimiter)

  if (rows.length === 0) {
    throw new Error("El archivo no contiene filas legibles.")
  }

  const [headerRow, ...dataRows] = rows
  const normalizedHeaders = headerRow.values.map(normalizeCsvHeader)
  const missingHeaders = requiredFields.filter((field) =>
    normalizedHeaders.every((header) => resolveHeaderField(header) !== field),
  )

  if (missingHeaders.length > 0) {
    const missingLabels = missingHeaders.map((field) => fieldLabels[field])
    throw new Error(
      `Faltan las columnas obligatorias: ${missingLabels.join(", ")}. Descarga la plantilla de credenciales y úsala para importar.`,
    )
  }

  const records = dataRows.filter((row) =>
    row.values.some((value) => value.length > 0),
  )

  if (records.length === 0) {
    throw new Error("El archivo no contiene filas de datos para registrar.")
  }

  if (records.length > MAX_IMPORT_RECORDS) {
    throw new Error(
      `El archivo contiene ${records.length} registros. El backend puede procesar un máximo de ${MAX_IMPORT_RECORDS} registros por lote. Por favor divide la carga en lotes de hasta ${MAX_IMPORT_RECORDS}.`,
    )
  }

  return records.map((record) => {
    const fields = new Map<keyof CredentialDraft, string>()
    normalizedHeaders.forEach((header, columnIndex) => {
      const field = resolveHeaderField(header)
      if (field) fields.set(field, record.values[columnIndex] ?? "")
    })

    const value = (field: keyof CredentialDraft) => fields.get(field) ?? ""

    return {
      filaOrigen: record.lineNumber,
      nombre: value("nombre").trim(),
      tipo: value("tipo").trim(),
      usuario: value("usuario").trim(),
      password: value("password"),
      comentario: value("comentario").trim(),
    }
  })
}

export function transformDraftsToImportRows(
  records: CredentialDraft[],
): CredencialImportRow[] {
  return records.map((record, index) => ({
    fila: record.filaOrigen ?? index + 2,
    Nombre: record.nombre,
    Tipo: record.tipo,
    Usuario: record.usuario,
    Contraseña: record.password,
    Comentario: record.comentario,
  }))
}

export interface CredentialImportErrorRow {
  fila: number
  errores: string[]
  advertencias: string[]
}

const IMPORT_ERROR_HEADERS = [
  "Fila",
  "Nombre",
  "Tipo",
  "Usuario",
  "Contraseña",
  "Comentario",
  "Errores",
  "Advertencias",
]

function timestampForFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  return (
    [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join("") +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

export function downloadCredentialImportErrors(
  records: CredentialDraft[],
  filas: CredentialImportErrorRow[],
  fileName = `secretos_rechazados_${timestampForFileName(new Date())}.csv`,
): number {
  const recordsByFila = new Map<number, CredentialDraft>()
  records.forEach((record, index) => {
    recordsByFila.set(record.filaOrigen ?? index + 2, record)
  })

  const rows = filas
    .filter((fila) => fila.errores.length > 0)
    .map((fila) => {
      const record = recordsByFila.get(fila.fila)
      return [
        String(fila.fila),
        record?.nombre ?? "",
        record?.tipo ?? "",
        record?.usuario ?? "",
        record?.password ?? "",
        record?.comentario ?? "",
        fila.errores.join(" | "),
        fila.advertencias.join(" | "),
      ]
    })

  if (rows.length === 0) return 0

  downloadCsv(IMPORT_ERROR_HEADERS, rows, fileName)
  return rows.length
}
