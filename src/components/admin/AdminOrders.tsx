"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleGate } from "@/components/auth/RoleGate";
import { useOrder } from "@/components/orders/OrderProvider";
import { formatPrice } from "@/lib/format";
import type { CustomerOrder, FulfillmentType, PaymentMethod } from "@/models";
import { getOrderActionLabel } from "@/patterns/behavioral/order-state";
import { AdminOrderManager } from "@/components/admin/AdminOrderManager";
import { BusinessDashboard } from "@/components/admin/BusinessDashboard";
import { AdminStock } from "@/components/admin/AdminStock";
import { PanelShell, PanelMetric, PanelEmpty, OrderStatusBadge } from "@/components/panels/PanelShell";

type AdminFilter = "all" | FulfillmentType;
type AdminSection = "dashboard" | "all" | "pickup" | "delivery" | "verification" | "manage" | "stock";
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
  const { session } = useAuth();
  const { orders: allOrders, hydrated, acceptOrder, advanceOrderStatus, verifyOrder } =
    useOrder();
  const orders = allOrders.filter(order => order.active !== false);
  const section = initialSection;
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
    const query = search.trim().toLocaleLowerCase("es");
    return orders.filter(order => (filter === "all" || order.fulfillmentType === filter) &&
      `${order.id} ${order.customer.name} ${order.customer.lastName ?? ""} ${order.customer.phone}`.toLocaleLowerCase("es").includes(query));
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
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const activeOrders = orders.filter(
    (order) => order.status !== "delivered" && order.status !== "picked_up",
  );
  const finishedOrders = orders.filter(
    (order) => order.status === "delivered" || order.status === "picked_up",
  );

  function handleVerify(orderId: string) {
    const result = verifyOrder(orderId, codes[orderId] ?? "");
    setMessage(
      result
        ? `Pedido ${orderId.slice(-6)} verificado.`
        : "Código incorrecto.",
    );
  }


  const sectionTitle: Record<AdminSection, string> = {
    dashboard: "Resumen del negocio",
    all: "Pedidos registrados",
    pickup: "Recojo en tienda",
    delivery: "Pedidos delivery",
    verification: "Verificación",
    manage: "Gestionar pedidos",
    stock: "Stock",
  };

  return (
    <RoleGate role="admin">
      <PanelShell role="admin" title={sectionTitle[section]} description={
        section === "dashboard" ? "Una vista clara de tus pedidos, ingresos y operación." :
        section === "manage" ? "Registra pedidos para tus clientes y administra los pendientes." :
        section === "stock" ? "Consulta las existencias y mantén tu inventario al día." :
        section === "verification" ? "Valida el código del cliente para completar la atención." :
        "Consulta los pedidos y acompaña cada etapa de su atención."
      } action={section !== "manage" ? <Link href="/admin/gestionar" className="panel-primary-link"><span aria-hidden="true">+</span> Registrar pedido</Link> : undefined}>
        {section === "manage" ? <AdminOrderManager /> : section === "all" ? <AdminOrderManager showForm={false} /> : section === "stock" ? <AdminStock /> : section === "dashboard" ? (
          <BusinessDashboard />
        ) : (
          <>
            <div className="panel-metrics mb-6">
              <PanelMetric label="Pedidos registrados" value={orders.length} hint="Todas las modalidades" icon="orders" />
              <PanelMetric label="En atención" value={activeOrders.length} hint="Pendientes y en proceso" icon="truck" />
              <PanelMetric label="Pendientes" value={pendingOrders.length} hint="Por aceptar" icon="pickup" />
              <PanelMetric label="Completados" value={finishedOrders.length} hint="Entregados y recogidos" icon="check" />
            </div>
            <div className="panel-toolbar">
              {section === "verification" ? (
                <VerificationFilters search={search} fulfillment={verificationFulfillment} payment={verificationPayment}
                  onSearchChange={setSearch} onFulfillmentChange={value => { setVerificationFulfillment(value); setSelectedId(null); }}
                  onPaymentChange={value => { setVerificationPayment(value); setSelectedId(null); }} />
              ) : (
                <div className="flex flex-wrap items-end gap-4">
                  <label className="min-w-0 flex-1 text-sm font-medium">Buscar pedido
                    <input type="search" className="panel-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cliente, celular o código..." />
                  </label>
                  <div className="panel-tabs" aria-label="Modalidad del pedido">
                    {filters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value}
                      className={filter === option.value ? "is-active" : ""} onClick={() => { setFilter(option.value); setSelectedId(null); }}>{option.label}</button>)}
                  </div>
                </div>
              )}
            </div>
            {message ? <p role="status" className="panel-notice">{message}</p> : null}
            {!hydrated ? <p className="p-6 text-sm text-ink/60">Cargando pedidos...</p> : (
              <div className="panel-order-layout">
                <section className="panel-order-list" aria-label="Lista de pedidos">
                  <div className="panel-list-heading"><h2>Pedidos</h2><span>{filteredOrders.length}</span></div>
                  {filteredOrders.length ? <div className="space-y-3 p-4">{filteredOrders.map(order =>
                    <OrderListButton key={order.id} order={order} selected={selectedOrder?.id === order.id}
                      showPayment={section === "verification"} onClick={() => setSelectedId(order.id)} />)}</div> :
                    <PanelEmpty title="Sin pedidos" description="Los pedidos que coincidan con tus filtros aparecerán aquí." />}
                </section>
                <div className="min-w-0">
                  {selectedOrder ? <OrderDetail order={selectedOrder} code={codes[selectedOrder.id] ?? ""}
                    onCodeChange={value => setCodes(current => ({ ...current, [selectedOrder.id]: value.replace(/\D/g, "") }))}
                    onAccept={() => acceptOrder(selectedOrder.id, session?.name ?? "Administrador")}
                    onAdvance={() => advanceOrderStatus(selectedOrder.id)} onVerify={() => handleVerify(selectedOrder.id)}
                    allowVerification={section === "verification" || selectedOrder.fulfillmentType === "pickup"} /> :
                    <PanelEmpty title="Todo listo para empezar" description="Registra un pedido o selecciona uno de la lista para consultar su detalle." />}
                </div>
              </div>
            )}
          </>
        )}
      </PanelShell>
    </RoleGate>
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
      className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${
        selected ? "border-ember bg-ember/10" : "border-ink/10 bg-[#f8fafc]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans font-semibold text-lg text-ink">
          {order.id.slice(-9)}
        </span>
        <div className="flex flex-wrap justify-end gap-1">
          <span className="rounded-full bg-ink px-2 py-1 text-xs font-semibold text-cream">
            {order.fulfillmentType === "delivery" ? "Delivery" : "Recojo"}
          </span>
          {showPayment ? (
            <span className="rounded-full bg-gold px-2 py-1 text-xs font-semibold text-ink">
              {order.paymentLabel}
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-ink">
        {[order.customer.name, order.customer.lastName].filter(Boolean).join(" ")}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><OrderStatusBadge status={order.status} /><span className="text-xs font-medium text-ink/60">{formatPrice(order.total)}</span></div>
    </button>
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
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold tracking-normal text-ink/45">
          Buscar pedido
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Código, cliente, celular..."
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/35 focus:border-ember"
        />
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-normal text-ink/45">
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
              className={`rounded-full px-3 py-2 text-[11px] font-semibold transition ${
                fulfillment === value
                  ? "bg-ember text-ink"
                  : "bg-[#f2f4f7] text-ink/60 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-normal text-ink/45">
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
              className={`rounded-full px-2 py-2 text-xs font-semibold transition ${
                payment === value
                  ? "bg-ink text-cream"
                  : "bg-[#f2f4f7] text-ink/60 hover:text-ink"
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
  const nextAction = getOrderActionLabel(order.status, order.fulfillmentType);
  const canVerify = order.status === "on_the_way" || order.status === "ready_for_pickup";

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-normal text-ink/45">
            Pedido seleccionado
          </p>
          <h3 className="mt-1 font-sans font-semibold text-lg text-ink">{order.id}</h3>
          <p className="mt-2 text-sm font-bold text-ink/70">
            {[order.customer.name, order.customer.lastName]
              .filter(Boolean)
              .join(" ")}{" "}
            · {order.customer.phone}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
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
        <div className="mt-5 rounded-xl border border-ink/10 bg-[#f8fafc] p-4">
          <p className="text-xs font-semibold tracking-normal text-ink/45">
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
        <p className="text-xs font-semibold tracking-normal text-ink/45">
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

      <div className="mt-6 flex flex-wrap gap-3">
        {order.status === "pending" ? (
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-ink hover:bg-flame"
          >
            Aceptar pedido
          </button>
        ) : null}
        {nextAction ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-full border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:border-ember"
          >
            {nextAction}
          </button>
        ) : null}
        {allowVerification && canVerify ? (
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder="Código"
              className="min-w-0 flex-1 rounded-full border border-ink/15 bg-[#f8fafc] px-4 py-3 text-center font-semibold text-ink outline-none focus:border-ember"
            />
            <button
              type="button"
              onClick={onVerify}
              className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink hover:bg-ember"
            >
              Verificar
            </button>
          </div>
        ) : null}
        {canVerify && !allowVerification ? <Link href="/admin/verificacion" className="panel-primary-link">Verificar entrega</Link> : null}
      </div>
    </article>
  );
}

function InfoBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-[#f8fafc] p-4">
      <p className="text-xs font-semibold tracking-normal text-ink/45">
        {label}
      </p>
      <p className="mt-1 font-sans font-semibold text-lg text-ink">{children}</p>
    </div>
  );
}
