import { createContext } from "react"

export type TextSize = "normal" | "large"
export type HomeRoute =
  | "/home"
  | "/tickets"
  | "/kanban"
  | "/inventory"
  | "/licenses"
  | "/projects"
  | "/reports"
  | "/passwords"

export interface AppPreferences {
  textSize: TextSize
  reduceMotion: boolean
  sidebarCollapsed: boolean
  homeRoute: HomeRoute
}

export interface AppPreferencesContextValue {
  preferences: AppPreferences
  updatePreference: <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K],
  ) => void
}

export const APP_PREFERENCES_STORAGE_KEY = "gestion-ti.preferences"
const LEGACY_SIDEBAR_STORAGE_KEY = "sidebar-collapsada"

const DEFAULT_PREFERENCES: AppPreferences = {
  textSize: "normal",
  reduceMotion: false,
  sidebarCollapsed: false,
  homeRoute: "/tickets",
}

function getDefaultPreferences(
  legacySidebarPreference: string | null,
): AppPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    sidebarCollapsed: legacySidebarPreference === "true",
  }
}

const validHomeRoutes: ReadonlySet<string> = new Set([
  "/home",
  "/tickets",
  "/kanban",
  "/inventory",
  "/licenses",
  "/projects",
  "/reports",
  "/passwords",
])

export function isTextSize(value: string): value is TextSize {
  return value === "normal" || value === "large"
}

export function isHomeRoute(value: string): value is HomeRoute {
  return validHomeRoutes.has(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function readAppPreferences(): AppPreferences {
  const storedPreferences = window.localStorage.getItem(
    APP_PREFERENCES_STORAGE_KEY,
  )
  const legacySidebarPreference = window.localStorage.getItem(
    LEGACY_SIDEBAR_STORAGE_KEY,
  )

  if (!storedPreferences) {
    return getDefaultPreferences(legacySidebarPreference)
  }

  let parsedPreferences: unknown
  try {
    parsedPreferences = JSON.parse(storedPreferences)
  } catch (error) {
    console.error("No se pudieron leer las preferencias guardadas.", error)
    return getDefaultPreferences(legacySidebarPreference)
  }

  if (!isRecord(parsedPreferences)) {
    return getDefaultPreferences(legacySidebarPreference)
  }

  const storedHomeRoute = parsedPreferences.homeRoute

  return {
    textSize: parsedPreferences.textSize === "large" ? "large" : "normal",
    reduceMotion: parsedPreferences.reduceMotion === true,
    sidebarCollapsed:
      typeof parsedPreferences.sidebarCollapsed === "boolean"
        ? parsedPreferences.sidebarCollapsed
        : legacySidebarPreference === "true",
    homeRoute:
      typeof storedHomeRoute === "string" && isHomeRoute(storedHomeRoute)
        ? storedHomeRoute
        : DEFAULT_PREFERENCES.homeRoute,
  }
}

export const AppPreferencesContext =
  createContext<AppPreferencesContextValue | null>(null)
