import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { frontendurl} from '../page';
import { serverurl } from '../utils/constants/serverurl';

// Configuration
const SERVER_URL = `${serverurl}`; // Replace with your actual env var

const CategoryShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/category/public/full`);

      if (response.data && response.data.success) {
        const data = response.data.data;

        setCategories(data);

        // 🔥 FULL RAW LOG
        console.log("==== FULL CATEGORY DATA FROM BACKEND ====");
        console.log(data);

        // 🔥 PRETTY JSON (deep readable)
        console.log("==== PRETTY JSON ====");
        console.log(JSON.stringify(data, null, 2));

        // 🔥 LOOP EACH CATEGORY
        data.forEach((cat, i) => {
          console.log(`\n📦 CATEGORY ${i + 1}`);
          console.log("ID:", cat._id);
          console.log("Name:", cat.name);
          console.log("Slug:", cat.slug);
          console.log("NavLink:", cat.navlink);
          console.log("Media:", cat.media);
          console.log("NavRoot:", cat.navroot);

          if (cat.segments?.length) {
            console.log(`--- SEGMENTS (${cat.segments.length}) ---`);
            cat.segments.forEach((seg, j) => {
              console.log(`  🔹 Segment ${j + 1}`);
              console.log("  Name:", seg.name);
              console.log("  Slug:", seg.slug);
              console.log("  Image:", seg.image);
              console.log("  NavLink:", seg.navlink);
              console.log("  Depth:", seg.depth);
              console.log("  NavPath:", seg.navpath);
            });
          } else {
            console.log("No segments");
          }
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);



  if (loading) return <SkeletonLoader />;
  if (!categories.length) return null;

  return (
    <div className="w-full bg-white pb-10">
      {categories.map((category) => (
        <SingleCategoryRow key={category._id} category={category} />
      ))}
    </div>
  );
};

const SingleCategoryRow = ({ category }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Only render if there are segments to show
  if (!category.segments || category.segments.length === 0) return null;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 buffer
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [category.segments]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.6; // Scroll 60% of screen width
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      // Timeout to allow scroll animation to finish before checking buttons again
      setTimeout(checkScroll, 500);
    }
  };

  return (
    <div className="py-8 md:py-12 pl-4 md:pl-12 border-b border-gray-50 last:border-none">
      {/* Header Section */}
      <div className="flex justify-between items-end pr-4 md:pr-12 mb-6 md:mb-8">
        <h2 className="text-3xl md:text-4xl font-serif text-gray-900 tracking-tight">
          {category.name}
        </h2>
        
        {/* 'Explore All' Link */}
        <Link 
          href={category.navlink || `${frontendurl}/c/${category.slug}`}
          className="hidden md:block text-sm font-medium text-gray-600 hover:text-black border-b border-transparent hover:border-black transition-all pb-0.5"
        >
          Explore All
        </Link>
      </div>

      {/* Slider Container */}
      <div className="relative group">
        
        {/* Navigation Buttons (Desktop Only - Hover triggered) */}
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center transition-all duration-300 md:group-hover:opacity-100 opacity-0 ${
            !canScrollLeft ? 'hidden' : 'translate-x-[-50%]'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center transition-all duration-300 md:group-hover:opacity-100 opacity-0 ${
            !canScrollRight ? 'hidden' : 'translate-x-[50%]'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>

        {/* Scrollable Area */}
        {/* Note: 'no-scrollbar' requires a custom utility or standard CSS to hide bars */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide snap-x snap-mandatory pr-4 md:pr-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Inline style for hiding scrollbar fallback
        >
          {category.segments.map((segment, index) => (
            <div
              key={segment._id || index}
              className="flex-none w-[70vw] md:w-[22vw] lg:w-[18vw] snap-start"
            >
              <Link href={`${frontendurl}/s/${segment?.slug}` || '#'}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gray-100 group/card cursor-pointer">
                  {/* Image with Zoom Effect */}
               {segment.image ? (
  segment.image.endsWith(".mp4") ? (
    <video
      src={segment.image}
      className="w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
    />
  ) : (
    <img
      src={segment.image}
      alt={segment.name}
      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
      loading="lazy"
    />
  )
) : (
  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
    No Image
  </div>
)}


                  {/* Dark Gradient Overlay for text readability (Subtle) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                  {/* Text Content */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl md:text-2xl font-medium tracking-wide drop-shadow-md">
                      {segment.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* Mobile 'Explore All' (Visible only on mobile below slider) */}
        <div className="md:hidden mt-4 pr-4 text-right">
           <Link 
            href={category.navlink || `${frontendurl}/c/${category.slug}`}
            className="text-sm font-semibold underline decoration-gray-400 underline-offset-4"
          >
            Explore All
          </Link>
        </div>
      </div>
    </div>
  );
};

// Simple Skeleton Loader for better UX
const SkeletonLoader = () => (
  <div className="p-8 space-y-12">
    {[1, 2].map((i) => (
      <div key={i} className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-64 w-64 bg-gray-200  rounded flex-none" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default CategoryShowcase;