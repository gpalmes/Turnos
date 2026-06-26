# Turnos — Estado del proyecto

> Documento de referencia para entender dónde estamos parados y cómo avanzar.
> Última actualización: 2026-06-25.

---

## 1. Qué es Turnos

App web para **reservar turnos** en negocios de distinto rubro (pádel, médico, barbería, etc.).
Tiene dos perspectivas sobre el mismo usuario:

- **Cliente**: busca un negocio, mira disponibilidad y reserva.
- **Dueño**: crea su negocio, carga servicios/recursos/horarios y gestiona las reservas que recibe (confirmar, cancelar, eliminar, registrar pagos).

Un mismo usuario puede ser ambas cosas.

---

## 2. Conceptos clave

| Concepto | Qué es | Ejemplo |
|----------|--------|---------|
| **Negocio** | El lugar que ofrece turnos. Tiene un **Rubro**. | "Vientos" (Pádel y Tenis) |
| **Servicio** | Qué se reserva (tiene duración y precio). | "Cancha de pádel" (90 min, $50) |
| **Recurso** | La instancia concreta que se ocupa. | "Cancha 1", "Cancha 2" |
| **Horario** | Franjas semanales en que abre el negocio. | Lunes 08:00–22:00 |
| **Excepción** | Cambio puntual de un día (feriado, cierre). | 25/12 cerrado |
| **Reserva** | Un turno tomado por un cliente. | Cancha 1, 29/06 14:00–15:30 |

---

## 3. Stack técnico

- **Next.js 14** (App Router) + React + TypeScript
- **TailwindCSS** para estilos
- **Prisma** (ORM) sobre **PostgreSQL de Supabase**
- **Supabase Auth** (login con email/contraseña y Google)
- **Supabase Storage** (comprobantes de pago)
- Carpeta del código: `web/`

---

## 4. Mapa de pantallas (rutas)

### Públicas / cliente
- `/` — **Directorio de negocios** con filtro por Rubro y check "Con disponibilidad".
- `/reservar/[id]` — **Página del negocio** (pública): calendario de disponibilidad + botón "Nueva reserva".
- `/login`, `/signup` — Acceso y registro.

### Usuario logueado
- `/bookings` — **"Mis reservas"** (las que hice como cliente). Puedo cancelar/eliminar.
- `/profile` — Mi perfil (nombre, contraseña).

### Dueño / admin
- `/businesses` — **"Mis negocios"** (lista + crear negocio).
- `/businesses/[id]` — Gestión del negocio, en pestañas:
  - **Reservas**: agenda (calendario) + lista de reservas recibidas → confirmar/cancelar/eliminar/pago.
  - **Servicios y recursos**: alta y edición.
  - **Horarios**: horario semanal + excepciones.
  - **General**: editar datos del negocio + zona de peligro (eliminar).

---

## 5. Modelo de datos (Prisma)

- **User** (id, email, name, role: `client`/`operator`/`admin`)
- **Business** (name, category=rubro, timezone, dirección, etc., ownerId)
- **Service** (name, duration, price, businessId)
- **Resource** (name, type, businessId)
- **Schedule** (dayOfWeek, startTime, endTime, isActive)
- **Availability** (excepciones puntuales: date, startTime, endTime, isAvailable)
- **Booking** (userId, businessId, serviceId, resourceId, startTime, endTime, status,
  **paymentStatus**, **paymentAmount**, **paymentMethod**, **receiptPath**)

Estados de reserva: `pending` → `confirmed` / `cancelled` (y `completed`).
Estados de pago: `pending` / `partial` (seña) / `paid`.

---

## 6. Cómo correr el proyecto

```bash
cd web
npm run dev
# abre http://localhost:3000
```

La conexión a la base usa **`web/.env.local`** (variable `DATABASE_URL` apuntando al **pooler** de Supabase, IPv4).

---

## 7. Estado actual — qué YA está hecho

- [x] Auth (login/registro, Google), perfil
- [x] CRUD de negocios, servicios, recursos, horarios y excepciones
- [x] Directorio público con filtro por rubro + "con disponibilidad"
- [x] Rubro como desplegable (con opción "Otro")
- [x] Flujo de reserva paso a paso (servicio → recurso → fecha/hora)
- [x] Cálculo de disponibilidad real (respeta horarios, excepciones y reservas)
- [x] Página pública del negocio con **calendario diario** (líneas de 60 min, reservas como bloques superpuestos según su duración)
- [x] Panel del dueño: ver y gestionar reservas recibidas
- [x] Confirmar / cancelar / eliminar reservas
- [x] Reservar sin anticipación mínima (cualquier horario futuro)
- [x] Clic en una reserva del calendario → modal de detalle
- [x] Registrar **pago** (estado + monto + método) y **adjuntar comprobante** (Supabase Storage)

---

## 8. Pendientes / configuración requerida

1. **⚠️ Falta `SUPABASE_SERVICE_ROLE_KEY` en `web/.env.local`.**
   Sin esto, registrar pago anda pero **subir comprobante falla**.
   Se obtiene en Supabase → Settings → API → `service_role`.

2. **`web/.env` tiene la URL de base vieja (conexión directa IPv6, no funciona).**
   La app usa `.env.local` (pooler) y anda, pero los comandos de Prisma por consola
   (`prisma db push`, scripts) pueden fallar. Conviene unificar `.env` al pooler.

3. **Verificar acceso (login).** En las pruebas hubo "credenciales inválidas".
   Para gestionar reservas hay que estar logueado como dueño del negocio.

4. **Seguridad:** confirmar que `.env.local` esté en `.gitignore` (tiene contraseñas y claves).

---

## 9. Próximos pasos sugeridos (propuesta)

Ordenados por valor:

1. **Destrabar el acceso** y probar el flujo completo de punta a punta
   (reservar como cliente → confirmar y cobrar como dueño).
2. **Configurar el service role key** para que ande el comprobante.
3. **Editar reservas** desde el modal (cambiar horario/recurso), hoy solo se confirma/cancela/elimina.
4. **Notificaciones** al cliente (email) cuando se confirma/cancela su turno.
5. **Bloquear turnos** manualmente desde la agenda (la base ya contempla el estado "No disponible").
6. **Reportes** simples para el dueño (ingresos del día/semana, turnos por estado).

---

## 10. Glosario de "dónde se hace cada cosa"

| Quiero... | Voy a... |
|-----------|----------|
| Reservar un turno | `/` → elijo negocio → "Nueva reserva" |
| Ver mis turnos | "Mis reservas" (`/bookings`) |
| Crear/configurar mi negocio | "Mis negocios" (`/businesses`) |
| **Aceptar (confirmar) una reserva** | Mis negocios → negocio → pestaña **Reservas** |
| Registrar un pago | Mis negocios → negocio → Reservas → clic en la reserva |
| Cambiar horarios del negocio | Mis negocios → negocio → pestaña **Horarios** |
