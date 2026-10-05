import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { InventoryItem } from "@/features/inventory/data/inventoryData"

export type AssetFormDraft = {
  cb23: string
  tipo: InventoryItem["tipo"]
  marca: string
  modelo: string
  numeroSerie: string
  sucursal: string
  estado: InventoryItem["estado"]
  estadoGeneral: InventoryItem["estadoGeneral"]
  nombreRed: string
  responsableNombre: string
  responsableEmail: string
}

interface AssetFormDialogProps {
  open: boolean
  draft: AssetFormDraft
  onOpenChange: (open: boolean) => void
  onChange: <K extends keyof AssetFormDraft>(field: K, value: AssetFormDraft[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

/* Estilos compartidos: un solo tamaño para todos los campos */
const sectionClass =
  "rounded-2xl border border-white/50 bg-white/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/35"
const sectionTitleClass =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80"
const fieldClass = "space-y-1.5"
const labelClass = "text-[11px] font-medium text-foreground"
const inputClass =
  "h-8 w-full border-white/70 bg-white/80 text-[13px] text-foreground shadow-sm placeholder:text-muted-foreground/80 dark:border-white/10 dark:bg-slate-900/55"
const selectClass =
  "h-8 w-full rounded-xl border border-white/70 bg-white/80 px-3 text-[13px] text-foreground shadow-sm outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900/55"

export function AssetFormDialog({
  open,
  draft,
  onOpenChange,
  onChange,
  onSubmit,
}: AssetFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,760px)] w-[min(86vw,980px)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.22),transparent_32%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.18),transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(245,237,255,0.9),_rgba(233,248,255,0.88))] p-0 shadow-[0_30px_90px_rgba(91,36,128,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_32%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.2),transparent_30%),linear-gradient(135deg,_rgba(17,11,28,0.97),_rgba(15,23,42,0.97),_rgba(17,24,39,0.95))] sm:max-w-none">
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/80 px-6 pb-4 pt-5 sm:px-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--primary-600),var(--primary-500),var(--secondary-500))]" />
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)]">
              <span className="text-lg font-bold">+</span>
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Registrar activo
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                Completa los datos para agregar un equipo nuevo al inventario TI.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {/* Información general: 3 columnas */}
            <section className={sectionClass}>
              <div className="mb-2.5 flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <h3 className={sectionTitleClass}>Información general</h3>
              </div>

              <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-3">
                <div className={fieldClass}>
                  <label htmlFor="cb23" className={labelClass}>
                    CB23
                  </label>
                  <Input
                    id="cb23"
                    value={draft.cb23}
                    onChange={(event) => onChange("cb23", event.target.value)}
                    placeholder="200430"
                    className={inputClass}
                  />
                </div>

                <div className={fieldClass}>
                  <label htmlFor="tipo" className={labelClass}>
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    value={draft.tipo}
                    onChange={(event) => onChange("tipo", event.target.value as InventoryItem["tipo"])}
                    className={selectClass}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Servidor">Servidor</option>
                    <option value="Impresora">Impresora</option>
                    <option value="Switch">Switch</option>
                    <option value="Router">Router</option>
                  </select>
                </div>

                <div className={fieldClass}>
                  <label htmlFor="marca" className={labelClass}>
                    Marca
                  </label>
                  <Input
                    id="marca"
                    value={draft.marca}
                    onChange={(event) => onChange("marca", event.target.value)}
                    placeholder="Dell"
                    className={inputClass}
                  />
                </div>

                <div className={fieldClass}>
                  <label htmlFor="modelo" className={labelClass}>
                    Modelo
                  </label>
                  <Input
                    id="modelo"
                    value={draft.modelo}
                    onChange={(event) => onChange("modelo", event.target.value)}
                    placeholder="Latitude 5450"
                    className={inputClass}
                  />
                </div>

                <div className={`${fieldClass} sm:col-span-2`}>
                  <label htmlFor="numeroSerie" className={labelClass}>
                    Número de serie
                  </label>
                  <Input
                    id="numeroSerie"
                    value={draft.numeroSerie}
                    onChange={(event) => onChange("numeroSerie", event.target.value)}
                    placeholder="ABC123456"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Estado y asignación: 4 columnas en una sola fila */}
            <section className={sectionClass}>
              <div className="mb-2.5 flex items-center gap-2">
                <div className="size-2 rounded-full bg-cyan-500" />
                <h3 className={sectionTitleClass}>Estado y asignación</h3>
              </div>

              <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div className={fieldClass}>
                  <label htmlFor="sucursal" className={labelClass}>
                    Sucursal
                  </label>
                  <select
                    id="sucursal"
                    value={draft.sucursal}
                    onChange={(event) => onChange("sucursal", event.target.value)}
                    className={selectClass}
                  >
                    <option value="PLAYA">PLAYA</option>
                    <option value="MERIDA">MERIDA</option>
                    <option value="CANCUN">CANCUN</option>
                  </select>
                </div>

                <div className={fieldClass}>
                  <label htmlFor="estado" className={labelClass}>
                    Estado
                  </label>
                  <select
                    id="estado"
                    value={draft.estado}
                    onChange={(event) => onChange("estado", event.target.value as InventoryItem["estado"])}
                    className={selectClass}
                  >
                    <option value="EN_USO">En uso</option>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>

                <div className={fieldClass}>
                  <label htmlFor="estadoGeneral" className={labelClass}>
                    Estado general
                  </label>
                  <select
                    id="estadoGeneral"
                    value={draft.estadoGeneral}
                    onChange={(event) =>
                      onChange("estadoGeneral", event.target.value as InventoryItem["estadoGeneral"])
                    }
                    className={selectClass}
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>

                <div className={fieldClass}>
                  <label htmlFor="nombreRed" className={labelClass}>
                    Red
                  </label>
                  <Input
                    id="nombreRed"
                    value={draft.nombreRed}
                    onChange={(event) => onChange("nombreRed", event.target.value)}
                    placeholder="ADMP-01"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Responsable: nombre y correo en una sola fila */}
            <section className={sectionClass}>
              <div className="mb-2.5 flex items-center gap-2">
                <div className="size-2 rounded-full bg-violet-500" />
                <h3 className={sectionTitleClass}>Responsable</h3>
              </div>

              <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                <div className={fieldClass}>
                  <label htmlFor="responsableNombre" className={labelClass}>
                    Nombre completo
                  </label>
                  <Input
                    id="responsableNombre"
                    value={draft.responsableNombre}
                    onChange={(event) => onChange("responsableNombre", event.target.value)}
                    placeholder="Nombre completo"
                    className={inputClass}
                  />
                </div>

                <div className={fieldClass}>
                  <label htmlFor="responsableEmail" className={labelClass}>
                    Correo electrónico
                  </label>
                  <Input
                    id="responsableEmail"
                    type="email"
                    value={draft.responsableEmail}
                    onChange={(event) => onChange("responsableEmail", event.target.value)}
                    placeholder="responsable@empresa.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          </div>

          <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border/80 bg-transparent p-0">
            <div className="flex w-full justify-end gap-2 px-5 py-4 sm:gap-2.5 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-xl border border-white/70 bg-white/70 px-3 text-xs font-semibold shadow-sm hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-3 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)] hover:brightness-110"
              >
                Guardar activo
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}