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

## Importaciones masivas (patrón reutilizable)

El frontend parsea la plantilla localmente (CSV) y envía las filas como JSON. El archivo **nunca** se sube ni se almacena en el backend. El backend procesa un máximo de **500 filas por lote**.

Esta sección define el patrón **obligatorio** para cualquier módulo que cargue registros de forma masiva (Activos, Licencias, Usuarios, etc.). Referencia de implementación completa: módulo **Inventario/Activos**.

### Flujo obligatorio en dos fases

1. `POST /api/<recurso>/importaciones/validar` — **vista previa, NO escribe nada**.
2. `POST /api/<recurso>/importaciones/confirmar` — **inserta**; revalida antes de crear.

La confirmación es **parcial**: crea las filas válidas y rechaza las demás **sin abortar** el lote. Ambos endpoints requieren `Bearer token` + permiso `<recurso>:crear`.

### Contrato del body

```json
{ "filas": [ { "fila": 2, "CB23": "200032", "Tipo": "Laptop", "...": "..." } ] }
```

Las claves de cada fila son los **encabezados de la plantilla en español**; `fila` es el número de línea del CSV (ver correlación más abajo).

### Dos niveles de error (no confundir)

| Nivel | HTTP | `success` | Dónde viene el error | Significado |
|-------|------|-----------|----------------------|-------------|
| **Petición** | 400 / 401 / 403 | `false` | `errors[]` (objetos `{campo, valor, ...}`) | No se procesó ninguna fila |
| **Fila** | 200 | `true` | `data.filas[].errores[]` (strings) | Lote procesado; unas filas válidas y otras rechazadas |

- Un error de fila **nunca** cambia el status HTTP: si el body es válido, responde `200`.
- El `401` lo maneja `src/services/api.ts` (limpia sesión y redirige a login).

### Datos guardados vs NO guardados

- **GUARDADO:** en `confirmar` la fila trae `creado: true` (+ `activoId`); en `validar`, `valido: true`.
- **NO GUARDADO:** la fila trae `creado: false` con `errores[]` (tipo vacío, estado inválido, CB23/N.º de serie duplicado en BD o dentro del lote, etc.).
- Tras confirmar: **refrescar el listado desde el backend**. Si se hace actualización optimista, agregar **solo** las filas con `creado: true` (cruzar por `fila` ↔ `filaOrigen`).
- Las **advertencias** (`advertencias[]`) **no bloquean**: la fila se guarda igual (p. ej. correo de responsable sin match ⇒ se importa con `responsableId: null`).

### Correlación fila ↔ registro

El parser conserva el número de línea del CSV (`filaOrigen`) y se envía como `fila`. Los resultados vuelven con ese `fila`, permitiendo cruzar cada resultado con su fila de origen para reportar errores.

### Descarga de NO guardados (obligatoria)

El diálogo de resultados debe ofrecer **"Descargar rechazadas"**: genera un CSV con las filas no guardadas (las que tienen `errores`) y sus mensajes, para corregir y re-subir.

- Utilidades: `downloadCsv(headers, rows, fileName)` (BOM UTF-8, delimitador `;`, escaping de `;`/comillas/saltos) y `downloadAssetImportErrors(records, filas, fileName?)` en el módulo.
- Columnas: `Fila` + columnas mínimas obligatorias + `Correo responsable` + `Errores` + `Advertencias`.
- El **estado se escribe en su valor de enum** (`EN_USO`, ...) para que el parser lo vuelva a aceptar; las columnas extra (`Errores`, `Advertencias`, `Fila`) son ignoradas al re-importar, por lo que el archivo es **re-importable tal cual** tras corregirlo.
- Nombre sugerido: `<recurso>_rechazados_<YYYYMMDD_HHmmss>.csv`.

### Componentes y utilidades a reutilizar

- `src/lib/csv.ts`: `parseCsvRowsWithLines`, `detectCsvDelimiter`, `normalizeCsvHeader`, `downloadCsv`.
- `ImportConfirmDialog` (conteo previo) e `ImportResultDialog` (resultado por fila: correcta / advertencia / rechazada + descarga).
- Servicio del módulo con `validarImportacion<X>` / `confirmarImportacion<X>` apoyado en `src/services/api.ts`.

### Reglas

- Los valores de estado/opciones deben coincidir **exactamente** con el enum del backend (ej. activos: `EN_USO | EN_ALMACEN | EN_MANTENIMIENTO | DE_BAJA`).
- `confirmar` revalida: repetir un lote produce rechazos por duplicado (idempotencia **por datos**, no por request).
- Prohibido usar `window.confirm()` o patrones ad-hoc de importación: seguir este flujo y sus componentes.

### Ejemplo de mapeo de columnas (Módulo Activos / Inventario)

`CB23` → `cb23`; `Tipo` → `tipo`; `Marca` → `marca`; `Modelo` → `modelo`; `Número de serie` → `numeroSerie`; `Sucursal` → `sucursal`; `Estado` → `estado`; `Estado general` → `estadoGeneral`; `Red` → `nombreRed`; `Correo responsable` → `responsableId` (resuelto en el backend).

Cada módulo debe documentar aquí su propio mapeo de columnas.

### Ejemplo de mapeo de columnas (Módulo Secretos / Contraseñas)

`Nombre` → `nombre`; `Tipo` → `tipo`; `Usuario` → `usuario`; `Contraseña` → `password`; `Comentario` → `comentario`. Solo `Nombre` y `Contraseña` son obligatorios; el resto opcional (vacío → `null`). El `password` **no se trimea** y **nunca se devuelve** en `validar` ni en `confirmar`. Deduplicación por `(tipo, nombre, usuario)` case-insensitive. Permiso `secretos:importar`.

---

## ⭐️ Regla de Oro: Consistencia Visual y Componentes Base Obligatorios

Para garantizar una experiencia de usuario (UX) homogénea, profesional y predecible en todo el sistema, **queda estrictamente prohibido crear tablas HTML ad-hoc, formularios modales dispersos, cuadros de diálogo de eliminación no estandarizados, ni flujos de importación masiva fuera del patrón base**.

Todo nuevo módulo (Tickets, Licencias, Proyectos, Usuarios, etc.) debe construirse obligatoriamente sobre los siguientes componentes base ubicados en `src/components/ui/`:

### 1. `DataTable<T>` (`src/components/ui/data-table.tsx`)

Es el componente mandatorio para cualquier listado o vista tabular del sistema.

