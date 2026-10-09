# Roadmap del Proyecto - Frontend Gestión TI

Este documento centraliza la planificación, el estado de avance y los lineamientos de arquitectura del frontend para el sistema de Gestión de TI. Sirve como fuente única de verdad para el equipo de desarrollo, asegurando calidad de código, rigor técnico y consistencia de diseño en cada iteración.

> **Nota:** El estado marcado (`[x]`) refleja las funcionalidades y componentes ya implementados y verificados en el código fuente actual del repositorio.

---

## Convenciones y Criterios de Prioridad

- `[ ]` = Tarea pendiente de implementación o refinamiento
- `[x]` = Tarea finalizada, probada y validada en el proyecto
- **Prioridad Alta (Crítica):** Bloqueante o esencial para la operatividad y arquitectura base del sistema.
- **Prioridad Media (Importante):** Aporta valor de negocio central y complementa los flujos principales.
- **Prioridad Baja (Mejora/Pulido):** Optimizaciones visuales, microinteracciones, rendimiento o características no bloqueantes.

---

## ⭐️ Regla de Oro: Consistencia Visual y Componentes Base Obligatorios

Para garantizar una experiencia de usuario (UX) homogénea, profesional y predecible en todo el sistema, **queda estrictamente prohibido crear tablas HTML ad-hoc, formularios modales dispersos o cuadros de diálogo de eliminación no estandarizados**.

Todo nuevo módulo (Tickets, Licencias, Proyectos, Usuarios, etc.) debe construirse obligatoriamente sobre los siguientes componentes base ubicados en `src/components/ui/`:

### 1. `DataTable<T>` (`src/components/ui/data-table.tsx`)
Es el componente mandatorio para cualquier listado o vista tabular del sistema.

* **Objetivo:** Estandarizar la visualización de datos densos con paginación integrada, accesibilidad y soporte de interacción rápida.
* **Características de diseño y comportamiento:**
  - **Encabezado Sticky:** Fondo con gradiente primario de la marca (`linear-gradient(135deg, var(--primary-600), var(--primary-500))`) con texto blanco y tracking tipográfico refinado que permanece visible durante el scroll vertical.
  - **Contenedor Glass/Card:** Bordes redondeados de gran curvatura (`rounded-[28px]`), sombra sutil (`shadow-[0_12px_35px_rgba(17,24,39,0.06)]`) y scroll horizontal/vertical controlado con `overscroll-behavior: none`.
  - **Filas Striped (Cebra):** Alternancia de fondos entre `bg-background/80` y un tinte violeta suave `bg-[rgba(91,36,128,0.04)]` para facilitar la lectura de múltiples registros.
  - **Interacciones nativas:**
    - Efecto hover suave (`hover:bg-primary/[0.06]`).
    - Selección visual de fila activa mediante `selectedRowKey` con anillo de enfoque sutil.
    - Soporte para clic simple (`onRowClick`) y doble clic (`onRowDoubleClick`); el doble clic abre el `DetailDialog` y desde allí se inicia la edición con el formulario del módulo.
  - **Paginación integrada:** Barra inferior con conteo descriptivo de registros (`Mostrando X-Y de Z`), controles de página anterior/siguiente deshabilitables y visualización de página actual.
* **Regla de uso:** Definir columnas tipadas mediante la interfaz `DataTableColumn<T>[]`, especificando la función `render(item, index)` para badges, fechas o acciones personalizadas.

---

### 2. `FormDialog<T>` (`src/components/ui/form-dialog.tsx`)
Es el componente base mandatorio para formularios modales de creación y edición de registros.

