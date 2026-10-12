import type { AssignmentFormDraft } from "@/features/assignments/components/AssignmentFormDialog"
import type { ActivoResumen } from "@/types/activo"
import type { UsuarioLista } from "@/services/usuario.service"
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
  "Observación",
]

const headerFields: Record<string, keyof AssignmentFormDraft> = {
  equipo: "nombreEquipo",
  iddeactivo: "activoId",
  iddeusuario: "usuarioId",
  numerodeactivo: "numeroActivo",
  anodecompra: "anioCompra",
  observacion: "observacion",
}

const requiredHeaders = ["iddeactivo", "iddeusuario"]

export interface ReferenciasImportacionAsignacion {
  activos: ActivoResumen[]
  usuarios: UsuarioLista[]
}

function resolveAssetId(value: string, activos: ActivoResumen[]): string {
  const raw = value.trim()
  if (!raw) throw new Error("El ID del activo es obligatorio.")

  const target = raw.toLowerCase()
  const activo = activos.find(
    (item) =>
      String(item.id) === raw ||
      (item.claveActivo ?? "").toLowerCase() === target,
  )
  if (!activo) {
    throw new Error(`No existe un activo con ID o clave "${value}".`)
  }

  return String(activo.id)
}

function resolveUserId(value: string, usuarios: UsuarioLista[]): string {
  const raw = value.trim()
  if (!raw) throw new Error("El ID del usuario es obligatorio.")

  const target = raw.toLowerCase()
  const usuario = usuarios.find(
    (item) =>
      item.id === raw ||
      (item.email ?? "").toLowerCase() === target ||
      item.nombre.toLowerCase() === target,
  )
  if (!usuario) {
    throw new Error(`No existe un usuario con ID, correo o nombre "${value}".`)
  }

  return usuario.id
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

export function parseAssignmentCsv(
  content: string,
  referencias: ReferenciasImportacionAsignacion,
): AssignmentFormDraft[] {
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

  const records = dataRows.filter((record) =>
    record.some((value) => value.length > 0),
  )

  return records.map((record, index) => {
    try {
      const fields = new Map<string, string>()
      normalizedHeaders.forEach((header, columnIndex) => {
        const field = headerFields[header]
        if (field) fields.set(field, record[columnIndex] ?? "")
      })

      const value = (field: keyof AssignmentFormDraft) =>
        fields.get(field)?.trim() ?? ""

      return {
        usuarioId: resolveUserId(value("usuarioId"), referencias.usuarios),
        activoId: resolveAssetId(value("activoId"), referencias.activos),
        nombreEquipo: value("nombreEquipo"),
        numeroActivo: value("numeroActivo"),
        anioCompra: parseYear(value("anioCompra")),
        observacion: value("observacion"),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registro no válido."
      throw new Error(`Fila ${index + 2}: ${message}`, { cause: error })
    }
  })
}
