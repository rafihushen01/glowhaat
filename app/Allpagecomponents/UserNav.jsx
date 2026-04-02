"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Menu, X, ArrowLeft, Search, ShoppingBag, LogOut } from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
// import { clsx, type ClassValue } from "clsx";
 // Importing your server url
import khancoslogo from "../../public/khancosmeticslogo.png"; // Your logo
import { useRouter } from "next/navigation";
import { serverurl } from "../utils/constants/serverurl";
import { clearUserData } from "../reduxcomponents/UserSlice";

// --- Utility for cleaner tailwind classes ---
// function cn(...inputs) {
//   return twMerge(clsx(inputs));
// }

// --- Animation Variants (The "Luxury" Feel) ---
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

const normalizeAssetUrl = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/")) return `${serverurl}${raw}`;
  return `${serverurl}/${raw}`;
};

const collectPreviewImages = (node, limit = 3, seen = new Set()) => {
  if (!node || seen.has(String(node._id))) return [];
  seen.add(String(node._id));

  const directImages = Array.isArray(node.images) ? node.images : [];
  const normalizedDirect = directImages
    .map((imgObj) => ({
      ...imgObj,
      image: normalizeAssetUrl(imgObj?.image),
    }))
    .filter((imgObj) => imgObj.image);

  if (normalizedDirect.length >= limit) return normalizedDirect.slice(0, limit);

  const childNodes = Array.isArray(node.children) ? node.children : [];
  const childImages = childNodes.flatMap((child) => collectPreviewImages(child, limit, seen));
  return [...normalizedDirect, ...childImages].slice(0, limit);
};

// --- Components ---

