# Roadmap del Proyecto - Frontend Gestión TI

Este documento centraliza las tareas pendientes del frontend. Cada tarea debe marcarse como completada cuando quede finalizada.

Nota: el estado marcado a continuación refleja lo que ya está confirmado en el código actual del proyecto.

## Convenciones
- [ ] = pendiente
- [x] = completada
- Prioridad alta = crítica para el funcionamiento del sistema
- Prioridad media = funcionalidad importante
- Prioridad baja = mejora o pulido

---

## 1. Base y configuración del proyecto

### Infraestructura
- [ ] Revisar y dejar consistente la estructura de carpetas del frontend
- [ ] Confirmar que todas las dependencias necesarias estén instaladas y versionadas
- [ ] Validar la configuración de Vite + React + TypeScript
- [ ] Revisar y corregir la configuración de ESLint y TypeScript para evitar errores de compilación
- [ ] Corregir configuración de Tailwind y estilos globales
- [ ] Verificar el uso correcto de variables de entorno para API y auth
- [ ] Documentar comandos de desarrollo, build y despliegue

### Arquitectura y patrones
- [ ] Definir el estándar de nombres y organización de componentes por dominio
- [ ] Revisar la estructura de `src/features`, `src/components`, `src/services` y `src/store`
- [ ] Definir la política de tipado para todos los modelos de datos y respuestas de API
- [ ] Establecer el patrón de manejo de errores y loading en todas las pantallas
- [ ] Establecer el patrón de notificaciones toast para confirmaciones y errores

---

## 2. Autenticación y acceso

- [ ] Implementar pantalla de login con validación de formulario
- [ ] Implementar flujo de recuperación de contraseña
- [ ] Configurar almacenamiento seguro de sesión y token JWT
- [ ] Crear servicio centralizado de autenticación y sesión
- [ ] Implementar logout y cierre de sesión
- [ ] Definir protección de rutas por rol o estado autenticado
- [ ] Crear pantalla de acceso denegado o fallback para usuarios sin permisos
- [ ] Validar manejo de sesión expirada y renovación de token
- [ ] Añadir loading states y mensajes de error en auth

---

## 3. Layout, navegación y experiencia general

- [x] Crear layout principal con sidebar o navegación lateral
- [x] Implementar header con perfil, notificaciones y botón de tema
- [x] Configurar navegación entre módulos del sistema
- [x] Crear redirección inicial según sesión autenticada
- [ ] Implementar página de inicio o dashboard principal
- [x] Crear página 404 o ruta no encontrada
- [ ] Añadir estados vacíos y mensajes informativos para pantallas sin datos
- [ ] Revisar responsividad general del layout en móvil, tablet y desktop
- [ ] Validar accesibilidad básica de navegación y foco

---

## 4. Dashboard y reportes

- [ ] Diseñar estructura del dashboard principal
- [ ] Definir KPIs relevantes del sistema
- [ ] Implementar widgets de métricas y estado operativo
- [ ] Integrar gráficos para indicadores de tickets, proyectos y activos
- [ ] Crear filtros por fecha, área o categoría
- [ ] Implementar exportación de reportes o descarga de información
- [ ] Añadir estados de carga y error para métricas
- [ ] Revisar diseño visual del dashboard para claridad y jerarquía

---

## 5. Módulo de tickets

- [ ] Crear listado principal de tickets
- [ ] Implementar filtros por estado, prioridad, usuario o categoría
- [ ] Crear vista de detalle de ticket
- [ ] Diseñar formulario de creación/edición de ticket
- [ ] Añadir soporte para subtareas o seguimiento interno
- [ ] Implementar comentarios o actividad del ticket
- [ ] Agregar validaciones de formulario y estados de envío
- [ ] Conectar con la API REST del backend
- [ ] Añadir carga de archivos o evidencias asociadas
- [ ] Definir flujo de cambio de estado y prioridad

---

## 6. Tablero Kanban

- [ ] Crear estructura del tablero por columnas
- [ ] Implementar drag and drop para mover tickets entre columnas
- [ ] Gestionar estados del tablero y sincronización visual
- [ ] Conectar con datos reales de tickets
- [ ] Añadir indicadores de carga mientras se actualiza el tablero
- [ ] Implementar actualización en tiempo real con WebSockets
- [ ] Añadir filtros o búsqueda dentro del Kanban
- [ ] Revisar UX del drag and drop en escritorio y móvil
- [ ] Validar manejo de errores al mover elementos

---

## 7. Inventario de activos

- [ ] Crear listado de inventario de activos
- [ ] Implementar búsqueda y filtros por tipo, estado o ubicación
- [ ] Diseñar vista de detalle de activo
- [ ] Crear formulario de alta o edición de activo
- [ ] Gestionar asignación de equipos a usuarios o áreas
- [ ] Definir estado visual de activos activos/inactivos/pendientes
- [ ] Conectar con la API del inventario
- [ ] Añadir validaciones y mensajes de confirmación
- [ ] Revisar persistencia de datos y manejo de errores

