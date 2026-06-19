# Turnos

Sistema de gestión de turnos adaptable para múltiples rubos: canchas de pádel, clínicas médicas, barberías, y más.

## Estructura del proyecto

```
Turnos/
├── web/           # Frontend web con Next.js
├── mobile/        # App móvil con Expo + React Native
├── PLAN.md        # Plan de desarrollo y roadmap
└── README.md      # Este archivo
```

## Tecnologías

- **Frontend web**: Next.js 14 (App Router) + Tailwind CSS
- **App móvil**: Expo + React Native (placeholder, todavía sin desarrollar)
- **Backend/API**: Next.js API routes
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autenticación**: Supabase Auth (email/password + Google OAuth)
- **Lenguaje**: TypeScript

## Quickstart

### Web

```bash
cd web
npm install
```

Crear `web/.env.local` con `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver [web/README.md](web/README.md)).

```bash
npm run db:push
npm run dev
```

Acceder a http://localhost:3000

### Mobile

```bash
cd mobile
npm install
npm run start
```

## Funcionalidades implementadas

- ✅ Autenticación (email/password + Google), perfiles y roles (cliente/operador/administrador)
- ✅ Gestión de negocios: datos, servicios, recursos (y su asociación), horario semanal y excepciones puntuales
- ✅ Flujo de reserva en web (4 pasos), con validación de solapamientos y anticipación mínima
- ✅ Cancelación de reservas con ventana configurable por negocio
- ✅ Diseño visual básico (Tailwind) en toda la app
- ⏳ App móvil
- ⏳ Conectar el wizard de reserva a la disponibilidad real (hoy la fecha/hora es un campo libre)
- ⏳ Dashboard de administración y reportes

Ver [ARQUITECTURA.md](ARQUITECTURA.md) para el mapa conceptual (modelo de datos, auth, roles, flujos) y [PLAN.md](PLAN.md) para el roadmap completo.

## Contribución

Para más detalles sobre cómo ejecutar cada componente, ver:
- [web/README.md](web/README.md) - Setup de la aplicación web
- [mobile/README.md](mobile/README.md) - Setup de la aplicación móvil

