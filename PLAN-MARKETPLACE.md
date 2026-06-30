# Turnos → "El PedidosYa de los turnos" — Plan del giro

> Proyecto para transformar Turnos de una herramienta de reservas a un **marketplace
> de consumo**: el cliente descubre negocios de forma visual y reserva fácil; el dueño
> publica su "vitrina", gestiona y cobra.
>
> Complementa a [ESTADO-DEL-PROYECTO.md](ESTADO-DEL-PROYECTO.md).
> Creado: 2026-06-29.

---

## La visión en una frase

**Igual que en PedidosYa elegís un local y pedís comida, en Turnos elegís un negocio
y reservás un turno.** La "carta" del negocio son sus **servicios**; el "pedido" es la
**reserva**. La experiencia es visual, rápida y pensada para el celular.

### Equivalencias

| PedidosYa | Turnos |
|-----------|--------|
| Locales / restaurantes | Negocios |
| Categorías (sushi, pizza…) | Rubros (pádel, médico, barbería…) |
| Carta / productos | Servicios |
| Carrito / pedido | Reserva |
| Repartidor / entrega | Recurso + horario del turno |
| Calificación del local | Reseña del negocio |

---

## Cómo lo vamos a hacer

Avanzamos **una fase por vez**, cada una usable y verificable antes de pasar a la
siguiente. No arrancamos la fase siguiente hasta probar la anterior.

Marcado: ✅ ya existe · 🔨 hay que construir · 🆕 dato/tabla nuevo.

---

## Fase 0 — Destrabar la base (antes de cualquier giro)

Para poder probar todo de punta a punta.

- [ ] 🔨 Login funcionando (entrar como dueño y como cliente).
- [ ] 🔨 Cargar `SUPABASE_SERVICE_ROLE_KEY` en `web/.env.local` (para subir archivos).
- [ ] 🔨 Unificar `web/.env` al pooler (hoy tiene la URL directa rota).

**Resultado:** la app actual anda completa de punta a punta.

---

## Fase 1 — La portada marketplace (la cara nueva) ⭐

El cambio más visible. Rehacer la home como vidriera de negocios.

- [ ] 🆕 Agregar **imagen/logo** al negocio (`imageUrl`) + subida a Supabase Storage.
- [ ] 🔨 **Cards visuales**: foto, nombre, rubro, estado **Abierto/Cerrado ahora**
      (calculado desde los horarios), badge "Con disponibilidad".
- [ ] 🔨 **Rubros como chips/íconos** arriba, para filtrar de un toque.
- [ ] 🔨 **Buscador** por nombre.
- [ ] 🔨 Diseño en grilla tipo app, mobile-first.

**Resultado:** entrar a la app se siente como abrir PedidosYa.

---

## Fase 2 — La vitrina del negocio (storefront)

Convertir `/reservar/[id]` en una página atractiva.

- [ ] 🔨 Encabezado con **foto de portada**, logo, rubro, dirección, estado abierto.
- [ ] 🔨 **Servicios destacados** como tarjetas (foto opcional, precio, duración) con
      botón "Reservar" directo.
- [ ] ✅ Calendario de disponibilidad y flujo de reserva (ya está, se reacomoda visualmente).

**Resultado:** el negocio tiene una "carta" linda y reservar es 2 toques.

---

## Fase 3 — Búsqueda y filtros potentes

- [ ] 🔨 Filtros combinables: rubro + abierto ahora + con disponibilidad + texto.
- [ ] 🔨 Orden: más cercanos / mejor puntuados / alfabético.

**Resultado:** encontrar el negocio justo es rápido.

---

## Fase 4 — Reseñas y calificaciones

- [ ] 🆕 Tabla **Review** (rating 1–5, comentario, userId, businessId, fecha).
- [ ] 🔨 Dejar reseña **después de un turno completado**.
- [ ] 🔨 Mostrar **promedio y cantidad** en las cards y en la vitrina.

**Resultado:** confianza social, como las estrellitas de PedidosYa.

---

## Fase 5 — Descubrimiento: favoritos y cercanía

- [ ] 🆕 Tabla **Favorite** (userId, businessId).
- [ ] 🔨 Marcar/ver favoritos.
- [ ] 🆕 Ubicación del negocio (zona o lat/lng) + filtro **"cerca tuyo"**.

**Resultado:** descubrimiento personalizado.

---

## Fase 6 — Look & feel mobile-first

- [ ] 🔨 **Barra de navegación inferior** tipo app (Inicio · Buscar · Mis turnos · Perfil).
- [ ] 🔨 Paleta, tipografía e íconos coherentes.
- [ ] 🔨 Estados de carga (skeletons), animaciones suaves.

**Resultado:** se siente una app nativa.

---

## Fase 7 — Extras tipo PedidosYa (más adelante)

- [ ] Notificaciones (email/push) al confirmar/cancelar.
- [ ] "Volver a reservar" desde el historial.
- [ ] Promos / destacados del negocio.
- [ ] Pagos online (no solo registro manual).

---

## Resumen de cambios en el modelo de datos

Lo nuevo que va a hacer falta:

- **Business**: `imageUrl` (logo/portada), ubicación (`zona` o `lat`/`lng`).
- **Service**: `imageUrl` opcional.
- **Review** (nueva): rating, comentario, usuario, negocio.
- **Favorite** (nueva): usuario ↔ negocio.

> Lo que ya existe (negocios, servicios, recursos, horarios, reservas, pagos) **se
> mantiene**: este giro es sobre todo de **experiencia y presentación**, no rehace el motor.

---

## Por dónde arrancar

**Fase 0 → Fase 1.** Primero dejamos la app andando de punta a punta, y después
encaramos la portada marketplace, que es el cambio que más se ve y más motiva.

Cada fase la cerramos con una prueba concreta en pantalla antes de seguir.
