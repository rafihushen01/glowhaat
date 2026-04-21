"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dices,
  Eye,
  GripVertical,
  Monitor,
  MousePointer2,
  Plus,
  Save,
  Search,
  Smartphone,
  Tablet,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";

const card = "rounded-2xl border border-emerald-200 bg-white p-4";
const input = "mt-1 h-10 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500";
const textarea = "mt-1 min-h-[86px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";

const defaultDraft = {
  seo: { title: "", description: "" },
  desktopbanner: "",
  mobilebanner: "",
  desktopprofileimage: "",
  mobileprofileimage: "",
  modules: [],
  template: "blank",
};

const MAX_SECTIONS_PER_PAGE = 20;

const MODULE_DEFS = {
  single_banner: {
    name: "Single Banner",
    group: "Banner",
    maxProducts: 1,
    supports: { desktopimage: true, mobileimage: true, navproductid: true, hotspots: true, title: true, subtitle: true },
    notes: "Daraz-style hero banner with one primary navigation link.",
  },
  carousel_banner: {
    name: "Carousel Banner",
    group: "Banner",
    maxProducts: 20,
    supports: { images: true, navproductid: true, productids: true, title: true, subtitle: true },
    notes: "Upload 1-100 images; can be paired with selected product links.",
  },
  video_module: {
    name: "Video Module",
    group: "Media",
    maxProducts: 10,
    supports: { videourl: true, title: true, subtitle: true, productids: true },
    notes: "Amazon-inspired brand story video section.",
  },
  countdown_products: {
    name: "Countdown Products",
    group: "Advanced",
    maxProducts: 5,
    supports: { title: true, subtitle: true, productids: true, startat: true, endat: true },
    notes: "Daraz-style countdown deal block with 5 highlighted products.",
  },
  product_slider: {
    name: "Product Slider",
    group: "Product",
    maxProducts: 20,
    supports: { title: true, subtitle: true, productids: true },
    notes: "Horizontal product carousel similar to Amazon featured rows.",
  },
  product_grid_three: {
    name: "Three Column Product Grid",
    group: "Product",
    maxProducts: 30,
    supports: { title: true, subtitle: true, productids: true },
    notes: "Desktop 3-column product showcase with responsive fallback.",
  },
  banner_four: {
    name: "4 Banner Layout",
    group: "Banner",
    maxProducts: 12,
    supports: { images: true, productids: true, title: true, subtitle: true },
    notes: "Compact multi-banner block for campaign highlights.",
  },
  banner_five: {
    name: "5 Banner Layout",
    group: "Banner",
    maxProducts: 15,
    supports: { images: true, productids: true, title: true, subtitle: true },
    notes: "5-card layout inspired by Daraz store section blocks.",
  },
  featured_deals: {
    name: "Featured Deals",
    group: "Amazon Modules",
    maxProducts: 12,
    supports: { title: true, subtitle: true, productids: true },
    notes: "Amazon-style featured deals product set.",
  },
  best_selling_products: {
    name: "Best Selling Products",
    group: "Amazon Modules",
    maxProducts: 20,
    supports: { title: true, subtitle: true, productids: true },
    notes: "Best-seller collection panel.",
  },
  split_selection: {
    name: "Split Selection",
    group: "Amazon Modules",
    maxProducts: 4,
    supports: { desktopimage: true, mobileimage: true, hotspots: true, title: true, subtitle: true, productids: true },
    notes: "Split visual block with shoppable image hotspots.",
  },
  image_hotspot: {
    name: "Image Hotspot",
    group: "Amazon Modules",
    maxProducts: 6,
    supports: { desktopimage: true, mobileimage: true, hotspots: true, title: true, subtitle: true },
    notes: "Place clickable dots over image and map each to a product (up to 6 points).",
  },
  text_block: {
    name: "Text Block",
    group: "Content",
    maxProducts: 0,
    supports: { title: true, subtitle: true, bodycontent: true, linkurl: true },
    notes: "Storytelling content block for brand message.",
  },
  text_tile: {
    name: "Text Tile",
    group: "Amazon Blank Page",
    maxProducts: 0,
    supports: { title: true, subtitle: true, bodycontent: true, linkurl: true },
    notes: "Amazon blank page text tile with optional link.",
  },
  image_tile: {
    name: "Image Tile",
    group: "Amazon Blank Page",
    maxProducts: 1,
    supports: { title: true, subtitle: true, desktopimage: true, mobileimage: true, navproductid: true, linkurl: true },
    notes: "Basic image tile with optional product/page linking.",
  },
  image_with_text_tile: {
    name: "Image With Text Tile",
    group: "Amazon Blank Page",
    maxProducts: 1,
    supports: { title: true, subtitle: true, bodycontent: true, desktopimage: true, mobileimage: true, navproductid: true, linkurl: true },
    notes: "Text-over-image or text-beside-image style content tile.",
  },
  shoppable_image_tile: {
    name: "Shoppable Image Tile",
    group: "Amazon Blank Page",
    maxProducts: 6,
    supports: { title: true, subtitle: true, desktopimage: true, mobileimage: true, hotspots: true },
    notes: "Interactive product points on image (up to 6 products).",
  },
  video_tile: {
    name: "Video Tile",
    group: "Amazon Blank Page",
    maxProducts: 4,
    supports: { title: true, subtitle: true, videourl: true, desktopimage: true, productids: true },
    notes: "Clickable video player tile with cover image.",
  },
  background_video_tile: {
    name: "Background Video Tile",
    group: "Amazon Blank Page",
    maxProducts: 0,
    supports: { title: true, subtitle: true, videourl: true },
    notes: "Auto-play muted background video section.",
  },
  gallery_tile: {
    name: "Gallery Tile",
    group: "Amazon Blank Page",
    maxProducts: 0,
    supports: { title: true, subtitle: true, images: true, linkurl: true },
    notes: "Full-width gallery tile (up to 8 images).",
  },
  product_tile: {
    name: "Product Tile",
    group: "Amazon Blank Page",
    maxProducts: 1,
    supports: { title: true, subtitle: true, bodycontent: true, navproductid: true },
    notes: "Single product spotlight tile with editorial support.",
  },
  product_grid_tile: {
    name: "Product Grid Tile",
    group: "Amazon Blank Page",
    maxProducts: 500,
    supports: { title: true, subtitle: true, productids: true, layout: true },
    notes: "Product grid tile (standard or tall layout).",
  },
  recommended_products_tile: {
    name: "Recommended Products Tile",
    group: "Amazon Blank Page",
    maxProducts: 20,
    supports: { title: true, subtitle: true, productids: true },
    notes: "Personalized recommendation-style tile.",
  },
};

