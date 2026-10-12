import type { ReactNode } from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type DetailSectionColor =
  | "primary"
  | "cyan"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"

export interface DetailField {
  key: string
  label: string
  value: ReactNode
  colSpan?: string
}

export interface DetailSection {
  title: string
  color?: DetailSectionColor
  gridCols?: string
  fields: DetailField[]
}

interface DetailDialogProps {
  open: boolean
  title: string
  description: string
  icon?: ReactNode
  sections: DetailSection[]
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
}

const sectionColorMap: Record<DetailSectionColor, string> = {
  primary: "bg-primary",
  cyan: "bg-cyan-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
}

export function DetailDialog({
  open,
  title,
  description,
  icon = <span className="text-lg font-bold">i</span>,
  sections,
  onOpenChange,
  onEdit,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,760px)] w-[min(86vw,980px)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.22),transparent_32%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.18),transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(245,237,255,0.9),_rgba(233,248,255,0.88))] p-0 shadow-[0_30px_90px_rgba(91,36,128,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(123,64,163,0.28),transparent_32%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.2),transparent_30%),linear-gradient(135deg,_rgba(17,11,28,0.97),_rgba(15,23,42,0.97),_rgba(17,24,39,0.95))] sm:max-w-none">
        <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/80 px-6 pb-4 pt-5 sm:px-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--primary-600),var(--primary-500),var(--secondary-500))]" />
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)]">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/50 bg-white/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/35"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <div
                  className={`size-2 rounded-full ${sectionColorMap[section.color ?? "primary"]}`}
                />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
                  {section.title}
                </h3>
              </div>

              <dl
                className={`grid gap-x-4 gap-y-3 ${section.gridCols ?? "sm:grid-cols-2"}`}
              >
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className={`min-w-0 space-y-1.5 ${field.colSpan ?? ""}`}
                  >
                    <dt className="text-[11px] font-medium text-foreground">
                      {field.label}
                    </dt>
                    <dd className="min-h-8 whitespace-pre-wrap break-words py-1 text-sm leading-5 text-foreground">
                      {field.value ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border/80 bg-transparent p-0">
          <div className="flex w-full justify-end gap-2 px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-white/70 bg-white/70 px-3 text-xs font-semibold shadow-sm hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/80"
            >
              Cerrar
            </Button>
            {onEdit && (
              <Button
                type="button"
                onClick={onEdit}
                className="h-9 rounded-xl bg-[linear-gradient(135deg,var(--primary-600),var(--primary-500))] px-3 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.28)] hover:brightness-110"
              >
                <Pencil aria-hidden="true" />
                Editar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}