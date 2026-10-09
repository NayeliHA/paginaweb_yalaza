"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleGate } from "@/components/auth/RoleGate";
import { useOrder } from "@/components/orders/OrderProvider";
import { formatPrice } from "@/lib/format";
import type { CustomerOrder, FulfillmentType, PaymentMethod } from "@/models";
import { orderStatusLabels } from "@/patterns/behavioral/order-state";

type AdminFilter = "all" | FulfillmentType;
type AdminSection = "dashboard" | "all" | "pickup" | "delivery" | "verification";
type PaymentFilter = "all" | PaymentMethod;

const filters: { value: AdminFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pickup", label: "Recojo" },
  { value: "delivery", label: "Delivery" },
];

export function AdminOrders({
  initialSection = "dashboard",
}: {
  initialSection?: AdminSection;
}) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { orders, hydrated, acceptOrder, advanceOrderStatus, verifyOrder } =
    useOrder();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [filter, setFilter] = useState<AdminFilter>(
    initialSection === "pickup"
      ? "pickup"
      : initialSection === "delivery"
        ? "delivery"
        : "all",
  );
  const [search, setSearch] = useState("");
  const [verificationFulfillment, setVerificationFulfillment] =
    useState<AdminFilter>("all");
  const [verificationPayment, setVerificationPayment] =
    useState<PaymentFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const filteredOrders = useMemo(() => {
    if (section === "verification") {
      return orders.filter(
        (order) => {
          const query = search.trim().toLocaleLowerCase("es");
          const matchesStatus =
            order.status !== "delivered" && order.status !== "picked_up";
          const matchesFulfillment =
            verificationFulfillment === "all" ||
            order.fulfillmentType === verificationFulfillment;
          const matchesPayment =
            verificationPayment === "all" ||
            order.paymentMethod === verificationPayment;
          const searchable = [
            order.id,
            order.securityCode,
            order.customer.name,
            order.customer.lastName,
            order.customer.phone,
            order.paymentLabel,
            order.fulfillmentType === "delivery" ? "delivery" : "recojo",
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("es");
          return (
            matchesStatus &&
            matchesFulfillment &&
            matchesPayment &&
            (query.length === 0 || searchable.includes(query))
          );
        },
      );
    }
    if (filter === "all") return orders;
    return orders.filter((order) => order.fulfillmentType === filter);
  }, [
    filter,
    orders,
    search,
    section,
    verificationFulfillment,
    verificationPayment,
  ]);
  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedId) ??
    filteredOrders[0] ??
    null;
  const pickupOrders = orders.filter((order) => order.fulfillmentType === "pickup");
  const deliveryOrders = orders.filter(
    (order) => order.fulfillmentType === "delivery",
  );
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const activeOrders = orders.filter(
    (order) => order.status !== "delivered" && order.status !== "picked_up",
  );
  const finishedOrders = orders.filter(
    (order) => order.status === "delivered" || order.status === "picked_up",
  );
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const averageTicket = orders.length > 0 ? revenue / orders.length : 0;
  const yapeOrders = orders.filter((order) => order.paymentMethod === "yape");
  const cashOrders = orders.filter((order) => order.paymentMethod === "cash");
  const cardOrders = orders.filter((order) => order.paymentMethod === "card");

  function handleVerify(orderId: string) {
    const result = verifyOrder(orderId, codes[orderId] ?? "");
    setMessage(
      result
        ? `Pedido ${orderId.slice(-6)} verificado.`
        : "Código incorrecto.",
    );
  }

  function handleLogout() {
    logout();
    router.push("/ingresar");
  }

  const sectionTitle: Record<AdminSection, string> = {
    dashboard: "Dashboard",
    all: "Pedidos totales",
    pickup: "Recojo en tienda",
    delivery: "Pedidos delivery",
    verification: "Verificación",
  };

  return (
    <RoleGate role="admin">
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
                  {session?.name?.charAt(0) ?? "A"}
                </div>
                <div className={`min-w-0 ${navCollapsed ? "hidden" : ""}`}>
                  <p className="truncate text-sm font-black">
                    {session?.name ?? "Administrador"}
                  </p>
                  <p className="text-xs font-bold uppercase text-ink/55">
                    Panel administrador
                  </p>
                </div>
              </div>
            </div>
            <nav className="mt-6 space-y-2">
              <PanelNavItem active={section === "dashboard"} collapsed={navCollapsed} href="/admin" icon="D" label="Dashboard" />
              <PanelNavItem active={section === "all"} collapsed={navCollapsed} href="/admin/pedidos" icon="T" label="Pedidos totales" />
              <PanelNavItem active={section === "pickup"} collapsed={navCollapsed} href="/admin/recojo" icon="R" label="Recojo en tienda" />
              <PanelNavItem active={section === "delivery"} collapsed={navCollapsed} href="/admin/delivery" icon="E" label="Pedidos delivery" />
              <PanelNavItem active={section === "verification"} collapsed={navCollapsed} href="/admin/verificacion" icon="V" label="Verificación" />
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
              <Link
                href="/"
                className={`flex w-full rounded-lg bg-cream/90 px-4 py-3 text-sm font-black uppercase text-ink transition hover:bg-white ${navCollapsed ? "justify-center" : ""}`}
              >
                {navCollapsed ? "W" : "Volver a la web"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`flex w-full rounded-lg bg-ink px-4 py-3 text-sm font-black uppercase text-cream transition hover:bg-card ${navCollapsed ? "justify-center" : ""}`}
              >
                {navCollapsed ? "S" : "Salir"}
              </button>
            </div>
          </aside>

          <div className="grid min-h-screen flex-1 lg:grid-cols-[420px_1fr]">
            <div className="flex min-h-screen flex-col border-r border-ink/10 bg-[#fffaf5]">
              <header className="border-b border-ink/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">
                  Panel administrador
                </p>
                <h1 className="mt-2 font-display text-5xl leading-none text-ink">
                  {sectionTitle[section]}
                </h1>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <StatPill label="Total" value={orders.length} />
                  <StatPill label="Activos" value={activeOrders.length} />
                  <StatPill label="Recojo" value={pickupOrders.length} />
                  <StatPill label="Delivery" value={deliveryOrders.length} />
                </div>
                {section === "dashboard" ? (
                  <p className="mt-5 rounded-lg bg-[#f4eee7] px-4 py-3 text-sm font-bold leading-6 text-ink/65">
                    Vista general del negocio: pedidos, ingresos, modalidades,
                    métodos de pago y estado operativo.
                  </p>
                ) : section === "verification" ? (
                  <VerificationFilters
                    search={search}
                    fulfillment={verificationFulfillment}
                    payment={verificationPayment}
                    onSearchChange={setSearch}
                    onFulfillmentChange={(value) => {
                      setVerificationFulfillment(value);
                      setSelectedId(null);
                    }}
                    onPaymentChange={(value) => {
                      setVerificationPayment(value);
                      setSelectedId(null);
                    }}
                  />
                ) : (
                  <div className="mt-5 flex rounded-full bg-[#f4eee7] p-1">
                    {filters.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSection(option.value === "all" ? "all" : option.value);
                          setFilter(option.value);
                          setSelectedId(null);
                        }}
                        className={`flex-1 rounded-full px-3 py-2 text-xs font-black uppercase transition ${
                          filter === option.value
                            ? "bg-ember text-ink"
                            : "text-ink/55 hover:text-ink"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </header>

              {section === "dashboard" ? (
                <DashboardSummary
                  active={activeOrders.length}
                  averageTicket={averageTicket}
                  delivery={deliveryOrders.length}
                  finished={finishedOrders.length}
                  pickup={pickupOrders.length}
                  revenue={revenue}
                  total={orders.length}
                />
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {!hydrated ? (
                    <p className="p-4 text-sm text-ink/60">Cargando pedidos...</p>
                  ) : filteredOrders.length === 0 ? (
                    <p className="p-4 text-sm text-ink/60">
                      No hay pedidos para verificar con esos filtros.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => (
                        <OrderListButton
                          key={order.id}
                          order={order}
                          selected={selectedOrder?.id === order.id}
                          showPayment={section === "verification"}
                          onClick={() => setSelectedId(order.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="border-t border-ink/10 bg-[#f4eee7] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
                  Estado del día
                </p>
                <div className="mt-3 space-y-2">
                  <MiniRow label="Pendientes" value={pendingOrders.length} />
                  <MiniRow label="En atención" value={activeOrders.length} />
                  <MiniRow label="Entregados" value={finishedOrders.length} />
                </div>
              </div>
            </div>

            <div className="min-h-screen overflow-y-auto bg-[#f9f6f1] p-5 sm:p-7">
              {section === "dashboard" ? (
                <AdminDashboard
                  activeOrders={activeOrders.length}
                  averageTicket={averageTicket}
                  cardOrders={cardOrders.length}
                  cashOrders={cashOrders.length}
                  deliveryOrders={deliveryOrders.length}
                  finishedOrders={finishedOrders.length}
                  orders={orders}
                  pendingOrders={pendingOrders.length}
                  pickupOrders={pickupOrders.length}
                  revenue={revenue}
                  yapeOrders={yapeOrders.length}
                />
              ) : selectedOrder ? (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-ember">
                        Detalle y verificación
                      </p>
                      <h2 className="font-display text-4xl text-ink">
                        Mesa de control
                      </h2>
                    </div>
                    {message ? (
                      <span className="rounded-full bg-gold px-4 py-2 text-xs font-black uppercase text-ink">
                        {message}
                      </span>
                    ) : null}
                  </div>
                <OrderDetail
                  order={selectedOrder}
                  code={codes[selectedOrder.id] ?? ""}
                  onCodeChange={(value) =>
                    setCodes((current) => ({
                      ...current,
                      [selectedOrder.id]: value.replace(/\D/g, ""),
                    }))
                  }
                  onAccept={() => acceptOrder(selectedOrder.id, "Administrador")}
                  onAdvance={() => advanceOrderStatus(selectedOrder.id)}
                  onVerify={() => handleVerify(selectedOrder.id)}
                  allowVerification={
                    section === "verification" ||
                    selectedOrder.fulfillmentType === "pickup"
                  }
                />
                </>
              ) : (
                <div className="grid min-h-[440px] place-items-center rounded-lg border border-dashed border-ink/20 bg-white text-center">
                  <div>
                    <p className="font-display text-4xl text-ink">
                      Sin pedidos todavía
                    </p>
                    <p className="mt-2 text-sm text-ink/60">
                      Cuando un cliente compre, aparecerá aquí.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </RoleGate>
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

function DashboardSummary({
  active,
  averageTicket,
  delivery,
  finished,
  pickup,
  revenue,
  total,
}: {
  active: number;
  averageTicket: number;
  delivery: number;
  finished: number;
  pickup: number;
  revenue: number;
  total: number;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="space-y-3">
        <SummaryRow label="Pedidos registrados" value={total.toString()} />
        <SummaryRow label="Ingresos acumulados" value={formatPrice(revenue)} />
        <SummaryRow label="Ticket promedio" value={formatPrice(averageTicket)} />
        <SummaryRow label="En atención" value={active.toString()} />
      </div>
      <div className="mt-5 rounded-lg bg-[#f4eee7] p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
          Distribución rápida
        </p>
        <DashboardBar label="Delivery" value={delivery} total={total} />
        <DashboardBar label="Recojo" value={pickup} total={total} />
        <DashboardBar label="Completados" value={finished} total={total} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink/45">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl text-ember">{value}</p>
    </div>
  );
}

function OrderListButton({
  order,
  onClick,
  selected,
  showPayment,
}: {
  order: CustomerOrder;
  onClick: () => void;
  selected: boolean;
  showPayment: boolean;
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
        <span className="font-display text-2xl text-ink">
          {order.id.slice(-9)}
        </span>
        <div className="flex flex-wrap justify-end gap-1">
          <span className="rounded-full bg-ink px-2 py-1 text-[10px] font-black uppercase text-cream">
            {order.fulfillmentType === "delivery" ? "Delivery" : "Recojo"}
          </span>
          {showPayment ? (
            <span className="rounded-full bg-gold px-2 py-1 text-[10px] font-black uppercase text-ink">
              {order.paymentLabel}
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-ink">
        {[order.customer.name, order.customer.lastName].filter(Boolean).join(" ")}
      </p>
      <p className="mt-1 text-xs text-ink/55">
        {orderStatusLabels[order.status]} · {formatPrice(order.total)}
      </p>
    </button>
  );
}

function AdminDashboard({
  activeOrders,
  averageTicket,
  cardOrders,
  cashOrders,
  deliveryOrders,
  finishedOrders,
  orders,
  pendingOrders,
  pickupOrders,
  revenue,
  yapeOrders,
}: {
  activeOrders: number;
  averageTicket: number;
  cardOrders: number;
  cashOrders: number;
  deliveryOrders: number;
  finishedOrders: number;
  orders: CustomerOrder[];
  pendingOrders: number;
  pickupOrders: number;
  revenue: number;
  yapeOrders: number;
}) {
  const recentOrders = orders.slice(0, 5);
  const total = orders.length;

  return (
    <>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ember">
          Vista general
        </p>
        <h2 className="font-display text-5xl text-ink">
          Resumen del negocio
        </h2>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        <MetricCard label="Ingresos" value={formatPrice(revenue)} />
        <MetricCard label="Ticket prom." value={formatPrice(averageTicket)} />
        <MetricCard label="Pedidos activos" value={activeOrders.toString()} />
        <MetricCard label="Completados" value={finishedOrders.toString()} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Modalidad de pedidos">
          <DashboardBar label="Delivery" value={deliveryOrders} total={total} />
          <DashboardBar label="Recojo" value={pickupOrders} total={total} />
          <DashboardBar label="Pendientes" value={pendingOrders} total={total} />
          <DashboardBar label="Finalizados" value={finishedOrders} total={total} />
        </ChartCard>

        <ChartCard title="Métodos de pago">
          <DashboardBar label="Yape" value={yapeOrders} total={total} />
          <DashboardBar label="Efectivo" value={cashOrders} total={total} />
          <DashboardBar label="Tarjeta" value={cardOrders} total={total} />
        </ChartCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <ChartCard title="Indicador de operación">
          <div className="grid place-items-center py-6">
            <div className="grid h-44 w-44 place-items-center rounded-full border-[18px] border-ember bg-white text-center shadow-[0_18px_50px_rgba(20,12,9,0.08)]">
              <div>
                <p className="font-display text-5xl text-ink">
                  {total === 0 ? 0 : Math.round((finishedOrders / total) * 100)}%
                </p>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/45">
                  completado
                </p>
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Últimos pedidos">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink/55">Aún no hay pedidos.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg bg-[#f9f6f1] px-4 py-3"
                >
                  <div>
                    <p className="font-display text-2xl text-ink">
                      {order.id.slice(-9)}
                    </p>
                    <p className="text-xs font-bold text-ink/55">
                      {order.fulfillmentType === "delivery" ? "Delivery" : "Recojo"} ·{" "}
                      {order.paymentLabel}
                    </p>
                  </div>
                  <p className="font-black text-ember">{formatPrice(order.total)}</p>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </>
  );
}

function ChartCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-[0_12px_34px_rgba(20,12,9,0.06)]">
      <h3 className="font-display text-3xl text-ink">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function DashboardBar({
  label,
  total,
  value,
}: {
  label: string;
  total: number;
  value: number;
}) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-black text-ink">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#f4eee7]">
        <div
          className="h-full rounded-full bg-ember transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function VerificationFilters({
  search,
  fulfillment,
  payment,
  onSearchChange,
  onFulfillmentChange,
  onPaymentChange,
}: {
  search: string;
  fulfillment: AdminFilter;
  payment: PaymentFilter;
  onSearchChange: (value: string) => void;
  onFulfillmentChange: (value: AdminFilter) => void;
  onPaymentChange: (value: PaymentFilter) => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      <label className="block">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-ink/45">
          Buscar pedido
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Código, cliente, celular..."
          className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/35 focus:border-ember"
        />
      </label>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink/45">
          Modalidad
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ["all", "Todos"],
            ["pickup", "Recojo"],
            ["delivery", "Delivery"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onFulfillmentChange(value)}
              className={`rounded-full px-3 py-2 text-[11px] font-black uppercase transition ${
                fulfillment === value
                  ? "bg-ember text-ink"
                  : "bg-[#f4eee7] text-ink/60 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-ink/45">
          Método de pago
        </p>
        <div className="grid grid-cols-4 gap-2">
          {([
            ["all", "Todos"],
            ["cash", "Efectivo"],
            ["yape", "Yape"],
            ["card", "Tarjeta"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onPaymentChange(value)}
              className={`rounded-full px-2 py-2 text-[10px] font-black uppercase transition ${
                payment === value
                  ? "bg-ink text-cream"
                  : "bg-[#f4eee7] text-ink/60 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
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

function MiniRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
      <span className="text-sm font-bold text-ink/65">{label}</span>
      <span className="font-display text-2xl text-ember">{value}</span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-[0_12px_34px_rgba(20,12,9,0.06)]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink/45">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl leading-none text-ink">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f4eee7]">
        <div className="h-full w-2/3 rounded-full bg-ember" />
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  code,
  onCodeChange,
  onAccept,
  onAdvance,
  onVerify,
  allowVerification,
}: {
  order: CustomerOrder;
  code: string;
  onCodeChange: (value: string) => void;
  onAccept: () => void;
  onAdvance: () => void;
  onVerify: () => void;
  allowVerification: boolean;
}) {
  const finished = order.status === "delivered" || order.status === "picked_up";

  return (
    <article className="rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(20,12,9,0.1)] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/45">
            Pedido seleccionado
          </p>
          <h3 className="mt-1 font-display text-5xl text-ink">{order.id}</h3>
          <p className="mt-2 text-sm font-bold text-ink/70">
            {[order.customer.name, order.customer.lastName]
              .filter(Boolean)
              .join(" ")}{" "}
            · {order.customer.phone}
          </p>
        </div>
        <span className="rounded-full bg-ember px-4 py-2 text-xs font-black uppercase text-ink">
          {orderStatusLabels[order.status]}
        </span>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoBox label="Modalidad">
          {order.fulfillmentType === "delivery" ? "Delivery" : "Recojo en local"}
        </InfoBox>
        <InfoBox label="Código">{order.securityCode}</InfoBox>
        <InfoBox label="Pago">{order.paymentLabel}</InfoBox>
        <InfoBox label="Total">{formatPrice(order.total)}</InfoBox>
      </div>

      {order.fulfillmentType === "delivery" ? (
        <div className="mt-5 rounded-lg border border-ink/10 bg-[#f9f6f1] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
            Dirección
          </p>
          <p className="mt-2 font-bold text-ink">
            {order.fulfillment.address}, {order.fulfillment.district}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {order.fulfillment.reference || "Sin referencia"}
          </p>
        </div>
      ) : null}

      <div className="mt-6 border-y border-ink/10 py-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
          Productos
        </p>
        <ul className="mt-3 space-y-2 text-sm font-semibold text-ink">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
        {order.status === "pending" ? (
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-ember px-5 py-3 text-sm font-black uppercase text-ink hover:bg-flame"
          >
            Aceptar pedido
          </button>
        ) : null}
        {!finished ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-full border border-ink/20 px-5 py-3 text-sm font-black uppercase text-ink hover:border-ember"
          >
            Avanzar estado
          </button>
        ) : null}
        {allowVerification ? (
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder="Código"
              className="min-w-0 flex-1 rounded-full border border-ink/15 bg-[#f9f6f1] px-4 py-3 text-center font-black text-ink outline-none focus:border-ember"
            />
            <button
              type="button"
              onClick={onVerify}
              className="rounded-full bg-gold px-5 py-3 text-sm font-black uppercase text-ink hover:bg-ember"
            >
              Verificar
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function InfoBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-[#f9f6f1] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink/45">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl text-ink">{children}</p>
    </div>
  );
}
