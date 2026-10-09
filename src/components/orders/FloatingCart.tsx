"use client";

import Link from "next/link";
import { useOrder } from "@/components/orders/OrderProvider";
import { formatPrice } from "@/lib/format";

export function FloatingCart() {
  const { hydrated, itemCount, subtotal } = useOrder();

  if (!hydrated || itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <div className="rounded-full border border-cream/15 bg-ink/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/carrito"
            className="grid h-12 w-12 place-items-center rounded-full bg-ember text-lg font-black text-ink transition hover:bg-flame"
            aria-label={`Ver carrito con ${itemCount} productos`}
          >
            🛒
          </Link>
          <div className="hidden pr-2 sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              Carrito
            </p>
            <p className="text-sm font-bold text-cream">
              {itemCount} {itemCount === 1 ? "producto" : "productos"} ·{" "}
              <span className="text-gold">{formatPrice(subtotal)}</span>
            </p>
          </div>
          <Link
            href="/pedido"
            className="hidden rounded-full bg-gold px-4 py-3 text-xs font-black uppercase text-ink transition hover:bg-cream sm:inline-flex"
          >
            Pedir
          </Link>
        </div>
      </div>
    </div>
  );
}
