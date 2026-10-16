"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrder } from "@/components/orders/OrderProvider";
import { formatPrice } from "@/lib/format";
import type { CustomerOrder } from "@/models";
import { getOrderActionLabel } from "@/patterns/behavioral/order-state";
import { PanelShell, PanelMetric, PanelEmpty, OrderStatusBadge } from "@/components/panels/PanelShell";

type DeliveryOrder = CustomerOrder & { fulfillmentType: "delivery" };
type DeliverySection = "all" | "active" | "route" | "verify" | "done";
type PaymentFilter = "all" | "cash" | "yape" | "card";

function isDeliveryOrder(order: CustomerOrder): order is DeliveryOrder {
  return order.active !== false && order.fulfillmentType === "delivery";
}

export function DeliveryOrders({
  initialSection = "all",
}: {
  initialSection?: DeliverySection;
}) {
  const router = useRouter();
  const { session } = useAuth();
  const {
    orders,
    hydrated,
    acceptOrder,
    advanceOrderStatus,
    markArrived,
    rateCustomer,
    verifyOrder,
  } = useOrder();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const deliveryOrders = orders.filter(isDeliveryOrder);
  const activeOrders = deliveryOrders.filter((order) => order.status !== "delivered");
  const deliveredOrders = deliveryOrders.filter((order) => order.status === "delivered");
  const districts = Array.from(
    new Set(deliveryOrders.map((order) => order.fulfillment.district).filter(Boolean)),
  );
  const visibleOrders = useMemo(() => {
    return deliveryOrders.filter((order) => {
      const normalizedQuery = query.trim().toLocaleLowerCase("es");
      const searchable = [
        order.id,
        order.securityCode,
        order.customer.name,
        order.customer.lastName,
        order.customer.phone,
        order.fulfillment.address,
        order.fulfillment.district,
        order.paymentLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");
      const matchesSection =
        initialSection === "done"
          ? order.status === "delivered"
          : initialSection === "all"
            ? true
            : order.status !== "delivered";
      const matchesDistrict =
        district === "all" || order.fulfillment.district === district;
      const matchesPayment = payment === "all" || order.paymentMethod === payment;
      return (
        matchesSection &&
        matchesDistrict &&
        matchesPayment &&
        (normalizedQuery.length === 0 || searchable.includes(normalizedQuery))
      );
    });
  }, [deliveryOrders, district, initialSection, payment, query]);
  const selectedOrder =
    visibleOrders.find((order) => order.id === selectedId) ??
    visibleOrders[0] ??
    null;

  const onTheWay = deliveryOrders.filter(order => order.status === "on_the_way").length;

  function handleAccept(orderId: string) {
    acceptOrder(orderId, session?.name ?? "Delivery");
    setMessage("Pedido tomado. Revísalo en Ruta de entrega.");
  }

  function handleArrived(orderId: string) {
    if (!markArrived(orderId)) {
      setMessage("Primero avanza el pedido hasta En camino.");
      return;
    }
    setMessage("Llegada marcada. Ahora valida el código del cliente.");
    router.push("/delivery/verificar");
  }

  function handleVerify(orderId: string) {
    const result = verifyOrder(orderId, codes[orderId] ?? "");
    setMessage(result ? "Código correcto. Pedido entregado." : "Código incorrecto.");
  }


  const sectionTitle: Record<DeliverySection, string> = {
    all: "Pedidos delivery",
    active: "Pedidos activos",
    route: "Ruta de entrega",
    verify: "Verificar código",
    done: "Finalizados",
  };

  return (
    <RoleGate role="delivery">
      <PanelShell role="delivery" title={sectionTitle[initialSection]}
        description={initialSection === "route" ? "Consulta tus paradas y confirma la llegada al destino." :
          initialSection === "verify" ? "Solicita el código del cliente para completar la entrega." :
          initialSection === "done" ? "Revisa las entregas completadas y califica la atención." :
          "Organiza tus repartos y sigue el avance de cada entrega."}>
        <div className="panel-metrics mb-6">
          <PanelMetric label="Repartos registrados" value={deliveryOrders.length} hint="Pedidos con delivery" icon="orders" />
          <PanelMetric label="Repartos activos" value={activeOrders.length} hint="Pendientes de completar" icon="truck" />
          <PanelMetric label="En camino" value={onTheWay} hint="En ruta al cliente" icon="route" />
          <PanelMetric label="Entregados" value={deliveredOrders.length} hint="Atenciones completadas" icon="check" />
        </div>
        <div className="panel-toolbar">
          <DeliveryFilters districts={districts} district={district} payment={payment} query={query}
            onDistrictChange={setDistrict} onPaymentChange={setPayment} onQueryChange={setQuery} />
        </div>
        {message ? <p role="status" className="panel-notice">{message}</p> : null}
        {!hydrated ? <p className="p-6 text-sm text-ink/60">Cargando repartos...</p> :
          initialSection === "route" ? <RouteView orders={visibleOrders} selectedOrder={selectedOrder} onArrived={handleArrived} /> :
          initialSection === "verify" ? <VerifyView codes={codes} orders={visibleOrders} selectedOrder={selectedOrder} setCodes={setCodes} setSelectedId={setSelectedId} onVerify={handleVerify} /> :
          initialSection === "done" ? <FinishedView orders={visibleOrders} onRate={rateCustomer} /> : (
          <div className="panel-order-layout">
            <section className="panel-order-list" aria-label="Lista de repartos">
              <div className="panel-list-heading"><h2>Repartos</h2><span>{visibleOrders.length}</span></div>
              {visibleOrders.length ? <div className="space-y-3 p-4">{visibleOrders.map(order =>
                <DeliveryOrderCard key={order.id} order={order} selected={selectedOrder?.id === order.id} onClick={() => setSelectedId(order.id)} />)}</div> :
                <PanelEmpty title="Sin repartos" description="Los pedidos que coincidan con tus filtros aparecerán aquí." />}
            </section>
            <div className="min-w-0">{selectedOrder ?
              <DeliveryDetail order={selectedOrder} onAccept={handleAccept} onAdvance={advanceOrderStatus} /> :
              <PanelEmpty title="Todo listo para la siguiente entrega" description="Selecciona un reparto para ver la dirección, los productos y las acciones disponibles." />}</div>
          </div>
        )}
      </PanelShell>
    </RoleGate>
  );
}

function DeliveryFilters({
  district,
  districts,
  onDistrictChange,
  onPaymentChange,
  onQueryChange,
  payment,
  query,
}: {
  district: string;
  districts: string[];
  onDistrictChange: (value: string) => void;
  onPaymentChange: (value: PaymentFilter) => void;
  onQueryChange: (value: string) => void;
  payment: PaymentFilter;
  query: string;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
      <input
        type="search"
        aria-label="Buscar reparto"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar cliente, dirección, código..."
        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ember"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Filtrar por distrito"
          value={district}
          onChange={(event) => onDistrictChange(event.target.value)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink outline-none"
        >
          <option value="all">Todos los distritos</option>
          {districts.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por pago"
          value={payment}
          onChange={(event) => onPaymentChange(event.target.value as PaymentFilter)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink outline-none"
        >
          <option value="all">Todos los pagos</option>
          <option value="cash">Efectivo</option>
          <option value="yape">Yape</option>
          <option value="card">Tarjeta</option>
        </select>
      </div>
    </div>
  );
}

function DeliveryOrderCard({
  onClick,
  order,
  selected,
}: {
  onClick: () => void;
  order: DeliveryOrder;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${
        selected ? "border-ember bg-ember/10" : "border-ink/10 bg-[#f8fafc]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans font-semibold text-lg text-ink">{order.id.slice(-9)}</span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm font-bold text-ink">
        {[order.customer.name, order.customer.lastName].filter(Boolean).join(" ")}
      </p>
      <p className="mt-1 text-xs font-bold text-ink/55">
        {order.fulfillment.address}, {order.fulfillment.district}
      </p>
      <p className="mt-2 text-xs text-ink/50">
        {order.paymentLabel} · {formatPrice(order.total)}
      </p>
    </button>
  );
}

function DeliveryDetail({
  onAccept,
  onAdvance,
  order,
}: {
  onAccept: (orderId: string) => void;
  onAdvance: (orderId: string) => void;
  order: DeliveryOrder;
}) {
  const nextAction = getOrderActionLabel(order.status, order.fulfillmentType);
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm sm:p-7">
      <DetailHeader order={order} />
      <InfoGrid order={order} />
      <Products order={order} />
      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === "pending" ? (
          <button type="button" onClick={() => onAccept(order.id)} className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-ink hover:bg-flame">
            Aceptar pedido
          </button>
        ) : null}
        {nextAction ? (
          <button type="button" onClick={() => onAdvance(order.id)} className="rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-ember">
            {nextAction}
          </button>
        ) : null}
        {order.status === "on_the_way" ? <Link href="/delivery/verificar" className="panel-primary-link">Verificar entrega</Link> : null}
        <Link href="/delivery/ruta" className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink hover:bg-cream">
          Ver ruta
        </Link>
      </div>
    </article>
  );
}

function RouteView({ onArrived, orders, selectedOrder }: {
  onArrived: (orderId: string) => void; orders: DeliveryOrder[]; selectedOrder: DeliveryOrder | null;
}) {
  const routeOrders = orders.filter(order => order.status !== "delivered");
  const destination = selectedOrder?.fulfillment;
  const mapQuery = destination ? (
    destination.latitude != null && destination.longitude != null
      ? `${destination.latitude},${destination.longitude}`
      : `${destination.address}, ${destination.district}, Perú`
  ) : "";
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Destino del pedido</h2>
        {selectedOrder ? <>
          <div className="mt-5 rounded-xl bg-[#f8fafc] p-5">
            <OrderStatusBadge status={selectedOrder.status} />
            <p className="mt-4 text-lg font-semibold">{destination?.address}</p>
            <p className="mt-1 text-sm text-ink/60">{destination?.district}</p>
            <p className="mt-4 text-sm">{selectedOrder.customer.name} {selectedOrder.customer.lastName}</p>
            <a href={`tel:${selectedOrder.customer.phone}`} className="mt-1 inline-block text-sm text-ember">{selectedOrder.customer.phone}</a>
            {destination?.reference ? <p className="mt-3 text-sm text-ink/60">Referencia: {destination.reference}</p> : null}
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer" className="panel-primary-link mt-5">Abrir destino en Google Maps ↗</a>
          <Products order={selectedOrder} />
        </> : <PanelEmpty title="Sin destino seleccionado" description="Los pedidos activos mostrarán aquí la dirección de entrega." />}
      </section>
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Paradas pendientes <span className="ml-2 text-sm font-normal text-ink/50">{routeOrders.length}</span></h2>
        <div className="mt-5 space-y-3">
          {routeOrders.length ? routeOrders.map((order, index) => (
            <div key={order.id} className="flex items-start gap-3 rounded-xl border border-ink/10 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff0e8] text-xs font-semibold text-ember">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{order.fulfillment.address}</p>
                <p className="mt-1 text-xs text-ink/55">{order.fulfillment.district} · {order.customer.name}</p>
                <div className="mt-3"><OrderStatusBadge status={order.status} /></div>
                <button type="button" disabled={order.status !== "on_the_way"} onClick={() => onArrived(order.id)}
                  className="mt-3 rounded-lg bg-ember px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
                  Confirmar llegada
                </button>
              </div>
            </div>
          )) : <PanelEmpty title="Sin paradas pendientes" description="Los pedidos activos aparecerán aquí." />}
        </div>
      </section>
    </div>
  );
}

function VerifyView({
  codes,
  orders,
  selectedOrder,
  setCodes,
  setSelectedId,
  onVerify,
}: {
  codes: Record<string, string>;
  orders: DeliveryOrder[];
  selectedOrder: DeliveryOrder | null;
  setCodes: Dispatch<SetStateAction<Record<string, string>>>;
  setSelectedId: (id: string) => void;
  onVerify: (orderId: string) => void;
}) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-sans font-semibold text-xl text-ink">Verificar entrega</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full rounded-xl border p-3 text-left ${selectedOrder?.id === order.id ? "border-ember bg-ember/10" : "border-ink/10 bg-[#f8fafc]"}`}
            >
              <p className="font-sans font-semibold text-lg text-ink">{order.id.slice(-9)}</p>
              <p className="text-xs font-bold text-ink/55">{order.customer.name}</p>
            </button>
          ))}
        </div>
        {selectedOrder ? (
          <div className="rounded-xl border border-ink/10 bg-[#f8fafc] p-5">
            <DetailHeader order={selectedOrder} />
            <div className="mt-5 flex gap-2">
              <input
                inputMode="numeric"
                maxLength={4}
                value={codes[selectedOrder.id] ?? ""}
                onChange={(event) =>
                  setCodes((current) => ({
                    ...current,
                    [selectedOrder.id]: event.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="Código del cliente"
                className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 py-3 text-center font-semibold text-ink outline-none focus:border-ember"
              />
              <button type="button" onClick={() => onVerify(selectedOrder.id)} className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink hover:bg-ember">
                Validar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FinishedView({
  onRate,
  orders,
}: {
  onRate: (orderId: string, rating: "good" | "regular" | "bad") => CustomerOrder | null;
  orders: DeliveryOrder[];
}) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-sans font-semibold text-xl text-ink">Finalizados</h2>
      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-ink/55">Todavía no hay entregas finalizadas.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-ink/10 bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-sans font-semibold text-lg text-ink">{order.id.slice(-9)}</p>
                  <p className="text-sm font-bold text-ink">{order.customer.name}</p>
                  <p className="text-xs text-ink/55">{order.fulfillment.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["good", "regular", "bad"] as const).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => onRate(order.id, rating)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${order.deliveryRating === rating ? "bg-ember text-ink" : "bg-white text-ink/60"}`}
                    >
                      {rating === "good" ? "Bueno" : rating === "regular" ? "Regular" : "Malo"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DetailHeader({ order }: { order: DeliveryOrder }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-normal text-ink/45">Pedido delivery</p>
        <h3 className="mt-1 font-sans font-semibold text-lg text-ink">{order.id}</h3>
        <p className="mt-2 text-sm font-bold text-ink/70">
          {[order.customer.name, order.customer.lastName].filter(Boolean).join(" ")} · {order.customer.phone}
        </p>
      </div>
      <OrderStatusBadge status={order.status} />
    </header>
  );
}

function InfoGrid({ order }: { order: DeliveryOrder }) {
  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <InfoBox label="Código">{order.status === "pending" ? "Tomar pedido" : order.securityCode}</InfoBox>
        <InfoBox label="Pago">{order.paymentLabel}</InfoBox>
        <InfoBox label="Total">{formatPrice(order.total)}</InfoBox>
      </div>
      <div className="mt-5 rounded-xl border border-ink/10 bg-[#f8fafc] p-4">
        <p className="text-xs font-semibold tracking-normal text-ink/45">Dirección</p>
        <p className="mt-2 font-bold text-ink">{order.fulfillment.address}, {order.fulfillment.district}</p>
        <p className="mt-1 text-sm text-ink/60">{order.fulfillment.reference || "Sin referencia"}</p>
      </div>
    </>
  );
}

function Products({ order }: { order: DeliveryOrder }) {
  return (
    <div className="mt-6 border-y border-ink/10 py-5">
      <p className="text-xs font-semibold tracking-normal text-ink/45">Productos</p>
      <ul className="mt-3 space-y-2 text-sm font-semibold text-ink">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-4">
            <span>{item.quantity} × {item.name}</span>
            <span>{formatPrice(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#f8fafc] p-4">
      <p className="text-xs font-semibold tracking-normal text-ink/45">{label}</p>
      <p className="mt-1 font-sans font-semibold text-lg text-ink">{children}</p>
    </div>
  );
}
