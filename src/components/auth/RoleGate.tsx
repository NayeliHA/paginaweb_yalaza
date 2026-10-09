"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { UserRole } from "@/models";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "@/components/ui/Container";
import { RoleAccessProxy } from "@/patterns/structural/role-proxy";

const roleLabels: Record<UserRole, string> = {
  admin: "administrador",
  delivery: "delivery",
  customer: "cliente",
};

export function RoleGate({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { session, hydrated } = useAuth();
  const proxy = new RoleAccessProxy(session);

  if (!hydrated) {
    return <p className="py-14 text-center text-muted">Cargando acceso...</p>;
  }

  if (!proxy.canAccess(role)) {
    return (
      <section className="py-14">
        <Container>
          <div className="mx-auto max-w-xl border border-cream/10 bg-card p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ember">
              Acceso requerido
            </p>
            <h1 className="mt-3 font-display text-5xl text-cream">
              Ingresa como {roleLabels[role]}
            </h1>
            <p className="mt-3 text-muted">
              Tu sesión actual no tiene permiso para ver este apartado.
            </p>
            <Link
              href="/ingresar"
              className="mt-6 inline-flex rounded-full bg-ember px-6 py-3 text-sm font-bold uppercase text-ink transition hover:bg-flame"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return children;
}
