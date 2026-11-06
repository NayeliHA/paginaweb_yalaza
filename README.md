# Yalaza — Vercel + Supabase

Sitio publicado: https://yalaza-alitas.vercel.app

## Estado actual

Los pedidos, clientes, existencias, tarifas de delivery y costos del dashboard se guardan en Supabase. La app consulta cambios cada 2.5 segundos mientras está visible y al recuperar conexión/foco. Las sesiones son independientes por pestaña; solo el carrito permanece en el navegador.

Next.js sirve `/api/store/`. El servidor valida las sesiones y los roles, calcula precios desde el catálogo y aplica cada cambio de pedido junto con el stock mediante una actualización atómica con revisión. Si dos dispositivos compiten por las últimas unidades, uno recibe un error de stock; no se sobrescribe la operación del otro.

La tabla tiene RLS y no admite acceso directo desde clientes públicos. El puente de Supabase verifica una credencial de servidor; las claves de servicio no se envían al navegador. Las contraseñas se guardan como hashes scrypt y los tokens de sesión como hashes SHA-256.

## Configuración

Variables privadas en `.env.local` y en Vercel (Production y Preview):

- `SUPABASE_URL`
- `YALAZA_DATABASE_SECRET`

El puente está en `supabase/functions/yalaza-database/index.ts`; su hash debe corresponder a la credencial privada. El esquema está en `supabase/migrations/202611060001_shared_store.sql`. El proyecto usa la base Supabase `wnlyizahktkdehxyjlgt` y el proyecto Vercel `undc1/yalaza-alitas`.

Ejecutar: `npm run dev`. Validar: `npm test` y `npm run build`. Publicar desde esta carpeta: `vercel deploy --project yalaza-alitas --scope undc1 --prod`. Las variables están guardadas en Vercel.

## Accesos académicos

- Administrador: `admin@yalaza.pe` / `admin123`.
- Delivery: `delivery@yalaza.pe` / `delivery123`.
- Cliente: `cliente01@yalaza.test` / `cliente123`.

Los pagos siguen siendo una simulación, sin cobro bancario. Los accesos conocidos son de demostración; usar esta instancia para la presentación académica.

## Versiones anteriores

Los servicios y repositorios locales antiguos permanecen como referencia de la arquitectura y sus pruebas; los proveedores activos de la interfaz usan `cloud-state.service.ts`. Los datos del antiguo dominio de ChatGPT o de navegadores locales no se importan automáticamente a la base compartida.
