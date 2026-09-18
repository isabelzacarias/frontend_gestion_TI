# Contexto del Proyecto para Agentes de IA: Frontend Client (Sistema de Gestión de TI)

## 1. Misión del Sistema y Rol del Agente
Este proyecto es el cliente web (*Single Page Application* - SPA) para el **Sistema de Gestión de TI**.
Tu rol como Agente de IA es generar, refactorizar o auditar componentes visuales, vistas, hooks y lógica de estado del frontend, manteniendo estricta adherencia a las guías de usabilidad, tipado estricto en TypeScript, diseño responsivo con Tailwind CSS y desacoplamiento con la API del backend.

---

## 2. Stack Tecnológico Obligatorio

* **Framework & Lenguaje:** React con TypeScript (modo estricto activado, uso de `any` strictly prohibido).
* **Maquetación & Estilos:**
  * **Tailwind CSS:** Framework utilitario para diseño rápido, limpio y adaptativo.
  * **Shadcn UI / Headless UI:** Componentes accesibles e integrados con Tailwind para modales, desplegables, pestañas y comboboxes.
  * **Lucide React / Heroicons:** Iconografía vectorial para acciones, estados y navegación.
* **Manejo de Tablas & Datos:**
  * **TanStack Table (React Table):** Tablas interactivas con paginación, ordenamiento dinámico por columnas y filtrado multivariable.
* **Interactividad & UX:**
  * **`@hello-pangea/dnd` (o `dnd-kit`):** Implementación de Drag & Drop para el Tablero Kanban.
  * **ApexCharts / Chart.js (`react-chartjs-2`):** Gráficos visuales para el Dashboard de KPIs.
  * **React Dropzone:** Carga de evidencias e imágenes mediante arrastrar/soltar o pegado directo (`Ctrl + V`).
  * **Sonner / React Hot Toast:** Sistema de alertas flotantes para confirmaciones y errores.
* **Red, Estado & Comunicación:**
  * **Axios:** Cliente HTTP para consumir la API REST con interceptores para JWT.
  * **Zustand:** Gestión del estado global (sesión de usuario, tema visual, notificaciones y modales).
  * **`socket.io-client`:** WebSockets para actualización en tiempo real del Tablero Kanban.
  * **Web Speech API:** Reconocimiento de voz (*Speech-to-Text*) y síntesis hablada (*Text-to-Speech*) para la interacción con el Chatbot.

---

## 3. Reglas de Arquitectura y Patrones de Código

Al escribir o modificar código en este repositorio, DEBES seguir estas reglas:

1. **Tipado Estricto (TypeScript):**
   * NUNCA utilices el tipo `any`. Crea interfaces o tipos explícitos dentro de `src/types/` o en el archivo del módulo correspondiente.
   * Tipa explícitamente las propiedades (`props`) de todos los componentes y los valores de retorno de los *custom hooks*.

2. **Estructura y Separación de Componentes:**
   * **Componentes Atómicos (`src/components/ui/`):** Componentes visuales puros y reutilizables (botones, inputs, modales base) sin lógica de negocio ni llamadas directas a APIs.
   * **Vistas y Módulos (`src/features/`):** Componentes contenedores que gestionan la lógica de negocio, consumen hooks y renderizan los componentes atómicos.

3. **Consumo de API y Estado Global:**
   * Realiza las peticiones HTTP utilizando exclusivamente la instancia centralizada de Axios en `src/services/api.ts`.
   * Utiliza **Zustand** únicamente para estados compartidos globalmente (sesión de usuario en `useAuthStore`, modales globales en `useUIStore`).
   * Para datos locales de vistas, abstrae la lógica mediante *custom hooks* en `src/hooks/`.

4. **Retroalimentación Visual Obligatoria:**
   * Muestra siempre estados de carga (*spinners*, esqueletos) durante peticiones asíncronas.
   * Deshabilita botones durante el envío de formularios para evitar peticiones duplicadas.
   * Muestra notificaciones flotantes (*Toasts*) ante confirmaciones de guardado o errores de red.

---

## 4. Estructura de Directorios (`src/`)

```text
src/
 ├── assets/         # Imágenes, logotipos e iconos estáticos
 ├── components/     
 │    ├── ui/        # Componentes base atómicos (Button, Input, Modal, Table, Badge)
 │    ├── layout/    # Navbar, Sidebar, Footer, Layout principal
 │    └── common/    # Buscador global (Ctrl+K), Notificaciones toast, Modales globales
 ├── features/       # Módulos organizados por dominio funcional
 │    ├── auth/      # Login, Recuperación de contraseña, Perfil, 2FA
 │    ├── tickets/   # Lista de tickets, Detalle, Subtareas, Formulario de creación
 │    ├── kanban/    # Tablero Kanban con Drag & Drop y WebSockets
 │    ├── inventory/ # Inventario de activos, Ficha técnica, Asignaciones
 │    ├── licenses/  # Repositorio cifrado de licencias y credenciales
 │    ├── projects/  # Módulo de gestión de proyectos y cronogramas
 │    ├── reports/   # Dashboard con KPIs y exportadores
 │    └── chatbot/   # Widget flotante de IA con entrada/salida por voz
 ├── hooks/          # Custom hooks reutilizables (useTickets, useSocket, useSpeech)
 ├── services/       # Clientes de API REST (Axios) y conexiones de WebSockets
 ├── store/          # Tiendas globales de Zustand (authStore, uiStore)
 ├── types/          # Interfaces y tipos globales de TypeScript
 └── utils/          # Formateadores de fecha, moneda y constantes globales
