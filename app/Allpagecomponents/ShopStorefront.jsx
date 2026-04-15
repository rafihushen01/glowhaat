"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import SellerChatDrawer from "./SellerChatDrawer";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(Number(price || 0));

const getProductPrice = (product) => {
  const prices = [];

  [product?.price, product?.baseprice, product?.sellingprice].forEach((value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) prices.push(n);
  });

  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const current = Number(option?.currentprice);
      if (Number.isFinite(current) && current >= 0) {
        prices.push(current);
        return;
      }

      const base = Number(option?.baseprice);
      if (Number.isFinite(base) && base >= 0) prices.push(base);
    });
  });

  return prices.length ? Math.min(...prices) : 0;
};

const getPricingMeta = (product) => {
  const current = getProductPrice(product);
  let original = Number(product?.baseprice || 0);

  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const base = Number(option?.baseprice);
      const now = Number(option?.currentprice);
      if (Number.isFinite(base) && base > original && (!Number.isFinite(now) || now <= current)) {
        original = base;
      }
    });
  });

  const discount = original > current ? Math.round(((original - current) / original) * 100) : 0;
  return { current, original: original > current ? original : null, discount };
};

const ShopStorefront = () => {
  const router = useRouter();
  const params = useParams();
  const slug = String(params?.slug || "").trim().toLowerCase();

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({ totalproducts: 0, totalsales: 0, averageRating: 0 });
  const [filters, setFilters] = useState({
    colors: [],
    sizes: [],
    brands: [],
    minPrice: 0,
    maxPrice: 0,
    minRating: 0,
    maxRating: 0,
    availability: { in_stock: 0, out_of_stock: 0 },
  });

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [availability, setAvailability] = useState("all");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [ratingRange, setRatingRange] = useState([0, 0]);

  const payload = useMemo(
    () => ({
      search: search.trim(),
      sort,
      availability: availability === "all" ? "" : availability,
      colors: selectedColors.join(","),
      sizes: selectedSizes.join(","),
      brands: selectedBrands.join(","),
      minprice: priceRange[0],
      maxprice: priceRange[1],
      minrating: ratingRange[0],
      maxrating: ratingRange[1],
      page,
      limit: 24,
    }),
    [search, sort, availability, selectedColors, selectedSizes, selectedBrands, priceRange, ratingRange, page]
  );

  useEffect(() => {
    if (!slug) return;

    let ignore = false;

    const loadShop = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await axios.get(`${serverurl}/seller/public/shop/${slug}`, {
          params: { page: 1, limit: 24 },
          timeout: 25000,
        });

        if (!data?.success) throw new Error(data?.message || "Failed to load seller profile.");
        if (ignore) return;

        setShop(data.shop || null);
        setStats(data.stats || { totalproducts: 0, totalsales: 0, averageRating: 0 });
        setFilters(data.filters || {});
        setProducts(data.products || []);
        setPage(data.page || 1);
        setPages(data.pages || 1);

        const min = Number(data?.filters?.minPrice || 0);
        const max = Number(data?.filters?.maxPrice || 0);
        const minRating = Number(data?.filters?.minRating || 0);
        const maxRating = Number(data?.filters?.maxRating || 0);
        setPriceRange([min, max]);
        setRatingRange([minRating, maxRating]);
      } catch (err) {
        if (!ignore) setError(err?.response?.data?.message || err?.message || "Failed to load shop.");
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadingProducts(false);
        }
      }
    };

    loadShop();

    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || !shop?._id) return;

    let ignore = false;
    const timer = setTimeout(async () => {
      setLoadingProducts(true);

      try {
        const { data } = await axios.get(`${serverurl}/seller/public/shop/${slug}`, {
          params: payload,
          timeout: 25000,
        });

        if (!data?.success || ignore) return;
        setProducts(data.products || []);
        setPages(data.pages || 1);
      } catch (_error) {
        if (!ignore) setError("Failed to load filtered products.");
      } finally {
        if (!ignore) setLoadingProducts(false);
      }
    }, 260);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [payload, slug, shop?._id]);

  const resetFilters = () => {
    setSearch("");
    setSort("newest");
    setAvailability("all");
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setPriceRange([Number(filters.minPrice || 0), Number(filters.maxPrice || 0)]);
    setRatingRange([Number(filters.minRating || 0), Number(filters.maxRating || 0)]);
    setPage(1);
  };

  if (loading) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-emerald-800">Loading seller storefront...</div>;
  }

  if (error || !shop) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-rose-600">{error || "Shop not found."}</div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f3fbf7_0%,#ffffff_22%,#f8fffb_100%)]">
      <section className="relative h-[280px] overflow-hidden md:h-[360px]">
        <img
          src={shop.bannerimage || shop.profileimage || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070&auto=format&fit=crop"}
          alt={shop.shopname}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-7xl items-end gap-4 px-4 pb-6">
          <img
            src={shop.profileimage || "https://dummyimage.com/120x120/1f5c49/ffffff&text=Shop"}
            alt={shop.shopname}
            className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-xl md:h-28 md:w-28"
          />

          <div className="flex-1 pb-1 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">KhanCosmetics Seller Profile</p>
            <h1 className="mt-1 text-2xl font-bold md:text-4xl">{shop.shopname}</h1>
            <p className="mt-1 line-clamp-2 text-sm text-emerald-100 md:text-base">{shop.description || "Trusted seller on KhanCosmetics."}</p>
          </div>

          <div className="hidden pb-2 md:block">
            <SellerChatDrawer
              shop={shop}
              buttonClassName="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900 hover:bg-emerald-50"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4 md:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">All Products</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.totalproducts}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Total Sold</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.totalsales}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Average Rating</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{Number(stats.averageRating || 0).toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-end md:hidden">
            <SellerChatDrawer
              shop={shop}
              buttonClassName="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 lg:sticky lg:top-20">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>

            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Search</label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-emerald-700" />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Search this shop"
                className="w-full bg-transparent text-sm text-emerald-900 outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Availability</label>
              <div className="mt-2 space-y-1 text-sm text-emerald-900">
                {["all", "in_stock", "out_of_stock"].map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={availability === value}
                      onChange={() => {
                        setPage(1);
                        setAvailability(value);
                      }}
                      className="accent-emerald-700"
                    />
                    {value.replace("_", " ")}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Sort By</label>
              <select
                value={sort}
                onChange={(e) => {
                  setPage(1);
                  setSort(e.target.value);
                }}
                className="mt-2 h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm text-emerald-900"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_low_high">Price Low-High</option>
                <option value="price_high_low">Price High-Low</option>
                <option value="rating_high_low">Rating High-Low</option>
                <option value="name_az">Name A-Z</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Price</label>
              <div className="mt-2 rounded-xl border border-emerald-200 bg-white p-3">
                <div className="mb-2 flex justify-between text-xs text-emerald-700">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
                <input
                  type="range"
                  min={filters.minPrice || 0}
                  max={filters.maxPrice || filters.minPrice || 0}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPage(1);
                    setPriceRange((prev) => [Math.min(next, prev[1]), prev[1]]);
                  }}
                  className="w-full accent-emerald-700"
                />
                <input
                  type="range"
                  min={filters.minPrice || 0}
                  max={filters.maxPrice || filters.minPrice || 0}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPage(1);
                    setPriceRange((prev) => [prev[0], Math.max(prev[0], next)]);
                  }}
                  className="w-full accent-emerald-700"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Rating</label>
              <div className="mt-2 rounded-xl border border-emerald-200 bg-white p-3">
                <div className="mb-2 flex justify-between text-xs text-emerald-700">
                  <span>{ratingRange[0]}?</span>
                  <span>{ratingRange[1]}?</span>
                </div>
                <input
                  type="range"
                  min={filters.minRating || 0}
                  max={filters.maxRating || 0}
                  value={ratingRange[0]}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPage(1);
                    setRatingRange((prev) => [Math.min(next, prev[1]), prev[1]]);
                  }}
                  className="w-full accent-emerald-700"
                />
                <input
                  type="range"
                  min={filters.minRating || 0}
                  max={filters.maxRating || 0}
                  value={ratingRange[1]}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPage(1);
                    setRatingRange((prev) => [prev[0], Math.max(prev[0], next)]);
                  }}
                  className="w-full accent-emerald-700"
                />
              </div>
            </div>

            {[{ title: "Color", values: filters.colors || [], selected: selectedColors, setter: setSelectedColors }, { title: "Size", values: filters.sizes || [], selected: selectedSizes, setter: setSelectedSizes }, { title: "Brand", values: filters.brands || [], selected: selectedBrands, setter: setSelectedBrands }].map((entry) => (
              <div key={entry.title} className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{entry.title}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.values.map((value) => {
                    const isActive = entry.selected.includes(value);
                    return (
                      <button
                        key={`${entry.title}-${value}`}
                        type="button"
                        onClick={() => {
                          setPage(1);
                          entry.setter((prev) =>
                            prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
                          );
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-emerald-200 bg-white text-emerald-800"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 w-full rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 hover:bg-emerald-100"
            >
              Reset All
            </button>
          </aside>

          <section>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-emerald-900">{products.length} products found</p>
              <p className="text-xs text-emerald-700">Page {page} / {pages}</p>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse rounded-2xl border border-emerald-100 bg-white p-3">
                    <div className="aspect-[4/5] rounded-xl bg-emerald-50" />
                    <div className="mt-3 h-3 w-3/4 rounded bg-emerald-50" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-emerald-50" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-white py-16 text-center">
                <p className="text-lg font-semibold text-emerald-900">No product found with this filter.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const media = product.whiteimage || product.hoverimage || product?.variants?.[0]?.images?.[0] || "";
                  const pricing = getPricingMeta(product);
                  const rating = Number(product?.star || 0);
                  const roundedRating = Math.round(Math.max(0, Math.min(5, rating)));

                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => router.push(`/product/${product.slug}`)}
                      className="group overflow-hidden rounded-2xl border border-emerald-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-22px_rgba(16,92,72,.85)]"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-emerald-50">
                        {media ? (
                          <img src={media} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-emerald-700">No image</div>
                        )}
                        {pricing.discount > 0 ? (
                          <span className="absolute left-2 top-2 rounded-full bg-emerald-800 px-2 py-1 text-[10px] font-semibold text-white">
                            -{pricing.discount}%
                          </span>
                        ) : null}
                      </div>

                      <div className="p-3">
                        <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-emerald-950">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.08em] text-emerald-700">{product.brand || shop.shopname}</p>

                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-base font-bold text-emerald-900">{formatPrice(pricing.current)}</p>
                          {pricing.original ? <p className="text-xs text-emerald-600 line-through">{formatPrice(pricing.original)}</p> : null}
                        </div>

                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${product._id}-star-${index}`}
                              className={`h-3.5 w-3.5 ${index < roundedRating ? "fill-amber-400 text-amber-400" : "text-emerald-200"}`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-semibold text-emerald-700">
                            {rating > 0 ? rating.toFixed(1) : "New"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                disabled={page >= pages}
                className="rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShopStorefront;
