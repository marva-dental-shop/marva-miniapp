import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { supabase } from "@/lib/supabase";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const activeCategory = params?.category || "all";
  const searchQuery = params?.q?.trim() || "";

  const { data: categoriesData } = supabase
    ? await supabase.from("categories").select("*").order("id", { ascending: true })
    : { data: [] };

  let productsBuilder = supabase
    ? supabase.from("products").select("*").eq("is_active", true)
    : null;

  if (productsBuilder && activeCategory !== "all") {
    productsBuilder = productsBuilder.eq("category_id", Number(activeCategory));
  }

  if (productsBuilder && searchQuery) {
    const safeQuery = searchQuery.replace(/[%_]/g, "");
    productsBuilder = productsBuilder.or(
      `name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
    );
  }

  const { data: productsData } = productsBuilder
    ? await productsBuilder.order("id", { ascending: false })
    : { data: [] };

  const categories = categoriesData || [];
  const products =
    (productsData || []).map((product) => ({
      id: String(product.id),
      slug: `product-${product.id}`,
      categoryId: product.category_id ? String(product.category_id) : "",
      name: product.name,
      price: Number(product.price || 0),
      oldPrice: product.old_price ? Number(product.old_price) : undefined,
      currency: "USD",
      image: product.images?.[0] || product.image_url || "",
      shortDescription: product.description || "Dental mahsulot",
      description: product.description || "Dental mahsulot",
      stock: Number(product.stock || 0),
      featured: Boolean(product.is_featured),
    })) || [];

  const buildCategoryHref = (categoryId?: string | number) => {
    if (!categoryId || categoryId === "all") {
      return searchQuery
        ? `/catalog?q=${encodeURIComponent(searchQuery)}`
        : "/catalog";
    }

    return searchQuery
      ? `/catalog?category=${categoryId}&q=${encodeURIComponent(searchQuery)}`
      : `/catalog?category=${categoryId}`;
  };

  return (
    <div className="min-h-screen bg-[#EEF3F1] pb-28">
      <Container className="py-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#12332D] shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-black/5"
            >
              <ArrowLeft size={22} />
            </Link>

            <form action="/catalog" method="GET" className="flex flex-1 items-center gap-3">
              {activeCategory !== "all" ? (
                <input type="hidden" name="category" value={activeCategory} />
              ) : null}

              <div className="flex min-h-[56px] flex-1 items-center gap-3 rounded-[18px] bg-[#F4F7F6] px-4">
                <Search size={20} className="text-[#6D8781]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Mahsulot va kategoriyalarni qidiring"
                  className="w-full bg-transparent text-[15px] text-[#12332D] outline-none placeholder:text-[#6D8781]"
                />
              </div>
            </form>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#6D8781]">MARVA Dental market</p>
              <h1 className="mt-1 text-[30px] font-bold text-[#12332D]">
                Katalog
              </h1>
              <p className="mt-1 text-sm text-[#5D7E78]">
                {products.length} ta mahsulot topildi
              </p>
            </div>

            {searchQuery ? (
              <div className="rounded-full bg-[#F4F7F6] px-3 py-2 text-xs font-semibold text-[#12332D]">
                “{searchQuery}”
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div>
            <h2 className="text-[22px] font-bold text-[#12332D]">
              Kategoriyalar
            </h2>
            <p className="mt-1 text-sm text-[#5D7E78]">
              Kerakli bo‘limni tanlang
            </p>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <Link
              href={buildCategoryHref("all")}
              className={`shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition ${
                activeCategory === "all"
                  ? "bg-[#004F45] text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
                  : "bg-[#F8FBFA] text-[#12332D] ring-1 ring-black/5"
              }`}
            >
              Barchasi
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === String(category.id);

              return (
                <Link
                  key={category.id}
                  href={buildCategoryHref(category.id)}
                  className={`shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#004F45] text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
                      : "bg-[#F8FBFA] text-[#12332D] ring-1 ring-black/5"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[22px] font-bold text-[#12332D]">
                Mahsulotlar
              </h3>
              <p className="mt-1 text-sm text-[#5D7E78]">
                {searchQuery
                  ? `“${searchQuery}” bo‘yicha natijalar`
                  : "Sizga mos dental mahsulotlar"}
              </p>
            </div>

            <div className="rounded-full bg-[#F4F7F6] px-3 py-2 text-xs font-semibold text-[#12332D]">
              {products.length} ta
            </div>
          </div>

          {products.length === 0 ? (
            <div className="mt-5 rounded-[22px] bg-[#F8FBFA] p-6 text-center">
              <p className="text-base font-semibold text-[#12332D]">
                Mahsulot topilmadi
              </p>
              <p className="mt-2 text-sm text-[#5D7E78]">
                Boshqa so‘z yoki kategoriyani tanlab ko‘ring
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </Container>

      <BottomNav />
    </div>
  );
}