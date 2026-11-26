import { describe, expect, it } from "vitest"

import { evaluatePasswordStrength } from "./password-strength"

describe("evaluatePasswordStrength", () => {
  it("marca una contrasena vacia como sin evaluar", () => {
    const resultado = evaluatePasswordStrength("")

    expect(resultado.score).toBe(0)
    expect(resultado.isStrong).toBe(false)
    expect(resultado.label).toBe("Sin evaluar")
  })

  it("marca como debil una contrasena con pocos requisitos", () => {
    const resultado = evaluatePasswordStrength("abc")

    expect(resultado.score).toBe(1)
    expect(resultado.isStrong).toBe(false)
    expect(resultado.label).toBe("Débil")
  })

  it("marca como media una contrasena con tres requisitos", () => {
    const resultado = evaluatePasswordStrength("Abcdefgh1")

    expect(resultado.score).toBe(3)
    expect(resultado.label).toBe("Media")
  })

  it("marca como fuerte una contrasena que cumple todo", () => {
    const resultado = evaluatePasswordStrength("ClaveSegura123!")

    expect(resultado.score).toBe(5)
    expect(resultado.isStrong).toBe(true)
    expect(resultado.label).toBe("Fuerte")
    expect(resultado.requirements.every((requisito) => requisito.met)).toBe(
      true,
    )
  })
})
