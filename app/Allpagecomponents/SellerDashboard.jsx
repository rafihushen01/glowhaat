
"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Image as ImageIcon, Truck, Sparkles, Calculator, Trash2, X, Flame, Copy, Pencil } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import SellerCategorySelector from "./SellerCategorySelector";
import KhanChatHub from "./KhanChatHub";
import KhanNotificationInbox from "./KhanNotificationInbox";

const TABS = ["Overview", "Shop", "Add Items", "My Items", "Orders", "Chats", "Sponsorship", "Commission", "Notifications"];
const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "returned", "canceled"];
const tabButton = (active) => `rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800 hover:border-emerald-500"}`;
const card = "rounded-2xl border border-emerald-200 bg-white p-4 md:p-5";
const input = "mt-1 h-11 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500";
const textarea = "mt-1 min-h-[84px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
const badge = (ok) => `inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`;
const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
};

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
  const user = userData?.user || userData?.data || userData || null;
  const role = String(user?.role || "");

  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [bootstrap, setBootstrap] = useState(null);
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [commission, setCommission] = useState(null);
  const [notifications, setNotifications] = useState([]);

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
        setShopForm((prev) => ({ ...prev, shopname: currentShop.shopname || "", description: currentShop.description || "", contactemail: currentShop.contactemail || "", contactphone: currentShop.contactphone || "", address: currentShop.address || "" }));
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

  const sortedItems = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [items]);
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
      setNotice("Order details copied for delivery booking.");
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
      Object.entries(shopForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const { data } = await axios.post(`${serverurl}/seller/panel/shop`, fd, getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Shop create failed");
      setNotice("Shop created successfully. You can now add items.");
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
      setError("Shop is frozen. Please clear commission first.");
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
      const { data } = await axios[method](endpoint, fd, getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Item save failed");
      setNotice(editItemId ? "Item updated." : "Item created.");
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
    if (!confirm("Delete this item?")) return;
    setError("");
    setNotice("");
    try {
      const { data } = await axios.delete(`${serverurl}/seller/panel/items/${itemid}`, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Delete failed");
      setNotice(data?.message || "Item deleted.");
      await loadAll();
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      const payload = err?.response?.data || {};
      if (status === 409 && payload?.requiresforce) {
        const pendingcount = Number(payload?.pendingordercount || 0);
        const force = confirm(
          `This product has ${pendingcount} order(s) in pending/processing status. If you continue, those orders will be canceled automatically. Continue force delete?`
        );
        if (!force) return;

        try {
          const forced = await axios.delete(
            `${serverurl}/seller/panel/items/${itemid}`,
            getRequestConfig({ timeout: 20000, params: { forcecancel: true } })
          );
          if (!forced?.data?.success) throw new Error(forced?.data?.message || "Force delete failed");
          setNotice(forced?.data?.message || "Item deleted with automatic order cancellation.");
          await loadAll();
          return;
        } catch (forcedErr) {
          setError(forcedErr?.response?.data?.message || forcedErr?.message || "Failed to force delete item.");
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
          options: Array.isArray(variant?.options)
            ? variant.options.map((option) => ({ ...option }))
            : [],
        }))
      : [];
    if (!variants.length) {
      setError("This item has no variant options. Please edit item variants first.");
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
      setNotice(nextstatus === "out_of_stock" ? "Item marked as out of stock." : "Item marked as in stock.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update stock state.");
    }
  };

  const handleOrderStatus = async (orderid, status) => {
    try {
      const { data } = await axios.patch(`${serverurl}/seller/panel/orders/${orderid}/status`, { status }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Status update failed");
      setNotice("Order status updated.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update order status.");
    }
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(sponsorForm).forEach(([k, v]) => { if (k !== "paymentss") fd.append(k, String(v || "")); });
      if (sponsorForm.paymentss) fd.append("paymentss", sponsorForm.paymentss);
      const { data } = await axios.post(`${serverurl}/seller/panel/sponsorships`, fd, getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Request failed");
      setNotice("Sponsorship request submitted.");
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
      const { data } = await axios.post(`${serverurl}/seller/panel/commission/submit`, fd, getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Commission submit failed");
      setNotice("Commission payment submitted.");
      setCommissionForm({ senderbkashnumber: "", transactionid: "", paymentss: null });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit commission payment.");
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
      const { data } = await axios.post(`${serverurl}/seller/panel/subscriptions`, fd, getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Subscription request failed");
      setNotice("Subscription request submitted.");
      setSubscriptionForm({ amount: 1000, senderbkashnumber: "", transactionid: "", paymentss: null });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed subscription request.");
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
      setError(err?.response?.data?.message || err?.message || "Failed to update notifications.");
    }
  };

  if (!user) return <div className="min-h-screen bg-white px-4 py-10 text-sm text-emerald-800">Please sign in first to continue.</div>;
  if (role !== "Seller") return null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#ffffff_25%,#f4fff9_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 md:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Glow Haat Seller Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Welcome, {user?.fullname || "Seller"}</h1>
          <p className="mt-2 text-sm text-emerald-800">Shop-first flow enabled. Create your shop, then manage products, orders, sponsorships, and commission.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={badge(!isFrozen)}>{isFrozen ? "Frozen" : "Active"}</span>
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-800">Health: {bootstrap?.health?.score ?? shop?.healthscore ?? 0}/100 ({bootstrap?.health?.level || "N/A"})</span>
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-800">bKash: {bootstrap?.bkashnumber || "01862623066"}</span>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {notice ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabButton(activeTab === tab)}>{tab}</button>)}
          <button type="button" className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800" onClick={loadAll}>Refresh</button>
        </div>

        {loading ? <div className="mt-6 text-sm text-emerald-800">Loading seller data...</div> : null}

        {!loading && activeTab === "Overview" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className={card}><p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Items</p><p className="mt-1 text-3xl font-semibold text-emerald-900">{bootstrap?.stats?.itemcount || 0}</p></div>
            <div className={card}><p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Orders</p><p className="mt-1 text-3xl font-semibold text-emerald-900">{bootstrap?.stats?.ordercount || 0}</p></div>
            <div className={card}><p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Pending Sponsorships</p><p className="mt-1 text-3xl font-semibold text-emerald-900">{bootstrap?.stats?.pendingSponsorships || 0}</p></div>
            <div className={card}><p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Unread Notices</p><p className="mt-1 text-3xl font-semibold text-emerald-900">{bootstrap?.stats?.unreadNotifications || 0}</p></div>
          </div>
        ) : null}

        {!loading && activeTab === "Shop" ? (
          <form className="mt-6 grid gap-4" onSubmit={handleCreateShop}>
            <div className={card}>
              <h2 className="text-xl font-semibold text-emerald-900">{hasShop ? "Shop Profile" : "Create Shop First"}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">Shop Name<input className={input} value={shopForm.shopname} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, shopname: e.target.value }))} required={!hasShop} /></label>
                <label className="text-sm">Contact Email<input className={input} value={shopForm.contactemail} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, contactemail: e.target.value }))} /></label>
                <label className="text-sm">Contact Phone<input className={input} value={shopForm.contactphone} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, contactphone: e.target.value }))} /></label>
                <label className="text-sm">Address<input className={input} value={shopForm.address} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, address: e.target.value }))} /></label>
                <label className="text-sm md:col-span-2">Description<textarea className={textarea} value={shopForm.description} disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, description: e.target.value }))} /></label>
                <label className="text-sm">Shop Profile Image<input type="file" className="mt-2 block w-full text-xs" disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, profileimage: e.target.files?.[0] || null }))} /></label>
                <label className="text-sm">Shop Banner Image<input type="file" className="mt-2 block w-full text-xs" disabled={hasShop} onChange={(e) => setShopForm((p) => ({ ...p, bannerimage: e.target.files?.[0] || null }))} /></label>
              </div>
              {!hasShop ? <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Create Shop</button> : null}
            </div>
          </form>
        ) : null}

        {!loading && activeTab === "Add Items" ? (
          <form className="mt-6 grid gap-5" onSubmit={handleCreateItem}>
            <motion.div variants={itemVars} initial="hidden" animate="visible" className="rounded-3xl border border-emerald-200 bg-[linear-gradient(160deg,#ffffff_0%,#f2fff7_45%,#ebfff4_100%)] p-5 md:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-dashed border-emerald-200 pb-4">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Package size={18} /></div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">{editItemId ? "Edit Seller Item" : "Seller Item Studio"}</h2>
                  <p className="text-sm text-emerald-700">Glow Haat Seller Item Managment Panel</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm">Product Name<input className={input} value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} required /></label>
                <label className="text-sm">Brand<input className={input} value={itemForm.brand} onChange={(e) => setItemForm((p) => ({ ...p, brand: e.target.value }))} /></label>
                <label className="text-sm">Type<input className={input} value={itemForm.type} onChange={(e) => setItemForm((p) => ({ ...p, type: e.target.value }))} /></label>
                <label className="text-sm">Category Path<input className={input} value={itemForm.categorypath} onChange={(e) => setItemForm((p) => ({ ...p, categorypath: e.target.value }))} /></label>
                <label className="text-sm md:col-span-2">Description<textarea className={textarea} value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} /></label>
                <label className="text-sm md:col-span-2">Highlights<textarea className={textarea} value={itemForm.highlight} onChange={(e) => setItemForm((p) => ({ ...p, highlight: e.target.value }))} /></label>
                <label className="text-sm md:col-span-2">Product Story<textarea className={textarea} value={itemForm.aboutitems} onChange={(e) => setItemForm((p) => ({ ...p, aboutitems: e.target.value }))} /></label>

                <div className="md:col-span-2">
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

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.flashsale} onChange={(e) => setItemForm((p) => ({ ...p, flashsale: e.target.checked }))} />Flash Sale</label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.eidsale} onChange={(e) => setItemForm((p) => ({ ...p, eidsale: e.target.checked }))} />Eid Sale</label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.coustomsale} onChange={(e) => setItemForm((p) => ({ ...p, coustomsale: e.target.checked }))} />Custom Sale</label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.isreturnable} onChange={(e) => setItemForm((p) => ({ ...p, isreturnable: e.target.checked }))} />Returnable</label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.warrantynotavalible} onChange={(e) => setItemForm((p) => ({ ...p, warrantynotavalible: e.target.checked }))} />No Warranty</label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.isperishable} onChange={(e) => setItemForm((p) => ({ ...p, isperishable: e.target.checked }))} />Perishable</label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.isactive} onChange={(e) => setItemForm((p) => ({ ...p, isactive: e.target.checked }))} />Active</label>
              </div>
            </motion.div>

            <motion.div variants={itemVars} initial="hidden" animate="visible" className="rounded-3xl border border-emerald-200 bg-white p-5 md:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><ImageIcon size={18} /></div>
                <h3 className="text-lg font-semibold text-emerald-900">Media</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm">Main Image<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => handleWhiteImageChange(e.target.files?.[0] || null)} /></label>
                <label className="text-sm">Hover Image<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => handleHoverImageChange(e.target.files?.[0] || null)} /></label>
                <label className="text-sm md:col-span-2">Gallery<input type="file" multiple className="mt-2 block w-full text-xs" onChange={(e) => handleGalleryChange(e.target.files)} /></label>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
                  {mediaPreview.whiteimage ? <img src={mediaPreview.whiteimage} alt="Main preview" className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">Main Preview</div>}
                </div>
                <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
                  {mediaPreview.hoverimage ? <img src={mediaPreview.hoverimage} alt="Hover preview" className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">Hover Preview</div>}
                </div>
                {(mediaPreview.gallery || []).slice(0, 2).map((image, idx) => (
                  <div key={`${image}-${idx}`} className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
                    <img src={image} alt={`Gallery preview ${idx + 1}`} className="h-28 w-full object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVars} initial="hidden" animate="visible" className="rounded-3xl border border-emerald-200 bg-white p-5 md:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Truck size={18} /></div>
                <h3 className="text-lg font-semibold text-emerald-900">Logistics</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm">Delivery Name<input className={input} value={itemForm.deliveryschema.name} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, name: e.target.value } }))} /></label>
                <label className="text-sm">Delivery Time<input className={input} value={itemForm.deliveryschema.deliverytime} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, deliverytime: e.target.value } }))} /></label>
                <label className="text-sm">Delivery Charge<input type="number" className={input} value={itemForm.deliveryschema.deliverycharge} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, deliverycharge: e.target.value } }))} /></label>
                <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><input type="checkbox" checked={itemForm.deliveryschema.isfreeshipping} onChange={(e) => setItemForm((p) => ({ ...p, deliveryschema: { ...p.deliveryschema, isfreeshipping: e.target.checked } }))} />Free Shipping</label>
              </div>
            </motion.div>

            <motion.div variants={itemVars} initial="hidden" animate="visible" className="rounded-3xl border border-emerald-200 bg-white p-5 md:p-7">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Sparkles size={18} /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">Variant Engine</h3>
                    <p className="text-sm text-emerald-700">Advanced price/stock options with image slots.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input type="number" className="h-10 w-20 rounded-lg border border-emerald-200 px-2 text-center text-sm" value={groupCount} onChange={(e) => setGroupCount(e.target.value)} />
                  <button type="button" onClick={() => createVariantGroups(groupCount)} className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white">Generate</button>
                </div>
              </div>

              <div className="space-y-5">
                <AnimatePresence>
                  {itemForm.variants.map((variant, vIndex) => (
                    <motion.div key={vIndex} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                          <label className="text-xs">Variant Name<input className={input} value={variant.name} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].name = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                          <label className="text-xs">Type<input className={input} value={variant.varianttype} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].varianttype = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                          <label className="text-xs">Color<input type="color" className="mt-1 h-11 w-full rounded-xl border border-emerald-200 bg-white p-2" value={variant.colorHex || "#10b981"} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].colorHex = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                          <label className="text-xs">Image Slots<input type="number" className={input} value={variant.imageSlots} onChange={(e) => setVariantImageSlots(vIndex, e.target.value)} /></label>
                        </div>
                        <button type="button" onClick={() => removeVariant(vIndex)} className="self-end rounded-xl bg-red-500/10 p-3 text-red-600 hover:bg-red-500 hover:text-white"><Trash2 size={16} /></button>
                      </div>

                      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                        {Array.from({ length: variant.imageSlots || 4 }).map((_, slotIdx) => (
                          <label key={slotIdx} className="relative flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-emerald-300 bg-white md:h-20 md:w-20">
                            {variantPreviews[vIndex]?.[slotIdx] ? (
                              <Image
                                src={variantPreviews[vIndex][slotIdx]}
                                alt={`Variant ${vIndex + 1} image ${slotIdx + 1}`}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : <span className="text-[10px] text-emerald-600">{slotIdx + 1}</span>}
                            <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => handleVariantImageUpload(e, vIndex, slotIdx)} />
                          </label>
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto rounded-xl border border-emerald-200 md:block">
                        <table className="w-full text-left">
                          <thead className="bg-emerald-50 text-xs uppercase text-emerald-700">
                            <tr>
                              <th className="p-3">Option</th>
                              <th className="p-3">Base</th>
                              <th className="p-3">Discount%</th>
                              <th className="p-3">Final</th>
                              <th className="p-3">Stock</th>
                              <th className="p-3">SKU</th>
                              <th className="p-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {variant.options.map((opt, oIndex) => (
                              <tr key={oIndex} className="border-t border-emerald-100">
                                <td className="p-2"><input className={input} value={opt.name} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].name = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                <td className="p-2"><input type="number" className={input} value={opt.baseprice} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].baseprice = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                <td className="p-2"><input type="number" className={input} value={opt.discountpercentage} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].discountpercentage = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                <td className="p-2"><div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-emerald-800">Tk {calculateFinalPrice(opt.baseprice, opt.discountpercentage)}</div></td>
                                <td className="p-2"><input type="number" className={input} value={opt.stock} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].stock = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                <td className="p-2"><input className={input} value={opt.skucode} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].skucode = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></td>
                                <td className="p-2"><button type="button" className="p-2 text-red-500" onClick={() => { const arr = [...itemForm.variants]; arr[vIndex].options.splice(oIndex, 1); setItemForm({ ...itemForm, variants: arr }); }}><X size={15} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 space-y-3 md:hidden">
                        {variant.options.map((opt, oIndex) => (
                          <div key={oIndex} className="rounded-xl border border-emerald-200 bg-white p-3">
                            <div className="grid grid-cols-2 gap-3">
                              <label className="col-span-2 text-xs">Option Name<input className={input} value={opt.name} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].name = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                              <label className="text-xs">Base<input type="number" className={input} value={opt.baseprice} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].baseprice = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                              <label className="text-xs">Discount<input type="number" className={input} value={opt.discountpercentage} onChange={(e) => { const arr = [...itemForm.variants]; arr[vIndex].options[oIndex].discountpercentage = e.target.value; setItemForm({ ...itemForm, variants: arr }); }} /></label>
                            </div>
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-100/70 p-2 text-xs font-bold text-emerald-800">
                              <span className="inline-flex items-center gap-1"><Calculator size={13} /> Final Price</span>
                              <span>Tk {calculateFinalPrice(opt.baseprice, opt.discountpercentage)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={() => addOption(vIndex)} className="mt-4 w-full rounded-xl border border-dashed border-emerald-400 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100/70">+ Add Option</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="sticky bottom-0 z-30 rounded-2xl border border-emerald-300 bg-white/90 p-4 backdrop-blur">
              <div className="flex flex-wrap justify-end gap-3">
                <button disabled={!hasShop || isFrozen} className="rounded-xl bg-emerald-700 px-6 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60">{editItemId ? "Update Item" : "Publish Item"}</button>
                {editItemId ? <button type="button" onClick={() => { setEditItemId(""); setItemForm(defaultItemForm); setVariantPreviews({}); setItemFiles({ whiteimage: null, hoverimage: null, gallery: [] }); setMediaPreview({ whiteimage: "", hoverimage: "", gallery: [] }); }} className="rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">Cancel Edit</button> : null}
              </div>
            </div>
          </form>
        ) : null}

        {!loading && activeTab === "My Items" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedItems.length === 0 ? <div className={`${card} sm:col-span-2 xl:col-span-3`}>No items found.</div> : sortedItems.map((item) => {
              const stock = getItemStockStats(item);
              const primaryImage = item?.whiteimage || item?.hoverimage || "";
              const hoverImage = item?.hoverimage || item?.whiteimage || "";

              return (
                <div key={item._id} className="group overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition hover:shadow-lg">
                  <div className="relative aspect-[4/5] overflow-hidden bg-emerald-50">
                    {primaryImage ? (
                      <img src={primaryImage} alt={item?.name || "Item"} className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${hoverImage ? "group-hover:opacity-0" : ""}`} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">No Image</div>
                    )}
                    {hoverImage ? (
                      <img src={hoverImage} alt={`${item?.name || "Item"} hover`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-300 group-hover:opacity-100" />
                    ) : null}

                    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${stock.instock ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                        {stock.instock ? "In Stock" : "Out of Stock"}
                      </span>
                      {stock.lowstock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                          <Flame size={12} /> Low
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute inset-x-3 bottom-3 z-10 grid grid-cols-2 gap-2 rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur transition md:translate-y-8 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleQuickStockStatus(item, stock.instock ? "out_of_stock" : "in_stock")}
                        className="rounded-lg border border-emerald-300 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                      >
                        {stock.instock ? "Set Out" : "Set In"}
                      </button>
                      <button type="button" onClick={() => handleEditPick(item)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800"><Pencil size={12} /> Edit</button>
                      <button type="button" onClick={() => handleDeleteItem(item._id)} className="col-span-2 rounded-lg border border-red-300 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700">Delete Item</button>
                    </div>
                  </div>

                  <div className="space-y-1 p-4">
                    <p className="line-clamp-1 text-base font-semibold text-emerald-900">{item?.name}</p>
                    <p className="line-clamp-1 text-xs text-emerald-700">{item?.categorypath || "No category"}</p>
                    <div className="flex items-center justify-between pt-1 text-xs text-emerald-800">
                      <span>Stock: {stock.totalstock}</span>
                      <span>{item?.isactive ? "Visible" : "Hidden"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && activeTab === "Orders" ? (
          <div className="mt-6 grid gap-4">
            {orders.length === 0 ? <div className={card}>No seller orders yet.</div> : orders.map((order) => {
              const context = getOrderContext(order);
              const shippingAddress = formatShippingAddress(context.shipping);
              return (
                <div key={order._id} className={card}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-emerald-900">{order.ordernumber} - {order.item?.name}</p>
                      <p className="mt-1 text-xs text-emerald-700">Created: {formatDateTime(context.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${order.status === "canceled" ? "bg-red-100 text-red-700" : order.status === "delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {order.status}
                      </span>
                      <button type="button" onClick={() => copySteadfastDetails(order)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
                        <Copy size={13} /> Copy Steadfast
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <div className="flex gap-3">
                        {order?.item?.image ? <img src={order.item.image} alt={order?.item?.name || "Ordered item"} className="h-20 w-20 rounded-lg border border-emerald-200 object-cover" /> : null}
                        <div className="space-y-1 text-xs text-emerald-800">
                          <p><b>Product:</b> {order?.item?.name || "N/A"}</p>
                          <p><b>Variant:</b> {order?.item?.variantname || "-"}</p>
                          <p><b>Option:</b> {order?.item?.optionname || "-"}</p>
                          <p><b>Quantity:</b> {Number(order?.item?.quantity || 0)}</p>
                          <p><b>Total:</b> {formatMoney(order?.item?.totalprice || 0)}</p>
                          <p><b>Delivery Charge:</b> {formatMoney(order?.item?.deliverycharge || 0)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-white p-3 text-xs text-emerald-800">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Delivery Details (Steadfast Ready)</p>
                      <div className="mt-2 space-y-1">
                        <p><b>Name:</b> {context.customer?.fullname || "N/A"}</p>
                        <p><b>Mobile:</b> {context.customer?.mobile || "N/A"}</p>
                        <p><b>Email:</b> {context.customer?.email || "N/A"}</p>
                        <p><b>District:</b> {context.shipping?.district || "N/A"}</p>
                        <p><b>City:</b> {context.shipping?.city || "N/A"}</p>
                        <p><b>Upzilla:</b> {context.shipping?.upzilla || "N/A"}</p>
                        <p><b>Area:</b> {context.shipping?.area || "N/A"}</p>
                        <p><b>Landmark:</b> {context.shipping?.landmark || "N/A"}</p>
                        <p><b>Address:</b> {shippingAddress || "N/A"}</p>
                        <p><b>Payment:</b> {(context.payment?.method || "cod").toUpperCase()}</p>
                        <p><b>Payment Ref:</b> {context.payment?.reference || "-"}</p>
                        <p><b>Customer Note:</b> {context.note || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ORDER_STATUSES.map((status) => <button key={status} type="button" disabled={isFrozen || order.status === status} onClick={() => handleOrderStatus(order._id, status)} className={tabButton(order.status === status)}>{status}</button>)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && activeTab === "Chats" ? (
          <div className="mt-6">
            <KhanChatHub embedded />
          </div>
        ) : null}

        {!loading && activeTab === "Sponsorship" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <form className={card} onSubmit={handleSponsorSubmit}>
              <h2 className="text-xl font-semibold text-emerald-900">Request Item Sponsorship</h2>
              <p className="mt-1 text-sm text-emerald-700">Every Tk 100 gives 7 days. Over Tk 1000 gives 120 days top priority.</p>
              <label className="mt-3 block text-sm">Select Item<select className={input} value={sponsorForm.itemid} onChange={(e) => setSponsorForm((p) => ({ ...p, itemid: e.target.value }))} required><option value="">Select</option>{items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
              <label className="mt-3 block text-sm">Amount: Tk {sponsorForm.amount}<input type="range" min={100} max={2000} step={100} className="mt-2 w-full" value={sponsorForm.amount} onChange={(e) => setSponsorForm((p) => ({ ...p, amount: Number(e.target.value) }))} /></label>
              <label className="mt-3 block text-sm">Sender bKash Number<input className={input} value={sponsorForm.senderbkashnumber} onChange={(e) => setSponsorForm((p) => ({ ...p, senderbkashnumber: e.target.value }))} required /></label>
              <label className="mt-3 block text-sm">Transaction ID<input className={input} value={sponsorForm.transactionid} onChange={(e) => setSponsorForm((p) => ({ ...p, transactionid: e.target.value }))} required /></label>
              <label className="mt-3 block text-sm">Payment Screenshot (optional)<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => setSponsorForm((p) => ({ ...p, paymentss: e.target.files?.[0] || null }))} /></label>
              <p className="mt-3 text-xs text-emerald-700">Send payment to Khan bKash: <b>{bootstrap?.bkashnumber || "01862623066"}</b></p>
              <button disabled={isFrozen || !hasShop} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60">Submit Sponsorship</button>
            </form>
            <div className={card}>
              <h3 className="text-lg font-semibold text-emerald-900">Sponsorship Requests</h3>
              <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {sponsorships.length === 0 ? <p className="text-sm text-emerald-700">No sponsorship requests yet.</p> : sponsorships.map((s) => <div key={s._id} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-sm font-semibold text-emerald-900">{s.itemid?.name || "Item"}</p><p className="text-xs text-emerald-700">Tk {s.amount} | {s.sponsoreddays} days | {s.status}</p>{s.status === "Verified" ? <p className="mt-1 text-xs text-emerald-700">Active until: {s.endsat ? new Date(s.endsat).toLocaleDateString() : "N/A"}</p> : null}</div>)}
              </div>
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "Commission" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className={card}>
              <h2 className="text-xl font-semibold text-emerald-900">Khan Commission</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs uppercase tracking-[0.1em] text-emerald-700">Delivered Total</p><p className="mt-1 text-xl font-semibold text-emerald-900">Tk {Number(commission?.payment?.totaldeliveredamount || 0).toFixed(2)}</p></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs uppercase tracking-[0.1em] text-emerald-700">Commission</p><p className="mt-1 text-xl font-semibold text-emerald-900">Tk {Number(commission?.payment?.commissionamount || 0).toFixed(2)}</p></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs uppercase tracking-[0.1em] text-emerald-700">Rate</p><p className="mt-1 text-xl font-semibold text-emerald-900">{Number(commission?.commission?.percent || 0)}%</p></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs uppercase tracking-[0.1em] text-emerald-700">Status</p><p className="mt-1 text-xl font-semibold text-emerald-900">{commission?.payment?.status || "N/A"}</p></div>
              </div>
              <form className="mt-4 border-t border-emerald-100 pt-4" onSubmit={handleCommissionSubmit}>
                <p className="text-xs text-emerald-700">Pay to bKash: {commission?.bkashnumber || "01862623066"}</p>
                <label className="mt-3 block text-sm">Sender bKash Number<input className={input} value={commissionForm.senderbkashnumber} onChange={(e) => setCommissionForm((p) => ({ ...p, senderbkashnumber: e.target.value }))} required /></label>
                <label className="mt-3 block text-sm">Transaction ID<input className={input} value={commissionForm.transactionid} onChange={(e) => setCommissionForm((p) => ({ ...p, transactionid: e.target.value }))} required /></label>
                <label className="mt-3 block text-sm">Payment Screenshot<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => setCommissionForm((p) => ({ ...p, paymentss: e.target.files?.[0] || null }))} /></label>
                <button className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Send Payment Proof</button>
              </form>
            </div>
            <div className={`${card} space-y-4`}>
              <h3 className="text-lg font-semibold text-emerald-900">Subscription Savings</h3>
              <form onSubmit={handleSubscriptionSubmit}>
                <label className="text-sm">Plan Amount<select className={input} value={subscriptionForm.amount} onChange={(e) => setSubscriptionForm((p) => ({ ...p, amount: Number(e.target.value) }))}><option value={1000}>Bronze Tk 1000 (save Tk 300)</option><option value={5000}>Silver Tk 5000 (save Tk 1000)</option><option value={10000}>Golden Tk 10000 (save Tk 2500)</option><option value={15000}>White Diamond Tk 15000 (save Tk 4000)</option><option value={20000}>Red Diamond Tk 20000 (save Tk 6500)</option></select></label>
                <label className="mt-3 block text-sm">Sender bKash Number<input className={input} value={subscriptionForm.senderbkashnumber} onChange={(e) => setSubscriptionForm((p) => ({ ...p, senderbkashnumber: e.target.value }))} required /></label>
                <label className="mt-3 block text-sm">Transaction ID<input className={input} value={subscriptionForm.transactionid} onChange={(e) => setSubscriptionForm((p) => ({ ...p, transactionid: e.target.value }))} required /></label>
                <label className="mt-3 block text-sm">Payment Screenshot<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => setSubscriptionForm((p) => ({ ...p, paymentss: e.target.files?.[0] || null }))} /></label>
                <button className="mt-4 rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">Request Subscription</button>
              </form>
              {commission?.subscription ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">Active {commission.subscription.planname} balance: Tk {Number(commission.subscription.remainingcredit || 0).toFixed(2)}</div> : null}
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "Notifications" ? (
          <div className="mt-6">
            <KhanNotificationInbox role="Seller" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SellerDashboard;

