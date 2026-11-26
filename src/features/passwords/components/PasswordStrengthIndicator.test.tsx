import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import PasswordStrengthIndicator from "./PasswordStrengthIndicator"

describe("PasswordStrengthIndicator", () => {
  it("muestra el estado sin evaluar cuando la contrasena esta vacia", () => {
    render(<PasswordStrengthIndicator password="" />)

    expect(
      screen.getByRole("img", {
        name: "Fortaleza de la contraseña: Sin evaluar",
      }),
    ).toBeInTheDocument()
  })

  it("muestra la fortaleza y las sugerencias cumplidas", () => {
    render(<PasswordStrengthIndicator password="ClaveSegura123!" />)

    expect(
      screen.getByRole("img", {
        name: "Fortaleza de la contraseña: Fuerte",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Fuerte")).toBeInTheDocument()
    expect(screen.getByText("Al menos 12 caracteres")).toBeInTheDocument()
    expect(screen.getByText("Una letra mayúscula")).toBeInTheDocument()
  })
})
