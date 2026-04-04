"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Filter, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";

const ITEM_URL = `${serverurl}/item`;
const CATEGORY_URL = `${serverurl}/category/public/full`;
const NAV_URL = `${serverurl}/nav/nav`;

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070&auto=format&fit=crop";

const normalizeText = (value) => String(value || "").trim();

const slugifyLoose = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const formatPrice = (price) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(Number(price || 0));

const getPrimaryImage = (node) => {
  if (!node) return "";
  if (Array.isArray(node.images) && node.images[0]?.image) return node.images[0].image;
  if (node.image) return node.image;
  return "";
};

const findNodeBySlug = (nodes, slug) => {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    if (slugifyLoose(node.slug || node.name) === slug) return node;
    if (Array.isArray(node.children) && node.children.length) {
      const found = findNodeBySlug(node.children, slug);
      if (found) return found;
    }
  }
  return null;
};

const findNodePathBySlug = (nodes, slug, path = []) => {
  if (!Array.isArray(nodes)) return null;
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (slugifyLoose(node.slug || node.name) === slug) return currentPath;
    if (Array.isArray(node.children) && node.children.length) {
      const found = findNodePathBySlug(node.children, slug, currentPath);
      if (found) return found;
    }
  }
  return null;
};

const findSegmentMeta = (categories, slug) => {
  for (const category of categories || []) {
    const segment = (category.segments || []).find((entry) => slugifyLoose(entry.slug || entry.name) === slug);
    if (!segment) continue;

    return {
      title: segment.name || category.name,
      image: segment.image || getPrimaryImage(segment) || getPrimaryImage(category.navroot),
      navPath: Array.isArray(segment.navpath) ? segment.navpath : [],
    };
  }
  return null;
};

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

const getProductStock = (product) => {
  let stock = 0;
  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const qty = Number(option?.stock || 0);
      if (Number.isFinite(qty) && qty > 0) stock += qty;
    });
  });
  return stock;
};

const getProductRating = (product) => {
  const rating = Number(product?.star);
  if (!Number.isFinite(rating) || rating < 0) return 0;
  return Math.min(5, rating);
};

const getProductPricingMeta = (product) => {
  let bestCurrent = Number.POSITIVE_INFINITY;
  let bestBase = null;
  let bestDiscountPercentage = 0;

  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const current = Number(option?.currentprice);
      const base = Number(option?.baseprice);
      const discountFromOption = Number(option?.discountpercentage);
      const effectiveCurrent = Number.isFinite(current) && current >= 0 ? current : Number.isFinite(base) ? base : null;

      if (effectiveCurrent === null || effectiveCurrent >= bestCurrent) return;

      bestCurrent = effectiveCurrent;
      bestBase = Number.isFinite(base) && base >= 0 ? base : null;
      bestDiscountPercentage = Number.isFinite(discountFromOption) && discountFromOption > 0 ? discountFromOption : 0;
    });
  });

  const shownPrice = getProductPrice(product);
  if (!Number.isFinite(bestCurrent) || bestCurrent === Number.POSITIVE_INFINITY) bestCurrent = shownPrice;

  const fallbackBase = Number(product?.baseprice);
  if ((!Number.isFinite(bestBase) || bestBase === null) && Number.isFinite(fallbackBase) && fallbackBase > 0) {
    bestBase = fallbackBase;
  }

  let discountPercentage = Math.round(bestDiscountPercentage);
  if ((!discountPercentage || discountPercentage <= 0) && Number.isFinite(bestBase) && bestBase > bestCurrent) {
    discountPercentage = Math.round(((bestBase - bestCurrent) / bestBase) * 100);
  }

  return {
    originalPrice: Number.isFinite(bestBase) && bestBase > bestCurrent ? bestBase : null,
    discountPercentage: Math.max(0, discountPercentage || 0),
  };
};

