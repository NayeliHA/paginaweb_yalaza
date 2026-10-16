
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="yalaza-hero relative isolate overflow-hidden bg-ink" aria-labelledby="hero-title">
      <div className="yalaza-hero-media absolute inset-0 -z-20">
        <Image
          src="/imagenes/yalaza-portada.webp"
          alt="Alitas BBQ y Buffalo, papas nativas y una hamburguesa con cheddar y tocino"
          fill
          preload
          sizes="100vw"
          className="yalaza-hero-photo object-cover"
        />
      </div>
      <div className="yalaza-hero-shade pointer-events-none absolute inset-0 -z-10" />

      <Container className="yalaza-hero-content relative flex flex-col justify-center">
        <div className="max-w-xl animate-rise">
          <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-xs">
            <span className="h-px w-8 bg-gold/70" aria-hidden="true" />
            Alitas · Burgers · Buenos momentos
          </p>
          <Image
            src="/imagenes/logo-yalazas.png"
            alt="Yalaza"
            width={600}
            height={300}
            className="mt-5 h-auto w-[220px] object-contain drop-shadow-[0_6px_24px_rgba(0,0,0,0.5)] sm:w-[280px]"
          />
          <h1 id="hero-title" className="yalaza-hero-title mt-5 font-display uppercase text-cream">
            Aquí empieza<br /><span className="text-gold">el antojo.</span>
          </h1>
          <p className="mt-5 max-w-[340px] text-sm leading-7 text-cream/80 sm:text-base">
            Alitas crujientes, burgers con carácter y salsas que
            invitan a quedarse un rato más.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-5 sm:gap-7">
            <Button href="/menu" className="gap-4 px-7 py-3.5">
              Explorar la carta <span aria-hidden="true">↗</span>
            </Button>
            <Link href="/pedido" className="border-b border-cream/50 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:border-gold hover:text-gold">
              Hacer pedido
            </Link>
          </div>
        </div>
      </Container>

      <div className="absolute inset-x-0 bottom-0 border-t border-cream/15">
        <Container className="flex items-center justify-between gap-4 py-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cream/65">
            <span className="mr-3 text-gold">01 /</span> Hecho para compartir
          </p>
          <a href="#sabores" className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-cream transition hover:text-gold">
            Descubre Yalaza <span aria-hidden="true" className="text-xl transition group-hover:translate-y-1">↓</span>
          </a>
        </Container>
      </div>
    </section>
  );
}
