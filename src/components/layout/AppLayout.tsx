import { useEffect, useState } from "react"
import {
  Boxes,
  ChartBar,
  FolderKanban,
  KeyRound,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  SquareKanban,
  Ticket,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { NavLink, Outlet, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { ProfileMenu } from "@/components/layout/ProfileMenu"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { useAuthStore } from "@/store/authStore"
import logoCompleto from "@/assets/logo-header-hr.png"

const SIDEBAR_STORAGE_KEY = "sidebar-collapsada"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/kanban", label: "Tablero Kanban", icon: SquareKanban },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/licenses", label: "Licencias", icon: KeyRound },
  { to: "/projects", label: "Proyectos", icon: FolderKanban },
  { to: "/reports", label: "Reportes", icon: ChartBar },
  { to: "/passwords", label: "Contraseñas", icon: Lock },
]

function navLinkClassName({
  isActive,
  collapsed,
}: {
  isActive: boolean
  collapsed: boolean
}) {
  return cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    collapsed && "justify-center px-0",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  )
}

function AppLayout() {
  const navigate = useNavigate()
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion)
  const [colapsado, setColapsado] = useState<boolean>(() => {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  })

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(colapsado))
  }, [colapsado])

  function handleLogout() {
    cerrarSesion()
    navigate("/login", { replace: true })
  }

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <aside
        aria-label="Navegación principal"
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out md:flex",
          colapsado ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border",
            colapsado ? "justify-center px-3" : "px-4",
          )}
        >
          {colapsado ? (
            <span
              className="h-8 w-6 shrink-0 overflow-hidden"
              title="HorbIS Group"
            >
              <img
                src={logoCompleto}
                alt="HorbIS Group"
                className="h-8 w-[99px] max-w-none"
              />
            </span>
          ) : (
            <img
              src={logoCompleto}
              alt="Horbis Group"
              className="h-10 w-auto max-w-full object-contain object-left"
            />
          )}
        </div>
        <nav id="primary-sidebar-navigation" className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={colapsado ? label : undefined}
              title={colapsado ? label : undefined}
              className={({ isActive }) =>
                navLinkClassName({ isActive, collapsed: colapsado })
              }
            >
              <Icon className="size-4" />
              {!colapsado && label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 flex justify-center">
            <ProfileMenu collapsed={colapsado} onLogout={handleLogout} />
          </div>
          <div className="mb-1">
            <ThemeToggle compact={colapsado} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            aria-label={colapsado ? "Cerrar sesión" : undefined}
            title={colapsado ? "Cerrar sesión" : undefined}
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            {!colapsado && "Cerrar sesión"}
          </Button>
        </div>
      </aside>

      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={colapsado ? "Expandir sidebar" : "Colapsar sidebar"}
        aria-expanded={!colapsado}
        aria-controls="primary-sidebar-navigation"
        className={cn(
          "absolute top-4 z-10 hidden border-sidebar-border bg-sidebar shadow-sm transition-[left] duration-200 ease-in-out motion-reduce:transition-none md:inline-flex",
          colapsado ? "left-[52px]" : "left-[228px]",
        )}
        onClick={() => setColapsado((v) => !v)}
      >
        {colapsado ? (
          <PanelLeftOpen className="size-3.5" />
        ) : (
          <PanelLeftClose className="size-3.5" />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-border px-3 md:hidden">
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle compact />
        </header>

        <main className="flex flex-1 flex-col p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
