import { List, SquareKanban } from "lucide-react"
import { useSearchParams } from "react-router"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import KanbanPage from "@/features/kanban/pages/KanbanPage"
import { TicketsListView } from "@/features/tickets/components/TicketsListView"

type VistaTickets = "lista" | "kanban"

function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const vista: VistaTickets =
    searchParams.get("vista") === "kanban" ? "kanban" : "lista"

  function cambiarVista(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next === "kanban") {
      params.set("vista", "kanban")
    } else {
      params.delete("vista")
    }
    setSearchParams(params, { replace: true })
  }

  return (
    <Tabs
      value={vista}
      onValueChange={cambiarVista}
      className="min-h-0 flex-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList aria-label="Formato de la vista de tickets">
          <TabsTrigger value="lista">
            <List />
            Lista
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <SquareKanban />
            Kanban
          </TabsTrigger>
        </TabsList>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {vista === "lista"
            ? "Tabla con filtros, paginación y detalle del ticket."
            : "Tablero con arrastrar y soltar para cambiar de estado."}
        </span>
      </div>

      <TabsContent
        value="lista"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <TicketsListView />
      </TabsContent>

      <TabsContent value="kanban" className="flex min-h-0 flex-1 flex-col">
        <KanbanPage />
      </TabsContent>
    </Tabs>
  )
}

export default TicketsPage
