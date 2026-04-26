"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Menu, X, ArrowLeft, Search, ShoppingBag, LogOut, Heart, Crown, Award, Sparkles, Bell, LayoutDashboard } from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {useLocale, useTranslations} from "next-intl";
// import { clsx, type ClassValue } from "clsx";
 // Importing your server url
import {useRouter} from "next/navigation";
import { serverurl } from "../utils/constants/serverurl";
import { useActiveLogo } from "../hooks/useActiveLogo";
import { clearUserData } from "../reduxcomponents/UserSlice";
import { setCartItems } from "../reduxcomponents/CartSlice";
import { getRequestConfig } from "../utils/requestConfig";

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

const getNodeThumb = (node) => {
  if (!node) return "";
  const direct = Array.isArray(node.images) ? node.images : [];
  const directUrl = direct[0]?.image ? normalizeAssetUrl(direct[0].image) : "";
  if (directUrl) return directUrl;

  // fallback: use first descendant image (if any)
  const fallback = collectPreviewImages(node, 1)[0];
  return fallback?.image || "";
};

const discoveryQuickLinks = [
  {
    id: "best-selling",
    label: "Best Selling Items",
    href: "/best-selling",
    Icon: Crown,
  },
  {
    id: "five-star",
    label: "5 Star Rated Items",
    href: "/five-star",
    Icon: Award,
  },
  {
    id: "new-in",
    label: "New In",
    href: "/new-in",
    Icon: Sparkles,
  },
];

// --- Components ---

