import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yalaza | Alitas y comida rápida",
  description:
    "Yalaza es un emprendimiento de comida rápida especializado en alitas, combos, acompañamientos y bebidas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
