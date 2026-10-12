import { useLayoutEffect, useState } from "react"
import type { ReactNode } from "react"

import {
  APP_PREFERENCES_STORAGE_KEY,
  AppPreferencesContext,
  readAppPreferences,
} from "@/preferences/app-preferences"
import type { AppPreferences } from "@/preferences/app-preferences"

interface AppPreferencesProviderProps {
  children: ReactNode
}

function AppPreferencesProvider({ children }: AppPreferencesProviderProps) {
  const [preferences, setPreferences] =
    useState<AppPreferences>(readAppPreferences)

  useLayoutEffect(() => {
    document.documentElement.dataset.textSize = preferences.textSize
    document.documentElement.dataset.reduceMotion = String(
      preferences.reduceMotion,
    )
    window.localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  }, [preferences])

  function updatePreference<K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K],
  ) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }))
  }

  return (
    <AppPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </AppPreferencesContext.Provider>
  )
}

export default AppPreferencesProvider