const UserNav = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;
  const isAuthenticated = Boolean(user && (user?._id || user?.email || user?.fullname));
  const userdisplayname = user?.fullname?.trim() || "KhanCosmetics User";
  const userinitial = (userdisplayname[0] || "U").toUpperCase();

  const getAvatarUrl = () => {
    const directAvatar = user?.usersavatar?.trim?.() || "";
    const normalizedGender = String(user?.gender || "").trim().toLowerCase();
    const genderAvatar =
      normalizedGender === "male"
        ? user?.maleavatar
        : normalizedGender === "female"
        ? user?.femaleavatar
        : user?.othergenderavatar;
    const avatar = directAvatar || genderAvatar || "";
    return normalizeAssetUrl(avatar);
  };
  const avatarUrl = getAvatarUrl();
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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isProfileOpen]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${serverurl}/auth/logout`,
        {},
        {
          withCredentials: true,
          timeout: 12000,
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(clearUserData());
      setIsProfileOpen(false);
      setMobileOpen(false);
      router.push("/signin");
    }
  };

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

        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between gap-3">
          
          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-900" />
          </button>

          {/* Logo */}
          <Link href="/" className="relative z-50 flex shrink-0 items-center gap-3 group">
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
          <div className="hidden lg:flex min-w-0 flex-1 px-2 xl:px-4">
            <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-max items-center gap-1 xl:gap-2 pr-4">
                {data.map((item) => (
                  <DesktopMenuItem key={item._id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex shrink-0 items-center gap-3 md:gap-4 text-gray-900">
            <Search className="w-5 h-5 cursor-pointer hover:text-[#1f5c49] transition-colors" />
            <div className="relative cursor-pointer group">
                <ShoppingBag className="w-5 h-5 group-hover:text-[#1f5c49] transition-colors" />
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </div>
            {isAuthenticated ? (
              <div className="relative hidden md:flex items-center gap-3" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-[#d7e3dc] bg-white px-2.5 py-1.5 transition hover:border-[#1f5c49]"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userdisplayname}
                      className="h-8 w-8 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5c49] text-xs font-bold text-white">
                      {userinitial}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]">
                    {userdisplayname}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#f1d7d7] bg-[#fff5f5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b42318] transition hover:bg-[#ffe9e9]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl border border-[#dce8e2] bg-white p-3 shadow-xl"
                    >
                      <div className="rounded-xl bg-[#f1f8f4] p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#5f7f72]">Signed In As</p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#1f5c49]">{userdisplayname}</p>
                        <p className="truncate text-xs text-[#527066]">{user?.email || ""}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f1d7d7] bg-[#fff5f5] px-3 py-2.5 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe9e9]"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/signin"
                  className="rounded-full border border-[#d7e3dc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] transition hover:bg-[#edf6f1]"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[#1f5c49] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#174737]"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer System */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileMenu
            data={data}
            onClose={() => setMobileOpen(false)}
            isAuthenticated={isAuthenticated}
            user={user}
            avatarUrl={avatarUrl}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// --- Desktop Mega Menu Logic ---

const DesktopMenuItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const router = useRouter();
  const defaultSubCategory = item.children && item.children.length > 0 ? item.children[0] : item;
  const currentSubCategory = activeSubCategory || defaultSubCategory;

  return (
    <div
      onMouseEnter={() => {
        setIsOpen(true);
        setActiveSubCategory(defaultSubCategory);
      }}
      onMouseLeave={() => {
        setIsOpen(false);
        setActiveSubCategory(null);
      }}
      className="relative h-full shrink-0 flex items-center justify-center"
    >
      <Link 
        href={`${item.link || "/"}`}
        className="text-sm font-medium tracking-wide uppercase hover:text-purple-600 transition-colors py-4 px-2 whitespace-nowrap"
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
            className="absolute top-full left-1/2 z-40 mt-1 w-[min(96vw,1200px)] -translate-x-1/2 bg-white shadow-2xl rounded-b-xl border border-gray-100 overflow-hidden"
          >
            <div className="flex h-[500px]">
              {/* Left: Recursive List */}
              <div className="w-[330px] border-r border-gray-100 p-6 overflow-y-auto custom-scrollbar">
                <ul className="space-y-2">
                    {item.children.map((child) => {
                        const childPreview = collectPreviewImages(child, 1)[0];
                        return (
                        <li key={child._id} 
                            onMouseEnter={() => setActiveSubCategory(child)}
                            className="group"
                        >
                            <Link
  href={`${child.link || "/"}`}
  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all"
>
  <div className="flex items-center gap-3 min-w-0">
    {childPreview?.image ? (
      <img
        src={childPreview.image}
        alt={child?.name || "Category"}
        className="h-9 w-9 rounded-md object-cover border border-gray-200"
        loading="lazy"
      />
    ) : null}
    <span
      className={`text-sm tracking-wide transition-all truncate ${
        currentSubCategory?._id === child._id
          ? "font-bold text-black"
          : "text-gray-500"
      }`}
    >
      {child.name}
    </span>
  </div>

  {child.children?.length > 0 && (
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black" />
  )}
</Link>

                        </li>
                    )})}
                </ul>
              </div>

              {/* Right: Dynamic Image Grid */}
              <div className="flex-1 p-8 bg-gray-50/50">
                <div className="h-full flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-2xl font-light text-gray-900">{currentSubCategory?.name}</h3>
                        <Link href={`${currentSubCategory?.link || "/"}`} className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-2 inline-block border-b border-purple-600 pb-1">
                            View Collection
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 h-full">
                        {/* Display images of the currently hovered sub-category */}
                        {collectPreviewImages(currentSubCategory, 3).map((imgObj, idx) => (
                             <motion.div 
                                key={`${currentSubCategory?._id || "node"}-${idx}-${imgObj.image || "img"}`}
                                layoutId={`img-${currentSubCategory._id}-${idx}`}
                                className="relative w-full h-full overflow-hidden rounded-lg group cursor-pointer"
                             >
                                <img
                                    src={imgObj.image}
                                    alt="Category Preview"
                                    onClick={() => {
                                      if (imgObj?.link) router.push(imgObj.link);
                                    }}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                             </motion.div>
                        ))}
                        {collectPreviewImages(currentSubCategory, 3).length === 0 && (
                            <div className="col-span-3 flex items-center justify-center text-gray-300 italic">
                                No preview images available for {currentSubCategory?.name}
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

const MobileMenu = ({ data, onClose, isAuthenticated, user, avatarUrl, onLogout }) => {
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
                                                href={`${item.link || "/"}`}
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
            <div className="p-6 border-t border-gray-100 bg-white space-y-2">
                 {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-[#d9e6df] bg-[#f4faf7] px-3 py-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={user?.fullname || "User Avatar"}
                          className="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f5c49] text-xs font-bold text-white">
                          {(user?.fullname?.[0] || "U").toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[#648578]">Logged In</p>
                        <p className="truncate text-sm font-semibold text-[#1f5c49]">
                          {user?.fullname || "KhanCosmetics User"}
                        </p>
                        <p className="truncate text-xs text-[#648578]">{user?.email || ""}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#f1d7d7] bg-[#fff5f5] py-3 text-sm font-semibold tracking-wide text-[#b42318]"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                 ) : (
                  <>
                    <Link
                      href="/signin"
                      onClick={onClose}
                      className="block w-full rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-center text-sm font-semibold tracking-wide text-[#1f5c49]"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={onClose}
                      className="block w-full rounded-lg bg-[#1f5c49] py-3 text-center text-sm font-semibold tracking-wide text-white"
                    >
                      Create Account
                    </Link>
                  </>
                 )}
            </div>
        </motion.div>
    </>
  );
};

export default UserNav;
