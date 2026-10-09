"use client";

import { useState } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrder } from "@/components/orders/OrderProvider";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/lib/format";
import { orderStatusLabels } from "@/patterns/behavioral/order-state";
import type { CustomerOrder } from "@/models";

type DeliveryOrder = CustomerOrder & { fulfillmentType: "delivery" };

function isDeliveryOrder(order: CustomerOrder): order is DeliveryOrder {
  return order.fulfillmentType === "delivery";
}

export function DeliveryOrders() {
  const { session } = useAuth();
  const { orders, hydrated, acceptOrder, advanceOrderStatus, verifyOrder } =
    useOrder();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const deliveryOrders = orders.filter(isDeliveryOrder);

  function handleAccept(orderId: string) {
    acceptOrder(orderId, session?.name ?? "Delivery");
  }

  function handleVerify(orderId: string) {
    const result = verifyOrder(orderId, codes[orderId] ?? "");
    setMessage(
      result
        ? `Pedido ${orderId} entregado y verificado.`
        : "Código incorrecto. Pide al cliente el código de 4 dígitos.",
    );
  }

  return (
    <RoleGate role="delivery">
      <section className="py-14">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
            Delivery
          </p>
          <h1 className="mt-2 font-display text-6xl leading-none text-cream">
            Pedidos para reparto
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Toma pedidos, avanza su estado y verifica el código con el cliente
            antes de entregar.
          </p>

          {message ? (
            <p className="mt-5 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
              {message}
            </p>
          ) : null}

          {!hydrated ? (
            <p className="mt-8 text-muted">Cargando pedidos...</p>
          ) : deliveryOrders.length === 0 ? (
            <div className="mt-8 border-t border-cream/10 py-8">
              <p className="text-muted">No hay pedidos de delivery.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {deliveryOrders.map((order) => (
                <article
                  key={order.id}
                  className="border border-cream/10 bg-card p-5 transition hover:-translate-y-0.5 hover:border-ember/50 sm:p-6"
                >
                  <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Pedido
                      </p>
                      <h2 className="mt-1 font-display text-3xl text-cream">
                        {order.id}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        Cliente:{" "}
                        <span className="font-semibold text-cream">
                          {[order.customer.name, order.customer.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Dirección:{" "}
                        <span className="font-semibold text-cream">
                          {order.fulfillment.address}, {order.fulfillment.district}
                        </span>
                      </p>
                    </div>
                    <span className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold">
                      {orderStatusLabels[order.status]}
                    </span>
                  </header>

                  <div className="mt-5 grid gap-5 border-t border-cream/10 pt-5 lg:grid-cols-[1fr_220px_170px]">
                    <div>
                      <ul className="space-y-1 text-sm text-cream">
                        {order.items.map((item) => (
                          <li key={item.productId}>
                            {item.quantity} × {item.name}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm text-muted">
                        Código visible al aceptar:{" "}
                        <span className="font-bold text-ember">
                          {order.status === "pending" ? "Pendiente" : order.securityCode}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Pago: <span className="text-cream">{order.paymentLabel}</span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      {order.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleAccept(order.id)}
                          className="w-full rounded-full bg-ember px-4 py-2 text-xs font-bold uppercase text-ink hover:bg-flame"
                        >
                          Tomar pedido
                        </button>
                      ) : null}
                      {order.status !== "delivered" ? (
                        <button
                          type="button"
                          onClick={() => advanceOrderStatus(order.id)}
                          className="w-full rounded-full border border-cream/20 px-4 py-2 text-xs font-semibold uppercase text-cream hover:border-ember"
                        >
                          Avanzar estado
                        </button>
                      ) : null}
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        value={codes[order.id] ?? ""}
                        onChange={(event) =>
                          setCodes((current) => ({
                            ...current,
                            [order.id]: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder="Código"
                        className="w-full rounded-lg border border-cream/15 bg-ink px-3 py-2 text-center text-cream outline-none focus:border-ember"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerify(order.id)}
                        className="w-full rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase text-ink hover:bg-cream"
                      >
                        Verificar entrega
                      </button>
                    </div>
                    <div className="flex items-end justify-between gap-4 border-t border-cream/10 pt-4 lg:min-w-36 lg:flex-col lg:items-end lg:border-0 lg:pt-0">
                      <span className="text-sm text-muted">Total</span>
                      <strong className="text-lg text-gold">
                        {formatPrice(order.total)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </RoleGate>
  );
}
