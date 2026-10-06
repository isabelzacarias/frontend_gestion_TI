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

Todo nuevo módulo (Tickets, Licencias, Proyectos, Usuarios, etc.) debe construirse obligatoriamente sobre los siguientes tres componentes base ubicados en `src/components/ui/`:

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
    - Soporte para clic simple (`onRowClick`) y doble clic (`onRowDoubleClick`) para abrir detalles o disparar modales de edición sin botones redundantes.
  - **Paginación integrada:** Barra inferior con conteo descriptivo de registros (`Mostrando X-Y de Z`), controles de página anterior/siguiente deshabilitables y visualización de página actual.
* **Regla de uso:** Definir columnas tipadas mediante la interfaz `DataTableColumn<T>[]`, especificando la función `render(item, index)` para badges, fechas o acciones personalizadas.

---

### 2. `FormDialog<T>` (`src/components/ui/form-dialog.tsx`)
Es el componente base mandatorio para modales de creación, consulta y edición de registros.

* **Objetivo:** Eliminar la inconsistencia de layouts en formularios modales, asegurando una distribución balanceada de campos por secciones temáticas.
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

### 3. `ConfirmDeleteDialog` (`src/components/ui/confirm-delete-dialog.tsx`)
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
- [ ] Revisar y normalizar la estructura de carpetas del frontend para garantizar mantenibilidad a largo plazo.
- [ ] Verificar y asegurar que todas las dependencias en `package.json` estén sincronizadas y versionadas de manera determinista.
- [ ] Validar la configuración del bundler Vite con React 19 y TypeScript 6 en modo estricto.
- [ ] Revisar y subsanar advertencias de ESLint y TypeScript para asegurar builds de producción limpios y sin warnings.
- [ ] Verificar la configuración de Tailwind CSS v4, tokens de diseño y variables globales CSS (`globals.css`).
- [ ] Auditar el uso seguro de variables de entorno (`.env`) para la conexión a la API REST y sockets.
- [ ] Documentar formalmente los comandos del proyecto: instalación, entorno de desarrollo local, testing y compilación (`build`).

### Arquitectura y Patrones de Desarrollo
- [x] Definir la convención de nomenclatura y separación de responsabilidades por módulos (`features`).
- [x] Consolidar la arquitectura modular en las carpetas `src/features`, `src/components`, `src/services` y `src/store`.
- [x] Establecer la política de tipado estricto para modelos de dominio, parámetros y respuestas del backend.
- [x] Diseñar el patrón unificado de manejo de estados asíncronos (`loading`, `error`, `success`, `empty`).
- [x] Configurar el sistema centralizado de notificaciones toast (Sonner) para feedback de operaciones.
- [x] Definir que todas las tablas y listados sigan el patrón visual de la consulta de inventario: encabezado sticky con gradiente primario, alternancia de filas, bordes sutiles y paginación integrada.
- [x] Desarrollar el componente genérico reutilizable `DataTable` con paginación, selección y doble clic.
- [x] Desarrollar el componente genérico reutilizable `FormDialog` con secciones tipadas, soporte multiformato y footer ergonómico.
- [x] Desarrollar el componente genérico reutilizable `ConfirmDeleteDialog` para confirmaciones de borrado seguro.
- [x] Crear el componente de dominio `AssetFormDialog` como implementación de referencia para alta y edición de activos.

---

## 2. Autenticación, Sesión y Control de Acceso

- [ ] Implementar la pantalla de Login con validación rigurosa de credenciales y feedback visual en tiempo real.
- [ ] Implementar el flujo de recuperación de contraseña y restablecimiento seguro.
- [ ] Configurar el almacenamiento seguro del token JWT y estado de sesión en almacenamiento local o cookies seguras.
- [ ] Centralizar el servicio de autenticación con control de ciclo de vida del usuario.
- [ ] Implementar el mecanismo de cierre de sesión (Logout) con invalidación de estado y limpieza de caché.
- [ ] Configurar Route Guards y protección de rutas según el estado de autenticación y roles de usuario.
- [ ] Crear la vista de Fallback / Acceso Denegado (403) para usuarios sin privilegios suficientes.
- [ ] Implementar el manejo de expiración de token y refresco automático o redirección limpia al login.
- [ ] Pulir estados de carga con spinners/skeletons y mensajes comprensibles en fallos de autenticación.

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

- [ ] Definir la arquitectura de KPIs operativos y de gestión para TI (tickets abiertos, tiempo de resolución, activos asignados, licencias críticas).
- [ ] Desarrollar widgets de métricas rápidas con tarjetas de alto impacto visual y comparativas de tendencia.
- [ ] Integrar gráficos estadísticos interactivos con `Chart.js` y `react-chartjs-2` (distribución por área, criticidad de tickets, etc.).
- [ ] Implementar barra de filtros temporales (hoy, semana, mes, rango personalizado) y segmentación por sucursal.
- [ ] Implementar funcionalidad para exportar métricas o vistas resumidas en formato imprimible o descargable.
- [ ] Añadir estados de carga con skeleton screens en cada widget durante la consulta de indicadores.
- [ ] Realizar pruebas de jerarquía visual y contraste para garantizar claridad en pantallas operativas y paneles de mando.

---

## 5. Módulo de Tickets y Mesa de Ayuda

