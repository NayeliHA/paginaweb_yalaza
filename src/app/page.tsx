import { getHomeContent } from "@/controllers/catalog.controller";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { OrderCta } from "@/components/home/OrderCta";

export default function HomePage() {
  const { categories, featuredProducts } = getHomeContent();

  return (
    <>
      <Hero />
      <CategorySection categories={categories} />
      <FeaturedProducts products={featuredProducts} />
      <OrderCta />
    </>
  );
}
