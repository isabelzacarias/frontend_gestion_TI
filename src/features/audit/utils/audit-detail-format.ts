export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function esCadena(value: unknown): value is string {
  return typeof value === "string"
}

export function textoValor(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function resumenDetalle(detalle: unknown): string {
  if (detalle === null || detalle === undefined) return "Sin detalle"

  if (!isRecord(detalle)) return textoValor(detalle)

  const campos = Array.isArray(detalle.campos)
    ? detalle.campos.filter(esCadena)
    : []

  if (campos.length > 0) {
    return `Campos: ${campos.join(", ")}`
  }

  if (isRecord(detalle.resumen)) {
    const partes = Object.entries(detalle.resumen).map(
      ([clave, valor]) => `${clave}: ${textoValor(valor)}`,
    )
    if (partes.length > 0) return partes.join(" · ")
  }

  const partes = Object.entries(detalle).map(
    ([clave, valor]) => `${clave}: ${textoValor(valor)}`,
  )
  return partes.length > 0 ? partes.join(" · ") : "Sin detalle"
}
