import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Menu, X, ArrowLeft, Search, ShoppingBag } from "lucide-react";
// import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
 // Importing your server url
import khancoslogo from "../../public/khancosmeticslogo.png"; // Your logo
import { useRouter } from "next/navigation.js";
import { serverurl } from "../utils/constants/serverurl";

// --- Utility for cleaner tailwind classes ---
// function cn(...inputs) {
//   return twMerge(clsx(inputs));
// }

// --- Animation Variants (The "Luxury" Feel) ---
const fadeOverlay = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)", transition: { duration: 0.4 } },
};

const megaMenuVar = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 30 } 
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const slideStack = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  }),
};

// --- Components ---

const UserNav = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
const router=useRouter()
  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${serverurl}/nav/nav`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Nav Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Scroll listener for glass effect
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return <div className="h-20 bg-white animate-pulse" />;

  return (
    <>
    <nav
  className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out border-b border-transparent
  ${
    isScrolled
      ? "bg-white/80 backdrop-blur-md py-3 shadow-sm border-gray-100"
      : "bg-white py-5"
  }`}
>

        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          
          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-900" />
          </button>

          {/* Logo */}
          <Link href="/" className="relative z-50 flex items-center gap-2 group">
             <div className="relative overflow-hidden w-32 md:w-40">
                <Image 
                    src={khancoslogo} 
                    alt="KhanCosmetics" 
                    className="object-contain w-full h-auto"
                    width={160}
                    height={50}
                    priority
                />
             </div>
          </Link>

          {/* Desktop Navigation (Center) */}
          <div className="hidden lg:flex items-center gap-8">
            {data.map((item) => (
              <DesktopMenuItem key={item._id} item={item} />
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4 text-gray-900">
            <Search className="w-5 h-5 cursor-pointer hover:text-purple-600 transition-colors" />
            <div className="relative cursor-pointer group">
                <ShoppingBag className="w-5 h-5 group-hover:text-purple-600 transition-colors" />
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer System */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileMenu data={data} onClose={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// --- Desktop Mega Menu Logic ---

const DesktopMenuItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubCategory, setActiveSubCategory] = useState(null);

  // Set initial active image to the first child or the item itself
  useEffect(() => {
    if (isOpen && item.children && item.children.length > 0) {
      setActiveSubCategory(item.children[0]);
    } else {
        setActiveSubCategory(item);
    }
  }, [isOpen, item]);

  return (
    <div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className="relative h-full flex items-center justify-center"
    >
      <Link 
        href={`${item.link}`}
        className="text-sm font-medium tracking-wide uppercase hover:text-purple-600 transition-colors py-4 px-1"
      >
        {item.name}
      </Link>

      <AnimatePresence>
        {isOpen && item.children && item.children.length > 0 && (
          <motion.div
            variants={megaMenuVar}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full -left-[10vw] w-[90vw] max-w-[1400px] bg-white shadow-2xl rounded-b-xl border-t border-gray-100 overflow-hidden"
            style={{ translateX: "-20%" }} // Centering logic rough adjustment
          >
            <div className="flex h-[500px]">
              {/* Left: Recursive List */}
              <div className="w-1/3 min-w-[300px] border-r border-gray-100 p-8 overflow-y-auto custom-scrollbar">
                <ul className="space-y-2">
                    {item.children.map((child) => (
                        <li key={child._id} 
                            onMouseEnter={() => setActiveSubCategory(child)}
                            className="group"
                        >
                            <Link
  href={`${child.link}`}
  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all"
>
  <span
    className={`text-sm tracking-wide transition-all ${
      activeSubCategory?._id === child._id
        ? "font-bold text-black"
        : "text-gray-500"
    }`}
  >
    {child.name}
  </span>

  {child.children?.length > 0 && (
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black" />
  )}
</Link>

                        </li>
                    ))}
                </ul>
              </div>

              {/* Right: Dynamic Image Grid */}
              <div className="flex-1 p-8 bg-gray-50/50">
                <div className="h-full flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-2xl font-light text-gray-900">{activeSubCategory?.name}</h3>
                        <Link href={`${activeSubCategory?.link}`} className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-2 inline-block border-b border-purple-600 pb-1">
                            View Collection
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 h-full">
                        {/* Display images of the currently hovered sub-category */}
                        {activeSubCategory?.images?.slice(0, 3).map((imgObj, idx) => (
                             <motion.div 
                                key={idx + (imgObj.image || "img")}
                                layoutId={`img-${activeSubCategory._id}-${idx}`}
                                className="relative w-full h-full overflow-hidden rounded-lg group cursor-pointer"
                             >
                                <img
                                    src={imgObj.image}
                                    alt="Category Preview"
                                    onClick={()=>router.push(imgObj?.link)}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                             </motion.div>
                        ))}
                        {(!activeSubCategory?.images || activeSubCategory.images.length === 0) && (
                            <div className="col-span-3 flex items-center justify-center text-gray-300 italic">
                                No preview images available for {activeSubCategory?.name}
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Mobile Infinite Drawer (The "App" Feel) ---

const MobileMenu = ({ data, onClose }) => {
  // We use a stack to manage depth. 
  // Stack[0] is root. Stack[1] is a child category, etc.
  const [navStack, setNavStack] = useState([{ name: "Menu", data: data, type: "root" }]);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = back

  const pushLevel = (item) => {
    if (!item.children || item.children.length === 0) return;
    setDirection(1);
    setNavStack([...navStack, { name: item.name, data: item.children, type: "child" }]);
  };

  const popLevel = () => {
    if (navStack.length <= 1) return;
    setDirection(-1);
    setNavStack(navStack.slice(0, -1));
  };

  const currentLevel = navStack[navStack.length - 1];

  return (
    <>
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
        />

        {/* Drawer */}
        <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white z-[160] shadow-2xl overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100 justify-between bg-white z-10">
                {navStack.length > 1 ? (
                    <button onClick={popLevel} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                ) : (
                    <span className="text-lg font-bold tracking-tight">MENU</span>
                )}
                <button onClick={onClose} className="p-2 bg-gray-50 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content Area with Animation */}
            <div className="flex-1 relative overflow-hidden bg-gray-50/30">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={navStack.length}
                        custom={direction}
                        variants={slideStack}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0 overflow-y-auto px-4 py-2"
                    >
                        <h2 className="text-2xl font-light mb-6 mt-4 px-2">{currentLevel.name}</h2>
                        <ul className="space-y-1">
                            {currentLevel.data.map((item) => {
                                const hasChildren = item.children && item.children.length > 0;
                                return (
                                    <li key={item._id}>
                                        <div 
                                            className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-gray-100 mb-2 active:scale-[0.98] transition-transform"
                                        >
                                            <Link 
                                                href={`${item.link}`}
                                                onClick={() => { if(!hasChildren) onClose(); }}
                                                className="flex-1 text-base font-medium text-gray-800"
                                            >
                                                {item.name}
                                            </Link>
                                            
                                            {/* Logic: If it has children, clicking the arrow drills down. 
                                                Illiyeen logic: Clicking text goes to link, clicking arrow goes deeper. */}
                                            {hasChildren && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        pushLevel(item);
                                                    }}
                                                    className="p-2 -mr-2 text-gray-400 hover:text-purple-600"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white">
                 <button className="w-full bg-black text-white py-3 rounded-lg font-medium tracking-wide">
                    Sign In / Register
                 </button>
            </div>
        </motion.div>
    </>
  );
};

export default UserNav;