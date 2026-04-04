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

  if (!prices.length) return 0;
  return Math.min(...prices);
};

const getDiscountPercent = (product) => {
  let best = 0;
  (product?.variants || []).forEach((variant) => {
    (variant?.options || []).forEach((option) => {
      const pct = Number(option?.discountpercentage || 0);
      if (Number.isFinite(pct) && pct > best) best = pct;
    });
  });
  return Math.max(0, Math.round(best));
};

const getChunkSize = (width) => {
  if (width < 768) return 6;
  if (width < 1280) return 12;
  return 24;
};

const BehaviorRecommendations = ({ categorySlug = "", title = "Deals You Can't Miss" }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [chunkSize, setChunkSize] = useState(24);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const update = () => {
      const width = typeof window !== "undefined" ? window.innerWidth : 1440;
      const size = getChunkSize(width);
      setChunkSize(size);
      setVisibleCount((prev) => Math.max(size, prev));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let canceled = false;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError("");

        const query = new URLSearchParams({
          limit: "240",
          sessionkey: getRecommendationSessionKey(),
        });
        if (categorySlug) query.set("categoryslug", categorySlug);

        const { data } = await axios.get(`${serverurl}/recommendation/for-you?${query.toString()}`, {
          withCredentials: true,
        });

        if (canceled) return;
        if (!data?.success) {
          setItems([]);
          setError(data?.message || "Could not load recommendations right now.");
          return;
        }

        const nextItems = Array.isArray(data.data) ? data.data : [];
        setItems(nextItems);
        setVisibleCount((prev) => Math.max(chunkSize, Math.min(prev, nextItems.length || chunkSize)));
      } catch (_error) {
        if (canceled) return;
        setItems([]);
        setError("Could not load recommendations right now.");
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      canceled = true;
    };
  }, [categorySlug, chunkSize]);

  const visibleItems = useMemo(
    () => items.slice(0, Math.min(items.length, visibleCount)),
    [items, visibleCount]
  );

  if (loading) {
    return (
      <section className="mx-auto mt-12 w-full max-w-[1320px] px-4 md:px-8">
        <div className="mb-6">
          <h2 className="mt-2 text-3xl font-semibold text-[#0f1720] md:text-4xl">{title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-[#d9e9e2] bg-white p-3">
              <div className="aspect-[4/5] rounded-xl bg-[#edf5f1]" />
              <div className="mt-3 h-3 w-4/5 rounded bg-[#edf5f1]" />
              <div className="mt-2 h-3 w-2/5 rounded bg-[#edf5f1]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mx-auto mt-12 w-full max-w-[1320px] px-4 pb-16 md:px-8">
      <div className="mb-6">
        <h2 className="mt-2 text-3xl font-semibold text-[#0f1720] md:text-4xl">{title}</h2>
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleItems.map((product) => {
          const image = product.whiteimage || product?.variants?.[0]?.images?.[0] || product.hoverimage || "";
          const hover = product.hoverimage || product?.variants?.[1]?.images?.[0] || image;
          const price = getProductPrice(product);
          const discount = getDiscountPercent(product);
          const rating = Math.max(0, Math.min(5, Number(product?.star || 0)));
          const rounded = Math.round(rating);
          const reviewCount = Number(product?.reviewcount || 0);

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
              className="group relative overflow-hidden rounded-[26px] border border-[#d7e9e2] bg-white text-left transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:border-[#bedfd2] hover:shadow-[0_30px_60px_-24px_rgba(16,92,72,0.35)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#eef6f2]">
                {image ? (
                  <>
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.08]"
                    />
                    {hover && hover !== image ? (
                      <img
                        src={hover}
                        alt={product.name}
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
                  {product.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[#6d8b80]">
                  {product.brand || "Khan Cosmetics"}
                </p>
                <p className="mt-2 text-base font-bold text-[#0f4738]">{formatPrice(price)}</p>
                {rating > 0 ? (
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={`${product._id}-recommend-star-${idx}`}
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
              </div>
            </button>
          );
        })}
      </div>

      {visibleCount < items.length ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4e7468]">
            Showing {visibleItems.length} of {items.length}
          </p>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(items.length, prev + chunkSize))}
            className="group inline-flex items-center gap-2 rounded-full border border-[#1f5c49] bg-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#1f5c49] transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#1f5c49] hover:text-white hover:shadow-[0_20px_35px_-20px_rgba(31,92,73,0.9)]"
          >
            Show More
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default BehaviorRecommendations;
