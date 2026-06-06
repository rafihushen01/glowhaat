"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";

const API_URL = `${serverurl}/category/public/full`;

const normalizeHref = (href) => {
  const value = String(href || "").trim();
  if (!value) return "#";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return value;
    } catch (_error) {
      return value;
    }
  }

  if (value.startsWith("/")) return value;
  return `/${value}`;
};

const getPrimaryMedia = (entry) => {
  const first = Array.isArray(entry?.media) ? entry.media[0] : null;
  if (!first) return null;
  return {
    url: String(first?.url || ""),
    type: String(first?.type || "image").toLowerCase(),
  };
};

const isVideo = (media) => {
  if (!media?.url) return false;
  if (media.type === "video") return true;
  const url = media.url.toLowerCase();
  return url.includes(".mp4") || url.includes(".mov") || url.includes(".mkv") || url.includes(".webm");
};

const slideTypes = ["campaign", "deals"];
const railTypes = ["topbrands", "extradiscount"];
const gridTypes = ["shopbeautyproductbycategory", "shopbeautyproductbyconcern"];

const titles = {
  campaign: "New Offers From GlowHaat",
  deals: "Deals In Glow Haat",
  topbrands: "Top Brands & Offers",
  extradiscount: "Extra Discount Offer",
  shopbeautyproductbycategory: "Shop Product By Category",
  shopbeautyproductbyconcern: "Top Rated Category",
};

const sectionStyles = {
  campaign: "rounded-2xl border border-emerald-200 bg-white",
  deals: "rounded-2xl border border-emerald-200 bg-white",
  topbrands: "rounded-2xl border border-emerald-200 bg-white",
  extradiscount: "rounded-2xl border border-emerald-200 bg-white",
  shopbeautyproductbycategory: "rounded-2xl border border-emerald-200 bg-white",
  shopbeautyproductbyconcern: "rounded-2xl border border-emerald-200 bg-white",
};

const SectionHeading = ({ title }) => (
  <div className="mb-4 flex items-center justify-center">
    <h2 className="inline-flex rounded-full bg-emerald-50 px-5 py-1.5 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
      {title}
    </h2>
  </div>
);

const SlideSection = ({ entries = [], type }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [entries.length]);

  useEffect(() => {
    if (entries.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % entries.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [entries.length]);

  if (!entries.length) return null;

  const goPrev = () => setIndex((prev) => (prev - 1 + entries.length) % entries.length);
  const goNext = () => setIndex((prev) => (prev + 1) % entries.length);

  return (
    <section className="w-full">
      <SectionHeading title={titles[type]} />
      <div className={`${sectionStyles[type]} relative overflow-hidden p-2 sm:p-3`}>
        <div className="relative aspect-[16/5] overflow-hidden rounded-xl">
          {entries.map((entry, currentIndex) => {
            const media = getPrimaryMedia(entry);
            const href = normalizeHref(entry?.navlink);
            const active = currentIndex === index;

            return (
              <Link
                key={`${entry._id}-${currentIndex}`}
                href={href}
                className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                {media && isVideo(media) ? (
                  <video
                    src={media.url}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={media?.url || ""}
                    alt={entry?.name || titles[type]}
                    className="h-full w-full object-cover"
                    loading={currentIndex === 0 ? "eager" : "lazy"}
                  />
                )}
              </Link>
            );
          })}

          {entries.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/40 bg-black/30 p-1.5 text-white backdrop-blur hover:bg-white hover:text-emerald-700"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/40 bg-black/30 p-1.5 text-white backdrop-blur hover:bg-white hover:text-emerald-700"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
                {entries.map((entry, dotIndex) => (
                  <button
                    key={`${entry._id}-dot-${dotIndex}`}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    className={`h-2 rounded-full transition-all ${index === dotIndex ? "w-6 bg-emerald-500" : "w-2 bg-white/70"}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const RailSection = ({ entries = [], type }) => {
  const railRef = useRef(null);

  if (!entries.length) return null;

  const scrollByAmount = (direction) => {
    const node = railRef.current;
    if (!node) return;
    const amount = Math.round(node.clientWidth * 0.8) * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="w-full">
      <SectionHeading title={titles[type]} />
      <div className={`${sectionStyles[type]} relative p-2 sm:p-3`}>
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-emerald-200 bg-white p-1 text-emerald-700 shadow-sm hover:bg-emerald-50 md:block"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto scroll-smooth rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {entries.map((entry) => {
            const media = getPrimaryMedia(entry);
            const href = normalizeHref(entry?.navlink);

            return (
              <Link
                key={entry._id}
                href={href}
                className="group min-w-[72%] overflow-hidden rounded-xl border border-emerald-200 bg-white sm:min-w-[48%] lg:min-w-[31%]"
              >
                <div className="aspect-[16/7] overflow-hidden">
                  {media && isVideo(media) ? (
                    <video src={media.url} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" muted playsInline loop autoPlay />
                  ) : (
                    <img src={media?.url || ""} alt={entry?.name || titles[type]} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="px-3 py-2">
                  <p className="line-clamp-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">{entry?.name || titles[type]}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-emerald-200 bg-white p-1 text-emerald-700 shadow-sm hover:bg-emerald-50 md:block"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

const GridSection = ({ entries = [], type }) => {
  if (!entries.length) return null;

  return (
    <section className="w-full">
      <SectionHeading title={titles[type]} />
      <div className={`${sectionStyles[type]} p-2 sm:p-3`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {entries.map((entry) => {
            const media = getPrimaryMedia(entry);
            const href = normalizeHref(entry?.navlink);

            return (
              <Link key={entry._id} href={href} className="group overflow-hidden rounded-xl border border-emerald-200 bg-white">
                <div className="aspect-[4/5] overflow-hidden bg-emerald-50">
                  {media && isVideo(media) ? (
                    <video src={media.url} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" muted playsInline loop autoPlay />
                  ) : (
                    <img
                      src={media?.url || ""}
                      alt={entry?.name || titles[type]}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="px-2 py-2 text-center">
                  <p className="line-clamp-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">{entry?.name || titles[type]}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const HomepageManagedSections = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await axios.get(API_URL, { timeout: 20000 });
        if (cancelled) return;

        const incoming = Array.isArray(data?.data) ? data.data : [];
        setEntries(incoming);
      } catch (error) {
        console.error("HomepageManagedSections load failed", error);
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const result = {
      campaign: [],
      deals: [],
      topbrands: [],
      extradiscount: [],
      shopbeautyproductbycategory: [],
      shopbeautyproductbyconcern: [],
    };

    entries.forEach((entry) => {
      const type = String(entry?.type || "").toLowerCase();
      if (result[type]) result[type].push(entry);
    });

    Object.keys(result).forEach((key) => {
      result[key].sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
    });

    return result;
  }, [entries]);

  if (loading) {
    return (
      <section className="space-y-4">
        {[1, 2, 3].map((id) => (
          <div key={id} className="h-44 animate-pulse rounded-2xl border border-emerald-200 bg-emerald-50" />
        ))}
      </section>
    );
  }

  if (!entries.length) return null;

  return (
    <section className="space-y-6">
      {slideTypes.map((type) => (
        <SlideSection key={type} entries={grouped[type]} type={type} />
      ))}

      {railTypes.map((type) => (
        <RailSection key={type} entries={grouped[type]} type={type} />
      ))}

      {gridTypes.map((type) => (
        <GridSection key={type} entries={grouped[type]} type={type} />
      ))}
    </section>
  );
};

export default HomepageManagedSections;