- **Objetivo:** Estandarizar la visualización de datos densos con paginación integrada, accesibilidad y soporte de interacción rápida.
- **Características de diseño y comportamiento:**
  - **Encabezado Sticky:** Fondo con gradiente primario de la marca (`linear-gradient(135deg, var(--primary-600), var(--primary-500))`) con texto blanco y tracking tipográfico refinado que permanece visible durante el scroll vertical.
  - **Contenedor Glass/Card:** Bordes redondeados de gran curvatura (`rounded-[28px]`), sombra sutil (`shadow-[0_12px_35px_rgba(17,24,39,0.06)]`) y scroll horizontal/vertical controlado con `overscroll-behavior: none`.
  - **Filas Striped (Cebra):** Alternancia de fondos entre `bg-background/80` y un tinte violeta suave `bg-[rgba(91,36,128,0.04)]` para facilitar la lectura de múltiples registros.
  - **Interacciones nativas:**
    - Efecto hover suave (`hover:bg-primary/[0.06]`).
    - Selección visual de fila activa mediante `selectedRowKey` con anillo de enfoque sutil.
    - Soporte para clic simple (`onRowClick`) y doble clic (`onRowDoubleClick`); el doble clic abre el `DetailDialog` y desde allí se inicia la edición con el formulario del módulo.
  - **Paginación integrada:** Barra inferior con conteo descriptivo de registros (`Mostrando X-Y de Z`), controles de página anterior/siguiente y **primera/última** deshabilitables, visualización de página actual y **salto directo a una página específica** (campo numérico + botón `Ir`, con *clamp* entre `1` y la última página). Estos controles son **obligatorios y compartidos**: toda tabla existente o futura que use `DataTable<T>` los hereda automáticamente, por lo que **no debe implementarse paginación ad-hoc por módulo**.
- **Regla de uso:** Definir columnas tipadas mediante la interfaz `DataTableColumn<T>[]`, especificando la función `render(item, index)` para badges, fechas o acciones personalizadas.

---

### 2. `FormDialog<T>` (`src/components/ui/form-dialog.tsx`)

Es el componente base mandatorio para formularios modales de creación y edición de registros.

- **Objetivo:** Eliminar la inconsistencia de layouts en formularios modales, asegurando una distribución balanceada de campos editables por secciones temáticas.
- **Características de diseño y comportamiento:**
  - **Estética Glassmorphism Premium:** Ventana modal amplia (`max-w-[980px]`, `rounded-[28px]`) con fondos radiales translúcidos, desenfoque de fondo (`backdrop-blur-xl`) y borde sutil adaptado tanto a tema claro como oscuro.
  - **Cabecera destacada:** Barra superior de acento con gradiente, badge distintivo con contenedor de icono (`size-12`, gradiente primario y sombra de elevación), título nítido y descripción de contexto.
  - **Estructura por secciones agrupadas (`FormSection<T>`):** Cada grupo de campos se aloja en tarjetas translúcidas con bullet de color temático (`primary`, `cyan`, `violet`, `emerald`, `amber`, `rose`), título en mayúsculas pequeñas con tracking espaciado y rejilla configurable (`gridCols`, por ejemplo `sm:grid-cols-2` o `sm:grid-cols-3`).
  - **Campos estandarizados (`FormField<T>`):** Soporta inputs de tipo texto, email, número, teléfono, URL, password, **selects estilizados con chevron que pasan a ser escribibles (búsqueda al teclear) cuando la lista es larga** (≥ `SEARCHABLE_SELECT_MIN_OPTIONS` = 8 opciones, o forzado con `searchable: true`; componente `SearchableSelect`, `src/components/ui/searchable-select.tsx`) y textareas redimensionables con alturas y espaciados simétricos (`h-8`, tipografía de 13px). Las listas cortas conservan el `<select>` nativo.
  - **Footer ergonómico:**
    - Botón destructivo opcional (`onDelete`) situado a la izquierda en tonalidad `rose`, para eliminar el registro si el modal está en modo edición.
    - Botones de acción a la derecha: Cancelar con contorno neutro y botón de guardar con gradiente primario y hover reactivo.
- **Regla de uso / Patrón Wrapper:** Cada módulo debe crear un componente contenedor (wrapper) de dominio (por ejemplo, `AssetFormDialog` para activos, `TicketFormDialog` para tickets, `LicenseFormDialog` para licencias) que declare sus secciones tipadas y maneje el estado de borrador (`draft`).

---

### 3. `DetailDialog` (`src/components/ui/detail-dialog.tsx`)

Es el componente base mandatorio para consultar registros sin permitir su modificación directa.

- **Objetivo:** Mostrar la información de un registro en secciones reutilizables de etiquetas y valores, sin presentar inputs de solo lectura.
- **Características de diseño y comportamiento:**
  - Comparte la cabecera, el tratamiento visual de secciones y el layout modal de los formularios.
  - Distribuye los datos automáticamente en una rejilla responsiva; usar `colSpan` solo cuando un dato realmente necesite ocupar varias columnas.
  - Incluye las acciones **Cerrar** y **Editar**. La consulta no contiene controles de guardado ni de eliminación.
  - Permite valores personalizados como enlaces, badges o contraseñas enmascaradas con alternancia de visibilidad.
  - Permite personalizar la acción primaria del footer mediante los props opcionales `editLabel` e `editIcon` (por defecto **Editar**); se usa, por ejemplo, para relabelar la acción a **Reactivar** en registros inactivos.
- **Regla de uso / Flujo común:** El doble clic sobre una fila de `DataTable` abre el detalle. Al elegir **Editar**, se cierra la consulta y se abre el wrapper `FormDialog` del módulo con los datos del mismo registro.

---

### 4. `ConfirmDeleteDialog` (`src/components/ui/confirm-delete-dialog.tsx`)

Es el diálogo modal obligatorio para cualquier confirmación de eliminación o acción destructiva.

- **Objetivo:** Proteger al usuario contra pérdidas accidentales de datos mediante un diálogo claro, seguro y estéticamente coordinado con el sistema de diseño.
- **Características de diseño y comportamiento:**
  - **Dimensiones y foco:** Modal compacto (`w-[min(92vw,420px)]`, `rounded-[24px]`) con borde y sombra con tonalidad de advertencia en color rose (`border-rose-200/80` y sombras difuminadas).
  - **Iconografía de advertencia:** Contenedor central con icono `AlertTriangle` en fondo suave (`bg-rose-100` / `dark:bg-rose-500/10`), texto explicativo que interpola claramente el nombre del elemento a eliminar (`itemName`) y advierte que la operación es irreversible.
  - **Botones con jerarquía estricta:** Botón Cancelar neutro y botón de confirmación con variante `destructive` (rojo intenso con sombra de elevación).