- [ ] Implementar la pantalla principal de listado de tickets utilizando obligatoriamente el componente base `DataTable`.
- [ ] Incorporar filtros interactivos por estado (Abierto, En Proceso, Resuelto, Cerrado), prioridad (Baja, Media, Alta, Urgente), categoría y técnico asignado.
- [ ] Crear la vista detallada de ticket con historial de cambios, bitácora de actividad y comentarios cronológicos.
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
- [x] Diseñar el drawer o modal de vista de detalle rápido del activo.
- [x] Construir el modal de alta y edición de activos utilizando el componente `AssetFormDialog` (basado en `FormDialog`).
- [x] Integrar el diálogo de confirmación de baja de activos utilizando `ConfirmDeleteDialog`.
- [x] Gestionar la asignación de equipos a usuarios responsables, puestos y ubicaciones físicas.
- [x] Implementar badges cromáticos para estados operativos (Activo, Mantenimiento, Baja) y condiciones físicas (Excelente, Bueno, Regular, Malo).
- [ ] Conectar las operaciones CRUD del inventario con la API REST del backend de gestión de TI.
- [x] Integrar validaciones de datos requeridos y notificaciones toast de éxito o error al guardar/eliminar.
- [x] Validar la persistencia de datos y el refresco reactivo de la tabla tras cada mutación.

---

## 8. Gestión de Licencias, Software y Credenciales

- [ ] Definir el modelo de datos para licencias de software: claves, vigencia, tipo (suscripción, perpetua), responsable y equipos asignados.
- [ ] Implementar la vista principal de licencias utilizando obligatoriamente el componente base `DataTable`.
- [ ] Crear el modal de registro y modificación de licencias construyendo un wrapper `LicenseFormDialog` basado en `FormDialog`.
- [ ] Integrar el diálogo de confirmación para revocar o dar de baja licencias con `ConfirmDeleteDialog`.
- [ ] Desarrollar alertas visuales preventivas para licencias próximas a expirar (30, 15 y 7 días).
- [ ] Diseñar el panel de visualización y detalle con conteo de asientos utilizados versus disponibles.
- [ ] Diseñar la gestión segura de contraseñas y credenciales de servicios tecnológicos con ofuscación visual y permisos de visualización.
- [ ] Conectar las consultas y mutaciones de licencias con los servicios del backend.

---

## 9. Módulo de Contraseñas y Credenciales de Servicios

- [x] Definir la estructura del módulo de contraseñas dentro del shell principal y exponer la ruta `/passwords` en la navegación.
- [x] Diseñar la vista de listado con búsqueda por servicio, cuenta y categoría, junto con paginación y estado de resultados vacíos.
- [x] Implementar la tabla de credenciales con ocultación por defecto, badges de categoría y fecha de última actualización.
- [x] Crear el modal de detalle para consultar los datos de acceso y abrir el flujo de edición.
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

- [ ] Completar la store de autenticación (`useAuthStore`) con persistencia segura y datos del usuario autenticado.
- [ ] Desarrollar la store global de preferencias (`useAppPreferences`) para tema, densidad de tablas y notificaciones.
- [ ] Crear un cliente HTTP Axios centralizado con interceptores automáticos para inyección de token JWT y captura unificada de errores (401, 403, 500).
- [ ] Estandarizar el uso de Zustand para evitar duplicación de estado y renderizados innecesarios.
- [ ] Definir hooks personalizados de consulta (`useInventory`, `useTickets`, `useProjects`) con control de caché local y revalidación.

---

## 13. Calidad, Accesibilidad (a11y) y Experiencia de Usuario (UX)

- [x] Auditar la colección de componentes reutilizables en `src/components/ui/` para validar coherencia estética y funcional.
- [x] Consolidar la paleta de colores, curvaturas, tipografías y sombras en botones, modales y tablas.
- [x] Validar que las vistas de inventario y futuros módulos utilicen estrictamente la misma línea visual y componentes base.
- [ ] Verificar ratios de contraste WCAG 2.2 AA en textos, badges y estados sobre tema claro y tema oscuro.
- [ ] Asegurar navegación completa mediante teclado (Tab, Escape, Enter) en modales (`FormDialog`, `ConfirmDeleteDialog`) y tablas (`DataTable`).
- [ ] Estandarizar mensajes de error de validación descriptivos e inmediatos debajo de cada campo de formulario.
- [ ] Asegurar consistencia en la librería de iconos Lucide en todas las vistas del proyecto.

---

## 14. Estrategia de Testing y Control de Calidad

- [ ] Configurar el entorno de pruebas unitarias y de integración en el frontend.
- [ ] Implementar pruebas unitarias para los componentes base críticos (`DataTable`, `FormDialog`, `ConfirmDeleteDialog`).
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
- [ ] Confirmar que cada pantalla desarrollada use estrictamente los componentes base (`DataTable`, `FormDialog`, `ConfirmDeleteDialog`).
- [ ] Validar que la compilación (`npm run build`) y el linter (`npm run lint`) pasen satisfactoriamente sin advertencias críticas.
- [ ] Comprobar el recorrido completo del usuario (End-to-End básico) desde el acceso hasta la operación en módulos activos.
- [ ] Respaldar y documentar los cambios implementados para la entrega formal.
