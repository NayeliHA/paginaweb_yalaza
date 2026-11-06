import { getMenuContent } from "@/controllers/catalog.controller";
import { MenuExplorer } from "@/components/menu/MenuExplorer";
import { Suspense } from "react";

export default function MenuPage() {
  const { categories, products } = getMenuContent();

  return (
    <Suspense fallback={<p className="p-10" role="status">Cargando menú...</p>}><MenuExplorer
      categories={categories}
      products={products}
    /></Suspense>
  );
}
