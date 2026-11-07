import { describe, expect, it } from "vitest"

import {
  detectCsvDelimiter,
  normalizeCsvHeader,
  parseCsvRows,
  parseCsvRowsWithLines,
} from "./csv"

describe("utilidades CSV", () => {
  it("normaliza encabezados quitando acentos y simbolos", () => {
    expect(normalizeCsvHeader("  Correo Electrónico  ")).toBe(
      "correoelectronico",
    )
    expect(normalizeCsvHeader("Fecha-de_ingreso")).toBe("fechadeingreso")
  })

  it("parsea filas respetando comillas y delimitador", () => {
    const contenido = 'nombre;correo\n"Perez, Ana";ana@test.local\nLuis;luis@test.local'

    expect(parseCsvRows(contenido, ";")).toEqual([
      ["nombre", "correo"],
      ["Perez, Ana", "ana@test.local"],
      ["Luis", "luis@test.local"],
    ])
  })

  it("conserva el numero de linea de cada fila", () => {
    const filas = parseCsvRowsWithLines(
      "nombre;correo\n\nAna;ana@test.local",
      ";",
    )

    expect(filas).toEqual([
      { lineNumber: 1, values: ["nombre", "correo"] },
      { lineNumber: 3, values: ["Ana", "ana@test.local"] },
    ])
  })

  it("soporta comillas escapadas", () => {
    const filas = parseCsvRows('nombre;descripcion\nAna;"dice ""hola"""', ";")

    expect(filas[1]).toEqual(["Ana", 'dice "hola"'])
  })

  it("rechaza comillas sin cerrar", () => {
    expect(() => parseCsvRows('nombre;correo\n"Ana;ana@test.local', ";")).toThrow(
      "El archivo contiene comillas sin cerrar",
    )
  })

  it("detecta el delimitador con mayor cantidad de columnas", () => {
    expect(detectCsvDelimiter("a,b,c\nd,e,f")).toBe(",")
    expect(detectCsvDelimiter("a;b;c\nd;e;f")).toBe(";")
  })
})