- **Regla de uso:** **Prohibido terminantemente el uso de `window.confirm()` o alerts del navegador**. Cualquier flujo de borrado en tablas (`DataTable`), formularios (`FormDialog`) o vistas de detalle debe disparar este componente.

---

### 5. `ImportResultDialog` (`src/components/ui/import-result-dialog.tsx`)

Es el diálogo obligatorio para mostrar el resultado de cualquier **importación masiva** (fases `validar` y `confirmar`).

- **Objetivo:** Informar de forma clara cuántas filas se guardaron y cuáles no, con el detalle por fila y la opción de descargar las rechazadas.
- **Características de diseño y comportamiento:**
  - **Cabecera de resumen:** Conteos destacados de guardadas y rechazadas (y total), en badges semánticos (verde/rojo/neutro).
  - **Detalle por fila:** Lista con el número de `fila` y estado visual: correcta (verde), con **advertencias** (ámbar, no bloquean) o **rechazada** (rojo, con sus `errores`).
  - **Acción de descarga:** Botón "Descargar rechazadas" que exporta las filas no guardadas a CSV (con sus mensajes) para corrección y re-importación. Ver la sección "Importaciones masivas".
  - **Acción primaria opcional:** Atajo para confirmar solo las filas válidas cuando la validación previa detecta inválidas.
- **Regla de uso:** Toda importación masiva debe usar el flujo `validar` → (`ImportResultDialog` de revisión) → `confirmar` → `ImportResultDialog` de resultado. Prohibido mostrar el resultado con `alert`, `toast` únicamente o tablas ad-hoc.

---

### 6. `FacetedFilter` (`src/components/ui/faceted-filter.tsx`)

Es el componente base recomendado para el **filtrado facetado multi-selección** (estilo Jira/Linear) de listados y tableros.

- **Objetivo:** Unificar la experiencia de filtrado (dimensiones + búsqueda + selección múltiple) y eliminar los selects sueltos o los filtros ad-hoc con criterio `"ALL"` por módulo.
- **Características de diseño y comportamiento:**
  - Botón disparador "Filtro" con `Popover` (radix, `src/components/ui/popover.tsx`) y badge con el total de opciones seleccionadas en todas las dimensiones.
  - Panel de dos columnas: izquierda = dimensiones (`FacetDimension[]`) con badge de conteo por dimensión; derecha = buscador propio + lista de opciones con `Checkbox` (`FacetOption[]`).
  - Acciones **Borrar** (por sección) y **Borrar todo**; el consumidor controla el estado con `selections: Record<string, string[]>` y `onChange(dimensionId, values)`.
  - **Convención de filtrado:** arreglo vacío = sin filtro; con valores, el registro debe incluir el valor (`.includes(...)`).
- **Regla de uso:** Este es el **filtro estándar del sistema**. Debe usarse en todo listado nuevo y adoptarse progresivamente en **las tablas ya existentes** (Inventario, Licencias, Proyectos, Usuarios, Auditoría, etc.) en lugar de selects sueltos o de un `"ALL"` por criterio. Ya promovido a `src/components/ui/` tras reutilizarse en el tablero Kanban y en la lista de Tickets.

---

### 7. Estructura y etiquetas de acciones por registro (Convención obligatoria)

Define cómo deben **nombrarse los botones** de todo módulo que tenga formulario, para que registros presentes y futuros (Tickets, Proyectos, Usuarios, Mantenimiento, etc.) sean predecibles e idénticos en estructura. Referencia de implementación completa: módulo **Inventario / Activos**.

- **Botón del apartado (barra superior): `Agregar + nombre del registro` (singular).**
  - Ejemplos: `Agregar Activo`, `Agregar Licencia`, `Agregar Contraseña`, `Agregar Asignación`, `Agregar Recordatorio`.
  - Prohibido: botones genéricos (`Agregar`, `Nuevo`, `Registrar`) y botones de refresco (`Actualizar`) en la cabecera.
- **Botón del formulario en modo creación: `Crear + nombre del registro`.**
  - Ejemplos: `Crear Activo`, `Crear Licencia`, `Crear Contraseña`, `Crear Asignación`.
- **Al consultar un registro (`DetailDialog`): botón `Editar`.**
  - El doble clic en la fila abre la consulta; **Editar** abre el formulario en modo edición con los datos del registro.
- **Botón del formulario en modo edición: `Guardar Cambios`.** Siempre el mismo texto, en todos los módulos.
- **Botón de eliminar del formulario: `Eliminar`** (solo la palabra, sin el nombre del registro). Ubicado a la izquierda en tonalidad destructiva.
  - **Eliminar vs. Desactivar (Licencias y Contraseñas):**
    - La **baja lógica** según el módulo:
      - **Licencias:** el botón **`Eliminar`** dispara `ConfirmDeleteDialog` y aplica la baja lógica; el estado también puede cambiarse con el campo **Estado de la Licencia** (`Activa`/`Inactiva`) del formulario.
      - **Contraseñas:** con el botón **`Desactivar`** (dispara `ConfirmDeleteDialog`); su `Eliminar` se muestra **deshabilitado y sin acción**.
    - La **eliminación definitiva** (`Eliminar`) queda **pendiente de endpoint** (`DELETE` real) en ambos módulos.
    - En el `DetailDialog` el registro inactivo muestra `Reactivar`/`Activar`.
    - *Dependencia backend:* hoy Licencias y Contraseñas usan un endpoint de baja lógica; para habilitar `Eliminar` se requiere un `DELETE` de **eliminación real** además del cambio de estado.

**Regla de uso:** Todo módulo nuevo con formulario debe nacer con esta estructura. Estado actual: Inventario, Licencias, Contraseñas, Asignaciones y Recordatorios ya usan `Agregar X` / `Crear X` / `Guardar Cambios`. **Pendiente:** habilitar `Eliminar` (borrado real) cuando exista el endpoint.

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

