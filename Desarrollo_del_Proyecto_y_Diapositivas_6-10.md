# 6. Desarrollo del Proyecto

## 6.1 Descripción del proyecto

El proyecto Yalaza consiste en una aplicación web para presentar el menú de un restaurante de alitas y organizar la experiencia de pedido para clientes, personal de administración y reparto. La aplicación cuenta con páginas para el inicio, menú, carrito, registro e inicio de sesión, consulta de pedidos y paneles de administración y delivery. El negocio de referencia está ubicado en Imperial, provincia de Cañete.

El trabajo combina una implementación funcional de interfaz y flujos básicos con una arquitectura preparada para crecer. Para describir su estado con precisión, se distingue entre las funciones demostrables en la aplicación actual y las integraciones que todavía requieren una base de datos o servicios externos.

## 6.2 Problema y necesidad atendida

Un restaurante que recibe pedidos debe comunicar su oferta, recoger los datos del cliente, identificar productos y cantidades, acordar la modalidad de entrega y hacer seguimiento a la preparación. Cuando estos datos se manejan por canales separados, puede ser difícil mantener una referencia ordenada del pedido y comunicar sus detalles al personal.

La aplicación organiza ese recorrido en una experiencia web: el cliente consulta productos, arma un carrito y completa los datos del pedido; la interfaz presenta paneles diferenciados para revisar pedidos de administración y delivery. Además, puede preparar un resumen para continuar la coordinación por WhatsApp. En esta versión académica, los pedidos se guardan en el navegador y no se transmiten automáticamente a un sistema central del restaurante.

## 6.3 Objetivos de desarrollo

- Construir una interfaz web adaptable para presentar los productos de Yalaza.
- Permitir explorar el menú, seleccionar productos y revisar el carrito.
- Recopilar los datos requeridos para pedidos de delivery o recojo.
- Representar el ciclo de vida de un pedido y mostrar vistas según el perfil de usuario.
- Aplicar una estructura modular y patrones de diseño que faciliten el mantenimiento y una futura integración con servicios persistentes.

## 6.4 Tecnologías y organización

La aplicación está construida con Next.js usando App Router, React y TypeScript, con Tailwind CSS para los estilos. La navegación se organiza mediante rutas de la aplicación; los componentes reutilizables se agrupan por áreas como inicio, menú, pedidos, autenticación, administración y delivery.

El código separa responsabilidades en las siguientes áreas:

- **Presentación:** `src/app` define las páginas y rutas; `src/components` contiene la interfaz y componentes reutilizables.
- **Control y servicios:** `src/controllers` coordina operaciones de catálogo, autenticación y pedidos; `src/services` concentra reglas y estados de aplicación.
- **Modelos:** `src/models` define las estructuras de usuarios, productos, carrito y pedidos.
- **Repositorios:** `src/repositories` abstrae el acceso al catálogo y a los datos guardados en el navegador. El repositorio de clientes usa `localStorage`.
- **Patrones:** `src/patterns` contiene implementaciones de patrones creacionales, estructurales y de comportamiento.

La documentación del proyecto indica que Supabase y Vercel se incorporarán posteriormente. Por ello, no se presentan como servicios ya conectados.

## 6.5 Funciones implementadas en la aplicación

1. **Presentación del catálogo:** incorpora los 26 productos y precios publicados en la carta digital de Yalaza, agrupados en alitas, hamburguesas, combos y platos, extras y bebidas. El catálogo está definido en el código y todavía no se administra desde una base de datos.
2. **Carrito y pedido:** permite agregar productos, indicar cantidades y completar información de contacto. El formulario contempla delivery y recojo, además de opciones de pago como efectivo, Yape y tarjeta.
3. **Resumen del pedido:** calcula subtotal y total, genera un identificador y un código de seguridad, y muestra los datos antes de continuar.
4. **Coordinación por WhatsApp:** construye un enlace con el resumen del pedido usando el número publicado en la carta digital (+51 947 228 198). El enlace abre WhatsApp para que el usuario confirme la coordinación; no constituye una pasarela de pago ni un envío automático al sistema del local.
5. **Consulta y seguimiento:** existen vistas para que el cliente consulte pedidos y para que administración o delivery revisen pedidos, filtren información y actualicen estados dentro de la experiencia local.
6. **Paneles por perfil:** hay rutas para cliente, administrador y delivery, con controles de interfaz asociados al rol.

