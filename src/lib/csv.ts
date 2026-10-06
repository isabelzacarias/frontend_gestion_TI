export function normalizeCsvHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

export function parseCsvRows(content: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]

    if (character === '"') {
      if (inQuotes && content[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (!inQuotes && character === delimiter) {
      row.push(field.trim())
      field = ""
    } else if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && content[index + 1] === "\n") index += 1
      row.push(field.trim())
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      field = ""
    } else {
      field += character
    }
  }

  if (inQuotes) {
    throw new Error("El archivo contiene comillas sin cerrar. Revisa el formato CSV.")
  }

  row.push(field.trim())
  if (row.some((value) => value.length > 0)) rows.push(row)
  return rows
}

export function detectCsvDelimiter(content: string) {
  const candidates = [";", ",", "\t"]
  return candidates.reduce((best, candidate) => {
    const bestWidth = parseCsvRows(content, best)[0]?.length ?? 0
    const candidateWidth = parseCsvRows(content, candidate)[0]?.length ?? 0
    return candidateWidth > bestWidth ? candidate : best
  }, ";")
}

export function downloadCsvTemplate(headers: string[], fileName: string) {
  const content = `\uFEFF${headers.join(";")}\r\n`
  const file = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}