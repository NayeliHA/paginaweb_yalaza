"use client";

import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrder } from "@/components/orders/OrderProvider";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/lib/format";
import { orderStatusLabels } from "@/patterns/behavioral/order-state";

export function CustomerDashboard() {
  const { session } = useAuth();
  const { orders, hydrated, rateOrder } = useOrder();
  const myOrders = orders.filter(
    (order) =>
      order.customer.id === session?.userId ||
      order.customer.email === session?.email,
  );

  return (
    <RoleGate role="customer">
      <section className="py-14">
        <Container>
          <div className="flex flex-col gap-5 border-b border-cream/10 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
                Cliente
              </p>
              <h1 className="mt-2 font-display text-6xl leading-none text-cream">
                Hola, {session?.name}
              </h1>
              <p className="mt-3 max-w-2xl text-muted">
                Aquí ves tus pedidos y el código que debes dictar al recibir o
                recoger.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex rounded-full bg-ember px-5 py-3 text-sm font-bold uppercase text-ink hover:bg-flame"
            >
              Hacer pedido
            </Link>
          </div>

          {!hydrated ? (
            <p className="mt-8 text-muted">Cargando tus pedidos...</p>
          ) : myOrders.length === 0 ? (
            <div className="mt-8 border border-cream/10 bg-card p-7">
              <h2 className="font-display text-4xl text-cream">
                Aún no tienes pedidos
              </h2>
              <p className="mt-2 text-muted">
                Elige productos del menú y confirma tu pedido para generar tu
                código de seguridad.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5">
              {myOrders.map((order) => (
                <article
                  key={order.id}
                  className="border border-cream/10 bg-card p-5 transition hover:-translate-y-0.5 hover:border-ember/50 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        Pedido
                      </p>
                      <h2 className="mt-1 font-display text-3xl text-cream">
                        {order.id}
                      </h2>
                      <p className="mt-2 text-sm text-muted">
                        Modalidad:{" "}
                        <span className="font-semibold text-cream">
                          {order.fulfillmentType === "delivery"
                            ? "Delivery"
                            : "Recojo en local"}
                        </span>
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="inline-flex rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold">
                        {orderStatusLabels[order.status]}
                      </span>
                      <p className="mt-3 font-display text-5xl text-ember">
                        {order.securityCode}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Código de verificación
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 border-t border-cream/10 pt-5 md:grid-cols-[1fr_auto]">
                    <ul className="space-y-1 text-sm text-cream">
                      {order.items.map((item) => (
                        <li key={item.productId}>
                          {item.quantity} × {item.name}
                        </li>
                      ))}
                    </ul>
                    <div className="text-sm text-muted md:text-right">
                      <p>
                        Pago:{" "}
                        <span className="font-semibold text-cream">
                          {order.paymentLabel}
                        </span>
                      </p>
                      <p className="mt-2 text-lg font-bold text-gold">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                  {order.status === "delivered" || order.status === "picked_up" ? (
                    <div className="mt-5 border-t border-cream/10 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                        ¿Te gustó el pedido?
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => rateOrder(order.id, "yes")}
                          className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                            order.customerRating === "yes"
                              ? "bg-ember text-ink"
                              : "border border-cream/20 text-cream hover:border-ember"
                          }`}
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => rateOrder(order.id, "no")}
                          className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                            order.customerRating === "no"
                              ? "bg-ember text-ink"
                              : "border border-cream/20 text-cream hover:border-ember"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </RoleGate>
  );
}