---

## 8. Licencias y credenciales

- [ ] Crear módulo de licencias y repositorio de software
- [ ] Definir estructura de datos para licencias, expiración y responsables
- [ ] Implementar listado con filtros y búsqueda
- [ ] Añadir formulario de registro de licencia o credencial
- [ ] Crear vista de detalle con información crítica y fechas de vencimiento
- [ ] Añadir avisos de licencias próximas a vencer
- [ ] Definir manejo seguro de credenciales y datos sensibles
- [ ] Revisar UX para mostrar información sensible de forma segura

---

## 9. Gestión de proyectos

- [ ] Crear módulo de proyectos
- [ ] Diseñar listado y filtros para proyectos activos/inactivos
- [ ] Implementar formulario de creación y edición de proyecto
- [ ] Añadir cronograma o vista de tiempos del proyecto
- [ ] Definir relación entre proyecto, tareas y responsables
- [ ] Crear vista de detalle del proyecto
- [ ] Integrar estados de avance o progreso del proyecto
- [ ] Conectar con backend y validaciones de negocio

---

## 10. Chatbot y asistente de IA

- [ ] Diseñar widget flotante del chatbot
- [ ] Crear flujo de conversación y entrada de mensajes
- [ ] Añadir soporte para texto, voz y síntesis de voz
- [ ] Implementar estados de carga y respuesta en espera
- [ ] Definir manejo de errores y fallback en respuestas
- [ ] Conectar con backend o servicio de IA
- [ ] Revisar accesibilidad y experiencia de uso del widget
- [ ] Añadir historial de conversaciones o contexto por sesión

---

## 11. Estado global y servicios

- [ ] Completar la store de autenticación con sesión realista
- [ ] Definir store o hooks para preferencias del usuario
- [ ] Crear servicio centralizado de API con interceptores de token y errores
- [ ] Alinear manejo de estado global con Zustand
- [ ] Revisar uso de `useAppPreferences` y otros hooks para evitar lógica duplicada
- [ ] Definir patrón para consultar datos asíncronos y cacheo simple

---

## 12. Calidad, UX y accesibilidad

- [x] Revisar diseño de componentes reutilizables en `src/components/ui`
- [x] Asegurar consistencia visual de botones, inputs, modales y tablas
- [ ] Validar contrastes y accesibilidad básica en textos e iconos
- [ ] Revisar navegación por teclado en formularios y modales
- [ ] Añadir mensajes de error claros para validaciones
- [ ] Revisar estados vacíos, loading y empty states generalizados
- [ ] Probar responsive behavior en distintos tamaños de pantalla
- [ ] Realizar auditoría de UX para cada módulo funcional
- [ ] Revisar uso de iconografía y consistencia visual

---

## 13. Testing y validación

- [ ] Definir estrategia de pruebas para componentes críticos
- [ ] Revisar pruebas unitarias básicas para formularios y hooks
- [ ] Validar flujo de login y autenticación
- [ ] Probar navegación principal entre módulos
- [ ] Validar pantallas de carga, error y vacío
- [ ] Probar comportamiento del Kanban y drag and drop
- [ ] Verificar integridad de datos en inventario, tickets y proyectos
- [ ] Ejecutar pruebas manuales de regresión para cada módulo

---

## 14. Despliegue y entrega

- [ ] Revisar variables de entorno para entorno de desarrollo y producción
- [ ] Validar build final del proyecto con `npm run build`
- [ ] Corregir warnings de compilación y dependencias obsoletas
- [ ] Preparar despliegue para entorno de prueba
- [ ] Documentar pasos de ejecución para usuarios y desarrolladores
- [ ] Definir checklist final de QA antes de entrega
- [ ] Revisar consumo de API para asegurar compatibilidad con backend

---

## 15. Backlog de mejoras futuras

- [ ] Mejorar analítica y paneles de gestión ejecutiva
- [ ] Añadir personalización del dashboard por usuario
- [ ] Mejorar notificaciones y alertas inteligentes
- [ ] Añadir soporte para exportación de datos a CSV/PDF
- [ ] Mejorar búsqueda global y filtros avanzados
- [ ] Añadir automatizaciones o workflow de tareas
- [ ] Mejorar soporte multilenguaje y localización
- [ ] Evaluar mejoras de rendimiento con grandes volúmenes de datos

---

## 16. Checklist de cierre de sprint

- [ ] Revisar tareas completadas contra este roadmap
- [ ] Confirmar que cada módulo queda funcional y consistente
- [ ] Verificar que no queden errores de compilación ni warnings críticos
- [ ] Validar flujo principal del usuario desde login hasta dashboard
- [ ] Dejar documentada la evidencia de pruebas realizadas
- [ ] Confirmar que el proyecto está listo para la siguiente entrega
