"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  FileVideo,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { serverurl, frontendurl } from "../utils/constants/serverurl";

const API_URL = `${serverurl}/homebanner`;

const sectionOptions = [
  { value: "home", label: "Home Banner" },
  { value: "campaign", label: "Campaign (Use Category & Campaign Manager)", disabled: true },
  { value: "bestselling", label: "Best Selling Banner" },
  { value: "fivestar", label: "5 Star Selling Banner" },
  { value: "newin", label: "New In Banner" },
];

const statusOptions = [
  { value: "inactive", label: "Inactive (Default)" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "order", label: "Banner Order" },
];

const getDefaultLink = (section) => {
  const base = String(frontendurl || "").replace(/\/+$/, "");
  if (!base) return "";
  if (section === "newin") return `${base}/new-in`;
  if (section === "bestselling") return `${base}/best-selling`;
  if (section === "fivestar") return `${base}/five-star`;
  return base;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString();
};

const isVideoUrl = (url, mediatype) => {
  if (String(mediatype || "").toLowerCase() === "video") return true;
  const value = String(url || "").toLowerCase();
  return value.includes(".mp4") || value.includes(".mov") || value.includes(".mkv") || value.includes(".webm");
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

const AdminHomeBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState("");

  const [filters, setFilters] = useState({
    section: "all",
    status: "all",
    sort: "newest",
    from: "",
    to: "",
  });

  const [form, setForm] = useState({
    title: "",
    sectionkey: "home",
    navigationlink: getDefaultLink("home"),
    bannernumber: 0,
    status: "inactive",
    image: null,
  });

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("image");
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/gethomebanners`, {
        params: {
          scope: "admin",
          section: filters.section,
          status: filters.status,
          sort: filters.sort,
          from: filters.from || undefined,
          to: filters.to || undefined,
        },
      });
      setBanners(Array.isArray(data?.banners) ? data.banners : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [filters.section, filters.status, filters.sort, filters.from, filters.to]);

  const resetForm = () => {
    setEditId("");
    const section = "home";
    setForm({
      title: "",
      sectionkey: section,
      navigationlink: getDefaultLink(section),
      bannernumber: 0,
      status: "inactive",
      image: null,
    });
    setPreviewUrl("");
    setPreviewType("image");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const statusCounts = useMemo(() => {
    const counts = { all: banners.length, active: 0, inactive: 0, draft: 0 };
    banners.forEach((banner) => {
      const status = String(banner?.status || "inactive").toLowerCase();
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return counts;
  }, [banners]);

  const onSelectFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = String(file.type || "").toLowerCase().startsWith("video/");
    setForm((prev) => ({ ...prev, image: file }));
    setPreviewType(isVideo ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSectionChange = (section) => {
    setForm((prev) => ({
      ...prev,
      sectionkey: section,
      navigationlink: editId ? prev.navigationlink : getDefaultLink(section),
    }));
  };

  const onEdit = (banner) => {
    setEditId(String(banner._id));
    setForm({
      title: String(banner.title || ""),
      sectionkey: String(banner.sectionkey || "home"),
      navigationlink: String(banner.navigationlink || getDefaultLink(banner.sectionkey)),
      bannernumber: Number(banner.bannernumber || 0),
      status: String(banner.status || "inactive"),
      image: null,
    });
    setPreviewUrl(String(banner.image || ""));
    setPreviewType(isVideoUrl(banner.image, banner.mediatype) ? "video" : "image");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!editId && !form.image) {
      toast.error("Please upload a banner file");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("sectionkey", form.sectionkey);
      payload.append("navigationlink", form.navigationlink || getDefaultLink(form.sectionkey));
      payload.append("bannernumber", String(Number(form.bannernumber || 0)));
      payload.append("status", form.status || "inactive");
      if (form.image) payload.append("image", form.image);

      if (editId) {
        await axios.put(`${API_URL}/edit/${editId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Banner updated successfully");
      } else {
        await axios.post(`${API_URL}/create`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Banner uploaded successfully");
      }

      resetForm();
      fetchBanners();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save banner");
    } finally {
      setSubmitting(false);
    }
  };

  const moveToDraft = async (id) => {
    try {
      await axios.delete(`${API_URL}/delete/${id}`);
      toast.success("Moved to draft");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to move banner to draft");
    }
  };

  const restore = async (id) => {
    try {
      await axios.patch(`${API_URL}/restore/${id}`, { status: "inactive" });
      toast.success("Banner restored as inactive");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to restore banner");
    }
  };

  const toggleStatus = async (id) => {
    try {
      await axios.patch(`${API_URL}/status/${id}`);
      toast.success("Banner status changed");
      fetchBanners();
    } catch (error) {
      toast.error("Could not change status");
    }
  };

  const permanentlyDelete = async (id) => {
    const ok = window.confirm("Permanently delete this banner? This cannot be undone.");
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/permanent/${id}`);
      toast.success("Banner permanently deleted");
      fetchBanners();
    } catch (error) {
      toast.error("Could not permanently delete banner");
    }
  };

  const downloadBanner = async (banner) => {
    try {
      const response = await axios.get(`${API_URL}/download/${banner._id}`);
      const url = response?.data?.data?.url || banner.image;
      const suffix = isVideoUrl(url, banner.mediatype) ? "mp4" : "jpg";
      const filename = `${banner.sectionkey || "banner"}-${banner.bannernumber || 0}-${banner._id}.${suffix}`;
      await downloadFromUrl(url, filename);
      toast.success("Download started");
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6fbf8] px-4 py-6 md:px-8 md:py-8">
      <Toaster position="top-center" />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Glow Haat SuperAdmin</p>
              <h1 className="mt-1 text-2xl font-bold text-emerald-900">Home Banner Management</h1>
              <p className="mt-1 text-sm text-emerald-700">Draft-safe upload, download, recovery, and activation workflow.</p>
            </div>
            <button
              type="button"
              onClick={fetchBanners}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 hover:bg-emerald-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Banner Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                placeholder="Optional title"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Banner Type</span>
              <select
                value={form.sectionkey}
                onChange={(e) => onSectionChange(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                {sectionOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
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
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Banner Order</span>
              <input
                type="number"
                min="0"
                value={form.bannernumber}
                onChange={(e) => setForm((prev) => ({ ...prev, bannernumber: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              />
            </label>

            <label className="space-y-1 md:col-span-2 xl:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Navigation Link (default from frontendurl)</span>
              <input
                type="text"
                value={form.navigationlink}
                onChange={(e) => setForm((prev) => ({ ...prev, navigationlink: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
                placeholder={getDefaultLink(form.sectionkey)}
              />
            </label>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Upload (Image/Video/GIF)</span>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={onSelectFile}
                  className="w-full rounded-xl border border-emerald-200 px-2 py-2 text-sm text-emerald-900"
                />
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {editId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {submitting ? "Saving..." : editId ? "Update Banner" : "Create Banner"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 hover:bg-emerald-50"
              >
                Reset To Default Link
              </button>
            </div>

            {(previewUrl || editId) && (
              <div className="md:col-span-2 xl:col-span-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 border-b border-emerald-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  {previewType === "video" ? <FileVideo className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}
                  Preview
                </div>
                <div className="aspect-[16/6] bg-black/80">
                  {previewType === "video" ? (
                    <video src={previewUrl} controls className="h-full w-full object-contain" />
                  ) : (
                    <img src={previewUrl} alt="banner preview" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-4 md:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Filter by type</span>
              <select
                value={filters.section}
                onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value="all">All Types</option>
                {sectionOptions.filter((option) => !option.disabled).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Filter by status</span>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              >
                <option value="all">All ({statusCounts.all})</option>
                <option value="active">Active ({statusCounts.active})</option>
                <option value="inactive">Inactive ({statusCounts.inactive})</option>
                <option value="draft">Draft ({statusCounts.draft})</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Sort by time/order</span>
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
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">From date</span>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">To date</span>
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
          <h2 className="mb-4 text-lg font-semibold text-emerald-900">Banner Library ({banners.length})</h2>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-12 text-center text-sm text-emerald-700">Loading banners...</div>
          ) : banners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-12 text-center text-sm text-emerald-700">No banners found for current filter.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {banners.map((banner) => {
                const draft = banner.status === "draft";
                const video = isVideoUrl(banner.image, banner.mediatype);

                return (
                  <div key={banner._id} className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                    <div className="relative aspect-[16/7] bg-black/80">
                      {video ? (
                        <video src={banner.image} className="h-full w-full object-cover" muted playsInline />
                      ) : (
                        <img src={banner.image} alt={banner.title || "banner"} className="h-full w-full object-cover" />
                      )}
                      <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                        #{Number(banner.bannernumber || 0)}
                      </div>
                      <div className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${banner.status === "active" ? "bg-emerald-600 text-white" : banner.status === "inactive" ? "bg-amber-500 text-white" : "bg-slate-700 text-white"}`}>
                        {banner.status || "inactive"}
                      </div>
                    </div>

                    <div className="space-y-2 p-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">{banner.sectionkey}</p>
                        <p className="line-clamp-1 text-sm font-semibold text-emerald-900">{banner.title || "Untitled Banner"}</p>
                        <p className="line-clamp-1 text-xs text-emerald-700">{banner.navigationlink || "No navigation link"}</p>
                        <p className="mt-1 text-[11px] text-emerald-600">{formatDate(banner.createdAt)}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(banner)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadBanner(banner)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>

                        {draft ? (
                          <button
                            type="button"
                            onClick={() => restore(banner._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleStatus(banner._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            {banner.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {banner.status === "active" ? "Hide" : "Show"}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {!draft ? (
                          <button
                            type="button"
                            onClick={() => moveToDraft(banner._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Move to Draft
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restore(banner._id)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Recover
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => permanentlyDelete(banner._id)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Permanent
                        </button>
                      </div>
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

export default AdminHomeBanner;