const FALLBACK_CATALOG = [
  { key: "single_banner", max: 100 },
  { key: "carousel_banner", max: 100 },
  { key: "video_module", max: 10 },
  { key: "countdown_products", max: 3 },
  { key: "product_slider", max: 20 },
  { key: "product_grid_three", max: 20 },
  { key: "banner_four", max: 100 },
  { key: "banner_five", max: 100 },
  { key: "featured_deals", max: 1 },
  { key: "best_selling_products", max: 1 },
  { key: "split_selection", max: 20 },
  { key: "image_hotspot", max: 20 },
  { key: "text_block", max: 100 },
  { key: "text_tile", max: 20 },
  { key: "image_tile", max: 20 },
  { key: "image_with_text_tile", max: 20 },
  { key: "shoppable_image_tile", max: 20 },
  { key: "video_tile", max: 20 },
  { key: "background_video_tile", max: 4 },
  { key: "gallery_tile", max: 1 },
  { key: "product_tile", max: 20 },
  { key: "product_grid_tile", max: 1 },
  { key: "recommended_products_tile", max: 1 },
];

const PRESET_LAYOUTS = {
  marquee: [
    { type: "image_with_text_tile", title: "Brand Story Banner", subtitle: "Spotlight your storefront with one focused campaign." },
    { type: "featured_deals", title: "Featured Deals", subtitle: "Automatically show active promotions in this block." },
    { type: "product_grid_tile", title: "Top Picks Grid", subtitle: "Highlight hero products in a grid." },
  ],
  highlights: [
    { type: "split_selection", title: "Flagship Highlights", subtitle: "Combine visual storytelling with shoppable hotspots." },
    { type: "best_selling_products", title: "Best Sellers", subtitle: "Show your most popular products first." },
    { type: "product_tile", title: "Hero Product", subtitle: "Editorial spotlight for one flagship ASIN." },
  ],
  "product-collection": [
    { type: "gallery_tile", title: "Collection Gallery", subtitle: "Lifestyle-first visual browsing block." },
    { type: "product_grid_tile", title: "Collection Grid", subtitle: "Standard or tall product discovery grid." },
    { type: "recommended_products_tile", title: "Recommended For You", subtitle: "Behavior-informed recommendation tile." },
  ],
};

