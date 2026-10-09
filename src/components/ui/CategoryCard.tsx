import Link from "next/link";
import type { Category } from "@/models";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/menu?categoria=${category.slug}`}
      className="group rounded-3xl border border-cream/10 bg-card p-6 transition hover:-translate-y-1 hover:border-ember/70 hover:shadow-[0_18px_40px_rgba(255,77,26,0.16)]"
    >
      <p className="font-display text-3xl tracking-wide text-gold">{category.name}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{category.description}</p>
      <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-ember group-hover:text-flame">
        Ver categoría
      </span>
    </Link>
  );
}
