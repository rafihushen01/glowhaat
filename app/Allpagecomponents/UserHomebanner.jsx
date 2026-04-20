"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";

const UserHomebanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const timerRef = useRef(null);

  const hasSlides = banners.length > 0;
  const canSlide = banners.length > 1;

  const isVideoSlide = (banner) => {
    const mediaType = String(banner?.mediatype || "").toLowerCase();
    if (mediaType === "video") return true;
    const url = String(banner?.image || "").toLowerCase();
    return url.includes(".mp4") || url.includes(".mov") || url.includes(".mkv") || url.includes(".webm");
  };

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => Number(a?.bannernumber || 0) - Number(b?.bannernumber || 0)),
    [banners]
  );

  const nextSlide = () => {
    if (!hasSlides) return;
    setCurrentIndex((prev) => (prev + 1) % sortedBanners.length);
  };

  const prevSlide = () => {
    if (!hasSlides) return;
    setCurrentIndex((prev) => (prev - 1 + sortedBanners.length) % sortedBanners.length);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/homebanner/gethomebanners`, {
          params: { section: "home" },
        });
        const incoming = Array.isArray(data) ? data : Array.isArray(data?.banners) ? data.banners : [];
        setBanners(incoming);
      } catch (_error) {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (!canSlide) return undefined;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedBanners.length);
    }, 8000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [canSlide, sortedBanners.length]);

  if (loading) {
    return (
      <div className="mt-[30px] w-full py-3 sm:mt-0 sm:py-4">
        <div className="relative w-full overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/5]">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-emerald-100 via-white to-emerald-100" />
        </div>
      </div>
    );
  }

  if (!hasSlides) return null;

  const handleTouchEnd = () => {
    if (touchStartX == null || touchEndX == null) return;
    const delta = touchStartX - touchEndX;
    if (delta > 50) nextSlide();
    if (delta < -50) prevSlide();
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <section className="mt-[30px] w-full py-3 sm:mt-0 sm:py-4">
      <div
        className="group relative w-full overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_18px_60px_-30px_rgba(6,95,70,0.45)] aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/5]"
        onTouchStart={(e) => setTouchStartX(e.targetTouches?.[0]?.clientX ?? null)}
        onTouchMove={(e) => setTouchEndX(e.targetTouches?.[0]?.clientX ?? null)}
        onTouchEnd={handleTouchEnd}
      >
        {sortedBanners.map((banner, index) => {
          const href = String(banner?.navigationlink || "").trim() || "#";
          return (
            <Link
              key={banner?._id || `${banner?.image}-${index}`}
              href={href}
              className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${
                currentIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {isVideoSlide(banner) ? (
                <video
                  src={banner?.image}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img src={banner?.image} alt={`Glow Haat Banner ${index + 1}`} className="h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-transparent to-transparent" />
            </Link>
          );
        })}

        {canSlide ? (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/40 bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/90 hover:text-emerald-700 md:block md:opacity-0 md:group-hover:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/40 bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/90 hover:text-emerald-700 md:block md:opacity-0 md:group-hover:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
              {sortedBanners.map((banner, index) => (
                <button
                  key={`dot-${banner?._id || index}`}
                  type="button"
                  aria-label={`Go to banner ${index + 1}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${currentIndex === index ? "w-8 bg-emerald-500" : "w-2 bg-white/70 hover:bg-white"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default UserHomebanner;

