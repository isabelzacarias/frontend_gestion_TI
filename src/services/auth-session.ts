import type { UsuarioPerfil } from "@/types/auth"

const AUTH_SESSION_KEY = "gestion-ti.auth-session"

export const AUTH_SESSION_EXPIRED_EVENT = "gestion-ti:session-expired"

export interface StoredAuthSession {
  token: string
  usuario: UsuarioPerfil | null
  recordar: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isUsuarioPerfil(value: unknown): value is UsuarioPerfil {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.nombre === "string" &&
    typeof value.email === "string" &&
    typeof value.activo === "boolean" &&
    (typeof value.rol === "string" || value.rol === null)
  )
}

function parseStoredSession(
  value: string,
  recordar: boolean,
): StoredAuthSession | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }

  if (
    !isRecord(parsed) ||
    typeof parsed.token !== "string" ||
    parsed.token.length === 0
  ) {
    return null
  }

  return {
    token: parsed.token,
    usuario: isUsuarioPerfil(parsed.usuario) ? parsed.usuario : null,
    recordar,
  }
}

export function readStoredAuthSession(): StoredAuthSession | null {
  const rememberedSession = localStorage.getItem(AUTH_SESSION_KEY)
  if (rememberedSession !== null) {
    const parsed = parseStoredSession(rememberedSession, true)
    if (parsed) return parsed
    clearStoredAuthSession()
  }

  const temporarySession = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (temporarySession !== null) {
    const parsed = parseStoredSession(temporarySession, false)
    if (parsed) return parsed
    clearStoredAuthSession()
  }

  return null
}

export function persistAuthSession(
  token: string,
  usuario: UsuarioPerfil | null,
  recordar: boolean,
): void {
  clearStoredAuthSession()
  const storage = recordar ? localStorage : sessionStorage
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, usuario }))
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem(AUTH_SESSION_KEY)
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}
