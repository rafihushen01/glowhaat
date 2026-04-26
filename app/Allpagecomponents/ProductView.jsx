"use client"
import { useRef } from 'react'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import {useTranslations} from "next-intl";
import { 
  ChevronRight, Minus, Plus, ShoppingBag,
  Maximize2, X, PlayCircle, ZoomIn, ZoomOut, Share2, MessageCircle, Instagram, Facebook, Copy, Heart, Home, Star
} from 'lucide-react'
// Import the advanced zoom library
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { serverurl } from '../utils/constants/serverurl'
import { addToCart } from '../reduxcomponents/CartSlice'
import ProductReviewQnaPanel from './ProductReviewQnaPanel'
import ProductDetailRecommendations from "./ProductDetailRecommendations";
import SellerChatDrawer from "./SellerChatDrawer";
import { getRequestConfig } from "../utils/requestConfig";
import { trackRecommendationEvent } from '../utils/recommendation'


const ProductView = () => {
  const t = useTranslations("ProductView");
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share");
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Data State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection State
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const scrollRef = useRef(null);
  const ITEM_HEIGHT = 60;
  
  // UI State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isAdding, setIsAdding] = useState(false);
  const [cartStatus, setCartStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [sharingPlatform, setSharingPlatform] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistStatus, setWishlistStatus] = useState("");
  const [canUseLens, setCanUseLens] = useState(false);
  const [lens, setLens] = useState({ active: false, x: 0, y: 0, px: 50, py: 50 });
  const viewStartedAtRef = useRef(0);
 const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      // Calculate which index is currently centered
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      // Ensure we stay within 1-140 range (index 0 to 139)
      const newQuantity = Math.max(1, Math.min(140, index + 1));
      
      // Only update state if it changed to avoid re-renders
      if (newQuantity !== quantity) {
        setQuantity(newQuantity);
      }
    }
  };
    // 3. Handle Buttons (Programmatic spin)
  const scrollToIndex = (newIndex) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: newIndex * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }
  };
    const handleIncrement = () => {
    if (quantity < 140) scrollToIndex(quantity); // Scroll to next index (current quantity is next index)
  };

  const handleDecrement = () => {
    if (quantity > 1) scrollToIndex(quantity - 2); // Scroll to prev index
  };

  // Fetch Data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        const res = await axios.get(`${serverurl}/item/getitembyslug/${slug}`);
        if (res.data.success) {
          const item = res.data.item;
          setProduct(item);
          if (item.variants && item.variants.length > 0) {
            setMainImage(item.variants[0].images[0] || item.whiteimage);
          } else {
            setMainImage(item.whiteimage);
          }
        } else {
          setError(t("errors.productNotFound"));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, t]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanUseLens(Boolean(media.matches));
    sync();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (!shareToken) return;

    const marker = `khc-share-opened-${shareToken}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(marker)) return;

    const registerOpen = async () => {
      try {
        let visitKey = "";

        if (typeof window !== "undefined") {
          visitKey = window.localStorage.getItem("khc-share-visit-key") || "";
          if (!visitKey) {
            visitKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
            window.localStorage.setItem("khc-share-visit-key", visitKey);
          }
        }

        await axios.post(
          `${serverurl}/item/share/open/${shareToken}`,
          { visitkey: visitKey },
          { withCredentials: true, timeout: 12000 }
        );

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(marker, "1");
        }
      } catch (_error) {
        // silent analytics failure
      }
    };

    registerOpen();
  }, [shareToken]);

  useEffect(() => {
    if (!slug) return;

    const fetchWishlistStatus = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/wishlist/status/${slug}`, {
          ...getRequestConfig(),
        });
        if (data?.success) {
          setIsWishlisted(Boolean(data.iswishlisted));
        }
      } catch (_error) {
        setIsWishlisted(false);
      }
    };

    fetchWishlistStatus();
  }, [slug]);

  useEffect(() => {
    if (!product?.slug) return;

    viewStartedAtRef.current = Date.now();
    trackRecommendationEvent({
      eventtype: "product_view",
      slug: product.slug,
    });

    return () => {
      const started = Number(viewStartedAtRef.current || 0);
      if (!started) return;
      const seconds = Math.floor((Date.now() - started) / 1000);
      if (seconds <= 0) return;

      trackRecommendationEvent({
        eventtype: "dwell",
        slug: product.slug,
        dwellseconds: seconds,
      });
    };
  }, [product?._id, product?.slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-emerald-800 animate-pulse">{t("loading")}</div>;
  if (error || !product) return <div className="min-h-screen flex items-center justify-center text-red-500">{t("errorPrefix")}: {error || t("errors.itemNotFound")}</div>;

  // Helpers
  const currentVariant = product.variants[selectedVariantIndex];
  const currentOption = currentVariant?.options[selectedOptionIndex];
  const currentPrice = currentOption?.currentprice || 0;
  const originalPrice = currentOption?.baseprice || 0;
  const discount = currentOption?.discountpercentage || 0;
  const isVideoAvailable = product.gallery && product.gallery.length > 0;
  const shopProfile = product?.shopid && typeof product.shopid === "object" ? product.shopid : null;
  const sellerProfile = product?.sellerprofile && typeof product.sellerprofile === "object" ? product.sellerprofile : null;
  const categoryTrail = Array.isArray(product?.categorytree) && product.categorytree.length
    ? product.categorytree.filter(Boolean)
    : String(product?.categorypath || "")
        .split(/\s*>\s*/)
        .map((node) => node.trim())
        .filter(Boolean);
  const positiveSellerRating = Math.max(80, Math.min(99, Math.round((Number(product?.star || 4.2) / 5) * 100)));

  const formatText = (text) => {
    if (!text) return "";
    return text.split('\r\n').map((str, index) => <p key={index} className="mb-2">{str}</p>);
  };

  const toCategoryPath = (value = "") =>
    `/s/${String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}`;

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      setCartStatus("");

      const { data } = await axios.post(
        `${serverurl}/cart/add`,
        {
          slug: product.slug,
          variantindex: selectedVariantIndex,
          optionindex: selectedOptionIndex,
          quantity,
        },
        getRequestConfig()
      );

      if (!data?.success || !data?.item) {
        setCartStatus(data?.message || t("errors.addToCart"));
        return;
      }

      dispatch(addToCart(data.item));
      setCartStatus(t("success.addedToCart"));
      trackRecommendationEvent({
        eventtype: "add_to_cart",
        slug: product.slug,
        quantity,
      });
    } catch (err) {
      setCartStatus(
        err?.response?.data?.message ||
          t("errors.addToCart")
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product?.slug || wishlistLoading) return;

    try {
      setWishlistLoading(true);
      setWishlistStatus("");
      const { data } = await axios.post(
        `${serverurl}/wishlist/toggle`,
        { slug: product.slug },
        getRequestConfig()
      );

      if (!data?.success) {
        setWishlistStatus(data?.message || t("errors.wishlistUpdate"));
        return;
      }

      setIsWishlisted(Boolean(data.iswishlisted));
      setWishlistStatus(data?.message || t("success.wishlistUpdated"));
      trackRecommendationEvent({
        eventtype: data?.iswishlisted ? "wishlist_add" : "wishlist_remove",
        slug: product.slug,
      });
    } catch (err) {
      setWishlistStatus(
        err?.response?.data?.message ||
          t("errors.wishlistUpdate")
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  const copyToClipboard = async (value) => {
    if (!value) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (_error) {
      // fallback below
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return Boolean(copied);
    } catch (_error) {
      return false;
    }
  };

  const createTrackedShareLink = async (platform) => {
    const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const fallback = `${fallbackOrigin}/product/${product.slug}`;

    try {
      const { data } = await axios.post(
        `${serverurl}/item/share/${product.slug}`,
        { platform },
        { withCredentials: true, timeout: 12000 }
      );
      return data?.share?.shareurl || fallback;
    } catch (_error) {
      return fallback;
    }
  };

  const handleShare = async (platform) => {
    try {
      setSharingPlatform(platform);
      setShareStatus("");

      const shareUrl = await createTrackedShareLink(platform);
      const shareText = t("share.shareText", {name: product.name});
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedText = encodeURIComponent(`${shareText} ${shareUrl}`);

      if (platform === "whatsapp") {
        window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
        setShareStatus(t("share.sharedWhatsapp"));
        return;
      }

      if (platform === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank", "noopener,noreferrer");
        setShareStatus(t("share.sharedFacebook"));
        return;
      }

      if (platform === "messenger") {
        const copied = await copyToClipboard(shareUrl);
        window.open(`fb-messenger://share/?link=${encodedUrl}`, "_blank", "noopener,noreferrer");
        setShareStatus(copied ? t("share.copiedMessenger") : t("share.openedMessenger"));
        return;
      }

      if (platform === "instagram") {
        const copied = await copyToClipboard(shareUrl);
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        setShareStatus(copied ? t("share.copiedInstagram") : t("share.openedInstagram"));
        return;
      }

      const copied = await copyToClipboard(shareUrl);
      setShareStatus(copied ? t("share.linkCopied") : t("share.copyFailed"));
    } catch (_error) {
      setShareStatus(t("share.shareFailed"));
    } finally {
      setSharingPlatform("");
    }
  };

  const lensSize = 180;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const handleLensMove = (event) => {
    if (!canUseLens || !mainImage) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    const px = rect.width > 0 ? (x / rect.width) * 100 : 50;
    const py = rect.height > 0 ? (y / rect.height) * 100 : 50;
    setLens({ active: true, x, y, px, py });
  };
  const handleLensLeave = () => setLens((prev) => ({ ...prev, active: false }));

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-emerald-100">
      
      {/* Navbar / Breadcrumbs */}
      <nav className="w-full max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2">
          <button type="button" className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900" onClick={() => router.push('/')}>
            <Home size={14} /> {t("breadcrumbs.home")}
          </button>
          <ChevronRight size={14} />
          {categoryTrail.length > 0 ? (
            categoryTrail.map((entry, idx) => (
              <React.Fragment key={`${entry}-${idx}`}>
                <button
                  type="button"
                  onClick={() => router.push(toCategoryPath(entry))}
                  className={`${idx === categoryTrail.length - 1 ? "font-semibold text-gray-900 hover:text-emerald-900" : "text-emerald-700 hover:text-emerald-900"} transition-colors`}
                >
                  {entry}
                </button>
                {idx < categoryTrail.length - 1 ? <ChevronRight size={14} /> : null}
              </React.Fragment>
            ))
          ) : (
            <>
              <button type="button" className="cursor-pointer hover:text-emerald-600" onClick={() => router.push('/products')}>{t("breadcrumbs.products")}</button>
              <ChevronRight size={14} />
              <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </>
          )}
        </div>
      </nav>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* LEFT: IMAGES */}
        <div className="space-y-6">
          <div className="flex flex-col-reverse md:flex-row gap-4 h-auto md:h-[600px]">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 scrollbar-hide">
              {currentVariant?.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`relative w-20 h-24 md:w-full md:h-28 flex-shrink-0 border transition-all duration-300 ${mainImage === img ? 'border-emerald-700 ring-1 ring-emerald-700' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
              {isVideoAvailable && (
                 <button className="relative w-20 h-24 md:w-full md:h-28 flex-shrink-0 border border-gray-200 bg-gray-50 flex items-center justify-center group">
                   <PlayCircle className="text-gray-400 group-hover:text-emerald-600" />
                 </button>
              )}
            </div>

            {/* Main View Trigger */}
            <div 
              className="relative flex-1 bg-gray-50 group cursor-zoom-in h-[500px] md:h-full overflow-hidden border border-gray-100"
              onMouseEnter={handleLensMove}
              onMouseMove={handleLensMove}
              onMouseLeave={handleLensLeave}
              onClick={() => setIsZoomOpen(true)}
            >
              <img 
                src={mainImage} 
                alt={product.name} 
                className="w-full h-full object-cover object-top"
              />
              {canUseLens && lens.active ? (
                <div
                  className="pointer-events-none absolute z-20 hidden rounded-full border-2 border-white shadow-[0_12px_40px_rgba(0,0,0,0.32)] md:block"
                  style={{
                    width: `${lensSize}px`,
                    height: `${lensSize}px`,
                    left: `${clamp(lens.x - lensSize / 2, 0, 9999)}px`,
                    top: `${clamp(lens.y - lensSize / 2, 0, 9999)}px`,
                    backgroundImage: `url(${mainImage})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "240%",
                    backgroundPosition: `${lens.px}% ${lens.py}%`,
                  }}
                />
              ) : null}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              
              {/* Click Instruction */}
             {/* Zoom Prompt Icon - NEW SUBTLE VERSION */}
