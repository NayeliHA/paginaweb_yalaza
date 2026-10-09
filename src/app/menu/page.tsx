import { getMenuContent } from "@/controllers/catalog.controller";
import { MenuExplorer } from "@/components/menu/MenuExplorer";

export default async function MenuPage({
  searchParams,
}: PageProps<"/menu">) {
  const { categories, products } = getMenuContent();
  const params = await searchParams;

  return (
    <MenuExplorer
      categories={categories}
      products={products}
      initialCategorySlug={
        typeof params.categoria === "string" ? params.categoria : undefined
      }
    />
  );
}
