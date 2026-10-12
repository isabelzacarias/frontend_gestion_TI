import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export interface ConfirmDeleteDialogProps {
  open: boolean
  title?: string
  description?: string
  itemName?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteDialog({
  open,
  title = "Eliminar registro",
  description,
  itemName = "este registro",
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel()
        }
      }}
    >
      <DialogContent className="w-[min(92vw,420px)] rounded-[24px] border border-rose-200/80 bg-white/95 p-0 shadow-[0_25px_70px_rgba(127,29,29,0.16)] backdrop-blur-xl dark:border-rose-500/20 dark:bg-slate-950/95">
        <div className="p-5 sm:p-6">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm dark:bg-rose-500/10 dark:text-rose-400">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {description ??
                `¿Deseas eliminar ${itemName}? Esta acción no se puede deshacer.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex-row justify-end gap-2 border-t border-border/70 pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold shadow-sm"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              variant="destructive"
              className="h-9 rounded-xl px-3 text-xs font-semibold shadow-[0_12px_24px_rgba(225,29,72,0.18)]"
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
