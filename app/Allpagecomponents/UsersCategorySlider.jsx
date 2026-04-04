"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { frontendurl } from "../page";
import { serverurl } from "../utils/constants/serverurl";

const SERVER_URL = `${serverurl}`;

const getCardImage = (category) => {
  if (category?.media) return category.media;
  const firstSegmentWithImage = category?.segments?.find((segment) => segment?.image);
  return firstSegmentWithImage?.image || "";
};

const toTitle = (value) => {
  if (!value) return "";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const CategoryShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRoot, setActiveRoot] = useState("");
  const [activeLeaf, setActiveLeaf] = useState("");
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const groupedByRoot = useMemo(() => {
    const map = {};

    categories.forEach((category) => {
      const root = category?.navroot || "Makeup";
      if (!map[root]) {
        map[root] = [];
      }
      map[root].push(category);
    });

    return map;
  }, [categories]);

  const rootTabs = useMemo(() => Object.keys(groupedByRoot), [groupedByRoot]);

  useEffect(() => {
    if (!activeRoot && rootTabs.length > 0) {
      setActiveRoot(rootTabs[0]);
    }
  }, [rootTabs, activeRoot]);

  const currentRootCategories = useMemo(() => {
    if (!activeRoot) return [];
    return groupedByRoot[activeRoot] || [];
  }, [groupedByRoot, activeRoot]);

  const leafTabs = useMemo(() => {
    return currentRootCategories.map((category) => ({
      id: category._id,
      label: category.name || toTitle(category.slug),
    }));
  }, [currentRootCategories]);

  useEffect(() => {
    if (!leafTabs.length) {
      setActiveLeaf("");
      return;
    }
    if (!activeLeaf || !leafTabs.some((leaf) => leaf.id === activeLeaf)) {
      setActiveLeaf(leafTabs[0].id);
    }
  }, [leafTabs, activeLeaf]);

  const filteredCards = useMemo(() => {
    if (!activeLeaf) return currentRootCategories;
    return currentRootCategories.filter((category) => category._id === activeLeaf);
  }, [activeLeaf, currentRootCategories]);

  const showcaseCards = useMemo(() => {
    if (!filteredCards.length) return currentRootCategories;
    const selected = filteredCards[0];
    const segmentCards =
      selected?.segments?.map((segment, index) => ({
        _id: `${selected?._id}-segment-${index}`,
        name: segment?.name || "Shop",
        slug: segment?.slug || selected?.slug,
        image: segment?.image || getCardImage(selected),
        navlink: selected?.navlink || "",
      })) || [];

    if (segmentCards.length > 0) return segmentCards;

    return currentRootCategories.map((category) => ({
      _id: category._id,
      name: category.name || "Shop",
      slug: category.slug,
      image: getCardImage(category),
      navlink: category.navlink || "",
    }));
  }, [filteredCards, currentRootCategories]);

  const exploreAllHref = useMemo(() => {
    if (!currentRootCategories.length) return `${frontendurl}/category`;
    const first = currentRootCategories[0];
    return first?.navlink || `${frontendurl}/c/${first?.slug || ""}`;
  }, [currentRootCategories]);

  const getCardHref = (card) => {
    if (card?.navlink) return card.navlink;
    if (card?.slug) return `${frontendurl}/s/${card.slug}`;
    return exploreAllHref;
  };

  const checkScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener("resize", checkScrollState);
    return () => window.removeEventListener("resize", checkScrollState);
  }, [showcaseCards]);

  const scrollCards = (direction) => {
    if (!sliderRef.current) return;
    const jump = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -jump : jump,
      behavior: "smooth",
    });
    window.setTimeout(checkScrollState, 450);
  };

  if (loading) return <SkeletonLoader />;
  if (!categories.length) {
    return (
      <section className="w-full bg-[#f4f4f2] py-16 md:py-20 overflow-hidden">
        <div className="max-w-[1920px] mx-auto px-4 md:px-10">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] font-bold text-[#1f5c49] mb-3">
            KHAN COSMETICS
          </p>
          <h2 className="text-3xl md:text-6xl font-semibold tracking-tight text-[#0f1720]">
            Shop by Category
          </h2>
          <div className="mt-6 rounded-xl border border-[#d1d5db] bg-white p-5 text-sm md:text-base text-[#374151]">
            {error || "Categories are not available right now. Please check again in a moment."}
            <div className="mt-4">
              <button
                type="button"
                onClick={fetchData}
                className="rounded-full bg-[#1f5c49] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#184b3c]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#f4f4f2] py-16 md:py-20 overflow-hidden">
      <div className="max-w-[1920px] mx-auto px-4 md:px-10">
        <div className="mb-8 md:mb-10 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] font-bold text-[#1f5c49] mb-3">
              KHAN COSMETICS
            </p>
            <h2 className="text-3xl md:text-6xl font-semibold tracking-tight text-[#0f1720]">
              Shop by Category
            </h2>
          </div>

          <Link
            href={exploreAllHref}
            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-[#111827] hover:text-[#1f5c49] transition-colors"
          >
            Explore All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mb-5 md:mb-6 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {rootTabs.map((root) => {
            const isActive = activeRoot === root;
            return (
              <button
                key={root}
                onClick={() => {
                  setActiveRoot(root);
                  setActiveLeaf("");
                }}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm md:text-base font-semibold transition-all ${
                  isActive
                    ? "bg-[#111827] text-white border-[#111827]"
                    : "bg-white text-[#111827] border-[#d1d5db] hover:border-[#111827]"
                }`}
              >
                {toTitle(root)}
              </button>
            );
          })}
        </div>

        <div className="mb-8 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {leafTabs.map((leaf) => {
            const isActive = activeLeaf === leaf.id;
            return (
              <button
                key={leaf.id}
                onClick={() => setActiveLeaf(leaf.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs md:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#1f5c49] text-white"
                    : "bg-[#e5e7eb] text-[#1f2937] hover:bg-[#d1d5db]"
                }`}
              >
                {leaf.label}
              </button>
            );
          })}
        </div>

        <div className="relative group">
          <button
            onClick={() => scrollCards("left")}
            aria-label="Scroll left"
            className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/95 border border-[#d1d5db] items-center justify-center shadow-lg transition ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-[#111827]" />
          </button>

          <button
            onClick={() => scrollCards("right")}
            aria-label="Scroll right"
            className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/95 border border-[#d1d5db] items-center justify-center shadow-lg transition ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-6 h-6 text-[#111827]" />
          </button>

          <div
            ref={sliderRef}
            onScroll={checkScrollState}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {showcaseCards.map((card, index) => (
              <Link
                key={card._id || index}
                href={getCardHref(card)}
                className="group/card shrink-0 w-[75vw] sm:w-[44vw] md:w-[26vw] lg:w-[21vw]"
              >
                <article className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#dfe3e8]">
                  {card.image ? (
                    card.image.endsWith(".mp4") ? (
                      <video
                        src={card.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                      No Image
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <h3 className="text-white text-2xl md:text-3xl font-semibold leading-none drop-shadow">
                      {card.name}
                    </h3>
                    <span className="w-9 h-9 rounded-full bg-white/90 text-[#111827] flex items-center justify-center backdrop-blur-sm group-hover/card:bg-white transition-colors">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const SkeletonLoader = () => (
  <section className="w-full bg-[#f4f4f2] py-16 md:py-20">
    <div className="max-w-[1920px] mx-auto px-4 md:px-10">
      <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="h-12 w-80 bg-gray-200 rounded animate-pulse mb-8" />
      <div className="flex gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-28 rounded-full bg-gray-200 animate-pulse" />
        ))}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-[22vw] min-w-[240px] aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    </div>
  </section>
);

export default CategoryShowcase;
