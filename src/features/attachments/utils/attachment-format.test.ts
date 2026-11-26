import { describe, expect, it } from "vitest"

import {
  ADJUNTO_TAMANO_MAXIMO,
  formatearTamanoAdjunto,
  validarArchivoAdjunto,
} from "./attachment-format"

const crearArchivo = (type: string) =>
  new File(["x"], "archivo", { type }) as File & { size: number }

describe("validacion y formato de adjuntos", () => {
  it("acepta imagenes permitidas dentro del tamano maximo", () => {
    const archivo = crearArchivo("image/png")
    Object.defineProperty(archivo, "size", { value: 1024 })

    expect(validarArchivoAdjunto(archivo)).toBeNull()
  })

  it("rechaza tipos no permitidos", () => {
    const archivo = crearArchivo("application/pdf")
    Object.defineProperty(archivo, "size", { value: 1024 })

    expect(validarArchivoAdjunto(archivo)).toBe(
      "Solo se permiten imágenes PNG, JPEG o WebP.",
    )
  })

  it("rechaza archivos vacios o demasiado grandes", () => {
    const vacio = crearArchivo("image/png")
    Object.defineProperty(vacio, "size", { value: 0 })
    const grande = crearArchivo("image/png")
    Object.defineProperty(grande, "size", {
      value: ADJUNTO_TAMANO_MAXIMO + 1,
    })

    expect(validarArchivoAdjunto(vacio)).toBe("El archivo está vacío.")
    expect(validarArchivoAdjunto(grande)).toBe(
      "La imagen no puede superar los 10 MB.",
    )
  })

  it("formatea tamanos en B, KB y MB", () => {
    expect(formatearTamanoAdjunto(0)).toBe("0 B")
    expect(formatearTamanoAdjunto(512)).toBe("512 B")
    expect(formatearTamanoAdjunto(2048)).toBe("2.0 KB")
    expect(formatearTamanoAdjunto(5 * 1024 * 1024)).toBe("5.0 MB")
  })
})
