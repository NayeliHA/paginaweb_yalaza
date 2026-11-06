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

## Alcance de la demo

La página está preparada para publicación estática con Next.js. Pedidos, stock, tarifas y costos se guardan en el navegador; comparten cambios entre pestañas del mismo origen, pero no entre dispositivos. Las cuentas y los pagos son de demostración: no se procesan cobros. La integración de una base de datos y autenticación de servidor queda pendiente para uso real.

El reporte diario atribuye ventas a la fecha de entrega/recojo (hora de Perú); para registros antiguos sin fecha de verificación usa la fecha de creación. El reporte semanal conserva el análisis de lunes a viernes por fecha de registro. Las ganancias usan costos editables de ejemplo y no son una utilidad contable verificada.
