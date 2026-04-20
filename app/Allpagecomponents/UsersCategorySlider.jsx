"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";

const SERVER_URL = `${serverurl}`;

const normalizeText = (value) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if (typeof value.name === "string") return value.name.trim();
    if (typeof value.slug === "string") return value.slug.trim();
  }
  return "";
};

const slugifyLoose = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const toTitle = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "Category";
  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getImageFromMedia = (media) => {
  if (!Array.isArray(media) || !media.length) return "";
  const first = media[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") return first.url || first.image || "";
  return "";
};

const getCardImage = (category) => {
  const mediaImage = getImageFromMedia(category?.media);
  if (mediaImage) return mediaImage;

  if (category?.navroot?.image) return category.navroot.image;
  return "";
};

const normalizeHref = (link) => {
  const value = normalizeText(link);
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  return `/${value}`;
};

const resolveCategoryHref = (entry) => {
  const navlink = normalizeHref(entry?.navlink);
  if (navlink) return navlink;

  const slug = slugifyLoose(entry?.slug || entry?.name);
  if (slug) return `/s/${slug}`;

  return "/category";
};

const CategoryShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${SERVER_URL}/category/public/full`, {
        timeout: 15000,
      });

      if (response?.data?.success) {
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        setCategories(data);
      } else {
        setCategories([]);
        setError("Category response was not successful.");
      }
    } catch (requestError) {
      console.error("Failed to fetch categories:", requestError);
      setCategories([]);
      setError("Couldn't load categories right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showcaseCards = useMemo(() => {
    const seen = new Set();

    return categories
      .map((category, index) => ({
        _id: String(category?._id || `category-${index}`),
        name: toTitle(category?.name || category?.slug),
        image: getCardImage(category),
        href: resolveCategoryHref(category),
      }))
      .filter((card) => {
        if (!card.name || seen.has(card._id)) return false;
        seen.add(card._id);
        return true;
      });
  }, [categories]);

  if (loading) return <SkeletonLoader />;

  if (!showcaseCards.length) {
    return (
      <section className="w-full bg-[#fff8f3] py-14 md:py-20">
        <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b05b4e]">Glow Haat</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#351a16] md:text-5xl">Shop by Category</h2>
          <div className="mt-6 rounded-3xl border border-[#f0d5cf] bg-white px-5 py-6 text-[#5d3a34]">
            <p className="text-sm md:text-base">{error || "Categories are not available right now. Please check again shortly."}</p>
            <button
              type="button"
              onClick={fetchData}
              className="mt-4 rounded-full bg-[#c85243] px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#b84739]"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full py-14 md:py-20"
      style={{
        background:
          "radial-gradient(circle at 12% 12%, rgba(250,180,163,0.32), transparent 34%), radial-gradient(circle at 88% 0%, rgba(255,228,190,0.32), transparent 36%), linear-gradient(180deg, #fff8f3 0%, #fff3e9 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 lg:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f1cdc5] bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a45142]">
              <Sparkles className="h-3.5 w-3.5" />
              Glow Haat
            </div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#351a16] md:text-6xl" style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}>
              Shop by Category
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {showcaseCards.map((card, index) => (
            <Link key={card._id || index} href={card.href || "/category"} className="group block text-center">
              <div className="relative transition duration-300 group-hover:-translate-y-1">
                {card.image ? (
                  <img src={card.image} alt={card.name} className="mx-auto h-auto w-full max-w-[190px] object-contain" loading="lazy" />
                ) : (
                  <div className="mx-auto aspect-[4/5] w-full max-w-[190px] rounded-[28px] bg-[#f5dfd8]" />
                )}
              </div>
              <div className="mt-3 inline-flex items-center justify-center gap-2 text-center">
                <h3 className="line-clamp-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-[#5b241c] md:text-sm">{card.name}</h3>
                <ArrowRight className="h-3.5 w-3.5 text-[#7a3227] transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const SkeletonLoader = () => (
  <section className="w-full bg-[#fff8f3] py-14 md:py-20">
    <div className="mx-auto w-full max-w-[1500px] px-4 md:px-8 lg:px-12">
      <div className="h-5 w-36 animate-pulse rounded bg-[#f1d7d2]" />
      <div className="mt-4 h-12 w-72 animate-pulse rounded bg-[#efd3ce]" />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <div key={id} className="mx-auto aspect-[4/5] w-full max-w-[190px] animate-pulse rounded-[28px] bg-[#f0d7d1]" />
        ))}
      </div>
    </div>
  </section>
);

export default CategoryShowcase;

