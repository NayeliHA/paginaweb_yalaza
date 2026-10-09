"use client";

import type { Product } from "@/models";
import { useOrder } from "@/components/orders/OrderProvider";

export function AddToCartButton({ product }: { product: Product }) {
  const { addProduct } = useOrder();

  return (
    <button
      type="button"
      className="rounded-full bg-ember px-4 py-2 text-xs font-bold uppercase text-ink transition hover:bg-flame disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink/70"
      onClick={() => addProduct(product)}
      disabled={!product.available}
    >
      {product.available ? "Agregar" : "Agotado"}
    </button>
  );
}