- [x] Implementar la pantalla principal de listado de tickets utilizando obligatoriamente el componente base `DataTable`, **conectada a `GET /api/incidencias`** (paginación server-side y filtros `estado`/`prioridad` + búsqueda `q`).
- [x] Incorporar filtros interactivos por estado (`NUEVO`, `EN_ANALISIS`, `EN_CURSO`, `COMPLETADO`, `DUPLICADO`), prioridad (`BAJA`, `NORMAL`, `ALTA`, `CRITICA`), tipo de requerimiento y búsqueda por título/solicitante. **Los valores coinciden con los enums del backend.**
- [x] Migrar la vista de lista al filtro facetado estándar (`FacetedFilter`) con dimensiones de Estado, Prioridad y Tipo de requerimiento (multi-selección, arreglo vacío = sin filtro) y búsqueda por título/#id/solicitante. El listado pasó a **filtrado y paginación en cliente** sobre `listarTodosLosTickets` (consistente con el tablero); se conserva `DataTable` con paginación controlada y el `DetailDialog`.
- [x] Crear la vista detallada de ticket mediante `DetailDialog`, cargando el detalle desde `GET /api/incidencias/:id` (descripción, evidencia, seguimiento/actualizaciones).
- [x] Unificar las vistas de Tickets y Kanban en un mismo apartado (`/tickets`) con conmutador de formato (`Tabs` **Lista | Kanban**) sincronizado en la URL (`?vista=kanban`). La lista se extrajo a `TicketsListView` (`features/tickets/components`) y el tablero sigue en `KanbanPage`; la ruta `/kanban` redirige a `/tickets?vista=kanban` y se retiró el ítem de navegación independiente del sidebar.
- [x] Extraer la consulta de detalle a un componente compartido `TicketDetailDialog` (`features/tickets/components`, envuelve `DetailDialog` + `obtenerTicket`) y habilitar la apertura del detalle con **doble clic sobre la tarjeta del Kanban** (además del doble clic en la fila de la lista), con pista visible **"Doble clic"** en la tarjeta; el arrastre de la tarjeta sigue funcionando.
- [ ] Diseñar el modal de creación y edición de tickets construyendo un wrapper `TicketFormDialog` basado en `FormDialog`.
- [ ] Incorporar soporte para registro de subtareas o checklist de resolución técnica interna.
- [ ] Desarrollar el flujo para agregar notas públicas e internas con soporte para carga de evidencias o archivos adjuntos.
- [ ] Añadir confirmación de eliminación o cancelación de tickets mediante el componente base `ConfirmDeleteDialog`.
- [ ] Reactivar la edición de estado inline (dropdown en la tabla) cuando exista `PATCH /api/incidencias/:id/estado`.
- [ ] Implementar el flujo de transición de estados y actualización de tiempos de respuesta (SLA).

### Endpoints / cambios pendientes en el backend (Incidencias)

Referencia: **2026-10-12**. Archivos: `backend_gestion_TI/src/{routes,controllers,services,models}/incidencia.*`.
Nota (2026-10-12): tanto la lista de Tickets como el Kanban ahora **filtran en cliente** (multi-selección con `FacetedFilter`) sobre `listarTodosLosTickets`, por lo que `q`/`tipoRequerimiento` del backend **dejaron de ser bloqueantes**. Se conserva como mejora opcional para una futura paginación server-side con filtros.

**A. Opcional/futuro — filtros de listado (`q`, `tipoRequerimiento`):**
- [ ] `GET /api/incidencias`: agregar query params opcionales **`q`** (texto: buscar en `titulo` y nombre del solicitante) y **`tipoRequerimiento`** (valor de `TIPOS_REQUERIMIENTO_VALIDOS`).
  - `models/incidencia.model.ts`: añadir `q?: string` y `tipoRequerimiento?: TipoRequerimiento` a `ParametrosListadoIncidencias`.
  - `controllers/incidencia.controller.ts`: parsear `req.query.q` y validar `req.query.tipoRequerimiento` con `validarOpcion(...)`.
  - `services/incidencia.service.ts` (`listar`): agregar `tipoRequerimiento` a `filtros` y `q` como `OR: [{ titulo: { contains: q } }, { solicitante: { nombre: { contains: q } } }]`.
  - Documentar en `src/docs/openapi.yaml` y `bruno/Incidencias/listarFiltrado.bru`.

**B. Requerido para la edición de estado — `PATCH /api/incidencias/:id/estado`:**
- [ ] Nuevo permiso **`incidencias:editar`** en `models/rol.model.ts` (`PERMISOS_DISPONIBLES`) y en `scripts/seedAdmin.ts`.
- [ ] Ruta `PATCH /:id/estado` con `verificarPermiso('incidencias:editar')`.
- [ ] Controller/servicio: validar `estado` contra `ESTADOS_VALIDOS`; actualizar `estado` y `fechaResolucion` (p. ej. al pasar a `COMPLETADO`); definir transiciones permitidas.

**C. Futuro — alta completa y seguimiento:**
- [ ] `POST /api/incidencias`: aceptar `prioridad` (y opcional `asignadoAId`) para asignar prioridad/responsable desde el formulario.
- [ ] Endpoint para registrar `ActualizacionIncidencia` (notas/seguimiento) y evidencias.

---

## 6. Tablero Kanban y Flujo Operativo Ágil

- [x] Diseñar y construir la estructura del tablero visual distribuido por columnas de estado.
- [x] Conectar las tarjetas del tablero con la base de datos real de tickets (solo lectura): las columnas se agrupan por `estado` desde `GET /api/incidencias` (paginado, vía `listarTodosLosTickets`); cada tarjeta muestra `#id`, título, tipo de requerimiento, prioridad y responsable (iniciales de `asignadoA` o "Sin asignar"). Se muestran las 4 prioridades del backend (Baja, Normal, Alta, Crítica). Estados de carga, error y vacío incluidos.
- [x] Implementar el Drag and Drop para cambiar el estado y reordenar dentro de la columna con `@hello-pangea/dnd`, persistiendo con `PATCH /api/incidencias/:id/estado` (permiso `incidencias:editar`), que ahora acepta `estado` y `orden` (posición 0-based en la columna destino). El backend tiene el campo `Incidencia.orden` por columna (migración `add_orden_incidencia`) y reindexa origen/destino en una transacción.
- [ ] Optimizar la gestión de estado local con persistencia y sincronización inmediata frente a caídas de red.
- [x] Incorporar indicadores sutiles de carga mientras se actualiza la posición de una tarjeta en el servidor (opacidad + `aria-busy` + arrastre deshabilitado por tarjeta mientras hay una mutación en curso).
- [x] Implementar la sincronización en tiempo real de movimientos y modificaciones mediante WebSockets (`socket.io-client`), escuchando `incidencias:estado-cambiado` desde la conexión única de notificaciones.
- [x] Agregar buscador rápido por título/#id/solicitante y filtro facetado multi-selección (`FacetedFilter`, `src/components/ui/faceted-filter.tsx`, con `Popover` + lista buscable propia y `Checkbox`) sobre el tablero, con dimensiones de Persona asignada (incluye "Sin asignar"), Prioridad y Tipo de requerimiento, badges por dimensión, "Borrar" por sección y "Borrar todo"; botón/indicador "Borrar filtros" a nivel de página. Estado en arrays (vacío = sin filtro), filtrado en cliente sobre los tickets ya cargados; reorden exacto aun con filtros activos.
- [ ] Optimizar el comportamiento táctil y responsivo del Drag and Drop en dispositivos móviles y tablets.
- [x] Homogeneizar la cabecera del tablero con la de la Lista usando `ModuleHeader` (eyebrow "Mesa de Ayuda TI", título "Tablero Kanban", filtros + resumen con badge violeta y acción "Actualizar"); se retiró el `PagePlaceholder` y su descripción.
- [x] Implementar rollback visual con mensaje de error si una actualización de estado falla en el backend (update optimista + reversión + `toast.error`).

