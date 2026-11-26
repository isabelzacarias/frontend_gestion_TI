import { describe, expect, it } from "vitest"

import {
  ESTADO_PROYECTO_LABELS,
  ESTADO_TAREA_LABELS,
  estadosProyectoPermitidos,
  formatFecha,
  formatHoras,
  formatPresupuesto,
  nombreUsuario,
  toDateInput,
} from "./project-display"

describe("utilidades de presentacion de proyectos", () => {
  it("traduce los estados de proyecto y tarea", () => {
    expect(ESTADO_PROYECTO_LABELS.EN_PROGRESO).toBe("En progreso")
    expect(ESTADO_TAREA_LABELS.COMPLETADA).toBe("Completada")
  })

  it("define las transiciones permitidas por estado", () => {
    expect(estadosProyectoPermitidos("PLANIFICADO")).toEqual([
      "PLANIFICADO",
      "EN_PROGRESO",
      "CANCELADO",
    ])
    expect(estadosProyectoPermitidos("COMPLETADO")).toEqual(["COMPLETADO"])
  })

  it("convierte fechas para inputs y las formatea", () => {
    expect(toDateInput("2026-11-02T18:30:00.000Z")).toBe("2026-11-02")
    expect(toDateInput(null)).toBe("")
    expect(formatFecha("2026-11-02T18:30:00.000Z")).toBe("02/11/2026")
    expect(formatFecha(null)).toBe("—")
    expect(formatFecha("texto")).toBe("texto")
  })

  it("formatea presupuesto y horas", () => {
    expect(formatPresupuesto(1500)).toContain("1,500.00")
    expect(formatPresupuesto(null)).toBe("—")
    expect(formatHoras(12.5)).toBe("12.5 h")
  })

  it("resuelve el nombre del responsable", () => {
    expect(nombreUsuario({ nombre: "Ana" })).toBe("Ana")
    expect(nombreUsuario(null)).toBe("Sin asignar")
  })
})
