import type { CredentialDraft } from "@/features/passwords/types/credential"
import { evaluatePasswordStrength } from "@/features/passwords/utils/password-strength"
import {
  detectCsvDelimiter,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRows,
} from "@/lib/csv"

const headers = ["Nombre", "Tipo", "Usuario", "Contraseña", "Comentario"]

const headerFields: Record<string, keyof CredentialDraft> = {
  nombre: "nombre",
  tipo: "tipo",
  usuario: "usuario",
  contrasena: "password",
  comentario: "comentario",
}

const requiredFields: Array<keyof CredentialDraft> = [
  "nombre",
  "tipo",
  "usuario",
  "password",
]

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

  const rows = parseCsvRows(csv, detectCsvDelimiter(csv))
  const [headerRow, ...dataRows] = rows
  const normalizedHeaders = headerRow.map(normalizeCsvHeader)
  const missingHeaders = requiredFields.filter((field) =>
    normalizedHeaders.every((header) => resolveHeaderField(header) !== field),
  )

  if (missingHeaders.length > 0) {
    const missingLabels = missingHeaders.map((field) => fieldLabels[field])
    throw new Error(
      `Faltan las columnas obligatorias: ${missingLabels.join(", ")}. Descarga la plantilla de credenciales y úsala para importar.`,
    )
  }

  const records = dataRows.filter((row) => row.some((value) => value.length > 0))

  return records.map((record, index) => {
    try {
      const fields = new Map<keyof CredentialDraft, string>()
      normalizedHeaders.forEach((header, columnIndex) => {
        const field = resolveHeaderField(header)
        if (field) fields.set(field, record[columnIndex] ?? "")
      })

      const value = (field: keyof CredentialDraft) => fields.get(field)?.trim() ?? ""
      const draft: CredentialDraft = {
        nombre: value("nombre"),
        tipo: value("tipo"),
        usuario: value("usuario"),
        password: value("password"),
        comentario: value("comentario"),
      }

      const missingFields = requiredFields.filter((field) => !draft[field])
      if (missingFields.length > 0) {
        throw new Error("Completa los campos requeridos del formulario.")
      }

      if (!evaluatePasswordStrength(draft.password).isStrong) {
        throw new Error("La contraseña no cumple todos los requisitos de seguridad.")
      }

      return draft
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registro no válido."
      throw new Error(`Fila ${index + 2}: ${message}`, { cause: error })
    }
  })
}
