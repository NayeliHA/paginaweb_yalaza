import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function OrderCta() {
  return (
    <section className="py-16">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,_#ff4d1a_0%,_#7a1d09_58%,_#140c09_100%)] px-8 py-12 sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cream/80">
            ¿Listo para pedir?
          </p>
          <h2 className="mt-3 max-w-xl font-display text-5xl leading-none tracking-wide text-cream sm:text-6xl">
            Delivery o recojo, alitas al momento
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-cream/85">
            Arma tu pedido, elige delivery o recojo y revisa el resumen antes
            de confirmarlo.
          </p>
          <div className="mt-8">
            <Button href="/pedido" variant="secondary">
              Realizar pedido
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
