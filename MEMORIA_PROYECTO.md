# Memoria del proyecto

**Actualizada:** 28 de septiembre de 2026  
**Proyecto:** Frontend del Sistema de Gestión de TI (HorbIS Group)

Este documento resume las decisiones y el trabajo realizado hasta la fecha para dar continuidad a futuras tareas. Para las reglas detalladas de arquitectura, consultar [FRONTEND_AGENT_CONTEXT.md](./FRONTEND_AGENT_CONTEXT.md).

## Stack y reglas importantes

- React 19, TypeScript estricto, Vite 8 y Tailwind CSS.
- Componentes de interfaz basados en shadcn/ui; iconos de lucide-react.
- React Router para navegación, Axios para API, Zustand para estado global de autenticación y Sonner para notificaciones.
- No utilizar `any`.
- Las peticiones HTTP se realizan exclusivamente mediante `src/services/api.ts`.
- No modificar el backend cuando el trabajo solicitado sea del frontend, salvo petición expresa.

## Identidad visual

- Morado principal: `#5b2480`.
- Fondo claro: `#f5f5f5`.
- Texto oscuro en modo claro: `#231420`.
- Fondo principal en modo oscuro: `#010409`.
- El sistema también utiliza estados rojo, amarillo y verde; sus valores semánticos están definidos en `src/styles/tokens.css`.
- Los tokens de tema claro están en `:root` y los oscuros en `.dark`, dentro de `src/styles/tokens.css`. Los componentes deberían preferir tokens como `bg-background`, `bg-sidebar`, `text-foreground` y `border-border` en lugar de colores fijos.

## Trabajo realizado

### Login

- Se refinó el login conservando la identidad visual morada y la composición de dos paneles con ilustración SVG.
- La ilustración de red se separó en `src/features/auth/components/LoginNetworkIllustration.tsx`.
- El formulario tiene campos accesibles, mostrar/ocultar contraseña, opción “Recordarme”, estados de carga y error, y feedback con Sonner.
- El diseño incluye tratamiento responsive y un fondo con degradado. El login soporta ahora ambos temas y cuenta con selector de tema propio.

### Integración de autenticación

- Tipos de autenticación: `src/types/auth.ts`.
- Instancia Axios central, header Bearer e interceptor para expiración de sesión: `src/services/api.ts`.
- Funciones del servicio de auth: `src/services/auth.service.ts`.
- Persistencia y helpers de sesión: `src/services/auth-session.ts`.
- Store Zustand: `src/store/authStore.ts`.
- La opción “Recordarme” guarda la sesión en `localStorage`; si no está activada, se usa `sessionStorage`. Cerrar sesión limpia ambos.
- Se protegen las rutas internas y se redirige a `/login` cuando no existe una sesión autenticada. Una sesión existente redirige desde `/login` a `/tickets`.
- El login envía `POST /api/auth/login` y obtiene el perfil con `GET /api/auth/me`.
- Las pruebas previas contra el backend local cubrieron login válido e inválido, perfil con autorización Bearer, persistencia, cierre de sesión y redirecciones. No se guardaron credenciales ni tokens en este documento.
- `src/App.tsx` monta Sonner y carga la sesión al iniciar.

### Tema claro/oscuro

- Los tokens del modo oscuro se activan agregando la clase `dark` al elemento `<html>`.
- `src/components/theme/ThemeProvider.tsx` administra y persiste `gestion-ti.theme` en `localStorage`.
- `src/components/theme/ThemeToggle.tsx` ofrece el control accesible para alternar tema; `src/hooks/useTheme.ts` da acceso al contexto.
- El selector aparece al pie de la barra lateral en escritorio, en la barra móvil y en la esquina superior del login.
- El modo claro es el predeterminado cuando no hay preferencia guardada.
- El fondo del login adapta su degradado al tema. Si se añaden colores fijos a nuevas pantallas, deben revisarse en ambos temas.

### Barra lateral

- `src/components/layout/AppLayout.tsx` incluye navegación expandible/colapsable en escritorio.
- Ancho expandido: `240px`; ancho colapsado: `64px`.
- La elección se persiste bajo `sidebar-collapsada` en `localStorage`.
- Expandida se muestra `src/assets/logo-header-hr.png`. Colapsada se usa una ventana de recorte estable del mismo recurso para mostrar el símbolo sin escalar el logotipo completo.
- Los enlaces conservan nombres accesibles y muestran etiquetas emergentes en estado colapsado.
- En móvil se mantiene la navegación horizontal y un selector de tema compacto.

## Rutas principales protegidas

Configuradas en `src/router/index.tsx`:

- `/tickets`
- `/kanban`
- `/inventory`
- `/licenses`
- `/projects`
- `/reports`
- `/passwords`

El login está en `/login`. Hay un enlace a `/recuperar` en el formulario; verificar que exista una ruta implementada antes de ampliar ese flujo.

## Verificaciones realizadas

- `npm run build`: pasó después de los cambios de autenticación, tema y barra lateral.
- ESLint focalizado en los archivos modificados: pasó.
- El lint global reportó errores preexistentes `react-refresh/only-export-components` en `src/components/ui/badge.tsx`, `button.tsx`, `combobox.tsx` y `tabs.tsx`. Revisar su estado antes de atribuir fallos globales a nuevas modificaciones.
- Las interacciones del tema y el colapso de la barra se probaron en navegador; las preferencias permanecieron tras recargar.
- Los builds han mostrado una advertencia de Vite por el uso de `__dirname` en `vite.config.ts`; no impidió compilar.

## Consideraciones para continuar

1. Leer primero `FRONTEND_AGENT_CONTEXT.md`.
2. Comprobar los tokens claro/oscuro y la navegación responsive al modificar layout o colores.
3. Mantener fuera del repositorio secretos del backend y archivos `.env` reales; usar `.env.example` como referencia para configuración del frontend.
4. Ejecutar al menos `npm run build` y ESLint focalizado para cambios de interfaz o TypeScript.
