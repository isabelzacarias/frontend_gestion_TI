import { useContext } from "react"

import { ThemeContext } from "@/components/theme/theme-context"

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.")
  }
  return context
}

export { useTheme }
