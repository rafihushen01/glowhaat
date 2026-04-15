"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Award, Crown, Flame, Gem, Sparkles, Star, TrendingUp } from "lucide-react";
import UserNav from "./UserNav";
import BrandFooter from "./BrandFooter";
import { serverurl } from "../utils/constants/serverurl";
import { getRecommendationSessionKey, trackRecommendationEvent } from "../utils/recommendation";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2070&auto=format&fit=crop";

const iconMap = {
  bestselling: Crown,
  fivestar: Award,
  newin: Sparkles,
};

const titleMap = {
  bestselling: "Best Selling Items",
  fivestar: "5-Star Rated Items",
  newin: "New In",
};

const subtitleMap = {
  bestselling: "Fastest moving products with delivered order strength",
  fivestar: "Top rated products based on customer review quality",
  newin: "Fresh arrivals personalized for your shopping vibe",
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(Number(price || 0));

const slugifyLoose = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const getProductPrice = (product) => {
  const prices = [];
  [product?.price, product?.baseprice, product?.sellingprice].forEach((value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) prices.push(n);
  });
  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const current = Number(option?.currentprice);
      const base = Number(option?.baseprice);
      if (Number.isFinite(current) && current >= 0) prices.push(current);
      else if (Number.isFinite(base) && base >= 0) prices.push(base);
    });
  });
  return prices.length ? Math.min(...prices) : 0;
};

const flattenNav = (nodes = [], path = [], collector = []) => {
  nodes.forEach((node) => {
    const nextPath = [...path, node?.name].filter(Boolean);
    const slug = slugifyLoose(node?.slug || node?.name);
    if (slug) {
      collector.push({
        slug,
        label: nextPath.join(" > "),
      });
    }
    if (Array.isArray(node?.children) && node.children.length) {
      flattenNav(node.children, nextPath, collector);
    }
  });
  return collector;
};

const buildEndpoint = (mode) => {
  if (mode === "bestselling") return `${serverurl}/item/discovery/best-sellers`;
  if (mode === "fivestar") return `${serverurl}/item/discovery/top-rated`;
  return `${serverurl}/item/discovery/new-in`;
};

