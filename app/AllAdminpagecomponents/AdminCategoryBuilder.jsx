"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  Download,
  Edit3,
  Eye,
  EyeOff,
  FolderArchive,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { serverurl, frontendurl } from "../utils/constants/serverurl";

const CATEGORY_API = `${serverurl}/category`;

const typeOptions = [
  { value: "campaign", label: "Campaign Builder" },
  { value: "deals", label: "Deals Builder" },
  { value: "topbrands", label: "Top Brands & Offers" },
  { value: "extradiscount", label: "Extra Discount Offer" },
  { value: "shopbeautyproductbycategory", label: "ShopBeautyProductByCategory" },
  { value: "shopbeautyproductbyconcern", label: "ShopBeautyProductByConcern" },
];

const statusOptions = [
  { value: "inactive", label: "Inactive (Default)" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const requiresNavRoot = (type) => {
  return ["shopbeautyproductbycategory", "shopbeautyproductbyconcern"].includes(type);
};

const buildNavigationLink = (type, title) => {
  const base = String(frontendurl || "").replace(/\/+$/, "");
  if (!base) return "";

  const cleanSlug = slugify(title);

  if (type === "campaign") return `${base}/mega/mega-${cleanSlug}`;
  if (type === "deals") return `${base}/deals/${cleanSlug}`;
  if (type === "topbrands") return `${base}/top-brands/${cleanSlug}`;
  if (type === "extradiscount") return `${base}/discounts/offer/${cleanSlug}`;

  return `${base}/s/${cleanSlug}`;
};

const buildNavigationPlaceholder = (type) => {
  const base = String(frontendurl || "").replace(/\/+$/, "");
  if (!base) return "";

  if (type === "campaign") return `${base}/mega/mega-`;
  if (type === "deals") return `${base}/deals/`;
  if (type === "topbrands") return `${base}/top-brands/`;
  if (type === "extradiscount") return `${base}/discounts/offer/`;

  return `${base}/s/`;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString();
};

const mediaIsVideo = (media = {}) => {
  if (String(media?.type || "").toLowerCase() === "video") return true;
  const url = String(media?.url || "").toLowerCase();
  return url.includes(".mp4") || url.includes(".mov") || url.includes(".mkv") || url.includes(".webm");
};

const downloadFromUrl = async (url, filename) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

const AdminCategoryBuilder = () => {
  const [items, setItems] = useState([]);
  const [navTree, setNavTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    status: "all",
    type: "",
    sort: "newest",
    q: "",
    from: "",
    to: "",
  });

  const [editId, setEditId] = useState("");
  const [linkLocked, setLinkLocked] = useState(true);

  const [form, setForm] = useState({
    name: "",
    type: "campaign",
    status: "inactive",
    order: 0,
    navrootid: "",
    navlink: buildNavigationPlaceholder("campaign"),
    segments: [],
  });

  const [newFiles, setNewFiles] = useState([]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [categoryRes, navRes] = await Promise.all([
        axios.get(`${CATEGORY_API}/all`, {
          params: {
            status: filters.status,
            type: filters.type || undefined,
            sort: filters.sort,
            q: filters.q || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
          },
        }),
        axios.get(`${CATEGORY_API}/fulltree`),
      ]);

      setItems(Array.isArray(categoryRes?.data?.data) ? categoryRes.data.data : []);
      setNavTree(Array.isArray(navRes?.data?.data) ? navRes.data.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load category & campaign data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [filters.status, filters.type, filters.sort, filters.q, filters.from, filters.to]);

  useEffect(() => {
    if (!linkLocked) return;

    const title = String(form.name || "");
    const link = buildNavigationLink(form.type, title);
    const placeholder = buildNavigationPlaceholder(form.type);
    setForm((prev) => ({
      ...prev,
      navlink: title.trim() ? link : placeholder,
    }));
  }, [form.name, form.type, linkLocked]);

  const resetForm = () => {
    setEditId("");
    setLinkLocked(true);
    setForm({
      name: "",
      type: "campaign",
      status: "inactive",
      order: 0,
      navrootid: "",
      navlink: buildNavigationPlaceholder("campaign"),
      segments: [],
    });
    setNewFiles([]);
  };

  const statusCount = useMemo(() => {
    const count = { all: items.length, active: 0, inactive: 0, draft: 0 };
    items.forEach((item) => {
      const status = String(item?.status || "inactive").toLowerCase();
      if (count[status] !== undefined) count[status] += 1;
    });
    return count;
  }, [items]);

  const onEdit = (entry) => {
    const segments = Array.isArray(entry?.segments)
      ? entry.segments
          .map((segment) => String(segment?.navrootid || segment?._id || "").trim())
          .filter(Boolean)
      : [];

    setEditId(String(entry._id));
    setLinkLocked(false);
    setForm({
      name: String(entry?.name || ""),
      type: String(entry?.type || "campaign"),
      status: String(entry?.status || "inactive"),
      order: Number(entry?.order || 0),
      navrootid: String(entry?.navrootid?._id || entry?.navrootid || ""),
      navlink: String(entry?.navlink || ""),
      segments,
    });
    setNewFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSegment = (id) => {
    setForm((prev) => ({
      ...prev,
      segments: prev.segments.includes(id)
        ? prev.segments.filter((entry) => entry !== id)
        : [...prev.segments, id],
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const title = String(form.name || "").trim();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (requiresNavRoot(form.type) && !String(form.navrootid || "").trim()) {
      toast.error("Menu location is required for this type");
      return;
    }

    const payload = new FormData();
    payload.append("name", title);
    payload.append("type", form.type);
    payload.append("status", form.status || "inactive");
    payload.append("order", String(Number(form.order || 0)));
    payload.append("navlink", String(form.navlink || "").trim());
    if (form.navrootid) payload.append("navrootid", form.navrootid);
    form.segments.forEach((id) => payload.append("segments", id));

    newFiles.forEach((file) => payload.append("media", file));

    try {
      setSaving(true);
      if (editId) {
        await axios.put(`${CATEGORY_API}/update/${editId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Updated successfully");
      } else {
        await axios.post(`${CATEGORY_API}/create`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Created successfully");
      }

      resetForm();
      fetchAll();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await axios.patch(`${CATEGORY_API}/toggle-status/${id}`);
      toast.success("Status updated");
      fetchAll();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const moveToDraft = async (id) => {
    try {
      await axios.delete(`${CATEGORY_API}/delete/${id}`);
      toast.success("Moved to draft");
      fetchAll();
    } catch (error) {
      toast.error("Failed to move to draft");
    }
  };

  const recover = async (id) => {
    try {
      await axios.patch(`${CATEGORY_API}/restore/${id}`, { status: "inactive" });
      toast.success("Recovered as inactive");
      fetchAll();
    } catch (error) {
      toast.error("Failed to recover item");
    }
  };

  const permanentlyDelete = async (id) => {
    const confirmed = window.confirm("Permanently delete this item? This cannot be undone.");
    if (!confirmed) return;

    try {
      await axios.delete(`${CATEGORY_API}/permanent/${id}`);
      toast.success("Permanently deleted");
      fetchAll();
    } catch (error) {
      toast.error("Failed to permanently delete");
    }
  };

  const downloadMedia = async (entry, media, index) => {
    try {
      const ext = mediaIsVideo(media) ? "mp4" : "jpg";
      const filename = `${entry.type || "section"}-${slugify(entry.name || "media")}-${index + 1}.${ext}`;
      await downloadFromUrl(media.url, filename);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download media");
    }
  };

  const renderNavOptions = (nodes, depth = 0) => {
    return nodes.flatMap((node) => [
      <option key={node._id} value={node._id}>
        {`${"  ".repeat(depth)}${depth ? "- " : ""}${node.name}`}
      </option>,
      ...(Array.isArray(node.children) && node.children.length ? renderNavOptions(node.children, depth + 1) : []),
    ]);
  };

  const renderSegments = (nodes, depth = 0) => {
    return nodes.map((node) => (
      <div key={node._id} className="space-y-1">
        <label className="flex cursor-pointer items-center gap-2" style={{ marginLeft: `${depth * 12}px` }}>
          <input
            type="checkbox"
            checked={form.segments.includes(String(node._id))}
            onChange={() => toggleSegment(String(node._id))}
            className="accent-emerald-700"
          />
          <span className="text-xs text-emerald-900">{node.name}</span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-emerald-600">{node.slug}</span>
        </label>
        {Array.isArray(node.children) && node.children.length ? renderSegments(node.children, depth + 1) : null}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-[#f6fbf8] px-4 py-6 md:px-8 md:py-8">
      <Toaster position="top-center" />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Khancosmetics SuperAdmin</p>
              <h1 className="mt-1 text-2xl font-bold text-emerald-900">Category & Campaign Management</h1>
              <p className="mt-1 text-sm text-emerald-700">Build homepage sections with draft, recovery, download, and auto Next.js navigation links.</p>
            </div>
            <button
              type="button"
              onClick={fetchAll}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 hover:bg-emerald-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Title</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                  placeholder="Ex: LipStickSale"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Builder Type</span>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm((prev) => ({ ...prev, type, navlink: linkLocked ? buildNavigationPlaceholder(type) : prev.navlink }));
                  }}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Sort Order</span>
                <input
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Navigation Link</span>
                <input
                  type="text"
                  value={form.navlink}
                  onChange={(e) => {
                    setLinkLocked(false);
                    setForm((prev) => ({ ...prev, navlink: e.target.value }));
                  }}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                  placeholder={buildNavigationPlaceholder(form.type)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Menu Location (required for category/concern)</span>
                <select
                  value={form.navrootid}
                  onChange={(e) => setForm((prev) => ({ ...prev, navrootid: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                >
                  <option value="">No menu root selected</option>
                  {renderNavOptions(navTree)}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Segment Selector (optional)</p>
                <p className="text-xs text-emerald-700">Selected: {form.segments.length}</p>
              </div>
              <div className="max-h-44 overflow-y-auto rounded-xl border border-emerald-200 bg-white p-2">
                {renderSegments(navTree)}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <Upload className="h-4 w-4" />
                Upload Media (image/video/gif)
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              />
              {newFiles.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newFiles.map((file) => (
                    <span key={file.name + file.size} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {editId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLinkLocked(true);
                  setForm((prev) => ({
                    ...prev,
                    navlink: prev.name.trim() ? buildNavigationLink(prev.type, prev.name) : buildNavigationPlaceholder(prev.type),
                  }));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 hover:bg-emerald-50"
              >
                Auto Link
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 hover:bg-emerald-50"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Status</span>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value="all">All ({statusCount.all})</option>
                <option value="active">Active ({statusCount.active})</option>
                <option value="inactive">Inactive ({statusCount.inactive})</option>
                <option value="draft">Draft ({statusCount.draft})</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Type</span>
              <select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value="">All Types</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Sort</span>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Search by title</span>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2">
                <Search className="h-4 w-4 text-emerald-700" />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                  className="w-full bg-transparent text-sm text-emerald-900 outline-none"
                  placeholder="Search..."
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">From</span>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">To</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-emerald-900">Library ({items.length})</h2>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-12 text-center text-sm text-emerald-700">Loading...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-12 text-center text-sm text-emerald-700">No records found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((entry) => {
                const isDraft = entry.status === "draft";
                const firstMedia = Array.isArray(entry.media) && entry.media.length ? entry.media[0] : null;

                return (
                  <div key={entry._id} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                    <div className="relative aspect-[16/7] overflow-hidden bg-black/80">
                      {firstMedia ? (
                        mediaIsVideo(firstMedia) ? (
                          <video src={firstMedia.url} className="h-full w-full object-cover" muted playsInline />
                        ) : (
                          <img src={firstMedia.url} alt={entry.name} className="h-full w-full object-cover" />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/80">No Media</div>
                      )}

                      <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                        {entry.type}
                      </div>

                      <div className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${entry.status === "active" ? "bg-emerald-600 text-white" : entry.status === "inactive" ? "bg-amber-500 text-white" : "bg-slate-700 text-white"}`}>
                        {entry.status || "inactive"}
                      </div>
                    </div>

                    <div className="space-y-2 p-3">
                      <div>
                        <p className="line-clamp-1 text-sm font-semibold text-emerald-900">{entry.name}</p>
                        <p className="line-clamp-1 text-xs text-emerald-700">{entry.navlink || "No nav link"}</p>
                        <p className="mt-1 text-[11px] text-emerald-600">{formatDate(entry.createdAt)}</p>
                        <p className="text-[11px] text-emerald-600">Media: {Array.isArray(entry.media) ? entry.media.length : 0}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(entry)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!firstMedia?.url) {
                              toast.error("No media to download");
                              return;
                            }
                            downloadMedia(entry, firstMedia, 0);
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>

                        {isDraft ? (
                          <button
                            type="button"
                            onClick={() => recover(entry._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <FolderArchive className="h-3.5 w-3.5" />
                            Recover
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleStatus(entry._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            {entry.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {entry.status === "active" ? "Hide" : "Show"}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {!isDraft ? (
                          <button
                            type="button"
                            onClick={() => moveToDraft(entry._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Move to Draft
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => recover(entry._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => permanentlyDelete(entry._id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Permanent
                        </button>
                      </div>

                      {Array.isArray(entry.media) && entry.media.length > 1 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.media.map((media, idx) => (
                            <button
                              key={`${entry._id}-media-${idx}`}
                              type="button"
                              onClick={() => downloadMedia(entry, media, idx)}
                              className="rounded-full border border-emerald-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 hover:bg-emerald-50"
                            >
                              Media {idx + 1}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryBuilder;
