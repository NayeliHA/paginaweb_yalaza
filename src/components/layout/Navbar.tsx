
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "@/components/ui/Container";
import { useOrder } from "@/components/orders/OrderProvider";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/menu", label: "Menú" },
  { href: "/carrito", label: "Carrito" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useOrder();
  const { session, logout } = useAuth();
  const roleHref =
    session?.role === "admin"
      ? "/admin"
      : session?.role === "delivery"
        ? "/delivery"
        : "/cliente";

  return (
    <header className="sticky top-0 z-50 border-b border-cream/10 bg-ink/90 backdrop-blur">
      <Container className="flex items-center justify-between py-3">
        
        {/* LOGO DE YALAZA */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/imagenes/logo-yalazas.png"
            alt="Yalaza"
            width={160}
            height={80}
            priority
            className="h-auto w-[115px] object-contain sm:w-[145px]"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium uppercase tracking-[0.18em] text-muted transition hover:text-cream"
            >
              {link.href === "/carrito" ? (
                <>
                  {link.label}
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-bold text-ink">
                    {itemCount}
                    <span className="sr-only"> productos</span>
                  </span>
                </>
              ) : (
                link.label
              )}
            </Link>
          ))}

          {session ? (
            <Link
              href={roleHref}
              className="rounded-full border border-gold/50 px-4 py-2 text-sm font-bold uppercase tracking-wide text-gold transition hover:bg-gold hover:text-ink"
            >
              Mi panel
            </Link>
          ) : (
            <Link
              href="/ingresar"
              className="rounded-full border border-gold/50 px-4 py-2 text-sm font-bold uppercase tracking-wide text-gold transition hover:bg-gold hover:text-ink"
            >
              Ingresar
            </Link>
          )}

          <Link
            href="/pedido"
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink shadow-[0_12px_35px_rgba(255,77,26,0.28)] transition hover:bg-flame"
          >
            Pedir ahora
          </Link>
          {session ? (
            <button
              type="button"
              onClick={logout}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted hover:text-cream"
            >
              Salir
            </button>
          ) : null}
        </nav>

        <button
          type="button"
          className="rounded-full border border-cream/20 px-3 py-2 text-xs uppercase tracking-widest text-cream md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Abrir menú"
        >
          Menú
        </button>
      </Container>

      {open ? (
        <div className="border-t border-cream/10 bg-ink md:hidden">
          <Container className="flex flex-col gap-4 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm uppercase tracking-[0.18em] text-cream"
                onClick={() => setOpen(false)}
              >
                {link.href === "/carrito"
                  ? `${link.label} (${itemCount})`
                  : link.label}
              </Link>
            ))}
            <Link
              href={session ? roleHref : "/ingresar"}
              className="rounded-full border border-gold/50 px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-gold"
              onClick={() => setOpen(false)}
            >
              {session ? "Mi panel" : "Ingresar"}
            </Link>
            <Link
              href="/pedido"
              className="rounded-full bg-ember px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-ink"
              onClick={() => setOpen(false)}
            >
              Pedir ahora
            </Link>
            {session ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="text-left text-sm uppercase tracking-[0.18em] text-muted"
                >
                  Salir
                </button>
              </>
            ) : null}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
