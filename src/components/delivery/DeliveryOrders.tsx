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
import { orderStatusLabels } from "@/patterns/behavioral/order-state";

type DeliveryOrder = CustomerOrder & { fulfillmentType: "delivery" };
type DeliverySection = "all" | "active" | "route" | "verify" | "done";
type PaymentFilter = "all" | "cash" | "yape" | "card";

function isDeliveryOrder(order: CustomerOrder): order is DeliveryOrder {
  return order.fulfillmentType === "delivery";
}

export function DeliveryOrders({
  initialSection = "all",
}: {
  initialSection?: DeliverySection;
}) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const {
    orders,
    hydrated,
    acceptOrder,
    advanceOrderStatus,
    markArrived,
    rateCustomer,
    verifyOrder,
  } = useOrder();
  const [navCollapsed, setNavCollapsed] = useState(false);
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

  const revenue = deliveryOrders.reduce((sum, order) => sum + order.total, 0);

  function handleAccept(orderId: string) {
    acceptOrder(orderId, session?.name ?? "Delivery");
    setMessage("Pedido tomado. Revísalo en Ruta de entrega.");
  }

  function handleArrived(orderId: string) {
    markArrived(orderId);
    setMessage("Llegada marcada. Ahora valida el código del cliente.");
    router.push("/delivery/verificar");
  }

  function handleVerify(orderId: string) {
    const result = verifyOrder(orderId, codes[orderId] ?? "");
    setMessage(result ? "Código correcto. Pedido entregado." : "Código incorrecto.");
  }

  function handleLogout() {
    logout();
    router.push("/ingresar");
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
      <section className="min-h-screen bg-[#f9f6f1] text-ink">
        <div className="flex min-h-screen w-full bg-cream">
          <aside
            className={`relative hidden shrink-0 flex-col bg-ember p-5 text-ink shadow-[12px_0_38px_rgba(20,12,9,0.16)] transition-all md:flex ${
              navCollapsed ? "w-24" : "w-64"
            }`}
          >
            <div className="rounded-lg bg-cream p-4">
              <div className={`flex items-center gap-3 ${navCollapsed ? "justify-center" : ""}`}>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-ember font-black text-ink">
                  {session?.name?.charAt(0) ?? "D"}
                </div>
                <div className={`min-w-0 ${navCollapsed ? "hidden" : ""}`}>
                  <p className="truncate text-sm font-black">{session?.name ?? "Delivery"}</p>
                  <p className="text-xs font-bold uppercase text-ink/55">Panel delivery</p>
                </div>
              </div>
            </div>
            <nav className="mt-6 space-y-2">
              <PanelNavItem active={initialSection === "all"} collapsed={navCollapsed} href="/delivery" icon="P" label="Pedidos" />
              <PanelNavItem active={initialSection === "active"} collapsed={navCollapsed} href="/delivery/activos" icon="A" label="Activos" />
              <PanelNavItem active={initialSection === "route"} collapsed={navCollapsed} href="/delivery/ruta" icon="R" label="Ruta" />
              <PanelNavItem active={initialSection === "verify"} collapsed={navCollapsed} href="/delivery/verificar" icon="V" label="Verificar" />
              <PanelNavItem active={initialSection === "done"} collapsed={navCollapsed} href="/delivery/finalizados" icon="F" label="Finalizados" />
            </nav>
            <button
              type="button"
              onClick={() => setNavCollapsed((value) => !value)}
              aria-label={navCollapsed ? "Expandir menú" : "Contraer menú"}
              className="absolute -right-5 bottom-28 z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-[#f9f6f1] bg-cream text-2xl font-black text-ember shadow-[0_10px_24px_rgba(20,12,9,0.24)] transition hover:scale-105"
            >
              {navCollapsed ? "›" : "‹"}
            </button>
            <div className="mt-auto space-y-2">
              <Link href="/" className={`flex w-full rounded-lg bg-cream/90 px-4 py-3 text-sm font-black uppercase text-ink transition hover:bg-white ${navCollapsed ? "justify-center" : ""}`}>
                {navCollapsed ? "W" : "Volver a la web"}
              </Link>
              <button type="button" onClick={handleLogout} className={`flex w-full rounded-lg bg-ink px-4 py-3 text-sm font-black uppercase text-cream transition hover:bg-card ${navCollapsed ? "justify-center" : ""}`}>
                {navCollapsed ? "S" : "Salir"}
              </button>
            </div>
          </aside>

          <div className="grid min-h-screen flex-1 lg:grid-cols-[440px_1fr]">
            <div className="flex min-h-screen flex-col border-r border-ink/10 bg-[#fffaf5]">
              <header className="border-b border-ink/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">Panel delivery</p>
                <h1 className="mt-2 font-display text-5xl leading-none text-ink">{sectionTitle[initialSection]}</h1>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <StatPill label="Delivery" value={deliveryOrders.length} />
                  <StatPill label="Activos" value={activeOrders.length} />
                  <StatPill label="Entregados" value={deliveredOrders.length} />
                  <StatPill label="Total S/" value={Math.round(revenue)} />
                </div>
                <DeliveryFilters
                  districts={districts}
                  district={district}
                  payment={payment}
                  query={query}
                  onDistrictChange={setDistrict}
                  onPaymentChange={setPayment}
                  onQueryChange={setQuery}
                />
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {!hydrated ? (
                  <p className="p-4 text-sm text-ink/60">Cargando pedidos...</p>
                ) : visibleOrders.length === 0 ? (
                  <p className="p-4 text-sm text-ink/60">No hay pedidos con esos filtros.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleOrders.map((order) => (
                      <DeliveryOrderCard
                        key={order.id}
                        order={order}
                        selected={selectedOrder?.id === order.id}
                        onClick={() => setSelectedId(order.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-screen overflow-y-auto bg-[#f9f6f1] p-4 sm:p-7">
              {message ? (
                <p className="mb-4 rounded-full bg-gold px-4 py-2 text-sm font-black uppercase text-ink">
                  {message}
                </p>
              ) : null}
              {initialSection === "route" ? (
                <RouteView orders={visibleOrders} selectedOrder={selectedOrder} onArrived={handleArrived} />
              ) : initialSection === "verify" ? (
                <VerifyView
                  codes={codes}
                  orders={visibleOrders}
                  selectedOrder={selectedOrder}
                  setCodes={setCodes}
                  setSelectedId={setSelectedId}
                  onVerify={handleVerify}
                />
              ) : initialSection === "done" ? (
                <FinishedView orders={visibleOrders} onRate={rateCustomer} />
              ) : selectedOrder ? (
                <DeliveryDetail order={selectedOrder} onAccept={handleAccept} onAdvance={advanceOrderStatus} />
              ) : (
                <EmptyPanel />
              )}
            </div>
          </div>
        </div>
      </section>
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
    <div className="mt-5 space-y-3">
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar cliente, dirección, código..."
        className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink outline-none focus:border-ember"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={district}
          onChange={(event) => onDistrictChange(event.target.value)}
          className="rounded-lg border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink outline-none"
        >
          <option value="all">Todos los distritos</option>
          {districts.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={payment}
          onChange={(event) => onPaymentChange(event.target.value as PaymentFilter)}
          className="rounded-lg border border-ink/10 bg-white px-3 py-3 text-sm font-bold text-ink outline-none"
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
      className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
        selected ? "border-ember bg-ember/10" : "border-ink/10 bg-[#faf7f2]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-2xl text-ink">{order.id.slice(-9)}</span>
        <span className="rounded-full bg-ink px-2 py-1 text-[10px] font-black uppercase text-cream">
          {orderStatusLabels[order.status]}
        </span>
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
  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(20,12,9,0.1)] sm:p-7">
      <DetailHeader order={order} />
      <InfoGrid order={order} />
      <Products order={order} />
      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === "pending" ? (
          <button type="button" onClick={() => onAccept(order.id)} className="rounded-full bg-ember px-5 py-3 text-sm font-black uppercase text-ink hover:bg-flame">
            Aceptar pedido
          </button>
        ) : null}
        {order.status !== "delivered" ? (
          <button type="button" onClick={() => onAdvance(order.id)} className="rounded-full border border-ink/20 px-5 py-3 text-sm font-black uppercase text-ink hover:border-ember">
            Avanzar estado
          </button>
        ) : null}
        <Link href="/delivery/ruta" className="rounded-full bg-gold px-5 py-3 text-sm font-black uppercase text-ink hover:bg-cream">
          Ver ruta
        </Link>
      </div>
    </article>
  );
}

function RouteView({
  onArrived,
  orders,
  selectedOrder,
}: {
  onArrived: (orderId: string) => void;
  orders: DeliveryOrder[];
  selectedOrder: DeliveryOrder | null;
}) {
  const routeOrders = orders.filter((order) => order.status !== "delivered");
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <section className="rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(20,12,9,0.08)]">
        <h2 className="font-display text-4xl text-ink">Ruta simulada</h2>
        <div className="mt-5 overflow-hidden rounded-lg border border-ink/10 bg-[#e9e2d8]">
          <div className="relative h-80 bg-[linear-gradient(135deg,#f9f6f1_25%,#ece3d8_25%,#ece3d8_50%,#f9f6f1_50%,#f9f6f1_75%,#ece3d8_75%)] bg-[length:42px_42px]">
            <div className="absolute left-8 top-8 rounded-full bg-ember px-4 py-2 text-xs font-black uppercase text-ink">Local Yalaza</div>
            {routeOrders.slice(0, 4).map((order, index) => (
              <div
                key={order.id}
                className="absolute grid h-12 w-12 place-items-center rounded-full bg-ink text-sm font-black text-cream shadow-lg"
                style={{
                  left: `${28 + index * 16}%`,
                  top: `${28 + (index % 2) * 28}%`,
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(20,12,9,0.08)]">
        <h2 className="font-display text-4xl text-ink">Paradas</h2>
        <div className="mt-4 space-y-3">
          {routeOrders.length === 0 ? (
            <p className="text-sm text-ink/55">No hay pedidos activos para ruta.</p>
          ) : (
            routeOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-ink/10 bg-[#f9f6f1] p-4">
                <p className="font-display text-2xl text-ink">{order.id.slice(-9)}</p>
                <p className="text-sm font-bold text-ink">{order.fulfillment.address}</p>
                <p className="text-xs text-ink/55">{order.fulfillment.district}</p>
                <button
                  type="button"
                  onClick={() => onArrived(order.id)}
                  className="mt-3 rounded-full bg-ember px-4 py-2 text-xs font-black uppercase text-ink hover:bg-flame"
                >
                  Ya llegué
                </button>
              </div>
            ))
          )}
        </div>
        {selectedOrder ? <p className="mt-4 text-xs font-bold text-ink/45">Seleccionado: {selectedOrder.id}</p> : null}
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
    <section className="rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(20,12,9,0.08)]">
      <h2 className="font-display text-4xl text-ink">Verificar entrega</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full rounded-lg border p-3 text-left ${selectedOrder?.id === order.id ? "border-ember bg-ember/10" : "border-ink/10 bg-[#f9f6f1]"}`}
            >
              <p className="font-display text-2xl text-ink">{order.id.slice(-9)}</p>
              <p className="text-xs font-bold text-ink/55">{order.customer.name}</p>
            </button>
          ))}
        </div>
        {selectedOrder ? (
          <div className="rounded-lg border border-ink/10 bg-[#f9f6f1] p-5">
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
                className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 py-3 text-center font-black text-ink outline-none focus:border-ember"
              />
              <button type="button" onClick={() => onVerify(selectedOrder.id)} className="rounded-full bg-gold px-5 py-3 text-sm font-black uppercase text-ink hover:bg-ember">
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
    <section className="rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(20,12,9,0.08)]">
      <h2 className="font-display text-4xl text-ink">Finalizados</h2>
      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-ink/55">Todavía no hay entregas finalizadas.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-ink/10 bg-[#f9f6f1] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-ink">{order.id.slice(-9)}</p>
                  <p className="text-sm font-bold text-ink">{order.customer.name}</p>
                  <p className="text-xs text-ink/55">{order.fulfillment.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["good", "regular", "bad"] as const).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => onRate(order.id, rating)}
                      className={`rounded-full px-4 py-2 text-xs font-black uppercase ${order.deliveryRating === rating ? "bg-ember text-ink" : "bg-white text-ink/60"}`}
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
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/45">Pedido delivery</p>
        <h3 className="mt-1 font-display text-5xl text-ink">{order.id}</h3>
        <p className="mt-2 text-sm font-bold text-ink/70">
          {[order.customer.name, order.customer.lastName].filter(Boolean).join(" ")} · {order.customer.phone}
        </p>
      </div>
      <span className="rounded-full bg-ember px-4 py-2 text-xs font-black uppercase text-ink">
        {orderStatusLabels[order.status]}
      </span>
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
      <div className="mt-5 rounded-lg border border-ink/10 bg-[#f9f6f1] p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">Dirección</p>
        <p className="mt-2 font-bold text-ink">{order.fulfillment.address}, {order.fulfillment.district}</p>
        <p className="mt-1 text-sm text-ink/60">{order.fulfillment.reference || "Sin referencia"}</p>
      </div>
    </>
  );
}

function Products({ order }: { order: DeliveryOrder }) {
  return (
    <div className="mt-6 border-y border-ink/10 py-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">Productos</p>
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

function EmptyPanel() {
  return (
    <div className="grid min-h-[440px] place-items-center rounded-lg border border-dashed border-ink/20 bg-white text-center">
      <div>
        <p className="font-display text-4xl text-ink">Sin repartos</p>
        <p className="mt-2 text-sm text-ink/60">Los pedidos de delivery aparecerán en este panel.</p>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#f4eee7] p-3">
      <p className="text-[10px] font-black uppercase text-ink/50">{label}</p>
      <p className="font-display text-3xl text-ember">{value}</p>
    </div>
  );
}

function PanelNavItem({
  label,
  icon,
  href,
  active = false,
  collapsed,
}: {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-black uppercase transition ${
        active
          ? "bg-ink text-cream shadow-[0_14px_30px_rgba(20,12,9,0.24)]"
          : "bg-cream/20 text-ink hover:bg-cream/70"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream/90 text-xs text-ink">
        {icon}
      </span>
      <span className={collapsed ? "sr-only" : ""}>{label}</span>
    </Link>
  );
}

function InfoBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-[#f9f6f1] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{children}</p>
    </div>
  );
}
