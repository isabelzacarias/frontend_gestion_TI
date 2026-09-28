import { useEffect } from "react"
import { RouterProvider } from "react-router"
import { Toaster, toast } from "sonner"

import { router } from "@/router"
import { AuthApiError } from "@/services/auth.service"
import { useAuthStore } from "@/store/authStore"

function App() {
  const cargarSesion = useAuthStore((state) => state.cargarSesion)

  useEffect(() => {
    void cargarSesion().catch((error: unknown) => {
      if (error instanceof AuthApiError && error.status === 401) return
      toast.error("No se pudo verificar la sesión. Inicia sesión nuevamente.")
    })
  }, [cargarSesion])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  )
}

export default App
