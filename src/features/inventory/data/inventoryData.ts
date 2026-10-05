export interface Responsable {
  id: string
  nombre: string
  email: string
}

export interface InventoryItem {
  id: number
  claveActivo: string | null
  cb23: string
  tipo: string
  marca: string
  modelo: string
  numeroSerie: string
  sucursal: string
  estado: "EN_USO" | "DISPONIBLE" | "MANTENIMIENTO" | "BAJA"
  estadoGeneral: "Excelente" | "Bueno" | "Regular" | "Crítico"
  nombreRed: string
  responsable: Responsable
}

export const inventoryData: InventoryItem[] = [
  {
    id: 532,
    claveActivo: null,
    cb23: "200032",
    tipo: "Desktop",
    marca: "Acteck",
    modelo: "H410MHV3",
    numeroSerie: "0P8LHTQKA02720V",
    sucursal: "PLAYA",
    estado: "EN_USO",
    estadoGeneral: "Regular",
    nombreRed: "ADMP-01",
    responsable: {
      id: "A010",
      nombre: "LAURIANO ANTONIO CRUZ DURANTE",
      email: "antonio.cruz@horbismex.com",
    },
  },
  {
    id: 534,
    claveActivo: "ACT-0189",
    cb23: "200045",
    tipo: "Laptop",
    marca: "Dell",
    modelo: "Latitude 5440",
    numeroSerie: "JX4K91LQH2P7",
    sucursal: "MERIDA",
    estado: "EN_USO",
    estadoGeneral: "Bueno",
    nombreRed: "MD-02",
    responsable: {
      id: "A042",
      nombre: "MIRIAM DEL CARMEN CHAN RIVERA",
      email: "miriam.chan@horbismex.com",
    },
  },
  {
    id: 561,
    claveActivo: "ACT-0214",
    cb23: "200118",
    tipo: "Impresora",
    marca: "HP",
    modelo: "LaserJet Pro M404n",
    numeroSerie: "CNBJ4F9R2K",
    sucursal: "PLAYA",
    estado: "MANTENIMIENTO",
    estadoGeneral: "Regular",
    nombreRed: "PRN-03",
    responsable: {
      id: "A117",
      nombre: "ALVARO MANUEL GARCIA PEREZ",
      email: "alvaro.garcia@horbismex.com",
    },
  },
  {
    id: 598,
    claveActivo: "ACT-0261",
    cb23: "200152",
    tipo: "Monitor",
    marca: "LG",
    modelo: "22MP410-B",
    numeroSerie: "4L0W8TQY3M6",
    sucursal: "CANCUN",
    estado: "DISPONIBLE",
    estadoGeneral: "Excelente",
    nombreRed: "MON-08",
    responsable: {
      id: "A180",
      nombre: "PATRICIA EUGENIA LARA SANCHEZ",
      email: "patricia.lara@horbismex.com",
    },
  },
  {
    id: 616,
    claveActivo: "ACT-0304",
    cb23: "200209",
    tipo: "Servidor",
    marca: "Lenovo",
    modelo: "ThinkSystem SR650",
    numeroSerie: "TPXQ7N0M4A9",
    sucursal: "MERIDA",
    estado: "EN_USO",
    estadoGeneral: "Bueno",
    nombreRed: "SRV-12",
    responsable: {
      id: "A280",
      nombre: "FERNANDO ISAIAS MORALES LÓPEZ",
      email: "fernando.morales@horbismex.com",
    },
  },
  {
    id: 622,
    claveActivo: "ACT-0318",
    cb23: "200221",
    tipo: "Desktop",
    marca: "HP",
    modelo: "ProDesk 600 G5",
    numeroSerie: "5TYQMKL2P8V0",
    sucursal: "CANCUN",
    estado: "BAJA",
    estadoGeneral: "Crítico",
    nombreRed: "ADMP-19",
    responsable: {
      id: "A330",
      nombre: "DANIELA ALEJANDRA HERNANDEZ LOPEZ",
      email: "daniela.hernandez@horbismex.com",
    },
  },
  {
    id: 640,
    claveActivo: "ACT-0347",
    cb23: "200310",
    tipo: "Laptop",
    marca: "Lenovo",
    modelo: "ThinkPad T14",
    numeroSerie: "N92KQW1R7ZJ4",
    sucursal: "PLAYA",
    estado: "EN_USO",
    estadoGeneral: "Excelente",
    nombreRed: "LT-09",
    responsable: {
      id: "A388",
      nombre: "JOSE LUIS RODRIGUEZ CANCHE",
      email: "jose.rodriguez@horbismex.com",
    },
  },
  {
    id: 645,
    claveActivo: "ACT-0358",
    cb23: "200332",
    tipo: "Switch",
    marca: "Cisco",
    modelo: "Catalyst 9200",
    numeroSerie: "FCN7T9M2R4L1",
    sucursal: "PLAYA",
    estado: "EN_USO",
    estadoGeneral: "Bueno",
    nombreRed: "SW-05",
    responsable: {
      id: "A415",
      nombre: "YADIRA PATRICIA BARRIOS REYES",
      email: "yadira.barrios@horbismex.com",
    },
  },
]
