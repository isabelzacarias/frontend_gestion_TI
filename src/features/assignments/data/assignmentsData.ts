import { inventoryData, type InventoryItem } from "@/features/inventory/data/inventoryData"
import type {
  Assignment,
  AssignmentAsset,
  AssignmentUser,
} from "@/features/assignments/types/assignment"

/**
 * Datos de ejemplo del módulo de asignaciones.
 * Reflejan la forma que devuelve `GET /api/asignaciones`.
 * Los registros con `activa: true` son de demostración para visualizar
 * el estado activo y la acción de devolución.
 */
export const sampleAssignments: Assignment[] = [
  {
    id: 20,
    activa: true,
    fechaAsignacion: "2026-10-07T15:22:10.455Z",
    fechaDevolucion: null,
    anioCompra: 2023,
    numeroActivo: "ACT-0304",
    nombreEquipo: "SRV-BACKUP",
    observacion: "Servidor de respaldo en sitio",
    usuario: {
      id: "A280",
      nombre: "FERNANDO ISAIAS MORALES LÓPEZ",
      email: "fernando.morales@horbismex.com",
    },
    activo: {
      id: 616,
      claveActivo: "ACT-0304",
      tipo: "Servidor",
      marca: "Lenovo",
      modelo: "ThinkSystem SR650",
      numeroSerie: "TPXQ7N0M4A9",
      estado: "EN_USO",
    },
  },
  {
    id: 19,
    activa: true,
    fechaAsignacion: "2026-10-06T13:05:48.120Z",
    fechaDevolucion: null,
    anioCompra: 2025,
    numeroActivo: "ACT-0588",
    nombreEquipo: "LAP-DELL-02",
    observacion: "Equipo asignado para trabajo híbrido",
    usuario: {
      id: "A042",
      nombre: "MIRIAM DEL CARMEN CHAN RIVERA",
      email: "miriam.chan@horbismex.com",
    },
    activo: {
      id: 700,
      claveActivo: "ACT-0588",
      tipo: "Laptop",
      marca: "Dell",
      modelo: "Latitude 5440",
      numeroSerie: "JX4K91LQH2P7",
      estado: "EN_USO",
    },
  },
  {
    id: 18,
    activa: false,
    fechaAsignacion: "2026-10-05T19:49:17.821Z",
    fechaDevolucion: "2026-10-05T19:49:21.098Z",
    anioCompra: 2024,
    numeroActivo: null,
    nombreEquipo: "PC-TEST-01",
    observacion: "Entrega de prueba",
    usuario: {
      id: "A010",
      nombre: "LAURIANO ANTONIO CRUZ DURANTE",
      email: "antonio.cruz@horbismex.com",
    },
    activo: {
      id: 695,
      claveActivo: "AFTEST1791229753460",
      tipo: "Dispositivo de prueba",
      marca: "Genius editada",
      modelo: null,
      numeroSerie: "SNAFTEST1791229753460",
      estado: "EN_ALMACEN",
    },
  },
  {
    id: 17,
    activa: false,
    fechaAsignacion: "2026-10-05T19:12:48.048Z",
    fechaDevolucion: "2026-10-05T19:12:51.222Z",
    anioCompra: 2024,
    numeroActivo: null,
    nombreEquipo: "PC-TEST-01",
    observacion: "Entrega de prueba",
    usuario: {
      id: "A010",
      nombre: "LAURIANO ANTONIO CRUZ DURANTE",
      email: "antonio.cruz@horbismex.com",
    },
    activo: {
      id: 691,
      claveActivo: "AFTEST1791227563912",
      tipo: "Dispositivo de prueba",
      marca: "Genius editada",
      modelo: null,
      numeroSerie: "SNAFTEST1791227563912",
      estado: "EN_ALMACEN",
    },
  },
  {
    id: 16,
    activa: false,
    fechaAsignacion: "2026-10-05T17:48:37.910Z",
    fechaDevolucion: "2026-10-05T17:48:41.316Z",
    anioCompra: 2024,
    numeroActivo: null,
    nombreEquipo: "PC-TEST-01",
    observacion: "Entrega de prueba",
    usuario: {
      id: "A010",
      nombre: "LAURIANO ANTONIO CRUZ DURANTE",
      email: "antonio.cruz@horbismex.com",
    },
    activo: {
      id: 687,
      claveActivo: "AFTEST1791222513480",
      tipo: "Dispositivo de prueba",
      marca: "Genius editada",
      modelo: null,
      numeroSerie: "SNAFTEST1791222513480",
      estado: "EN_ALMACEN",
    },
  },
  {
    id: 15,
    activa: false,
    fechaAsignacion: "2026-10-05T17:35:57.400Z",
    fechaDevolucion: "2026-10-05T17:36:00.844Z",
    anioCompra: 2024,
    numeroActivo: null,
    nombreEquipo: "PC-TEST-01",
    observacion: "Entrega de prueba",
    usuario: {
      id: "A010",
      nombre: "LAURIANO ANTONIO CRUZ DURANTE",
      email: "antonio.cruz@horbismex.com",
    },
    activo: {
      id: 683,
      claveActivo: "AFTEST1791221752863",
      tipo: "Dispositivo de prueba",
      marca: "Genius editada",
      modelo: null,
      numeroSerie: "SNAFTEST1791221752863",
      estado: "EN_ALMACEN",
    },
  },
  {
    id: 14,
    activa: false,
    fechaAsignacion: "2026-10-05T17:33:29.629Z",
    fechaDevolucion: "2026-10-05T17:33:32.998Z",
    anioCompra: 2024,
    numeroActivo: null,
    nombreEquipo: "PC-TEST-01",
    observacion: "Entrega de prueba",
    usuario: {
      id: "A010",
      nombre: "LAURIANO ANTONIO CRUZ DURANTE",
      email: "antonio.cruz@horbismex.com",
    },
    activo: {
      id: 679,
      claveActivo: "AFTEST1791221605273",
      tipo: "Dispositivo de prueba",
      marca: "Genius editada",
      modelo: null,
      numeroSerie: "SNAFTEST1791221605273",
      estado: "EN_ALMACEN",
    },
  },
]

