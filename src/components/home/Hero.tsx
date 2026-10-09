
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,_rgba(255,77,26,0.28),_transparent_42%),linear-gradient(180deg,_#1b100c_0%,_#140c09_100%)]" />

      <Container className="relative grid min-h-[78vh] items-center gap-12 py-16 lg:grid-cols-2">
        <div className="animate-rise">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-gold">
            Fast food · Alitas
          </p>

          {/* LOGO PRINCIPAL DE YALAZA */}
          <div className="mt-4">
            <Image
              src="/imagenes/logo-yalazas.png"
              alt="Yalaza"
              width={600}
              height={300}
              priority
              className="h-auto w-full max-w-[480px] object-contain"
            />
          </div>

          <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
            Alitas crujientes, salsas con actitud y combos para compartir.
            Pedido rápido, sabor intenso y una experiencia pensada para
            repetir.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/menu">Ver menú</Button>
            <Button href="/pedido" variant="ghost">
              Hacer pedido
            </Button>
          </div>
        </div>

        <div className="relative animate-rise [animation-delay:160ms]">
          <div className="animate-glow rounded-lg border border-cream/10 bg-card/80 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <p className="font-display text-5xl tracking-wide text-ember">
              HOT WINGS
            </p>

            <p className="mt-4 text-sm uppercase tracking-[0.22em] text-gold">
              BBQ · Buffalo · Mango Habanero
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {["Crocantes", "Jugosas", "Picantes"].map((item) => (
                <div key={item} className="rounded-lg bg-ink px-3 py-6">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
