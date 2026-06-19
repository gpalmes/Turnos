# Turnos Web

Aplicación web de Next.js para la gestión de turnos.

## Instalación

```bash
cd web
npm install
```

## Variables de entorno

Crear `.env.local` con la cadena de conexión de Supabase (este archivo está en `.gitignore`, nunca se sube a git):
```
DATABASE_URL="postgresql://postgres:<password>@<host>.supabase.co:5432/postgres"
```

## Configurar base de datos

```bash
npm run db:push
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en http://localhost:3000

## Rutas API disponibles

- `GET /api/businesses` - Obtener todos los negocios
- `POST /api/businesses` - Crear un negocio
- `GET /api/services?businessId=xxx` - Obtener servicios de un negocio
- `POST /api/services` - Crear un servicio
- `GET /api/resources?businessId=xxx` - Obtener recursos de un negocio
- `POST /api/resources` - Crear un recurso
- `GET /api/bookings?businessId=xxx` - Obtener reservas
- `POST /api/bookings` - Crear una reserva
- `GET /api/availability?businessId=xxx&resourceId=yyy&date=YYYY-MM-DD` - Obtener disponibilidad

## Estructura

- `/src/app` - Páginas y rutas API
- `/src/components` - Componentes React reutilizables
- `/src/lib` - Utilidades y configuración (Prisma, etc.)
- `/prisma` - Esquema de base de datos
