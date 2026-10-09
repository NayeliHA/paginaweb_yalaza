"use client";

import { useState } from "react";
import type { Category, Product } from "@/models";
import { ProductCard } from "@/components/ui/ProductCard";
import { Container } from "@/components/ui/Container";

export function MenuExplorer({
  categories,
  products,
  initialCategorySlug,
}: {
  categories: Category[];
  products: Product[];
  initialCategorySlug?: string;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    categories.find((category) => category.slug === initialCategorySlug)?.id ?? "all",
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.categoryId === activeCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${product.name} ${product.description}`
        .toLocaleLowerCase("es")
        .includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <section className="py-14">
      <Container>
        <div className="flex flex-col gap-8 border-b border-cream/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
              La carta
            </p>
            <h1 className="mt-2 font-display text-6xl leading-none text-cream">
              Nuestro menú
            </h1>
          </div>
          <label className="w-full md:max-w-sm">
            <span className="mb-2 block text-xs font-semibold uppercase text-muted">
              Buscar productos
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Alitas, combos..."
              className="w-full rounded-lg border border-cream/15 bg-card px-4 py-3 text-cream outline-none transition placeholder:text-muted/70 focus:border-ember"
            />
          </label>
        </div>
        <div className="mt-7 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition ${activeCategory === "all" ? "border-ember bg-ember text-ink" : "border-cream/15 text-cream hover:border-ember"}`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={activeCategory === category.id}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition ${activeCategory === category.id ? "border-ember bg-ember text-ink" : "border-cream/15 text-cream hover:border-ember"}`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}
        </p>
        {filteredProducts.length > 0 ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-8 border-t border-cream/10 py-8 text-muted">
            No encontramos productos con esos filtros.
          </p>
        )}
      </Container>
    </section>
  );
}