## 6.6 Flujo principal de atención

El cliente entra al sitio y revisa el menú. Agrega productos al carrito, revisa las cantidades y avanza al formulario. Allí ingresa sus datos, selecciona delivery o recojo y elige un método de pago para mostrar las instrucciones correspondientes. La aplicación valida campos básicos, calcula el importe y construye el pedido con sus productos, modalidad, estado inicial e identificador.

El pedido queda guardado en el almacenamiento local del navegador. La pantalla ofrece la opción de abrir un resumen en WhatsApp cuando el número del negocio está configurado. En los paneles disponibles, el personal puede revisar pedidos y avanzar estados conforme al flujo previsto: para delivery, pendiente, aceptado, en preparación, en camino y entregado; para recojo, pendiente, aceptado, en preparación, listo para recojo y recojo completado.

Como el almacenamiento es local, esos datos no se comparten automáticamente entre el navegador del cliente, el administrador y el repartidor. La demostración de los paneles no equivale todavía a una operación conectada en tiempo real.

## 6.7 Patrones de diseño aplicados

- **Builder (creacional):** `OrderBuilder` arma un pedido paso a paso y verifica que incluya los datos obligatorios antes de construirlo.
- **Factory (creacional):** `EntregaFactory` selecciona la modalidad de delivery o recojo y genera los datos asociados a esa modalidad.
- **Adapter (estructural):** los procesadores de efectivo, Yape y tarjeta ofrecen una interfaz común para preparar instrucciones de pago. En el caso de tarjeta, el código reserva el punto de integración, pero no ejecuta un cobro real.
- **State (comportamiento):** define qué estado puede seguir según la modalidad del pedido.
- **Observer (comportamiento):** permite notificar a suscriptores cuando cambia el estado de un pedido.
- **Facade (estructural):** `OrderFacade` concentra las operaciones de carrito y pedidos para que los componentes no dependan directamente de todos los detalles internos.

Estos patrones organizan el código y hacen visibles las decisiones arquitectónicas del curso; su presencia no implica que exista una infraestructura de producción.

## 6.8 Validaciones y alcance actual

El sistema valida datos básicos del cliente, formato del celular peruano, campos necesarios para delivery, disponibilidad del producto en el catálogo definido y que el carrito contenga productos. El repositorio local maneja errores de lectura del almacenamiento para evitar que datos JSON inválidos interrumpan la carga.

El alcance actual es una aplicación académica demostrable. Los pedidos, el carrito y parte del estado de autenticación se mantienen en el navegador mediante `localStorage`; no hay persistencia central, sincronización entre dispositivos ni transmisión automática de pedidos a una consola del restaurante. Los datos de catálogo son de ejemplo. No se debe afirmar que existe control real de inventario, pago con tarjeta, notificaciones automáticas o operación de delivery en producción. La configuración real del número de WhatsApp, dirección de recojo, tarifa de reparto y datos comerciales debe confirmarse con el restaurante.

## 6.9 Etapas de desarrollo y entregables

El trabajo se organizó en estas etapas: (1) identificación del contexto del restaurante y delimitación del problema; (2) definición de actores y requisitos; (3) diseño del flujo de pedido; (4) creación de páginas y componentes web; (5) organización de modelos, servicios, repositorios y patrones; y (6) documentación de la arquitectura y revisión de la correspondencia entre la aplicación y sus diagramas.

Como entregables se cuenta con el código fuente de la aplicación, sus pantallas de navegación y operación, los patrones implementados y el documento de modelado arquitectónico. Para una versión operativa con varios usuarios, el siguiente paso técnico es integrar autenticación segura y una base de datos compartida, y luego conectar las notificaciones y pagos que el negocio decida utilizar.

---

# Guion para las diapositivas 6 a 10

## Diapositiva 6 — Desarrollo del proyecto

**En la diapositiva**

- Aplicación web para el restaurante Yalaza, especializado en alitas.
- Sitio y paneles para cliente, administrador y delivery.
- Tecnologías: Next.js, React, TypeScript y Tailwind CSS.
- Objetivo: ordenar la consulta del menú y el flujo de pedidos.

