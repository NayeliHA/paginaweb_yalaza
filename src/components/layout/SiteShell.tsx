import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { OrderProvider } from "@/components/orders/OrderProvider";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OrderProvider>
        <div className="flex min-h-full flex-col bg-ink">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </OrderProvider>
    </AuthProvider>
  );
}
