This is a Next.js project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Yalaza

Proyecto académico de Arquitectura de Software para un emprendimiento de comida rápida especializado en alitas.

Stack: Next.js (App Router), React, TypeScript, Tailwind CSS, pnpm. Supabase y Vercel se incorporarán más adelante.

## Getting Started

Primero instala dependencias y arranca el servidor de desarrollo:

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Arquitectura

El código de `src` está organizado en capas:

- Presentación: `app/`, `components/`
- Lógica de negocio: `controllers/`, `services/`
- Persistencia: `repositories/`, `lib/supabase/`
- Modelos y patrones: `models/`, `patterns/`

## Flujo del cliente

El menú se obtiene mediante `catalog.controller` → `catalog.service` →
`catalog.repository`. El carrito y los pedidos se coordinan con
`order.controller` → `order.service` → `customer.repository`; por ahora este
último usa `localStorage` en el navegador y no constituye un registro real del
negocio.

El número de WhatsApp y la dirección de recojo se centralizan en
`src/lib/business-config.ts`. Se pueden configurar con las variables públicas
`NEXT_PUBLIC_YALAZA_WHATSAPP_NUMBER` (formato internacional, solo dígitos) y
`NEXT_PUBLIC_YALAZA_PICKUP_ADDRESS` en `.env.local`. No se incluyen secretos.
La tarifa de delivery permanece en cero hasta que el negocio defina su costo.

Los estados y cambios preparados son Pendiente → En preparación → En camino →
Entregado para delivery, y Pendiente → En preparación → Listo para recojo →
Recojo completado para recojo. Aún no existe una vista administrativa que los
actualice ni sincronización entre dispositivos.
