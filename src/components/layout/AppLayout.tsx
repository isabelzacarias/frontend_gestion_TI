import {
  Boxes,
  ChartBar,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  SquareKanban,
  Ticket,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { Link, NavLink, Outlet } from "react-router"

import { Button } from "@/components/ui/button"

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
]

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  )
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <LayoutDashboard className="size-5 text-sidebar-primary" />
          <span className="font-heading text-sm font-semibold">Gestion TI</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClassName}>
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <Link to="/login">
              <LogOut className="size-4" />
              Cerrar sesion
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-1 overflow-x-auto border-b border-border px-3 md:hidden">
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
        </header>

        <main className="flex flex-1 flex-col p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
