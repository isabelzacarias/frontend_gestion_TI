import { Loader2 } from "lucide-react"
import { Navigate, Outlet } from "react-router"

import LoginPage from "@/features/auth/pages/LoginPage"
import { useAuthStore } from "@/store/authStore"

function AuthLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center gap-3 bg-background text-sm text-muted-foreground"
    >
      <Loader2 aria-hidden="true" className="size-5 animate-spin text-primary" />
      Verificando sesión...
    </main>
  )
}

function RequireAuth() {
  const status = useAuthStore((state) => state.status)
  const token = useAuthStore((state) => state.token)

  if (status === "loading") return <AuthLoading />
  if (!token || status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function LoginRoute() {
  const status = useAuthStore((state) => state.status)
  const token = useAuthStore((state) => state.token)

  if (status === "loading") return <AuthLoading />
  if (token && status === "authenticated") {
    return <Navigate to="/" replace />
  }

  return <LoginPage />
}

export { LoginRoute, RequireAuth }
