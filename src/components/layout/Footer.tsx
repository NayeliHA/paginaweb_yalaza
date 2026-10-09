import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cream/10 bg-ink">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl tracking-[0.18em] text-cream">YALAZA</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Alitas crujientes, salsas con carácter y combos pensados para pedir
            rápido sin perder el sabor.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Explora
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
            <Link href="/menu" className="hover:text-cream">
              Menú
            </Link>
            <Link href="/carrito" className="hover:text-cream">
              Carrito
            </Link>
            <Link href="/pedido" className="hover:text-cream">
              Hacer pedido
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            Pedidos
          </p>
          <p className="mt-4 text-sm leading-6 text-muted">
            Confirma tu pedido para entrega o recojo. La atención por WhatsApp
            estará disponible cuando se configure el número del negocio.
          </p>
        </div>
      </Container>
      <div className="border-t border-cream/10 py-4 text-center text-xs uppercase tracking-[0.18em] text-muted">
        Yalaza · Arquitectura de Software
      </div>
    </footer>
  );
}
