export type EntidadAdjunto =
  | "ACTIVO"
  | "MANTENIMIENTO"
  | "INCIDENCIA"
  | "PROYECTO"

export interface Adjunto {
  id: number
  entidadTipo: EntidadAdjunto
  entidadId: string
  nombreOriginal: string
  mimeType: string
  extension: string
  tamano: number
  subidoEn: string
}

export interface DescargaAdjunto {
  url: string
  expiraEn: string
}

export interface ParametrosListadoAdjuntos {
  entidadTipo: EntidadAdjunto
  entidadId: string
  page?: number
  limit?: number
}

export interface DatosSubidaAdjunto {
  archivo: File
  entidadTipo: EntidadAdjunto
  entidadId: string
}
