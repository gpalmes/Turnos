# Turnos App Project Plan

## Overview
Turnos es una aplicación de gestión de turnos diseñada para ayudar a negocios diversos a coordinar reservas, administrar disponibilidad y manejar agendas. El objetivo es que funcione para rubros como canchas de pádel, clínicas médicas, barberías y cualquier otro negocio que necesite turnos.

> Ver [ARQUITECTURA.md](ARQUITECTURA.md) para el mapa conceptual (modelo de datos, auth, roles, flujo de reserva) con diagramas.

## Arquitectura
- Frontend web: Next.js
- App móvil: Expo + React Native
- Backend/API: Next.js API routes (puede escalar a un backend separado después)
- Base de datos: PostgreSQL (Supabase o proveedor similar)
- ORM: Prisma
- Autenticación: Supabase Auth
- Hosting: Vercel para web / Expo para móvil
- Notificaciones: email inicialmente, luego WhatsApp/push

## Funcionalidades principales
- Autenticación y gestión de usuarios
- Registro y configuración de negocios
- Gestión de servicios y recursos
- Definición de disponibilidad y horarios
- Motor de reservas y validación de solapamientos
- Agenda/calendario para negocios y clientes
- Confirmación, cancelación y reprogramación de turnos
- Reportes básicos de ocupación y servicios

## Módulos
- Authentication
- Business management
- Service management
- Resource management
- Availability and schedule
- Booking engine
- Customer management
- Notifications
- Analytics and reporting
- Settings

## Pantallas
### Web
- Login / Signup
- Dashboard / Home
- Business management
- Service and resource editor
- Availability and schedule settings
- Booking agenda / calendar
- Booking detail and management
- Reports and analytics
- User profile

### Mobile
- Home / dashboard
- Discover businesses and services
- Booking flow
- My bookings
- Booking detail
- Notifications
- Profile and settings

## MVP inicial
1. Autenticación básica
2. Crear y administrar negocios
3. Definir servicios y recursos
4. Configurar horarios y disponibilidad
5. Reservar turno desde un calendario simple
6. Ver agenda del día/semana
7. Cancelar y reprogramar turnos

## Next steps
1. Abrir el proyecto en VS Code desde `C:\Users\gpalmes\Desktop\Turnos`
2. Crear el proyecto `Next.js` para la web
3. Crear el proyecto `Expo` para la app móvil
4. Definir el esquema de datos con Prisma y PostgreSQL/Supabase
5. Implementar la API de negocios y reservas
6. Desarrollar la pantalla de reserva básica para web y mobile
7. Probar el flujo de reserva y sincronización
8. Añadir notificaciones y estadísticas

## Notas importantes                                              
- El diseño debe ser flexible: separar claramente los datos de negocio de la lógica de reservas.
- El sistema debe permitir múltiples tipos de recursos y servicios para adaptarse a distintos negocios.
- Se recomienda comenzar con web + mobile conectando a la misma API para compartir la lógica.

## Development Roadmap
### Estado general
- [x] Planificación y definición del alcance inicial
- [x] Configuración de proyectos web y mobile
- [x] Definición del esquema de datos y conexión a la base de datos (SQLite → Supabase)
- [x] Implementación inicial de la API y lógica de reservas
- [x] Desarrollo de pantallas web del flujo de reserva (✅ FUNCIONANDO)
- [x] Integración de Supabase Auth (signup, login, logout, sesión, login con Google)
- [x] Pantalla de gestión de negocios (crear negocio, servicios, recursos, horario semanal)
- [x] Gestión de perfiles de usuario y roles básicos
- [ ] Dashboard de administración
- [ ] Desarrollo de app móvil con Expo
- [ ] Pruebas del flujo completo
- [ ] Notificaciones por email
- [ ] Reportes y estadísticas

