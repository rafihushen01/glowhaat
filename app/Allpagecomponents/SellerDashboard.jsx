"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  Package,
  Image as ImageIcon,
  ShoppingBag,
  MessageSquare,
  Palette,
  Sparkles,
  TrendingUp,
  CreditCard,
  Bell,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Copy,
  Pencil,
  Trash2,
  BadgeCheck,
  Flame,
  Calculator,
  Truck,
  RefreshCw,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import { getSharedSocket } from "../utils/socketClient";
import { useActiveLogo } from "../hooks/useActiveLogo";
import SellerCategorySelector from "./SellerCategorySelector";
import KhanChatHub from "./KhanChatHub";
import KhanNotificationInbox from "./KhanNotificationInbox";
import SellerShopDecorator from "./SellerShopDecorator";
import SellerCreativeAssets from "./SellerCreativeAssets";

// Navigation tabs with human-friendly display names
const NAVIGATION_ITEMS = [
  { id: "Overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "Shop", label: "Store Profile", icon: Store },
  { id: "Add Items", label: "Add Product", icon: PlusCircle },
  { id: "My Items", label: "Products", icon: Package },
  { id: "Orders", label: "Orders", icon: ShoppingBag },
  { id: "Chats", label: "Inbox Chat", icon: MessageSquare },
  { id: "Shop Decorator", label: "Shop Themes", icon: Palette },
  { id: "Creative Assets", label: "Creative Assets", icon: Sparkles },
  { id: "Sponsorship", label: "Promotions", icon: TrendingUp },
  { id: "Commission", label: "Payments & Plan", icon: CreditCard },
  { id: "Notifications", label: "Notifications", icon: Bell },
];

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "returned", "canceled"];

const defaultItemForm = {
  name: "",
  description: "",
  highlight: "",
  aboutitems: "",
  brand: "",
  categorypath: "",
  categoryids: [],
  categorytree: [],
  type: "fashion",
  flashsale: false,
  eidsale: false,
  coustomsale: false,
  isreturnable: true,
  warrantynotavalible: false,
  isperishable: false,
  isactive: true,
  expirydate: "",
  warranty: "",
  warrantyperiod: "",
  deliveryschema: { name: "Standard Delivery", deliverytime: "3-5 Days", deliverycharge: 60, isfreeshipping: false },
  variants: [],
};

