import type { Category } from "@/models";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16">
      <Container>
        <SectionHeading
          eyebrow="Categorías"
          title="Elige tu antojo"
          description="Empieza por alitas o arma un combo completo. El catálogo se ampliará en las siguientes etapas."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </Container>
    </section>
  );
}
