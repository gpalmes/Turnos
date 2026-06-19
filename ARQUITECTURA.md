# Arquitectura — Turnos

Mapa conceptual de lo construido hasta ahora. Los diagramas usan [Mermaid](https://mermaid.js.org/), que GitHub y VS Code (preview de Markdown integrada) renderizan nativamente sin plugins. Se usa solo sintaxis estable desde hace tiempo (`erDiagram`, `flowchart`, `sequenceDiagram`, cardinalidad `}o--o{`, comentarios `%%`) para evitar que algo se vea bien en uno y no en el otro.

## Stack

- **Web**: Next.js 14 (App Router) + TypeScript, sin librería de UI (estilos con Tailwind CSS).
- **API**: Route Handlers de Next.js bajo `web/src/app/api/*` — pensada para compartirse con la futura app mobile (Expo).
- **Base de datos**: PostgreSQL en Supabase, accedida con Prisma.
- **Auth**: Supabase Auth (email/password + Google OAuth).
- **Mobile**: Expo + React Native — placeholder, todavía sin desarrollar.

## 1. Modelo de datos

```mermaid
erDiagram
    USER ||--o{ BUSINESS : "es dueno de (ownerId)"
    USER ||--o{ BOOKING : "reserva (userId)"
    BUSINESS ||--o{ SERVICE : tiene
    BUSINESS ||--o{ RESOURCE : tiene
    BUSINESS ||--o{ SCHEDULE : tiene
    BUSINESS ||--o{ AVAILABILITY : tiene
    BUSINESS ||--o{ BOOKING : recibe
    SERVICE }o--o{ RESOURCE : "disponible en (M:N)"
    SERVICE ||--o{ BOOKING : "reservado como"
    RESOURCE ||--o{ BOOKING : "ocupado en"

    USER {
        string id "UUID de Supabase Auth"
        string email
        string name
        string role "client | operator | admin"
    }
    BUSINESS {
        string id
        string name
        string category "padel, medical, barbershop..."
        string timezone
        int minAdvanceHours "anticipacion minima para reservar"
        int cancellationHours "anticipacion minima para cancelar"
        string ownerId
    }
    SERVICE {
        string id
        string name
        int duration "minutos"
        float price
        string businessId
    }
    RESOURCE {
        string id
        string name
        string type "court, doctor, chair..."
        string businessId
    }
    SCHEDULE {
        string id
        int dayOfWeek "0=domingo ... 6=sabado"
        string startTime "HH:MM"
        string endTime "HH:MM"
        boolean isActive
    }
    AVAILABILITY {
        string id
        date date
        string startTime
        string endTime
        boolean isAvailable "false=cerrado, true=abierto extra"
        string reason
    }
    BOOKING {
        string id
        datetime startTime
        datetime endTime
        string status "pending|confirmed|completed|cancelled"
        string userId
        string businessId
        string serviceId
        string resourceId
    }
```

Notas:
- `Service` ↔ `Resource` es many-to-many implícita en Prisma (sin modelo de join propio): `service.resources` / `resource.services`. Si un `Service` no tiene ningún `Resource` asociado todavía, se trata como "sin restricción" (compatible con negocios que nunca configuraron la asociación).
- `Schedule` tiene un índice único por `(businessId, dayOfWeek, startTime, endTime)` — permite varios bloques el mismo día (turnos partidos, ej. 9-12 y 14-18).
- `Availability` son excepciones puntuales por fecha exacta (feriados, horario especial), distintas del horario semanal recurrente de `Schedule`.

## 2. Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario (browser)
    participant MW as middleware.ts
    participant SA as Supabase Auth
    participant App as Next.js (Server Component / Route Handler)
    participant DB as Prisma (public.User)

    U->>App: Signup (email/password) o Google OAuth
    App->>SA: supabase.auth.signUp() / intercambio de code en /auth/callback
    SA-->>App: sesion (JWT) + cookie
    App->>DB: upsert User (id = UUID de Supabase, role inicial "client")
    App-->>U: cookie de sesion seteada

    U->>MW: cualquier request siguiente
    MW->>SA: supabase.auth.getUser() (revalida el JWT contra el servidor)
    MW-->>U: cookie refrescada si hacia falta

    U->>App: request a una pagina o /api/*
    App->>App: getSessionUser() en web/src/lib/auth.ts
    App->>SA: lee la cookie, valida sesion
    App->>DB: SELECT role, name del User
    App-->>U: { id, email, role, name } o null
```

`getSessionUser()` es el único punto de verdad: lo usan todos los Route Handlers y Server Components para saber quién está logueado y qué rol tiene. `getUser()` (no `getSession()`) se usa a propósito en el middleware porque revalida contra el servidor de Supabase en cada request.

## 3. Roles

```mermaid
flowchart LR
    A[Usuario nuevo] -->|signup o Google| B("role: client")
    B -->|crea su primer negocio<br/>POST /api/businesses| C("role: operator")
    C -.->|asignacion manual en la base<br/>sin panel todavia| D("role: admin")
    D -->|bypassea ownership en<br/>todas las rutas de negocio| E["Puede ver y gestionar<br/>cualquier negocio, no solo el propio"]
```

`operator` es descriptivo, no una puerta de entrada: cualquier usuario puede crear negocios libremente, el rol simplemente refleja que ya tiene al menos uno. `admin` es el único rol con un permiso especial real hoy.

## 4. Cómo se leen y escriben los datos

```mermaid
flowchart TD
    subgraph Lectura["Lectura (Server Components)"]
        P1["/businesses, /businesses/[id]<br/>/bookings, /profile"] -->|Prisma directo, sin pasar por la API| DB[(PostgreSQL)]
    end

    subgraph Escritura["Escritura desde el cliente"]
        C1["Formularios de negocio<br/>(CreateXForm, EditBusinessForm, AssociateResourcesForm...)"] -->|"fetch POST/PATCH/PUT"| API["/api/businesses, /api/services,<br/>/api/resources, /api/schedules,<br/>/api/availability-exceptions, /api/bookings"]
        API -->|Prisma| DB
        C1 -.->|router.refresh tras exito| P1
    end

    subgraph Auth["Auth (Server Actions, no REST)"]
        SA1["login, signup, logout,<br/>profile/actions.ts"] -->|cookies via next/headers| Sup[Supabase Auth]
        SA1 --> DB
    end

    Wizard["BookingFlow.tsx<br/>(wizard publico, sin login)"] -->|fetch GET/POST| API
```

Por qué la mezcla: las páginas de gestión (negocios, reservas, perfil) leen directo con Prisma porque son Server Components — más simple y rápido que un round-trip a la propia API. Las mutaciones de "datos de negocio" (crear servicio, asociar recurso, etc.) pasan por la API REST a propósito, pensada para que la futura app mobile pueda reusarla. Auth usa Server Actions porque está atada 1 a 1 a cookies de Next, algo que mobile resolvería distinto (con el SDK de Supabase directo).

## 5. Flujo de reserva

```mermaid
sequenceDiagram
    participant C as Cliente (BookingFlow.tsx)
    participant API as POST /api/bookings
    participant DB as Prisma

    C->>API: businessId, serviceId, resourceId, startTime
    API->>API: getSessionUser() -> 401 si no hay sesion
    API->>DB: busca el Service (con sus Resource asociados)
    API->>API: si el Service tiene recursos asociados,<br/>resourceId debe estar entre ellos (400 si no)
    API->>DB: busca el Business (minAdvanceHours)
    API->>API: startTime >= ahora + minAdvanceHours? (400 si no)
    API->>DB: busca reservas que se solapen en ese resourceId
    API->>API: hay solapamiento? (409 si si)
    API->>DB: crea el Booking (status: pending)
    API-->>C: 201 + Booking creado
```

Pendiente conocido: `BookingFlow.tsx` todavía no consulta `/api/availability` para mostrar horarios reales — el paso de elegir fecha/hora es un campo libre. El cálculo de disponibilidad (turnos partidos, excepciones) está implementado y validado en el backend, pero no conectado a esta pantalla todavía.

## 6. Rutas API (referencia rápida)

| Ruta | Métodos | Notas |
|---|---|---|
| `/api/businesses` | GET (público), POST (sesión) | `ownerId` siempre de la sesión |
| `/api/businesses/[id]` | PATCH (dueño o admin) | distingue "no enviado" de "enviado vacío" |
| `/api/services` | GET (público), POST (dueño o admin) | |
| `/api/services/[id]/resources` | PUT (dueño o admin) | asocia recursos, valida mismo negocio |
| `/api/resources` | GET (público, filtra por `serviceId`), POST (dueño o admin) | |
| `/api/schedules` | GET (público), POST (dueño o admin) | `upsert`, soporta turnos partidos |
| `/api/availability-exceptions` | GET (público), POST (dueño o admin) | feriados / horario especial |
| `/api/availability` | GET (público) | calcula slots reales, combina `Schedule` + excepciones |
| `/api/bookings` | GET (sesión, solo propias), POST (sesión) | valida asociación, anticipación, solapamiento |
| `/api/bookings/[id]` | PATCH (propio, dueño del negocio, o admin) | solo cancelar por ahora |
