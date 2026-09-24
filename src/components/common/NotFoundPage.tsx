import { CircleAlert } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <CircleAlert className="size-10 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">
          Pagina no encontrada
        </h1>
        <p className="text-sm text-muted-foreground">
          La ruta solicitada no existe.
        </p>
      </div>
      <Button asChild>
        <Link to="/tickets">Volver al inicio</Link>
      </Button>
    </div>
  )
}

export default NotFoundPage
