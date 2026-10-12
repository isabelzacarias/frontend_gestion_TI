import { FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AssetImportConfirmDialogProps {
  open: boolean
  count: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function AssetImportConfirmDialog({
  open,
  count,
  onOpenChange,
  onConfirm,
}: AssetImportConfirmDialogProps) {
  const assetLabel = count === 1 ? "activo" : "activos"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,480px)] gap-0 overflow-hidden rounded-[24px] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(245,237,255,0.94),rgba(233,248,255,0.92))] p-0 shadow-[0_25px_70px_rgba(91,36,128,0.18)] dark:border-white/10 dark:bg-slate-950">
        <div className="p-5 sm:p-6">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Confirmar registro masivo
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {count === 0
                ? "El archivo contiene 0 activos. Completa la plantilla CSV con al menos un registro para continuar."
                : `El archivo contiene ${count} ${assetLabel} válido${count === 1 ? "" : "s"}. Al confirmar, se agregarán al inventario.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex-row justify-end gap-2 border-t border-border/70 pt-4 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold shadow-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={count === 0}
              className="h-9 rounded-xl px-3 text-xs font-semibold"
            >
              {count === 0 ? "Sin registros para importar" : `Registrar ${count} ${assetLabel}`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}