import type { AssignmentFormDraft } from "@/features/assignments/components/AssignmentFormDialog"
import {
  assignmentAssetOptions,
  assignmentUserOptions,
} from "@/features/assignments/data/assignmentsData"
import {
  detectCsvDelimiter,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRows,
} from "@/lib/csv"

const headers = [
  "Equipo",
  "ID de activo",
  "ID de usuario",
  "Número de activo",
  "Año de compra",
  "Fecha de asignación",
  "Fecha de devolución",
  "Estado",
  "Observación",
]

const headerFields: Record<string, keyof AssignmentFormDraft> = {
  equipo: "nombreEquipo",
  iddeactivo: "activoId",
  iddeusuario: "usuarioId",
  numerodeactivo: "numeroActivo",
  anodecompra: "anioCompra",
  fechadeasignacion: "fechaAsignacion",
  fechadedevolucion: "fechaDevolucion",
  estado: "activa",
  observacion: "observacion",
}

const requiredHeaders = Object.keys(headerFields)
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function resolveAssetId(value: string): string {
  const raw = value.trim()
  if (!raw) throw new Error("El ID del activo es obligatorio.")

  const byId = assignmentAssetOptions.find((asset) => String(asset.id) === raw)
  if (byId) return String(byId.id)

  const target = raw.toLowerCase()
  const byClave = assignmentAssetOptions.find(
    (asset) => (asset.claveActivo ?? "").toLowerCase() === target,
  )
  if (byClave) return String(byClave.id)

  throw new Error(`No existe un activo con ID o clave "${value}".`)
}

function resolveUserId(value: string): string {
  const raw = value.trim()
  if (!raw) throw new Error("El ID del usuario es obligatorio.")

  const byId = assignmentUserOptions.find((user) => user.id === raw)
  if (byId) return byId.id

  const target = raw.toLowerCase()
  const byEmail = assignmentUserOptions.find(
    (user) => (user.email ?? "").toLowerCase() === target,
  )
  if (byEmail) return byEmail.id

  throw new Error(`No existe un usuario con ID o correo "${value}".`)
}

function parseActive(value: string): "true" | "false" {
  const normalized = normalizeCsvHeader(value)

  if (
    normalized === "" ||
    normalized === "activa" ||
    normalized === "activo" ||
    normalized === "si" ||
    normalized === "true" ||
    normalized === "1"
  ) {
    return "true"
  }
  if (
    normalized === "devuelta" ||
    normalized === "devuelto" ||
    normalized === "inactiva" ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "0"
  ) {
    return "false"
  }

  throw new Error(`Estado no válido: ${value}. Usa Activa o Devuelta.`)
}

function parseDate(value: string, label: string): string {
  const trimmed = value.trim()
  if (trimmed === "") return ""
  if (!datePattern.test(trimmed)) {
    throw new Error(`${label} no válida: ${value}. Usa el formato AAAA-MM-DD.`)
  }
  return trimmed
}

function parseYear(value: string): string {
  const trimmed = value.trim()
  if (trimmed === "") return ""
  if (!/^\d{4}$/.test(trimmed)) {
    throw new Error(`Año de compra no válido: ${value}. Usa un año de 4 dígitos.`)
  }
  return trimmed
}

export function downloadAssignmentCsvTemplate() {
  downloadCsvTemplate(headers, "plantilla_registro_asignaciones.csv")
}

export function parseAssignmentCsv(content: string): AssignmentFormDraft[] {
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

      const value = (field: keyof AssignmentFormDraft) => fields.get(field)?.trim() ?? ""

      return {
        usuarioId: resolveUserId(value("usuarioId")),
        activoId: resolveAssetId(value("activoId")),
        nombreEquipo: value("nombreEquipo"),
        numeroActivo: value("numeroActivo"),
        anioCompra: parseYear(value("anioCompra")),
        fechaAsignacion: parseDate(value("fechaAsignacion"), "Fecha de asignación"),
        fechaDevolucion: parseDate(value("fechaDevolucion"), "Fecha de devolución"),
        activa: parseActive(value("activa")),
        observacion: value("observacion"),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registro no válido."
      throw new Error(`Fila ${index + 2}: ${message}`, { cause: error })
    }
  })
}
