"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BadgeCheck,
  Download,
  Eye,
  Filter,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Store,
  Trash2,
  UploadCloud,
} from "lucide-react";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";

const TABS = ["Shop Management", "Badge Management", "Creative Assets"];
const tabButton = (active) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
    active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800"
  }`;
const card = "rounded-2xl border border-emerald-200 bg-white p-4";
const input = "mt-1 h-10 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500";

const formatFileSize = (bytes = 0) => {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let current = value;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`;
};

const SuperAdminShopManagementCenter = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [activeTab, setActiveTab] = useState("Shop Management");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [shopLoading, setShopLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [shopPage, setShopPage] = useState(1);
  const [shopPages, setShopPages] = useState(1);
  const [shopCount, setShopCount] = useState(0);
  const [shopQuery, setShopQuery] = useState("");
  const [shopSort, setShopSort] = useState("newest");
  const [shopFilter, setShopFilter] = useState("all");
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedShopBadgeIds, setSelectedShopBadgeIds] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");

  const [badgeLoading, setBadgeLoading] = useState(true);
  const [badgeTypes, setBadgeTypes] = useState([]);
  const [badges, setBadges] = useState([]);
  const [badgePage, setBadgePage] = useState(1);
  const [badgePages, setBadgePages] = useState(1);
  const [badgeStatus, setBadgeStatus] = useState("all");
  const [badgeTypeFilter, setBadgeTypeFilter] = useState("");
  const [badgeQuery, setBadgeQuery] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newBadgeForm, setNewBadgeForm] = useState({
    name: "",
    description: "",
    typekey: "shop",
    priority: 100,
  });
  const [newBadgeImage, setNewBadgeImage] = useState(null);

  const [assetLoading, setAssetLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetKind, setAssetKind] = useState("");
  const [assetFiles, setAssetFiles] = useState([]);
  const [assetTitle, setAssetTitle] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [assetEditMap, setAssetEditMap] = useState({});

  const badgeMap = useMemo(() => {
    const map = new Map();
    badges.forEach((badge) => map.set(String(badge._id), badge));
    return map;
  }, [badges]);

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const loadShops = async (page = shopPage) => {
    setShopLoading(true);
    try {
      const { data } = await axios.get(
        `${serverurl}/seller/admin/panel/shop-management`,
        getRequestConfig({
          params: {
            page,
            limit: 20,
            q: shopQuery,
            sort: shopSort,
            filter: shopFilter,
          },
          timeout: 30000,
        })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to load shops.");
      setShops(Array.isArray(data?.shops) ? data.shops : []);
      setShopPage(Number(data?.page || page || 1));
      setShopPages(Number(data?.pages || 1));
      setShopCount(Number(data?.count || 0));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load shop management.");
    } finally {
      setShopLoading(false);
    }
  };

  const loadShopDetail = async (shopId) => {
    try {
      const { data } = await axios.get(
        `${serverurl}/seller/admin/panel/shop-management/${shopId}`,
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to load shop detail.");
      const detail = data?.shop || null;
      setSelectedShop(detail);
      setSelectedShopBadgeIds((detail?.badges || []).map((badge) => String(badge?._id || "")));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load shop detail.");
    }
  };

  const loadBadgeTypes = async () => {
    const { data } = await axios.get(`${serverurl}/seller/admin/panel/badge-types`, getRequestConfig({ timeout: 30000 }));
    if (!data?.success) throw new Error(data?.message || "Failed to load badge types.");
    setBadgeTypes(Array.isArray(data?.types) ? data.types : []);
  };

  const loadBadges = async (page = badgePage) => {
    setBadgeLoading(true);
    try {
      const { data } = await axios.get(
        `${serverurl}/seller/admin/panel/badges`,
        getRequestConfig({
          params: {
            page,
            limit: 60,
            q: badgeQuery,
            status: badgeStatus,
            typekey: badgeTypeFilter,
          },
          timeout: 30000,
        })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to load badges.");
      const rows = Array.isArray(data?.badges) ? data.badges : [];
      setBadges(rows);
      setBadgePage(Number(data?.page || page || 1));
      setBadgePages(Number(data?.pages || 1));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load badges.");
    } finally {
      setBadgeLoading(false);
    }
  };

  const loadAssets = async () => {
    setAssetLoading(true);
    try {
      const { data } = await axios.get(
        `${serverurl}/seller/admin/panel/creative-assets`,
        getRequestConfig({ params: { q: assetQuery, filekind: assetKind, page: 1, limit: 120 }, timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to load assets.");
      const rows = Array.isArray(data?.assets) ? data.assets : [];
      setAssets(rows);
      const next = {};
      rows.forEach((row) => {
        next[row._id] = { title: row.title || "", notes: row.notes || "" };
      });
      setAssetEditMap(next);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load creative assets.");
    } finally {
      setAssetLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadShops(1);
    loadBadgeTypes().catch((err) => setError(err?.response?.data?.message || err?.message || "Failed to load badge types."));
    loadBadges(1);
    loadAssets();
  }, [isSuperAdmin]);

  const refreshAll = async () => {
    clearMessages();
    await Promise.all([loadShops(shopPage), loadBadges(badgePage), loadAssets(), loadBadgeTypes()]);
  };

  const saveShopBadges = async () => {
    if (!selectedShop?._id) return;
    clearMessages();
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/admin/panel/shop-management/${selectedShop._id}/badges`,
        { badgeids: selectedShopBadgeIds },
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to save shop badges.");
      setNotice("Shop badges updated.");
      await loadShopDetail(selectedShop._id);
      await loadShops(shopPage);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save shop badges.");
    }
  };

  const sendGlowHaatMessage = async () => {
    if (!selectedShop?._id || !adminMessage.trim()) return;
    clearMessages();
    try {
      const { data } = await axios.post(
        `${serverurl}/seller/admin/panel/shops/${selectedShop._id}/message`,
        { text: adminMessage.trim() },
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to send message.");
      setNotice("GlowHaat verified message sent to seller.");
      setAdminMessage("");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to send message.");
    }
  };

  const createBadgeType = async (event) => {
    event.preventDefault();
    if (!newTypeName.trim()) return;
    clearMessages();
    try {
      const { data } = await axios.post(
        `${serverurl}/seller/admin/panel/badge-types`,
        { name: newTypeName.trim() },
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to create badge type.");
      setNotice("Badge type created.");
      setNewTypeName("");
      await loadBadgeTypes();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create badge type.");
    }
  };

  const createBadge = async (event) => {
    event.preventDefault();
    if (!newBadgeForm.name.trim()) return;
    clearMessages();
    try {
      const fd = new FormData();
      fd.append("name", newBadgeForm.name.trim());
      fd.append("description", newBadgeForm.description || "");
      fd.append("typekey", newBadgeForm.typekey || "shop");
      fd.append("priority", String(newBadgeForm.priority || 100));
      if (newBadgeImage) fd.append("image", newBadgeImage);
      const { data } = await axios.post(
        `${serverurl}/seller/admin/panel/badges`,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to create badge.");
      setNotice("Badge created in draft mode.");
      setNewBadgeForm({ name: "", description: "", typekey: "shop", priority: 100 });
      setNewBadgeImage(null);
      await loadBadges(1);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create badge.");
    }
  };

  const toggleBadgeStatus = async (badgeId, nextActive) => {
    clearMessages();
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/admin/panel/badges/${badgeId}/status`,
        { isactive: nextActive },
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Status update failed.");
      setNotice(nextActive ? "Badge activated." : "Badge moved to draft.");
      await loadBadges(badgePage);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update badge status.");
    }
  };

  const uploadAssets = async (event) => {
    event.preventDefault();
    if (!assetFiles.length) return;
    clearMessages();
    try {
      const fd = new FormData();
      assetFiles.forEach((file) => fd.append("files", file));
      if (assetTitle.trim()) fd.append("title", assetTitle.trim());
      if (assetNotes.trim()) fd.append("notes", assetNotes.trim());
      const { data } = await axios.post(
        `${serverurl}/seller/admin/panel/creative-assets`,
        fd,
        getRequestConfig({ headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })
      );
      if (!data?.success) throw new Error(data?.message || "Upload failed.");
      setNotice(`Uploaded ${Number(data?.count || 0)} creative asset(s).`);
      setAssetFiles([]);
      setAssetTitle("");
      setAssetNotes("");
      await loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload assets.");
    }
  };

  const updateAsset = async (assetId) => {
    clearMessages();
    const patch = assetEditMap[assetId] || {};
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/admin/panel/creative-assets/${assetId}`,
        { title: patch.title || "", notes: patch.notes || "" },
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Asset update failed.");
      setNotice("Asset updated.");
      await loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update asset.");
    }
  };

  const deleteAsset = async (assetId) => {
    const ok = window.confirm("Delete this creative asset?");
    if (!ok) return;
    clearMessages();
    try {
      const { data } = await axios.delete(
        `${serverurl}/seller/admin/panel/creative-assets/${assetId}`,
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Asset delete failed.");
      setNotice("Asset deleted.");
      await loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete asset.");
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-emerald-800">Checking SuperAdmin session...</div>;
  }
  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <SuperAdminNav />
      <div className="mx-auto mt-6 max-w-7xl space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">GlowHaat SuperAdmin</p>
          <h1 className="mt-1 text-2xl font-semibold text-emerald-900">Shop Management + Badge Management + Creative Assets</h1>
          <p className="mt-2 text-sm text-emerald-700">
            Manage all shops with pagination/filter/search, configure badge drafts/activation/types, assign badges, and send verified GlowHaat messages.
          </p>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabButton(activeTab === tab)}>
              {tab}
            </button>
          ))}
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh All
          </button>
        </div>

        {activeTab === "Shop Management" ? (
          <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
            <div className={card}>
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[220px] flex-1 text-sm font-medium text-emerald-900">
                  Search Shop / Seller / Mobile
                  <input className={input} value={shopQuery} onChange={(event) => setShopQuery(event.target.value)} />
                </label>
                <label className="w-[170px] text-sm font-medium text-emerald-900">
                  Sort
                  <select className={input} value={shopSort} onChange={(event) => setShopSort(event.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="bestselling">Best Selling</option>
                    <option value="toprated">Top Rated</option>
                    <option value="lowreturn">Low Return Rate</option>
                  </select>
                </label>
                <label className="w-[170px] text-sm font-medium text-emerald-900">
                  Filter
                  <select className={input} value={shopFilter} onChange={(event) => setShopFilter(event.target.value)}>
                    <option value="all">All</option>
                    <option value="toprated">Top Rated Shops</option>
                    <option value="bestselling">Best Selling Shops</option>
                    <option value="lowreturn">Low Return Shops</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadShops(1)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
                >
                  <Filter className="h-3.5 w-3.5" /> Apply
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Total Shops: {shopCount} | Page: {shopPage}/{shopPages}
              </div>

              <div className="mt-3 space-y-2">
                {shopLoading ? <p className="text-sm text-emerald-700">Loading shops...</p> : null}
                {!shopLoading && shops.length === 0 ? <p className="text-sm text-emerald-700">No shops found.</p> : null}
                {!shopLoading &&
                  shops.map((shop) => (
                    <div key={shop._id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">{shop.shopname}</p>
                          <p className="text-xs text-emerald-700">
                            Seller: {shop?.seller?.fullname || "N/A"} | Mobile: {shop?.seller?.mobile || shop?.businessmobile || "N/A"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadShopDetail(shop._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-emerald-700 md:grid-cols-2">
                        <p>Products: {Number(shop?.metrics?.productcount || 0)}</p>
                        <p>Total Sold: {Number(shop?.metrics?.totalsold || 0)}</p>
                        <p>Avg Rating: {Number(shop?.metrics?.averagerating || 0).toFixed(2)}</p>
                        <p>Return Rate: {(Number(shop?.metrics?.returnrate || 0) * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={shopPage <= 1}
                  onClick={() => loadShops(shopPage - 1)}
                  className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={shopPage >= shopPages}
                  onClick={() => loadShops(shopPage + 1)}
                  className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className={card}>
              {!selectedShop ? (
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
                  Select a shop to manage badges, preview URLs, and verified GlowHaat messaging.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Selected Shop</p>
                    <p className="text-lg font-semibold text-emerald-900">{selectedShop?.shopname}</p>
                    <p className="text-xs text-emerald-700">Seller: {selectedShop?.sellerid?.fullname || "N/A"}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(selectedShop?.previewurls?.desktop || "", "_blank", "noopener,noreferrer")}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                    >
                      <Store className="h-3.5 w-3.5" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(selectedShop?.previewurls?.tablet || "", "_blank", "noopener,noreferrer")}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                    >
                      <Store className="h-3.5 w-3.5" /> Tablet
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(selectedShop?.previewurls?.mobile || "", "_blank", "noopener,noreferrer")}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                    >
                      <Store className="h-3.5 w-3.5" /> Mobile
                    </button>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Assign Badges</p>
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {badges.length === 0 ? (
                        <p className="text-xs text-emerald-700">No badges available.</p>
                      ) : (
                        badges.map((badge) => {
                          const checked = selectedShopBadgeIds.includes(String(badge._id));
                          return (
                            <label key={badge._id} className="flex items-center gap-2 text-xs text-emerald-800">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) =>
                                  setSelectedShopBadgeIds((prev) =>
                                    event.target.checked
                                      ? [...prev, String(badge._id)]
                                      : prev.filter((id) => id !== String(badge._id))
                                  )
                                }
                              />
                              {badge.name} ({badge.typekey || "shop"})
                            </label>
                          );
                        })
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={saveShopBadges}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> Save Badges
                    </button>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">GlowHaat Verified Message</p>
                    <textarea
                      className="mt-2 min-h-[90px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      value={adminMessage}
                      onChange={(event) => setAdminMessage(event.target.value)}
                      placeholder="Send alert, advice, policy warning, improvement note..."
                    />
                    <button
                      type="button"
                      onClick={sendGlowHaatMessage}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                    >
                      <Send className="h-3.5 w-3.5" /> Send Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "Badge Management" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-lg font-semibold text-emerald-900">Badge Types</h2>
              <form onSubmit={createBadgeType} className="mt-3 flex items-end gap-2">
                <label className="flex-1 text-sm font-medium text-emerald-900">
                  New Type Name
                  <input className={input} value={newTypeName} onChange={(event) => setNewTypeName(event.target.value)} />
                </label>
                <button className="inline-flex h-10 items-center rounded-xl bg-emerald-700 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                  Create
                </button>
              </form>
              <div className="mt-3 space-y-2">
                {badgeTypes.map((type) => (
                  <div key={type._id} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    {type.name} ({type.slug}) {type.isdefault ? "- default" : ""}
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h2 className="text-lg font-semibold text-emerald-900">Create Badge</h2>
              <form onSubmit={createBadge} className="mt-3 space-y-2">
                <label className="text-sm font-medium text-emerald-900">
                  Badge Title
                  <input
                    className={input}
                    value={newBadgeForm.name}
                    onChange={(event) => setNewBadgeForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </label>
                <label className="text-sm font-medium text-emerald-900">
                  Type
                  <select
                    className={input}
                    value={newBadgeForm.typekey}
                    onChange={(event) => setNewBadgeForm((prev) => ({ ...prev, typekey: event.target.value }))}
                  >
                    {badgeTypes.map((type) => (
                      <option key={type._id} value={type.slug}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-emerald-900">
                  Priority
                  <input
                    type="number"
                    className={input}
                    value={newBadgeForm.priority}
                    onChange={(event) => setNewBadgeForm((prev) => ({ ...prev, priority: Number(event.target.value || 100) }))}
                  />
                </label>
                <label className="text-sm font-medium text-emerald-900">
                  Description
                  <textarea
                    className="mt-1 min-h-[78px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={newBadgeForm.description}
                    onChange={(event) => setNewBadgeForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <label className="text-sm font-medium text-emerald-900">
                  Badge Image
                  <input type="file" className="mt-2 block w-full text-sm" onChange={(event) => setNewBadgeImage(event.target.files?.[0] || null)} />
                </label>
                <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                  <UploadCloud className="h-3.5 w-3.5" /> Create Draft Badge
                </button>
              </form>
            </div>

            <div className={`${card} lg:col-span-2`}>
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[220px] flex-1 text-sm font-medium text-emerald-900">
                  Search Badge
                  <input className={input} value={badgeQuery} onChange={(event) => setBadgeQuery(event.target.value)} />
                </label>
                <label className="w-[160px] text-sm font-medium text-emerald-900">
                  Status
                  <select className={input} value={badgeStatus} onChange={(event) => setBadgeStatus(event.target.value)}>
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className="w-[180px] text-sm font-medium text-emerald-900">
                  Type
                  <select className={input} value={badgeTypeFilter} onChange={(event) => setBadgeTypeFilter(event.target.value)}>
                    <option value="">All</option>
                    {badgeTypes.map((type) => (
                      <option key={type._id} value={type.slug}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadBadges(1)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Load
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {badgeLoading ? <p className="text-sm text-emerald-700">Loading badges...</p> : null}
                {!badgeLoading &&
                  badges.map((badge) => (
                    <div key={badge._id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="grid items-center gap-2 md:grid-cols-[auto_1fr_auto]">
                        <div className="h-12 w-16 overflow-hidden rounded-md border border-emerald-200 bg-white">
                          {badge?.image ? (
                            <img src={badge.image} alt={badge.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-emerald-700">No Image</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">{badge.name}</p>
                          <p className="text-xs text-emerald-700">
                            {badge.typekey || badge?.typeid?.slug || "shop"} | Priority {Number(badge.priority || 100)} |{" "}
                            {badge.isactive ? "Active" : badge.isdraft ? "Draft" : "Inactive"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleBadgeStatus(badge._id, !badge.isactive)}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                            badge.isactive ? "border border-red-300 text-red-700" : "bg-emerald-700 text-white"
                          }`}
                        >
                          {badge.isactive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={badgePage <= 1}
                  onClick={() => loadBadges(badgePage - 1)}
                  className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800 disabled:opacity-50"
                >
                  Prev
                </button>
                <p className="text-xs text-emerald-700">
                  Page {badgePage}/{badgePages}
                </p>
                <button
                  type="button"
                  disabled={badgePage >= badgePages}
                  onClick={() => loadBadges(badgePage + 1)}
                  className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "Creative Assets" ? (
          <div className="space-y-4">
            <form onSubmit={uploadAssets} className={card}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-emerald-900">
                  Title (optional)
                  <input className={input} value={assetTitle} onChange={(event) => setAssetTitle(event.target.value)} />
                </label>
                <label className="text-sm font-medium text-emerald-900">
                  Notes (optional)
                  <input className={input} value={assetNotes} onChange={(event) => setAssetNotes(event.target.value)} />
                </label>
                <label className="text-sm font-medium text-emerald-900 md:col-span-2">
                  Upload files (image, video, gif, pdf, excel, doc)
                  <input
                    type="file"
                    className="mt-2 block w-full text-sm"
                    multiple
                    accept="image/*,video/*,.gif,.pdf,.csv,.xls,.xlsx,.doc,.docx,.txt,.rtf"
                    onChange={(event) => setAssetFiles(Array.from(event.target.files || []))}
                  />
                </label>
              </div>
              <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                <UploadCloud className="h-3.5 w-3.5" /> Upload Assets
              </button>
            </form>

            <div className={card}>
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[220px] flex-1 text-sm font-medium text-emerald-900">
                  Search
                  <input className={input} value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} />
                </label>
                <label className="w-[180px] text-sm font-medium text-emerald-900">
                  Type
                  <select className={input} value={assetKind} onChange={(event) => setAssetKind(event.target.value)}>
                    <option value="">All</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="gif">GIF</option>
                    <option value="pdf">PDF</option>
                    <option value="spreadsheet">Spreadsheet</option>
                    <option value="document">Document</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={loadAssets}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Load
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {assetLoading ? <p className="text-sm text-emerald-700">Loading assets...</p> : null}
                {!assetLoading && assets.length === 0 ? <p className="text-sm text-emerald-700">No assets found.</p> : null}
                {!assetLoading &&
                  assets.map((asset) => (
                    <div key={asset._id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">{asset.originalname || asset.title || "Asset"}</p>
                          <p className="text-xs text-emerald-700">
                            {asset.filekind} | {formatFileSize(asset.filesize)} | {asset.mimetype || "unknown"}
                          </p>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                              Title
                              <input
                                className={input}
                                value={assetEditMap[asset._id]?.title || ""}
                                onChange={(event) =>
                                  setAssetEditMap((prev) => ({
                                    ...prev,
                                    [asset._id]: { ...(prev[asset._id] || {}), title: event.target.value },
                                  }))
                                }
                              />
                            </label>
                            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                              Notes
                              <input
                                className={input}
                                value={assetEditMap[asset._id]?.notes || ""}
                                onChange={(event) =>
                                  setAssetEditMap((prev) => ({
                                    ...prev,
                                    [asset._id]: { ...(prev[asset._id] || {}), notes: event.target.value },
                                  }))
                                }
                              />
                            </label>
                          </div>
                        </div>

                        <div className="rounded-lg border border-emerald-200 bg-white p-2">
                          {asset.filekind === "video" ? (
                            <video src={asset.url} controls className="h-24 w-full rounded object-cover" />
                          ) : asset.filekind === "image" || asset.filekind === "gif" ? (
                            <img src={asset.url} alt={asset.title || "Asset"} className="h-24 w-full rounded object-cover" />
                          ) : (
                            <div className="flex h-24 items-center justify-center text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                              {asset.filekind}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-start gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(asset.url, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `${serverurl}/seller/admin/panel/creative-assets/${asset._id}/download`,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                          <button
                            type="button"
                            onClick={() => updateAsset(asset._id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Update
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAsset(asset._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SuperAdminShopManagementCenter;