* **Objetivo:** Eliminar la inconsistencia de layouts en formularios modales, asegurando una distribución balanceada de campos editables por secciones temáticas.
* **Características de diseño y comportamiento:**
  - **Estética Glassmorphism Premium:** Ventana modal amplia (`max-w-[980px]`, `rounded-[28px]`) con fondos radiales translúcidos, desenfoque de fondo (`backdrop-blur-xl`) y borde sutil adaptado tanto a tema claro como oscuro.
  - **Cabecera destacada:** Barra superior de acento con gradiente, badge distintivo con contenedor de icono (`size-12`, gradiente primario y sombra de elevación), título nítido y descripción de contexto.
  - **Estructura por secciones agrupadas (`FormSection<T>`):** Cada grupo de campos se aloja en tarjetas translúcidas con bullet de color temático (`primary`, `cyan`, `violet`, `emerald`, `amber`, `rose`), título en mayúsculas pequeñas con tracking espaciado y rejilla configurable (`gridCols`, por ejemplo `sm:grid-cols-2` o `sm:grid-cols-3`).
  - **Campos estandarizados (`FormField<T>`):** Soporta inputs de tipo texto, email, número, teléfono, URL, password, selects estilizados con chevron y textareas redimensionables con alturas y espaciados simétricos (`h-8`, tipografía de 13px).
  - **Footer ergonómico:**
    - Botón destructivo opcional (`onDelete`) situado a la izquierda en tonalidad `rose`, para eliminar el registro si el modal está en modo edición.
    - Botones de acción a la derecha: Cancelar con contorno neutro y botón de guardar con gradiente primario y hover reactivo.
* **Regla de uso / Patrón Wrapper:** Cada módulo debe crear un componente contenedor (wrapper) de dominio (por ejemplo, `AssetFormDialog` para activos, `TicketFormDialog` para tickets, `LicenseFormDialog` para licencias) que declare sus secciones tipadas y maneje el estado de borrador (`draft`).

---

### 3. `DetailDialog` (`src/components/ui/detail-dialog.tsx`)
Es el componente base mandatorio para consultar registros sin permitir su modificación directa.

* **Objetivo:** Mostrar la información de un registro en secciones reutilizables de etiquetas y valores, sin presentar inputs de solo lectura.
* **Características de diseño y comportamiento:**
  - Comparte la cabecera, el tratamiento visual de secciones y el layout modal de los formularios.
  - Distribuye los datos automáticamente en una rejilla responsiva; usar `colSpan` solo cuando un dato realmente necesite ocupar varias columnas.
  - Incluye las acciones **Cerrar** y **Editar**. La consulta no contiene controles de guardado ni de eliminación.
  - Permite valores personalizados como enlaces, badges o contraseñas enmascaradas con alternancia de visibilidad.
* **Regla de uso / Flujo común:** El doble clic sobre una fila de `DataTable` abre el detalle. Al elegir **Editar**, se cierra la consulta y se abre el wrapper `FormDialog` del módulo con los datos del mismo registro.

---

### 4. `ConfirmDeleteDialog` (`src/components/ui/confirm-delete-dialog.tsx`)
Es el diálogo modal obligatorio para cualquier confirmación de eliminación o acción destructiva.

* **Objetivo:** Proteger al usuario contra pérdidas accidentales de datos mediante un diálogo claro, seguro y estéticamente coordinado con el sistema de diseño.
* **Características de diseño y comportamiento:**
  - **Dimensiones y foco:** Modal compacto (`w-[min(92vw,420px)]`, `rounded-[24px]`) con borde y sombra con tonalidad de advertencia en color rose (`border-rose-200/80` y sombras difuminadas).
  - **Iconografía de advertencia:** Contenedor central con icono `AlertTriangle` en fondo suave (`bg-rose-100` / `dark:bg-rose-500/10`), texto explicativo que interpola claramente el nombre del elemento a eliminar (`itemName`) y advierte que la operación es irreversible.
  - **Botones con jerarquía estricta:** Botón Cancelar neutro y botón de confirmación con variante `destructive` (rojo intenso con sombra de elevación).
* **Regla de uso:** **Prohibido terminantemente el uso de `window.confirm()` o alerts del navegador**. Cualquier flujo de borrado en tablas (`DataTable`), formularios (`FormDialog`) o vistas de detalle debe disparar este componente.

---

## 1. Base y Configuración del Proyecto

### Infraestructura y Entorno
- [x] Revisar y normalizar la estructura de carpetas del frontend para garantizar mantenibilidad a largo plazo.
- [x] Verificar y asegurar que todas las dependencias en `package.json` estén sincronizadas y versionadas de manera determinista.
- [x] Validar la configuración del bundler Vite con React 19 y TypeScript 6 en modo estricto.
- [ ] Revisar y subsanar advertencias de ESLint y TypeScript para asegurar builds de producción limpios y sin warnings.
- [x] Verificar la configuración de Tailwind CSS v4, tokens de diseño y variables globales CSS (`globals.css`).
- [x] Auditar el uso seguro de variables de entorno (`.env`) para la conexión a la API REST y sockets.
- [x] Documentar formalmente los comandos del proyecto: instalación, entorno de desarrollo local, testing y compilación (`build`).

