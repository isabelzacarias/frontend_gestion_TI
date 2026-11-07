import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { KpiCard } from "./KpiCard"

describe("KpiCard", () => {
  it("muestra titulo, valor y subtitulo", () => {
    render(
      <KpiCard
        title="Incidencias"
        value={12}
        subtitle="Pendientes de atencion"
        icon={<span aria-hidden="true">!</span>}
      />,
    )

    expect(screen.getByText("Incidencias")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("Pendientes de atencion")).toBeInTheDocument()
  })

  it("envuelve el contenido en un enlace cuando recibe to", () => {
    render(
      <MemoryRouter>
        <KpiCard
          title="Activos"
          value={40}
          subtitle="En inventario"
          icon={<span aria-hidden="true">A</span>}
          to="/activos"
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link")).toHaveAttribute("href", "/activos")
  })

  it("muestra un marcador de carga cuando loading es true", () => {
    const { container } = render(
      <KpiCard
        title="Proyectos"
        value={8}
        subtitle="Activos"
        icon={<span aria-hidden="true">P</span>}
        loading
      />,
    )

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
    expect(screen.queryByText("8")).not.toBeInTheDocument()
  })
})