const createModule = (type = "single_banner") => ({
  id: `module-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  title: "",
  subtitle: "",
  desktopimage: "",
  mobileimage: "",
  images: [],
  videourl: "",
  productids: [],
  navproductid: "",
  startat: "",
  endat: "",
  hotspots: [],
  bodycontent: "",
  linkurl: "",
  layout: "standard",
});

const withModuleIds = (layout = defaultDraft) => {
  const safe = layout && typeof layout === "object" ? layout : defaultDraft;
  const rows = Array.isArray(safe?.modules) ? safe.modules : [];
  return {
    ...safe,
    modules: rows.map((row, index) => ({
      ...row,
      id: String(row?.id || `module-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`),
    })),
  };
};

const csvToArray = (value = "") =>
  String(value || "")
    .split(",")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

const arrayToCsv = (value = []) => (Array.isArray(value) ? value.join(", ") : "");

const normalizeCatalog = (remote = []) => {
  const safeRemote = Array.isArray(remote) ? remote : [];
  const merged = safeRemote.length ? safeRemote : FALLBACK_CATALOG;
  return merged.map((row) => {
    const key = String(row?.key || "").trim();
    const def = MODULE_DEFS[key] || {};
    return {
      key,
      name: row?.name || def.name || key,
      group: def.group || "General",
      max: Number(row?.max || 100),
      notes: row?.notes || def.notes || "",
      supports: def.supports || {},
      maxProducts: Number(def.maxProducts || 0),
    };
  });
};

const getProductPrimaryImage = (product = {}) =>
  product?.whiteimage || product?.hoverimage || product?.variants?.[0]?.images?.[0] || "";

const getProductPrice = (product = {}) => {
  const values = [];
  [product?.price, product?.baseprice, product?.sellingprice].forEach((entry) => {
    const n = Number(entry);
    if (Number.isFinite(n) && n >= 0) values.push(n);
  });
  (Array.isArray(product?.variants) ? product.variants : []).forEach((variant) => {
    (Array.isArray(variant?.options) ? variant.options : []).forEach((option) => {
      const now = Number(option?.currentprice);
      const base = Number(option?.baseprice);
      if (Number.isFinite(now) && now >= 0) values.push(now);
      else if (Number.isFinite(base) && base >= 0) values.push(base);
    });
  });
  return values.length ? Math.min(...values) : 0;
};

const getProductRating = (product = {}) => {
  const n = Number(product?.star || 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(5, n);
};

const ProductPickerModal = ({
  open = false,
  mode = "single",
  products = [],
  onClose,
  onPick,
  maxSelectHint = 1,
}) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const rows = useMemo(() => {
    let next = Array.isArray(products) ? [...products] : [];
    const q = String(search || "").trim().toLowerCase();
    if (q) {
      next = next.filter((row) =>
        [row?.name, row?.brand, row?.slug, row?.categorypath]
          .map((entry) => String(entry || "").toLowerCase())
          .join(" ")
          .includes(q)
      );
    }

    if (status === "active") next = next.filter((row) => row?.isactive !== false);
    if (status === "inactive") next = next.filter((row) => row?.isactive === false);

    if (sort === "bestselling") {
      next.sort((a, b) => Number(b?.totalsold || 0) - Number(a?.totalsold || 0));
    } else if (sort === "toprated") {
      next.sort((a, b) => getProductRating(b) - getProductRating(a));
    } else {
      next.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    }

    return next;
  }, [products, search, sort, status]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170]">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Product Picker</p>
            <p className="text-sm text-emerald-900">
              {mode === "multi" ? `Pick products (up to ${maxSelectHint})` : "Pick one product"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800"
          >
            Close
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_160px_170px]">
          <label className="text-sm font-medium text-emerald-900">
            Search Product
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-emerald-700" />
              <input
                className="mt-1 h-10 w-full rounded-xl border border-emerald-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="name, brand, category..."
              />
            </div>
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Status
            <select className={input} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Sort
            <select className={input} value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="bestselling">Best Selling</option>
              <option value="toprated">Top Rated</option>
            </select>
          </label>
        </div>

        <div className="mt-3 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-3 py-6 text-center text-sm text-emerald-700">
              No products found.
            </p>
          ) : (
            rows.map((product) => (
              <div key={product._id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="grid items-center gap-3 md:grid-cols-[78px_1fr_auto]">
                  <div className="h-[78px] w-[78px] overflow-hidden rounded-lg border border-emerald-200 bg-white">
                    {getProductPrimaryImage(product) ? (
                      <img src={getProductPrimaryImage(product)} alt={product?.name || "Product"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-emerald-700">No image</div>
                    )}
                  </div>
                  <div>
                    <p className="line-clamp-1 text-sm font-semibold text-emerald-900">{product?.name || "Product"}</p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {product?.brand || "N/A"} | Sold {Number(product?.totalsold || 0)} | Rating {getProductRating(product).toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Tk {Number(getProductPrice(product) || 0).toFixed(2)} | {product?.isactive === false ? "Inactive" : "Active"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPick(product)}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const SortableModuleCard = ({ moduleId, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: moduleId,
    data: { dragType: "module", moduleId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return children({
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging,
  });
};

const DraggableCatalogModule = ({ moduleKey, disabled = false, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `catalog:${moduleKey}`,
    data: { dragType: "catalog", moduleKey },
    disabled,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return children({
    attributes,
    listeners,
    setNodeRef,
    style,
    isDragging,
  });
};

const CanvasDropZone = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-dropzone", data: { dragType: "canvas" } });
  return children({ setNodeRef, isOver });
};

const SellerShopDecorator = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shop, setShop] = useState(null);
  const [previewUrls, setPreviewUrls] = useState({});
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [decorator, setDecorator] = useState(null);
  const [draft, setDraft] = useState(defaultDraft);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [sellerItems, setSellerItems] = useState([]);
  const [picker, setPicker] = useState({
    open: false,
    moduleIndex: -1,
    mode: "single",
    hotspotIndex: -1,
    maxSelectHint: 1,
  });

  const [moduleLimitNotice, setModuleLimitNotice] = useState("");
  const [activeDrag, setActiveDrag] = useState(null);
  const [dropIndicator, setDropIndicator] = useState({ index: -1, overId: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const catalogByKey = useMemo(() => {
    const map = new Map();
    moduleCatalog.forEach((row) => map.set(row.key, row));
    return map;
  }, [moduleCatalog]);

  const groupedCatalog = useMemo(() => {
    const groups = new Map();
    moduleCatalog.forEach((row) => {
      const group = row.group || "General";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(row);
    });
    return Array.from(groups.entries());
  }, [moduleCatalog]);

  const moduleCounts = useMemo(() => {
    const counts = new Map();
    const rows = Array.isArray(draft?.modules) ? draft.modules : [];
    rows.forEach((row) => {
      const key = String(row?.type || "").trim();
      if (!key) return;
      counts.set(key, Number(counts.get(key) || 0) + 1);
    });
    return counts;
  }, [draft?.modules]);

  const moduleIds = useMemo(() => {
    const rows = Array.isArray(draft?.modules) ? draft.modules : [];
    return rows.map((row, index) => String(row?.id || `module-fallback-${index}`));
  }, [draft?.modules]);

  const productMap = useMemo(() => {
    const map = new Map();
    sellerItems.forEach((item) => map.set(String(item._id), item));
    return map;
  }, [sellerItems]);

  const previewUrl = useMemo(() => {
    if (!previewUrls) return "";
    if (previewDevice === "mobile") return previewUrls.mobile || "";
    if (previewDevice === "tablet") return previewUrls.tablet || "";
    return previewUrls.desktop || "";
  }, [previewDevice, previewUrls]);

  const loadDecorator = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${serverurl}/seller/panel/shop-decorator`, getRequestConfig({ timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Failed to load shop decorator.");
      setShop(data?.shop || null);
      setPreviewUrls(data?.previewurls || {});
      setModuleCatalog(normalizeCatalog(data?.modulecatalog));
      setDecorator(data?.decorator || null);
      setDraft(withModuleIds(data?.decorator?.draftlayout || defaultDraft));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load decorator.");
    } finally {
      setLoading(false);
    }
  };

  const loadSellerItems = async () => {
    try {
      const { data } = await axios.get(`${serverurl}/seller/panel/items`, getRequestConfig({ timeout: 30000 }));
      if (!data?.success) return;
      setSellerItems(Array.isArray(data?.items) ? data.items : []);
    } catch (_error) {
      // non-blocking, picker can remain empty
    }
  };

  useEffect(() => {
    loadDecorator();
    loadSellerItems();
  }, []);

  const addModule = (type) => {
    let blocked = "";
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      if (modules.length >= MAX_SECTIONS_PER_PAGE) {
        blocked = `Section limit reached (${MAX_SECTIONS_PER_PAGE} per page).`;
        return prev;
      }
      const key = String(type || "single_banner").trim() || "single_banner";
      const catalog = catalogByKey.get(key) || {};
      const maxAllowed = Math.max(1, Number(catalog?.max || 100));
      const used = modules.filter((entry) => String(entry?.type || "") === key).length;
      if (used >= maxAllowed) {
        blocked = `${catalog?.name || key} limit reached (${maxAllowed}).`;
        return prev;
      }
      modules.push(createModule(key));
      return { ...prev, modules };
    });
    if (blocked) {
      setModuleLimitNotice(blocked);
      setNotice(blocked);
    } else {
      setModuleLimitNotice("");
    }
  };

  const insertModuleAt = (moduleKey, rawIndex) => {
    const key = String(moduleKey || "single_banner").trim() || "single_banner";
    let blocked = "";
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      if (modules.length >= MAX_SECTIONS_PER_PAGE) {
        blocked = `Section limit reached (${MAX_SECTIONS_PER_PAGE} per page).`;
        return prev;
      }
      const catalog = catalogByKey.get(key) || {};
      const maxAllowed = Math.max(1, Number(catalog?.max || 100));
      const used = modules.filter((entry) => String(entry?.type || "") === key).length;
      if (used >= maxAllowed) {
        blocked = `${catalog?.name || key} limit reached (${maxAllowed}).`;
        return prev;
      }
      const index = Math.max(0, Math.min(Number(rawIndex || 0), modules.length));
      modules.splice(index, 0, createModule(key));
      return { ...prev, modules };
    });
    if (blocked) {
      setModuleLimitNotice(blocked);
      setNotice(blocked);
      return false;
    }
    setModuleLimitNotice("");
    return true;
  };

  const deleteModule = (index) => {
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      modules.splice(index, 1);
      return { ...prev, modules };
    });
  };

  const updateModule = (index, patch) => {
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      modules[index] = { ...(modules[index] || {}), ...patch };
      return { ...prev, modules };
    });
  };

  const getDropMeta = (event) => {
    const overId = String(event?.over?.id || "");
    const rows = Array.isArray(draft?.modules) ? draft.modules : [];
    if (!overId) {
      return { overId: "", insertIndex: rows.length, linePlacement: "end" };
    }
    if (overId === "canvas-dropzone") {
      return { overId, insertIndex: rows.length, linePlacement: "end" };
    }

    const overIndex = rows.findIndex((row, index) => String(row?.id || `module-fallback-${index}`) === overId);
    if (overIndex < 0) {
      return { overId: "", insertIndex: rows.length, linePlacement: "end" };
    }

    const translated = event?.active?.rect?.current?.translated;
    const overRect = event?.over?.rect;
    const activeCenterY = translated ? translated.top + translated.height / 2 : null;
    const overCenterY = overRect ? overRect.top + overRect.height / 2 : null;
    const placeAfter = Number.isFinite(activeCenterY) && Number.isFinite(overCenterY) ? activeCenterY > overCenterY : false;

    return {
      overId,
      insertIndex: overIndex + (placeAfter ? 1 : 0),
      linePlacement: placeAfter ? "after" : "before",
    };
  };

  const handleDragStart = (event) => {
    const dragType = String(event?.active?.data?.current?.dragType || "");
    if (dragType === "catalog") {
      const moduleKey = String(event?.active?.data?.current?.moduleKey || "");
      const catalog = catalogByKey.get(moduleKey) || MODULE_DEFS[moduleKey] || {};
      setActiveDrag({
        dragType,
        moduleKey,
        label: catalog?.name || moduleKey || "Module",
      });
      return;
    }

    if (dragType === "module") {
      const moduleId = String(event?.active?.id || "");
      const row = (Array.isArray(draft?.modules) ? draft.modules : []).find((entry, idx) => String(entry?.id || `module-fallback-${idx}`) === moduleId);
      const key = String(row?.type || "");
      const catalog = catalogByKey.get(key) || MODULE_DEFS[key] || {};
      setActiveDrag({
        dragType,
        moduleId,
        moduleKey: key,
        label: catalog?.name || key || "Module",
      });
    }
  };

  const handleDragOver = (event) => {
    if (!event?.active) return;
    const meta = getDropMeta(event);
    setDropIndicator({ index: Number(meta.insertIndex), overId: String(meta.overId || "") });
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
    setDropIndicator({ index: -1, overId: "" });
  };

  const handleDragEnd = (event) => {
    if (!event?.over) {
      handleDragCancel();
      return;
    }
    const dragType = String(event?.active?.data?.current?.dragType || "");
    const rows = Array.isArray(draft?.modules) ? draft.modules : [];
    const meta = getDropMeta(event);
    const insertIndex = Math.max(0, Math.min(Number(meta.insertIndex || rows.length), rows.length));

    if (dragType === "catalog") {
      const moduleKey = String(event?.active?.data?.current?.moduleKey || "");
      if (moduleKey) insertModuleAt(moduleKey, insertIndex);
      handleDragCancel();
      return;
    }

    if (dragType === "module") {
      const activeId = String(event?.active?.id || "");
      const activeIndex = rows.findIndex((row, index) => String(row?.id || `module-fallback-${index}`) === activeId);
      if (activeIndex >= 0) {
        setDraft((prev) => {
          const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
          if (activeIndex < 0 || activeIndex >= modules.length) return prev;
          const [moved] = modules.splice(activeIndex, 1);
          let targetIndex = insertIndex;
          if (activeIndex < targetIndex) targetIndex -= 1;
          targetIndex = Math.max(0, Math.min(targetIndex, modules.length));
          modules.splice(targetIndex, 0, moved);
          return { ...prev, modules };
        });
      }
    }

    handleDragCancel();
  };

  const applyPresetLayout = (presetKey) => {
    const key = String(presetKey || draft?.template || "blank");
    const rows = PRESET_LAYOUTS[key];
    if (!Array.isArray(rows) || rows.length === 0) {
      setNotice("No preset modules defined for this template.");
      return;
    }

    const usage = new Map();
    const nextModules = [];
    rows.forEach((row) => {
      const type = String(row?.type || "").trim();
      if (!type) return;
      if (nextModules.length >= MAX_SECTIONS_PER_PAGE) return;
      const catalog = catalogByKey.get(type) || {};
      const maxAllowed = Math.max(1, Number(catalog?.max || 100));
      const used = Number(usage.get(type) || 0);
      if (used >= maxAllowed) return;
      usage.set(type, used + 1);
      nextModules.push({
        ...createModule(type),
        title: String(row?.title || ""),
        subtitle: String(row?.subtitle || ""),
      });
    });

    setDraft((prev) => ({
      ...prev,
      template: key,
      modules: nextModules,
    }));
    setModuleLimitNotice("");
    setNotice(`${key.replace("-", " ")} preset applied.`);
  };

  const openPicker = ({ moduleIndex, mode, hotspotIndex = -1 }) => {
    const moduleRow = draft?.modules?.[moduleIndex] || {};
    const catalog = catalogByKey.get(String(moduleRow?.type || "")) || {};
    const maxSelectHint = Number(catalog?.maxProducts || 1) || 1;
    setPicker({ open: true, moduleIndex, mode, hotspotIndex, maxSelectHint });
  };

  const closePicker = () => setPicker({ open: false, moduleIndex: -1, mode: "single", hotspotIndex: -1, maxSelectHint: 1 });

  const handlePickProduct = (product) => {
    const moduleIndex = Number(picker?.moduleIndex);
    if (!Number.isInteger(moduleIndex) || moduleIndex < 0) return;
    const productId = String(product?._id || "");
    if (!productId) return;
    const mode = String(picker?.mode || "single");

    if (mode === "nav") {
      updateModule(moduleIndex, { navproductid: productId });
      closePicker();
      return;
    }

    if (mode === "hotspot") {
      const hIndex = Number(picker?.hotspotIndex);
      setDraft((prev) => {
        const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
        const moduleRow = { ...(modules[moduleIndex] || {}) };
        const hotspots = Array.isArray(moduleRow?.hotspots) ? [...moduleRow.hotspots] : [];
        if (!Number.isInteger(hIndex) || hIndex < 0 || hIndex >= hotspots.length) return prev;
        hotspots[hIndex] = {
          ...(hotspots[hIndex] || {}),
          productid: productId,
          label: hotspots[hIndex]?.label || String(product?.name || "Product"),
        };
        moduleRow.hotspots = hotspots;
        modules[moduleIndex] = moduleRow;
        return { ...prev, modules };
      });
      closePicker();
      return;
    }

    if (mode === "multi") {
      const moduleRow = draft?.modules?.[moduleIndex] || {};
      const maxCount = Number((catalogByKey.get(moduleRow?.type || "") || {}).maxProducts || 20);
      const existing = Array.isArray(moduleRow?.productids) ? moduleRow.productids.map((id) => String(id)) : [];
      const merged = Array.from(new Set([...existing, productId])).slice(0, Math.max(1, maxCount));
      updateModule(moduleIndex, { productids: merged });
      return;
    }

    updateModule(moduleIndex, { navproductid: productId });
    closePicker();
  };

  const addHotspot = (moduleIndex, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const nextSpot = {
      x: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
      y: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
      productid: "",
      label: "",
    };
    let blocked = false;
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      const moduleRow = { ...(modules[moduleIndex] || {}) };
      const moduleType = String(moduleRow?.type || "");
      const maxHotspots = Math.max(1, Number((catalogByKey.get(moduleType) || {}).maxProducts || 6));
      const hotspots = Array.isArray(moduleRow?.hotspots) ? [...moduleRow.hotspots] : [];
      if (hotspots.length >= maxHotspots) {
        blocked = true;
        return prev;
      }
      hotspots.push(nextSpot);
      moduleRow.hotspots = hotspots;
      modules[moduleIndex] = moduleRow;
      return { ...prev, modules };
    });
    if (blocked) {
      const moduleType = String(draft?.modules?.[moduleIndex]?.type || "");
      const moduleName = (catalogByKey.get(moduleType) || {}).name || "This module";
      const maxHotspots = Math.max(1, Number((catalogByKey.get(moduleType) || {}).maxProducts || 6));
      const msg = `${moduleName} supports up to ${maxHotspots} hotspot products.`;
      setModuleLimitNotice(msg);
      setNotice(msg);
      return;
    }
    const nextIndex = (Array.isArray(draft?.modules?.[moduleIndex]?.hotspots) ? draft.modules[moduleIndex].hotspots.length : 0);
    openPicker({ moduleIndex, mode: "hotspot", hotspotIndex: nextIndex });
  };

  const removeHotspot = (moduleIndex, hotspotIndex) => {
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      const moduleRow = { ...(modules[moduleIndex] || {}) };
      const hotspots = Array.isArray(moduleRow?.hotspots) ? [...moduleRow.hotspots] : [];
      hotspots.splice(hotspotIndex, 1);
      moduleRow.hotspots = hotspots;
      modules[moduleIndex] = moduleRow;
      return { ...prev, modules };
    });
  };

  const removeSelectedProduct = (moduleIndex, productId) => {
    setDraft((prev) => {
      const modules = Array.isArray(prev?.modules) ? [...prev.modules] : [];
      const moduleRow = { ...(modules[moduleIndex] || {}) };
      moduleRow.productids = (Array.isArray(moduleRow?.productids) ? moduleRow.productids : []).filter((id) => String(id) !== String(productId));
      modules[moduleIndex] = moduleRow;
      return { ...prev, modules };
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        template: draft?.template || "blank",
        layout: draft,
      };
      const { data } = await axios.put(`${serverurl}/seller/panel/shop-decorator/draft`, payload, getRequestConfig({ timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Draft save failed.");
      setNotice("Decorator draft saved.");
      await loadDecorator();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.post(`${serverurl}/seller/panel/shop-decorator/publish`, {}, getRequestConfig({ timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Publish failed.");
      setNotice("Decorator published successfully.");
      await loadDecorator();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to publish decorator.");
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setPublishing(true);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.post(`${serverurl}/seller/panel/shop-decorator/unpublish`, {}, getRequestConfig({ timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Unpublish failed.");
      setNotice("Decorator unpublished. Default storefront is now active.");
      await loadDecorator();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to unpublish decorator.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-emerald-200 bg-white p-5 text-sm text-emerald-700">Loading shop decorator...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">GlowHaat Hybrid Store Builder</p>
        <h2 className="mt-1 text-xl font-semibold text-emerald-900">{shop?.shopname || "My Shop"}</h2>
        <p className="mt-1 text-sm text-emerald-700">
          Daraz-style module panel + Amazon-style page building in one decorator experience.
        </p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}
      {moduleLimitNotice ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{moduleLimitNotice}</div> : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className={card}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Store Modules</p>
            <div className="mt-3 space-y-3">
              {groupedCatalog.length === 0 ? (
                <p className="text-sm text-emerald-700">No modules available.</p>
              ) : (
                groupedCatalog.map(([groupName, rows]) => (
                  <div key={groupName} className="rounded-xl border border-emerald-200 bg-emerald-50 p-2">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{groupName}</p>
                    <div className="mt-2 space-y-2">
                      {rows.map((module) => {
                        const usedCount = Number(moduleCounts.get(module.key) || 0);
                        const maxAllowed = Math.max(1, Number(module?.max || 100));
                        const isLocked = usedCount >= maxAllowed;
                        return (
                          <DraggableCatalogModule key={module.key} moduleKey={module.key} disabled={isLocked}>
                            {({ attributes, listeners, setNodeRef, style, isDragging }) => (
                              <button
                                ref={setNodeRef}
                                style={style}
                                type="button"
                                onClick={() => addModule(module.key)}
                                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                  isLocked
                                    ? "cursor-not-allowed border-emerald-100 bg-emerald-50/70 opacity-75"
                                    : "border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-100"
                                } ${isDragging ? "ring-2 ring-emerald-300" : ""}`}
                                title={isLocked ? `Limit reached (${maxAllowed})` : "Click or drag to add module"}
                                {...attributes}
                                {...listeners}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-emerald-900">{module.name}</p>
                                  <Plus className="h-4 w-4 text-emerald-700" />
                                </div>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                  Used {usedCount}/{maxAllowed}
                                </p>
                                <p className="mt-1 text-xs text-emerald-700">{module.notes}</p>
                              </button>
                            )}
                          </DraggableCatalogModule>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Page Canvas</p>
                <p className="text-sm text-emerald-700">Drag modules, reorder blocks, map products, add hotspot dots, then publish.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={publish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                >
                  <UploadCloud className="h-3.5 w-3.5" /> {publishing ? "Publishing..." : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={unpublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-60"
                >
                  Unpublish
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 md:grid-cols-2">
              <label className="text-sm font-medium text-emerald-900">
                SEO Title
                <input
                  className={input}
                  value={draft?.seo?.title || ""}
                  onChange={(event) => setDraft((prev) => ({ ...prev, seo: { ...(prev?.seo || {}), title: event.target.value } }))}
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Template
                <select className={input} value={draft?.template || "blank"} onChange={(event) => setDraft((prev) => ({ ...prev, template: event.target.value }))}>
                  <option value="blank">Blank</option>
                  <option value="marquee">Marquee</option>
                  <option value="highlights">Highlights</option>
                  <option value="product-collection">Product Collection</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Preset Layouts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyPresetLayout("marquee")} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">
                    Apply Marquee
                  </button>
                  <button type="button" onClick={() => applyPresetLayout("highlights")} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">
                    Apply Highlights
                  </button>
                  <button type="button" onClick={() => applyPresetLayout("product-collection")} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">
                    Apply Product Collection
                  </button>
                  <button type="button" onClick={() => applyPresetLayout(draft?.template || "blank")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                    Apply Selected Template
                  </button>
                </div>
              </div>
              <label className="text-sm font-medium text-emerald-900 md:col-span-2">
                SEO Description
                <textarea
                  className={textarea}
                  value={draft?.seo?.description || ""}
                  onChange={(event) => setDraft((prev) => ({ ...prev, seo: { ...(prev?.seo || {}), description: event.target.value } }))}
                />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Desktop Banner URL
                <input className={input} value={draft?.desktopbanner || ""} onChange={(event) => setDraft((prev) => ({ ...prev, desktopbanner: event.target.value }))} placeholder="Recommended: 1920x500" />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Mobile Banner URL
                <input className={input} value={draft?.mobilebanner || ""} onChange={(event) => setDraft((prev) => ({ ...prev, mobilebanner: event.target.value }))} placeholder="Recommended: 1080x720" />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Desktop Profile Image URL
                <input className={input} value={draft?.desktopprofileimage || ""} onChange={(event) => setDraft((prev) => ({ ...prev, desktopprofileimage: event.target.value }))} />
              </label>
              <label className="text-sm font-medium text-emerald-900">
                Mobile Profile Image URL
                <input className={input} value={draft?.mobileprofileimage || ""} onChange={(event) => setDraft((prev) => ({ ...prev, mobileprofileimage: event.target.value }))} />
              </label>
            </div>

            <CanvasDropZone>
              {({ setNodeRef, isOver }) => (
                <div
                  ref={setNodeRef}
                  className={`mt-4 rounded-2xl border border-dashed bg-white p-3 transition ${
                    isOver ? "border-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "border-emerald-300"
                  }`}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Module Layout ({Array.isArray(draft?.modules) ? draft.modules.length : 0})
                  </p>
                  <p className="mb-3 text-[11px] text-emerald-700">
                    Amazon-style section cap active: up to {MAX_SECTIONS_PER_PAGE} sections per page, with tile-specific caps (for example: product grid 1, gallery 1, featured deals 1, recommended products 1, background video 4).
                  </p>

                  {!Array.isArray(draft?.modules) || draft.modules.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-700">
                      Drag a module from the left panel and drop here.
                    </div>
                  ) : (
                    <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {draft.modules.map((module, index) => {
                          const catalog = catalogByKey.get(String(module?.type || "")) || MODULE_DEFS[String(module?.type || "")] || {};
                          const supports = catalog?.supports || {};
                          const selectedProductRows = (Array.isArray(module?.productids) ? module.productids : [])
                            .map((id) => productMap.get(String(id)))
                            .filter(Boolean);
                          const navProduct = productMap.get(String(module?.navproductid || ""));
                          const hotspots = Array.isArray(module?.hotspots) ? module.hotspots : [];
                          const moduleId = String(module?.id || `module-fallback-${index}`);

                          return (
                            <React.Fragment key={moduleId}>
                              {dropIndicator.index === index ? <div className="h-1 rounded-full bg-emerald-500/90" /> : null}
                              <SortableModuleCard moduleId={moduleId}>
                                {({ setNodeRef, style, attributes, listeners, isDragging }) => (
                                  <div
                                    ref={setNodeRef}
                                    style={style}
                                    className={`rounded-xl border border-emerald-200 bg-emerald-50 p-3 ${isDragging ? "opacity-60 shadow-[0_16px_34px_-20px_rgba(5,150,105,0.85)]" : ""}`}
                                  >
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                      <div className="inline-flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="inline-flex h-6 w-6 cursor-grab items-center justify-center rounded-md border border-emerald-300 bg-white text-emerald-700 active:cursor-grabbing"
                                          {...attributes}
                                          {...listeners}
                                          title="Drag to reorder"
                                        >
                                          <GripVertical className="h-4 w-4 text-emerald-700" />
                                        </button>
                                        <p className="text-sm font-semibold text-emerald-900">
                                          {catalog?.name || module?.type || "Module"} #{index + 1}
                                        </p>
                                        <span className="rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          {catalog?.group || "General"}
                                        </span>
                                      </div>
                                      <button type="button" onClick={() => deleteModule(index)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
                                        <Trash2 className="h-3.5 w-3.5" /> Remove
                                      </button>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                      {supports.title ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          Title
                                          <input className={input} value={module?.title || ""} onChange={(event) => updateModule(index, { title: event.target.value })} />
                                        </label>
                                      ) : null}
                                      {supports.subtitle ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          Subtitle
                                          <input className={input} value={module?.subtitle || ""} onChange={(event) => updateModule(index, { subtitle: event.target.value })} />
                                        </label>
                                      ) : null}
                                      {supports.bodycontent ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 md:col-span-2">
                                          Body Content
                                          <textarea className={textarea} value={module?.bodycontent || ""} onChange={(event) => updateModule(index, { bodycontent: event.target.value })} />
                                        </label>
                                      ) : null}
                                      {supports.linkurl ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 md:col-span-2">
                                          Link URL (Store page or product URL)
                                          <input className={input} value={module?.linkurl || ""} onChange={(event) => updateModule(index, { linkurl: event.target.value })} placeholder="/shop/slug or /product/slug" />
                                        </label>
                                      ) : null}
                                      {supports.layout ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          Layout
                                          <select className={input} value={module?.layout || "standard"} onChange={(event) => updateModule(index, { layout: event.target.value })}>
                                            <option value="standard">Standard Grid</option>
                                            <option value="tall">Tall Grid</option>
                                          </select>
                                        </label>
                                      ) : null}

                                      {supports.desktopimage ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          Desktop Image URL
                                          <input className={input} value={module?.desktopimage || ""} onChange={(event) => updateModule(index, { desktopimage: event.target.value })} />
                                        </label>
                                      ) : null}
                                      {supports.mobileimage ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          Mobile Image URL
                                          <input className={input} value={module?.mobileimage || ""} onChange={(event) => updateModule(index, { mobileimage: event.target.value })} />
                                        </label>
                                      ) : null}

                                      {supports.images ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 md:col-span-2">
                                          Images (comma separated URLs)
                                          <textarea className={textarea} value={arrayToCsv(module?.images)} onChange={(event) => updateModule(index, { images: csvToArray(event.target.value) })} />
                                        </label>
                                      ) : null}

                                      {supports.videourl ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 md:col-span-2">
                                          Video URL
                                          <div className="flex items-center gap-2">
                                            <input className={input} value={module?.videourl || ""} onChange={(event) => updateModule(index, { videourl: event.target.value })} />
                                            <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-700">
                                              <Video className="h-4 w-4" />
                                            </span>
                                          </div>
                                        </label>
                                      ) : null}

                                      {supports.startat ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          Start Time
                                          <input type="datetime-local" className={input} value={module?.startat ? String(module.startat).slice(0, 16) : ""} onChange={(event) => updateModule(index, { startat: event.target.value })} />
                                        </label>
                                      ) : null}
                                      {supports.endat ? (
                                        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                          End Time
                                          <input type="datetime-local" className={input} value={module?.endat ? String(module.endat).slice(0, 16) : ""} onChange={(event) => updateModule(index, { endat: event.target.value })} />
                                        </label>
                                      ) : null}
                                    </div>

                                    {supports.navproductid ? (
                                      <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Navigation Product</p>
                                          <button type="button" onClick={() => openPicker({ moduleIndex: index, mode: "nav" })} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
                                            Select Product
                                          </button>
                                        </div>
                                        {navProduct ? (
                                          <p className="mt-2 text-sm text-emerald-900">{navProduct.name}</p>
                                        ) : (
                                          <p className="mt-2 text-xs text-emerald-700">No navigation product selected yet.</p>
                                        )}
                                      </div>
                                    ) : null}

                                    {supports.productids ? (
                                      <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                            Module Products ({selectedProductRows.length}/{Number(catalog?.maxProducts || 20)})
                                          </p>
                                          <button type="button" onClick={() => openPicker({ moduleIndex: index, mode: "multi" })} className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
                                            Add Products
                                          </button>
                                        </div>
                                        {selectedProductRows.length ? (
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            {selectedProductRows.map((product) => (
                                              <span key={product._id} className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                                                {product.name}
                                                <button type="button" onClick={() => removeSelectedProduct(index, product._id)} className="rounded-full bg-white px-1.5 text-emerald-700">
                                                  x
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="mt-2 text-xs text-emerald-700">No products selected.</p>
                                        )}
                                      </div>
                                    ) : null}

                                    {supports.hotspots ? (
                                      <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                                            <MousePointer2 className="h-3.5 w-3.5" /> Hotspot Dot Editor
                                          </p>
                                          <p className="text-[11px] text-emerald-700">Click image to place dot, then choose product.</p>
                                        </div>
                                        {module?.desktopimage ? (
                                          <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50" onClick={(event) => addHotspot(index, event)}>
                                            <img src={module.desktopimage} alt="Hotspot canvas" className="max-h-[280px] w-full object-cover" />
                                            {hotspots.map((spot, spotIndex) => {
                                              const mappedProduct = productMap.get(String(spot?.productid || ""));
                                              return (
                                                <button
                                                  key={`${module.id}-spot-${spotIndex}`}
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    openPicker({ moduleIndex: index, mode: "hotspot", hotspotIndex: spotIndex });
                                                  }}
                                                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                                                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white shadow-lg"
                                                  title={mappedProduct?.name || "Assign product"}
                                                >
                                                  {spotIndex + 1}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-emerald-700">Add desktop image first to enable hotspot editor.</p>
                                        )}

                                        {hotspots.length ? (
                                          <div className="mt-2 space-y-1">
                                            {hotspots.map((spot, spotIndex) => {
                                              const mappedProduct = productMap.get(String(spot?.productid || ""));
                                              return (
                                                <div key={`${module.id}-spot-list-${spotIndex}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5">
                                                  <p className="text-xs text-emerald-800">
                                                    Dot {spotIndex + 1} ({Number(spot?.x || 0).toFixed(1)}%, {Number(spot?.y || 0).toFixed(1)}%) -{" "}
                                                    <span className="font-semibold">{mappedProduct?.name || "No product selected"}</span>
                                                  </p>
                                                  <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => openPicker({ moduleIndex: index, mode: "hotspot", hotspotIndex: spotIndex })} className="rounded-lg border border-emerald-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
                                                      Pick
                                                    </button>
                                                    <button type="button" onClick={() => removeHotspot(index, spotIndex)} className="rounded-lg border border-red-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700">
                                                      Remove
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </SortableModuleCard>
                            </React.Fragment>
                          );
                        })}
                        {dropIndicator.index === draft.modules.length ? <div className="h-1 rounded-full bg-emerald-500/90" /> : null}
                      </div>
                    </SortableContext>
                  )}
                </div>
              )}
            </CanvasDropZone>
          </section>
        </div>

        <DragOverlay>
          {activeDrag ? (
            <div className="w-[280px] rounded-xl border border-emerald-400 bg-white px-3 py-2 shadow-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                {activeDrag.dragType === "catalog" ? "Add Module" : "Reorder Module"}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-900">{activeDrag.label}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Store Preview</p>
            <p className="text-sm text-emerald-700">Current state: {decorator?.ispublished ? "Published Decorator Live" : "Draft / Default Storefront"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPreviewDevice("desktop")} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${previewDevice === "desktop" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 text-emerald-800"}`}>
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button type="button" onClick={() => setPreviewDevice("tablet")} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${previewDevice === "tablet" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 text-emerald-800"}`}>
              <Tablet className="h-3.5 w-3.5" /> Tablet
            </button>
            <button type="button" onClick={() => setPreviewDevice("mobile")} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${previewDevice === "mobile" ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 text-emerald-800"}`}>
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
            <button type="button" onClick={() => previewUrl && window.open(previewUrl, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
              <Eye className="h-3.5 w-3.5" /> Open Preview
            </button>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
          <Dices className="h-3.5 w-3.5" /> Reference-Aligned Builder Notes
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Daraz pattern: drag modules from side panel, quick publish controls, responsive preview.
          </p>
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Amazon pattern: template-first pages, featured deals, best-sellers, split selections, hotspot mapping.
          </p>
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Desktop hero: 1920x500 | Mobile hero: 1080x720 | Product visuals: 1200x1200.
          </p>
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Keep desktop and mobile creative ratios aligned for a clean cross-device storefront.
          </p>
        </div>
      </div>

      <ProductPickerModal
        key={`${picker.open ? "open" : "closed"}-${picker.moduleIndex}-${picker.mode}-${picker.hotspotIndex}`}
        open={picker.open}
        mode={picker.mode === "multi" ? "multi" : "single"}
        products={sellerItems}
        maxSelectHint={picker.maxSelectHint}
        onClose={closePicker}
        onPick={handlePickProduct}
      />
    </div>
  );
};

export default SellerShopDecorator;
