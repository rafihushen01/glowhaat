"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowRight, Star } from "lucide-react";
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
    .replace("BDT", "৳");

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

const SECTION_META = [
  {
    key: "frequentlyboughttogether",
    title: "Frequently Bought Together",
    subtitle: "People often place these together in one order.",
  },
  {
    key: "similaritems",
    title: "Similar Items",
    subtitle: "Products from similar category, taste, and profile.",
  },
  {
    key: "alsoviewed",
    title: "People Also Visited",
    subtitle: "Shoppers who visited this item also viewed these.",
  },
  {
    key: "dealsyoucantmiss",
    title: "Deals You Can't Miss",
    subtitle: "Best offers with strong customer performance.",
  },
];

const ProductDetailRecommendations = ({ product }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({});
  const [message, setMessage] = useState("");
  const [chunkSize, setChunkSize] = useState(8);
  const [visibleCountBySection, setVisibleCountBySection] = useState({});

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
    const updateChunk = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 768) {
        setChunkSize(4);
        return;
      }
      if (width < 1280) {
        setChunkSize(6);
        return;
      }
      setChunkSize(8);
    };

    updateChunk();
    window.addEventListener("resize", updateChunk);
    return () => window.removeEventListener("resize", updateChunk);
  }, []);

  useEffect(() => {
    if (!Object.keys(sections).length) return;
    setVisibleCountBySection((prev) => {
      const next = { ...prev };
      SECTION_META.forEach((entry) => {
        if (!Array.isArray(sections?.[entry.key])) return;
        const max = sections[entry.key].length;
        const current = Number(prev?.[entry.key] || 0);
        next[entry.key] = current > 0 ? Math.min(current, max) : Math.min(chunkSize, max);
      });
      return next;
    });
  }, [sections, chunkSize]);

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
          <p className="line-clamp-2 min-h-[38px] text-sm font-semibold leading-[1.35] text-[#164b3c]">
            {item.name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#6d8b80]">
            {item.brand || "Khan Cosmetics"}
          </p>
          <p className="mt-2 text-base font-bold text-[#0f4738]">{formatPrice(price)}</p>
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
        <div key={section.key}>
          <div className="mb-5">
            <h3 className="text-2xl font-semibold text-[#0f1720] md:text-3xl">{section.title}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#4f7367]">{section.subtitle}</p>
          </div>

          <div className="md:hidden">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {sections[section.key]
                .slice(0, visibleCountBySection?.[section.key] || chunkSize)
                .map((item) => (
                  <div key={`${section.key}-mobile-${item._id}`} className="min-w-[74%] snap-start">
                    {renderCard(section.key, item)}
                  </div>
                ))}
            </div>
          </div>

          <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
            {sections[section.key]
              .slice(0, visibleCountBySection?.[section.key] || chunkSize)
              .map((item) => renderCard(section.key, item))}
          </div>

          {(visibleCountBySection?.[section.key] || chunkSize) < sections[section.key].length ? (
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() =>
                  setVisibleCountBySection((prev) => ({
                    ...prev,
                    [section.key]: Math.min(
                      sections[section.key].length,
                      Number(prev?.[section.key] || chunkSize) + chunkSize
                    ),
                  }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-[#1f5c49] bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49] transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1f5c49] hover:text-white"
              >
                Show More
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
};

export default ProductDetailRecommendations;
