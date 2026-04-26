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

// --- IMPORTS FROM YOUR PAGE ---
// Ensure this path matches your project structure exactly
import { frontendurl, serverurl } from "../utils/constants/serverurl";
import { broadcastActiveLogoUpdate } from "../utils/logoManager";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- UTILITIES ---

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

// 2. Neon Randomizer: Generates consistent but cool gradients based on index
const getNeonStyle = (index) => {
  const gradients = [
    "from-pink-500 to-rose-500",
    "from-cyan-400 to-blue-600",
    "from-emerald-400 to-green-600",
    "from-purple-500 to-indigo-600",
    "from-amber-400 to-orange-600",
    "from-fuchsia-500 to-purple-600",
    "from-lime-400 to-green-500",
    "from-sky-400 to-blue-500",
  ];
  // Cycle through gradients so it never runs out, even with 1000 images
  const gradient = gradients[index % gradients.length];
  
  return {
    border: `bg-gradient-to-r ${gradient}`,
    text: `bg-clip-text text-transparent bg-gradient-to-r ${gradient}`,
    glow: `shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`,
    ring: `group-focus-within:ring-2 ring-offset-2 ring-offset-[#0f172a] ring-${gradient.split(' ')[0].split('-')[1]}-500`
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
    primary: "bg-cyan-600/20 hover:bg-cyan-500 text-cyan-100 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    secondary: "bg-slate-800/40 hover:bg-slate-700 text-cyan-400 border border-slate-700",
    danger: "bg-red-500/10 hover:bg-red-500/80 hover:text-white text-red-400 border border-red-500/30",
    ghost: "bg-transparent hover:bg-cyan-500/10 text-cyan-400",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn(
        "px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-xl disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </motion.button>
  );
};

// --- NAVIGATION NODE (The Tree View) ---
const NavNode = ({ node, onAddChild, onEdit, onDelete, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  // Extract just the slug for display if the link is full url
  const displaySlug = node.link?.replace(`${frontendurl}/s/`, "") || node.slug || node.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative ml-4 md:ml-8 mt-4"
    >
      {/* Connector Lines */}
      <div className="absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 to-transparent" />
      <div className="absolute -left-4 top-1/2 w-4 h-px bg-cyan-500/50" />

      <div className="group relative">
        <div className={cn(
          "relative z-10 p-4 rounded-2xl border transition-all duration-500",
          "bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-2xl",
          "border-white/5 hover:border-cyan-500/50",
          "shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
          isOpen && "border-cyan-500/30 bg-slate-800/40"
        )}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                hasChildren ? "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-white" : "bg-slate-800 text-slate-500"
              )}>
                {hasChildren ? (
                  isOpen ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />
                ) : <Zap className="w-4 h-4" />}
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{node.name}</h3>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 truncate max-w-[200px] md:max-w-md">
                   <Globe className="w-3 h-3 flex-shrink-0" />
                   <span className="opacity-50">.../s/</span>
                   <span className="text-cyan-400 font-bold">{displaySlug}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => onAddChild(node)} className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"><Plus className="w-5 h-5" /></button>
              <button onClick={() => onEdit(node)} className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all"><Edit3 className="w-5 h-5" /></button>
              <button onClick={() => onDelete(node._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Asset Preview Dots */}
          {node.images && node.images.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 flex-wrap">
              {node.images.map((img, idx) => {
                 const neon = getNeonStyle(idx);
                 return (
                  <div key={idx} className={cn("w-2 h-2 rounded-full", neon.border)} title={img.title} />
                 )
              })}
              <span className="text-[10px] text-slate-500 ml-2">{node.images.length} items</span>
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
  const [slug, setSlug] = useState(""); // We store ONLY the slug here, but send full link to DB
  
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

  // --- FETCHING ---
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

  // --- AUTO SLUG ENGINE ---
  // When Name changes -> Auto-generate Slug
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    // If it's a new entry, strictly auto-generate. 
    // Even if editing, we usually want to suggest the slug match the name.
    setSlug(slugify(newName));
  };

  // Allow manual slug override, but keep it clean
  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value));
  };

  // --- ASSET MANAGEMENT ---
  const handleAssetCountChange = (count) => {
    let newCount = parseInt(count);
    if (isNaN(newCount)) newCount = 0;
    if (newCount > 1000) newCount = 1000; // Max Limit
    if (newCount < 0) newCount = 0;       // Min Limit
    
    setAssetsCount(newCount);
    
    setAssets(prev => {
      const newAssets = [...prev];
      if (newCount > prev.length) {
        // Add slots
        for (let i = prev.length; i < newCount; i++) {
          newAssets.push({ file: null, preview: null, title: "", linkSlug: "", existingUrl: null });
        }
      } else {
        // Remove slots
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

      // Smart Logic: If Title changes, auto-gen the Asset Link Slug
      if (field === "title") {
        currentAsset.linkSlug = slugify(value);
      }
      // If Link Slug changes manually, clean it
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

  // --- OPEN/CLOSE MODAL ---
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
    
    // Extract slug from the full link if possible, or use stored slug
    let existingSlug = node.slug;
    if (!existingSlug && node.link) {
        existingSlug = node.link.split('/').pop();
    }
    setSlug(existingSlug || "");
    
    if (node.images && node.images.length > 0) {
      setAssetsCount(node.images.length);
      setAssets(node.images.map(img => {
         // Extract slug from image link
         const imgSlug = img.link ? img.link.split('/').pop() : "";
         return {
            file: null,
            preview: img.image, 
            title: img.title || "",
            linkSlug: imgSlug, // We only edit the slug part
            existingUrl: img.image
         }
      }));
    } else {
      setAssetsCount(0);
      setAssets([]);
    }
    setIsModalOpen(true);
  };

  // --- SUBMISSION HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    
    // 1. Construct the Main Category Data
    const fullLink = `${frontendurl}/s/${slug}`;
    const path = `/s/${slug}`;

    formData.append("name", name);
    formData.append("slug", slug); // Save pure slug for future edits
    formData.append("link", fullLink); // THE GOLDEN RULE: frontendurl/s/slug
    formData.append("path", path);

    // 2. Process Assets
    const assetsMetadata = [];
    
    assets.forEach((asset, index) => {
      // Auto-construct Asset Link
      const assetFullLink = `${frontendurl}/s/${asset.linkSlug}`;

      if (asset.file) {
        formData.append("images", asset.file);
        assetsMetadata.push({
          title: asset.title,
          link: assetFullLink, // STRICT FORMAT
          type: "new",
        });
      } else if (asset.existingUrl) {
        assetsMetadata.push({
          title: asset.title,
          link: assetFullLink, // STRICT FORMAT
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
      console.error("âŒ SUBMISSION ERROR:", err);
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
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black text-slate-200 p-4 md:p-10 font-sans">
      
      {/* Background Ambience */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                Glow Haat  <span className="text-cyan-500">CMS</span>
              </h1>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" /> 
                Target: <span className="text-cyan-400 font-mono">{frontendurl}</span>
              </p>
              <p className="text-slate-400 font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" /> 
              <span>Build For Glow Haat Admins</span>
              </p>
            </div>
          </div>
          <GlassButton onClick={() => handleOpenCreate()}>
            <Plus className="w-5 h-5" /> Add Root Category
          </GlassButton>
        </header>

        <section className="mb-12 rounded-3xl border border-cyan-500/20 bg-white/[0.03] p-6 md:p-8 backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-400">SuperAdmin Logo Vault</p>
              <h2 className="mt-2 text-2xl font-bold text-white">GlowHaat Global Logo Control</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Upload logos as <span className="text-cyan-300">draft</span>, keep serial numbers, and activate exactly one logo at a time.
                If one logo is active, you must deactivate it first before activating another.
              </p>
            </div>
            <GlassButton
              variant="secondary"
              onClick={fetchLogos}
              isLoading={logoLoading}
              className="h-11 min-w-[170px]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Logos
            </GlassButton>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Bulk Draft Upload</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLogoSelection}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border file:border-cyan-400/30 file:bg-cyan-500/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-cyan-200 hover:file:bg-cyan-500/20"
                />
                <GlassButton
                  onClick={handleUploadDraftLogos}
                  isLoading={logoUploading}
                  className="h-11 min-w-[220px]"
                >
                  <UploadCloud className="h-4 w-4" />
                  {logoUploading ? "Uploading Drafts..." : "Upload Draft Logos"}
                </GlassButton>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Selected files: <span className="font-semibold text-cyan-300">{selectedLogoFiles.length}</span>
              </p>
              {logoStatusMessage ? (
                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                  {logoStatusMessage}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Currently Active Logo</p>
              {activeLogoItem ? (
                <div className="mt-4 space-y-3">
                  <img
                    src={activeLogoItem.logo}
                    alt={`Active Logo ${activeLogoItem.serialnumber}`}
                    className="h-20 w-full rounded-xl border border-cyan-500/30 bg-white/90 object-contain p-2"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Serial #{activeLogoItem.serialnumber}</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 font-semibold uppercase tracking-[0.1em] text-emerald-300">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-300">No active logo selected yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Logo Library</p>
            {logoLoading ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                Loading logo drafts...
              </div>
            ) : logoItems.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-slate-900/30 px-4 py-8 text-center text-sm text-slate-400">
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
                        "rounded-2xl border p-4 transition-all",
                        entry.isactive
                          ? "border-emerald-400/40 bg-emerald-500/10"
                          : "border-white/10 bg-slate-900/45"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-300">Serial #{entry.serialnumber}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 font-semibold uppercase tracking-[0.1em]",
                            entry.isactive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-300"
                          )}
                        >
                          {entry.isactive ? "active" : "draft"}
                        </span>
                      </div>
                      <img
                        src={entry.logo}
                        alt={`Logo ${entry.serialnumber}`}
                        className="mt-3 h-20 w-full rounded-xl border border-white/10 bg-white object-contain p-2"
                      />
                      <p className="mt-3 text-[11px] text-slate-400">Uploaded: {formatTimestamp(entry.createdAt)}</p>
                      <div className="mt-4 flex gap-2">
                        {entry.isactive ? (
                          <GlassButton
                            variant="danger"
                            onClick={() => handleDeactivateLogo(entry._id)}
                            isLoading={isDeactivateBusy}
                            className="flex-1 h-10 text-xs"
                          >
                            Deactivate
                          </GlassButton>
                        ) : (
                          <GlassButton
                            onClick={() => handleActivateLogo(entry._id)}
                            isLoading={isActivateBusy}
                            className="flex-1 h-10 text-xs"
                          >
                            Activate
                          </GlassButton>
                        )}
                        <GlassButton
                          variant="ghost"
                          onClick={() => handleDeleteDraftLogo(entry._id)}
                          isLoading={isDeleteBusy}
                          className="h-10 min-w-[90px] text-xs border border-white/10"
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
              <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
              <p className="text-cyan-500/50 font-mono tracking-widest animate-pulse">SYNCHRONIZING TREE...</p>
            </div>
          ) : navTree.length === 0 ? (
            <div className="text-center py-40 rounded-3xl border border-dashed border-white/10 bg-white/5">
                <p className="text-slate-500 text-lg mb-6">No hierarchy detected. Let&apos;s build something big.</p>
                <GlassButton variant="secondary" onClick={() => handleOpenCreate()} className="mx-auto">
                    Initialize Root
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
                  if(confirm("Delete this node and all children?")) {
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
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#0f172a] border border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_100px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0 bg-slate-900/50">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Zap className="text-cyan-400" />
                    {modalMode === "create" ? "New Navigation Entry" : "Edit Navigation"}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {activeParent ? `Adding sub-category to: ${activeParent.name}` : "Creating top-level category"}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                
                {/* 1. NAME & AUTO-LINK GENERATOR */}
                <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Category Name</label>
                            <input 
                            required 
                            autoFocus
                            value={name}
                            onChange={handleNameChange}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-lg font-bold placeholder:text-slate-700"
                            placeholder="e.g. Platinum Abaya"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Auto-Generated Slug
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">/s/</span>
                                <input 
                                value={slug}
                                onChange={handleSlugChange}
                                className="w-full pl-10 bg-slate-900 border border-green-500/20 rounded-xl px-5 py-4 text-green-400 font-mono focus:border-green-500 outline-none transition-all"
                                placeholder="platinum-abaya"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIVE URL PREVIEW */}
                    <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                            <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] text-cyan-500/70 uppercase font-bold tracking-wider">Final Link Structure</p>
                            <p className="text-sm font-mono text-cyan-100 truncate">
                                <span className="opacity-40">{frontendurl}</span>
                                <span className="opacity-60">/s/</span>
                                <span className="font-bold text-white bg-cyan-500/20 px-1 rounded">{slug || "..."}</span>
                            </p>
                        </div>
                        <CheckCircle2 className="text-cyan-500 w-5 h-5" />
                    </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* 2. ASSETS SECTION */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <label className="text-lg font-bold text-white flex items-center gap-2">
                        <LayoutGrid className="text-purple-500" /> Mega Menu Assets
                        </label>
                        <p className="text-slate-400 text-xs mt-1">Min: 0 | Max: 1000 items. Random neon styles applied automatically.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1.5 border border-white/10 self-start">
                      <span className="text-xs font-medium text-slate-400 pl-3">Total Images:</span>
                      <input 
                        type="number" 
                        min="0" max="1000"
                        value={assetsCount}
                        onChange={(e) => handleAssetCountChange(e.target.value)}
                        className="w-20 bg-slate-800 rounded-lg px-2 py-1 text-white text-center font-bold outline-none focus:bg-slate-700"
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
                            "relative bg-slate-950/40 border rounded-2xl p-4 flex flex-col md:flex-row gap-5 items-start transition-all duration-300 group",
                            "border-white/5 hover:border-white/10",
                            neon.ring
                        )}
                      >
                        {/* Decorative Neon Side Bar */}
                        <div className={cn("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", neon.border)} />

                        {/* Image Upload */}
                        <div className="shrink-0 w-full md:w-32 aspect-[3/4] relative group/image">
                          <label className={cn(
                              "absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden",
                              "border-white/10 hover:border-white/30"
                          )}>
                            {asset.preview ? (
                              <>
                                <img src={asset.preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                  <Edit3 className="text-white w-6 h-6" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center text-slate-500 group-hover/image:text-white transition-colors">
                                <UploadCloud className="w-8 h-8 mb-2" />
                                <span className="text-[10px] uppercase font-bold">Upload</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleAssetFileChange(idx, e.target.files?.[0])} 
                            />
                          </label>
                          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full font-mono border border-white/10">
                            #{idx + 1}
                          </div>
                        </div>

                        {/* Asset Details */}
                        <div className="flex-1 w-full space-y-4 pt-1 pl-2">
                            {/* Title Input */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Image Title</label>
                              <input 
                                placeholder="e.g. Eid Panjabi Collection"
                                value={asset.title}
                                onChange={(e) => handleAssetUpdate(idx, 'title', e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/30 outline-none transition-colors"
                              />
                            </div>

                            {/* Auto Link Display */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                Auto-Generated Link
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", neon.border.replace('bg-', 'bg-opacity-20 text-white'))}>
                                    Locked Format
                                </span>
                              </label>
                              <div className="relative group/link">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-3 h-3 group-focus-within/link:text-cyan-400" />
                                <div className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-9 pr-3 py-3 text-xs font-mono text-slate-400 flex items-center overflow-hidden">
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
                <div className="sticky bottom-0 bg-[#0f172a] pt-4 pb-2 border-t border-white/5 flex gap-4 z-20">
                  <GlassButton variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1 h-12">
                    Discard Changes
                  </GlassButton>
                  <GlassButton type="submit" isLoading={submitting} className="flex-[2] h-12 text-lg">
                    <Save className="w-5 h-5" /> 
                    {submitting ? "Processing..." : "Confirm & Save System"}
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
      `}</style>
    </div>
  );
};

export default AdminNavCustomization;
