"use client";

import Link from "next/link";
import { useOrder } from "@/components/orders/OrderProvider";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { cart, hydrated, itemCount, subtotal, increase, decrease, remove, clearCart } =
    useOrder();

  return (
    <section className="py-14">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
          Tu selección · {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </p>
        <h1 className="mt-2 font-display text-6xl leading-none text-cream">Carrito</h1>
        {!hydrated ? (
          <p className="mt-8 text-muted">Cargando carrito...</p>
        ) : cart.length === 0 ? (
          <div className="mt-8 border-t border-cream/10 py-8">
            <p className="text-muted">Tu carrito está vacío.</p>
            <Link
              href="/menu"
              className="mt-5 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-semibold uppercase text-ink hover:bg-flame"
            >
              Explorar menú
            </Link>
          </div>
        ) : (
          <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_340px]">
            <div className="divide-y divide-cream/10 border-y border-cream/10">
              {cart.map(({ product, quantity }) => (
                <article
                  key={product.id}
                  className="grid gap-4 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div>
                    <h2 className="font-display text-3xl text-cream">{product.name}</h2>
                    <p className="mt-1 text-sm text-muted">{formatPrice(product.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-3" aria-label={`Cantidad de ${product.name}`}>
                    <button
                      type="button"
                      onClick={() => decrease(product.id)}
                      aria-label={`Disminuir ${product.name}`}
                      className="h-9 w-9 rounded-full border border-cream/20 text-cream hover:border-ember"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-semibold text-cream">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => increase(product.id)}
                      aria-label={`Aumentar ${product.name}`}
                      className="h-9 w-9 rounded-full border border-cream/20 text-cream hover:border-ember"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <strong className="text-gold">
                      {formatPrice(product.price * quantity)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      className="text-xs font-semibold uppercase text-muted underline decoration-cream/30 underline-offset-4 hover:text-cream"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="h-fit border border-cream/10 bg-card p-6">
              <h2 className="font-display text-3xl text-cream">Resumen</h2>
              <div className="mt-5 flex justify-between border-t border-cream/10 pt-4 text-sm text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-3 flex justify-between text-base font-semibold text-cream">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                La modalidad y cualquier costo de entrega se confirman en el siguiente paso.
              </p>
              <Link
                href="/pedido"
                className="mt-6 flex w-full justify-center rounded-full bg-ember px-5 py-3 text-sm font-bold uppercase text-ink transition hover:bg-flame"
              >
                Continuar pedido
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="mt-4 w-full text-center text-xs font-semibold uppercase text-muted hover:text-cream"
              >
                Vaciar carrito
              </button>
            </aside>
          </div>
        )}
      </Container>
    </section>
  );
}