import Image from "next/image";
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
    <article className="group flex h-full flex-col rounded-lg border border-cream/10 bg-card p-6 transition hover:-translate-y-1 hover:border-ember/50 hover:shadow-[0_22px_55px_rgba(255,77,26,0.12)]">
      <div className="relative mb-5 flex aspect-[3/2] items-end overflow-hidden rounded-lg bg-[#171411] p-4">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className={`${product.categoryId === "cat-bebidas" ? "object-contain" : "object-cover"} transition duration-500 group-hover:scale-105`}
          />
        ) : null}
        <span className="relative z-10 rounded-full bg-ink/70 px-3 py-1 text-xs uppercase tracking-widest text-gold">
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
