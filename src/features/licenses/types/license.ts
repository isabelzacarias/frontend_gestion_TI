export interface AsignadaA {
  id: string
  nombre: string
  email: string
}

export interface License {
  id: number
  software: string
  tieneClave: boolean
  clave?: string | null
  proveedor: string | null
  fechaCompra: string | null
  fechaVencimiento: string | null
  activa: boolean
  asignadaA: AsignadaA | null
}

export interface LicenseFormDraft extends Record<string, unknown> {
  software: string
  clave: string
  proveedor: string
  fechaCompra: string
  fechaVencimiento: string
  asignadaAId: string
  activa: boolean
}
