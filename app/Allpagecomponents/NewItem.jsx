"use client"
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Bolt, ShoppingBag, Star, Zap, ArrowRight, MousePointer2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { serverurl } from '../utils/constants/serverurl'
import { trackRecommendationEvent } from '../utils/recommendation'
import { getRequestConfig } from '../utils/requestConfig'


// --- Utility: Currency Formatter ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', { 
    style: 'currency', 
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('BDT', '৳');
};

const NewItem = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState("");
  const router = useRouter();
  const carouselRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const fetchNewItems = async () => {
      try {
        const response = await axios.get(`${serverurl}/item/getnewitems`);
        if (response.data.success) {
          setItems(response.data.items);
        }
      } catch (error) {
        console.error("Error fetching new items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNewItems();
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [items]);

  const handleQuickCartAction = async (item, toCheckout = false) => {
    try {
      setBusyProductId(String(item?._id || ""));
      const { data } = await axios.post(
        `${serverurl}/cart/add`,
        { slug: item.slug, variantindex: 0, optionindex: 0, quantity: 1 },
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Could not add to cart.");
      if (toCheckout) router.push("/checkout");
    } catch (_error) {
      // silent keep carousel smooth
    } finally {
      setBusyProductId("");
    }
  };

  return (
    <section className="w-full py-24 bg-[#f8fafc] relative overflow-hidden select-none">
      {/* --- Merkova Style Ambient Background --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <span className="h-[2px] w-12 bg-emerald-700"></span>
              <span className="text-emerald-700 font-black uppercase tracking-[0.3em] text-[10px]">Khan Cosmetics New Collection</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-[1000] text-slate-900 tracking-tighter"
            >
              New <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-emerald-500">Arrivals</span>
            </motion.h2>
          </div>

          <motion.button 
            whileHover={{ x: 5 }}
            className="flex items-center gap-2 text-slate-400 font-semibold text-sm group"
          >
            <span>DRAG TO EXPLORE</span>
                <MousePointer2 size={16} className="group-hover:text-emerald-700 transition-colors" />
              </motion.button>
        </div>

        {/* --- Carousel --- */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <motion.div ref={carouselRef} className="cursor-grab active:cursor-grabbing overflow-hidden">
            <motion.div 
              drag="x" 
              dragConstraints={{ right: 0, left: -width - 50 }}
              className="flex gap-8 pb-10 px-2"
            >
              {items.map((item, index) => (
                <ProductCard key={item._id} item={item} index={index} router={router} onQuickCart={handleQuickCartAction} busyProductId={busyProductId} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

const ProductCard = ({ item, index, router, onQuickCart, busyProductId }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // --- Updated Logic for MongoDB Deep Nesting ---
  const mainVariant = item.variants?.[0] || {};
  const mainOption = mainVariant.options?.[0] || {};
  
  const basePrice = mainOption.baseprice || 0;
  const currentPrice = mainOption.currentprice || 0;
  const discountPercentage = mainOption.discountpercentage || 0;
  const hasDiscount = discountPercentage > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: index * 0.1 }}
      className="relative min-w-[300px] md:min-w-[380px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    onClick={() => {
      trackRecommendationEvent({
        eventtype: "product_click",
        slug: item?.slug,
      });
      router.push(`/product/${item?.slug}`);
    }}

    >
      <div className="relative rounded-[2.5rem] bg-white p-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-20px_rgba(4,120,87,0.25)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-slate-100 group-hover:border-emerald-100 group-hover:-translate-y-2">
        
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#f1f5f9]">
          
          {/* Discount Badge */}
          {hasDiscount && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-5 right-5 z-30 bg-emerald-700 text-white font-black text-[11px] px-4 py-1.5 rounded-full shadow-[0_8px_20px_-4px_rgba(4,120,87,0.45)] flex items-center gap-1"
            >
              <Zap size={12} fill="currentColor" /> {discountPercentage}% OFF
            </motion.div>
          )}

          {/* New Tag */}
          <div className="absolute top-5 left-5 z-30">
            <span className="bg-white/90 backdrop-blur-md text-slate-900 font-bold text-[10px] px-4 py-1.5 rounded-full shadow-sm">NEW SEASON</span>
          </div>

          {/* Main Image */}
          <motion.img 
            src={item.whiteimage} 
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.8 }}
          />
          
          {/* Hover Image Overlay */}
          <AnimatePresence>
            {isHovered && item.hoverimage && (
              <motion.img 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={item.hoverimage} 
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            )}
          </AnimatePresence>

          {/* Action Overlay */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-emerald-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className="absolute bottom-8 left-0 w-full flex justify-center gap-4 px-6">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex-1 h-14 bg-white text-slate-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-2xl"
                onClick={(event) => {
                  event.stopPropagation();
                  onQuickCart(item, false);
                }}
                disabled={busyProductId === String(item?._id || "")}
              >
                <ShoppingBag size={18} /> ADD TO BAG
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-2xl"
                onClick={(event) => {
                  event.stopPropagation();
                  onQuickCart(item, true);
                }}
                disabled={busyProductId === String(item?._id || "")}
              >
                <Bolt size={20} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{item.brand || "KHANCOSMETICS"}</span>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
              <Star size={10} className="text-amber-500 fill-amber-500" />
<span className="text-[10px] font-bold text-amber-600">
  {item?.star =="0" ?"New" :item?.star}
</span>

            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through font-medium mb-0.5">
                  {formatCurrency(basePrice)}
                </span>
              )}
              <span className="text-2xl font-[1000] text-slate-900 tracking-tight">
                {formatCurrency(currentPrice)}
              </span>
            </div>

            {/* Variant Indicators */}
            <div className="flex -space-x-3">
              {item.variants?.length > 0 ? (
                item.variants.slice(0, 3).map((v, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-slate-100">
                    <img src={v.images?.[0] || item.whiteimage} className="w-full h-full object-cover" alt="" />
                  </div>
                ))
              ) : (
                <div className="w-9 h-9 rounded-full border-[3px] border-white shadow-sm bg-emerald-700" />
              )}
              {item.variants?.length > 3 && (
                <div className="w-9 h-9 rounded-full border-[3px] border-white shadow-sm bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                  +{item.variants.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="flex gap-8 overflow-hidden">
    {[1, 2, 3].map((i) => (
      <div key={i} className="min-w-[380px] h-[600px] bg-white rounded-[2.5rem] p-3 animate-pulse">
        <div className="w-full h-[450px] bg-slate-100 rounded-[2rem]" />
        <div className="p-5 space-y-4">
          <div className="h-4 bg-slate-100 w-1/4 rounded" />
          <div className="h-8 bg-slate-100 w-3/4 rounded" />
          <div className="h-10 bg-slate-100 w-1/2 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default NewItem;
