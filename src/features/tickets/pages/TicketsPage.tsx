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

  const viewSwitcher = (
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
  )

  return (
    <Tabs
      value={vista}
      onValueChange={cambiarVista}
      className="min-h-0 flex-1"
    >
      <TabsContent
        value="lista"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <TicketsListView viewSwitcher={viewSwitcher} />
      </TabsContent>

      <TabsContent value="kanban" className="flex min-h-0 flex-1 flex-col">
        <KanbanPage viewSwitcher={viewSwitcher} />
      </TabsContent>
    </Tabs>
  )
}

export default TicketsPage
