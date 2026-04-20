"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { serverurl } from "../utils/constants/serverurl";
import {
  getRecommendationSessionKey,
  trackRecommendationEvent,
} from "../utils/recommendation";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  })
    .format(Number(price || 0))
    .replace("BDT", "\u09F3");

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

  if (!prices.length) return 0;
  return Math.min(...prices);
};

const getTopDiscount = (product) => {
  let top = 0;
  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const pct = Number(option?.discountpercentage || 0);
      if (Number.isFinite(pct) && pct > top) top = pct;
    });
  });
  return Math.max(0, Math.round(top));
};

const getSoldText = (value) => {
  const sold = Math.max(0, Number(value || 0));
  if (sold >= 1000000) return `${(sold / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (sold >= 1000) return `${(sold / 1000).toFixed(sold < 10000 ? 1 : 0).replace(/\.0$/, "")}K+`;
  if (sold >= 100) return `${(sold / 1000).toFixed(1)}K+`;
  return `${Math.floor(sold)}+`;
};

const buildFallbackCardBadges = (product) => {
  const tags = Array.isArray(product?.tags) ? product.tags.map((entry) => String(entry).toLowerCase()) : [];
  const badges = [];
  const deliveryCharge = Number(product?.deliveryschema?.deliverycharge);
  const hasFreeDelivery =
    Boolean(product?.deliveryschema?.isfreeshipping) ||
    (Number.isFinite(deliveryCharge) && deliveryCharge <= 0);
  const isOfficialStore = tags.some(
    (tag) =>
      tag.includes("official") ||
      tag.includes("verified") ||
      tag.includes("officialbadge") ||
      tag.includes("officialstorebadge") ||
      tag.includes("officiabadge")
  );

  if (hasFreeDelivery) badges.push({ key: "free", label: "Free Delivery", image: "/badges/freedeliverybadge.png" });
  if (isOfficialStore) {
    badges.push({ key: "verified", label: "Verified", image: "/badges/verifybadge.png" });
    badges.push({ key: "fast", label: "Fast", image: "/badges/fastbadge.png" });
  }
  if (tags.some((tag) => tag.includes("star"))) badges.push({ key: "star", label: "Star Seller", image: "/badges/starsellerbadge.png" });
  if (tags.some((tag) => tag.includes("fast")) && !badges.some((badge) => badge.key === "fast")) badges.push({ key: "fast", label: "Fast", image: "/badges/fastbadge.png" });
  if (Number(product?.totalsold || 0) >= 120) badges.push({ key: "best", label: "Best Seller" });

  return badges.slice(0, 4);
};

const SECTION_META = [
  {
    key: "similaritems",
    title: "Similar Items",
    subtitle: "Products closely related to the one you are viewing.",
  },
  {
    key: "alsoviewed",
    title: "Customers Also Viewed",
    subtitle: "Products explored by shoppers who viewed this item.",
  },
  {
    key: "morefromstore",
    title: "More From This Store",
    subtitle: "Recommended items from the same store based on shopper behavior.",
  },
  {
    key: "morefromsamecategoryinstore",
    title: "More Items In This Category",
    subtitle: "Same category products uploaded by this store.",
  },
  {
    key: "bestsellingincategoryinstore",
    title: "Best Selling In This Category",
    subtitle: "Top performing category items from this store.",
  },
  {
    key: "storebestsellers",
    title: "Store Best Sellers",
    subtitle: "Most sold products from this store.",
  },
  {
    key: "frequentlyboughttogether",
    title: "Frequently Bought Together",
    subtitle: "Delivered-order pairings related to this product category.",
  },
  {
    key: "dealsyoucantmiss",
    title: "Deals You Can't Miss",
    subtitle: "High-value deals based on shopper behavior and performance.",
  },
];

const ProductDetailRecommendations = ({ product }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({});
  const [message, setMessage] = useState("");
  const [itemsPerView, setItemsPerView] = useState(4);
  const [sectionPageByKey, setSectionPageByKey] = useState({});

  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      if (!product?.slug) return;

      try {
        setLoading(true);
        setMessage("");

        const query = new URLSearchParams({
          sessionkey: getRecommendationSessionKey(),
          sectionlimit: "12",
        });

        const { data } = await axios.get(
          `${serverurl}/recommendation/product-page/${product.slug}?${query.toString()}`,
          { withCredentials: true }
        );

        if (canceled) return;
        if (!data?.success) {
          setSections({});
          setMessage(data?.message || "Could not load recommendation sections right now.");
          return;
        }

        setSections(data?.sections || {});
      } catch (_error) {
        if (canceled) return;
        setSections({});
        setMessage("Could not load recommendation sections right now.");
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      canceled = true;
    };
  }, [product?.slug]);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerView(1);
        return;
      }
      if (width < 1024) {
        setItemsPerView(2);
        return;
      }
      setItemsPerView(4);
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  useEffect(() => {
    if (!Object.keys(sections).length) return;
    setSectionPageByKey((prev) => {
      const next = { ...prev };
      SECTION_META.forEach((entry) => {
        if (!Array.isArray(sections?.[entry.key]) || !sections[entry.key].length) return;
        const maxPage = Math.max(0, Math.ceil(sections[entry.key].length / itemsPerView) - 1);
        next[entry.key] = Math.min(Number(prev?.[entry.key] || 0), maxPage);
      });
      return next;
    });
  }, [sections, itemsPerView]);

  const visibleSections = useMemo(
    () =>
      SECTION_META.filter((entry) => Array.isArray(sections?.[entry.key]) && sections[entry.key].length > 0),
    [sections]
  );

  const renderCard = (sectionKey, item) => {
    const image = item.whiteimage || item?.variants?.[0]?.images?.[0] || item.hoverimage || "";
    const hover = item.hoverimage || item?.variants?.[1]?.images?.[0] || image;
    const price = getProductPrice(item);
    const discount = getTopDiscount(item);
    const rating = Math.max(0, Math.min(5, Number(item?.star || 0)));
    const rounded = Math.round(rating);
    const reviewCount = Number(item?.reviewcount || 0);
    const reason = item?.recommendationmeta?.reason || "";
    const soldText = getSoldText(item?.totalsold || 0);
    const badges = Array.isArray(item?.cardmeta?.badges) && item.cardmeta.badges.length
      ? item.cardmeta.badges
      : buildFallbackCardBadges(item);

    return (
      <button
        key={`${sectionKey}-${item._id}`}
        type="button"
        onClick={() => {
          trackRecommendationEvent({
            eventtype: "product_click",
            slug: item.slug,
          });
          router.push(`/product/${item.slug}`);
        }}
        className="group relative overflow-hidden rounded-[24px] border border-[#d7e9e2] bg-white text-left transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:border-[#bedfd2] hover:shadow-[0_30px_60px_-24px_rgba(16,92,72,0.35)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#eef6f2]">
          {image ? (
            <>
              <img
                src={image}
                alt={item.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.08]"
              />
              {hover && hover !== image ? (
                <img
                  src={hover}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#7e9d92]">No Image</div>
          )}

          {discount > 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-[#145945] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
              -{discount}%
            </span>
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0d3e31]/30 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#0d4f3d] opacity-0 transition-all duration-700 group-hover:opacity-100">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <div className="p-3">
          {badges.length > 0 ? (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {badges.map((badge) =>
                badge?.image ? (
                  <img
                    key={`${item._id}-${badge.key || badge.label}`}
                    src={badge.image}
                    alt={badge.label || "Badge"}
                    className="h-5 w-auto max-w-[120px] rounded object-contain"
                  />
                ) : (
                  <span
                    key={`${item._id}-${badge.key || badge.label}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700"
                  >
                    {badge.label}
                  </span>
                )
              )}
            </div>
          ) : null}
          <p className="line-clamp-2 min-h-[38px] text-sm font-semibold leading-[1.35] text-[#164b3c]">
            {item.name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#6d8b80]">
            {item.brand || "Glow Haat"}
          </p>
          <p className="mt-2 text-base font-bold text-[#0f4738]">{formatPrice(price)}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Sold {item?.cardmeta?.soldtext || soldText}
          </p>
          {rating > 0 ? (
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={`${item._id}-star-${idx}`}
                  className={`h-3.5 w-3.5 ${
                    idx < rounded ? "fill-[#f2b400] text-[#f2b400]" : "text-[#b7cdc4]"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs font-semibold text-[#2f6456]">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          ) : null}
          {reason ? <p className="mt-2 line-clamp-2 text-[11px] font-medium text-[#2d7160]">{reason}</p> : null}
        </div>
      </button>
    );
  };

  const getCurrentItems = (sectionKey) => {
    const all = Array.isArray(sections?.[sectionKey]) ? sections[sectionKey] : [];
    if (!all.length) return [];
    const page = Number(sectionPageByKey?.[sectionKey] || 0);
    const start = page * itemsPerView;
    return all.slice(start, start + itemsPerView);
  };

  const moveSection = (sectionKey, direction) => {
    const all = Array.isArray(sections?.[sectionKey]) ? sections[sectionKey] : [];
    if (!all.length) return;
    const maxPage = Math.max(0, Math.ceil(all.length / itemsPerView) - 1);
    setSectionPageByKey((prev) => {
      const current = Number(prev?.[sectionKey] || 0);
      const next = direction === "next" ? Math.min(maxPage, current + 1) : Math.max(0, current - 1);
      return { ...prev, [sectionKey]: next };
    });
  };

  if (loading) {
    return (
      <section className="mx-auto mt-10 w-full max-w-7xl px-4 pb-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="animate-pulse rounded-2xl border border-[#e2efe9] bg-white p-3">
              <div className="aspect-[4/5] rounded-xl bg-[#edf5f1]" />
              <div className="mt-3 h-3 w-4/5 rounded bg-[#edf5f1]" />
              <div className="mt-2 h-3 w-2/5 rounded bg-[#edf5f1]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!visibleSections.length) {
    if (!message) return null;
    return (
      <section className="mx-auto mt-10 w-full max-w-7xl px-4 pb-6">
        <p className="text-sm text-red-600">{message}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-7xl space-y-12 px-4 pb-16">
      {visibleSections.map((section) => (
        <div key={section.key} className="rounded-3xl border border-[#d2e9df] bg-gradient-to-br from-[#f8fffb] via-white to-[#ebf8f2] p-4 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-[#0f4738] md:text-3xl">{section.title}</h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#4f7367]">{section.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveSection(section.key, "prev")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#9ac6b5] bg-white text-[#0f5b46] transition hover:bg-[#e8f5ef]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveSection(section.key, "next")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#9ac6b5] bg-white text-[#0f5b46] transition hover:bg-[#e8f5ef]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {getCurrentItems(section.key).map((item) => (
              <div key={`${section.key}-${item._id}`}>{renderCard(section.key, item)}</div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {Array.from({
              length: Math.max(1, Math.ceil((sections?.[section.key]?.length || 0) / itemsPerView)),
            }).map((_, idx) => (
              <button
                key={`${section.key}-dot-${idx}`}
                type="button"
                onClick={() =>
                  setSectionPageByKey((prev) => ({
                    ...prev,
                    [section.key]: idx,
                  }))
                }
                className={`h-2.5 rounded-full transition-all ${
                  Number(sectionPageByKey?.[section.key] || 0) === idx
                    ? "w-7 bg-[#0f5b46]"
                    : "w-2.5 bg-[#a6cdbf]"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ProductDetailRecommendations;

