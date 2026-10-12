import { useState } from "react"
import type { FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CambioPasswordForm {
  actual: string
  nueva: string
  confirmacion: string
}

function ChangePasswordPage() {
  const [form, setForm] = useState<CambioPasswordForm>({
    actual: "",
    nueva: "",
    confirmacion: "",
  })
  const [mostrar, setMostrar] = useState(false)
  const [enviando, setEnviando] = useState(false)

  function actualizar(campo: keyof CambioPasswordForm, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (form.nueva.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (form.nueva !== form.confirmacion) {
      toast.error("La confirmación no coincide con la nueva contraseña.")
      return
    }

    setEnviando(true)
    toast.info("El cambio de contraseña estará disponible próximamente.")
    setEnviando(false)
  }

  const campos: Array<{
    id: string
    label: string
    campo: keyof CambioPasswordForm
    autoComplete: string
  }> = [
    {
      id: "password-actual",
      label: "Contraseña actual",
      campo: "actual",
      autoComplete: "current-password",
    },
    {
      id: "password-nueva",
      label: "Nueva contraseña",
      campo: "nueva",
      autoComplete: "new-password",
    },
    {
      id: "password-confirmacion",
      label: "Confirmar nueva contraseña",
      campo: "confirmacion",
      autoComplete: "new-password",
    },
  ]

  return (
    <section className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Cambiar contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualiza tu contraseña de acceso.
        </p>
      </header>

      <form
        className="flex max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6"
        onSubmit={handleSubmit}
      >
        {campos.map(({ id, label, campo, autoComplete }) => (
          <div key={id} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium">
              {label}
            </label>
            <div className="relative">
              <Input
                id={id}
                type={mostrar ? "text" : "password"}
                autoComplete={autoComplete}
                value={form[campo]}
                onChange={(event) => actualizar(campo, event.target.value)}
                required
                className="pr-9"
              />
              <button
                type="button"
                aria-label={mostrar ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMostrar((v) => !v)}
              >
                {mostrar ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </section>
  )
}

export default ChangePasswordPage