### Arquitectura y Patrones de Desarrollo
- [x] Definir la convención de nomenclatura y separación de responsabilidades por módulos (`features`).
- [x] Consolidar la arquitectura modular en las carpetas `src/features`, `src/components`, `src/services` y `src/store`.
- [x] Establecer la política de tipado estricto para modelos de dominio, parámetros y respuestas del backend.
- [x] Diseñar el patrón unificado de manejo de estados asíncronos (`loading`, `error`, `success`, `empty`).
- [x] Configurar el sistema centralizado de notificaciones toast (Sonner) para feedback de operaciones.
- [x] Definir que todas las tablas y listados sigan el patrón visual de la consulta de inventario: encabezado sticky con gradiente primario, alternancia de filas, bordes sutiles y paginación integrada.
- [x] Desarrollar el componente genérico reutilizable `DataTable` con paginación, selección y doble clic.
- [x] Desarrollar el componente genérico reutilizable `FormDialog` para altas y ediciones, con secciones tipadas, soporte multiformato y footer ergonómico.
- [x] Desarrollar el componente genérico reutilizable `DetailDialog` para consultas, con etiquetas/valores, secciones y acciones de cerrar/editar.
- [x] Desarrollar el componente genérico reutilizable `ConfirmDeleteDialog` para confirmaciones de borrado seguro.
- [x] Crear el componente de dominio `AssetFormDialog` como implementación de referencia para alta y edición de activos.

---

## 2. Autenticación, Sesión y Control de Acceso

- [x] Implementar la pantalla de Login con validación rigurosa de credenciales y feedback visual en tiempo real.
- [ ] Implementar el flujo de recuperación de contraseña y restablecimiento seguro.
- [x] Configurar el almacenamiento seguro del token JWT y estado de sesión en almacenamiento local o cookies seguras.
- [x] Centralizar el servicio de autenticación con control de ciclo de vida del usuario.
- [x] Implementar el mecanismo de cierre de sesión (Logout) con invalidación de estado y limpieza de caché.
- [x] Configurar Route Guards y protección de rutas según el estado de autenticación y roles de usuario.
- [ ] Crear la vista de Fallback / Acceso Denegado (403) para usuarios sin privilegios suficientes.
- [x] Implementar el manejo de expiración de token y refresco automático o redirección limpia al login.
- [x] Pulir estados de carga con spinners/skeletons y mensajes comprensibles en fallos de autenticación.

---

## 3. Layout Principal, Navegación y Shell de la Aplicación

- [x] Construir el Layout maestro de la aplicación con navegación lateral colapsable (Sidebar).
- [x] Implementar la barra superior (Header) con perfil del usuario activo, indicador de notificaciones y selector de tema.
- [x] Configurar el enrutador principal (`react-router`) para la navegación fluida entre módulos.
- [x] Configurar redirección condicional inicial hacia el Dashboard o Login según el estado de la sesión.
- [ ] Diseñar e implementar el Dashboard inicial con indicadores ejecutivos y accesos rápidos.
- [x] Implementar la pantalla 404 (Página no encontrada) integrada a la línea visual de la aplicación.
- [ ] Implementar estados vacíos ilustrados y descriptivos (Empty States) para listas y secciones sin información.
- [ ] Auditar y asegurar la adaptabilidad responsiva completa del layout en resoluciones móvil, tablet y escritorio.
- [ ] Validar la accesibilidad y navegación por teclado en la navegación global y menús desplegables.

---

## 4. Dashboard Ejecutivo y Métricas

Esta sección define la arquitectura visual, fuentes de datos y componentes del panel de control principal, siguiendo el wireframe estructurado del sistema:

