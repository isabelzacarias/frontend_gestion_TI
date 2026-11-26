import axios from "axios"

import { api } from "@/services/api"

export type RestablecimientoPassword = {
  token: string
  password: string
}

export async function solicitarRecuperacionPassword(email: string): Promise<void> {
  await api.post("/auth/recuperar", { email })
}

export async function restablecerPassword(
  datos: RestablecimientoPassword,
): Promise<void> {
  await api.post("/auth/restablecer", datos)
}

export function mensajeErrorRecuperacion(
  error: unknown,
  textoPorDefecto: string,
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; errors?: Array<{ mensaje?: unknown }> }
      | undefined

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message
    }

    const primerError = data?.errors?.[0]?.mensaje
    if (typeof primerError === "string" && primerError.trim()) {
      return primerError
    }
  }

  return textoPorDefecto
}
