import { useState } from "react"
import type { FormEvent } from "react"
import {
  Eye,
  EyeOff,
  FolderKanban,
  Loader2,
  Mail,
  Package,
  Ticket,
} from "lucide-react"
import { Link, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import LoginNetworkIllustration from "@/features/auth/components/LoginNetworkIllustration"
import logo from "@/assets/Logo_footer.webp"

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // await login({ email, password })
      navigate("/tickets", { replace: true })
    } catch {
      setError("No pudimos iniciar sesión. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-[radial-gradient(ellipse_at_16%_12%,rgba(91,36,128,0.48),transparent_42%),radial-gradient(ellipse_at_88%_86%,rgba(34,211,238,0.22),transparent_42%),linear-gradient(135deg,#1a0f2e_0%,#24113e_48%,#10243a_100%)] p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 -top-40 size-[34rem] rounded-full bg-primary/60 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-36 size-[34rem] rounded-full bg-cyan-400/30 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_76%)]"
      />

      <div className="relative grid min-h-0 w-full max-w-[72rem] overflow-hidden rounded-2xl bg-card shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 lg:min-h-[min(44rem,calc(100dvh-4rem))] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:rounded-[1.75rem]">
        <section
          aria-labelledby="brand-heading"
          className="relative hidden min-h-[42rem] flex-col justify-between overflow-hidden bg-[#21102f] px-12 py-11 text-white lg:flex xl:px-14 xl:py-12"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 -top-36 size-[28rem] rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-32 size-[26rem] rounded-full bg-primary/40 blur-3xl"
          />

          <img
            src={logo}
            alt="HorbIS Group"
            className="relative z-10 h-12 w-auto self-start object-contain object-left lg:h-14"
          />

          <div className="relative z-10 max-w-lg pb-40 pt-12 sm:pb-48 lg:pb-52 lg:pt-14">
            <h1
              id="brand-heading"
              className="max-w-md text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]"
            >
              La tecnología, en orden.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">
              Gestiona solicitudes, activos y proyectos desde un solo espacio.
            </p>
          </div>

          <LoginNetworkIllustration />

          <div className="relative z-10 mt-auto hidden items-center gap-7 border-t border-white/10 pt-5 text-sm text-white/85 sm:flex md:gap-8">
            <span className="inline-flex items-center gap-2.5">
              <Ticket aria-hidden="true" className="size-4 text-white" />
              Solicitudes
            </span>
            <span className="inline-flex items-center gap-2.5">
              <Package aria-hidden="true" className="size-4 text-white" />
              Activos
            </span>
            <span className="inline-flex items-center gap-2.5">
              <FolderKanban aria-hidden="true" className="size-4 text-white" />
              Proyectos
            </span>
          </div>
        </section>

        <section
          aria-labelledby="login-heading"
          className="flex items-center justify-center bg-card px-6 py-10 sm:px-10 sm:py-12 lg:px-10 xl:px-14"
        >
          <div className="w-full max-w-[26rem]">
            <div className="mb-8 flex justify-center rounded-xl bg-[#21102f] px-5 py-4 lg:hidden">
              <img
                src={logo}
                alt="HorbIS Group"
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="mb-9 text-center">
              <p className="mb-3 text-sm font-medium text-primary">
                Sistema de Gestión TI
              </p>
              <h2
                id="login-heading"
                className="text-3xl font-semibold tracking-[-0.03em] text-foreground"
              >
                Bienvenido de nuevo
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    aria-invalid={error !== null}
                    className="h-12 rounded-xl border-border bg-background pl-11 text-sm focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError(null)
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    aria-invalid={error !== null}
                    className="h-12 rounded-xl border-border bg-background px-4 pr-12 text-sm focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError(null)
                    }}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      isPasswordVisible
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={isPasswordVisible}
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {isPasswordVisible ? (
                      <EyeOff aria-hidden="true" className="size-[1.125rem]" />
                    ) : (
                      <Eye aria-hidden="true" className="size-[1.125rem]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="-mt-1 flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="remember-me"
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  Recordarme
                </label>
                <Link
                  to="/recuperar"
                  className="text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl text-sm font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm leading-5 text-muted-foreground">
              Acceso al sistema interno de Gestión TI
            </p>
          </div>
        </section>
      </div>
      <p className="relative text-center text-xs text-white/50">
        © 2026 HorbIS Group · v1.0.0
      </p>
    </main>
  )
}

export default LoginPage
