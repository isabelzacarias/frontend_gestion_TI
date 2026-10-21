function leerBandera(valor: string | undefined, porDefecto: boolean): boolean {
  if (valor === undefined) return porDefecto
  return valor === "true"
}

export const ADJUNTOS_GALERIA_DISPONIBLE = leerBandera(
  import.meta.env.VITE_ADJUNTOS_GALERIA,
  true,
)

export const ADJUNTOS_ELIMINAR_DISPONIBLE = leerBandera(
  import.meta.env.VITE_ADJUNTOS_ELIMINAR,
  true,
)
