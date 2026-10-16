"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { OrderStatus } from "@/models";
import { orderStatusLabels } from "@/patterns/behavioral/order-state";

export type PanelIconName = "dashboard" | "orders" | "plus" | "stock" | "pickup" | "truck" | "check" | "route" | "home" | "logout" | "menu";
const paths: Record<PanelIconName, string> = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  orders: "M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6",
  plus: "M12 5v14 M5 12h14",
  stock: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10 M7 5l10 4",
  pickup: "M4 9h16v12H4z M3 9l2-6h14l2 6 M9 21v-7h6v7",
  truck: "M3 5h11v12H3z M14 9h4l3 4v4h-7 M5 17a2 2 0 1 0 4 0 M16 17a2 2 0 1 0 4 0",
  check: "M9 12l2 2 4-4 M12 3l8 4v6c0 4-8 8-8 8s-8-4-8-8V7z",
  route: "M6 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 23a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M6 7v5h12v5",
  home: "M3 10l9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7",
  logout: "M9 3H4v18h5 M13 7l5 5-5 5 M8 12h13",
  menu: "M4 6h16 M4 12h16 M4 18h16",
};

export function PanelIcon({ name }: { name: PanelIconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

const adminLinks: { href: string; label: string; icon: PanelIconName }[] = [
  { href: "/admin", label: "Resumen", icon: "dashboard" },
  { href: "/admin/pedidos", label: "Todos los pedidos", icon: "orders" },
  { href: "/admin/gestionar", label: "Registrar pedido", icon: "plus" },
  { href: "/admin/stock", label: "Inventario", icon: "stock" },
  { href: "/admin/recojo", label: "Recojo en local", icon: "pickup" },
  { href: "/admin/delivery", label: "Pedidos delivery", icon: "truck" },
  { href: "/admin/verificacion", label: "Verificación", icon: "check" },
];
const deliveryLinks: typeof adminLinks = [
  { href: "/delivery", label: "Todos los repartos", icon: "orders" },
  { href: "/delivery/activos", label: "Repartos activos", icon: "truck" },
  { href: "/delivery/ruta", label: "Ruta de entrega", icon: "route" },
  { href: "/delivery/verificar", label: "Verificar entrega", icon: "check" },
  { href: "/delivery/finalizados", label: "Finalizados", icon: "pickup" },
];

export function PanelShell({ role, title, description, action, children }: {
  role: "admin" | "delivery"; title: string; description: string;
  action?: ReactNode; children: ReactNode;
}) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = role === "admin" ? adminLinks : deliveryLinks;
  const roleLabel = role === "admin" ? "Administración" : "Delivery";
  function leave() { logout(); router.push("/ingresar"); }

  return <section className="ops-panel" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }}>
    {menuOpen ? <button type="button" className="panel-backdrop" aria-label="Cerrar navegación" onClick={() => setMenuOpen(false)} /> : null}
    <aside className={`panel-sidebar ${menuOpen ? "is-open" : ""}`} id="panel-navigation">
      <Link href="/" className="panel-brand" aria-label="Yalaza, volver al inicio">
        <Image src="/imagenes/logo-yalazas.png" alt="Yalaza" width={160} height={80} className="h-auto w-32" />
        <span>Gestión del negocio</span>
      </Link>
      <p className="panel-nav-caption">{roleLabel}</p>
      <nav aria-label={`Navegación de ${roleLabel}`} className="panel-nav">
        {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
          aria-current={pathname === link.href ? "page" : undefined}
          className={`panel-nav-link ${pathname === link.href ? "is-active" : ""}`}>
          <PanelIcon name={link.icon} /><span>{link.label}</span>
        </Link>)}
      </nav>
      <div className="panel-sidebar-bottom">
        <Link href="/" className="panel-nav-link"><PanelIcon name="home" /><span>Volver a la web</span></Link>
        <button type="button" onClick={leave} className="panel-nav-link"><PanelIcon name="logout" /><span>Cerrar sesión</span></button>
        <div className="panel-account">
          <span className="panel-avatar">{session?.name.charAt(0) ?? "Y"}</span>
          <div><p>{session?.name ?? roleLabel}</p><span>{role === "admin" ? "Administrador" : "Repartidor"}</span></div>
        </div>
      </div>
    </aside>
    <div className="panel-workspace">
      <header className="panel-topbar">
        <div className="flex items-center gap-3">
          <button type="button" className="panel-menu-button" aria-label={menuOpen ? "Cerrar menú del panel" : "Abrir menú del panel"} aria-expanded={menuOpen} aria-controls="panel-navigation" onClick={() => setMenuOpen(value => !value)}><PanelIcon name="menu" /></button>
          <span className="panel-breadcrumb">Yalaza <span>/</span> {roleLabel}</span>
        </div>
        <span className="panel-role-badge"><span aria-hidden="true" />{roleLabel}</span>
      </header>
      <div className="panel-content">
        <div className="panel-page-heading">
          <div><p className="panel-eyebrow">{role === "admin" ? "Tu negocio, en orden" : "Cada entrega cuenta"}</p><h1>{title}</h1><p className="panel-description">{description}</p></div>
          {action}
        </div>
        {children}
      </div>
    </div>
  </section>;
}

export function PanelMetric({ label, value, hint, icon }: { label: string; value: string | number; hint: string; icon: PanelIconName }) {
  return <div className="panel-metric">
    <div className="panel-metric-top"><span>{label}</span><span className="panel-metric-icon"><PanelIcon name={icon} /></span></div>
    <p className="panel-metric-value">{value}</p><p className="panel-metric-hint">{hint}</p>
  </div>;
}

export function PanelEmpty({ title, description }: { title: string; description: string }) {
  return <div className="panel-empty"><span className="panel-empty-icon"><PanelIcon name="orders" /></span><h2>{title}</h2><p>{description}</p></div>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`panel-status ${status}`}>{orderStatusLabels[status]}</span>;
}
