import type { CredentialDraft } from "@/features/passwords/types/credential"
import { evaluatePasswordStrength } from "@/features/passwords/utils/password-strength"
import {
  detectCsvDelimiter,
  downloadCsvTemplate,
  normalizeCsvHeader,
  parseCsvRows,
} from "@/lib/csv"

const headers = [
  "Servicio",
  "Cuenta / correo",
  "Nombre de usuario",
  "Contraseña",
  "Sitio web",
  "Categoría",
  "Notas",
]

const headerFields: Record<string, keyof CredentialDraft> = {
  servicio: "service",
  cuentacorreo: "account",
  nombredeusuario: "username",
  contrasena: "password",
  sitoweb: "website",
  categoria: "category",
  notas: "notes",
}

const requiredFields: Array<keyof CredentialDraft> = [
  "service",
  "account",
  "username",
  "password",
  "website",
  "category",
]

const fieldLabels: Record<keyof CredentialDraft, string> = {
  service: "Servicio",
  account: "Cuenta / correo",
  username: "Nombre de usuario",
  password: "Contraseña",
  website: "Sitio web",
  category: "Categoría",
  notes: "Notas",
}

function resolveHeaderField(header: string): keyof CredentialDraft | undefined {
  const exactField = headerFields[header]
  if (exactField) return exactField

  if (
    header === "url" ||
    header === "urlweb" ||
    header === "enlace" ||
    header === "enlaceweb" ||
    header.startsWith("sitioweb") ||
    header.startsWith("website")
  ) {
    return "website"
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
    const missingLabels = missingHeaders.map((field) =>
      field === "website"
        ? 'Sitio web (también se acepta "URL")'
        : fieldLabels[field],
    )
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
        service: value("service"),
        account: value("account"),
        username: value("username"),
        password: value("password"),
        website: value("website"),
        category: value("category"),
        notes: value("notes"),
      }

      const missingFields = requiredFields.filter((field) => !draft[field])
      if (missingFields.length > 0) {
        throw new Error("Completa los campos requeridos del formulario.")
      }

      let website: URL
      try {
        website = new URL(draft.website)
      } catch {
        throw new Error("El sitio web debe ser una URL válida con http o https.")
      }
      if (website.protocol !== "http:" && website.protocol !== "https:") {
        throw new Error("El sitio web debe comenzar con http:// o https://.")
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