---

## 7. Inventario de Activos Tecnológicos

- [x] Implementar el listado centralizado de inventario de equipos utilizando el componente base `DataTable`.
- [x] Desarrollar la barra de búsqueda y filtros combinados por tipo de equipo, sucursal, estado operativo y estado físico.
- [x] Migrar los filtros de inventario al filtro facetado estándar `FacetedFilter` (dimensiones **Estado** y **Sucursal**, multi-selección) con búsqueda integrada y botón **Borrar filtros**. El listado pasó a **filtrado y paginación en cliente** sobre `listarTodosLosActivos` (consistente con Tickets y Kanban); la exportación CSV ahora opera sobre los registros ya filtrados en cliente.
- [x] Consultar el detalle del activo con `DetailDialog` al hacer doble clic y abrir `AssetFormDialog` en edición mediante la acción **Editar**.
- [x] Construir el modal de alta y edición de activos utilizando el componente `AssetFormDialog` (basado en `FormDialog`).
- [x] Integrar el diálogo de confirmación de baja de activos utilizando `ConfirmDeleteDialog`.
- [x] Gestionar la asignación de equipos a usuarios responsables, puestos y ubicaciones físicas.
- [x] Implementar badges cromáticos para estados operativos (Activo, Mantenimiento, Baja) y condiciones físicas (Excelente, Bueno, Regular, Malo).
- [ ] Conectar las operaciones CRUD del inventario con la API REST del backend de gestión de TI.
- [x] Integrar validaciones de datos requeridos y notificaciones toast de éxito o error al guardar/eliminar.
- [x] Importacion masiva: el frontend lee y parsea localmente la plantilla `plantilla_registro_activos.csv` y envía las filas como JSON; el archivo no se sube ni se almacena en el backend. El parser del frontend soporta BOM UTF-8, delimitador `;`, encabezados acentuados, campos entre comillas, límite de 500 registros y conserva la fila de origen para reportar resultados.
- [x] Validar la persistencia de datos y el refresco reactivo de la tabla tras cada mutación.
- [x] Integrar registro masivo de activos por plantilla CSV/Excel con descarga de plantilla y confirmación de lote (`AssetFormDialog` + `asset-import.ts`).
- [x] Exportación CSV del inventario filtrado (todos los registros que cumplen búsqueda y filtros, no solo la página), con valores de estado legibles (`asset-export.ts` + `listarTodosLosActivos`).


---

## 8. Gestión de Licencias, Software y Credenciales

- [x] Definir el modelo de datos para licencias de software: claves, vigencia, tipo (suscripción, perpetua), responsable y equipos asignados.
- [x] Implementar la vista principal de licencias utilizando obligatoriamente el componente base `DataTable`.
- [x] Migrar los filtros de licencias al filtro facetado estándar `FacetedFilter` (dimensiones **Estado** [Activas/Inactivas] y **Clave** [Con/Sin clave], multi-selección) con búsqueda integrada y botón **Borrar filtros**.
- [x] Crear el modal de registro y modificación de licencias construyendo un wrapper `LicenseFormDialog` basado en `FormDialog`.
- [x] Integrar el diálogo de confirmación para revocar o dar de baja licencias con `ConfirmDeleteDialog`.
- [x] Desarrollar alertas visuales preventivas para licencias próximas a expirar y vencidas.
- [x] Diseñar el panel de visualización y detalle con conteo de asientos utilizados versus disponibles y barra de uso relativo.
- [x] Diseñar la gestión segura de contraseñas y credenciales de servicios tecnológicos con ofuscación visual y permisos de visualización.
- [x] Incorporar registro masivo de licencias por plantilla CSV/Excel con descarga de plantilla y confirmación de lote (`LicenseFormDialog` + `license-import.ts`).
- [x] Conectar las consultas y mutaciones de licencias con los servicios del backend.
- [x] Consumir la vista como cliente del backend: `listarTodasLasLicencias` (iteración de páginas) con filtrado/paginación en cliente sobre `FacetedFilter`, y CRUD con `crearLicencia`/`actualizarLicencia`/`desactivarLicencia` + refetch.
- [x] Mostrar la clave de forma enmascarada, ya que la API **nunca** devuelve la clave (solo `tieneClave`); se retiraron las acciones de revelar/copiar.
- [x] Resolver el usuario asignado con la lista real de usuarios (`usuario.service.ts`), sustituyendo los IDs mock (`ADMIN`/`TECH-01`/`TECH-02`) en el `LicenseFormDialog`.
- [x] Implementar la baja lógica (`DELETE` → `activa=false`) con `ConfirmDeleteDialog` y la **reactivación** de licencias inactivas (`PATCH { activa: true }`); las inactivas quedan en solo lectura.
- [x] Conectar la importación masiva CSV mediante POST secuenciales (`license-import.ts` + loop de `crearLicencia`), con resumen de éxitos y errores.

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
- [x] Integrar registro masivo de credenciales por plantilla CSV/Excel con descarga de plantilla y confirmación de lote (`CredentialDialog` + `credential-import.ts`).
- [x] Conectar el módulo de contraseñas con la API real y persistencia del backend.
- [x] Consumir la vista como cliente del backend: `listarTodosLosSecretos` (iteración de páginas) con filtrado/paginación en cliente sobre `FacetedFilter` (dimensiones **Tipo** y **Estado** [Activas/Inactivas]), y CRUD con `crearSecreto`/`actualizarSecreto`/`desactivarSecreto` + refetch.
- [x] Alinear el formulario a los campos reales de `Secreto` (**Nombre**, **Tipo**, **Usuario**, **Contraseña**, **Comentario**); se retiraron Cuenta y Sitio web y el mock `sample-credentials.ts`.
- [x] Implementar el **revelado seguro** del password (`GET /secretos/:id/password`, permiso `secretos:revelar`, auditado); password write-only con opción de conservar el actual al editar.
- [x] Implementar la baja lógica (`DELETE` → `activo=false`) con `ConfirmDeleteDialog` y la **reactivación** (`PATCH { activo: true }`); las inactivas quedan en solo lectura y sin revelado.
- [x] Conectar la importación masiva CSV con el flujo en dos fases del backend (`validar` → revisión → `confirmar` en `POST /secretos/importaciones/*`, permiso `secretos:importar`) y la exportación CSV **sin contraseñas** (solo campos no sensibles).
- [ ] Implementar almacenamiento seguro de secretos con enmascarado, control de permisos y trazabilidad de acceso.
- [ ] Añadir filtros avanzados por categoría, servicio, responsable y estado de uso.
- [ ] Incorporar acciones de copia segura al portapapeles, historial de acceso y auditoría de cambios (existe `GET /secretos/:id/auditoria`).
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
- [x] Crear el servicio compartido `usuario.service.ts` (`listarUsuarios`/`listarTodosLosUsuarios`, tipo `UsuarioLista`) para poblar selectores de usuario en los módulos (licencias: campo "Asignado A"). El tipo `UsuarioLista` se amplió para incluir catálogos (`departamento`/`ubicacion`/`puesto`/`tipoUsuario`), `rol` y fechas (`fechaInicio`/`fechaFin`), reutilizándose en el listado de Usuarios.
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
## 16. Registro Masivo de Datos mediante Plantillas CSV/Excel

