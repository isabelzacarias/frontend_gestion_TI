import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationsMenuProps {
  compact?: boolean
}

function NotificationsMenu({ compact = false }: NotificationsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className={compact ? "w-72 min-w-64" : "w-80 min-w-72"}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
          Notificaciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2 px-4 py-8 text-center"
        >
          <Bell
            aria-hidden="true"
            className="size-5 text-muted-foreground"
          />
          <p className="text-sm font-medium">Estás al día</p>
          <p className="text-sm text-muted-foreground">
            Cuando tengas notificaciones, aparecerán aquí.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { NotificationsMenu }
