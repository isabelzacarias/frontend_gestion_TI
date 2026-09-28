import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

interface ThemeToggleProps {
  compact?: boolean
}

function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"
  const Icon = nextTheme === "dark" ? Moon : Sun

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={compact ? "size-9 shrink-0" : "w-full justify-start"}
      aria-label={`Activar modo ${nextTheme === "dark" ? "oscuro" : "claro"}`}
      aria-pressed={theme === "dark"}
      title={`Activar modo ${nextTheme === "dark" ? "oscuro" : "claro"}`}
      onClick={toggleTheme}
    >
      <Icon aria-hidden="true" className="size-4" />
      <span className={compact ? "sr-only" : ""}>
        Modo {nextTheme === "dark" ? "oscuro" : "claro"}
      </span>
    </Button>
  )
}

export default ThemeToggle
