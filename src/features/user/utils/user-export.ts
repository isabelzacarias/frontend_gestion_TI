import { downloadCsv } from "@/lib/csv"
import type { UsuarioLista } from "@/services/usuario.service"

import { formatearFecha } from "./user-format"

export const USER_EXPORT_HEADERS = [
  "ID",
  "Nombre",
  "Email",
  "Departamento",
  "Ubicación",
  "Puesto",
  "Tipo de usuario",
  "Rol",
  "Estado",
  "Fecha de inicio",
  "Fecha de fin",
]

function fechaCsv(value: string | null): string {
  return value ? formatearFecha(value) : ""
}

export function usuariosToExportRows(usuarios: UsuarioLista[]): string[][] {
  return usuarios.map((usuario) => [
    usuario.id,
    usuario.nombre,
    usuario.email ?? "",
    usuario.departamento?.nombre ?? "",
    usuario.ubicacion?.nombre ?? "",
    usuario.puesto?.nombre ?? "",
    usuario.tipoUsuario?.nombre ?? "",
    usuario.rol?.nombre ?? "",
    usuario.activo ? "Activa" : "Inactiva",
    fechaCsv(usuario.fechaInicio),
    fechaCsv(usuario.fechaFin),
  ])
}

export function exportUsuariosToCsv(
  usuarios: UsuarioLista[],
  fileName?: string,
): void {
  const marca = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "")

  downloadCsv(
    USER_EXPORT_HEADERS,
    usuariosToExportRows(usuarios),
    fileName ?? `usuarios_${marca.slice(0, 8)}_${marca.slice(8, 14)}.csv`,
  )
}
