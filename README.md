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

El catálogo local refleja la carta digital pública de Yalaza: alitas,
hamburguesas, combos y platos, extras y bebidas. Los productos y precios están
definidos en `src/repositories/catalog.repository.ts`; aún no se administran
desde Supabase.

## Pedidos y stock en administración

En `/admin/gestionar` el administrador registra pedidos seleccionando un cliente
existente, productos, cantidades, modalidad y pago. Puede consultar todos los
pedidos y editar o desactivar los pendientes; los que ya están en atención se
conservan. En `/admin/pedidos` la tabla muestra todos los registros, permite
filtrar Activos/Inactivos y ofrece el mismo CRUD. Eliminar es una baja lógica:
conserva el pedido como inactivo y muestra solamente Restaurar. No se puede
editar ni avanzar un pedido inactivo. Al restaurarlo se vuelve a comprobar y
descontar su stock. En `/admin/stock` consulta y ajusta las existencias.

Al abrir la aplicación se insertan 20 clientes de ejemplo automáticamente, sin
duplicarlos ni sobrescribir registros existentes. Sus correos van de
`cliente01@yalaza.test` a `cliente20@yalaza.test`, todos con contraseña
`cliente123`. Los primeros cinco son Jesus Anderson Cuadros Yaranga, Yusef
Llallahui Huaraca, Javier Chavez de la Cruz, Brayan Steven Misaico Chavez y
Nayeli Rocio Herrera Albino. Los teléfonos son ficticios.

También se insertan cinco pedidos pendientes de ejemplo, uno para cada uno de
estos primeros cinco clientes. Tienen identificadores `YZ-DEMO-001` a
`YZ-DEMO-005`, combinan delivery y recojo, y descuentan stock al crearse.
La carga es única: recargar no duplica los ejemplos ni reactiva pedidos
desactivados por el administrador.

Administrador: `admin@yalaza.pe` / `admin123`.
Delivery: `delivery@yalaza.pe` / `delivery123`.

Cada producto comienza con 100 unidades; cada combo se cuenta como una unidad
independiente. Se descuentan al registrar el pedido y se ajustan por diferencia
al editar. Desactivar un pendiente devuelve las unidades; restaurarlo vuelve
a reservarlas y se rechaza si no hay stock suficiente. Pedidos y stock se
guardan juntos para evitar escrituras parciales, y se rechazan cantidades
inválidas o superiores al stock. Al migrar pedidos anteriores se descuentan
sus unidades del stock inicial; recargar no restablece las existencias.

Delivery: Pendiente → Aceptado → En preparación → Preparado → En camino →
Entregado. Recojo: Pendiente → Aceptado → En preparación → Listo para recojo →
Recojo completado. El cliente ve el mismo pedido y su estado actualizado.

La demo comparte pedidos, clientes y stock mediante `localStorage` entre
pestañas del mismo navegador y origen. Las sesiones son independientes por
pestaña, de modo que se puede probar administrador, cliente y delivery a la
vez. No sincroniza otros dispositivos o perfiles; para eso se necesita una
base de datos compartida y autenticación de servidor. Las credenciales de esta
demo se guardan localmente y no deben usarse como autenticación de producción.
