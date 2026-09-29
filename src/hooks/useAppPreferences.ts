import { useContext } from "react"

import { AppPreferencesContext } from "@/preferences/app-preferences"

function useAppPreferences() {
  const context = useContext(AppPreferencesContext)
  if (!context) {
    throw new Error(
      "useAppPreferences debe usarse dentro de AppPreferencesProvider.",
    )
  }
  return context
}

export { useAppPreferences }