Estandariza la carga masiva de registros en los módulos del sistema. La plantilla se genera y descarga en formato CSV codificado en UTF-8 con BOM y separador `;`, de modo que Excel la abra correctamente en español.

### Componentes y utilidades base

- `ImportConfirmDialog` (`src/components/ui/import-confirm-dialog.tsx`): diálogo obligatorio de confirmación que muestra el conteo de registros detectados y el mensaje correspondiente cuando el archivo llega vacío.
- `src/lib/csv.ts`: utilidades compartidas `normalizeCsvHeader`, `parseCsvRows`, `detectCsvDelimiter` y `downloadCsvTemplate`.
- **Convención por módulo:** una utilidad `{modulo}-import.ts` en `features/{modulo}/utils/` que define los encabezados de la plantilla, valida cada fila (con mensajes del tipo `Fila N: ...`) y expone `downloadXxxCsvTemplate()` y `parseXxxCsv(content)`.
- **Patrón UI:** en el formulario de creación (`FormDialog`), el bloque superior (`formActions`) incluye los botones **Descargar plantilla de registro** e **Importar**; al elegir un `.csv` se previsualiza el lote y se confirma con `ImportConfirmDialog` antes de registrarlo.

### Tareas y estado

- [x] Definir utilidades CSV compartidas (`src/lib/csv.ts`) y el componente `ImportConfirmDialog`.
- [x] Implementar registro masivo en Inventario (`AssetFormDialog` + `asset-import.ts`).
- [x] Implementar registro masivo en Contraseñas (`CredentialDialog` + `credential-import.ts`).
- [x] Implementar registro masivo en Licencias (`LicenseFormDialog` + `license-import.ts`).
- [x] Implementar registro masivo en Asignaciones (`AssignmentFormDialog` + `assignment-import.ts`).
- [ ] Extender el registro masivo a Tickets y Proyectos cuando se construyan sus formularios.
- [ ] Añadir detección de duplicados y resumen de errores por fila antes de confirmar el lote.
- [ ] Evaluar soporte nativo de archivos `.xlsx` (además del CSV compatible con Excel).

---

## Patrón: Exportación de Listados Filtrados (CSV)

Permite descargar en CSV **todos los registros que cumplen los filtros actuales** de un listado (`DataTable`), no solo la página visible. Es el complemento de la sección 16 (Registro Masivo) y es **obligatorio** para los nuevos módulos con listado.

### Reglas

- **Alcance:** respeta siempre los filtros aplicados (búsqueda + selects). Sin filtros, exporta todo el recurso.
- **100% frontend:** se pagina el endpoint de listado en el cliente y se arma el CSV en el navegador; **no requiere endpoint de exportación** salvo volúmenes muy grandes (ahí sí convendría `GET /<recurso>/export`).
- **Formato:** CSV UTF-8 con BOM y separador `;` (abre directo en Excel y es compatible con el flujo de importación).

### Utilidades y patrón por módulo

- `src/lib/csv.ts`: `downloadCsv(headers, rows, fileName)` (con escaping de `;`, comillas y saltos de línea).
- **Convención por módulo:** una utilidad `{modulo}-export.ts` en `features/{modulo}/utils/` que expone los encabezados (`XXX_EXPORT_HEADERS`), el mapeo `xxxToExportRows(items)` y `exportXxxToCsv(items, fileName?)` (nombre por defecto `{recurso}_<YYYYMMDD_HHmmss>.csv`).
- **Servicio:** un helper `listarTodosLosXxx(filtros)` que pagina el endpoint de listado con `limit` máximo permitido (`100`) hasta cubrir `meta.totalPages`, con tope de seguridad de páginas.

### Contenido y presentación

- **Columnas:** las mismas de la tabla más los campos extra del `DetailDialog` (en Inventario se añaden `Clave` y `Correo responsable`).
- **Valores:** los enums se exportan como **etiquetas legibles** (ej. `EN_USO` -> "En uso"); los `null`/vacíos como cadena vacía.
- **Botón `Exportar`** en el `ModuleHeader`: deshabilitado mientras carga o durante la exportación (texto "Exportando..."), con `toast` de éxito (con conteo) e `info` cuando no hay registros.

### Tareas y estado

- [x] Implementar exportación CSV en Inventario (`asset-export.ts` + `listarTodosLosActivos`), respetando filtros y con estados legibles.
- [ ] Extender la exportación CSV a Tickets, Licencias, Contraseñas y Asignaciones.
- [ ] Evaluar exportación nativa a `.xlsx` y PDF (ver sección 18).

