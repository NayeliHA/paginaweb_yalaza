import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export function PlaceholderPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="py-20">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember">
          Próxima etapa
        </p>
        <h1 className="mt-3 font-display text-6xl tracking-wide text-cream">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{description}</p>
        {children}
      </Container>
    </section>
  );
}
