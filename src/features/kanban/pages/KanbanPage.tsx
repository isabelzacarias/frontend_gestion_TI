import { PagePlaceholder } from "@/components/common/PagePlaceholder"

const columns = [
  { title: "Nuevo", statusColor: "bg-info" },
  { title: "En curso", statusColor: "bg-warning" },
  { title: "Completado", statusColor: "bg-success" },
  { title: "Duplicado", statusColor: "bg-destructive" },
  { title: "En análisis", statusColor: "bg-primary" },
]

function KanbanPage() {
  return (
    <PagePlaceholder
      title="Tablero Kanban"
      description="Organiza el trabajo por estado."
    >
      <div
        role="region"
        aria-label="Columnas del tablero Kanban"
        className="-mx-1 overflow-x-auto px-1 pb-3"
      >
        <div className="flex min-w-[76rem] gap-4">
          {columns.map(({ title, statusColor }) => {
            const headingId = `kanban-column-${title
              .toLowerCase()
              .replaceAll(" ", "-")}`

            return (
              <section
                key={title}
                aria-labelledby={headingId}
                className="flex min-h-[28rem] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <header className="flex min-h-16 items-center gap-3 border-b border-border px-4">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 shrink-0 rounded-full ${statusColor}`}
                  />
                  <h2
                    id={headingId}
                    className="font-heading text-sm font-semibold text-card-foreground"
                  >
                    {title}
                  </h2>
                </header>
                <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Sin tickets</p>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </PagePlaceholder>
  )
}

export default KanbanPage
