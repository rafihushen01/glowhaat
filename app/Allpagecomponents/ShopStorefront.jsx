"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Star, Heart, Flag, ShoppingBag, Bolt } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import SellerChatDrawer from "./SellerChatDrawer";
import { getRequestConfig } from "../utils/requestConfig";

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

const buildFallbackCardBadges = (product) => {
  const tags = Array.isArray(product?.tags)
    ? product.tags.map((entry) => String(entry || "").toLowerCase())
    : [];
  const hasOfficialStore = tags.some(
    (tag) =>
      tag.includes("officialbadge") ||
      tag.includes("officialstorebadge") ||
      tag.includes("officiabadge") ||
      tag.includes("verified")
  );
  const hasFreeDelivery =
    Boolean(product?.deliveryschema?.isfreeshipping) ||
    Number(product?.deliveryschema?.deliverycharge) <= 0 ||
    Number(product?.deliverycharge) <= 0;
  const rows = [];
  if (hasFreeDelivery) rows.push({ key: "free-delivery", label: "Free Delivery", image: "/badges/freedeliverybadge.png" });
  if (hasOfficialStore) {
    rows.push({ key: "verified", label: "Verified", image: "/badges/verifybadge.png" });
    rows.push({ key: "fast", label: "Fast", image: "/badges/fastbadge.png" });
  }
  if (tags.some((tag) => tag.includes("star"))) rows.push({ key: "star", label: "Star Seller", image: "/badges/starsellerbadge.png" });
  if (tags.some((tag) => tag.includes("fast")) && !rows.some((row) => row.key === "fast")) rows.push({ key: "fast", label: "Fast", image: "/badges/fastbadge.png" });
  return rows.slice(0, 4);
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
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [reportReason, setReportReason] = useState("Fake product");
  const [reportDetails, setReportDetails] = useState("");
  const [reportProof, setReportProof] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

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
        setFollowing(Boolean(data?.shop?.social?.following));
        setFollowers(Number(data?.shop?.social?.followers || 0));
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

  const getGuestSessionId = () => {
    if (typeof window === "undefined") return "";
    const existing = window.localStorage.getItem("khc_guest_chat_session");
    if (existing) return existing;
    const next = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem("khc_guest_chat_session", next);
    return next;
  };

  const withOptionalGuest = (extra = {}) => {
    const config = { ...(extra || {}), withCredentials: true };
    const guestSession = getGuestSessionId();
    if (!guestSession) return config;
    config.headers = {
      ...(extra?.headers || {}),
      "x-guest-session": guestSession,
    };
    return config;
  };

  const handleToggleFollow = async () => {
    try {
      setSubmittingAction(true);
      const { data } = await axios.post(
        `${serverurl}/seller/public/shop/${slug}/follow`,
        {},
        withOptionalGuest({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Could not update follow state.");
      setFollowing(Boolean(data.following));
      setFollowers(Number(data.followers || 0));
      setActionMessage(data.following ? "You are now following this store." : "Unfollowed this store.");
    } catch (error) {
      setActionMessage(error?.response?.data?.message || error?.message || "Could not update follow state.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRateStore = async () => {
    try {
      setSubmittingAction(true);
      const { data } = await axios.post(
        `${serverurl}/seller/public/shop/${slug}/rate`,
        { rating: ratingValue, review: ratingReview },
        getRequestConfig({ timeout: 22000 })
      );
      if (!data?.success) throw new Error(data?.message || "Could not submit rating.");
      const avg = Number(data?.summary?.average || 0);
      setStats((prev) => ({ ...prev, averageRating: avg }));
      setActionMessage("Store rating submitted successfully.");
    } catch (error) {
      setActionMessage(error?.response?.data?.message || error?.message || "Could not submit rating.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReportStore = async () => {
    try {
      setSubmittingAction(true);
      const fd = new FormData();
      fd.append("reason", reportReason);
      fd.append("details", reportDetails);
      if (reportProof) fd.append("proof", reportProof);

      const { data } = await axios.post(
        `${serverurl}/seller/public/shop/${slug}/report`,
        fd,
        getRequestConfig({
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 25000,
        })
      );

      if (!data?.success) throw new Error(data?.message || "Could not submit report.");
      setActionMessage("Store report submitted. SuperAdmin will review this report.");
      setReportDetails("");
      setReportProof(null);
    } catch (error) {
      setActionMessage(error?.response?.data?.message || error?.message || "Could not submit report.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleQuickCartAction = async (product, toCheckout = false) => {
    try {
      setSubmittingAction(true);
      const { data } = await axios.post(
        `${serverurl}/cart/add`,
        { slug: product.slug, variantindex: 0, optionindex: 0, quantity: 1 },
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Could not add to cart.");
      setActionMessage(toCheckout ? "Added to cart. Redirecting to checkout..." : "Added to cart.");
      if (toCheckout) router.push("/checkout");
    } catch (error) {
      setActionMessage(error?.response?.data?.message || error?.message || "Could not add this item.");
    } finally {
      setSubmittingAction(false);
    }
  };

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
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Glow Haat Seller Profile</p>
            <h1 className="mt-1 text-2xl font-bold md:text-4xl">{shop.shopname}</h1>
            <p className="mt-1 line-clamp-2 text-sm text-emerald-100 md:text-base">{shop.description || "Trusted seller on Glow Haat."}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-emerald-100">
              <span>Joined Glow Haat {Number(shop?.joineddays || 0)} days ago</span>
              <span>|</span>
              <span>{followers} Followers</span>
              <span>|</span>
              <span>{Number(shop?.social?.ratingaverage || 0).toFixed(2)} Rating</span>
            </div>
            {shop?.starseller?.isstarseller ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                <img src="/badges/starsellerbadge.png" alt="Star Seller" className="h-4 w-4 rounded-full object-contain" />
                Star Seller
              </div>
            ) : null}
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
        {actionMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800">
            {actionMessage}
          </div>
        ) : null}

        <div className="mb-5 grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4 lg:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Follow Store</p>
            <button
              type="button"
              disabled={submittingAction}
              onClick={handleToggleFollow}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
            >
              <Heart className={`h-4 w-4 ${following ? "fill-emerald-600 text-emerald-600" : ""}`} />
              {following ? "Following" : "Follow"}
            </button>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Rate Store (buyers only)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select
                value={ratingValue}
                onChange={(e) => setRatingValue(Number(e.target.value))}
                className="h-9 rounded-lg border border-emerald-200 bg-white px-2 text-sm text-emerald-900"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} Star
                  </option>
                ))}
              </select>
              <input
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
                placeholder="Write review"
                className="h-9 min-w-[180px] flex-1 rounded-lg border border-emerald-200 bg-white px-3 text-sm text-emerald-900"
              />
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleRateStore}
                className="h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Report Store (buyers only)</p>
            <div className="mt-2 flex flex-col gap-2">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="h-9 rounded-lg border border-emerald-200 bg-white px-2 text-sm text-emerald-900"
              >
                {["Fake product", "Wrong item", "Fraud seller", "Policy violation", "Custom reason"].map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <input
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Details"
                className="h-9 rounded-lg border border-emerald-200 bg-white px-3 text-sm text-emerald-900"
              />
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                  <Flag className="h-3.5 w-3.5" />
                  Upload Proof
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setReportProof(e.target.files?.[0] || null)} />
                </label>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleReportStore}
                  className="h-8 rounded-lg bg-emerald-700 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>

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
                  const badgeRows =
                    Array.isArray(product?.cardmeta?.badges) && product.cardmeta.badges.length
                      ? product.cardmeta.badges
                      : buildFallbackCardBadges(product);
                  const soldText = String(product?.cardmeta?.soldtext || "").trim();
                  const achievement = String(product?.cardmeta?.achievement || "").trim();
                  const stock = Number(getProductStock(product)) || 0;

                  return (
                    <div
                      key={product._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/product/${product.slug}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/product/${product.slug}`);
                        }
                      }}
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
                        {badgeRows.length > 0 ? (
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            {badgeRows.slice(0, 4).map((badge) =>
                              badge?.image ? (
                                <img
                                  key={`${product._id}-${badge.key || badge.label}`}
                                  src={badge.image}
                                  alt={badge.label || "Badge"}
                                  className="h-5 w-auto max-w-[120px] rounded object-contain"
                                />
                              ) : (
                                <span
                                  key={`${product._id}-${badge.key || badge.label}`}
                                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700"
                                >
                                  {badge.label}
                                </span>
                              )
                            )}
                          </div>
                        ) : null}
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

                        <div className="mt-2 min-h-[18px] text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                          {soldText ? `Sold ${soldText}` : "Fresh arrival"}
                        </div>
                        {achievement ? (
                          <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-emerald-800">{achievement}</p>
                        ) : null}

                        {stock > 0 ? (
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleQuickCartAction(product, false);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                              aria-label="Add to cart"
                            >
                              <ShoppingBag className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleQuickCartAction(product, true);
                              }}
                              className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                            >
                              <Bolt className="h-3.5 w-3.5" />
                              Buy Now
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/product/${product.slug}`);
                            }}
                            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-emerald-300 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                          >
                            Read More
                          </button>
                        )}
                      </div>
                    </div>
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

