import type { ReactNode } from "react"

import { PagePlaceholder } from "@/components/common/PagePlaceholder"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "@/hooks/useTheme"
import { useAppPreferences } from "@/hooks/useAppPreferences"
import {
  isHomeRoute,
  isTextSize,
} from "@/preferences/app-preferences"
import type { HomeRoute } from "@/preferences/app-preferences"

const homeRouteOptions: { value: HomeRoute; label: string }[] = [
  { value: "/tickets", label: "Tickets" },
  { value: "/kanban", label: "Tablero Kanban" },
  { value: "/inventory", label: "Inventario" },
  { value: "/licenses", label: "Licencias" },
  { value: "/projects", label: "Proyectos" },
  { value: "/reports", label: "Reportes" },
  { value: "/passwords", label: "Contraseñas" },
]

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:w-56"

interface PreferenceRowProps {
  title: string
  description: string
  control: ReactNode
}

function PreferenceRow({ title, description, control }: PreferenceRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center sm:justify-end">{control}</div>
    </div>
  )
}

function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { preferences, updatePreference } = useAppPreferences()

  return (
    <PagePlaceholder
      title="Configuración"
      description="Ajusta la experiencia a tu forma de trabajar."
    >
      <div className="w-full max-w-3xl divide-y divide-border">
        <section aria-labelledby="appearance-heading" className="pb-2">
          <h2
            id="appearance-heading"
            className="pt-2 text-base font-semibold tracking-tight"
          >
            Apariencia
          </h2>
          <PreferenceRow
            title="Tema"
            description="Elige el modo de color para toda la aplicación."
            control={
              <select
                aria-label="Tema de la aplicación"
                className={selectClassName}
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value === "dark" ? "dark" : "light")
                }
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            }
          />
          <PreferenceRow
            title="Barra lateral compacta"
            description="Mantén la navegación contraída para disponer de más espacio."
            control={
              <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                <span>
                  {preferences.sidebarCollapsed ? "Activada" : "Desactivada"}
                </span>
                <Checkbox
                  aria-label="Mantener la barra lateral compacta"
                  checked={preferences.sidebarCollapsed}
                  onCheckedChange={(checked) =>
                    updatePreference("sidebarCollapsed", checked === true)
                  }
                />
              </label>
            }
          />
        </section>

        <section aria-labelledby="accessibility-heading" className="py-4">
          <h2
            id="accessibility-heading"
            className="text-base font-semibold tracking-tight"
          >
            Accesibilidad
          </h2>
          <PreferenceRow
            title="Tamaño del texto"
            description="Aumenta el texto de la interfaz sin cambiar el contenido."
            control={
              <select
                aria-label="Tamaño del texto"
                className={selectClassName}
                value={preferences.textSize}
                onChange={(event) => {
                  if (isTextSize(event.target.value)) {
                    updatePreference("textSize", event.target.value)
                  }
                }}
              >
                <option value="normal">Normal</option>
                <option value="large">Grande</option>
              </select>
            }
          />
          <PreferenceRow
            title="Reducir movimiento"
            description="Minimiza animaciones y transiciones de la interfaz."
            control={
              <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                <span>
                  {preferences.reduceMotion ? "Activada" : "Desactivada"}
                </span>
                <Checkbox
                  aria-label="Reducir movimiento"
                  checked={preferences.reduceMotion}
                  onCheckedChange={(checked) =>
                    updatePreference("reduceMotion", checked === true)
                  }
                />
              </label>
            }
          />
        </section>

        <section aria-labelledby="startup-heading" className="pt-4">
          <h2
            id="startup-heading"
            className="text-base font-semibold tracking-tight"
          >
            Inicio
          </h2>
          <PreferenceRow
            title="Página inicial"
            description="Se abrirá cuando ingreses al sistema."
            control={
              <select
                aria-label="Página inicial"
                className={selectClassName}
                value={preferences.homeRoute}
                onChange={(event) => {
                  if (isHomeRoute(event.target.value)) {
                    updatePreference("homeRoute", event.target.value)
                  }
                }}
              >
                {homeRouteOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            }
          />
        </section>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Los cambios se guardan automáticamente en este navegador.
      </p>
    </PagePlaceholder>
  )
}

export default SettingsPage
