# Sistema de Gestion de TI - Frontend Client

Cliente web (Single Page Application - SPA) para el Sistema de Gestion de TI, desarrollado con React, TypeScript, Tailwind CSS, Shadcn UI y Zustand. Esta interfaz se comunica con la API RESTful del backend y mantiene conexion bidireccional en tiempo real para la gestion de tickets, tablero Kanban, inventarios y el asistente de IA con soporte de voz.

---

## Stack Tecnologico

### Lenguajes y Tecnologias Base
* TypeScript: Lenguaje principal para el desarrollo de la interfaz con tipado estatico estricto.
* React: Framework/Libreria base para la construccion de la SPA modular y responsiva.
* HTML5: Estructura semantica accesible e integracion de APIs multimedia.
* Tailwind CSS: Framework utilitario para maquetacion rapida, responsiva y personalizada.

### Componentes Visuales y UI
* Lucide React / Heroicons: Iconografia vectorial ligera.
* Shadcn UI / Headless UI: Componentes accesibles e integrados con Tailwind (modales, comboboxes, pestanas).
* TanStack Table (React Table): Tablas de datos avanzadas con ordenamiento, paginacion y filtros.

### Interactividad y UX
* @hello-pangea/dnd: Implementacion de arrastrar y soltar (Drag & Drop) para el tablero Kanban.
* ApexCharts / Chart.js (React-Chartjs-2): Graficos interactivos para el Dashboard de KPIs.
* React Dropzone: Carga de evidencias mediante Drag & Drop o pegado desde el portapapeles (Ctrl + V).
* Sonner / React Hot Toast: Alertas flotantes (Toasts) para retroalimentacion inmediata.

### Red, Estado y Comunicacion
* Axios: Cliente HTTP con interceptores para adjuntar tokens JWT y manejo centralizado de errores.
* Zustand: Gestion del estado global de sesion, preferencias de UI y estados compartidos.
* Socket.io-client: Conexion mediante WebSockets para actualizaciones en tiempo real.
* Web Speech API: Reconocimiento de voz (Speech-to-Text) y sintesis hablada (Text-to-Speech) para la interaccion con el chatbot.

---

## Estructura del Proyecto

```text
src/
 ├── assets/         # Recursos estaticos (imagenes, logotipos, iconos)
 ├── components/     
 │    ├── ui/        # Componentes atomicos (Button, Input, Modal, Table, Badge)
 │    ├── layout/    # Navbar, Sidebar, Footer, Layout principal
 │    └── common/    # Buscador global (Ctrl+K), Notificaciones toast, Modales
 ├── features/       # Modulos organizados por dominio funcional
 │    ├── auth/      # Login, Recuperacion de contrasena, Perfil, 2FA
 │    ├── tickets/   # Lista de tickets, Detalle, Subtareas, Formulario de creacion
 │    ├── kanban/    # Tablero Kanban interactivo con WebSockets
 │    ├── inventory/ # Inventario de activos y asignaciones
 │    ├── licenses/  # Repositorio cifrado de licencias
 │    ├── projects/  # Gestion de proyectos
 │    ├── reports/   # Dashboard con KPIs
 │    └── chatbot/   # Widget flotante de IA con entrada/salida por voz
 ├── hooks/          # Custom hooks reutilizables (useTickets, useSocket, useSpeech)
 ├── services/       # Clientes de API REST (Axios) y WebSockets
 ├── store/          # Tiendas globales de Zustand (authStore, uiStore)
 ├── types/          # Interfaces y tipos globales de TypeScript
 └── utils/          # Formateadores, constantes globales y helpers