---

## 17. Módulo de Asignaciones de Equipo

Módulo responsable de registrar la entrega y devolución de activos tecnológicos a colaboradores.

- [x] Definir el modelo de datos de asignaciones y los catálogos de activos/usuarios.
- [x] Implementar el listado con `DataTable`, búsqueda por ID, equipo o usuario y filtro Activas/Devueltas.
- [x] Consultar el detalle con `DetailDialog` y editar con `AssignmentFormDialog`.
- [x] Implementar el alta de asignaciones con selección de activo y usuario.
- [x] Implementar la devolución (cambio de estado Activa → Devuelta) con confirmación.
- [x] Integrar eliminación con `ConfirmDeleteDialog`.
- [x] Añadir registro masivo por plantilla CSV/Excel.
- [ ] Conectar el módulo con la API REST (`GET /api/asignaciones`, devoluciones y asignación por activo).
- [ ] Sincronizar el estado del activo (En uso / En almacén) con Inventario al asignar o devolver.
- [ ] Registrar trazabilidad de entrega/devolución con evidencias y firmas.

---

## 18. Módulo de Reportes e Indicadores Analíticos

- [ ] Diseñar la pantalla de reportes con filtros por rango de fechas, sucursal, tipo de activo y estado.
- [ ] Implementar exportación a PDF y CSV/Excel respetando los filtros aplicados.
- [ ] Desarrollar reportes de inventario, asignaciones, licencias por vencer y tickets por periodo.
- [ ] Incorporar gráficas comparativas (histórico mensual) reutilizando la integración de Chart.js.
- [ ] Definir plantillas de reporte programables y envío automático por correo.
- [ ] Conectar los reportes con los endpoints del backend.

---

## 19. Módulo de Auditoría y Trazabilidad

- [x] Diseñar la bitácora de eventos (quién, qué, cuándo) con `DataTable`, conectada a `GET /api/auditoria`; carga completa paginada (loop `limit=100`) y filtrado/paginación en cliente, igual que el resto de tablas.
- [x] Implementar los filtros estándar con `FacetedFilter` (dimensiones Módulo, Acción y Usuario) más un filtro personalizado "Fecha" dentro del mismo popover (Desde/Hasta con `input type="date"`, `YYYY-MM-DD`) y búsqueda libre con debounce de 300 ms.
- [ ] Registrar automáticamente altas, ediciones, eliminaciones e importaciones masivas (**instrumentación del backend parcial**: cubiertos SECRETOS, ACTIVOS, ASIGNACIONES, MANTENIMIENTO, importaciones y algunos cambios de USUARIOS/LICENCIAS; ROLES, CATALOGOS e INCIDENCIAS aún no).
- [x] Consultar el detalle de cada evento con `DetailDialog`; el detalle se renderiza de forma genérica (`campos` como chips, `resumen` como pares clave/valor y metadatos/JSON para claves desconocidas). **No hay valores anteriores/nuevos ni diff.**
- [ ] Definir políticas de retención y exportación de la bitácora.
- [x] Conectar la auditoría con el backend y validar permisos de solo lectura (`auditoria:leer`; 403 manejado en la UI). Sin acciones de escritura ni Socket.IO.

### Integración implementada (2026-10-20)

- Servicio: `src/features/audit/services/auditoria.service.ts` (`AuditoriaApiError`, `listarAuditoriaGlobal`, `obtenerAuditoria`).
- Página: `src/features/audit/pages/AuditPage.tsx` con carga completa (`listarTodosLosEventosAuditoria`), filtrado/paginación en cliente (`ITEMS_PER_PAGE=20`), `FacetedFilter` (Módulo/Acción/Usuario), búsqueda, rango de fechas y botón "Actualizar" (refetch manual); tabla (fecha, módulo, acción, usuario, entidad, resumen de detalle) y `DetailDialog` sin `onEdit`.
- Detalle genérico: `src/features/audit/utils/audit-detail.tsx` + `audit-detail-format.ts` (tolera `detalle` nulo, `campos`, `resumen` y claves desconocidas; nunca muestra valores sensibles).
- El mock `src/features/audit/data/auditData.ts` se eliminó.

---

## 20. Módulo de Recordatorios de TI

- [x] Diseñar la vista de recordatorios personales con prioridad, fecha y estado (`Pendiente`, `Completado`, `Vencido`).
- [x] Implementar el CRUD completo con `DataTable`, `ReminderFormDialog` y `ConfirmDeleteDialog`, incluyendo completar/reabrir (`PATCH /:id/completar`) y eliminar (204).
- [x] Integrar los 5 próximos recordatorios en el widget del Dashboard con enlace a la pantalla completa. **No** se integra en la bandeja de notificaciones (no existe soporte).
- [ ] Añadir recordatorios automáticos (mantenimiento preventivo y renovación de licencias).
- [x] Conectar el módulo con la API REST (`/api/recordatorios`). Sin Socket.IO (el backend aún no emite eventos de recordatorios).

### Integración implementada (2026-10-20)

- Tipos: `src/features/reminder/types/reminder.ts` (`Recordatorio`, `RecordatorioDashboard`, `PrioridadRecordatorio`, drafts y parámetros).
- Servicio: `src/features/reminder/services/recordatorio.service.ts` (`RecordatorioApiError`, `listarTodosLosRecordatorios`, `crearRecordatorio`, `actualizarRecordatorio`, `completarRecordatorio`, `eliminarRecordatorio`).
- Página: `src/features/reminder/pages/ReminderPage.tsx` con carga completa y filtrado/paginación en cliente, patrón estándar de tablas (`FacetedFilter` con Estado/Prioridad, búsqueda con debounce, botón "Borrar filtros") y filtro personalizado "Fecha" dentro del mismo popover (Desde/Hasta + "Solo sin fecha").
- Acciones: crear, editar, completar/reabrir y eliminar con confirmación. Al marcar una fecha se desactiva "Solo sin fecha" y viceversa.
- Dashboard: `RecordatoriosCard` ahora es de solo lectura; muestra hasta 5 pendientes con fecha y enlace a `/reminder`.
- Permisos: el perfil del usuario no expone permisos efectivos, así que la UI no puede ocultar acciones por permiso individual. Si el listado devuelve 403 se muestra un estado de acceso denegado y se oculta "Nuevo"; las mutaciones manejan 403 con toast. Las reglas de propiedad las aplica el backend (404 para recordatorios de otros usuarios).

