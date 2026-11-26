import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthApiError } from "@/services/auth.service"

const mocks = vi.hoisted(() => ({
  iniciarSesion: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toggleTheme: vi.fn(),
}))

vi.mock("@/store/authStore", () => ({
  useAuthStore: (
    selector: (estado: { iniciarSesion: typeof mocks.iniciarSesion }) => unknown,
  ) => selector({ iniciarSesion: mocks.iniciarSesion }),
}))

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: mocks.toggleTheme }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

import LoginPage from "./LoginPage"

const renderizarLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe("LoginPage", () => {
  beforeEach(() => {
    mocks.iniciarSesion.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.toastError.mockReset()
  })

  it("muestra el formulario de acceso", () => {
    renderizarLogin()

    expect(
      screen.getByRole("heading", { name: "Bienvenido de nuevo" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeInTheDocument()
  })

  it("permite mostrar y ocultar la contrasena", async () => {
    const user = userEvent.setup()
    renderizarLogin()

    const inputPassword = screen.getByLabelText("Contraseña")
    expect(inputPassword).toHaveAttribute("type", "password")

    await user.click(
      screen.getByRole("button", { name: "Mostrar contraseña" }),
    )
    expect(inputPassword).toHaveAttribute("type", "text")

    await user.click(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    )
    expect(inputPassword).toHaveAttribute("type", "password")
  })

  it("envia las credenciales y navega al inicio", async () => {
    const user = userEvent.setup()
    mocks.iniciarSesion.mockResolvedValueOnce(undefined)
    renderizarLogin()

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "admin@gestion-ti.local",
    )
    await user.type(screen.getByLabelText("Contraseña"), "ClaveSegura123!")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))

    await waitFor(() => {
      expect(mocks.iniciarSesion).toHaveBeenCalledWith(
        "admin@gestion-ti.local",
        "ClaveSegura123!",
        false,
      )
    })
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Sesión iniciada correctamente.",
    )
    expect(await screen.findByText("Inicio")).toBeInTheDocument()
  })

  it("muestra un mensaje de error con credenciales invalidas", async () => {
    const user = userEvent.setup()
    mocks.iniciarSesion.mockRejectedValueOnce(
      new AuthApiError("Credenciales invalidas", [], 401),
    )
    renderizarLogin()

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "admin@gestion-ti.local",
    )
    await user.type(screen.getByLabelText("Contraseña"), "incorrecta")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))

    const alerta = await screen.findByRole("alert")
    expect(alerta).toHaveTextContent("Credenciales inválidas.")
    expect(mocks.toastError).toHaveBeenCalledWith("Credenciales inválidas.")
  })
})
