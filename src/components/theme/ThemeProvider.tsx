import { useLayoutEffect, useState } from "react"
import type { ReactNode } from "react"

import { ThemeContext } from "@/components/theme/theme-context"
import type { Theme } from "@/components/theme/theme-context"

const THEME_STORAGE_KEY = "gestion-ti.theme"

interface ThemeProviderProps {
  children: ReactNode
}

function getInitialTheme(): Theme {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
    ? "dark"
    : "light"
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
