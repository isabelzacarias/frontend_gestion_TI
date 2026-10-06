import { Bell, CircleCheck, LoaderCircle, WifiOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotificationsStore } from "@/features/notifications/store/notificationsStore"

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
})

interface NotificationsMenuProps {
  compact?: boolean
}

function NotificationsMenu({ compact = false }: NotificationsMenuProps) {
  const notifications = useNotificationsStore((state) => state.notifications)
  const connectionStatus = useNotificationsStore(
    (state) => state.connectionStatus,
  )
  const notificationCount = notifications.length

  const connectionDetails = {
    idle: {
      label: "Servicio desconectado",
      icon: WifiOff,
      className: "text-muted-foreground",
    },
    connecting: {
      label: "Conectando al servicio…",
      icon: LoaderCircle,
      className: "text-muted-foreground",
    },
    connected: {
      label: "Conectada en tiempo real",
      icon: CircleCheck,
      className: "text-success",
    },
    reconnecting: {
      label: "Conexión interrumpida. Reintentando…",
      icon: LoaderCircle,
      className: "text-warning-foreground",
    },
    disconnected: {
      label: "Sin conexión al servicio",
      icon: WifiOff,
      className: "text-destructive",
    },
  }[connectionStatus]
  const ConnectionIcon = connectionDetails.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0"
          aria-label={
            notificationCount > 0
              ? `Notificaciones, ${notificationCount} recibidas durante esta sesión`
              : "Notificaciones"
          }
          title="Notificaciones"
        >
          <Bell aria-hidden="true" className="size-4" />
          {notificationCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-destructive-foreground"
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className={compact ? "w-72 min-w-64" : "w-80 min-w-72"}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
          <span className="flex items-center justify-between gap-3">
            Notificaciones
            {notificationCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {notificationCount} recibidas
              </span>
            )}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2 px-2 py-2 text-xs ${connectionDetails.className}`}
        >
          <ConnectionIcon
            aria-hidden="true"
            className={`size-3.5 shrink-0 ${
              connectionStatus === "connecting" ||
              connectionStatus === "reconnecting"
                ? "animate-spin"
                : ""
            }`}
          />
          <span>{connectionDetails.label}</span>
        </div>
        {(connectionStatus === "reconnecting" ||
          connectionStatus === "disconnected") && (
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Los eventos emitidos durante la desconexión no se recuperan
            automáticamente.
          </p>
        )}
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Bell
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
            <p className="text-sm font-medium">Aún no hay notificaciones</p>
            <p className="text-sm text-muted-foreground">
              Las nuevas incidencias aparecerán aquí.
            </p>
          </div>
        ) : (
          <div
            role="list"
            aria-label="Nuevas incidencias"
            className="max-h-[min(22rem,60vh)] overflow-y-auto"
          >
            {notifications.map((notification) => (
              <article
                key={notification.id}
                role="listitem"
                className="border-b border-border px-3 py-3 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Incidencia #{notification.id}
                  </span>
                  <time
                    dateTime={notification.fechaNotificacion}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {dateFormatter.format(
                      new Date(notification.fechaNotificacion),
                    )}
                  </time>
                </div>
                <p className="mt-1.5 text-sm font-medium text-popover-foreground">
                  {notification.titulo}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="h-5 rounded-md text-[11px]">
                    {notification.estado}
                  </Badge>
                  <Badge variant="secondary" className="h-5 rounded-md text-[11px]">
                    Prioridad {notification.prioridad}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { NotificationsMenu }