const DiscoverySection = ({ mode = "bestselling" }) => {
  const router = useRouter();
  const ModeIcon = iconMap[mode] || TrendingUp;
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cms, setCms] = useState({ bestselling: null, fivestar: null });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filters, setFilters] = useState({
    categoryslug: "",
    days: 30,
    rank: "",
    starfrom: 5,
    starto: 5,
    minstar: 0,
    maxstar: 5,
    brand: "",
    color: "",
    minprice: "",
    maxprice: "",
    bestselling: false,
  });

  const pageLimit = 30;

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const [cmsRes, navRes] = await Promise.all([
          axios.get(`${serverurl}/item/discovery/cms`),
          axios.get(`${serverurl}/nav/nav`),
        ]);
        if (cancelled) return;
        if (cmsRes?.data?.success) setCms(cmsRes.data.data || {});
        if (navRes?.data?.success) {
          const options = flattenNav(navRes.data.data || []);
          setCategories(options);
        }
      } catch (_error) {
        // silent fallback
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = async (nextPage, append = false) => {
    const payload = {
      page: nextPage,
      limit: pageLimit,
      sessionkey: getRecommendationSessionKey(),
    };

    if (filters.categoryslug) payload.categoryslug = filters.categoryslug;

    if (mode === "bestselling") {
      payload.days = filters.days;
      if (filters.rank) payload.rank = filters.rank;
    }
    if (mode === "fivestar") {
      payload.starfrom = filters.starfrom;
      payload.starto = filters.starto;
      if (filters.brand) payload.brand = filters.brand;
      if (filters.color) payload.color = filters.color;
      if (filters.minprice) payload.minprice = filters.minprice;
      if (filters.maxprice) payload.maxprice = filters.maxprice;
    }
    if (mode === "newin") {
      payload.days = filters.days;
      if (filters.brand) payload.brand = filters.brand;
      if (filters.color) payload.color = filters.color;
      if (filters.minstar) payload.minstar = filters.minstar;
      if (filters.maxstar !== 5) payload.maxstar = filters.maxstar;
      if (filters.minprice) payload.minprice = filters.minprice;
      if (filters.maxprice) payload.maxprice = filters.maxprice;
      if (filters.bestselling) payload.bestselling = 1;
    }

    const res = await axios.get(buildEndpoint(mode), { params: payload });
    if (!res?.data?.success) return;
    setMeta(res.data.meta || {});
    setItems((prev) => (append ? [...prev, ...(res.data.items || [])] : res.data.items || []));
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        await fetchData(1, false);
      } catch (_error) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [mode, filters.categoryslug, filters.days, filters.rank, filters.starfrom, filters.starto, filters.minstar, filters.maxstar, filters.brand, filters.color, filters.minprice, filters.maxprice, filters.bestselling]);

  const handleLoadMore = async () => {
    const current = Number(meta.page || 1);
    const total = Number(meta.total || 0);
    if (items.length >= total) return;
    try {
      setLoadingMore(true);
      await fetchData(current + 1, true);
    } finally {
      setLoadingMore(false);
    }
  };

  const brandOptions = useMemo(() => {
    const values = new Set();
    items.forEach((item) => {
      const brand = String(item?.brand || "").trim();
      if (brand) values.add(brand);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const colorOptions = useMemo(() => {
    const values = new Set();
    items.forEach((item) => {
      (item?.variants || []).forEach((variant) => {
        if (String(variant?.varianttype || "").toLowerCase().includes("color")) {
          const name = String(variant?.name || "").trim();
          if (name) values.add(name);
        }
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const bannerImage =
    (mode === "bestselling" ? cms?.bestselling?.image : mode === "fivestar" ? cms?.fivestar?.image : "") || FALLBACK_BANNER;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40">
      <UserNav />
      <div className="h-32 md:h-36" />

      <section className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200">
          <img src={bannerImage} alt={titleMap[mode]} className="h-[220px] w-full object-cover md:h-[320px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-900/45 to-transparent" />
          <div className="absolute inset-0 p-5 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
              <ModeIcon className="h-4 w-4" />
              Khan Cosmetics Discovery
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white md:text-5xl">{titleMap[mode]}</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-100 md:text-base">{subtitleMap[mode]}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 grid w-full max-w-[1400px] grid-cols-1 gap-4 px-4 pb-8 md:px-8 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-2xl border border-emerald-200 bg-white p-4 lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Filters</p>

          <div className="mt-4 space-y-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Category</label>
            <select
              value={filters.categoryslug}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryslug: e.target.value }))}
              className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
            >
              <option value="">Recommended (All)</option>
              {categories.map((category) => (
                <option key={category.slug + category.label} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {(mode === "bestselling" || mode === "newin") && (
            <div className="mt-4 space-y-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Time Window</label>
              <select
                value={filters.days}
                onChange={(e) => setFilters((prev) => ({ ...prev, days: Number(e.target.value) }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value={30}>Last 30 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={7}>Last 7 Days</option>
                <option value={4}>Last 4 Days</option>
              </select>
            </div>
          )}

          {mode === "bestselling" && (
            <div className="mt-4 space-y-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Rank Position</label>
              <select
                value={filters.rank}
                onChange={(e) => setFilters((prev) => ({ ...prev, rank: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value="">Top 1 - 40</option>
                {Array.from({ length: 40 }).map((_, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    No. {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "fivestar" && (
            <div className="mt-4 space-y-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Stars</label>
              <select
                value={filters.starfrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, starfrom: Number(e.target.value), starto: 5 }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value={5}>5 Star</option>
                <option value={4}>4 Star & Up</option>
                <option value={3}>3 Star & Up</option>
                <option value={2}>2 Star & Up</option>
                <option value={1}>1 Star & Up</option>
              </select>
            </div>
          )}

          {mode === "newin" && (
            <div className="mt-4 flex items-center gap-2">
              <input
                id="newin-bestseller"
                type="checkbox"
                checked={filters.bestselling}
                onChange={(e) => setFilters((prev) => ({ ...prev, bestselling: e.target.checked }))}
                className="accent-emerald-700"
              />
              <label htmlFor="newin-bestseller" className="text-sm font-medium text-emerald-800">
                Only Best Seller Items
              </label>
            </div>
          )}

          {(mode === "fivestar" || mode === "newin") && (
            <>
              <div className="mt-4 space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                >
                  <option value="">All Brands</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Color</label>
                <select
                  value={filters.color}
                  onChange={(e) => setFilters((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                >
                  <option value="">All Colors</option>
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <input
                  value={filters.minprice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minprice: e.target.value }))}
                  placeholder="Min price"
                  className="rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                />
                <input
                  value={filters.maxprice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxprice: e.target.value }))}
                  placeholder="Max price"
                  className="rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() =>
              setFilters({
                categoryslug: "",
                days: 30,
                rank: "",
                starfrom: 5,
                starto: 5,
                minstar: 0,
                maxstar: 5,
                brand: "",
                color: "",
                minprice: "",
                maxprice: "",
                bestselling: false,
              })
            }
            className="mt-5 w-full rounded-xl border border-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 hover:bg-emerald-700 hover:text-white"
          >
            Reset Filters
          </button>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-emerald-900">
              Showing {items.length} / {Number(meta.total || 0)} items
            </p>
            {mode === "bestselling" ? (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Window: Last {Number(meta.days || filters.days)} days
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-2xl border border-emerald-100 bg-white p-3">
                  <div className="aspect-[4/5] rounded-xl bg-emerald-50" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-emerald-50" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white py-20 text-center text-emerald-800">
              No product found for this filter.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => {
                  const price = getProductPrice(product);
                  const rating = Number(product?.star || 0);
                  const image = product?.whiteimage || product?.hoverimage || product?.variants?.[0]?.images?.[0] || "";
                  const isBestSeller = Boolean(product?.isbestseller) || (product?.bestsellerrank && product.bestsellerrank <= 40);

                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => {
                        trackRecommendationEvent({
                          eventtype: "product_click",
                          slug: product.slug,
                        });
                        router.push(`/product/${product.slug}`);
                      }}
                      className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(5,150,105,0.65)]"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-emerald-50">
                        {image ? <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : null}
                        {isBestSeller ? (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-violet-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-md">
                            <Gem className="h-3 w-3" />
                            Best Seller
                          </span>
                        ) : null}
                        {product?.bestsellerrank ? (
                          <span className="absolute right-2 top-2 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                            No.{product.bestsellerrank}
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 min-h-[38px] text-sm font-semibold text-emerald-900">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.1em] text-emerald-700">{product.brand || "Khan Cosmetics"}</p>
                        <p className="mt-2 text-base font-bold text-emerald-900">{formatPrice(price)}</p>
                        <div className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {rating > 0 ? rating.toFixed(1) : "New"}
                          {mode === "bestselling" ? <Flame className="ml-2 h-3.5 w-3.5 text-emerald-600" /> : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {Boolean(meta.hasmore) && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-white px-8 py-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 hover:bg-emerald-700 hover:text-white disabled:opacity-70"
                  >
                    {loadingMore ? "Loading..." : "View More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <BrandFooter />
    </div>
  );
};

export default DiscoverySection;

