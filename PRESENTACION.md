# Yalaza: guía rápida para presentar

## Accesos de demostración

En **Ingresar**, cambia a **Iniciar sesión** y selecciona el rol.

- Administrador: `admin@yalaza.pe` / `admin123`.
- Repartidor: `delivery@yalaza.pe` / `delivery123`.
- Cliente: `cliente01@yalaza.test` / `cliente123`.

## Recorrido de 3 minutos

1. Abre el dashboard del administrador (`/admin`). El reporte diario muestra ventas completadas, pedidos registrados y pendientes, ticket promedio, ganancia bruta estimada, medios de pago y productos más vendidos. Puedes elegir cualquier fecha y descargar CSV para Excel.
2. Activa **Incluir pedidos de demostración** para ver los cinco pedidos de ejemplo. Comienzan pendientes: no se cuentan como ventas hasta completar su entrega o recojo.
3. En **Stock**, busca productos, filtra agotados o stock bajo y ajusta existencias. El dashboard permite configurar el umbral y el objetivo de reposición.
4. Al final del dashboard, abre **Delivery personalizado**. Configura tarifa general y minutos, o una línea por distrito: `Imperial; 3; 25`. Guarda. Los pedidos nuevos incluyen el costo en el total; los existentes conservan su importe hasta una edición.
5. En **Gestionar pedidos**, registra un pedido para un cliente de ejemplo y muestra cómo descuenta stock. Desactivar un pendiente devuelve sus unidades; restaurarlo vuelve a reservarlas.
6. Abre otra pestaña del mismo navegador e inicia sesión como repartidor o cliente. Muestra el avance y la confirmación por código.

## Publicación y datos compartidos

Abre https://yalaza-alitas.vercel.app desde cualquier dispositivo. Pedidos, stock, clientes y configuración se guardan en Supabase y se actualizan automáticamente aproximadamente cada 2.5 segundos con la página visible. Puedes iniciar sesión como administrador en una computadora y como delivery en un celular para mostrar el mismo pedido y sus cambios. Solo el carrito es local.

Las cuentas conocidas y los pagos siguen siendo de demostración. El reporte diario atribuye ventas a la fecha de entrega/recojo (hora de Perú); para registros antiguos sin fecha de verificación usa la fecha de creación. Las ganancias usan costos editables y no son una utilidad contable verificada.
