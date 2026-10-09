import { useState } from "react"
import { Bell, CheckCircle2, Circle, ListTodo, Plus, Trash2 } from "lucide-react"

import type { RecordatorioItem } from "@/features/dashboard/types/dashboard.types"

interface RecordatoriosCardProps {
  initialRecordatorios?: RecordatorioItem[]
  loading?: boolean
}

export function RecordatoriosCard({
  initialRecordatorios = [],
  loading = false,
}: RecordatoriosCardProps) {
  const [items, setItems] = useState<RecordatorioItem[]>(initialRecordatorios)
  const [nuevoTexto, setNuevoTexto] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleToggle = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, completado: !item.completado } : item,
      ),
    )
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoTexto.trim()) return

    const nuevo: RecordatorioItem = {
      id: Date.now(),
      titulo: nuevoTexto.trim(),
      completado: false,
    }
    setItems((prev) => [nuevo, ...prev])
    setNuevoTexto("")
    setIsAdding(false)
  }

  const handleDelete = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Bell className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Recordatorios de TI
            </h3>
            <p className="text-xs text-muted-foreground">
              Tareas operativas y pendientes del equipo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="size-3.5" />
          Agregar
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input
            type="text"
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            placeholder="Nuevo recordatorio..."
            className="flex-1 rounded-xl border border-border bg-background/80 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            Guardar
          </button>
        </form>
      )}

      <div className="mt-4 flex-1 space-y-2">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/60" />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-7 text-center">
            <ListTodo className="size-7 text-muted-foreground/60" />
            <p className="mt-2 text-xs font-medium text-foreground">
              No hay recordatorios pendientes
            </p>
            <p className="text-[11px] text-muted-foreground">
              Agrega tareas rápidas para seguimiento operativo
            </p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id ?? idx}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-2.5 transition-colors hover:bg-background/80"
            >
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className="flex items-center gap-2.5 text-left"
              >
                {item.completado ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/60 group-hover:text-primary" />
                )}
                <span
                  className={`text-xs ${
                    item.completado
                      ? "text-muted-foreground line-through"
                      : "font-medium text-foreground"
                  }`}
                >
                  {item.titulo}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                title="Eliminar"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
