# Turnos — Estado del proyecto (consolidado)

> Documento vigente de estado. Reemplaza a `ESTADO-DEL-PROYECTO.md`.
> El roadmap del giro marketplace está en `PLAN-MARKETPLACE.md`.
> Actualizado: 2026-07-01.

**Qué es:** marketplace de reservas de turnos, estilo "PedidosYa pero de turnos".
El cliente descubre negocios de forma visual y reserva; el dueño publica su vitrina,
gestiona reservas y cobra. Un administrador aprueba los negocios.

**Stack:** Next.js 14 (App Router) · React · TypeScript · TailwindCSS · Prisma ·
PostgreSQL (Supabase, vía **pooler** IPv4) · Supabase Auth · Supabase Storage. Código en `web/`.

---

## 1. Funcionalidades APLICADAS ✅

### Cuentas y perfiles
- Registro y login con **email/contraseña** y **Google**; logout.
- Perfil: editar nombre y cambiar contraseña.
- **3 roles**: `client` (Cliente), `operator` (Negocio), `admin` (Administrador).
  El header muestra el usuario y su perfil en el botón de cerrar sesión.
- Los permisos de gestión se basan en ser **dueño** del negocio; `admin` puede todo.

### Marketplace (portada, `/`)
- **Directorio visual** de negocios con cards (foto o emoji del rubro, badge Abierto/Cerrado, badge Disponible).
- **Buscador** por nombre y rubro.
- **Chips de rubro** con emoji para filtrar.
- **Toggles**: "Abierto ahora" y "Con disponibilidad".
- **Ordenar**: Recomendados / A-Z / Z-A, contador de resultados y "Limpiar filtros".
- Solo se listan negocios **aprobados**.

### Vitrina del negocio (`/reservar/[id]`, pública)
- **Banner** con foto (o emoji), encabezado con rubro, dirección y estado **Abierto/Cerrado**.
- **Servicios como tarjetas** (nombre, duración, precio) con botón **Reservar** directo.
- **Agenda diaria** (calendario) siempre visible.

### Reservas (cliente)
- Flujo paso a paso: Servicio → Recurso (se saltea si hay uno solo) → Fecha + **grilla de horarios reales** → Confirmar, con pantalla de confirmación.
- Se puede reservar en **cualquier horario futuro** (sin anticipación mínima).
- "Mis reservas": ver, **cancelar** y **eliminar** las propias.

### Motor de disponibilidad
- Cálculo de slots que respeta **horarios semanales**, **excepciones** y **reservas existentes**.
- Consciente de la **duración** del servicio; parámetros de paso (`stepMinutes`).
- Estados por slot: **Libre / Ocupado / No disponible** (pasado o bloqueado).

### Agenda / Calendario (dueño y público)
- Vista **diaria** con **líneas fijas de 60 min**, una **columna por recurso**.
- Las reservas se dibujan como **bloques superpuestos** con su duración real.
- **Clic en una reserva** abre el modal de detalle.
- Presente en la vitrina pública y en el panel del dueño.

### Gestión del negocio (`/businesses/[id]`, dueño/admin)
- Pestañas: **Reservas · Servicios y recursos · Horarios · General**.
- CRUD de **servicios**, **recursos** (con asociación recurso↔servicio), **horarios** semanales y **excepciones** de disponibilidad.
- Editar datos del negocio, **subir foto**, eliminar negocio.
- **Reservas recibidas**: lista + agenda; **confirmar / cancelar / eliminar**.

### Modal de detalle de reserva (clic en el calendario)
- Detalle según rol (el dueño ve cliente y pagos; otros ven info mínima).
- Acciones: **confirmar / cancelar / eliminar**.
- **Reprogramar** fecha/hora (valida pasado y solapamiento).
- **Registrar pago**: estado (Pendiente/Seña/Pagado) + monto + método (**Efectivo / Transferencia / Mercado Pago** / Tarjeta) + **subir comprobante** (Supabase Storage privado, link firmado).

### Aprobación de negocios (admin)
- El alta crea el negocio **pendiente**; no se publica hasta aprobación.
- Panel de **solicitudes pendientes** para el admin: **Aprobar** (publica + sube al dueño a "Negocio") / **Rechazar**.

### Notificaciones in-app
- **Campana** con contador de no leídas + página `/notificaciones`.
- Avisos automáticos: negocio aprobado/rechazado, reserva nueva (al dueño), confirmada/cancelada/reprogramada (a la otra parte).