**Qué decir:** “En esta parte presentamos el desarrollo del proyecto. Construimos una aplicación web para Yalaza, restaurante de alitas de Imperial, Cañete. El usuario puede revisar el menú y preparar un pedido, mientras que la aplicación incluye vistas para consultar y gestionar pedidos. La interfaz se desarrolló con Next.js, React y TypeScript.”

## Diapositiva 7 — Funciones y flujo de pedido

**En la diapositiva**

1. Revisar menú y elegir productos.
2. Agregar productos al carrito.
3. Ingresar datos y elegir delivery o recojo.
4. Seleccionar método de pago y confirmar.
5. Consultar el estado del pedido y coordinar por WhatsApp.

**Qué decir:** “El flujo empieza en el menú. El cliente elige productos y los agrega al carrito; después ingresa sus datos, define si solicita delivery o recojo y selecciona una forma de pago. El sistema calcula el importe, genera un código de pedido y presenta un resumen. Si está configurado el número del restaurante, el cliente puede continuar la coordinación en WhatsApp.”

## Diapositiva 8 — Organización de la aplicación

**En la diapositiva**

- Presentación: páginas y componentes de la interfaz.
- Control y servicios: operaciones y reglas de negocio.
- Modelos: usuarios, productos, carrito y pedidos.
- Repositorios: acceso al catálogo y almacenamiento local.
- Patrones: Builder, Factory, Adapter, State, Observer y Facade.

**Qué decir:** “Separamos el código por responsabilidades. Las páginas y componentes muestran la interfaz; los controladores y servicios coordinan las operaciones; los modelos definen los datos; y los repositorios organizan su lectura y escritura. Esta separación ayuda a mantener el sistema y permite reemplazar el almacenamiento local por una base de datos compartida en una etapa posterior.”

## Diapositiva 9 — Patrones aplicados al pedido

**En la diapositiva**

- **Builder:** construye el pedido con sus datos obligatorios.
- **Factory:** selecciona delivery o recojo.
- **Adapter:** unifica las instrucciones de pago.
- **State:** controla la secuencia de estados.
- **Observer:** comunica cambios de estado a los suscriptores.
- **Facade:** concentra las operaciones principales de pedidos.

**Qué decir:** “Aplicamos patrones para resolver responsabilidades concretas. Por ejemplo, Builder arma el pedido; Factory crea la modalidad de entrega; y State evita mezclar los recorridos de delivery y recojo. Adapter ofrece una interfaz común para las opciones de pago, aunque todavía no se procesa un cobro real con tarjeta.”

## Diapositiva 10 — Estado actual y siguiente etapa

**En la diapositiva**

- Hay una aplicación web navegable con menú, carrito, formulario y paneles.
- El carrito y los pedidos se guardan en el navegador (`localStorage`).
- Los datos no se sincronizan entre dispositivos ni con el restaurante.
- Próxima etapa: conectar base de datos y autenticación segura.
- Confirmar con Yalaza precios, productos, WhatsApp y tarifa de delivery.

**Qué decir:** “La aplicación permite demostrar el recorrido de pedido y la organización del software. En esta versión académica, los datos se guardan localmente en el navegador, por eso no se comparten automáticamente entre cliente, administración y delivery. Para ponerla en operación se necesita una base de datos central, autenticación segura y confirmar la información comercial del restaurante. Así presentamos claramente qué está construido y qué queda como trabajo futuro.”

## Recursos visuales sugeridos

- Diapositivas 6 y 7: capturas del inicio, menú, carrito y formulario de pedido.
- Diapositivas 8 y 9: esquema simple de capas y un ejemplo del ciclo de estados.
- Diapositiva 10: flujo “versión académica → integración futura” con `localStorage` y base de datos compartida.

Usa capturas de la web del proyecto como evidencia y evita presentar como reales los precios, datos de pago, dirección, integración de WhatsApp o inventario si no han sido confirmados por el restaurante.

**Fuente del catálogo:** [Carta digital de Yalaza](https://yalazas-carta.vercel.app/), consultada el 15 de octubre de 2026.