<div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/75 backdrop-blur-[2px] px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-center gap-1.5 pointer-events-none transform translate-y-4 group-hover:translate-y-0">
  <Maximize2 size={12} className="text-emerald-800" />
  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-800 leading-none mt-[1px]">
    {t("tapToZoom")}
  </span>
</div>

              {/* Tags */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                 {discount > 0 && <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase">-{discount}% {t("sale")}</span>}
                 {product.flashsale && <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 uppercase ">{t("flashSale")}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="flex flex-col pt-2">
          <div className="mb-6 border-b border-gray-100 pb-6">
            <h2 className="text-emerald-700 text-sm font-bold tracking-widest uppercase mb-2">{t("exclusive")}</h2>
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4 leading-tight">{product.name}</h1>
            <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">
              {Number(product?.star || 0).toFixed(2)} {t("stars")} | {Number(product?.reviewcount || 0)} {t("verifiedReviews")}
            </p>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-3xl font-medium text-gray-900">৳{currentPrice.toLocaleString()}</span>
              {originalPrice > currentPrice && <span className="text-lg text-gray-400 line-through">৳{originalPrice.toLocaleString()}</span>}
            </div>
            {shopProfile?.slug ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Sold By</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-950">{shopProfile.shopname || "Shop"}</p>
                    <div className="mt-3 flex items-center gap-2 text-emerald-700">
                      <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
                      <span className="text-sm font-semibold">Positive Seller Ratings {positiveSellerRating}%</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/shop/${shopProfile.slug}`)}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 hover:bg-emerald-100"
                      >
                        View Seller Profile
                      </button>
                      <SellerChatDrawer
                        shop={shopProfile}
                        product={{ _id: product?._id, name: product?.name, slug: product?.slug }}
                        buttonClassName="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 hover:bg-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">Seller Showcase</p>
                    <p className="mt-2 text-sm text-emerald-900">
                      Main Store Type: <span className="font-semibold">{sellerProfile?.storetype || "General Beauty Store"}</span>
                    </p>
                    <p className="mt-2 text-sm text-emerald-900">
                      Preferred Category:{" "}
                      <span className="font-semibold">
                        {Array.isArray(sellerProfile?.preferredcategories) && sellerProfile.preferredcategories.length
                          ? sellerProfile.preferredcategories.join(", ")
                          : categoryTrail[categoryTrail.length - 1] || "Beauty Essentials"}
                      </span>
                    </p>
                    {sellerProfile?.businessmodel ? (
                      <p className="mt-2 text-sm text-emerald-900">
                        Business Model: <span className="font-semibold">{sellerProfile.businessmodel}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Share2 size={16} />
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em]">{t("share.title")}</h3>
            </div>
            <p className="mt-1 text-xs text-emerald-700/80">{t("share.subtitle")}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
              {[
                { key: "whatsapp", label: t("share.whatsapp"), className: "border-[#b7e9ce] text-[#1a7f4c] hover:bg-[#ebfff4]", icon: <MessageCircle size={14} /> },
                { key: "facebook", label: t("share.facebook"), className: "border-[#c7d6ff] text-[#1c4fba] hover:bg-[#eef3ff]", icon: <Facebook size={14} /> },
                { key: "messenger", label: t("share.messenger"), className: "border-[#d4d8ff] text-[#3f51d1] hover:bg-[#f1f3ff]", icon: <MessageCircle size={14} /> },
                { key: "instagram", label: t("share.instagram"), className: "border-[#ffd1da] text-[#be185d] hover:bg-[#fff0f5]", icon: <Instagram size={14} /> },
                { key: "browser", label: t("share.copyLink"), className: "border-[#d9e4dd] text-[#265445] hover:bg-[#f2f8f4]", icon: <Copy size={14} /> },
              ].map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => handleShare(entry.key)}
                  disabled={Boolean(sharingPlatform)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${entry.className} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {entry.icon}
                  <span>{sharingPlatform === entry.key ? t("share.sharing") : entry.label}</span>
                </button>
              ))}
            </div>

            {shareStatus ? (
              <p className="mt-3 text-xs font-medium text-emerald-700">{shareStatus}</p>
            ) : null}
          </div>

          {/* Color Selection */}
          <div className="mb-6">
             <span className="block text-sm font-medium text-gray-900 mb-3">{t("color")}: <span className="text-gray-500 font-normal">{currentVariant?.name}</span></span>
             <div className="flex flex-wrap gap-3">
               {product.variants.map((variant, idx) => (
                 <button
                   key={idx}
                   onClick={() => {
                     setSelectedVariantIndex(idx);
                     setSelectedOptionIndex(0);
                     setMainImage(variant.images[0]);
                   }}
                   className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${selectedVariantIndex === idx ? 'border-emerald-700 p-1' : 'border-transparent'}`}
                 >
                   <img src={variant.images[0]} alt={variant.name} className="w-full h-full rounded-full object-cover border border-gray-200" />
                 </button>
               ))}
             </div>
          </div>

          {/* Size Selection */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="block text-sm font-medium text-gray-900">{t("size")}</span>
              <button className="text-xs text-emerald-600 underline">{t("sizeGuide")}</button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {currentVariant?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOptionIndex(idx)}
                  className={`py-3 text-sm font-medium transition-colors border ${selectedOptionIndex === idx ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-900 border-gray-200 hover:border-emerald-800'}`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
           <div className="flex flex-col md:flex-row gap-4 mb-10 items-center">
      
      {/* 3D SCROLLABLE PICKER (iOS Style) */}
      <div className="relative group">
        <span className="absolute -top-6 left-0 text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t("quantity")}</span>
        
        <div className="flex items-center border border-gray-200 h-[60px] bg-white overflow-hidden shadow-sm hover:border-emerald-700 transition-colors rounded-sm">
          
          {/* THE WHEEL WINDOW */}
          <div className="w-24 h-full relative bg-gray-50 border-r border-gray-100">
            
            {/* Overlay Gradients for 3D Depth Feel */}
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-b from-gray-200/50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-t from-gray-200/50 to-transparent z-10 pointer-events-none"></div>

            {/* Scroll Container */}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{ scrollBehavior: 'smooth' }} // Ensures smooth momentum
            >
              {/* Spacer at top to allow first item to be centered if needed (optional with snap) */}
              
              {Array.from({ length: 140 }, (_, i) => i + 1).map((num) => (
                <div 
                  key={num} 
                  className={`h-[60px] flex items-center justify-center snap-start shrink-0 transition-all duration-200 ${
                    quantity === num 
                      ? "text-2xl font-bold text-emerald-800 scale-110" 
                      : "text-lg text-gray-300 scale-90"
                  }`}
                >
                  {num.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
            
            {/* Center Highlight Line (Optional Visual Guide) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-8 border-y border-emerald-100 rounded pointer-events-none opacity-50"></div>
          </div>

          {/* BUTTON CONTROLS (Manual Override) */}
          <div className="flex flex-col h-full w-10 bg-white">
            <button 
              onClick={handleIncrement}
              className="flex-1 flex items-center justify-center hover:bg-emerald-50 text-gray-400 hover:text-emerald-800 transition-colors border-b border-gray-100 active:bg-emerald-100"
            >
              <Plus size={14} />
            </button>
            <button 
              onClick={handleDecrement}
              className="flex-1 flex items-center justify-center hover:bg-emerald-50 text-gray-400 hover:text-emerald-800 transition-colors active:bg-emerald-100"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD TO CART BUTTON (Unchanged) */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="flex-1 w-full bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-500 disabled:cursor-not-allowed text-white text-sm uppercase tracking-[0.2em] font-bold h-[60px] flex items-center justify-center gap-3 group/btn relative overflow-hidden shadow-xl shadow-emerald-800/10"
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
        <ShoppingBag size={18} className="group-hover/btn:scale-110 transition-transform" />
        <span className="relative z-10">{isAdding ? t("adding") : t("addToCart")}</span>
      </button>

      <button
        type="button"
        onClick={handleToggleWishlist}
        disabled={wishlistLoading}
        className={`w-full md:w-[220px] h-[60px] border text-sm uppercase tracking-[0.16em] font-semibold flex items-center justify-center gap-2 transition ${
          isWishlisted
            ? "border-emerald-700 bg-emerald-50 text-emerald-800"
            : "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-700"
        } disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? "fill-emerald-700 text-emerald-700" : ""}`} />
        {wishlistLoading ? t("saving") : isWishlisted ? t("wishlisted") : t("wishlist")}
      </button>

    </div>
          {cartStatus ? (
            <div className="mb-8">
              <p className={`text-sm ${cartStatus.toLowerCase().includes("added") ? "text-emerald-700" : "text-red-600"}`}>
                {cartStatus}
              </p>
              {cartStatus.toLowerCase().includes("added") ? (
                <button
                  onClick={() => router.push("/cart")}
                  className="mt-2 text-xs uppercase tracking-[0.16em] font-semibold text-emerald-800 underline underline-offset-4"
                >
                  {t("viewCart")}
                </button>
              ) : null}
            </div>
          ) : null}
          {wishlistStatus ? (
            <div className="mb-8">
              <p
                className={`text-sm ${
                  wishlistStatus.toLowerCase().includes("added") ||
                  wishlistStatus.toLowerCase().includes("removed")
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {wishlistStatus}
              </p>
            </div>
          ) : null}

          {/* Info Sections */}
          <div className="border-t border-gray-200">
            {[t("tabs.description"), t("tabs.features"), t("tabs.material")].map((tab) => (
              <div key={tab} className="border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab(activeTab === tab.toLowerCase() ? '' : tab.toLowerCase())} 
                  className="w-full py-4 flex justify-between items-center text-left"
                >
                  <span className="font-serif text-lg text-gray-900">{tab === t("tabs.material") ? t("tabs.materialDetails") : tab}</span>
                  {activeTab === tab.toLowerCase() ? <Minus size={16} /> : <Plus size={16} />}
                </button>
                {activeTab === tab.toLowerCase() && (
                   <div className="pb-6 text-gray-600 leading-relaxed text-sm">
                     {formatText(tab === t("tabs.description") ? product.description : tab === t("tabs.features") ? product.highlight : product.aboutitems)}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <div className="mx-auto w-full max-w-7xl px-4 pb-16">
        <ProductReviewQnaPanel product={product} />
      </div>
      <ProductDetailRecommendations product={product} />

      {/* =========================================================================
          SUPER ADVANCED ZOOM MODAL (HAND ICON + PANNING)
         ========================================================================= */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
          
          {/* Zoom Header Controls */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent">
             <div className="text-white text-sm font-medium drop-shadow-md">
                {t("zoom.pan")}
             </div>
             <button 
                onClick={() => setIsZoomOpen(false)}
                className="bg-white/20 hover:bg-white/40 text-white backdrop-blur-md p-3 rounded-full transition-all"
              >
                <X size={24} />
             </button>
          </div>

          {/* The Magic Zoom Container */}
          <div className="flex-1 w-full h-full flex items-center justify-center bg-gray-50">
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={4} // Allows 400% zoom
              centerOnInit={true}
              wheel={{ step: 0.2 }} // Smooth wheel zoom
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <React.Fragment>
                  
                  {/* Floating Controls for UI */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-2xl border border-gray-200">
                    <button onClick={() => zoomOut()} className="p-2 hover:bg-gray-100 rounded-full text-gray-700" title="Zoom Out">
                      <ZoomOut size={20} />
                    </button>
                    <div className="w-px bg-gray-300 h-6 my-auto"></div>
                    <button onClick={() => resetTransform()} className="p-2 hover:bg-gray-100 rounded-full text-emerald-600 font-bold text-xs uppercase" title={t("zoom.reset")}>
                       {t("zoom.reset")}
                    </button>
                    <div className="w-px bg-gray-300 h-6 my-auto"></div>
                    <button onClick={() => zoomIn()} className="p-2 hover:bg-gray-100 rounded-full text-gray-700" title="Zoom In">
                      <ZoomIn size={20} />
                    </button>
                  </div>

                  {/* The Image Itself */}
                  <TransformComponent 
                    wrapperClass="w-full h-full" 
                    contentClass="w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={mainImage}
                      alt={t("zoom.alt")}
                      // 'cursor-grab' shows the hand. 'active:cursor-grabbing' closes the hand when clicking/dragging
                      className="max-h-screen object-contain cursor-grab active:cursor-grabbing shadow-2xl" 
                    />
                  </TransformComponent>
                  
                </React.Fragment>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProductView

