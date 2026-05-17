"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Link as LinkIcon,
  UploadCloud,
  X,
  Layers,
  Save,
  Loader2,
  Zap,
  Globe,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { frontendurl, serverurl } from "../utils/constants/serverurl";
import { broadcastActiveLogoUpdate } from "../utils/logoManager";
import SuperAdminNav from "./adminutils/SuperAdminNav";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 1. Slugify: The engine that cleans inputs
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -
};

// 2. Cohesive Brand Palette Generator
const getNeonStyle = (index) => {
  const palettes = [
    { border: "bg-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50/50", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    { border: "bg-teal-600", text: "text-teal-700", bg: "bg-teal-50/50", badge: "bg-teal-50 text-teal-800 border-teal-200" },
    { border: "bg-lime-600", text: "text-lime-700", bg: "bg-lime-50/50", badge: "bg-lime-50 text-lime-800 border-lime-200" },
    { border: "bg-emerald-800", text: "text-emerald-900", bg: "bg-emerald-100/30", badge: "bg-emerald-100 text-emerald-900 border-emerald-250" },
    { border: "bg-amber-600", text: "text-amber-700", bg: "bg-amber-50/50", badge: "bg-amber-50 text-amber-800 border-amber-200" },
    { border: "bg-zinc-600", text: "text-zinc-700", bg: "bg-zinc-50/50", badge: "bg-zinc-100 text-zinc-800 border-zinc-200" },
  ];
  const item = palettes[index % palettes.length];
  
  return {
    border: item.border,
    text: item.text,
    bg: item.bg,
    badge: item.badge,
    ring: `group-focus-within:ring-2 ring-emerald-500/10`
  };
};

const formatTimestamp = (value) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "N/A";
  return date.toLocaleString();
};

// --- ATOMIC COMPONENTS ---

