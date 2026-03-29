"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ChevronDown,
  Check,
  SlidersHorizontal,
  ShoppingBag,
  X,
  Filter,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { serverurl } from "../utils/constants/serverurl";

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- CONFIG ---
const API_BASE = serverurl;
const ITEM_URL = `${serverurl}/item`;

// --- DATA HELPERS ---
const findSegmentData = (data, targetSlug) => {
  for (const cat of data) {
    if (cat.slug === targetSlug) {
      return {
        name: cat.name,
        image: cat.media || cat.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
        description: cat.description,
        type: "category"
      };
    }
    if (cat.segments && cat.segments.length > 0) {
      const foundSeg = cat.segments.find((seg) => seg.slug === targetSlug);
      if (foundSeg) {
        return {
          name: foundSeg.name,
          image: foundSeg.image || cat.media || "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
          description: foundSeg.description,
          type: "segment"
        };
      }
    }
  }
  return null;
};

// --- COMPONENTS ---

// 1. HERO SECTION (Parallax + Glass Overlay)
const HeroSection = ({ title, image, loading }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  if (loading) {
    return (
      <div className="relative h-[60vh] md:h-[75vh] w-full bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Parallax Background Image - FORCE COVER */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </motion.div>

      {/* Glassy Content Box */}
    
    </div>
  );
};

// 2. GLASS DROPDOWN COMPONENT
const FilterDropdown = ({ label, isOpen, toggle, children, activeCount }) => {
  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={cn(
          "flex items-center gap-3 px-6 py-3 text-xs md:text-sm uppercase tracking-widest font-medium transition-all duration-300 rounded-full backdrop-blur-md border",
          isOpen 
            ? "bg-white/90 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
            : "bg-white/50 hover:bg-white/70 text-gray-800 border-white/40 hover:border-white/80",
          activeCount > 0 && !isOpen && "bg-black/80 text-white border-black/80"
        )}
      >
        {label}
        {activeCount > 0 && (
          <span className={cn(
            "flex items-center justify-center w-5 h-5 text-[9px] rounded-full shadow-sm",
            isOpen ? "bg-black text-white" : "bg-white text-black"
          )}>
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, scale: 0.96, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 mt-3 min-w-[300px] z-50 p-1 rounded-2xl bg-white/60 backdrop-blur-3xl border border-white/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
          >
            <div className="bg-white/40 rounded-xl p-5 backdrop-blur-sm">
                {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN PAGE ---
const SegmentPage = () => {
  const params = useParams();
  const slug = params?.slug || "all";
  const router = useRouter();

  // Data States
  const [segmentMeta, setSegmentMeta] = useState({ name: "", image: "", loading: true });
  const [products, setProducts] = useState([]);
  const [availableFilters, setAvailableFilters] = useState({
    colors: [],
    sizes: [],
    minPrice: 0,
    maxPrice: 10000,
  });

  // Filter States
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortOption, setSortOption] = useState("newest");

  // UI States
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // 1. Fetch Meta
  useEffect(() => {
    const fetchSegmentInfo = async () => {
      try {
        setSegmentMeta(prev => ({ ...prev, loading: true }));
        const response = await axios.get(`${API_BASE}/category/public/full`);
        if (response.data?.success) {
            const foundData = findSegmentData(response.data.data, slug);
            setSegmentMeta({
                name: foundData ? foundData.name : slug.replace(/-/g, " "),
                image: foundData ? foundData.image : "https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=2059&auto=format&fit=crop",
                loading: false
            });
        }
      } catch (error) {
        console.error("Meta Error:", error);
        setSegmentMeta({ name: slug, image: "", loading: false });
      }
    };
    if (slug) fetchSegmentInfo();
  }, [slug]);

  // 2. Fetch Products
  useEffect(() => {
    const initProducts = async () => {
      try {
        setLoadingProducts(true);
        const filterRes = await axios.get(`${ITEM_URL}/category/filters/${slug}`);
        if (filterRes.data.success) {
          const { filters } = filterRes.data;
          setAvailableFilters({
            colors: filters.colors || [],
            sizes: filters.sizes || [],
            minPrice: filters.minPrice || 0,
            maxPrice: filters.maxPrice || 10000,
          });
          setPriceRange([filters.minPrice || 0, filters.maxPrice || 10000]);
        }
        const productRes = await axios.get(`${ITEM_URL}/category/${slug}`);
        if (productRes.data.success) {
          setProducts(productRes.data.data);
        }
      } catch (err) {
        console.error("Product Error", err);
      } finally {
        setTimeout(() => setLoadingProducts(false), 800);
      }
    };
    if (slug) initProducts();
  }, [slug]);

  // 3. Filter Logic
  const applyFilters = async () => {
    try {
      setFiltering(true);
      const payload = {
        colors: selectedColors,
        sizes: selectedSizes,
        minprice: priceRange[0],
        maxprice: priceRange[1],
        sort: sortOption,
      };
      const res = await axios.post(`${ITEM_URL}/category/filter/${slug}`, payload);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error("Filter Error", error);
    } finally {
      setTimeout(() => setFiltering(false), 300);
    }
  };

  useEffect(() => {
    if (!loadingProducts) {
      applyFilters();
    }
  }, [selectedColors, selectedSizes, sortOption, priceRange]);

  // Handlers
  const toggleDropdown = (name) => setOpenDropdown(openDropdown === name ? null : name);
  const formatPrice = (price) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(price);
  
  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown-container')) setOpenDropdown(null);
    };
    document.body.addEventListener("click", handleClick);
    return () => document.body.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* 1. HERO */}
      <HeroSection 
        title={segmentMeta.name || slug} 
        image={segmentMeta.image} 
        loading={segmentMeta.loading} 
      />

      {/* 2. GLASSY STICKY BAR */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="sticky top-0 z-50 transition-all duration-300 backdrop-blur-3xl bg-white/70 border-b border-white/20 shadow-sm"
      >
        <div className="max-w-[1920px] mx-auto px-4 md:px-8 h-20 md:h-24 flex items-center justify-between">
          
          {/* Filters (Left) */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2 dropdown-container">
            <div className="hidden lg:flex items-center gap-2 text-gray-400 mr-4 pr-4 border-r border-gray-300/50 h-8">
              <SlidersHorizontal size={18} strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold">Refine</span>
            </div>

            {/* Color */}
            <FilterDropdown label="Color" isOpen={openDropdown === "color"} toggle={() => toggleDropdown("color")} activeCount={selectedColors.length}>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Select Shade</span>
              <div className="flex flex-wrap gap-3 max-w-[280px]">
                {availableFilters.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-gray-200",
                      selectedColors.includes(c) ? "scale-110 ring-2 ring-offset-2 ring-gray-900" : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c.toLowerCase() }}
                    title={c}
                  >
                    {selectedColors.includes(c) && <Check size={14} className="text-white mix-blend-difference drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Size */}
            <FilterDropdown label="Size" isOpen={openDropdown === "size"} toggle={() => toggleDropdown("size")} activeCount={selectedSizes.length}>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Select Fit</span>
              <div className="grid grid-cols-3 gap-2 w-[240px]">
                {availableFilters.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    className={cn(
                      "px-3 py-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 border",
                      selectedSizes.includes(s) 
                        ? "bg-black text-white border-black shadow-lg" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Price */}
            <FilterDropdown label="Price" isOpen={openDropdown === "price"} toggle={() => toggleDropdown("price")} activeCount={priceRange[0] > availableFilters.minPrice || priceRange[1] < availableFilters.maxPrice ? 1 : 0}>
              <div className="w-[280px] space-y-6 px-2">
                 <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                    <span className="text-lg font-serif italic text-gray-900">{formatPrice(priceRange[0])}</span>
                    <span className="text-gray-300 mb-1 font-light">—</span>
                    <span className="text-lg font-serif italic text-gray-900">{formatPrice(priceRange[1])}</span>
                 </div>
                 <input
                   type="range"
                   min={availableFilters.minPrice}
                   max={availableFilters.maxPrice}
                   value={priceRange[1]}
                   onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                   className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                 />
              </div>
            </FilterDropdown>
          </div>

          {/* Sort (Right) */}
          <div className="flex items-center gap-6 dropdown-container relative">
            <span className="hidden xl:block text-[10px] text-gray-400 tracking-[0.2em] font-medium">
                {products.length} PRODUCTS FOUND
            </span>
            
            <button
               onClick={() => toggleDropdown("sort")}
               className="flex items-center gap-2 text-xs md:text-sm font-medium hover:text-gray-600 transition-colors uppercase tracking-widest"
             >
               <span className="text-gray-400 hidden md:inline">Sort:</span>
               <span className="font-bold">{sortOption.replace(/_/g, " ")}</span>
               <ChevronDown size={14} />
             </button>

             <AnimatePresence>
                {openDropdown === "sort" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-4 w-64 bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden py-2 ring-1 ring-black/5"
                    >
                        {[
                           { label: "Newest Arrivals", val: "newest" },
                           { label: "Price: Low to High", val: "price_low_high" },
                           { label: "Price: High to Low", val: "price_high_low" },
                        ].map((opt) => (
                           <button
                             key={opt.val}
                             onClick={() => { setSortOption(opt.val); setOpenDropdown(null); }}
                             className={cn(
                               "w-full text-left px-6 py-4 text-[10px] uppercase tracking-[0.15em] font-bold transition-all hover:bg-black/5",
                               sortOption === opt.val ? "text-black bg-black/5 pl-5 border-l-4 border-black" : "text-gray-500 pl-6 border-l-4 border-transparent"
                             )}
                           >
                             {opt.label}
                           </button>
                        ))}
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 3. PRODUCT GRID */}
      <div className="w-full min-h-[100vh] bg-white">
         {/* Using grid-cols-2 for mobile, up to 5 for massive screens */}
         {/* gap-px creates thin lines between cards if background is gray-100 */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-px bg-gray-100/50">
            {loadingProducts ? (
                 [...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-[3/4.5] bg-white p-4 flex flex-col gap-4 animate-pulse">
                        <div className="w-full h-3/4 bg-gray-100 rounded-sm" />
                        <div className="w-2/3 h-3 bg-gray-100 rounded-sm" />
                    </div>
                 ))
            ) : products.length === 0 ? (
                <div className="col-span-full py-40 flex flex-col items-center justify-center text-gray-400">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-lg font-serif italic">No products match your criteria.</p>
                    <button onClick={() => { setSelectedColors([]); setSelectedSizes([]); setPriceRange([availableFilters.minPrice, availableFilters.maxPrice]); }} className="mt-8 text-xs border-b border-black text-black pb-1 uppercase tracking-widest hover:opacity-50 transition-opacity">Reset Filters</button>
                </div>
            ) : (
                products.map((product, idx) => {
                    const firstOption = product.variants?.[0]?.options?.[0];
                    const price = firstOption?.currentprice || 0;

                    return (
                        <motion.div
                            key={product._id}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: "50px" }}
                            transition={{ duration: 0.8, delay: idx * 0.05 }}
                            className="group relative bg-white overflow-hidden cursor-pointer"
                            onClick={() => router.push(`/product/${product?.slug}`)}
                        >
                            {/* IMAGE CONTAINER - CRITICAL FIX
                                1. aspect-[3/4.5] forces a strict portrait rectangle.
                                2. absolute inset-0 w-full h-full object-cover forces image to fill container 10000%
                            */}
                            <div className="relative w-full aspect-[3/4.5] overflow-hidden bg-gray-50">
                                <img
                                    src={product.whiteimage}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110 will-change-transform"
                                    onMouseEnter={(e) => { if (product.hoverimage) e.currentTarget.src = product.hoverimage; }}
                                    onMouseLeave={(e) => { e.currentTarget.src = product.whiteimage; }}
                                />
                                
                                {/* Hover Glass Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />

                                {/* Quick View (iOS Style Floating Button) */}
                                <div className="absolute inset-x-0 bottom-6 flex justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out px-4">
                                    <button className="w-full max-w-[200px] bg-white/70 backdrop-blur-xl border border-white/40 text-black text-[10px] font-bold uppercase tracking-[0.2em] py-3 rounded-full shadow-lg hover:bg-white hover:scale-105 transition-all">
                                        Quick View
                                    </button>
                                </div>
                            </div>

                            {/* Minimal Info */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                {/* Badges can go here */}
                                {idx < 3 && <span className="bg-black/80 backdrop-blur-md text-white px-2 py-1 text-[9px] uppercase tracking-widest font-bold rounded-sm">New</span>}
                            </div>

                            <div className="p-5 text-center bg-white relative z-20 transition-transform duration-300 group-hover:-translate-y-2">
                                <h3 className="text-[11px] md:text-xs text-gray-500 uppercase tracking-[0.15em] font-medium line-clamp-1 group-hover:text-black transition-colors mb-2">
                                    {product.name}
                                </h3>
                                <p className="text-sm md:text-base font-serif italic text-gray-900">
                                    {formatPrice(price)}
                                </p>
                                
                                {/* Color Swatches on Hover */}
                                <div className="h-4 mt-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                     {product.variants?.filter(v => v.varianttype === "color").slice(0, 3).map((v, i) => (
                                         <div key={i} className="w-2 h-2 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: v.name }} />
                                     ))}
                                     {product.variants?.filter(v => v.varianttype === "color").length > 3 && <span className="text-[9px] text-gray-400">+</span>}
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            )}
         </div>
      </div>
    </div>
  );
};

export default SegmentPage;