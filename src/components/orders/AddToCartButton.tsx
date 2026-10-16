"use client";

import type { Product } from "@/models";
import { useOrder } from "@/components/orders/OrderProvider";

export function AddToCartButton({ product }: { product: Product }) {
  const { addProduct, inventory, cart, hydrated } = useOrder();
  const stock = inventory[product.id] ?? 0;
  const inCart = cart.find(item => item.product.id === product.id)?.quantity ?? 0;
  const available = product.available && hydrated && stock > inCart;

  return (
    <button
      type="button"
      className="rounded-full bg-ember px-4 py-2 text-xs font-bold uppercase text-ink transition hover:bg-flame disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink/70"
      onClick={() => addProduct(product)}
      disabled={!available}
    >
      {!hydrated ? "Cargando..." : !product.available || stock === 0 ? "Agotado" : inCart >= stock ? "Límite de stock" : "Agregar"}
    </button>
  );
}