const UserNav = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navHeight, setNavHeight] = useState(72);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const navRef = useRef(null);
  const router = useRouter();
  const locale = useLocale();
  const { logoUrl } = useActiveLogo();
  const t = useTranslations("UserNav");
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const user = userData?.user || userData?.data || userData || null;
  const isAuthenticated = Boolean(user && (user?._id || user?.email || user?.fullname));
  const userdisplayname = user?.fullname?.trim() || t("defaultUserName");
  const userinitial = (userdisplayname[0] || "U").toUpperCase();
  const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
  const isSellerRole = String(user?.role || "").toLowerCase() === "seller";
  const isSuperAdminRole = String(user?.role || "").toLowerCase() === "superadmin";
  const profileDashboardPath = "/profile-dashboard";
  const [wishlistCount, setWishlistCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);
  const [activeDesktopItem, setActiveDesktopItem] = useState(null);
  const desktopMenuCloseTimer = useRef(null);

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
    const updateHeight = () => {
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight || 72);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [isScrolled]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const [cartRes, wishlistRes] = await Promise.all([
          axios.get(`${serverurl}/cart/my`, getRequestConfig()),
          axios.get(`${serverurl}/wishlist/my`, getRequestConfig()),
        ]);

        if (cartRes?.data?.success) {
          dispatch(setCartItems(cartRes.data.items || []));
        }
        if (wishlistRes?.data?.success) {
          setWishlistCount(Number(wishlistRes.data.count || 0));
        }
      } catch (error) {
        setWishlistCount(0);
      }
    };
    fetchCart();
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    if (isProfileOpen || searchOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isProfileOpen, searchOpen]);

  useEffect(() => {
    return () => {
      if (desktopMenuCloseTimer.current) {
        clearTimeout(desktopMenuCloseTimer.current);
      }
    };
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axios.get(`${serverurl}/item/search?q=${encodeURIComponent(value)}`);
        if (res?.data?.success) {
          setSearchResults(res.data.items || []);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

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

  const clearDesktopCloseTimer = () => {
    if (desktopMenuCloseTimer.current) {
      clearTimeout(desktopMenuCloseTimer.current);
      desktopMenuCloseTimer.current = null;
    }
  };

  const openDesktopMegaMenu = (item) => {
    clearDesktopCloseTimer();
    setActiveDesktopItem(item);
  };

  const closeDesktopMegaMenu = () => {
    clearDesktopCloseTimer();
    desktopMenuCloseTimer.current = setTimeout(() => {
      setActiveDesktopItem(null);
    }, 120);
  };

  const switchLocale = (nextLocale) => {
    if (nextLocale === locale) return;

    const cookieParts = ["path=/", `max-age=${60 * 60 * 24 * 365}`, "SameSite=Lax"];
    document.cookie = `NEXT_LOCALE=${nextLocale}; ${cookieParts.join("; ")}`;
    document.cookie = `KHAN_LOCALE=${nextLocale}; ${cookieParts.join("; ")}`;
    window.location.reload();
  };

  if (loading) return <div className="h-20 bg-white animate-pulse" />;

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-[100] overflow-visible border-b border-[#e9eeeb] transition-all duration-500 ease-in-out ${
          isScrolled ? "bg-white/92 backdrop-blur-md shadow-sm" : "bg-white"
        }`}
      >
        {/* Top Nav (Desktop) */}
        <div className="relative z-[130] hidden lg:block border-b border-[#edf2ef]">
          <div className="mx-auto flex min-h-11 w-full max-w-[1320px] flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#25372f]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchLocale("en")}
                  className={`font-medium transition-colors ${locale === "en" ? "text-[#1f5c49]" : "text-[#4f665d] hover:text-[#1f5c49]"}`}
                >
                  {t("language.english")}
                </button>
                <span className="text-[#9db2a8]">|</span>
                <button
                  type="button"
                  onClick={() => switchLocale("bn")}
                  className={`font-medium transition-colors ${locale === "bn" ? "text-[#1f5c49]" : "text-[#4f665d] hover:text-[#1f5c49]"}`}
                >
                  {t("language.bangla")}
                </button>
              </div>
              <a href="mailto:glowhaat@gmail.com" className="hover:text-[#1f5c49] transition-colors">
                glowhaat@gmail.com
              </a>
              <Link href="/contact" className="hover:text-[#1f5c49] transition-colors">
                {t("contact")}
              </Link>
              {isSellerRole ? (
                <Link href="/seller-dashboard" className="hover:text-[#1f5c49] transition-colors font-semibold">
                  Seller Dashboard
                </Link>
              ) : (
                <Link href="/become-seller" className="hover:text-[#1f5c49] transition-colors">
                  Become Seller
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-gray-900" ref={searchRef}>
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#d7e3dc] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49] transition hover:border-[#1f5c49]"
              >
                <Search className="h-4 w-4" />
                {t("search")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e3dc] text-[#1f5c49] transition hover:border-[#1f5c49]"
              >
                <ShoppingBag className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1f5c49] text-[10px] text-white">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/wishlist")}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e3dc] text-[#1f5c49] transition hover:border-[#1f5c49]"
              >
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1f5c49] text-[10px] text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push(profileDashboardPath)}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e3dc] text-[#1f5c49] transition hover:border-[#1f5c49]"
                aria-label="Open Profile Dashboard"
              >
                <Bell className="h-4 w-4" />
              </button>

              {isAuthenticated ? (
                <div className="relative z-[240] flex items-center gap-2" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full border border-[#d7e3dc] bg-white px-2.5 py-1 transition hover:border-[#1f5c49]"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={userdisplayname}
                        className="h-7 w-7 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1f5c49] text-[11px] font-bold text-white">
                        {userinitial}
                      </span>
                    )}
                    <span className="max-w-[130px] truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f5c49]">
                      {userdisplayname}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#f1d7d7] bg-[#fff5f5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b42318] transition hover:bg-[#ffe9e9]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t("logout")}
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="fixed right-4 z-[220] w-64 rounded-2xl border border-[#dce8e2] bg-white p-3 shadow-xl md:right-8"
                        style={{ top: navHeight + 8 }}
                      >
                        <div className="rounded-xl bg-[#f1f8f4] p-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[#5f7f72]">{t("signedInAs")}</p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#1f5c49]">{userdisplayname}</p>
                          <p className="truncate text-xs text-[#527066]">{user?.email || ""}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push(profileDashboardPath);
                          }}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-white px-3 py-2.5 text-sm font-semibold text-[#1f5c49] transition hover:border-[#1f5c49]"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Profile Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/wishlist");
                          }}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-[#f7fbf9] px-3 py-2.5 text-sm font-semibold text-[#1f5c49] transition hover:border-[#1f5c49]"
                        >
                          <Heart className="h-4 w-4" />
                          {t("myWishlist")}
                        </button>
                        {isSuperAdminRole ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              router.push("/SuperAdmin");
                            }}
                            className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#cfe0d7] bg-[#f3faf6] px-3 py-2.5 text-sm font-semibold text-[#1f5c49] transition hover:border-[#1f5c49]"
                          >
                            Go to SuperAdmin Dashboard
                          </button>
                        ) : null}
                        {isSellerRole ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              router.push("/seller-dashboard");
                            }}
                            className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#cfe0d7] bg-[#f3faf6] px-3 py-2.5 text-sm font-semibold text-[#1f5c49] transition hover:border-[#1f5c49]"
                          >
                            Seller Dashboard
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              router.push("/become-seller");
                            }}
                            className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#cfe0d7] bg-[#f3faf6] px-3 py-2.5 text-sm font-semibold text-[#1f5c49] transition hover:border-[#1f5c49]"
                          >
                            Become Seller
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f1d7d7] bg-[#fff5f5] px-3 py-2.5 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe9e9]"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("logout")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/signin"
                    className="rounded-full border border-[#d7e3dc] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] transition hover:bg-[#edf6f1]"
                  >
                    {t("signIn")}
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-[#1f5c49] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#174737]"
                  >
                    {t("joinNow")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <div className="relative z-[120] mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:px-6 lg:py-0">
          <div className="flex items-center gap-2 lg:w-[170px] lg:shrink-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-900" />
            </button>

            <Link href="/" className="relative z-50 flex shrink-0 items-center gap-3 group">
              <div className="relative overflow-hidden w-32 md:w-40 lg:w-36">
                <img
                  src={logoUrl}
                  alt="Glow Haat"
                  className="object-contain w-full h-auto"
                  loading="eager"
                />
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex min-w-0 flex-1 px-4">
            <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="inline-flex min-w-max items-center gap-1 xl:gap-2 pr-4">
                {data.map((item) => (
                  <DesktopMenuItem
                    key={item._id}
                    item={item}
                    onHoverStart={openDesktopMegaMenu}
                    onHoverEnd={closeDesktopMegaMenu}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Right Actions */}
          <div className="flex shrink-0 items-center gap-3 text-gray-900 lg:hidden">
            <button
              type="button"
              onClick={() => router.push(profileDashboardPath)}
              className="relative cursor-pointer group"
              aria-label="Open Profile Dashboard"
            >
              <Bell className="w-5 h-5 group-hover:text-[#1f5c49] transition-colors" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/wishlist")}
              className="relative cursor-pointer group"
            >
              <Heart className="w-5 h-5 group-hover:text-[#1f5c49] transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1f5c49] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="relative cursor-pointer group"
            >
              <ShoppingBag className="w-5 h-5 group-hover:text-[#1f5c49] transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1f5c49] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub Nav */}
        <div className="border-t border-[#edf2ef] bg-white/95">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-2 md:px-6">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-3">
              {discoveryQuickLinks.map((entry) => (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4e7df] bg-[#f5fbf8] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f5c49] transition hover:-translate-y-0.5 hover:border-[#1f5c49] hover:bg-[#e8f5ef]"
                >
                  <entry.Icon className="h-4 w-4 text-[#1f5c49]" />
                  <span className="truncate">{entry.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {activeDesktopItem?.children?.length > 0 && (
          <DesktopMegaMenu
            key={activeDesktopItem?._id}
            item={activeDesktopItem}
            navHeight={navHeight}
            onMouseEnter={clearDesktopCloseTimer}
            onMouseLeave={closeDesktopMegaMenu}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Desktop Searchbar Panel */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-[95] hidden md:block"
            style={{ top: navHeight }}
          >
            <div className="mx-auto w-full max-w-none px-4 md:px-8">
              <div className="rounded-2xl border border-[#dce8e2] bg-white/95 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-[#1f5c49]" />
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-transparent text-lg text-[#1f5c49] placeholder:text-[#6d8d80] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f5c49]"
                  >
                    {t("close")}
                  </button>
                </div>
                <div className="mt-3 h-px bg-[#1f5c49]" />
                <div className="mt-4 max-h-72 overflow-y-auto">
                  {isSearching && (
                    <p className="text-xs text-[#6d8d80]">{t("searching")}</p>
                  )}
                  {!isSearching && searchResults.length === 0 && searchTerm && (
                    <p className="text-xs text-[#6d8d80]">{t("noResults")}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((item) => {
                      const image =
                        item?.variants?.[0]?.images?.[0] ||
                        item?.whiteimage ||
                        item?.hoverimage ||
                        "";
                      const price =
                        item?.variants?.[0]?.options?.[0]?.currentprice || 0;
                      return (
                        <button
                          key={item._id}
                          onClick={() => {
                            setSearchOpen(false);
                            router.push(`/product/${item.slug}`);
                          }}
                          className="w-full flex items-center gap-3 rounded-xl border border-[#e6f1ec] bg-white p-3 hover:bg-[#f5fbf8] text-left"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg object-cover border border-[#e3eee8]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-lg bg-[#eaf5ef]" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#1f5c49]">{item.name}</p>
                            <p className="text-xs text-[#6d8d80]">{item.brand || t("brandFallback")}</p>
                            <p className="text-xs text-[#1f5c49] mt-1">à§³{Number(price).toLocaleString()}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer System */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileMenu
            data={data}
            onClose={() => setMobileOpen(false)}
            isAuthenticated={isAuthenticated}
            user={user}
            avatarUrl={avatarUrl}
            wishlistCount={wishlistCount}
            onLogout={handleLogout}
            isSellerRole={isSellerRole}
            isSuperAdminRole={isSuperAdminRole}
            profileDashboardPath={profileDashboardPath}
            locale={locale}
            onLocaleChange={switchLocale}
            t={t}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// --- Desktop Mega Menu Logic ---

const DesktopMenuItem = ({ item, onHoverStart, onHoverEnd }) => {
  return (
    <div
      onMouseEnter={() => onHoverStart(item)}
      onMouseLeave={onHoverEnd}
      className="relative h-full shrink-0 flex items-center justify-center"
    >
      <Link 
        href={`${item.link || "/"}`}
        className="text-sm font-medium tracking-wide uppercase hover:text-[#1f5c49] transition-colors py-4 px-2 whitespace-nowrap"
      >
        {item.name}
      </Link>
    </div>
  );
};

const DesktopMegaMenu = ({ item, navHeight, onMouseEnter, onMouseLeave, t }) => {
  const defaultSubCategory = item.children && item.children.length > 0 ? item.children[0] : item;
  const [activeSubCategory, setActiveSubCategory] = useState(defaultSubCategory);
  const router = useRouter();
  const currentSubCategory = activeSubCategory || defaultSubCategory;
  const featuredCandidates =
    currentSubCategory?.children && currentSubCategory.children.length > 0
      ? currentSubCategory.children
      : item.children || [];

  return (
    <motion.div
      variants={megaMenuVar}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 z-[96] hidden lg:block"
      style={{ top: navHeight }}
    >
      <div className="border-t border-[#e9eeeb] bg-white shadow-2xl">
        <div className="mx-auto flex h-[500px] w-full max-w-none px-6 xl:px-8">
          {/* Left: Recursive List */}
          <div className="w-[320px] shrink-0 border-r border-gray-200 bg-[#f7f8f7] p-6 overflow-y-auto custom-scrollbar">
            <ul className="space-y-2">
              {item.children.map((child) => {
                const childPreviewUrl = getNodeThumb(child);
                const isActive = currentSubCategory?._id === child._id;
                return (
                  <li key={child._id} onMouseEnter={() => setActiveSubCategory(child)} className="group">
                    <Link
                      href={`${child.link || "/"}`}
                      className={`flex items-center justify-between rounded-lg p-3 transition-all ${
                        isActive ? "bg-white shadow-sm" : "hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {childPreviewUrl ? (
                          <img
                            src={childPreviewUrl}
                            alt={child?.name || "Category"}
                            className="h-9 w-9 rounded-md object-cover border border-gray-200"
                            loading="lazy"
                          />
                        ) : null}
                        <span
                          className={`truncate text-sm tracking-wide transition-all ${
                            isActive ? "font-semibold text-[#111827]" : "text-[#4b5563]"
                          }`}
                        >
                          {child.name}
                        </span>
                      </div>
                      {child.children?.length > 0 && (
                        <ChevronRight className={`h-4 w-4 ${isActive ? "text-[#111827]" : "text-gray-300 group-hover:text-[#111827]"}`} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: Dynamic Image Grid */}
          <div className="flex-1 bg-white p-8">
            <div className="h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-[44px] leading-none font-light text-gray-900">{currentSubCategory?.name}</h3>
                <Link
                  href={`${currentSubCategory?.link || "/"}`}
                  className="mt-3 inline-block border-b border-[#1f5c49] pb-1 text-xs font-bold uppercase tracking-widest text-[#1f5c49]"
                >
                  {t("viewCollection")}
                </Link>
              </div>

              <div className="grid grid-cols-[220px_1fr_240px] gap-6 h-full">
                {/* Subcategory Links */}
                <div className="border-r border-gray-100 pr-4">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-gray-400">{t("explore")}</p>
                  <ul className="space-y-2">
                    {(currentSubCategory?.children || []).map((sub) => {
                      const previewUrl = getNodeThumb(sub);
                      return (
                        <li key={sub._id}>
                          <Link
                            href={`${sub.link || "/"}`}
                            className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#1f5c49] transition-colors"
                          >
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={sub?.name || "Category"}
                                className="h-8 w-8 rounded-md object-cover border border-gray-200"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-[#eaf5ef]" />
                            )}
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                    {(currentSubCategory?.children || []).length === 0 && (
                      <li className="text-sm italic text-gray-300">{t("noSubcategories")}</li>
                    )}
                  </ul>
                </div>

                {/* Image Grid for each subcategory */}
                <div className="grid h-full grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar xl:grid-cols-3">
                  {(currentSubCategory?.children || []).map((sub) => {
                    const previewUrl = getNodeThumb(sub);
                    return (
                      <motion.div
                        key={sub._id}
                        layoutId={`img-${sub._id}`}
                        className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-white group"
                        onClick={() => {
                          if (sub?.link) router.push(sub.link);
                        }}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={sub?.name || "Category"}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#eaf5ef]" />
                        )}
                        <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/0" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-sm font-semibold text-white drop-shadow">{sub.name}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {(currentSubCategory?.children || []).length === 0 && (
                    <div className="col-span-3 flex items-center justify-center italic text-gray-300">
                      {t("noPreviewImages", {name: currentSubCategory?.name || ""})}
                    </div>
                  )}
                </div>

                {/* Featured Tiles */}
                <div className="hidden xl:flex flex-col gap-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">{t("signature")}</p>
                  {featuredCandidates.slice(0, 3).map((sub) => {
                    const previewUrl = getNodeThumb(sub);
                    return (
                      <Link
                        key={sub._id}
                        href={`${sub.link || "/"}`}
                        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white"
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={sub?.name || t("featuredAlt")}
                            className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-28 w-full bg-[#eaf5ef]" />
                        )}
                        <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-sm font-semibold text-white drop-shadow">{sub.name}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Mobile Infinite Drawer (The "App" Feel) ---

const MobileMenu = ({
  data,
  onClose,
  isAuthenticated,
  user,
  avatarUrl,
  wishlistCount,
  onLogout,
  isSellerRole,
  isSuperAdminRole,
  profileDashboardPath,
  locale,
  onLocaleChange,
  t,
}) => {
  // We use a stack to manage depth. 
  // Stack[0] is root. Stack[1] is a child category, etc.
  const [navStack, setNavStack] = useState([{ name: t("menu"), data: data, type: "root" }]);
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
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileResults, setMobileResults] = useState([]);
  const [mobileSearching, setMobileSearching] = useState(false);
  const mobileTimer = useRef(null);
  const router = useRouter();

  const handleMobileSearch = (value) => {
    setMobileSearch(value);
    if (mobileTimer.current) clearTimeout(mobileTimer.current);
    if (!value.trim()) {
      setMobileResults([]);
      return;
    }
    mobileTimer.current = setTimeout(async () => {
      try {
        setMobileSearching(true);
        const res = await axios.get(`${serverurl}/item/search?q=${encodeURIComponent(value)}`);
        if (res?.data?.success) {
          setMobileResults(res.data.items || []);
        }
      } catch (error) {
        setMobileResults([]);
      } finally {
        setMobileSearching(false);
      }
    }, 300);
  };

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
                        <ArrowLeft className="w-4 h-4" /> {t("back")}
                    </button>
                ) : (
                    <span className="text-lg font-bold tracking-tight">{t("menu")}</span>
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
                        <div className="mt-4 px-2">
                          <div className="flex items-center gap-2 rounded-full border border-[#d7e3dc] bg-[#f4faf7] px-3 py-2">
                            <Search className="w-4 h-4 text-[#1f5c49]" />
                            <input
                              value={mobileSearch}
                              onChange={(e) => handleMobileSearch(e.target.value)}
                              placeholder={t("searchPlaceholder")}
                              className="w-full bg-transparent text-sm text-[#1f5c49] placeholder:text-[#6d8d80] focus:outline-none"
                            />
                          </div>
                          {mobileSearch && (
                            <div className="mt-3 space-y-2">
                              {mobileSearching && (
                                <p className="text-xs text-[#6d8d80]">{t("searching")}</p>
                              )}
                              {!mobileSearching && mobileResults.length === 0 && (
                                <p className="text-xs text-[#6d8d80]">{t("noResults")}</p>
                              )}
                              {mobileResults.map((item) => {
                                const image =
                                  item?.variants?.[0]?.images?.[0] ||
                                  item?.whiteimage ||
                                  item?.hoverimage ||
                                  "";
                                return (
                                  <button
                                    key={item._id}
                                    onClick={() => {
                                      onClose();
                                      router.push(`/product/${item.slug}`);
                                    }}
                                    className="w-full flex items-center gap-3 rounded-xl border border-[#e6f1ec] bg-white p-2 text-left"
                                  >
                                    {image ? (
                                      <img
                                        src={image}
                                        alt={item.name}
                                        className="h-10 w-10 rounded-lg object-cover border border-[#e3eee8]"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-[#eaf5ef]" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-[#1f5c49]">{item.name}</p>
                                      <p className="text-xs text-[#6d8d80]">{item.brand || t("brandFallback")}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {navStack.length === 1 && (
                          <div className="mt-4 grid grid-cols-1 gap-2 px-2">
                            {discoveryQuickLinks.map((entry) => (
                              <Link
                                key={entry.id}
                                href={entry.href}
                                onClick={onClose}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#d8e8e1] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49]"
                              >
                                <entry.Icon className="h-4 w-4" />
                                <span>{entry.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                        <h2 className="text-2xl font-light mb-6 mt-6 px-2">
                          {navStack.length === 1 ? t("menu") : currentLevel.name}
                        </h2>
                        <ul className="space-y-1">
                            {currentLevel.data.map((item) => {
                                const hasChildren = item.children && item.children.length > 0;
                                const previewUrl = getNodeThumb(item);
                                return (
                                    <li key={item._id}>
                                        <div 
                                            className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-gray-100 mb-2 active:scale-[0.98] transition-transform"
                                        >
                                            <Link 
                                                href={`${item.link || "/"}`}
                                                onClick={() => { if(!hasChildren) onClose(); }}
                                                className="flex-1 text-base font-medium text-gray-800 flex items-center gap-3"
                                            >
                                                {previewUrl ? (
                                                  <img
                                                    src={previewUrl}
                                                    alt={item?.name || "Category"}
                                                    className="h-10 w-10 rounded-lg object-cover border border-[#e3eee8]"
                                                    loading="lazy"
                                                  />
                                                ) : (
                                                  <div className="h-10 w-10 rounded-lg bg-[#eaf5ef]" />
                                                )}
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
                                                    className="p-2 -mr-2 text-gray-400 hover:text-[#1f5c49]"
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
                 <div className="mb-3 flex items-center justify-center gap-3 rounded-lg border border-[#dce8e2] bg-[#f7fbf9] py-2 text-xs font-semibold">
                   <button
                     type="button"
                     onClick={() => onLocaleChange("en")}
                     className={locale === "en" ? "text-[#1f5c49]" : "text-[#4f665d]"}
                   >
                     {t("language.english")}
                   </button>
                   <span className="text-[#9db2a8]">|</span>
                   <button
                     type="button"
                     onClick={() => onLocaleChange("bn")}
                     className={locale === "bn" ? "text-[#1f5c49]" : "text-[#4f665d]"}
                   >
                     {t("language.bangla")}
                   </button>
                 </div>
                 {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-[#d9e6df] bg-[#f4faf7] px-3 py-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={user?.fullname || t("userAvatarAlt")}
                          className="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f5c49] text-xs font-bold text-white">
                          {(user?.fullname?.[0] || "U").toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-[#648578]">{t("loggedIn")}</p>
                        <p className="truncate text-sm font-semibold text-[#1f5c49]">
                          {user?.fullname || t("defaultUserName")}
                        </p>
                        <p className="truncate text-xs text-[#648578]">{user?.email || ""}</p>
                      </div>
                    </div>
                    <Link
                      href={profileDashboardPath}
                      onClick={onClose}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#dce8e2] bg-[#f7fbf9] py-3 text-sm font-semibold tracking-wide text-[#1f5c49]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Profile Dashboard
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={onClose}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#dce8e2] bg-[#f7fbf9] py-3 text-sm font-semibold tracking-wide text-[#1f5c49]"
                    >
                      <Heart className="h-4 w-4" />
                      {t("wishlistWithCount", {count: wishlistCount || 0})}
                    </Link>
                    {isSuperAdminRole ? (
                      <Link
                        href="/SuperAdmin"
                        onClick={onClose}
                        className="flex w-full items-center justify-center rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-sm font-semibold tracking-wide text-[#1f5c49]"
                      >
                        Go to SuperAdmin Dashboard
                      </Link>
                    ) : null}
                    {isSellerRole ? (
                      <Link
                        href="/seller-dashboard"
                        onClick={onClose}
                        className="flex w-full items-center justify-center rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-sm font-semibold tracking-wide text-[#1f5c49]"
                      >
                        Seller Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/become-seller"
                        onClick={onClose}
                        className="flex w-full items-center justify-center rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-sm font-semibold tracking-wide text-[#1f5c49]"
                      >
                        Become Seller
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#f1d7d7] bg-[#fff5f5] py-3 text-sm font-semibold tracking-wide text-[#b42318]"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </button>
                  </>
                 ) : (
                  <>
                  <Link
                      href={profileDashboardPath}
                      onClick={onClose}
                      className="block w-full rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-center text-sm font-semibold tracking-wide text-[#1f5c49]"
                    >
                      Profile Dashboard
                    </Link>
                    {!isSellerRole ? (
                      <Link
                        href="/become-seller"
                        onClick={onClose}
                        className="block w-full rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-center text-sm font-semibold tracking-wide text-[#1f5c49]"
                      >
                        Become Seller
                      </Link>
                    ) : null}
                    <Link
                      href="/signin"
                      onClick={onClose}
                      className="block w-full rounded-lg border border-[#cfe0d7] bg-[#f3faf6] py-3 text-center text-sm font-semibold tracking-wide text-[#1f5c49]"
                    >
                      {t("signIn")}
                    </Link>
                    <Link
                      href="/signup"
                      onClick={onClose}
                      className="block w-full rounded-lg bg-[#1f5c49] py-3 text-center text-sm font-semibold tracking-wide text-white"
                    >
                      {t("createAccount")}
                    </Link>
                  </>
                 )}
            </div>
        </motion.div>
    </>
  );
};

export default UserNav;