const SegmentPage = () => {
  const params = useParams();
  const slug = slugifyLoose(params?.slug || "all");
  const router = useRouter();

  const [catalogMeta, setCatalogMeta] = useState({
    title: "",
    image: FALLBACK_BANNER,
    breadcrumb: [],
    children: [],
  });

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [ratingRange, setRatingRange] = useState([0, 0]);

  const activePills = [
    ...selectedColors.map((c) => ({ key: `c-${c}`, label: c, type: "color", value: c })),
    ...selectedSizes.map((s) => ({ key: `s-${s}`, label: s, type: "size", value: s })),
    ...selectedBrands.map((b) => ({ key: `b-${b}`, label: b, type: "brand", value: b })),
    ...(availability !== "all" ? [{ key: `a-${availability}`, label: availability.replace("_", " "), type: "availability", value: availability }] : []),
    ...(ratingRange[0] !== filters.minRating || ratingRange[1] !== filters.maxRating
      ? [{ key: "r-range", label: `${ratingRange[0]}★ to ${ratingRange[1]}★`, type: "rating" }]
      : []),
  ];

  useEffect(() => {
    let cancelled = false;

    const loadMeta = async () => {
      try {
        setLoadingMeta(true);

        const [categoryRes, navRes] = await Promise.all([axios.get(CATEGORY_URL), axios.get(NAV_URL)]);
        if (cancelled) return;

        const categories = categoryRes?.data?.success ? categoryRes.data.data || [] : [];
        const navTree = navRes?.data?.success ? navRes.data.data || [] : [];

        const segmentMeta = findSegmentMeta(categories, slug);
        const navNode = findNodeBySlug(navTree, slug);
        const navPath = findNodePathBySlug(navTree, slug) || [];

        const title =
          segmentMeta?.title || navNode?.name || normalizeText(slug).replace(/-/g, " ") || "Khan Cosmetics";

        const image =
          segmentMeta?.image || getPrimaryImage(navNode) || getPrimaryImage(navPath[navPath.length - 1]) || FALLBACK_BANNER;

        const breadcrumb = segmentMeta?.navPath?.length
          ? segmentMeta.navPath
          : navPath.map((node) => ({ _id: node._id, name: node.name, slug: node.slug }));

        const children = Array.isArray(navNode?.children)
          ? navNode.children.map((child) => ({
              _id: child._id,
              name: child.name,
              slug: slugifyLoose(child.slug || child.name),
              image: getPrimaryImage(child),
            }))
          : [];

        setCatalogMeta({ title, image, breadcrumb, children });
      } catch (error) {
        console.error("Meta load failed", error);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };

    if (slug) loadMeta();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const loadFilters = async () => {
      try {
        const response = await axios.get(`${ITEM_URL}/category/filters/${slug}`);
        if (!response?.data?.success || cancelled) return;

        const payload = response.data.filters || {};
        const min = Number(payload.minPrice || 0);
        const max = Number(payload.maxPrice || 0);
        const minRating = Number(payload.minRating || 0);
        const maxRating = Number(payload.maxRating || 0);

        setFilters({
          colors: payload.colors || [],
          sizes: payload.sizes || [],
          brands: payload.brands || [],
          minPrice: min,
          maxPrice: max,
          minRating,
          maxRating,
          availability: payload.availability || { in_stock: 0, out_of_stock: 0 },
        });

        setPriceRange([min, max]);
        setRatingRange([minRating, maxRating]);
      } catch (error) {
        console.error("Filters load failed", error);
      }
    };

    if (slug) loadFilters();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const payload = useMemo(
    () => ({
      colors: selectedColors,
      sizes: selectedSizes,
      brands: selectedBrands,
      availability: availability === "all" ? "" : availability,
      minprice: priceRange[0],
      maxprice: priceRange[1],
      minrating: ratingRange[0],
      maxrating: ratingRange[1],
      sort,
      search: search.trim(),
    }),
    [selectedColors, selectedSizes, selectedBrands, availability, priceRange, ratingRange, sort, search]
  );

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        const response = await axios.post(`${ITEM_URL}/category/filter/${slug}`, payload);
        if (!cancelled && response?.data?.success) {
          setProducts(response.data.data || []);
        }
      } catch (error) {
        console.error("Products load failed", error);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, payload]);

  const clearAll = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setAvailability("all");
    setSort("newest");
    setSearch("");
    setPriceRange([filters.minPrice, filters.maxPrice]);
    setRatingRange([filters.minRating, filters.maxRating]);
  };

  const removePill = (pill) => {
    if (pill.type === "color") setSelectedColors((prev) => prev.filter((entry) => entry !== pill.value));
    if (pill.type === "size") setSelectedSizes((prev) => prev.filter((entry) => entry !== pill.value));
    if (pill.type === "brand") setSelectedBrands((prev) => prev.filter((entry) => entry !== pill.value));
    if (pill.type === "availability") setAvailability("all");
    if (pill.type === "rating") setRatingRange([filters.minRating, filters.maxRating]);
  };

  const renderFilterPanel = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Search</p>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <Search className="h-4 w-4 text-[#2f6456]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in this segment"
            className="w-full bg-transparent text-sm text-[#1f5c49] placeholder:text-[#89a79c] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Price</p>
        <div className="mt-2 rounded-xl border border-[#d4e7df] bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-[#1f5c49]">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <input
            type="range"
            min={filters.minPrice}
            max={filters.maxPrice || filters.minPrice}
            value={priceRange[0]}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPriceRange((prev) => [Math.min(next, prev[1]), prev[1]]);
            }}
            className="w-full accent-[#1f5c49]"
          />
          <input
            type="range"
            min={filters.minPrice}
            max={filters.maxPrice || filters.minPrice}
            value={priceRange[1]}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPriceRange((prev) => [prev[0], Math.max(prev[0], next)]);
            }}
            className="w-full accent-[#1f5c49]"
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Review Rating</p>
        <div className="mt-2 rounded-xl border border-[#d4e7df] bg-white p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { label: "All ratings", type: "all" },
              { label: "4★ & up", value: 4 },
              { label: "3★ & up", value: 3 },
            ].map((preset) => {
              const isAll = preset.type === "all";
              const disabled = isAll ? false : filters.maxRating < preset.value;
              const active = isAll
                ? ratingRange[0] === filters.minRating && ratingRange[1] === filters.maxRating
                : !disabled && ratingRange[0] === preset.value && ratingRange[1] === filters.maxRating;

              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    setRatingRange(
                      isAll ? [filters.minRating, filters.maxRating] : [preset.value, filters.maxRating]
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    active
                      ? "border-[#1f5c49] bg-[#1f5c49] text-white"
                      : "border-[#d4e7df] bg-white text-[#1f5c49]"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="mb-2 flex items-center justify-between text-xs text-[#1f5c49]">
            <span>{ratingRange[0]}★</span>
            <span>{ratingRange[1]}★</span>
          </div>
          <input
            type="range"
            min={filters.minRating}
            max={filters.maxRating || filters.minRating}
            value={ratingRange[0]}
            disabled={filters.maxRating === filters.minRating}
            onChange={(e) => {
              const next = Number(e.target.value);
              setRatingRange((prev) => [Math.min(next, prev[1]), prev[1]]);
            }}
            className="w-full accent-[#1f5c49] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <input
            type="range"
            min={filters.minRating}
            max={filters.maxRating || filters.minRating}
            value={ratingRange[1]}
            disabled={filters.maxRating === filters.minRating}
            onChange={(e) => {
              const next = Number(e.target.value);
              setRatingRange((prev) => [prev[0], Math.max(prev[0], next)]);
            }}
            className="w-full accent-[#1f5c49] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <p className="mt-2 text-[11px] text-[#6d8b80]">
            Category rating range: {filters.minRating}★ to {filters.maxRating}★
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Availability</p>
        <div className="mt-2 space-y-2 text-sm text-[#1f5c49]">
          {[
            { value: "all", label: "All" },
            { value: "in_stock", label: `In Stock (${filters.availability.in_stock || 0})` },
            { value: "out_of_stock", label: `Out of Stock (${filters.availability.out_of_stock || 0})` },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2">
              <input
                type="radio"
                value={item.value}
                checked={availability === item.value}
                onChange={(e) => setAvailability(e.target.value)}
                className="accent-[#1f5c49]"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Color</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.colors.map((color) => {
            const selected = selectedColors.includes(color);
            return (
              <button
                key={color}
                type="button"
                onClick={() =>
                  setSelectedColors((prev) =>
                    prev.includes(color) ? prev.filter((entry) => entry !== color) : [...prev, color]
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  selected
                    ? "border-[#1f5c49] bg-[#1f5c49] text-white"
                    : "border-[#d4e7df] bg-white text-[#1f5c49]"
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.sizes.map((size) => {
            const selected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() =>
                  setSelectedSizes((prev) =>
                    prev.includes(size) ? prev.filter((entry) => entry !== size) : [...prev, size]
                  )
                }
                className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                  selected
                    ? "border-[#1f5c49] bg-[#1f5c49] text-white"
                    : "border-[#d4e7df] bg-white text-[#1f5c49]"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Brand</p>
        <div className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm text-[#1f5c49]">
          {filters.brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() =>
                  setSelectedBrands((prev) =>
                    prev.includes(brand) ? prev.filter((entry) => entry !== brand) : [...prev, brand]
                  )
                }
                className="accent-[#1f5c49]"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f6456]">Sort</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[#d4e7df] bg-white px-3 py-2 text-sm text-[#1f5c49]"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_low_high">Price: Low to High</option>
          <option value="price_high_low">Price: High to Low</option>
          <option value="name_az">Name: A-Z</option>
        </select>
      </div>

      <button
        type="button"
        onClick={clearAll}
        className="w-full rounded-xl border border-[#1f5c49] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49] hover:bg-[#1f5c49] hover:text-white"
      >
        Reset All
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#f7fbf9]"
      style={{
        backgroundImage: "radial-gradient(circle at 10% 20%, rgba(16, 105, 84, 0.06) 0, rgba(16, 105, 84, 0) 35%), linear-gradient(to bottom, #f7fbf9, #ffffff)",
      }}
    >
      <section className="relative h-[340px] overflow-hidden md:h-[430px]">
        <img src={catalogMeta.image || FALLBACK_BANNER} alt={catalogMeta.title || "Segment"} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1320px] px-4 pb-8 md:px-8 md:pb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">Khan Cosmetics</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
            {loadingMeta ? "Loading Khancosmetics..." : catalogMeta.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-emerald-100 md:text-sm">
            {catalogMeta.breadcrumb.map((node, idx) => (
              <span key={`${node._id || node.slug}-${idx}`} className="inline-flex items-center gap-2">
                <span>{node.name}</span>
                {idx < catalogMeta.breadcrumb.length - 1 && <span>/</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
        {catalogMeta.children.length > 0 && (
          <div className="mb-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-3">
              {catalogMeta.children.map((child) => (
                <button
                  key={child._id || child.slug}
                  type="button"
                  onClick={() => router.push(`/s/${child.slug}`)}
                  className="group inline-flex items-center gap-2 rounded-full border border-[#d2e6de] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] hover:border-[#1f5c49]"
                >
                  {child.image ? (
                    <img src={child.image} alt={child.name} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="h-6 w-6 rounded-full bg-[#edf6f2]" />
                  )}
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5 rounded-2xl border border-[#d8ebe3] bg-white px-3 py-3 md:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1f5c49]">
              <SlidersHorizontal className="h-4 w-4" />
              <span>{products.length} Products</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#1f5c49] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] lg:hidden"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full border border-[#d2e6de] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#557d70] hover:border-[#1f5c49] hover:text-[#1f5c49]"
              >
                Clear
              </button>
            </div>
          </div>

          {activePills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activePills.map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => removePill(pill)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#ecf6f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49]"
                >
                  {pill.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_1fr]">
          <aside className="hidden h-fit rounded-2xl border border-[#d8ebe3] bg-[#f1f8f4] p-4 lg:sticky lg:top-24 lg:block">
            {renderFilterPanel()}
          </aside>

          <section>
            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse rounded-2xl border border-[#e5f1ec] bg-white p-3">
                    <div className="aspect-[3/4] rounded-xl bg-[#edf5f1]" />
                    <div className="mt-3 h-3 w-3/4 rounded bg-[#edf5f1]" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-[#edf5f1]" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cde2d9] bg-white py-24 text-center">
                <p className="text-lg font-semibold text-[#1f5c49]">No product found for this filter</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 rounded-full bg-[#1f5c49] px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const price = getProductPrice(product);
                  const stock = getProductStock(product);
                  const rating = getProductRating(product);
                  const roundedRating = Math.round(rating);
                  const { originalPrice, discountPercentage } = getProductPricingMeta(product);
                  const main = product.whiteimage || product.hoverimage || product?.variants?.[0]?.images?.[0] || "";
                  const hover = product.hoverimage || main;

                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => router.push(`/product/${product.slug}`)}
                      className="group overflow-hidden rounded-2xl border border-[#d7e9e2] bg-white text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-20px_rgba(16,92,72,0.55)]"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#eef6f2]">
                        {main ? (
                          <img
                            src={main}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            onMouseEnter={(e) => {
                              if (hover) e.currentTarget.src = hover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.src = main;
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[#7e9d92]">No Image</div>
                        )}
                        <span
                          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            stock > 0 ? "bg-emerald-600 text-white" : "bg-rose-500 text-white"
                          }`}
                        >
                          {stock > 0 ? "In Stock" : "Out"}
                        </span>
                        {discountPercentage > 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-[#145945] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                            -{discountPercentage}%
                          </span>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="line-clamp-2 min-h-[38px] text-sm font-semibold leading-[1.35] text-[#164b3c]">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#6d8b80]">{product.brand || "Khan Cosmetics"}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-base font-bold text-[#0f4738]">{formatPrice(price)}</p>
                          {originalPrice ? <p className="text-xs text-[#7f9e93] line-through">{formatPrice(originalPrice)}</p> : null}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          {rating > 0 ? (
                            <>
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={`${product._id}-star-${idx}`}
                                  className={`h-3.5 w-3.5 ${idx < roundedRating ? "fill-[#f2b400] text-[#f2b400]" : "text-[#b7cdc4]"}`}
                                />
                              ))}
                              <span className="ml-1 text-xs font-semibold text-[#2f6456]">
                                {rating.toFixed(1)} ({Number(product?.reviewcount || 0)})
                              </span>
                            </>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[92vw] max-w-sm overflow-y-auto bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1f5c49]">Filter Products</p>
              <button type="button" onClick={() => setMobileFilterOpen(false)}>
                <X className="h-5 w-5 text-[#1f5c49]" />
              </button>
            </div>
            {renderFilterPanel()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentPage;