/**
 * Mapas de estados del inventario al estado usado por las asignaciones.
 */
const assetStateFromInventory: Record<
  InventoryItem["estado"],
  AssignmentAsset["estado"]
> = {
  EN_USO: "EN_USO",
  DISPONIBLE: "EN_ALMACEN",
  MANTENIMIENTO: "EN_MANTENIMIENTO",
  BAJA: "DE_BAJA",
}

/**
 * Catálogo de activos disponibles para asignar.
 * Se compone del inventario de ejemplo más los activos presentes
 * en las asignaciones existentes (para poder editarlas sin perder datos).
 */
const assetsById = new Map<number, AssignmentAsset>()

for (const item of inventoryData) {
  assetsById.set(item.id, {
    id: item.id,
    claveActivo: item.claveActivo,
    tipo: item.tipo,
    marca: item.marca,
    modelo: item.modelo,
    numeroSerie: item.numeroSerie,
    estado: assetStateFromInventory[item.estado],
  })
}

for (const item of sampleAssignments) {
  if (!assetsById.has(item.activo.id)) {
    assetsById.set(item.activo.id, item.activo)
  }
}

export const assignmentAssetOptions: AssignmentAsset[] = [...assetsById.values()]

/**
 * Catálogo de usuarios asignables.
 * Se compone de los responsables del inventario más los usuarios
 * presentes en las asignaciones existentes.
 */
const usersById = new Map<string, AssignmentUser>()

for (const item of inventoryData) {
  usersById.set(item.responsable.id, {
    id: item.responsable.id,
    nombre: item.responsable.nombre,
    email: item.responsable.email,
  })
}

for (const item of sampleAssignments) {
  if (!usersById.has(item.usuario.id)) {
    usersById.set(item.usuario.id, item.usuario)
  }
}

export const assignmentUserOptions: AssignmentUser[] = [...usersById.values()].sort(
  (a, b) => a.nombre.localeCompare(b.nombre),
)