### Esquema y Distribución del Layout (Wireframe)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Header: Dashboard                                [ (5) Ambos | Cancún | Playa ] │
├─────────────────────────┬─────────────────────────────┬─────────────────────────┤
│ (1) Total de Tickets    │ (4) Total de Activos        │ (6) Total de Equipos    │
│     Pendientes          │                           │     Asignados           │
├─────────────────────────┴───────────────┬─────────────┴─────────────────────────┤
│ (2) Licencias por Vencer                │ (3) Gráfica de Activos por Tipo       │
├─────────────────────────────────────────┤     (Chart.js Donut / Bar)            │
│ (7) Recordatorios                       │                                       │
└─────────────────────────────────────────┴───────────────────────────────────────┘
```

### Componentes y Métricas del Dashboard

1. **(1) KPI Total de Tickets Pendientes (Mesa de Ayuda):**
   - Tarjeta métrica que contabiliza las incidencias en estado `NUEVO`.
   - Conexión al endpoint `{{baseUrl}}/api/incidencias?page=1&limit=10&estado=NUEVO`.
   - Interacción interactiva: al hacer clic en la tarjeta se despliega el panel inferior con la lista de tickets nuevos y opción de consulta rápida con `DetailDialog`.
   - Enlace directo a `/tickets?estado=NUEVO`.

2. **(2) Widget de Licencias por Vencer (Software & Suscripciones):**
   - Panel de supervisión de software corporativo con vencimiento próximo (umbral preventivo de 30 a 60 días).
   - Indicador de estado crítico/preventivo con accesos directos al módulo `/licenses`.

3. **(3) Gráfica de Activos por Tipo (Inventario Analítico):**
   - Gráfico estadístico interactivo con `Chart.js` y `react-chartjs-2` (gráfico tipo dona o barras).
   - Clasificación por categorías de equipos: Laptops, Desktops, Monitores, Telefonía, Redes, etc.
   - Reactivo al filtro global por sucursal.

4. **(4) KPI Total de Activos:**
   - Métrica cuantitativa de todos los activos tecnológicos registrados en la base de datos de inventario.
   - Desglose rápido entre equipos operativos y en mantenimiento.

5. **(5) Filtro Segmentado por Sucursal (Header):**
   - Control tipo pill/tabs segmentado en la cabecera del Dashboard con tres opciones: `Ambos` | `Cancún` | `Playa`.
   - Almacena la selección en el estado de la vista y filtra automáticamente los totales de tickets, activos, asignaciones y gráficos.

6. **(6) KPI Total de Equipos Asignados:**
   - Métrica de activos que se encuentran actualmente en estado `EN_USO` con responsable asignado.
   - Comparativa o porcentaje relativo respecto al total de activos disponibles.

7. **(7) Widget de Recordatorios de TI:**
   - Panel de notas operativas, pendientes de mantenimiento preventivo, renovaciones y tareas programadas del área de TI.
   - Indicador de fecha, prioridad y estado completado/pendiente.

### Tareas y Estado de Implementación

- [x] Diseñar la arquitectura del wireframe y distribución del Dashboard en cuadrícula responsiva (3 KPIs superiores + layout dividido 2 columnas).
- [x] Desarrollar la tarjeta interactiva de **Total de Tickets Pendientes** (1) conectada a `GET /incidencias?estado=NUEVO` con despliegue de panel de incidencias nuevas.
- [ ] Implementar el control segmentado de **Filtro por Sucursal** (5) (`Ambos` / `Cancún` / `Playa`) en la cabecera del Dashboard.
- [ ] Desarrollar la tarjeta métrica de **Total de Activos** (4) con conteo general de inventario.
- [ ] Desarrollar la tarjeta métrica de **Total de Equipos Asignados** (6) (equipos en uso / entregados a colaboradores).
- [ ] Desarrollar el panel de **Licencias por Vencer** (2) con cálculo de fechas límite y alertas preventivas.
- [ ] Integrar el panel de **Recordatorios de TI** (7) para notas y tareas de soporte técnico.
- [ ] Integrar la **Gráfica de Activos por Tipo** (3) con `Chart.js` sincronizada con el inventario y el filtro de sucursal.
- [ ] Añadir estados de carga con skeleton screens adaptados a cada widget y manejo de errores de conexión.
- [ ] Validar adaptabilidad responsiva en pantallas de escritorio, tablet y móvil.

---

## 5. Módulo de Tickets y Mesa de Ayuda

- [x] Implementar la pantalla principal de listado de tickets utilizando obligatoriamente el componente base `DataTable`.
- [x] Incorporar filtros interactivos por estado (Nuevo, En Proceso, Resuelto, Cerrado, Cancelado), prioridad (Baja, Normal, Alta, Urgente), tipo de requerimiento y búsqueda global.
- [x] Crear la vista detallada de ticket mediante `DetailDialog` con desplegado completo de solicitante, técnico asignado, departamento y fechas.
- [ ] Diseñar el modal de creación y edición de tickets construyendo un wrapper `TicketFormDialog` basado en `FormDialog`.
- [ ] Incorporar soporte para registro de subtareas o checklist de resolución técnica interna.
- [ ] Desarrollar el flujo para agregar notas públicas e internas con soporte para carga de evidencias o archivos adjuntos.
- [ ] Añadir confirmación de eliminación o cancelación de tickets mediante el componente base `ConfirmDeleteDialog`.
- [ ] Conectar los formularios y consultas con los endpoints de la API REST del backend.
- [ ] Implementar el flujo de transición de estados y actualización de tiempos de respuesta (SLA).

---

## 6. Tablero Kanban y Flujo Operativo Ágil

- [x] Diseñar y construir la estructura del tablero visual distribuido por columnas de estado.
- [x] Implementar la interacción de Drag and Drop fluida entre columnas con `@hello-pangea/dnd`.
- [ ] Optimizar la gestión de estado local con persistencia y sincronización inmediata frente a caídas de red.
- [ ] Conectar las tarjetas del tablero con la base de datos real de tickets.
- [ ] Incorporar indicadores sutiles de carga mientras se actualiza la posición de una tarjeta en el servidor.
- [x] Implementar la sincronización en tiempo real de movimientos y modificaciones mediante WebSockets (`socket.io-client`).
- [ ] Agregar buscador rápido por título/código y filtros directos por prioridad y asignado sobre el tablero.
- [ ] Optimizar el comportamiento táctil y responsivo del Drag and Drop en dispositivos móviles y tablets.
- [ ] Implementar rollback visual con mensaje de error si una actualización de estado falla en el backend.

---

## 7. Inventario de Activos Tecnológicos

- [x] Implementar el listado centralizado de inventario de equipos utilizando el componente base `DataTable`.
- [x] Desarrollar la barra de búsqueda y filtros combinados por tipo de equipo, sucursal, estado operativo y estado físico.
- [x] Consultar el detalle del activo con `DetailDialog` al hacer doble clic y abrir `AssetFormDialog` en edición mediante la acción **Editar**.
- [x] Construir el modal de alta y edición de activos utilizando el componente `AssetFormDialog` (basado en `FormDialog`).
- [x] Integrar el diálogo de confirmación de baja de activos utilizando `ConfirmDeleteDialog`.
- [x] Gestionar la asignación de equipos a usuarios responsables, puestos y ubicaciones físicas.
- [x] Implementar badges cromáticos para estados operativos (Activo, Mantenimiento, Baja) y condiciones físicas (Excelente, Bueno, Regular, Malo).
- [ ] Conectar las operaciones CRUD del inventario con la API REST del backend de gestión de TI.
- [x] Integrar validaciones de datos requeridos y notificaciones toast de éxito o error al guardar/eliminar.
- [x] Validar la persistencia de datos y el refresco reactivo de la tabla tras cada mutación.

---

## 8. Gestión de Licencias, Software y Credenciales

- [x] Definir el modelo de datos para licencias de software: claves, vigencia, tipo (suscripción, perpetua), responsable y equipos asignados.
- [x] Implementar la vista principal de licencias utilizando obligatoriamente el componente base `DataTable`.
- [x] Crear el modal de registro y modificación de licencias construyendo un wrapper `LicenseFormDialog` basado en `FormDialog`.
- [x] Integrar el diálogo de confirmación para revocar o dar de baja licencias con `ConfirmDeleteDialog`.
- [x] Desarrollar alertas visuales preventivas para licencias próximas a expirar y vencidas.
- [x] Diseñar el panel de visualización y detalle con conteo de asientos utilizados versus disponibles y barra de uso relativo.
- [x] Diseñar la gestión segura de contraseñas y credenciales de servicios tecnológicos con ofuscación visual y permisos de visualización.
- [ ] Conectar las consultas y mutaciones de licencias con los servicios del backend.

---

## 9. Módulo de Contraseñas y Credenciales de Servicios

- [x] Definir la estructura del módulo de contraseñas dentro del shell principal y exponer la ruta `/passwords` en la navegación.
- [x] Diseñar la vista de listado con búsqueda por servicio, cuenta y categoría, junto con paginación y estado de resultados vacíos.
- [x] Implementar la tabla de credenciales con ocultación por defecto, badges de categoría y fecha de última actualización.
- [x] Consultar los datos de acceso con `DetailDialog` al hacer doble clic y abrir el formulario de edición con la acción **Editar**.
- [x] Implementar la edición temporal de credenciales en sesión actual con validación y feedback visual de guardado.
- [x] Añadir indicador visual de fortaleza de contraseña con criterios de longitud, mayúsculas, minúsculas, números y caracteres especiales.
- [x] Agregar alternancia de visibilidad de contraseña y mensajes de contexto para entorno demo sin conexión a API.
- [x] Diseñar la experiencia con datos ficticios para validar la interacción del módulo antes de conectarlo al backend.
- [ ] Conectar el módulo de contraseñas con la API real y persistencia del backend.
- [ ] Implementar almacenamiento seguro de secretos con enmascarado, control de permisos y trazabilidad de acceso.
- [ ] Añadir filtros avanzados por categoría, servicio, responsable y estado de uso.
- [ ] Incorporar acciones de copia segura al portapapeles, historial de acceso y auditoría de cambios.
- [ ] Configurar validaciones reforzadas para evitar contraseñas débiles y rotación programada.
- [ ] Establecer políticas de eliminación y revocación con confirmación explícita y registro de actividad.

---

## 10. Gestión de Proyectos y Tareas de TI

- [ ] Diseñar e implementar el listado general de proyectos activos, planificados y concluidos utilizando `DataTable`.
- [ ] Implementar filtros por fase del proyecto, departamento solicitante y líder técnico.
- [ ] Diseñar el modal de creación y edición de proyectos mediante un wrapper `ProjectFormDialog` basado en `FormDialog`.
- [ ] Integrar el diálogo de confirmación para archivar o eliminar proyectos con `ConfirmDeleteDialog`.
- [ ] Crear la vista detallada del proyecto con cronograma de hitos, porcentaje de avance y entregables asociados.
- [ ] Establecer la vinculación entre proyectos y los tickets o tareas operativas que lo componen.
- [ ] Conectar las pantallas del módulo con los servicios del backend y validar reglas de negocio.

---

## 11. Asistente Virtual y Chatbot de TI con IA

- [ ] Diseñar e implementar el botón flotante y panel desplegable del asistente de soporte técnico.
- [ ] Construir la interfaz de chat con diferenciación clara de burbujas (usuario, sistema, asistente con IA).
- [ ] Integrar soporte de entrada por texto y controles para comandos de voz / dictado.
- [ ] Implementar indicadores de escritura y estados de espera animados durante el procesamiento de la IA.
- [ ] Establecer estrategias de fallback y respuestas predeterminadas ante fallos de conexión con el motor de IA.
- [ ] Conectar el widget con el backend de IA o servicio conversacional del sistema.
- [ ] Diseñar el historial de mensajes por sesión con capacidad para reiniciar o limpiar la conversación.
- [ ] Auditar accesibilidad (foco, lector de pantalla, atajos de teclado) para el widget de chat.

---

## 12. Estado Global, Arquitectura de Datos y Servicios

- [x] Completar la store de autenticación (`useAuthStore`) con persistencia segura y datos del usuario autenticado.
- [x] Consumir notificaciones persistentes de incidencias por REST y Socket.IO, con paginación, lectura individual/masiva y sincronización al reconectar.
- [x] Integrar recordatorios de vencimiento de licencias en la misma bandeja, con deduplicación Socket.IO/REST y control de permiso `notificaciones:leer`.
- [x] Desarrollar la store global de preferencias (`useAppPreferences`) para tema, densidad de tablas y notificaciones.
- [x] Crear un cliente HTTP Axios centralizado con interceptores automáticos para inyección de token JWT y captura unificada de errores (401, 403, 500).
- [ ] Estandarizar el uso de Zustand para evitar duplicación de estado y renderizados innecesarios.
- [ ] Definir hooks personalizados de consulta (`useInventory`, `useTickets`, `useProjects`) con control de caché local y revalidación.

---

## 13. Calidad, Accesibilidad (a11y) y Experiencia de Usuario (UX)

- [x] Auditar la colección de componentes reutilizables en `src/components/ui/` para validar coherencia estética y funcional.
- [x] Consolidar la paleta de colores, curvaturas, tipografías y sombras en botones, modales y tablas.
- [x] Validar que las vistas de inventario y futuros módulos utilicen estrictamente la misma línea visual y componentes base.
- [ ] Verificar ratios de contraste WCAG 2.2 AA en textos, badges y estados sobre tema claro y tema oscuro.
- [ ] Asegurar navegación completa mediante teclado (Tab, Escape, Enter) en modales (`DetailDialog`, `FormDialog`, `ConfirmDeleteDialog`) y tablas (`DataTable`).
- [ ] Estandarizar mensajes de error de validación descriptivos e inmediatos debajo de cada campo de formulario.
- [x] Asegurar consistencia en la librería de iconos Lucide en todas las vistas del proyecto.

---

## 14. Estrategia de Testing y Control de Calidad

- [ ] Configurar el entorno de pruebas unitarias y de integración en el frontend.
- [ ] Implementar pruebas unitarias para los componentes base críticos (`DataTable`, `DetailDialog`, `FormDialog`, `ConfirmDeleteDialog`).
- [ ] Desarrollar pruebas sobre los hooks principales de estado y servicios de API.
- [ ] Validar flujos de interacción críticos de usuario: inicio de sesión, alta/edición de registros y eliminación con confirmación.
- [ ] Validar la resiliencia del tablero Kanban ante caídas o desconexiones de WebSocket.
- [ ] Realizar pruebas de regresión visual y funcional antes de cada entrega o cierre de ciclo.

---

## 15. Preparación para Despliegue y Entrega Continua

- [ ] Validar la correcta separación de variables de entorno para entornos de desarrollo, staging y producción.
- [ ] Ejecutar y optimizar el build final con `npm run build`, asegurando cero errores tipográficos y code splitting adecuado.
- [ ] Resolver cualquier advertencia de dependencias obsoletas o no utilizadas.
- [ ] Elaborar la documentación técnica de despliegue con instrucciones paso a paso para el equipo de infraestructura.
- [ ] Elaborar un checklist final de Aseguramiento de Calidad (QA) para la verificación de puesta en marcha.

---

## 16. Backlog de Mejoras Futuras

- [ ] Implementar exportación nativa de reportes a formatos PDF y hojas de cálculo Excel/CSV con filtros aplicados.
- [ ] Desarrollar búsqueda global unificada (Command Palette tipo `Ctrl + K`) para saltar a cualquier activo, ticket o proyecto.
- [ ] Permitir la personalización del dashboard principal con widgets arrastrables según el rol del usuario.
- [ ] Integrar sistema de notificaciones push para asignaciones urgentes de tickets.
- [ ] Evaluar virtualización de filas con `@tanstack/react-virtual` para tablas con volúmenes superiores a 10,000 registros.

---

## 17. Checklist de Cierre de Sprint

- [ ] Verificar las tareas marcadas como completadas (`[x]`) contra las evidencias reales en el código.
- [ ] Confirmar que cada pantalla desarrollada use estrictamente los componentes base (`DataTable`, `DetailDialog`, `FormDialog`, `ConfirmDeleteDialog`) y el flujo común de consulta/edición.
- [ ] Validar que la compilación (`npm run build`) y el linter (`npm run lint`) pasen satisfactoriamente sin advertencias críticas.
- [ ] Comprobar el recorrido completo del usuario (End-to-End básico) desde el acceso hasta la operación en módulos activos.
- [ ] Respaldar y documentar los cambios implementados para la entrega formal.
