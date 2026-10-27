import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ThemeToggle from "@/components/theme/ThemeToggle"
import PasswordStrengthIndicator from "@/features/passwords/components/PasswordStrengthIndicator"
import { useTheme } from "@/hooks/useTheme"
import logo from "@/assets/Logo_footer.webp"

type Paso = "correo" | "confirmacion" | "restablecer" | "listo"

const PASOS = ["Correo", "Verificación", "Contraseña"]
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function PasswordRecoveryPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const emailDesdeLogin = (() => {
    const state = location.state as { email?: unknown } | null
    return state && typeof state.email === "string" ? state.email : ""
  })()

  const [paso, setPaso] = useState<Paso>("correo")
  const [email, setEmail] = useState(emailDesdeLogin)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [reenvioCooldown, setReenvioCooldown] = useState(0)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (reenvioCooldown <= 0) return
    const id = window.setTimeout(() => {
      setReenvioCooldown((valor) => Math.max(0, valor - 1))
    }, 1000)
    return () => window.clearTimeout(id)
  }, [reenvioCooldown])

  function programarAccion(accion: () => void, delay = 1100) {
    timeoutRef.current = window.setTimeout(accion, delay)
  }

  function handleEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSending) return

    const correo = email.trim()
    if (!emailPattern.test(correo)) {
      setEmailError("Ingresa un correo electrónico válido.")
      return
    }

    setEmailError(null)
    setIsSending(true)
    programarAccion(() => {
      setIsSending(false)
      setPaso("confirmacion")
      setReenvioCooldown(30)
    })
  }

  function handleReenviar() {
    if (isSending || reenvioCooldown > 0) return
    setIsSending(true)
    programarAccion(() => {
      setIsSending(false)
      setReenvioCooldown(30)
    }, 900)
  }

  function handleVolverCorreo() {
    setPaso("correo")
    setReenvioCooldown(0)
    setEmailError(null)
  }

  function handleRestablecer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isResetting) return

    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.")
      return
    }

    setPasswordError(null)
    setIsResetting(true)
    programarAccion(() => {
      setIsResetting(false)
      setPassword("")
      setConfirmPassword("")
      setPaso("listo")
    })
  }

  const pasoIndice =
    paso === "correo"
      ? 0
      : paso === "confirmacion"
        ? 1
        : paso === "restablecer"
          ? 2
          : 3

  const titulo =
    paso === "correo"
      ? "Recupera tu acceso"
      : paso === "confirmacion"
        ? "Revisa tu correo"
        : paso === "restablecer"
          ? "Nueva contraseña"
          : "Contraseña actualizada"

  const descripcion =
    paso === "correo"
      ? "Ingresa el correo asociado a tu cuenta y te enviaremos instrucciones."
      : paso === "confirmacion"
        ? "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
        : paso === "restablecer"
          ? "Define una nueva contraseña para tu cuenta."
          : "Tu nueva contraseña ya está activa."

  return (
    <main
      className={`relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden p-4 transition-colors sm:p-8 ${
        theme === "dark"
          ? "bg-[radial-gradient(ellipse_at_16%_12%,#5b24807a,transparent_42%),radial-gradient(ellipse_at_88%_86%,#22d3ee38,transparent_42%),linear-gradient(135deg,var(--secondary-800)_0%,var(--primary-900)_48%,var(--secondary-900)_100%)]"
          : "bg-[radial-gradient(ellipse_at_16%_12%,#5b248023,transparent_42%),radial-gradient(ellipse_at_88%_86%,#22d3ee1f,transparent_42%),linear-gradient(135deg,var(--white)_0%,var(--primary-100)_48%,var(--accent-100)_100%)]"
      }`}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle compact />
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-36 -top-40 size-[34rem] rounded-full blur-[120px] ${
          theme === "dark" ? "bg-primary/60" : "bg-primary/20"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-40 -right-36 size-[34rem] rounded-full blur-[130px] ${
          theme === "dark" ? "bg-accent/30" : "bg-accent/20"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 [background-size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_76%)] ${
          theme === "dark"
            ? "bg-[linear-gradient(#ffffff0f_1px,transparent_1px),linear-gradient(90deg,#ffffff0f_1px,transparent_1px)]"
            : "bg-[linear-gradient(#231f2009_1px,transparent_1px),linear-gradient(90deg,#231f2009_1px,transparent_1px)]"
        }`}
      />

      <div className="relative w-full max-w-[30rem] rounded-2xl bg-card p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-8">
        <div className="mb-6 flex justify-center">
          <div className="flex justify-center rounded-xl bg-[var(--primary-900)] px-5 py-4">
            <img
              src={logo}
              alt="HorbIS Group"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        <ol className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {PASOS.map((label, index) => {
            const completado = index < pasoIndice
            const activo = index === pasoIndice
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={`flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    completado
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {completado ? (
                    <Check aria-hidden="true" className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium sm:text-[11px] ${
                    completado || activo
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {index < PASOS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-px w-4 ${
                      index < pasoIndice ? "bg-emerald-500/40" : "bg-border"
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="mb-5 text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
            {titulo}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {descripcion}
          </p>
        </div>

        <div aria-live="polite" key={paso}>
          {paso === "correo" && (
            <form className="space-y-5" onSubmit={handleEnviar}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="recovery-email"
                  className="text-sm font-medium text-foreground"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    autoFocus
                    aria-invalid={emailError !== null}
                    aria-describedby={emailError ? "recovery-email-error" : undefined}
                    className="h-12 rounded-xl border-border bg-background pl-11 text-sm focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setEmailError(null)
                    }}
                    required
                  />
                </div>
                {emailError && (
                  <p
                    id="recovery-email-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {emailError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSending}
                className="h-12 w-full rounded-xl text-sm font-semibold"
              >
                {isSending ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar instrucciones"
                )}
              </Button>
            </form>
          )}

          {paso === "confirmacion" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MailCheck aria-hidden="true" className="size-7" />
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground">
                  Si existe una cuenta con{" "}
                  <span className="font-semibold">{email}</span>, recibirás un
                  enlace para restablecer tu contraseña.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Revisa también la carpeta de spam.
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={() => setPaso("restablecer")}
                className="h-12 w-full rounded-xl text-sm font-semibold"
              >
                <KeyRound aria-hidden="true" className="size-4" />
                Continuar con la recuperación
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReenviar}
                  disabled={isSending || reenvioCooldown > 0}
                  className="h-11 flex-1 rounded-xl text-xs font-semibold"
                >
                  {isSending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <RefreshCw aria-hidden="true" className="size-3.5" />
                  )}
                  {reenvioCooldown > 0
                    ? `Reenviar en ${reenvioCooldown}s`
                    : "Reenviar correo"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleVolverCorreo}
                  className="h-11 flex-1 rounded-xl text-xs font-semibold"
                >
                  <ArrowLeft aria-hidden="true" className="size-3.5" />
                  Usar otro correo
                </Button>
              </div>
            </div>
          )}

          {paso === "restablecer" && (
            <form className="space-y-4" onSubmit={handleRestablecer}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="recovery-password"
                  className="text-sm font-medium text-foreground"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Input
                    id="recovery-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    autoFocus
                    aria-describedby="password-strength-help"
                    className="h-12 rounded-xl border-border bg-background px-4 pr-12 text-sm focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setPasswordError(null)
                    }}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="size-[1.125rem]" />
                    ) : (
                      <Eye aria-hidden="true" className="size-[1.125rem]" />
                    )}
                  </button>
                </div>
              </div>

              <PasswordStrengthIndicator password={password} />

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="recovery-confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Input
                    id="recovery-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    aria-invalid={passwordError !== null}
                    aria-describedby={
                      passwordError ? "recovery-password-error" : undefined
                    }
                    className="h-12 rounded-xl border-border bg-background px-4 pr-12 text-sm focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setPasswordError(null)
                    }}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showConfirmPassword}
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {showConfirmPassword ? (
                      <EyeOff aria-hidden="true" className="size-[1.125rem]" />
                    ) : (
                      <Eye aria-hidden="true" className="size-[1.125rem]" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p
                    id="recovery-password-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {passwordError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isResetting}
                className="h-12 w-full rounded-xl text-sm font-semibold"
              >
                {isResetting ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          )}

          {paso === "listo" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 aria-hidden="true" className="size-8" />
              </div>
              <p className="text-sm leading-6 text-foreground">
                Tu contraseña fue actualizada correctamente.
              </p>
              <Button
                type="button"
                size="lg"
                onClick={() => navigate("/login", { replace: true })}
                className="h-12 w-full rounded-xl text-sm font-semibold"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </div>

        {paso !== "listo" && (
          <div className="mt-6 border-t border-border/70 pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Volver a iniciar sesión
            </Link>
          </div>
        )}
      </div>

      <p className="relative text-center text-xs text-foreground/60">
        © 2026 HorbIS Group · v1.0.0
      </p>
    </main>
  )
}

export default PasswordRecoveryPage