const GlassButton = ({ children, onClick, variant = "primary", className, isLoading, type = "button", disabled = false }) => {
  const variants = {
    primary: "bg-emerald-800 hover:bg-emerald-750 text-white shadow-sm ring-1 ring-emerald-900/15",
    secondary: "bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-2xs",
    danger: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
    ghost: "bg-transparent hover:bg-zinc-100 text-zinc-650",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn(
        "px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </motion.button>
  );
};

// --- NAVIGATION NODE (The Tree View) ---
const NavNode = ({ node, onAddChild, onEdit, onDelete, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const displaySlug = node.link?.replace(`${frontendurl}/s/`, "") || node.slug || node.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative ml-4 md:ml-8 mt-4"
    >
      {/* Connector Lines */}
      <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/25 to-transparent" />
      <div className="absolute -left-4 top-1/2 w-4 h-px bg-emerald-500/25" />

      <div className="group relative">
        <div className={cn(
          "relative z-10 p-4 rounded-2xl border transition-all duration-300",
          "bg-white hover:bg-zinc-50/50",
          "border-zinc-200 hover:border-emerald-600",
          "shadow-2xs hover:shadow-xs",
          isOpen && "border-emerald-500/35 bg-emerald-50/10"
        )}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-350 shadow-2xs",
                hasChildren ? "bg-emerald-850 text-white" : "bg-zinc-100 text-zinc-400 border border-zinc-150"
              )}>
                {hasChildren ? (
                  isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                ) : <Zap className="w-4 h-4" />}
              </div>
              
              <div>
                <h3 className="text-base font-extrabold text-zinc-850 tracking-tight">{node.name}</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-800/80 truncate max-w-[200px] md:max-w-md">
                   <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                   <span className="opacity-55">.../s/</span>
                   <span className="text-emerald-700 font-bold">{displaySlug}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onAddChild(node)} 
                title="Add Child Sub-category"
                className="p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-800 hover:text-white transition-all border border-emerald-100/50"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => onEdit(node)} 
                title="Edit Category Details"
                className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-all border border-amber-100/50"
              >
                <Edit3 className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => onDelete(node._id)} 
                title="Delete Category node"
                className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-650 hover:text-white transition-all border border-red-100/50"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Asset Preview Dots */}
          {node.images && node.images.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-150 flex gap-2 flex-wrap items-center">
              {node.images.map((img, idx) => {
                 const neon = getNeonStyle(idx);
                 return (
                  <div key={idx} className={cn("w-2 h-2 rounded-full", neon.border)} title={img.title} />
                 )
              })}
              <span className="text-[10px] font-bold text-zinc-400 ml-2 uppercase tracking-wide">{node.images.length} items loaded</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <NavNode key={child._id} node={child} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

const AdminNavCustomization = () => {
  const logoInputRef = useRef(null);
  const [navTree, setNavTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeParent, setActiveParent] = useState(null);
  const [editingNode, setEditingNode] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  
  const [assetsCount, setAssetsCount] = useState(0);
  const [assets, setAssets] = useState([]); 
  const [submitting, setSubmitting] = useState(false);
  const [logoItems, setLogoItems] = useState([]);
  const [selectedLogoFiles, setSelectedLogoFiles] = useState([]);
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoActionKey, setLogoActionKey] = useState("");
  const [logoStatusMessage, setLogoStatusMessage] = useState("");

  const activeLogoItem = useMemo(
    () => logoItems.find((entry) => entry.isactive) || null,
    [logoItems]
  );

  const fetchLogos = useCallback(async () => {
    setLogoLoading(true);
    try {
      const { data } = await axios.get(`${serverurl}/nav/logos/admin`, {
        withCredentials: true,
        timeout: 25000,
      });
      if (data?.success) {
        setLogoItems(Array.isArray(data.logos) ? data.logos : []);
      } else {
        setLogoItems([]);
      }
    } catch (error) {
      setLogoItems([]);
      setLogoStatusMessage(error?.response?.data?.message || "Failed to load logo vault.");
    } finally {
      setLogoLoading(false);
    }
  }, []);

  const fetchNav = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${serverurl}/nav/nav`);
      if (data.success) setNavTree(data.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNav(); }, [fetchNav]);
  useEffect(() => { fetchLogos(); }, [fetchLogos]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(slugify(newName));
  };

  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value));
  };

  const handleAssetCountChange = (count) => {
    let newCount = parseInt(count);
    if (isNaN(newCount)) newCount = 0;
    if (newCount > 1000) newCount = 1000; 
    if (newCount < 0) newCount = 0;       
    
    setAssetsCount(newCount);
    
    setAssets(prev => {
      const newAssets = [...prev];
      if (newCount > prev.length) {
        for (let i = prev.length; i < newCount; i++) {
          newAssets.push({ file: null, preview: null, title: "", linkSlug: "", existingUrl: null });
        }
      } else {
        newAssets.splice(newCount);
      }
      return newAssets;
    });
  };

  const handleAssetUpdate = (index, field, value) => {
    setAssets((prev) => {
      const next = [...prev];
      const currentAsset = { ...next[index] };

      currentAsset[field] = value;

      if (field === "title") {
        currentAsset.linkSlug = slugify(value);
      }
      if (field === "linkSlug") {
        currentAsset.linkSlug = slugify(value);
      }

      next[index] = currentAsset;
      return next;
    });
  };

  const handleAssetFileChange = (index, file) => {
    if (!file) return;
    setAssets((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        file,
        preview: URL.createObjectURL(file),
        existingUrl: null,
      };
      return next;
    });
  };

  const handleOpenCreate = (parent = null) => {
    setModalMode("create");
    setActiveParent(parent);
    setName("");
    setSlug("");
    setAssetsCount(0);
    setAssets([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (node) => {
    setModalMode("edit");
    setEditingNode(node);
    setName(node.name);
    
    let existingSlug = node.slug;
    if (!existingSlug && node.link) {
        existingSlug = node.link.split('/').pop();
    }
    setSlug(existingSlug || "");
    
    if (node.images && node.images.length > 0) {
      setAssetsCount(node.images.length);
      setAssets(node.images.map(img => {
         const imgSlug = img.link ? img.link.split('/').pop() : "";
         return {
            file: null,
            preview: img.image, 
            title: img.title || "",
            linkSlug: imgSlug, 
            existingUrl: img.image
         }
      }));
    } else {
      setAssetsCount(0);
      setAssets([]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    const fullLink = `${frontendurl}/s/${slug}`;
    const path = `/s/${slug}`;

    formData.append("name", name);
    formData.append("slug", slug); 
    formData.append("link", fullLink); 
    formData.append("path", path);

    const assetsMetadata = [];
    
    assets.forEach((asset, index) => {
      const assetFullLink = `${frontendurl}/s/${asset.linkSlug}`;

      if (asset.file) {
        formData.append("images", asset.file);
        assetsMetadata.push({
          title: asset.title,
          link: assetFullLink, 
          type: "new",
        });
      } else if (asset.existingUrl) {
        assetsMetadata.push({
          title: asset.title,
          link: assetFullLink, 
          image: asset.existingUrl,
          type: "existing"
        });
      }
    });

    formData.append("imagesMeta", JSON.stringify(assetsMetadata));

    if (modalMode === "create" && activeParent) {
      formData.append("parentid", activeParent._id);
    }

    try {
      const config = { headers: { "Content-Type": "multipart/form-data" } };
      if (modalMode === "create") {
        await axios.post(`${serverurl}/nav/createnav`, formData, config);
      } else {
        await axios.put(`${serverurl}/nav/editnav/${editingNode._id}`, formData, config);
      }
      
      setIsModalOpen(false);
      fetchNav();
      
    } catch (err) {
      console.error("Submission Error:", err);
      alert(`Failed: ${err.response?.data?.message || "Server Error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoSelection = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedLogoFiles(files);
  };

  const handleUploadDraftLogos = async () => {
    if (!selectedLogoFiles.length) {
      alert("Please select at least one logo file.");
      return;
    }

    const formData = new FormData();
    selectedLogoFiles.forEach((file) => formData.append("logos", file));

    setLogoUploading(true);
    setLogoStatusMessage("");
    try {
      const { data } = await axios.post(`${serverurl}/nav/logos/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000,
      });
      setSelectedLogoFiles([]);
      if (logoInputRef.current) logoInputRef.current.value = "";
      await fetchLogos();
      setLogoStatusMessage(data?.message || "Logo drafts uploaded successfully.");
    } catch (error) {
      setLogoStatusMessage(error?.response?.data?.message || "Failed to upload draft logos.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleActivateLogo = async (logoId) => {
    setLogoActionKey(`activate-${logoId}`);
    setLogoStatusMessage("");
    try {
      const { data } = await axios.patch(
        `${serverurl}/nav/logos/${logoId}/activate`,
        {},
        { withCredentials: true, timeout: 25000 }
      );
      const activeUrl = data?.logo?.logo || "";
      broadcastActiveLogoUpdate(activeUrl);
      await fetchLogos();
      setLogoStatusMessage(data?.message || "Logo activated successfully.");
    } catch (error) {
      setLogoStatusMessage(
        error?.response?.data?.message ||
          "Failed to activate logo. First deactivate current active logo if needed."
      );
    } finally {
      setLogoActionKey("");
    }
  };

  const handleDeactivateLogo = async (logoId) => {
    setLogoActionKey(`deactivate-${logoId}`);
    setLogoStatusMessage("");
    try {
      const { data } = await axios.patch(
        `${serverurl}/nav/logos/${logoId}/deactivate`,
        {},
        { withCredentials: true, timeout: 25000 }
      );
      broadcastActiveLogoUpdate("");
      await fetchLogos();
      setLogoStatusMessage(data?.message || "Logo deactivated successfully.");
    } catch (error) {
      setLogoStatusMessage(error?.response?.data?.message || "Failed to deactivate logo.");
    } finally {
      setLogoActionKey("");
    }
  };

  const handleDeleteDraftLogo = async (logoId) => {
    if (!confirm("Delete this draft logo permanently?")) return;
    setLogoActionKey(`delete-${logoId}`);
    setLogoStatusMessage("");
    try {
      const { data } = await axios.delete(`${serverurl}/nav/logos/${logoId}`, {
        withCredentials: true,
        timeout: 25000,
      });
      await fetchLogos();
      setLogoStatusMessage(data?.message || "Draft logo deleted.");
    } catch (error) {
      setLogoStatusMessage(error?.response?.data?.message || "Failed to delete draft logo.");
    } finally {
      setLogoActionKey("");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 font-sans text-zinc-900 antialiased selection:bg-emerald-100 pb-16">
      <SuperAdminNav />
      
      {/* Background Ambience */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Jumbotron */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-50/50 blur-3xl"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/10">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">Navigation & CMS Hub</h1>
                <p className="mt-1 text-sm text-zinc-500">Configure GlowHaat category hierarchies, mega menus, and manage logo assets.</p>
              </div>
            </div>
            <GlassButton onClick={() => handleOpenCreate()}>
              <Plus className="w-4 h-4" /> Add Root Category
            </GlassButton>
          </div>
        </div>

        {/* Logo Control Panel */}
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-zinc-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-250">SuperAdmin Logo Vault</span>
              <h2 className="mt-3 text-lg font-extrabold text-zinc-850">GlowHaat Global Logo Control</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Upload logos as drafts, maintain serial numbers, and activate exactly one logo at a time.
              </p>
            </div>
            <GlassButton
              variant="secondary"
              onClick={fetchLogos}
              isLoading={logoLoading}
              className="h-10 min-w-[170px]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Logos
            </GlassButton>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Bulk Draft Upload</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLogoSelection}
                  className="block w-full text-sm text-zinc-650 file:mr-4 file:rounded-xl file:border file:border-emerald-250 file:bg-emerald-50 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-emerald-850 hover:file:bg-emerald-100 transition-all cursor-pointer"
                />
                <GlassButton
                  onClick={handleUploadDraftLogos}
                  isLoading={logoUploading}
                  className="h-10 min-w-[220px]"
                >
                  <UploadCloud className="h-4 w-4" />
                  {logoUploading ? "Uploading Drafts..." : "Upload Draft Logos"}
                </GlassButton>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Selected files: <span className="font-bold text-emerald-800">{selectedLogoFiles.length}</span>
              </p>
              {logoStatusMessage ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
                  {logoStatusMessage}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Currently Active Logo</p>
              {activeLogoItem ? (
                <div className="mt-4 space-y-3">
                  <img
                    src={activeLogoItem.logo}
                    alt={`Active Logo ${activeLogoItem.serialnumber}`}
                    className="h-20 w-full rounded-xl border border-emerald-100 bg-white object-contain p-2 shadow-2xs"
                  />
                  <div className="flex items-center justify-between text-xs text-zinc-650 font-bold uppercase tracking-wider">
                    <span>Serial #{activeLogoItem.serialnumber}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">No active logo selected yet.</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-450">Logo Library</p>
            {logoLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-xs font-semibold text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-800" />
                Loading logo drafts...
              </div>
            ) : logoItems.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-350 bg-zinc-50/55 px-4 py-8 text-center text-xs font-semibold text-zinc-400">
                No logo drafts found. Upload your first GlowHaat logo pack.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {logoItems.map((entry) => {
                  const isActivateBusy = logoActionKey === `activate-${entry._id}`;
                  const isDeactivateBusy = logoActionKey === `deactivate-${entry._id}`;
                  const isDeleteBusy = logoActionKey === `delete-${entry._id}`;
                  const isBusy = isActivateBusy || isDeactivateBusy || isDeleteBusy;
                  return (
                    <div
                      key={entry._id}
                      className={cn(
                        "rounded-2xl border p-4 transition-all shadow-2xs",
                        entry.isactive
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-zinc-200 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="font-mono text-zinc-400">Serial #{entry.serialnumber}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] tracking-wide",
                            entry.isactive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                          )}
                        >
                          {entry.isactive ? "active" : "draft"}
                        </span>
                      </div>
                      <img
                        src={entry.logo}
                        alt={`Logo ${entry.serialnumber}`}
                        className="mt-3 h-20 w-full rounded-xl border border-zinc-100 bg-white object-contain p-2 shadow-3xs"
                      />
                      <p className="mt-3 text-[10px] font-semibold text-zinc-400">Uploaded: {formatTimestamp(entry.createdAt)}</p>
                      <div className="mt-4 flex gap-2">
                        {entry.isactive ? (
                          <GlassButton
                            variant="danger"
                            onClick={() => handleDeactivateLogo(entry._id)}
                            isLoading={isDeactivateBusy}
                            className="flex-1 h-9 text-xs"
                          >
                            Deactivate
                          </GlassButton>
                        ) : (
                          <GlassButton
                            onClick={() => handleActivateLogo(entry._id)}
                            isLoading={isActivateBusy}
                            className="flex-1 h-9 text-xs"
                          >
                            Activate
                          </GlassButton>
                        )}
                        <GlassButton
                          variant="ghost"
                          onClick={() => handleDeleteDraftLogo(entry._id)}
                          isLoading={isDeleteBusy}
                          className="h-9 min-w-[90px] text-xs border border-zinc-200 hover:bg-zinc-50"
                          disabled={entry.isactive || isBusy}
                        >
                          Delete
                        </GlassButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Tree Container */}
        <div className="space-y-6 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-800" />
              <p className="text-emerald-800 font-mono tracking-widest animate-pulse uppercase text-xs font-bold">Synchronizing Hierarchy Tree...</p>
            </div>
          ) : navTree.length === 0 ? (
            <div className="text-center py-40 rounded-3xl border border-dashed border-zinc-300 bg-white shadow-2xs">
                <p className="text-zinc-550 text-base mb-6 font-semibold">No category hierarchies configured in database.</p>
                <GlassButton variant="secondary" onClick={() => handleOpenCreate()} className="mx-auto">
                    Initialize Root Node
                </GlassButton>
            </div>
          ) : (
            navTree.map(node => (
              <NavNode 
                key={node._id} 
                node={node} 
                onAddChild={handleOpenCreate} 
                onEdit={handleOpenEdit} 
                onDelete={async (id) => {
                  if(confirm("Delete this category node and all sub-children?")) {
                    await axios.delete(`${serverurl}/nav/deletenav/${id}`);
                    fetchNav();
                  }
                }} 
              />
            ))
          )}
        </div>
      </div>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/65 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.97, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 15, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-150 flex justify-between items-center shrink-0 bg-zinc-50/50">
                <div>
                  <h2 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
                    <Zap className="text-emerald-800 h-5 w-5" />
                    {modalMode === "create" ? "New Navigation Entry" : "Edit Navigation"}
                  </h2>
                  <p className="text-zinc-500 text-xs mt-1">
                    {activeParent ? `Adding sub-category to: ${activeParent.name}` : "Creating top-level category"}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-650 transition-colors p-2 hover:bg-zinc-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                
                {/* 1. NAME & AUTO-LINK GENERATOR */}
                <div className="bg-zinc-50/55 rounded-2xl p-6 border border-zinc-200 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Category Name</label>
                            <input 
                              required 
                              autoFocus
                              value={name}
                              onChange={handleNameChange}
                              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-base font-bold placeholder:text-zinc-350"
                              placeholder="e.g. Platinum Abaya"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" /> Auto-Generated Slug
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">/s/</span>
                                <input 
                                  value={slug}
                                  onChange={handleSlugChange}
                                  className="w-full pl-10 bg-zinc-50 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-850 font-mono focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
                                  placeholder="platinum-abaya"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIVE URL PREVIEW */}
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
                            <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] text-emerald-850 uppercase font-bold tracking-wider">Final Link Structure</p>
                            <p className="text-xs font-mono text-emerald-950 truncate">
                                <span className="opacity-55">{frontendurl}</span>
                                <span className="opacity-70">/s/</span>
                                <span className="font-bold text-emerald-900 bg-emerald-100/50 px-1.5 py-0.5 rounded border border-emerald-250">{slug || "..."}</span>
                            </p>
                        </div>
                        <CheckCircle2 className="text-emerald-600 w-5 h-5 shrink-0" />
                    </div>
                </div>

                <div className="w-full h-px bg-zinc-150" />

                {/* 2. ASSETS SECTION */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <label className="text-base font-bold text-zinc-850 flex items-center gap-2">
                        <LayoutGrid className="text-emerald-850 h-5 w-5" /> Mega Menu Assets
                        </label>
                        <p className="text-zinc-550 text-xs mt-1">Min: 0 | Max: 1000 items. Elegant palettes applied automatically.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-zinc-50 rounded-xl p-1.5 border border-zinc-200 self-start">
                      <span className="text-xs font-semibold text-zinc-500 pl-3">Total Images:</span>
                      <input 
                        type="number" 
                        min="0" max="1000"
                        value={assetsCount}
                        onChange={(e) => handleAssetCountChange(e.target.value)}
                        className="w-16 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-800 text-center font-bold outline-none focus:border-emerald-650"
                      />
                    </div>
                  </div>

                  {/* Asset List Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {assets.map((asset, idx) => {
                      const neon = getNeonStyle(idx);
                      
                      return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        key={idx} 
                        className={cn(
                            "relative bg-zinc-50/50 border rounded-2xl p-4 flex flex-col md:flex-row gap-5 items-start transition-all duration-300 group",
                            "border-zinc-200 hover:border-zinc-350",
                            neon.ring
                        )}
                      >
                        {/* Decorative Palette Side Bar */}
                        <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", neon.border)} />

                        {/* Image Upload */}
                        <div className="shrink-0 w-full md:w-32 aspect-[3/4] relative group/image">
                          <label className={cn(
                              "absolute inset-0 flex flex-col items-center justify-center bg-white border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden",
                              "border-zinc-200 hover:border-emerald-600"
                          )}>
                            {asset.preview ? (
                              <>
                                <img src={asset.preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-3xs">
                                  <Edit3 className="text-white w-5 h-5" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center text-zinc-400 group-hover/image:text-emerald-800 transition-colors">
                                <UploadCloud className="w-6 h-6 mb-2" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleAssetFileChange(idx, e.target.files?.[0])} 
                            />
                          </label>
                          <div className="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Asset Details */}
                        <div className="flex-1 w-full space-y-3 pt-1">
                            {/* Title Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-450 uppercase">Image Title</label>
                              <input 
                                placeholder="e.g. Eid Panjabi Collection"
                                value={asset.title}
                                onChange={(e) => handleAssetUpdate(idx, 'title', e.target.value)}
                                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-800 focus:border-emerald-650 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-colors"
                              />
                            </div>

                            {/* Auto Link Display */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-455 uppercase flex items-center gap-2">
                                Auto-Generated Link
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", neon.badge)}>
                                    Locked Format
                                </span>
                              </label>
                              <div className="relative group/link">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5 group-focus-within/link:text-emerald-800" />
                                <div className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-zinc-500 flex items-center overflow-hidden">
                                    <span className="shrink-0">{frontendurl}/s/</span>
                                    <input 
                                        value={asset.linkSlug}
                                        onChange={(e) => handleAssetUpdate(idx, 'linkSlug', e.target.value)}
                                        className={cn("bg-transparent border-none p-0 focus:ring-0 outline-none font-bold w-full", neon.text)}
                                        placeholder="auto-slug"
                                    />
                                </div>
                              </div>
                            </div>
                        </div>
                      </motion.div>
                    )})}
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-zinc-150 flex gap-4 z-20">
                  <GlassButton variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 h-11">
                    Discard Changes
                  </GlassButton>
                  <GlassButton type="submit" isLoading={submitting} className="flex-[2] h-11 text-sm font-bold uppercase tracking-wider">
                    <Save className="w-4 h-4" /> 
                    {submitting ? "Saving..." : "Confirm & Save System"}
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #047857; }
      `}</style>
    </div>
  );
};

export default AdminNavCustomization;
