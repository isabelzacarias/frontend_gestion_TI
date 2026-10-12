import {
  Bell,
  CalendarClock,
  CheckCheck,
  CircleCheck,
  LoaderCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react"
import { toast } from "sonner"

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
const expiryDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: "UTC",
})

interface NotificationsMenuProps {
  compact?: boolean
}

function NotificationsMenu({ compact = false }: NotificationsMenuProps) {
  const notifications = useNotificationsStore((state) => state.notifications)
  const connectionStatus = useNotificationsStore(
    (state) => state.connectionStatus,
  )
  const accessStatus = useNotificationsStore((state) => state.accessStatus)
  const noLeidas = useNotificationsStore((state) => state.noLeidas)
  const page = useNotificationsStore((state) => state.page)
  const totalPages = useNotificationsStore((state) => state.totalPages)
  const isLoading = useNotificationsStore((state) => state.isLoading)
  const loadingMore = useNotificationsStore((state) => state.loadingMore)
  const loadError = useNotificationsStore((state) => state.loadError)
  const pendingReadIds = useNotificationsStore((state) => state.pendingReadIds)
  const isMarkingAllRead = useNotificationsStore(
    (state) => state.isMarkingAllRead,
  )
  const loadUnread = useNotificationsStore((state) => state.loadUnread)
  const markRead = useNotificationsStore((state) => state.markRead)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const notificationCount = accessStatus === "forbidden" ? 0 : noLeidas

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

  function loadNotifications() {
    void loadUnread().catch((error: unknown) => {
      console.error("No se pudieron cargar las notificaciones.", error)
    })
  }

  async function handleMarkRead(id: string) {
    try {
      await markRead(id)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo marcar la notificación como leída."
      toast.error(message)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron marcar las notificaciones como leídas."
      toast.error(message)
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) loadNotifications()
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0"
          aria-label={
            notificationCount > 0
              ? `Notificaciones, ${notificationCount} sin leer`
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
            {noLeidas > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {noLeidas} sin leer
              </span>
            )}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {noLeidas > 0 && (
          <>
            <div className="flex justify-end px-2 py-1">
              <button
                type="button"
                disabled={isMarkingAllRead}
                onClick={() => void handleMarkAllRead()}
                className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {isMarkingAllRead ? (
                  <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                ) : (
                  <CheckCheck aria-hidden="true" className="size-3.5" />
                )}
                Marcar todas como leídas
              </button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
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
        {connectionStatus === "reconnecting" && (
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Se sincronizarán las notificaciones pendientes al restablecer la
            conexión.
          </p>
        )}
        <DropdownMenuSeparator />
        {accessStatus === "forbidden" ? (
          <p role="alert" className="px-3 py-3 text-sm text-muted-foreground">
            No tienes permiso para consultar esta bandeja. Solicita el acceso a
            notificaciones al administrador.
          </p>
        ) : loadError ? (
          <div role="alert" className="px-3 py-3">
            <p className="text-sm text-destructive">{loadError}</p>
            <button
              type="button"
              onClick={loadNotifications}
              disabled={isLoading}
              className="mt-2 inline-flex items-center gap-1.5 rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Reintentar
            </button>
          </div>
        ) : null}
        {accessStatus === "forbidden" ? null : isLoading &&
          notifications.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="space-y-3 px-3 py-4"
          >
            <span className="sr-only">Cargando notificaciones…</span>
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : notifications.length === 0 && !loadError ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Bell
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
            <p className="text-sm font-medium">Estás al día</p>
            <p className="text-sm text-muted-foreground">
              Las incidencias y licencias próximas a vencer aparecerán aquí.
            </p>
          </div>
        ) : (
          <div
            role="list"
            aria-label="Notificaciones sin leer"
            className="max-h-[min(22rem,60vh)] overflow-y-auto"
          >
            {notifications.map((notification) => (
              <article
                key={notification.id}
                role="listitem"
                className="border-b border-border px-3 py-3 last:border-b-0"
              >
                {notification.tipo === "INCIDENCIA_NUEVA" ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Incidencia #{notification.incidenciaId}
                      </span>
                      <time
                        dateTime={notification.creadaEn}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {dateFormatter.format(new Date(notification.creadaEn))}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-popover-foreground">
                      {notification.incidencia.titulo}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md text-[11px]"
                      >
                        {notification.incidencia.estado}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="h-5 rounded-md text-[11px]"
                      >
                        Prioridad {notification.incidencia.prioridad}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
                        <CalendarClock
                          aria-hidden="true"
                          className="size-3.5"
                        />
                        Licencia por vencer
                      </span>
                      <time
                        dateTime={notification.creadaEn}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {dateFormatter.format(new Date(notification.creadaEn))}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-popover-foreground">
                      {notification.licencia.software}
                    </p>
                    {notification.licencia.proveedor && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {notification.licencia.proveedor}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md text-[11px]"
                      >
                        Vence{" "}
                        {expiryDateFormatter.format(
                          new Date(notification.licencia.fechaVencimiento),
                        )}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="h-5 rounded-md text-[11px]"
                      >
                        Aviso {notification.hitoDias} días antes
                      </Badge>
                    </div>
                  </>
                )}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={pendingReadIds.includes(notification.id)}
                    onClick={() => void handleMarkRead(notification.id)}
                    className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    {pendingReadIds.includes(notification.id) ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-3.5 animate-spin"
                      />
                    ) : (
                      <CheckCheck aria-hidden="true" className="size-3.5" />
                    )}
                    Marcar como leída
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {page < totalPages && (
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                void loadUnread({ append: true }).catch((error: unknown) => {
                  console.error(
                    "No se pudieron cargar más notificaciones.",
                    error,
                  )
                })
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {loadingMore && (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              )}
              Cargar más
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { NotificationsMenu }
