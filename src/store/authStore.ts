import { create } from "zustand"

import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearStoredAuthSession,
  persistAuthSession,
  readStoredAuthSession,
} from "@/services/auth-session"
import { AuthApiError, login, obtenerPerfil } from "@/services/auth.service"
import type { UsuarioPerfil } from "@/types/auth"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  token: string | null
  usuario: UsuarioPerfil | null
  status: AuthStatus
  iniciarSesion: (
    email: string,
    password: string,
    recordar: boolean,
  ) => Promise<void>
  cerrarSesion: () => void
  cargarSesion: () => Promise<void>
}

let hydrationPromise: Promise<void> | null = null

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  usuario: null,
  status: "loading",

  async iniciarSesion(email, password, recordar) {
    const respuesta = await login(email, password)
    persistAuthSession(respuesta.token, null, recordar)
    set({ token: respuesta.token, usuario: null, status: "loading" })

    try {
      const usuario = await obtenerPerfil()
      persistAuthSession(respuesta.token, usuario, recordar)
      set({ token: respuesta.token, usuario, status: "authenticated" })
    } catch (error) {
      clearStoredAuthSession()
      set({ token: null, usuario: null, status: "unauthenticated" })
      throw error
    }
  },

  cerrarSesion() {
    set({ token: null, usuario: null, status: "unauthenticated" })
    clearStoredAuthSession()
  },

  async cargarSesion() {
    if (get().status !== "loading") return
    if (hydrationPromise) return hydrationPromise

    hydrationPromise = (async () => {
      const storedSession = readStoredAuthSession()
      if (!storedSession) {
        set({ token: null, usuario: null, status: "unauthenticated" })
        return
      }

      set({
        token: storedSession.token,
        usuario: storedSession.usuario,
        status: "loading",
      })

      try {
        const usuario = await obtenerPerfil()
        persistAuthSession(
          storedSession.token,
          usuario,
          storedSession.recordar,
        )
        set({
          token: storedSession.token,
          usuario,
          status: "authenticated",
        })
      } catch (error) {
        clearStoredAuthSession()
        set({ token: null, usuario: null, status: "unauthenticated" })
        if (!(error instanceof AuthApiError && error.status === 401)) {
          throw error
        }
      }
    })().finally(() => {
      hydrationPromise = null
    })

    return hydrationPromise
  },
}))

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, () => {
    useAuthStore.setState({
      token: null,
      usuario: null,
      status: "unauthenticated",
    })
  })
}

export { useAuthStore }
