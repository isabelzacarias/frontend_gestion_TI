import axios from "axios"

import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearStoredAuthSession,
  readStoredAuthSession,
} from "@/services/auth-session"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = readStoredAuthSession()?.token
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.replace(/\/+$/, "").endsWith("/auth/login")
    ) {
      try {
        clearStoredAuthSession()
      } catch (storageError) {
        console.error("No se pudo limpiar la sesión almacenada.", storageError)
      }

      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(error)
  },
)

export { api }
