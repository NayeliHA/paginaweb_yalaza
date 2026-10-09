import type { Product } from "@/models";
import { ProductCard } from "@/components/ui/ProductCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="py-8">
      <Container>
        <SectionHeading
          eyebrow="Destacados"
          title="Las alitas que más piden"
          description="Una selección inicial para presentar el catálogo. Los precios y productos podrán conectarse a Supabase más adelante."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