> Nota: Migración a Supabase (PostgreSQL) completa y conexión verificada. El archivo `prisma/dev.db` (SQLite) quedó obsoleto, ya no se usa.
>
> Validación end-to-end (2026-06-17): se probó el flujo completo contra la base real (crear negocio → servicio → recurso → consultar disponibilidad → reservar → verificar que el slot reservado queda ocupado). Se encontraron y corrigieron 2 bugs que impedían que esto funcionara: (1) las tablas nunca se habían creado en Supabase, (2) `/api/availability` calculaba mal el día de la semana por un bug de zona horaria (siempre tomaba el día anterior en husos horarios negativos como Argentina). Ver detalle en sección "Reservas y agenda".
>
> Autenticación (2026-06-17): implementada con Supabase Auth (signup/login/logout + middleware de sesión). El modelo `User` ya no guarda `password` (lo maneja Supabase Auth); el `id` de `User` es el mismo UUID del usuario en `auth.users`. `POST /api/bookings` ya no confía en un `userId` del body: lo deriva de la sesión (cerraba una suplantación de identidad real). `GET /api/bookings` ahora exige sesión y solo devuelve las reservas propias (antes cualquiera podía leer las de cualquier otro usuario por query param). `POST` de businesses/services/resources exige sesión pero todavía no valida ownership real del negocio — eso queda para "roles básicos". Validado end-to-end: signup → perfil creado en `User` con el mismo id → reservar logueado usa el userId real → 401 sin sesión en bookings y businesses.
>
> Login con Google (2026-06-17): agregado vía Supabase Auth OAuth (`web/src/app/auth/callback/route.ts` intercambia el code por sesión y crea el perfil en `User` si no existe, ya que los usuarios de Google no pasan por la Server Action de signup).
>
> Pantalla de Negocios (2026-06-17): `/businesses` (crear negocio, lista "mis negocios") y `/businesses/[id]` (servicios, recursos, horario semanal). De paso se cerró el hueco de ownership que había quedado pendiente: `POST /api/businesses` ya deriva el `ownerId` de la sesión (no del body), y `POST /api/services`/`resources`/`schedules` devuelven 404 si el `businessId` no pertenece al usuario logueado (404 y no 403, para no revelar si el negocio existe). También se corrigió un bug en `/api/services` que rechazaba `price: 0` (servicio gratuito). Nueva ruta `/api/schedules` (GET+POST) con `upsert` para evitar duplicados exactos. `/api/availability` ahora soporta varios bloques de horario por día (turnos partidos, ej. 9-12 y 14-18), antes solo tomaba el primero (`findFirst` → `findMany`). Validado end-to-end con dos usuarios distintos: ownership cruzado da 404, turno partido genera los slots correctos sin rellenar el hueco del almuerzo.
>
> Perfiles y roles básicos (2026-06-17): `/profile` permite editar el nombre y cambiar la contraseña (`web/src/app/profile/actions.ts`, Server Actions). `getSessionUser()` (`web/src/lib/auth.ts`) ahora también devuelve `role`. El rol `operator` se asigna solo al crear tu primer negocio (no requiere aprobación, sigue sin haber restricción para crear negocios). El rol `admin` bypasea los chequeos de ownership: puede ver/editar cualquier negocio (`/businesses` le lista todos, no solo los propios) y las rutas `POST /api/services`/`resources`/`schedules` le devuelven 201 en vez de 404 para negocios ajenos. No hay panel para asignar `admin` todavía — se hace a mano en la base. Validado end-to-end vía API: rol pasa a operator al crear negocio, un cliente normal sigue recibiendo 404 en negocio ajeno, un admin lo ve y puede gestionarlo. Los formularios de nombre/contraseña no se pudieron probar por script (son Server Actions atadas a un POST de formulario real) — probarlos a mano en el navegador.
>
> Editar negocios + asociar servicios a recursos (2026-06-18): `PATCH /api/businesses/[id]` permite editar los datos del negocio (distingue "no enviado" de "enviado vacío" para poder borrar dirección/teléfono/email). Nueva ruta `PUT /api/services/[id]/resources` asocia recursos a un servicio (valida que pertenezcan al mismo negocio, 400 si no); un servicio sin asociaciones sigue mostrando todos los recursos del negocio (no rompe negocios existentes). `GET /api/resources` y el wizard público (`BookingFlow.tsx`) ya filtran el paso "elegir recurso" según el servicio elegido, y `POST /api/bookings` rechaza con 400 un `resourceId` que no esté asociado al servicio. Validado end-to-end: editar negocio (incluyendo vaciar un campo), asociar 1 de 2 recursos, filtro correcto antes/después de asociar, rechazo de recursos de otro negocio (400) y de reservas con recurso no asociado (400), ownership cruzado sigue dando 404.
>
> Solapamientos, excepciones, anticipación/cancelación (2026-06-18):
> - `POST /api/bookings` rechaza con 409 si el recurso ya tiene otra reserva (no cancelada) que se cruza en el horario; permite reservas espalda-con-espalda (sin hueco).
> - Nueva ruta `/api/availability-exceptions` (GET+POST) para excepciones puntuales por fecha (feriados, horario especial). `/api/availability` ya las incorpora: bloques `isAvailable:false` quitan esos slots del día, bloques `isAvailable:true` agregan horario extra aunque no haya `Schedule` regular ese día. UI en `/businesses/[id]`.
> - `Business` tiene 2 campos nuevos: `minAdvanceHours` y `cancellationHours` (default 0 = sin restricción), editables desde `EditBusinessForm`. `POST /api/bookings` rechaza si la reserva no cumple la anticipación mínima (y de paso ya no se puede reservar en el pasado, antes no se chequeaba). Nueva ruta `PATCH /api/bookings/[id]` para cancelar: el cliente respeta la ventana de `cancellationHours`, el dueño del negocio o un admin puede cancelar siempre (bypass), no se puede cancelar dos veces. Nueva página `/bookings` ("Mis reservas") con botón cancelar.
>
> Hubo un corte de conectividad a mitad de sesión (el puerto directo de Postgres de Supabase es IPv6-only y la red se quedó sin salida IPv6 un rato) que demoró aplicar el cambio de schema — ya se resolvió solo al volver la conexión. Validado end-to-end con 17 chequeos: solapamiento (409) y back-to-back (201), excepción cerrada quita exactamente esos slots (40 de 48 esperados), excepción abierta genera slots en un día sin horario regular (8 esperados), anticipación insuficiente (400) vs suficiente (201) vs pasado (400), cancelación dentro de la ventana por el cliente (400) vs por el dueño del negocio (200, bypass) vs doble cancelación (400) vs fuera de la ventana por el cliente (200) vs un tercero ajeno (404), y `/bookings` renderiza las reservas propias.
>
> Mapa conceptual + diseño básico (2026-06-18): nuevo [ARQUITECTURA.md](ARQUITECTURA.md) con diagramas Mermaid (modelo de datos, auth, roles, arquitectura de lectura/escritura, flujo de reserva). Se instaló Tailwind CSS v3 y se armó un sistema de diseño chico (`web/src/components/ui/`: `Button`, `Card`, `Input`, `Container`) con estilo profesional/minimalista (blanco/gris neutro + acento índigo). Se reestilizaron todas las pantallas existentes en 6 lotes probados por separado: header/nav, login/signup/perfil/botón de Google, el wizard de reserva completo (se eliminó `BookingFlow.module.css`, ya no se usa), negocios (lista + detalle + los 7 formularios), y "Mis reservas". Build limpio en cada lote; se verificaron visualmente con capturas reales (Edge headless) la home/wizard, login y signup.
>
> Próximo en el backlog: nada pedido todavía — el backlog que el usuario ordenó está completo.