---

## 21. Módulo de Mantenimiento Preventivo y Correctivo

- [x] Definir el modelo de órdenes de mantenimiento en `src/features/maintenance/types/maintenance.ts` (`MaintenanceOrder`, `MaintenanceFormDraft`).
- [x] Implementar el listado y los filtros con `DataTable` + `FacetedFilter` (búsqueda por folio/activo/técnico/descripción; filtrado y paginación en cliente vía `listarTodosLosMantenimientos`).
- [x] Construir el `MaintenanceFormDialog` para el alta y edición de órdenes, conectado a `POST/PATCH /api/mantenimiento` (sin campo evidencias ni selector de estado: el backend asigna `PROGRAMADO` al crear).
- [ ] Consultar el historial por activo con `DetailDialog` (el servicio `listarMantenimientosPorActivo` ya está disponible; la UI queda pendiente).
- [x] Vincular las órdenes con el estado del activo: iniciar → `EN_MANTENIMIENTO`; completar/cancelar → restaura el estado previo (lógica del backend). El frontend refresca órdenes y activos tras cada cambio.
- [x] Añadir confirmación de cancelación y eliminación con `ConfirmDeleteDialog`; el botón Eliminar se deshabilita en `EN_PROCESO`.
- [x] Conectar el módulo con la API REST, con manejo de `400/403/404/409` y refresco por Socket.IO.

### Integración implementada (2026-10-20)

- Servicio: `src/features/maintenance/services/mantenimiento.service.ts` (`MantenimientoApiError`, `listarTodosLosMantenimientos`, `obtenerMantenimiento`, `crearMantenimiento`, `actualizarMantenimiento`, `cambiarEstadoMantenimiento`, `eliminarMantenimiento`, `listarMantenimientosPorActivo`).
- Página: carga real de órdenes, activos y técnicos activos; acciones Iniciar/Completar/Cancelar en la fila y en el diálogo de edición; activo bloqueado en `EN_PROCESO`; edición de campos bloqueada en `COMPLETADO`/`CANCELADO` (solo cancelar/eliminar).
- Socket: los eventos `mantenimiento:creado`, `mantenimiento:actualizado` y `mantenimiento:eliminado` se manejan en la conexión global de notificaciones (`notification-socket.ts`) y se publican en `store/mantenimientoSyncStore.ts`; la página recarga ante cada evento y al reconectar.
- Backend: ya cumple el contrato (endpoints, permisos, transiciones, auditoría con `origen=MANTENIMIENTO`, sincronización del estado del activo y eventos Socket.IO).
- Pendiente fase 2: evidencias (campo reservado, sin S3) e historial por activo en la UI.

---

## 22. Módulo de Usuarios y Control de Acceso

- [x] Implementar el listado de usuarios con `DataTable` y paginación integrada, conectado a `GET /api/usuarios` (filtrado/paginación en cliente vía `listarTodosLosUsuarios`).
- [x] Adoptar el filtro facetado estándar (`FacetedFilter`) con dimensiones Estado, Tipo de usuario, Departamento, Ubicación, Puesto y Rol, más búsqueda por ID/nombre/correo/área/puesto.
- [x] Consultar el detalle del usuario con `DetailDialog` (doble clic).
- [x] Exportar a CSV respetando los filtros aplicados (`user-export.ts`).
- [x] Ampliar el tipo compartido `UsuarioLista` (catálogos, rol y fechas) en `src/services/usuario.service.ts`.
- [x] Implementar el CRUD (alta/edición/baja lógica) con `UserFormDialog` + `ConfirmDeleteDialog`, usando `GET /api/catalogos` para los selects.
- [x] Asignación de rol (`PATCH /api/usuarios/:id/rol`, permiso `roles:administrar`) integrada en el `UserFormDialog`.
- [x] Cambio de contraseña (`PATCH /api/usuarios/:id/password`) desde el `UserFormDialog` en modo edición (campo opcional) y contraseña obligatoria al crear.
- [x] Correo electrónico obligatorio al **registrar** un usuario: es el identificador de acceso (`POST /api/auth/login` valida `email` + contraseña). En edición permanece opcional. Campos obligatorios del alta: `id`, `nombre`, `email` y `password`.
- [x] Gestionar las excepciones de permisos del usuario (`permisosExtra` / `permisosRevocados`) desde el `UserFormDialog` con `MultiSelect` + catálogo `PERMISO_OPTIONS` (`src/features/user/data/permissions.ts`), persistidas con `PATCH /api/usuarios/:id/permisos` (permiso `roles:administrar`). El alta las aplica tras crear al usuario; la edición envía solo el diferencial (`agregar`/`quitar`).
- [ ] Registro masivo por plantilla CSV/Excel.

---

## 23. Backlog de Mejoras Futuras

- [ ] Implementar exportación nativa de reportes a formatos PDF y hojas de cálculo Excel/CSV con filtros aplicados.
- [ ] Desarrollar búsqueda global unificada (Command Palette tipo `Ctrl + K`) para saltar a cualquier activo, ticket o proyecto.
- [ ] Permitir la personalización del dashboard principal con widgets arrastrables según el rol del usuario.
- [ ] Integrar sistema de notificaciones push para asignaciones urgentes de tickets.
- [ ] Evaluar virtualización de filas con `@tanstack/react-virtual` para tablas con volúmenes superiores a 10,000 registros.
- [ ] **Recordatorio:** Adoptar el filtro facetado estándar (`FacetedFilter`, `src/components/ui/faceted-filter.tsx`) en las tablas ya existentes (Proyectos, Auditoría, etc.) en sustitución de los selects sueltos por criterio. *(Ya adoptado en Tickets, Kanban, Inventario, Licencias, Contraseñas y Usuarios.)*

---

## 24. Checklist de Cierre de Sprint

- [ ] Verificar las tareas marcadas como completadas (`[x]`) contra las evidencias reales en el código.
- [ ] Confirmar que cada pantalla desarrollada use estrictamente los componentes base (`DataTable`, `DetailDialog`, `FormDialog`, `ConfirmDeleteDialog`, `FacetedFilter`) y el flujo común de consulta/edición.
- [ ] Validar que la compilación (`npm run build`) y el linter (`npm run lint`) pasen satisfactoriamente sin advertencias críticas.
- [ ] Comprobar el recorrido completo del usuario (End-to-End básico) desde el acceso hasta la operación en módulos activos.
- [ ] Respaldar y documentar los cambios implementados para la entrega formal.
