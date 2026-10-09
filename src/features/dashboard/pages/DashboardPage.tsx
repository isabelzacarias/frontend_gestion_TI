import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import {
  Boxes,
  KeyRound,
  LayoutDashboard,
  RefreshCw,
  Ticket as TicketIcon,
} from "lucide-react"

import { ModuleHeader } from "@/components/common/ModuleHeader"
import { Button } from "@/components/ui/button"
import { LicensesExpiringCard } from "@/features/dashboard/components/LicensesExpiringCard"
import { NewTicketsPanel } from "@/features/dashboard/components/NewTicketsPanel"
import { TicketsPendingCard } from "@/features/dashboard/components/TicketsPendingCard"
import { obtenerIncidencias } from "@/features/tickets/services/ticket.service"
import type { Ticket } from "@/features/tickets/types/ticket"

function DashboardPage() {
  const navigate = useNavigate()

  // Estado para la tarjeta y panel de incidencias nuevas
  const [newTickets, setNewTickets] = useState<Ticket[]>([])
  const [totalNewTickets, setTotalNewTickets] = useState<number | null>(null)
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [isNewTicketsPanelOpen, setIsNewTicketsPanelOpen] = useState(false)

  const fetchNewTickets = useCallback(async () => {
    setIsLoadingTickets(true)
    setTicketsError(null)

    try {
      const response = await obtenerIncidencias({
        page: 1,
        limit: 10,
        estado: "NUEVO",
      })

      if (response && response.data) {
        setNewTickets(response.data)
        setTotalNewTickets(response.meta?.total ?? response.data.length)
      } else {
        setNewTickets([])
        setTotalNewTickets(0)
      }
    } catch (err) {
      console.error("Error al obtener incidencias con estado NUEVO:", err)
      setTicketsError(
        "No se pudo cargar la información de incidencias desde la API.",
      )
    } finally {
      setIsLoadingTickets(false)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    obtenerIncidencias({
      page: 1,
      limit: 10,
      estado: "NUEVO",
    })
      .then((response) => {
        if (!isCancelled) {
          if (response && response.data) {
            setNewTickets(response.data)
            setTotalNewTickets(response.meta?.total ?? response.data.length)
          } else {
            setNewTickets([])
            setTotalNewTickets(0)
          }
          setIsLoadingTickets(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Error al obtener incidencias con estado NUEVO:", err)
          setTicketsError(
            "No se pudo cargar la información de incidencias desde la API.",
          )
          setIsLoadingTickets(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Cabecera del Dashboard */}
      <ModuleHeader
        eyebrow="PANEL PRINCIPAL"
        title="Dashboard de Control Operativo"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNewTickets}
              disabled={isLoadingTickets}
              className="rounded-2xl border-white/60 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-card/70 gap-1.5 text-xs font-semibold"
            >
              <RefreshCw
                className={`size-3.5 ${isLoadingTickets ? "animate-spin" : ""}`}
              />
              Sincronizar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/tickets")}
              className="rounded-2xl bg-gradient-to-r from-primary to-primary-600 text-white gap-1.5 text-xs font-semibold shadow-[0_8px_20px_rgba(91,36,128,0.24)]"
            >
              <TicketIcon className="size-3.5" />
              Mesa de Ayuda
            </Button>
          </div>
        }
      />

      {/* Grid de Métricas y Tarjetas Clave */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <LayoutDashboard className="size-4 text-primary" />
            Métricas de Atención Inmediata
          </h2>
          <span className="text-xs text-muted-foreground">
            Haz clic en una tarjeta para ver sus detalles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tarjeta 1: Tickets Pendientes (con estado NUEVO) */}
          <TicketsPendingCard
            total={totalNewTickets}
            isLoading={isLoadingTickets}
            isActive={isNewTicketsPanelOpen}
            onClick={() => setIsNewTicketsPanelOpen((prev) => !prev)}
          />

          {/* Tarjeta 2: Licencias por Vencer */}
          <LicensesExpiringCard
            onClick={() => navigate("/licenses")}
          />
        </div>
      </div>

      {/* Panel de Incidencias Nuevas (se despliega al hacer clic en la tarjeta de Tickets) */}
      {isNewTicketsPanelOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <NewTicketsPanel
            tickets={newTickets}
            total={totalNewTickets}
            isLoading={isLoadingTickets}
            error={ticketsError}
            onRefresh={fetchNewTickets}
            onClose={() => setIsNewTicketsPanelOpen(false)}
          />
        </div>
      )}

      {/* Accesos directos complementarios */}
      <div className="rounded-[26px] border border-white/50 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-card/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Boxes className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Acceso rápido a los módulos del sistema
              </h4>
              <p className="text-xs text-muted-foreground">
                Gestiona activos tecnológicos, licencias y flujos kanban en tiempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/kanban")}
              className="rounded-xl text-xs font-semibold"
            >
              Tablero Kanban
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/inventory")}
              className="rounded-xl text-xs font-semibold"
            >
              Inventario de Equipos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/licenses")}
              className="rounded-xl text-xs font-semibold gap-1"
            >
              <KeyRound className="size-3.5 text-amber-500" />
              Licencias
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage