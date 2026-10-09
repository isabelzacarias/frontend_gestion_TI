import { CircleAlert, CircleCheck, CircleX, FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ImportRowStatus = "ok" | "warning" | "error"

export interface ImportResultRow {
  fila: number
  status: ImportRowStatus
  mensajes: string[]
}

interface ImportResultDialogProps {
  open: boolean
  title: string
  description: string
  total: number
  okCount: number
  errorCount: number
  okLabel: string
  errorLabel: string
  rows: ImportResultRow[]
  primaryAction?: { label: string; onClick: () => void }
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  ok: {
    Icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    Icon: CircleAlert,
    className: "text-amber-600 dark:text-amber-400",
  },
  error: {
    Icon: CircleX,
    className: "text-rose-600 dark:text-rose-400",
  },
} as const

export function ImportResultDialog({
  open,
  title,
  description,
  total,
  okCount,
  errorCount,
  okLabel,
  errorLabel,
  rows,
  primaryAction,
  onOpenChange,
}: ImportResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,640px)] gap-0 overflow-hidden rounded-[24px] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(245,237,255,0.94),rgba(233,248,255,0.92))] p-0 shadow-[0_25px_70px_rgba(91,36,128,0.18)] dark:border-white/10 dark:bg-slate-950">
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
              <CircleCheck className="size-3.5" />
              {okCount} {okLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-700 dark:text-rose-300">
              <CircleX className="size-3.5" />
              {errorCount} {errorLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2.5 py-1 text-muted-foreground">
              Total {total}
            </span>
          </div>

          <div className="mt-3 max-h-[45vh] overflow-y-auto rounded-xl border border-border/70 bg-background/60">
            {rows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Sin observaciones: todas las filas son correctas.
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {rows.map((row, index) => {
                  const { Icon, className } = statusConfig[row.status]
                  return (
                    <li
                      key={`${row.fila}-${index}`}
                      className="flex items-start gap-3 p-3"
                    >
                      <Icon
                        aria-hidden="true"
                        className={`mt-0.5 size-4 shrink-0 ${className}`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          Fila {row.fila}
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {row.mensajes.map((mensaje, messageIndex) => (
                            <li
                              key={messageIndex}
                              className="text-xs leading-5 text-muted-foreground"
                            >
                              {mensaje}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <DialogFooter className="mt-5 flex-row justify-end gap-2 border-t border-border/70 pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold shadow-sm"
            >
              Cerrar
            </Button>
            {primaryAction && (
              <Button
                type="button"
                onClick={primaryAction.onClick}
                className="h-9 rounded-xl px-3 text-xs font-semibold"
              >
                {primaryAction.label}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