### Infra
- Storage: bucket **privado** de comprobantes y **público** de imágenes de negocio (vía service role).
- Conexión a base por el **pooler** de Supabase (la directa es IPv6-only).

---

## 2. Funcionalidades FALTANTES ⏳

### Grandes (del plan marketplace)
- **Cobro online con Mercado Pago**: hoy está *preparado* (método + placeholder de token), falta la integración real (checkout + webhook de confirmación + actualización automática del pago).
- **Reseñas y calificaciones** (estrellas en cards y vitrina) — Fase 4.
- **Favoritos** — Fase 5.
- **Cercanía / geolocalización** (negocios cerca, orden por distancia) — Fase 5.
- **Look & feel mobile-first** (barra inferior tipo app, pulido visual) — Fase 6.

### Medianas / mejoras
- **Notificaciones por email o WhatsApp** (hoy solo in-app).
- **Reportes** para el dueño (ingresos del día/semana, reservas por estado).
- **Bloquear turnos** manualmente desde la agenda (el estado "No disponible" existe pero se crea solo vía excepciones).
- **Reprogramar** permitiendo cambiar **recurso o servicio** (hoy solo fecha/hora).
- Marcar reservas como **completadas** (flujo del estado `completed`).
- **Recuperar contraseña** por autogestión (hoy la resetea un admin).
- **Gestión de usuarios/roles** por el admin (promover/degradar desde la UI).
- **Fotos de servicios** (hoy solo el negocio tiene foto).

### Chicas / deuda técnica
- **Zona horaria**: el negocio guarda `timezone` pero los cálculos usan la hora del servidor; con múltiples zonas puede fallar.
- Inconsistencia de etiqueta: en el perfil el rol `operator` figura como "Operador" y en el header como "Negocio".
- Sin **paginación** en directorio ni listados largos.
- Sin **tests** automatizados.
- Verificación de email en el registro.

---

## 3. Ideas para AVANZAR 💡

### Orden sugerido (por valor vs esfuerzo)
1. **Fase 4 — Reseñas y calificaciones.** Aporta el atractivo visual de las estrellas y confianza; encaja perfecto con el estilo marketplace.
2. **Mercado Pago (cobro online).** Alto valor de negocio; queda enchufar la integración apenas tengas el Access Token.
3. **Fase 6 — Mobile-first.** Barra de navegación inferior, paleta y tipografía; es lo que más "se siente app".
4. **Reportes del dueño.** Panel simple de ingresos y reservas por estado/período.
5. **Favoritos + cercanía (Fase 5).** Descubrimiento personalizado.

### Ideas de producto (más adelante)
- **"Volver a reservar"** desde el historial (1 toque).
- **Promos / destacados** del negocio en la portada.
- **Turnos recurrentes** (ej. todos los lunes) y **bonos/paquetes**.
- **Lista de espera** cuando no hay disponibilidad.
- **Onboarding** guiado para nuevos negocios (cargar servicios/horarios).
- **Reseñas solo tras turno completado** (evita spam).

### Mejoras técnicas recomendadas
- Resolver **zona horaria** por negocio (guardar todo en UTC + convertir).
- Agregar **tests** de los endpoints críticos (reservas, disponibilidad, pagos).
- **Paginación / carga incremental** en el directorio.

---

## 4. Config / pendientes operativos

- `web/.env.local` tiene `MERCADOPAGO_ACCESS_TOKEN=""` a completar cuando se integre el cobro online.
- `SUPABASE_SERVICE_ROLE_KEY` ya cargado (comprobantes e imágenes funcionan).
- Credenciales de acceso del admin: `palmesguillermo@gmail.com` (rol Administrador).

---

## 5. Dónde se hace cada cosa (referencia rápida)

| Quiero... | Voy a... |
|-----------|----------|
| Reservar | `/` → negocio → "Reservar" en un servicio |
| Ver mis turnos | "Mis reservas" |
| Crear/gestionar mi negocio | "Mis negocios" |
| Aprobar negocios (admin) | "Mis negocios" → panel de solicitudes |
| Confirmar/cobrar una reserva | Mi negocio → Reservas → clic en la reserva |
| Configurar horarios/servicios | Mi negocio → pestañas correspondientes |
| Ver notificaciones | 🔔 en el header |
