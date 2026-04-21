"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Download, Eye, Pencil, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";

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

const SellerCreativeAssets = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filekind, setFilekind] = useState("");
  const [assets, setAssets] = useState([]);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [editMap, setEditMap] = useState({});

  const loadAssets = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(
        `${serverurl}/seller/panel/creative-assets`,
        getRequestConfig({
          params: { q: query, filekind, page: 1, limit: 120 },
          timeout: 30000,
        })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to load creative assets.");
      const rows = Array.isArray(data?.assets) ? data.assets : [];
      setAssets(rows);
      const nextEdit = {};
      rows.forEach((row) => {
        nextEdit[row._id] = { title: row.title || "", notes: row.notes || "" };
      });
      setEditMap(nextEdit);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load creative assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const uploadAssets = async (event) => {
    event.preventDefault();
    if (!files.length) {
      setError("Please choose at least one file to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const fd = new FormData();
      files.forEach((file) => fd.append("files", file));
      if (title.trim()) fd.append("title", title.trim());
      if (notes.trim()) fd.append("notes", notes.trim());
      const { data } = await axios.post(
        `${serverurl}/seller/panel/creative-assets`,
        fd,
        getRequestConfig({
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
        })
      );
      if (!data?.success) throw new Error(data?.message || "Upload failed.");
      setNotice(`Uploaded ${Number(data?.count || 0)} creative asset(s).`);
      setFiles([]);
      setTitle("");
      setNotes("");
      await loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload assets.");
    } finally {
      setUploading(false);
    }
  };

  const updateAsset = async (assetId) => {
    const row = editMap[assetId] || {};
    setUpdatingId(assetId);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/panel/creative-assets/${assetId}`,
        { title: row.title || "", notes: row.notes || "" },
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Update failed.");
      setNotice("Asset updated.");
      await loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update asset.");
    } finally {
      setUpdatingId("");
    }
  };

  const deleteAsset = async (assetId) => {
    const ok = window.confirm("Delete this creative asset?");
    if (!ok) return;
    setError("");
    setNotice("");
    try {
      const { data } = await axios.delete(
        `${serverurl}/seller/panel/creative-assets/${assetId}`,
        getRequestConfig({ timeout: 30000 })
      );
      if (!data?.success) throw new Error(data?.message || "Delete failed.");
      setNotice("Asset deleted.");
      await loadAssets();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete asset.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Seller Creative Assets</p>
        <h2 className="mt-1 text-xl font-semibold text-emerald-900">Image, Video, GIF, PDF, Excel Vault</h2>
        <p className="mt-1 text-sm text-emerald-700">Upload once, then reuse for banners, decorator modules, and campaigns.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

      <form onSubmit={uploadAssets} className={card}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-emerald-900">
            Title (optional)
            <input className={input} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Notes (optional)
            <input className={input} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <label className="text-sm font-medium text-emerald-900 md:col-span-2">
            Files
            <input
              type="file"
              className="mt-2 block w-full text-sm"
              multiple
              accept="image/*,video/*,.gif,.pdf,.csv,.xls,.xlsx,.doc,.docx,.txt,.rtf"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-emerald-700">{files.length} file(s) selected</p>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
          >
            <UploadCloud className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload Assets"}
          </button>
        </div>
      </form>

      <div className={card}>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[220px] flex-1 text-sm font-medium text-emerald-900">
            Search
            <input className={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="title, file name, notes..." />
          </label>
          <label className="w-[180px] text-sm font-medium text-emerald-900">
            Type
            <select className={input} value={filekind} onChange={(event) => setFilekind(event.target.value)}>
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
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className={card}>
        {loading ? <p className="text-sm text-emerald-700">Loading creative assets...</p> : null}
        {!loading && assets.length === 0 ? <p className="text-sm text-emerald-700">No assets found.</p> : null}
        {!loading && assets.length > 0 ? (
          <div className="space-y-3">
            {assets.map((asset) => (
              <div key={asset._id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_auto]">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">{asset.originalname || asset.title || "Asset"}</p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {asset.filekind} | {formatFileSize(asset.filesize)} | {asset.mimetype || "unknown"}
                    </p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">
                        Title
                        <input
                          className={input}
                          value={editMap[asset._id]?.title || ""}
                          onChange={(event) =>
                            setEditMap((prev) => ({
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
                          value={editMap[asset._id]?.notes || ""}
                          onChange={(event) =>
                            setEditMap((prev) => ({
                              ...prev,
                              [asset._id]: { ...(prev[asset._id] || {}), notes: event.target.value },
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="min-h-[92px] rounded-lg border border-emerald-200 bg-white p-2">
                    {String(asset.filekind).startsWith("image") || asset.filekind === "gif" ? (
                      <img src={asset.url} alt={asset.title || "Asset"} className="h-24 w-full rounded object-cover" />
                    ) : String(asset.filekind) === "video" ? (
                      <video src={asset.url} controls className="h-24 w-full rounded object-cover" />
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
                          `${serverurl}/seller/panel/creative-assets/${asset._id}/download`,
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
                      disabled={updatingId === asset._id}
                      onClick={() => updateAsset(asset._id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white disabled:opacity-60"
                    >
                      <Pencil className="h-3.5 w-3.5" /> {updatingId === asset._id ? "Saving..." : "Update"}
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
        ) : null}
      </div>
    </div>
  );
};

export default SellerCreativeAssets;

