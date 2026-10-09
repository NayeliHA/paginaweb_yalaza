"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingCart } from "@/components/orders/FloatingCart";
import { OrderProvider } from "@/components/orders/OrderProvider";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPanelRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/delivery");

  return (
    <AuthProvider>
      <OrderProvider>
        <div className="flex min-h-screen flex-col bg-ink">
          {isPanelRoute ? null : <Navbar />}
          <main className="flex-1">{children}</main>
          {isPanelRoute ? null : <FloatingCart />}
          {isPanelRoute ? null : <Footer />}
        </div>
      </OrderProvider>
    </AuthProvider>
  );
}
