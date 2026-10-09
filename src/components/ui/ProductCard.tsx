import type { Product } from "@/models";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/orders/AddToCartButton";

const spiceLabels: Record<1 | 2 | 3, string> = {
  1: "Suave",
  2: "Picante",
  3: "Fuego",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-cream/10 bg-card p-6 transition hover:-translate-y-1 hover:border-ember/50 hover:shadow-[0_22px_55px_rgba(255,77,26,0.12)]">
      <div className="mb-5 flex h-36 items-end rounded-lg bg-[radial-gradient(circle_at_top,_#ff8a3d_0%,_#1f1410_62%)] p-4">
        <span className="rounded-full bg-ink/70 px-3 py-1 text-xs uppercase tracking-widest text-gold">
          {!product.available ? "Agotado" : product.featured ? "Destacado" : "Disponible"}
        </span>
      </div>
      <h3 className="font-display text-3xl tracking-wide text-cream">{product.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{product.description}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-gold">{formatPrice(product.price)}</p>
        {product.spiceLevel ? (
          <p className="text-xs uppercase tracking-[0.18em] text-ember">
            {spiceLabels[product.spiceLevel]}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
