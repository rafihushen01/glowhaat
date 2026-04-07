
"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import SellerCategorySelector from "./SellerCategorySelector";

const TABS = ["Overview", "Shop", "Add Items", "My Items", "Orders", "Sponsorship", "Commission", "Notifications"];
const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "returned", "canceled"];
const tabButton = (active) => `rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800 hover:border-emerald-500"}`;
const card = "rounded-2xl border border-emerald-200 bg-white p-4 md:p-5";
const input = "mt-1 h-11 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500";
const textarea = "mt-1 min-h-[84px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";
const badge = (ok) => `inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`;

const defaultItemForm = {
  name: "",
  description: "",
  highlight: "",
  aboutitems: "",
  brand: "",
  categorypath: "Beauty > General",
  categoryids: "[]",
  categorytree: "[]",
  type: "fashion",
  deliveryname: "Standard Delivery",
  deliverytime: "3-5 Days",
  deliverycharge: 60,
  isfreeshipping: false,
  variants: '[{"name":"Default","varianttype":"Type","images":[],"options":[{"name":"Standard","baseprice":0,"discountpercentage":0,"stock":50,"skucode":""}]}]',
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
      Object.entries(itemForm).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : String(v || "")));
      if (itemFiles.whiteimage) fd.append("whiteimage", itemFiles.whiteimage);
      if (itemFiles.hoverimage) fd.append("hoverimage", itemFiles.hoverimage);
      (itemFiles.gallery || []).forEach((file) => fd.append("gallery", file));
      const endpoint = editItemId ? `${serverurl}/seller/panel/items/${editItemId}` : `${serverurl}/seller/panel/items`;
      const method = editItemId ? "patch" : "post";
      const { data } = await axios[method](endpoint, fd, getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }));
      if (!data?.success) throw new Error(data?.message || "Item save failed");
      setNotice(editItemId ? "Item updated." : "Item created.");
      setItemForm(defaultItemForm);
      setItemFiles({ whiteimage: null, hoverimage: null, gallery: [] });
      setEditItemId("");
      await loadAll();
      setActiveTab("My Items");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save item.");
    }
  };
  const handleEditPick = (item) => {
    setEditItemId(item._id);
    setItemForm((prev) => ({
      ...prev,
      name: item.name || "",
      description: item.description || "",
      highlight: item.highlight || "",
      aboutitems: item.aboutitems || "",
      brand: item.brand || "",
      categorypath: item.categorypath || "",
      categoryids: JSON.stringify(item.categoryids || []),
      categorytree: JSON.stringify(item.categorytree || []),
      type: item.type || "fashion",
      deliveryname: item.deliveryschema?.name || "Standard Delivery",
      deliverytime: item.deliveryschema?.deliverytime || "3-5 Days",
      deliverycharge: item.deliveryschema?.deliverycharge || 60,
      isfreeshipping: Boolean(item.deliveryschema?.isfreeshipping),
      variants: JSON.stringify(item.variants || []),
    }));
    setActiveTab("Add Items");
  };

  const handleDeleteItem = async (itemid) => {
    if (!confirm("Delete this item?")) return;
    setError("");
    setNotice("");
    try {
      const { data } = await axios.delete(`${serverurl}/seller/panel/items/${itemid}`, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Delete failed");
      setNotice("Item deleted.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete item.");
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
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">KhanCosmetics Seller Dashboard</p>
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
          <form className="mt-6 grid gap-4" onSubmit={handleCreateItem}>
            <div className={card}>
              <h2 className="text-xl font-semibold text-emerald-900">{editItemId ? "Edit Item" : "Add New Item"}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">Item Name<input className={input} value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} required /></label>
                <label className="text-sm">Brand<input className={input} value={itemForm.brand} onChange={(e) => setItemForm((p) => ({ ...p, brand: e.target.value }))} /></label>
                <label className="text-sm">Category Path<input className={input} value={itemForm.categorypath} onChange={(e) => setItemForm((p) => ({ ...p, categorypath: e.target.value }))} /></label>
                <label className="text-sm">Category IDs JSON<input className={input} value={itemForm.categoryids} readOnly /></label>
                <label className="text-sm">Category Tree JSON<input className={input} value={itemForm.categorytree} readOnly /></label>
                <label className="text-sm">Variants JSON<textarea className={textarea} value={itemForm.variants} onChange={(e) => setItemForm((p) => ({ ...p, variants: e.target.value }))} /></label>
                <label className="text-sm md:col-span-2">Description<textarea className={textarea} value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} /></label>
                <label className="text-sm">Main Image<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => setItemFiles((p) => ({ ...p, whiteimage: e.target.files?.[0] || null }))} /></label>
                <label className="text-sm">Hover Image<input type="file" className="mt-2 block w-full text-xs" onChange={(e) => setItemFiles((p) => ({ ...p, hoverimage: e.target.files?.[0] || null }))} /></label>
                <label className="text-sm md:col-span-2">Gallery<input type="file" multiple className="mt-2 block w-full text-xs" onChange={(e) => setItemFiles((p) => ({ ...p, gallery: Array.from(e.target.files || []) }))} /></label>
                <div className="md:col-span-2">
                  <SellerCategorySelector
                    onSelect={(cat) =>
                      setItemForm((p) => ({
                        ...p,
                        categoryids: JSON.stringify(Array.isArray(cat?.ids) ? cat.ids : []),
                        categorytree: JSON.stringify(Array.isArray(cat?.names) ? cat.names : []),
                        categorypath: cat?.path || "",
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button disabled={!hasShop || isFrozen} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60">{editItemId ? "Update Item" : "Publish Item"}</button>
                {editItemId ? <button type="button" onClick={() => { setEditItemId(""); setItemForm(defaultItemForm); }} className="rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">Cancel Edit</button> : null}
              </div>
            </div>
          </form>
        ) : null}

        {!loading && activeTab === "My Items" ? (
          <div className="mt-6 grid gap-3">
            {sortedItems.length === 0 ? <div className={card}>No items found.</div> : sortedItems.map((item) => (
              <div key={item._id} className={card}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-emerald-900">{item.name}</p>
                    <p className="text-xs text-emerald-700">{item.categorypath || "No category"}</p>
                    <p className="mt-1 text-xs text-emerald-700">Status: {item.isactive ? "Active" : "Hidden"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEditPick(item)} className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800">Edit</button>
                    <button type="button" onClick={() => handleDeleteItem(item._id)} className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-700">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && activeTab === "Orders" ? (
          <div className="mt-6 grid gap-3">
            {orders.length === 0 ? <div className={card}>No seller orders yet.</div> : orders.map((order) => (
              <div key={order._id} className={card}>
                <p className="text-sm font-semibold text-emerald-900">{order.ordernumber} - {order.item?.name}</p>
                <p className="mt-1 text-xs text-emerald-700">Customer: {order.customer?.fullname || "N/A"} | Qty: {order.item?.quantity || 0} | Total: Tk {Number(order.item?.totalprice || 0).toFixed(2)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((status) => <button key={status} type="button" disabled={isFrozen || order.status === status} onClick={() => handleOrderStatus(order._id, status)} className={tabButton(order.status === status)}>{status}</button>)}
                </div>
              </div>
            ))}
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
          <div className="mt-6 grid gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800"
              >
                Mark All Read
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className={card}>No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`${card} ${n.isread ? "" : "border-emerald-400 bg-emerald-50"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {n.title} {!n.isread ? <span className="ml-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] text-white">New</span> : null}
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">{n.message}</p>
                      <p className="mt-1 text-xs text-emerald-600">{new Date(n.createdAt).toLocaleString()} | {n.type}</p>
                    </div>
                    {!n.isread ? (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n._id)}
                        className="rounded-xl border border-emerald-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                      >
                        Mark Read
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SellerDashboard;