### Funcionalidades y estado
#### Autenticación y usuarios
- [x] Registro y login para clientes (Supabase Auth)
- [x] Gestión de perfiles de usuario (editar nombre, cambiar contraseña en `/profile`)
- [x] Roles básicos: administrador, operador y cliente (operador automático al crear negocio; admin bypasea ownership, sin panel de asignación todavía)

#### Gestión de negocios
- [x] Crear y editar negocios
- [x] Configurar datos del negocio (nombre, rubro, dirección, contacto)
- [x] Configurar zona horaria y horario de atención

#### Servicios y recursos
- [x] Definir servicios o tipos de turnos
- [x] Definir recursos asociados (canchas, médicos, sillones, etc.)
- [x] Asociar servicios a recursos (con filtro real en el wizard de reserva)

#### Disponibilidad y reglas de turnos
- [x] Configurar horarios semanales (soporta turnos partidos, varios bloques por día)
- [x] Definir intervalos y bloques no disponibles (`/api/availability-exceptions`, feriados y horario especial)
- [x] Validar solapamientos de reservas (409 en `POST /api/bookings`)
- [x] Reglas de anticipación y cancelación (`minAdvanceHours`/`cancellationHours` por negocio, `PATCH /api/bookings/[id]`)

#### Reservas y agenda
- [ ] Ver disponibilidad en calendario (el cálculo de slots en `/api/availability` funciona y está validado, pero el wizard de reserva no lo consume: el paso 4 es un campo de fecha/hora libre, sin mostrar horarios reales ni bloquear los ya ocupados)
- [x] Crear reservas paso a paso
- [~] Confirmar y cancelar turnos — cancelar implementado y validado (`/bookings`); confirmar (pasar de "pending" a "confirmed") todavía no
- [ ] Reprogramar turnos
- [ ] Ver agenda del día/semana por recurso y negocio

#### Administración y reportes
- [ ] Dashboard de negocio
- [ ] Reportes básicos de ocupación y servicios
- [ ] Gestión de clientes y turnos

#### Notificaciones
- [ ] Email de confirmación
- [ ] Recordatorios de turno
- [ ] Planeadas: WhatsApp / push notifications

### Módulos
- [ ] Authentication
- [ ] Business management
- [ ] Service management
- [ ] Resource management
- [ ] Availability and schedule
- [ ] Booking engine
- [ ] Customer management
- [ ] Notifications
- [ ] Analytics and reporting
- [ ] Settings

### Prioridad inicial
1. Autenticación y estructura de usuarios
2. Gestión de negocios, servicios y recursos
3. Configuración de disponibilidad
4. Motor de reservas y agenda
5. Interfaces web y mobile del flujo de reserva
6. Notificaciones y reportes
