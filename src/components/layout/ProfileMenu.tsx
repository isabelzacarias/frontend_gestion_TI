import { KeyRound, LogOut, Moon, Settings, Sun, User } from "lucide-react"
import { useNavigate } from "react-router"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/hooks/useTheme"
import { useAuthStore } from "@/store/authStore"

interface ProfileMenuProps {
  collapsed: boolean
  onLogout: () => void
}

function ProfileMenu({ collapsed, onLogout }: ProfileMenuProps) {
  const navigate = useNavigate()
  const usuario = useAuthStore((state) => state.usuario)
  const { theme, toggleTheme } = useTheme()

  if (!usuario) return null

  const inicial = usuario.nombre.trim().charAt(0).toUpperCase()
  const nextTheme = theme === "dark" ? "light" : "dark"
  const ThemeIcon = nextTheme === "dark" ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <button
            type="button"
            aria-label="Menú de usuario"
            title={`${usuario.nombre} (${usuario.email})`}
            className="mx-auto flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            {inicial}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Abrir menú de usuario"
            className="w-full truncate rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            <p className="truncate text-sm font-medium">{usuario.nombre}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {usuario.email}
            </p>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "end" : "start"} side="top" className="min-w-56">
        <DropdownMenuLabel>
          <span className="block truncate font-medium text-foreground">
            {usuario.nombre}
          </span>
          <span className="block truncate text-xs font-normal">
            {usuario.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/perfil")}>
          <User />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/configuracion")}>
          <Settings />
          Configuración
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/cambiar-password")}>
          <KeyRound />
          Cambiar contraseña
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toggleTheme()}>
          <ThemeIcon />
          Modo {nextTheme === "dark" ? "oscuro" : "claro"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onLogout()}
        >
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ProfileMenu }
