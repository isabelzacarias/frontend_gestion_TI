import { useState } from "react"
import {
  BookText,
  Boxes,
  ChartBar,
  ClipboardClock,
  FolderKanban,
  Home,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Menu,
  SquareKanban,
  Ticket,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProfileMenu } from "@/components/layout/ProfileMenu"
import { NotificationsMenu } from "@/components/layout/NotificationsMenu"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { useAuthStore } from "@/store/authStore"
import { useAppPreferences } from "@/hooks/useAppPreferences"
import logoCompleto from "@/assets/Logo_footer.webp"
import logoIcono from "@/assets/lohoHO.png"

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/kanban", label: "Tablero Kanban", icon: SquareKanban },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/licenses", label: "Licencias", icon: KeyRound },
  { to: "/projects", label: "Proyectos", icon: FolderKanban },
  { to: "/reports", label: "Reportes", icon: ChartBar },
  { to: "/passwords", label: "Contraseñas", icon: Lock },
  { to: "/assignments", label: "Asignacion de Equipo", icon: Laptop },
  { to: "/maintenance", label: "Mantenimiento", icon: Wrench },
  { to: "/audit", label: "Auditoría", icon: BookText },
  { to: "/reminder", label: "Recordatorio", icon: ClipboardClock},
]

function navLinkClassName({
  isActive,
  collapsed,
}: {
  isActive: boolean
  collapsed: boolean
}) {
  if (collapsed) {
    return cn(
      "relative flex h-12 w-full items-center justify-center text-sm transition-colors",
      isActive
        ? "bg-[#2a124b] text-white before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--accent-500)]"
        : "text-white/70 hover:bg-white/5 hover:text-white"
    )
  }

  return cn(
    "relative flex w-full items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
    isActive
      ? "bg-[#2a124b] text-white before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--accent-500)]"
      : "text-white/70 hover:bg-white/5 hover:text-white",
  )
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion)
  const { preferences, updatePreference } = useAppPreferences()
  const colapsado = preferences.sidebarCollapsed
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)

  const currentNavItem = navItems.find((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to)
  )
  const pageTitle = currentNavItem?.label || "Sistema de Gestión"

  function requestLogout() {
    setConfirmLogoutOpen(true)
  }

  function confirmLogout() {
    setConfirmLogoutOpen(false)
    cerrarSesion()
    navigate("/login", { replace: true })
  }

  return (
    <div className="relative flex h-dvh bg-background text-foreground">
      <aside
        aria-label="Navegación principal"
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[#2a124b] bg-[#07020d] text-white transition-[width] duration-200 ease-in-out md:flex",
          colapsado ? "w-16" : "w-[15.5rem]",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-[#2a124b]",
            colapsado ? "justify-center px-3" : "px-6",
          )}
        >
          <Link
            to="/"
            aria-label="Ir al inicio"
            title="Ir al inicio"
            className="flex h-full items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07020d]"
          >
            {colapsado ? (
              <img
                src={logoIcono}
                alt=""
                className="h-8 w-8 object-contain"
              />
            ) : (
              <img
                src={logoCompleto}
                alt=""
                className="h-10 w-auto max-w-full object-contain object-left"
              />
            )}
          </Link>
        </div>
        <nav
          id="primary-sidebar-navigation"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto py-3"
        >
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
              <Icon className={cn("size-4", colapsado && "size-5")} />
              {!colapsado && label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#2a124b] p-3">
          <div className="mb-2 flex justify-center">
            <ProfileMenu collapsed={colapsado} />
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
            onClick={requestLogout}
          >
            <LogOut className="size-4" />
            {!colapsado && "Cerrar sesión"}
          </Button>
        </div>
      </aside>

      <Dialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <DialogContent
          role="alertdialog"
          aria-describedby="logout-confirmation-description"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>¿Cerrar sesión?</DialogTitle>
            <DialogDescription id="logout-confirmation-description">
              Tendrás que volver a iniciar sesión para acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmLogout}
            >
              Cerrar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="hidden h-16 shrink-0 items-center justify-between border-b border-border px-6 md:flex">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={colapsado ? "Expandir sidebar" : "Colapsar sidebar"}
              aria-expanded={!colapsado}
              aria-controls="primary-sidebar-navigation"
              className="text-primary hover:bg-muted hover:text-primary"
              onClick={() =>
                updatePreference("sidebarCollapsed", !preferences.sidebarCollapsed)
              }
            >
              <Menu className="size-5" />
            </Button>
            <span className="text-lg font-bold text-foreground">{pageTitle}</span>
          </div>
          <NotificationsMenu />
        </header>
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
          <div className="flex shrink-0 items-center gap-1">
            <NotificationsMenu compact />
            <ThemeToggle compact />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