const SellerDashboard = () => {
  const router = useRouter();
  const { userData } = useSelector((state) => state.user);
  const { logoUrl } = useActiveLogo();
  const user = userData?.user || userData?.data || userData || null;
  const role = String(user?.role || "");

  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [bootstrap, setBootstrap] = useState(null);
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [commission, setCommission] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [liveGlowToasts, setLiveGlowToasts] = useState([]);

  const [shopForm, setShopForm] = useState({ shopname: "", description: "", contactemail: "", contactphone: "", address: "", profileimage: null, bannerimage: null });
  const [itemForm, setItemForm] = useState(defaultItemForm);
  const [itemFiles, setItemFiles] = useState({ whiteimage: null, hoverimage: null, gallery: [] });
  const [mediaPreview, setMediaPreview] = useState({ whiteimage: "", hoverimage: "", gallery: [] });
  const [variantPreviews, setVariantPreviews] = useState({});
  const [groupCount, setGroupCount] = useState(1);
  const [editItemId, setEditItemId] = useState("");

  const [sponsorForm, setSponsorForm] = useState({ itemid: "", amount: 100, senderbkashnumber: "", transactionid: "", paymentss: null });
  const [commissionForm, setCommissionForm] = useState({ senderbkashnumber: "", transactionid: "", paymentss: null });
  const [subscriptionForm, setSubscriptionForm] = useState({ amount: 1000, senderbkashnumber: "", transactionid: "", paymentss: null });

  const isFrozen = Boolean(bootstrap?.health?.frozen || shop?.healthisfrozen);
  const hasShop = Boolean(shop?._id);

  useEffect(() => {
    if (!user) return;
    if (role === "SuperAdmin") router.replace("/SuperAdmin");
    else if (role !== "Seller") router.replace("/");
  }, [role, router, user]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [boot, shopRes, itemRes, orderRes, sponsorRes, commissionRes, notificationRes] = await Promise.all([
        axios.get(`${serverurl}/seller/panel/bootstrap`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/panel/shop`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/panel/items`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/panel/orders`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/panel/sponsorships`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/panel/commission`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/panel/notifications`, getRequestConfig({ timeout: 20000 })),
      ]);

      setBootstrap(boot.data || null);
      setShop(shopRes.data?.shop || null);
      setItems(itemRes.data?.items || []);
      setOrders(orderRes.data?.orders || []);
      setSponsorships(sponsorRes.data?.sponsorships || []);
      setCommission(commissionRes.data || null);
      setNotifications(notificationRes.data?.notifications || []);

      const currentShop = shopRes.data?.shop || null;
      if (currentShop) {
        setShopForm((prev) => ({
          ...prev,
          shopname: currentShop.shopname || "",
          description: currentShop.description || "",
          contactemail: currentShop.contactemail || "",
          contactphone: currentShop.contactphone || "",
          address: currentShop.address || "",
        }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load seller data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || role !== "Seller") return;
    loadAll();
  }, [user, role]);

  useEffect(() => {
    if (!user || role !== "Seller") return;
    const userid = String(user?._id || user?.id || "").trim();
    if (!userid) return;
    const socket = getSharedSocket();
    if (!socket) return;

    socket.emit("notification_room_join", { kind: "seller", id: userid });

    const onKhanNotification = (payload = {}) => {
      const title = String(payload?.title || "").toLowerCase();
      const source = String(payload?.metadata?.source || "").toLowerCase();
      const isGlowHaatMessage = title.includes("glowhaat message") || source === "glowhaat_chathub";
      if (!isGlowHaatMessage) return;

      const toastId = `glowhaat-toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toastData = {
        id: toastId,
        title: String(payload?.title || "Message Alert"),
        message: String(payload?.message || ""),
        createdAt: payload?.createdAt || new Date().toISOString(),
      };

      setLiveGlowToasts((prev) => [toastData, ...prev].slice(0, 4));
      setNotifications((prev) => [
        {
          _id: payload?.metadata?.sellernotificationid || toastId,
          type: payload?.type || "Info",
          title: toastData.title,
          message: toastData.message,
          isread: false,
          createdAt: toastData.createdAt,
          metadata: payload?.metadata || {},
        },
        ...(Array.isArray(prev) ? prev : []),
      ].slice(0, 120));

      window.setTimeout(() => {
        setLiveGlowToasts((prev) => prev.filter((entry) => entry.id !== toastId));
      }, 9000);
    };

    socket.off("khan_notification", onKhanNotification);
    socket.on("khan_notification", onKhanNotification);

    return () => {
      socket.off("khan_notification", onKhanNotification);
    };
  }, [user, role]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [items]
  );

  const calculateFinalPrice = (base, discount) => {
    const p = Number(base) || 0;
    const d = Number(discount) || 0;
    if (p <= 0) return "0.00";
    return (p - (p * d) / 100).toFixed(2);
  };

  const formatMoney = (value) => `Tk ${Number(value || 0).toFixed(2)}`;

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  };

  const getItemStockStats = (item) => {
    const variants = Array.isArray(item?.variants) ? item.variants : [];
    const options = variants.flatMap((variant) => (Array.isArray(variant?.options) ? variant.options : []));
    const totalstock = options.reduce((sum, option) => sum + Math.max(0, Number(option?.stock || 0)), 0);
    const lowestpositivestock = options
      .map((option) => Number(option?.stock || 0))
      .filter((stock) => Number.isFinite(stock) && stock > 0)
      .sort((a, b) => a - b)[0];
    const instock = totalstock > 0;
    return {
      totalstock,
      optioncount: options.length,
      instock,
      outofstock: !instock,
      lowstock: Number.isFinite(lowestpositivestock) ? lowestpositivestock <= 5 : false,
    };
  };

  const getOrderContext = (order) => ({
    customer: order?.mainorder?.customer || order?.customer || {},
    shipping: order?.mainorder?.shippingaddress || order?.shippingaddress || {},
    payment: order?.mainorder?.payment || order?.payment || {},
    note: order?.mainorder?.notes || "",
    createdAt: order?.mainorder?.createdAt || order?.createdAt || null,
  });

  const formatShippingAddress = (shipping = {}) =>
    [shipping?.addressline, shipping?.area, shipping?.upzilla, shipping?.city, shipping?.district, shipping?.landmark]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");

  const copySteadfastDetails = async (order) => {
    const context = getOrderContext(order);
    const address = formatShippingAddress(context.shipping);
    const text = [
      `Order: ${order?.ordernumber || "N/A"}`,
      `Receiver: ${context.customer?.fullname || "N/A"}`,
      `Phone: ${context.customer?.mobile || "N/A"}`,
      `Email: ${context.customer?.email || "N/A"}`,
      `Address: ${address || "N/A"}`,
      `Product: ${order?.item?.name || "N/A"}`,
      `Variant: ${order?.item?.variantname || "-"}`,
      `Option: ${order?.item?.optionname || "-"}`,
      `Quantity: ${Number(order?.item?.quantity || 0)}`,
      `Collect Amount: ${formatMoney(order?.item?.totalprice || 0)}`,
      `Payment Method: ${(context.payment?.method || "cod").toUpperCase()}`,
      context.note ? `Customer Note: ${context.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setNotice("Order details copied successfully.");
    } catch (_error) {
      setError("Could not copy order details. Please copy manually.");
    }
  };

  const handleWhiteImageChange = (file) => {
    setItemFiles((prev) => ({ ...prev, whiteimage: file || null }));
    if (file) setMediaPreview((prev) => ({ ...prev, whiteimage: URL.createObjectURL(file) }));
  };

  const handleHoverImageChange = (file) => {
    setItemFiles((prev) => ({ ...prev, hoverimage: file || null }));
    if (file) setMediaPreview((prev) => ({ ...prev, hoverimage: URL.createObjectURL(file) }));
  };

  const handleGalleryChange = (fileList) => {
    const files = Array.from(fileList || []);
    setItemFiles((prev) => ({ ...prev, gallery: files }));
    setMediaPreview((prev) => ({
      ...prev,
      gallery: files.map((file) => URL.createObjectURL(file)),
    }));
  };

  const createVariantGroups = (count) => {
    const n = Number(count) || 0;
    if (n < 1) return;
    const created = Array(n)
      .fill(null)
      .map(() => ({
        name: "",
        varianttype: "Color",
        colorHex: "#10b981",
        images: [],
        imageSlots: 4,
        options: [],
      }));
    setItemForm((prev) => ({ ...prev, variants: [...prev.variants, ...created] }));
  };

  const setVariantImageSlots = (vIndex, count) => {
    setItemForm((prev) => {
      const variants = [...prev.variants];
      variants[vIndex].imageSlots = Number(count) || 1;
      return { ...prev, variants };
    });
  };

  const handleVariantImageUpload = (e, vIndex, slotIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setItemForm((prev) => {
      const variants = [...prev.variants];
      if (!variants[vIndex].images) variants[vIndex].images = [];
      variants[vIndex].images[slotIndex] = file;
      return { ...prev, variants };
    });
    setVariantPreviews((prev) => {
      const next = { ...prev };
      if (!next[vIndex]) next[vIndex] = [];
      next[vIndex][slotIndex] = URL.createObjectURL(file);
      return next;
    });
  };

  const addOption = (vIndex) => {
    setItemForm((prev) => {
      const variants = [...prev.variants];
      variants[vIndex].options.push({
        name: "",
        baseprice: "",
        discountpercentage: "",
        stock: 100,
        skucode: "",
        weight: "",
        expirydate: "",
        discountstartdate: "",
        discountenddate: "",
      });
      return { ...prev, variants };
    });
  };

  const removeVariant = (index) => {
    setItemForm((prev) => {
      const variants = [...prev.variants];
      variants.splice(index, 1);
      return { ...prev, variants };
    });
    setVariantPreviews((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const fd = new FormData();
      Object.entries(shopForm).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      const { data } = await axios.post(
        `${serverurl}/seller/panel/shop`,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Shop create failed");
      setNotice("Shop created successfully.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create shop.");
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!hasShop) {
      setError("Please create your shop first.");
      setActiveTab("Shop");
      return;
    }
    if (isFrozen) {
      setError("Shop is frozen. Please clear due commission first.");
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(itemForm).forEach(([k, v]) => {
        if (["variants", "deliveryschema", "categoryids", "categorytree", "categorypath"].includes(k)) return;
        fd.append(k, typeof v === "boolean" ? String(v) : String(v || ""));
      });
      fd.append("categoryids", JSON.stringify(itemForm.categoryids || []));
      fd.append("categorytree", JSON.stringify(itemForm.categorytree || []));
      fd.append("categorypath", itemForm.categorypath || (itemForm.categorytree || []).join(" > "));
      fd.append("deliveryname", itemForm.deliveryschema?.name || "Standard Delivery");
      fd.append("deliverytime", itemForm.deliveryschema?.deliverytime || "3-5 Days");
      fd.append("deliverycharge", String(itemForm.deliveryschema?.deliverycharge ?? 60));
      fd.append("isfreeshipping", String(Boolean(itemForm.deliveryschema?.isfreeshipping)));
      fd.append("deliveryschema", JSON.stringify(itemForm.deliveryschema || {}));
      if (itemFiles.whiteimage) fd.append("whiteimage", itemFiles.whiteimage);
      if (itemFiles.hoverimage) fd.append("hoverimage", itemFiles.hoverimage);
      (itemFiles.gallery || []).forEach((file) => fd.append("gallery", file));
      const variantsJSON = itemForm.variants.map((variant) => ({
        ...variant,
        images: (variant.images || []).map((img) => (typeof img === "string" ? img : "")),
      }));
      fd.append("variants", JSON.stringify(variantsJSON));
      itemForm.variants.forEach((variant, vIndex) => {
        (variant.images || []).forEach((img, slotIndex) => {
          if (img instanceof File) fd.append(`variantmedia_${vIndex}_${slotIndex}`, img);
        });
      });
      const endpoint = editItemId ? `${serverurl}/seller/panel/items/${editItemId}` : `${serverurl}/seller/panel/items`;
      const method = editItemId ? "patch" : "post";
      const { data } = await axios[method](
        endpoint,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Item save failed");
      setNotice(editItemId ? "Product details updated." : "Product successfully published.");
      setItemForm(defaultItemForm);
      setItemFiles({ whiteimage: null, hoverimage: null, gallery: [] });
      setMediaPreview({ whiteimage: "", hoverimage: "", gallery: [] });
      setVariantPreviews({});
      setEditItemId("");
      await loadAll();
      setActiveTab("My Items");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save item.");
    }
  };

  const handleEditPick = (item) => {
    setEditItemId(item._id);
    setItemForm({
      ...defaultItemForm,
      name: item.name || "",
      description: item.description || "",
      highlight: item.highlight || "",
      aboutitems: item.aboutitems || "",
      brand: item.brand || "",
      categorypath: item.categorypath || "",
      categoryids: item.categoryids || [],
      categorytree: item.categorytree || [],
      type: item.type || "fashion",
      flashsale: Boolean(item.flashsale),
      eidsale: Boolean(item.eidsale),
      coustomsale: Boolean(item.coustomsale),
      isreturnable: Boolean(item.isreturnable),
      warrantynotavalible: Boolean(item.warrantynotavalible),
      isperishable: Boolean(item.isperishable),
      isactive: item.isactive !== false,
      expirydate: item.expirydate ? new Date(item.expirydate).toISOString().slice(0, 10) : "",
      warranty: item.warranty || "",
      warrantyperiod: item.warrantyperiod || "",
      deliveryschema: {
        name: item.deliveryschema?.name || "Standard Delivery",
        deliverytime: item.deliveryschema?.deliverytime || "3-5 Days",
        deliverycharge: item.deliveryschema?.deliverycharge || 60,
        isfreeshipping: Boolean(item.deliveryschema?.isfreeshipping),
      },
      variants: (item.variants || []).map((variant) => ({
        ...variant,
        colorHex: "#10b981",
        imageSlots: Math.max(1, (variant.images || []).length || 1),
      })),
    });
    const previews = {};
    (item.variants || []).forEach((variant, idx) => {
      previews[idx] = variant.images || [];
    });
    setVariantPreviews(previews);
    setItemFiles({ whiteimage: null, hoverimage: null, gallery: [] });
    setMediaPreview({
      whiteimage: item.whiteimage || "",
      hoverimage: item.hoverimage || "",
      gallery: Array.isArray(item.gallery) ? item.gallery : [],
    });
    setActiveTab("Add Items");
  };

  const handleDeleteItem = async (itemid) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setNotice("");
    try {
      const { data } = await axios.delete(
        `${serverurl}/seller/panel/items/${itemid}`,
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Delete failed");
      setNotice(data?.message || "Product removed.");
      await loadAll();
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      const payload = err?.response?.data || {};
      if (status === 409 && payload?.requiresforce) {
        const pendingcount = Number(payload?.pendingordercount || 0);
        const force = confirm(
          `This product has ${pendingcount} pending orders. Deleting it will automatically cancel these orders. Do you wish to continue?`
        );
        if (!force) return;

        try {
          const forced = await axios.delete(
            `${serverurl}/seller/panel/items/${itemid}`,
            getRequestConfig({ timeout: 20000, params: { forcecancel: true } })
          );
          if (!forced?.data?.success) throw new Error(forced?.data?.message || "Force delete failed");
          setNotice(forced?.data?.message || "Product deleted and associated orders canceled.");
          await loadAll();
          return;
        } catch (forcedErr) {
          setError(forcedErr?.response?.data?.message || forcedErr?.message || "Failed to delete item.");
          return;
        }
      }
      setError(payload?.message || err?.message || "Failed to delete item.");
    }
  };

  const handleQuickStockStatus = async (item, nextstatus) => {
    const variants = Array.isArray(item?.variants)
      ? item.variants.map((variant) => ({
          ...variant,
          options: Array.isArray(variant?.options) ? variant.options.map((option) => ({ ...option })) : [],
        }))
      : [];
    if (!variants.length) {
      setError("This product has no variant options. Please configure them first.");
      return;
    }

    if (nextstatus === "out_of_stock") {
      variants.forEach((variant) => {
        variant.options.forEach((option) => {
          option.stock = 0;
        });
      });
    } else {
      let haspositive = false;
      variants.forEach((variant) => {
        variant.options.forEach((option) => {
          if (Number(option?.stock || 0) > 0) haspositive = true;
        });
      });
      if (!haspositive) {
        const firstvariant = variants.find((variant) => Array.isArray(variant.options) && variant.options.length > 0);
        if (firstvariant) {
          firstvariant.options[0].stock = 10;
        }
      }
    }

    try {
      setError("");
      setNotice("");
      const { data } = await axios.patch(
        `${serverurl}/seller/panel/items/${item._id}`,
        { variants: JSON.stringify(variants), isactive: true },
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Stock update failed");
      setNotice(nextstatus === "out_of_stock" ? "Product marked as out of stock." : "Product marked as in stock.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update stock status.");
    }
  };

  const handleOrderStatus = async (orderid, status) => {
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/panel/orders/${orderid}/status`,
        { status },
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Status update failed");
      setNotice("Order status successfully updated.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update order status.");
    }
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(sponsorForm).forEach(([k, v]) => {
        if (k !== "paymentss") fd.append(k, String(v || ""));
      });
      if (sponsorForm.paymentss) fd.append("paymentss", sponsorForm.paymentss);
      const { data } = await axios.post(
        `${serverurl}/seller/panel/sponsorships`,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Request failed");
      setNotice("Sponsorship request submitted successfully.");
      setSponsorForm({ itemid: "", amount: 100, senderbkashnumber: "", transactionid: "", paymentss: null });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed sponsorship request.");
    }
  };

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("senderbkashnumber", commissionForm.senderbkashnumber);
      fd.append("transactionid", commissionForm.transactionid);
      if (commissionForm.paymentss) fd.append("paymentss", commissionForm.paymentss);
      const { data } = await axios.post(
        `${serverurl}/seller/panel/commission/submit`,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Commission submit failed");
      setNotice("Commission payment submitted for approval.");
      setCommissionForm({ senderbkashnumber: "", transactionid: "", paymentss: null });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit payment proof.");
    }
  };

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("amount", String(subscriptionForm.amount));
      fd.append("senderbkashnumber", subscriptionForm.senderbkashnumber);
      fd.append("transactionid", subscriptionForm.transactionid);
      if (subscriptionForm.paymentss) fd.append("paymentss", subscriptionForm.paymentss);
      const { data } = await axios.post(
        `${serverurl}/seller/panel/subscriptions`,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Subscription request failed");
      setNotice("Subscription request submitted.");
      setSubscriptionForm({ amount: 1000, senderbkashnumber: "", transactionid: "", paymentss: null });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to request subscription.");
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/panel/notifications/${id}/read`,
        {},
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Update failed");
      setNotice("Notification marked as read.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update notification.");
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/panel/notifications/read-all`,
        {},
        getRequestConfig({ timeout: 20000 })
      );
      if (!data?.success) throw new Error(data?.message || "Update failed");
      setNotice("All notifications marked as read.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to clear notifications.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6" style={{ fontFamily: '"Inter", sans-serif' }}>
        <div className="bg-white border border-zinc-150 p-8 rounded-2xl max-w-sm text-center shadow-sm">
          <AlertTriangle className="h-9 w-9 text-zinc-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-zinc-800">Sign In Required</h2>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Please log in to your merchant account to access the dashboard.
          </p>
          <button
            onClick={() => router.push("/signin")}
            className="mt-6 w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (role !== "Seller") return null;

  return (
    <div
      className="min-h-screen bg-[#fafbfc] flex flex-col lg:flex-row text-zinc-700"
      style={{ fontFamily: '"Inter", "Manrope", sans-serif' }}
    >
      {/* Live Message Toasts */}
      {liveGlowToasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[120] w-[90vw] max-w-sm space-y-2">
          {liveGlowToasts.map((toast) => (
            <div
              key={toast.id}
              className="rounded-2xl border border-zinc-150 bg-white p-4 shadow-xl flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                  <BadgeCheck className="h-3 w-3" /> Update Alert
                </span>
                <p className="text-xs font-bold text-zinc-800 leading-snug">{toast.title}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setLiveGlowToasts((prev) => prev.filter((entry) => entry.id !== toast.id))}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-650 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sidenav (Desktop Sidebar / Mobile Drawer) */}
      <AnimatePresence>
        {(mobileMenuOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-zinc-150 flex flex-col justify-between shadow-xl lg:shadow-none lg:static lg:flex shrink-0 h-screen"
          >
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Logo section */}
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 border border-zinc-100 rounded-lg bg-zinc-50">
                    <img src={logoUrl} className="h-6 w-auto object-contain max-w-[95px]" alt="Logo" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                      Store Manager
                    </span>
                    <span className="text-[11px] font-bold text-zinc-800 mt-0.5 block">
                      {shop?.shopname || "Store Hub"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation items */}
              <nav className="p-4 space-y-1 flex-1">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800 shadow-sm"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-emerald-700" : "text-zinc-400"}`} />
                      <span className="truncate">{item.label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-emerald-700" />}
                    </button>
                  );
                })}

                {/* Sidenav Login Button */}
                <button
                  type="button"
                  onClick={() => router.push("/signin")}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-550 hover:bg-zinc-50 hover:text-zinc-900 transition mt-6 border border-zinc-150 bg-zinc-50/20 shadow-sm"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
                  <span className="truncate">Login Page</span>
                </button>
              </nav>
            </div>

            {/* Profile banner */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2.5 p-2 rounded-xl border border-zinc-150 bg-white">
                <div className="h-7 w-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                  {shop?.shopname ? shop.shopname.slice(0, 1) : "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-zinc-800 truncate leading-tight">
                    {user?.fullname || "Operator"}
                  </p>
                  <p className="text-[9px] text-zinc-400 truncate mt-0.5 font-bold">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Floating Mobile Hamburger Menu Toggler */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-40 p-2.5 rounded-xl border border-zinc-150 bg-white/90 backdrop-blur shadow-sm text-zinc-600 hover:bg-zinc-50 transition"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Inner Content Grid */}
        <main className="p-6 md:p-8 pt-16 lg:pt-8 flex-1 max-w-6xl w-full mx-auto space-y-6">
          
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 flex gap-3">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-800">Operational Notice</p>
                <p className="text-xs text-rose-600 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-emerald-150 bg-emerald-50/40 p-4 flex gap-3">
              <BadgeCheck className="h-4.5 w-4.5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-850">System Message</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">{notice}</p>
              </div>
            </div>
          )}

          {/* Simple Minimalist Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-150 rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-400 font-semibold">Updating store logs...</p>
            </div>
          )}

          {/* TAB: Overview */}
          {!loading && activeTab === "Overview" && (
            <div className="space-y-6">
              {/* Premium Dashboard Banner */}
              <div className="rounded-2xl border border-emerald-100 bg-white p-7 shadow-sm">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 border border-emerald-100 mb-4">
                  Merchant Center
                </span>
                <h3 className="text-xl font-bold tracking-tight text-zinc-800">
                  Welcome back, {user?.fullname || "Operator"}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mt-1.5 max-w-xl">
                  Easily configure product options, monitor client orders, organize campaigns, and consult with shoppers in your store storefront portal.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-zinc-500">
                  <span>bKash Number: <strong className="text-zinc-850">{bootstrap?.bkashnumber || "01862623066"}</strong></span>
                  <span>Health Tier: <strong className="text-zinc-850">{bootstrap?.health?.level || "Optimal"}</strong></span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Products</p>
                  <p className="text-xl font-black text-zinc-805 mt-1">{bootstrap?.stats?.itemcount || 0}</p>
                </div>
                <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Orders Processed</p>
                  <p className="text-xl font-black text-zinc-805 mt-1">{bootstrap?.stats?.ordercount || 0}</p>
                </div>
                <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Active Campaigns</p>
                  <p className="text-xl font-black text-zinc-805 mt-1">{bootstrap?.stats?.pendingSponsorships || 0}</p>
                </div>
                <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">New Notifications</p>
                  <p className="text-xl font-black text-zinc-805 mt-1">{bootstrap?.stats?.unreadNotifications || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Shop profile */}
          {!loading && activeTab === "Shop" && (
            <form className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm" onSubmit={handleCreateShop}>
              <div>
                <h3 className="text-sm font-black text-zinc-805">Store Profile Details</h3>
                <p className="text-xs text-zinc-450 mt-0.5">Manage your retail store coordinates.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Shop Name</label>
                  <input className={fieldInputClass} value={shopForm.shopname} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, shopname: e.target.value }))} required={!hasShop} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Support Email</label>
                  <input className={fieldInputClass} value={shopForm.contactemail} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, contactemail: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Support Phone</label>
                  <input className={fieldInputClass} value={shopForm.contactphone} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, contactphone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Merchant Address</label>
                  <input className={fieldInputClass} value={shopForm.address} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Store Description</label>
                  <textarea className={`${fieldInputClass} min-h-[84px]`} value={shopForm.description} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Shop Logo Image</label>
                  {hasShop && shop?.profileimage && (
                    <div className="mt-2 mb-3">
                      <img src={shop.profileimage} alt="Shop Logo" className="h-16 w-16 rounded-xl object-cover border border-zinc-200 shadow-sm" />
                    </div>
                  )}
                  <input type="file" className="text-xs text-zinc-500 mt-2 cursor-pointer" disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, profileimage: e.target.files?.[0] || null }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Shop Banner Image</label>
                  {hasShop && shop?.bannerimage && (
                    <div className="mt-2 mb-3">
                      <img src={shop.bannerimage} alt="Shop Banner" className="h-16 w-32 rounded-xl object-cover border border-zinc-200 shadow-sm" />
                    </div>
                  )}
                  <input type="file" className="text-xs text-zinc-500 mt-2 cursor-pointer" disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, bannerimage: e.target.files?.[0] || null }))} />
                </div>
              </div>

              {!hasShop && (
                <button className="rounded-xl bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition hover:bg-emerald-700">
                  Create Shop Profile
                </button>
              )}
            </form>
          )}

          {/* TAB: Add Items */}
          {!loading && activeTab === "Add Items" && (
            <form className="space-y-6" onSubmit={handleCreateItem}>
              <div className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5 border-b border-zinc-100 pb-4">
                  <Package className="h-4.5 w-4.5 text-zinc-400" />
                  <div>
                    <h3 className="text-sm font-black text-zinc-800 leading-none">
                      {editItemId ? "Edit Product Profile" : "Add Product Detail"}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">Configure standard product characteristics.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Product Name</label>
                    <input className={fieldInputClass} value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Brand Tag</label>
                    <input className={fieldInputClass} value={itemForm.brand} onChange={(e) => setItemForm((p) => ({ ...p, brand: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Product Type</label>
                    <input className={fieldInputClass} value={itemForm.type} onChange={(e) => setItemForm((p) => ({ ...p, type: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Category Path</label>
                    <input className={fieldInputClass} value={itemForm.categorypath} onChange={(e) => setItemForm((p) => ({ ...p, categorypath: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Product Description</label>
                    <textarea className={`${fieldInputClass} min-h-[76px]`} value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Product Highlights</label>
                    <textarea className={`${fieldInputClass} min-h-[76px]`} value={itemForm.highlight} onChange={(e) => setItemForm((p) => ({ ...p, highlight: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Product Narrative</label>
                    <textarea className={`${fieldInputClass} min-h-[76px]`} value={itemForm.aboutitems} onChange={(e) => setItemForm((p) => ({ ...p, aboutitems: e.target.value }))} />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <SellerCategorySelector
                      onSelect={(cat) =>
                        setItemForm((p) => ({
                          ...p,
                          categoryids: Array.isArray(cat?.ids) ? cat.ids : [],
                          categorytree: Array.isArray(cat?.names) ? cat.names : [],
                          categorypath: cat?.path || "",
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {Object.entries({
                    flashsale: "Flash Sale",
                    eidsale: "Eid Campaign",
                    coustomsale: "Special Sale",
                    isreturnable: "Returns Acceptable",
                    warrantynotavalible: "No Warranty",
                    isperishable: "Perishable",
                    isactive: "Visible in Catalog",
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 border border-zinc-150 rounded-xl bg-zinc-55 px-3 py-2.5 text-xs font-bold text-zinc-600 cursor-pointer hover:bg-zinc-50 transition">
                      <input
                        type="checkbox"
                        checked={Boolean(itemForm[key])}
                        onChange={(e) => setItemForm((p) => ({ ...p, [key]: e.target.checked }))}
                        className="accent-emerald-800"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Media Block */}
              <div className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5 border-b border-zinc-100 pb-4">
                  <ImageIcon className="h-4.5 w-4.5 text-zinc-400" />
                  <div>
                    <h3 className="text-sm font-black text-zinc-800 leading-none">Product Media</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">Upload primary profile and showcase images.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Primary Display Image</label>
                    <input type="file" className="text-xs text-zinc-500 mt-2" onChange={(e) => handleWhiteImageChange(e.target.files?.[0] || null)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Hover Catalog Image</label>
                    <input type="file" className="text-xs text-zinc-500 mt-2" onChange={(e) => handleHoverImageChange(e.target.files?.[0] || null)} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Additional Gallery Photos</label>
                    <input type="file" multiple className="text-xs text-zinc-500 mt-2" onChange={(e) => handleGalleryChange(e.target.files)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="aspect-[4/5] rounded-xl border border-zinc-150 overflow-hidden bg-zinc-50 flex items-center justify-center">
                    {mediaPreview.whiteimage ? <img src={mediaPreview.whiteimage} alt="Primary" className="h-full w-full object-cover" /> : <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Primary</span>}
                  </div>
                  <div className="aspect-[4/5] rounded-xl border border-zinc-150 overflow-hidden bg-zinc-50 flex items-center justify-center">
                    {mediaPreview.hoverimage ? <img src={mediaPreview.hoverimage} alt="Hover" className="h-full w-full object-cover" /> : <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Hover</span>}
                  </div>
                  {(mediaPreview.gallery || []).slice(0, 2).map((img, i) => (
                    <div key={i} className="aspect-[4/5] rounded-xl border border-zinc-150 overflow-hidden bg-zinc-50">
                      <img src={img} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Logistics */}
              <div className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2.5 border-b border-zinc-100 pb-4">
                  <Truck className="h-4.5 w-4.5 text-zinc-400" />
                  <div>
                    <h3 className="text-sm font-black text-zinc-800 leading-none">Shipping Configuration</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">Determine delivery timing and costs.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Delivery Plan Title</label>
                    <input className={fieldInputClass} value={itemForm.deliveryschema.name} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, name: e.target.value } }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Expected Delivery Duration</label>
                    <input className={fieldInputClass} value={itemForm.deliveryschema.deliverytime} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, deliverytime: e.target.value } }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Shipping Rate (Tk)</label>
                    <input type="number" className={fieldInputClass} value={itemForm.deliveryschema.deliverycharge} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, deliverycharge: Number(e.target.value) } }))} />
                  </div>
                </div>

                <label className="flex items-center gap-2 border border-zinc-150 rounded-xl bg-zinc-50/50 p-3 text-xs font-bold text-zinc-650 cursor-pointer w-max hover:bg-zinc-50 transition mt-2">
                  <input
                    type="checkbox"
                    checked={Boolean(itemForm.deliveryschema.isfreeshipping)}
                    onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, isfreeshipping: e.target.checked } }))}
                    className="accent-emerald-800"
                  />
                  Free Shipping Eligible
                </label>
              </div>

              {/* Variants */}
              <div className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4.5 w-4.5 text-zinc-400" />
                    <div>
                      <h3 className="text-sm font-black text-zinc-800 leading-none">Product Options & Variants</h3>
                      <p className="text-[11px] text-zinc-400 mt-1">Generate multi-dimensional sizing, colors, and options.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" className="h-9 w-16 rounded-xl border border-zinc-200 text-center text-xs font-bold" value={groupCount} onChange={(e) => setGroupCount(e.target.value)} />
                    <button type="button" onClick={() => createVariantGroups(groupCount)} className="rounded-xl bg-[#e6f4ea] hover:bg-[#d2ebd9] text-emerald-805 font-bold text-xs uppercase tracking-wider px-4 py-2 transition">Generate</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <AnimatePresence>
                    {itemForm.variants.map((variant, vIndex) => (
                      <motion.div key={vIndex} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-zinc-150 bg-zinc-50/40 p-4">
                        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                          <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Variant Name<input className={fieldInputClass} value={variant.name} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].name = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Variant Type<input className={fieldInputClass} value={variant.varianttype} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].varianttype = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Option Color<input type="color" className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white p-2" value={variant.colorHex || "#10b981"} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].colorHex = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Image Slots<input type="number" className={fieldInputClass} value={variant.imageSlots} onChange={(e) => setVariantImageSlots(vIndex, e.target.value)} /></label>
                          </div>
                          <button type="button" onClick={() => removeVariant(vIndex)} className="self-end rounded-xl bg-rose-50 p-2.5 text-rose-700 hover:bg-rose-500 hover:text-white transition"><Trash2 size={16} /></button>
                        </div>

                        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                          {Array.from({ length: variant.imageSlots || 4 }).map((_, slotIdx) => (
                            <label key={slotIdx} className="relative flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-white hover:border-emerald-500 transition">
                              {variantPreviews[vIndex]?.[slotIdx] ? (
                                <Image src={variantPreviews[vIndex][slotIdx]} alt={`Variant ${vIndex + 1}`} fill unoptimized className="object-cover" />
                              ) : <span className="text-[10px] text-zinc-400">{slotIdx + 1}</span>}
                              <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleVariantImageUpload(e, vIndex, slotIdx)} />
                            </label>
                          ))}
                        </div>

                        <div className="overflow-x-auto border border-zinc-150 rounded-xl bg-white hidden md:block">
                          <table className="w-full text-left">
                            <thead className="bg-zinc-50 text-[10px] font-extrabold uppercase tracking-wider text-zinc-450 border-b border-zinc-150">
                              <tr>
                                <th className="p-3">Option Label</th>
                                <th className="p-3">Base Price</th>
                                <th className="p-3">Discount %</th>
                                <th className="p-3">Final price</th>
                                <th className="p-3">Stock count</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {variant.options.map((opt, oIndex) => (
                                <tr key={oIndex} className="border-b border-zinc-100 last:border-0">
                                  <td className="p-2"><input className={fieldInputClass} value={opt.name} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].name = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                  <td className="p-2"><input type="number" className={fieldInputClass} value={opt.baseprice} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].baseprice = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                  <td className="p-2"><input type="number" className={fieldInputClass} value={opt.discountpercentage} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].discountpercentage = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                  <td className="p-2"><div className="rounded-xl border border-zinc-150 bg-zinc-50/50 px-3 py-2 text-center text-xs font-bold text-zinc-650">Tk {calculateFinalPrice(opt.baseprice, opt.discountpercentage)}</div></td>
                                  <td className="p-2"><input type="number" className={fieldInputClass} value={opt.stock} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].stock = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                  <td className="p-2"><input className={fieldInputClass} value={opt.skucode} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].skucode = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                  <td className="p-2 text-center"><button type="button" className="text-rose-500 hover:text-rose-700 transition" onClick={() => { const arr = [...itemForm.variants]; arr[vIndex].options.splice(oIndex, 1); setItemForm({ ...itemForm, variants: arr }); }}><X size={15} /></button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile table card blocks */}
                        <div className="space-y-2 md:hidden">
                          {variant.options.map((opt, oIndex) => (
                            <div key={oIndex} className="rounded-xl border border-zinc-150 bg-white p-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <label className="col-span-2 text-[9px] font-extrabold uppercase text-zinc-400">Option Label<input className={fieldInputClass} value={opt.name} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].name = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                                <label className="text-[9px] font-extrabold uppercase text-zinc-400">Base Price<input type="number" className={fieldInputClass} value={opt.baseprice} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].baseprice = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                                <label className="text-[9px] font-extrabold uppercase text-zinc-400">Discount%<input type="number" className={fieldInputClass} value={opt.discountpercentage} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].discountpercentage = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-700 bg-zinc-50 p-2 rounded-xl">
                                <span>Final price</span>
                                <span>Tk {calculateFinalPrice(opt.baseprice, opt.discountpercentage)}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button type="button" onClick={() => addOption(vIndex)} className="mt-3 w-full rounded-xl border border-dashed border-zinc-200 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition">+ Add Product Option</button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sticky Controls */}
              <div className="sticky bottom-4 z-30 rounded-2xl border border-zinc-150 bg-white/95 p-4 shadow-lg flex justify-between items-center">
                <p className="text-[11px] text-zinc-400 font-bold hidden sm:block">Please check details before saving to catalog.</p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button disabled={!hasShop || isFrozen} className="flex-1 sm:flex-initial rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition disabled:opacity-60">
                    {editItemId ? "Update Catalog" : "Publish Product"}
                  </button>
                  {editItemId && (
                    <button type="button" onClick={() => { setEditItemId(""); setItemForm(defaultItemForm); setVariantPreviews({}); setItemFiles({ whiteimage: null, hoverimage: null, gallery: [] }); setMediaPreview({ whiteimage: "", hoverimage: "", gallery: [] }); }} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* TAB: My Items catalog */}
          {!loading && activeTab === "My Items" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedItems.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-20 bg-white border border-zinc-150 rounded-2xl">
                  <Package className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No catalog products found. Try adding a product first.</p>
                </div>
              ) : (
                sortedItems.map((item) => {
                  const stock = getItemStockStats(item);
                  const primaryImage = item?.whiteimage || item?.hoverimage || "";
                  const hoverImage = item?.hoverimage || item?.whiteimage || "";

                  return (
                    <div key={item._id} className="group overflow-hidden rounded-2xl border border-zinc-150 bg-white shadow-sm transition hover:shadow-md">
                      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-50 border-b border-zinc-100">
                        {primaryImage ? (
                          <img src={primaryImage} alt={item?.name} className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${hoverImage ? "group-hover:opacity-0" : ""}`} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No Image</div>
                        )}
                        {hoverImage && (
                          <img src={hoverImage} alt={item?.name} className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-300 group-hover:opacity-100" />
                        )}

                        <div className="absolute left-3 top-3 z-10 flex gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white ${stock.instock ? "bg-emerald-600" : "bg-rose-500"}`}>
                            {stock.instock ? "In Stock" : "Sold Out"}
                          </span>
                          {stock.lowstock && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                              <Flame size={11} /> Low Stock
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-x-3 bottom-3 z-10 grid grid-cols-2 gap-2 bg-white/95 p-2 rounded-xl shadow-lg border border-zinc-100 backdrop-blur transition md:translate-y-12 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleQuickStockStatus(item, stock.instock ? "out_of_stock" : "in_stock")}
                            className="rounded-lg border border-zinc-200 hover:bg-zinc-50 px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-zinc-650 transition"
                          >
                            {stock.instock ? "Mark Out" : "Mark In"}
                          </button>
                          <button type="button" onClick={() => handleEditPick(item)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-zinc-650 transition">
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteItem(item._id)} className="col-span-2 rounded-lg border border-rose-100 bg-rose-50 hover:bg-rose-500 hover:text-white px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-700 transition">
                            Remove Item
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-0.5">
                        <p className="line-clamp-1 text-xs font-black text-zinc-800 leading-tight">{item?.name}</p>
                        <p className="line-clamp-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{item?.categorypath || "No category path"}</p>
                        <div className="flex justify-between items-center pt-2 text-[11px] font-bold text-zinc-500">
                          <span>Total Stock: {stock.totalstock}</span>
                          <span className={item?.isactive ? "text-emerald-700" : "text-rose-500"}>{item?.isactive ? "Published" : "Hidden"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: Orders list */}
          {!loading && activeTab === "Orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-20 bg-white border border-zinc-150 rounded-2xl">
                  <ShoppingBag className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No orders found.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const context = getOrderContext(order);
                  const shippingAddress = formatShippingAddress(context.shipping);
                  return (
                    <div key={order._id} className="bg-white border border-zinc-150 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-zinc-800">{order.ordernumber} • {order.item?.name}</h4>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Placed at: {formatDateTime(context.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${order.status === "delivered" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : order.status === "canceled" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-amber-50 text-amber-800 border border-amber-100"}`}>
                            {order.status}
                          </span>
                          <button type="button" onClick={() => copySteadfastDetails(order)} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-zinc-650 transition">
                            <Copy className="h-3 w-3" /> Copy Steadfast
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 flex gap-4">
                          {order?.item?.image && <img src={order.item.image} alt="Product image" className="h-14 w-14 rounded-lg object-cover border border-zinc-200 shrink-0" />}
                          <div className="text-xs text-zinc-500 space-y-0.5 leading-relaxed font-semibold">
                            <p>Item: <strong className="text-zinc-800">{order?.item?.name}</strong></p>
                            <p>Variant: <strong className="text-zinc-800">{order?.item?.variantname || "-"}</strong></p>
                            <p>Option: <strong className="text-zinc-800">{order?.item?.optionname || "-"}</strong></p>
                            <p>Quantity: <strong className="text-zinc-800">{Number(order?.item?.quantity || 0)}</strong></p>
                            <p>Item Total: <strong className="text-zinc-800">{formatMoney(order?.item?.totalprice || 0)}</strong></p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-150 p-4 text-xs text-zinc-500 space-y-1 font-semibold">
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1">Shipping Details</p>
                          <p>Customer: <strong className="text-zinc-800">{context.customer?.fullname || "N/A"}</strong></p>
                          <p>Mobile: <strong className="text-zinc-800">{context.customer?.mobile || "N/A"}</strong></p>
                          <p>Address: <strong className="text-zinc-800 font-medium leading-relaxed block mt-0.5">{shippingAddress || "N/A"}</strong></p>
                          <p className="mt-1">Payment Method: <strong className="text-zinc-800 uppercase">{(context.payment?.method || "cod")}</strong></p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100">
                        {ORDER_STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={isFrozen || order.status === status}
                            onClick={() => handleOrderStatus(order._id, status)}
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider transition ${order.status === status ? "bg-emerald-800 text-white" : "border border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: Chats Inbox */}
          {!loading && activeTab === "Chats" && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-2 shadow-sm min-h-[500px] flex flex-col overflow-hidden">
              <KhanChatHub embedded />
            </div>
          )}

          {/* TAB: Shop Decorator */}
          {!loading && activeTab === "Shop Decorator" && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm">
              <SellerShopDecorator />
            </div>
          )}

          {/* TAB: Creative Assets */}
          {!loading && activeTab === "Creative Assets" && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm">
              <SellerCreativeAssets />
            </div>
          )}

          {/* TAB: Sponsorship promotions */}
          {!loading && activeTab === "Sponsorship" && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <form className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm" onSubmit={handleSponsorSubmit}>
                <div>
                  <h3 className="text-sm font-black text-zinc-805">Promote Product Catalog</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">Boost catalog products to gain discovery impressions.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Select Catalog Product</label>
                    <select className={fieldInputClass} value={sponsorForm.itemid} onChange={(e) => setSponsorForm((p) => ({ ...p, itemid: e.target.value }))} required>
                      <option value="">Choose product...</option>
                      {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Promo Budget: Tk {sponsorForm.amount}</label>
                    <input type="range" min={100} max={2000} step={100} className="w-full accent-emerald-800 cursor-pointer mt-2" value={sponsorForm.amount} onChange={(e) => setSponsorForm((p) => ({ ...p, amount: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Sender bKash Account</label>
                    <input className={fieldInputClass} value={sponsorForm.senderbkashnumber} onChange={(e) => setSponsorForm((p) => ({ ...p, senderbkashnumber: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Transaction ID</label>
                    <input className={fieldInputClass} value={sponsorForm.transactionid} onChange={(e) => setSponsorForm((p) => ({ ...p, transactionid: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Screenshot Proof</label>
                    <input type="file" className="text-xs text-zinc-500 mt-2" onChange={(e) => setSponsorForm((p) => ({ ...p, paymentss: e.target.files?.[0] || null }))} />
                  </div>
                </div>

                <p className="text-[10px] font-bold text-zinc-500 bg-zinc-50 p-2 rounded-xl">Send payment to bKash: <strong>{bootstrap?.bkashnumber || "01862623066"}</strong></p>
                <button disabled={isFrozen || !hasShop} className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50">
                  Submit Promotion
                </button>
              </form>

              <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="text-sm font-black text-zinc-805 mb-4 border-b border-zinc-100 pb-3">Campaign Logs</h3>
                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
                  {sponsorships.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-bold py-6 text-center">No campaigns logged.</p>
                  ) : (
                    sponsorships.map((s) => (
                      <div key={s._id} className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-3 space-y-1">
                        <p className="text-xs font-bold text-zinc-850">{s.itemid?.name || "Product Item"}</p>
                        <p className="text-[10px] font-semibold text-zinc-500">Tk {s.amount} | {s.sponsoreddays} days | Status: <strong className="text-emerald-800 uppercase">{s.status}</strong></p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Commission & payments */}
          {!loading && activeTab === "Commission" && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-zinc-805 leading-none">Delivered Volume & Commissions</h3>
                  <p className="text-xs text-zinc-450 mt-0.5">Settle commission due balances here.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 border border-zinc-150 p-3 rounded-xl">
                    <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Delivered Volume</p>
                    <p className="text-base font-black text-zinc-800 mt-1">{formatMoney(commission?.payment?.totaldeliveredamount || 0)}</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-150 p-3 rounded-xl">
                    <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Due Commission</p>
                    <p className="text-base font-black text-zinc-800 mt-1">{formatMoney(commission?.payment?.commissionamount || 0)}</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-150 p-3 rounded-xl">
                    <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Commission Rate</p>
                    <p className="text-base font-black text-zinc-800 mt-1">{Number(commission?.commission?.percent || 0)}%</p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-150 p-3 rounded-xl">
                    <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Status</p>
                    <p className="text-base font-black text-zinc-800 mt-1 uppercase text-emerald-800">{commission?.payment?.status || "Settled"}</p>
                  </div>
                </div>

                <form className="border-t border-zinc-150 pt-4 space-y-3" onSubmit={handleCommissionSubmit}>
                  <p className="text-xs text-zinc-500 font-bold bg-zinc-50 p-2 rounded-xl">Send payment to bKash: <strong>{commission?.bkashnumber || "01862623066"}</strong></p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Sender bKash Account</label>
                    <input className={fieldInputClass} value={commissionForm.senderbkashnumber} onChange={(e) => setCommissionForm((p) => ({ ...p, senderbkashnumber: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Transaction ID</label>
                    <input className={fieldInputClass} value={commissionForm.transactionid} onChange={(e) => setCommissionForm((p) => ({ ...p, transactionid: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Screenshot Proof</label>
                    <input type="file" className="text-xs text-zinc-500 mt-2" onChange={(e) => setCommissionForm((p) => ({ ...p, paymentss: e.target.files?.[0] || null }))} />
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-750 text-white font-bold text-xs uppercase tracking-wider transition mt-2">
                    Send Payment Proof
                  </button>
                </form>
              </div>

              <div className="bg-white border border-zinc-150 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm flex flex-col">
                <h3 className="text-sm font-black text-zinc-805 border-b border-zinc-100 pb-3">Subscription plans</h3>
                <form className="space-y-3" onSubmit={handleSubscriptionSubmit}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Choose Plan</label>
                    <select className={fieldInputClass} value={subscriptionForm.amount} onChange={(e) => setSubscriptionForm((p) => ({ ...p, amount: Number(e.target.value) }))}>
                      <option value={1000}>Bronze Tk 1000 (save Tk 300)</option>
                      <option value={5000}>Silver Tk 5000 (save Tk 1000)</option>
                      <option value={10000}>Golden Tk 10000 (save Tk 2500)</option>
                      <option value={15000}>White Diamond Tk 15000 (save Tk 4000)</option>
                      <option value={20000}>Red Diamond Tk 20000 (save Tk 6500)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Sender bKash Account</label>
                    <input className={fieldInputClass} value={subscriptionForm.senderbkashnumber} onChange={(e) => setSubscriptionForm((p) => ({ ...p, senderbkashnumber: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Transaction ID</label>
                    <input className={fieldInputClass} value={subscriptionForm.transactionid} onChange={(e) => setSubscriptionForm((p) => ({ ...p, transactionid: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Screenshot Proof</label>
                    <input type="file" className="text-xs text-zinc-500 mt-2" onChange={(e) => setSubscriptionForm((p) => ({ ...p, paymentss: e.target.files?.[0] || null }))} />
                  </div>
                  <button className="w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs uppercase tracking-wider transition mt-2">
                    Request Subscription
                  </button>
                </form>
                {commission?.subscription && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs font-bold text-emerald-850 mt-3">
                    Active {commission.subscription.planname} balance: {formatMoney(commission.subscription.remainingcredit || 0)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Notifications */}
          {!loading && activeTab === "Notifications" && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-sm">
              <KhanNotificationInbox role="Seller" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const fieldInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-800 outline-none transition placeholder:text-zinc-450 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/10";

export default SellerDashboard;
