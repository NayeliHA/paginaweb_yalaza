import Link from "next/link";
import type { Category } from "@/models";
import { Container } from "@/components/ui/Container";

export function CategorySection({ categories }: { categories: Category[] }) {
  return (
    <section id="sabores" className="scroll-mt-8 bg-cream py-16 text-ink sm:py-24">
      <Container>
        <div className="grid gap-8 border-b border-ink/20 pb-12 md:grid-cols-2 md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ink/55">
              El espíritu Yalaza
            </p>
            <h2 className="mt-5 font-display text-5xl leading-[0.95] sm:text-6xl">
              El buen sabor<br />se comparte.
            </h2>
          </div>
          <div className="max-w-md md:justify-self-end">
            <p className="text-base leading-8 text-ink/70">
              Una mesa, tus personas favoritas y algo que dé ganas de
              repetir. Seis sabores de alitas, hamburguesas con carácter
              y papas nativas para acompañar el momento.
            </p>
            <Link href="/menu" className="mt-6 inline-flex items-center gap-6 border-b border-ink/40 pb-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:border-ember hover:text-ember">
              Encuentra tu favorito <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => (
            <Link key={category.id} href={`/menu?categoria=${category.slug}`}
              className="group border-b border-ink/15 py-7 sm:px-4 lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-widest text-ink/45">{String(index + 1).padStart(2, "0")}</span>
                <span aria-hidden="true" className="text-xl text-ink/50 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ember">↗</span>
              </div>
              <h3 className="mt-4 font-display text-3xl transition group-hover:text-ember">{category.name}</h3>
              <p className="mt-2 text-xs leading-6 text-ink/60">{category.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
