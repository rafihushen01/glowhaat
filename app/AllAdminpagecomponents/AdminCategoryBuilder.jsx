"use client"
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast, Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaCloudUploadAlt, FaNetworkWired, FaTrash, 
  FaEdit, FaEye, FaEyeSlash, FaPlus, FaTimes, FaSave,
} from 'react-icons/fa'
import { 
  LayoutDashboard, ImagePlus, Settings, 
  CheckCircle, XCircle, Loader2, ListTree, Tags
} from 'lucide-react'
import { FaSitemap } from 'react-icons/fa'
import { serverurl } from '../utils/constants/serverurl'




// Replace this with your actual config import


// ==========================================
// 🎨 THEME CONFIG (Damask Purple Style)
// ==========================================
const THEME = {
  bg: "bg-[#0f0c15]", // Deep dark purple-black
  card: "bg-[#1a1625]/80", // Glassy card
  accent: "from-violet-600 to-fuchsia-600",
  accentHover: "from-violet-500 to-fuchsia-500",
  textMain: "text-violet-50",
  textMuted: "text-violet-200/50",
  border: "border-violet-500/10"
}

// ==========================================
// 🧩 COMPONENT: AdminCategoryBuilder
// ==========================================
const AdminCategoryBuilder = () => {
  // --- State ---
  const [categories, setCategories] = useState([]);
  const [navTree, setNavTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    id: '', // For editing
    name: '',
    navrootid: '',
    type: 'slider',
    order: 0,
    mediaCount: 1,
    segments: [] 
  });
  
  const [files, setFiles] = useState({}); // Actual File objects
  const [previews, setPreviews] = useState({}); // URL previews for UI
  const [generatedSlots, setGeneratedSlots] = useState([{ id: 0 }]); // Slots UI

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, treeRes] = await Promise.all([
        (async () => {
          try {
            return await axios.get(`${serverurl}/category/all`);
          } catch (_err) {
            return axios.get(`${serverurl}/category/active`);
          }
        })(),
        axios.get(`${serverurl}/category/fulltree`),
      ]);

      const loadedCategories = Array.isArray(catRes?.data?.data) ? catRes.data.data : [];
      setCategories(loadedCategories);
      setNavTree(treeRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load data. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCount = categories.length;
  const activeCount = categories.filter((cat) => cat?.isactive).length;
  const inactiveCount = totalCount - activeCount;

  const visibleCategories = categories.filter((cat) => {
    if (statusFilter === 'active') return Boolean(cat?.isactive);
    if (statusFilter === 'inactive') return !cat?.isactive;
    return true;
  });

  // --- Form Handlers ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMediaCountChange = (e) => {
    let count = parseInt(e.target.value) || 1;
    if (count > 50) count = 50; // Cap it for safety
    if (count < 1) count = 1;
    
    setFormData(prev => ({ ...prev, mediaCount: count }));
    
    // Generate simple ID array for slots
    const newSlots = Array.from({ length: count }, (_, i) => ({ id: i }));
    setGeneratedSlots(newSlots);
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Save file for upload
      setFiles(prev => ({ ...prev, [index]: file }));
      
      // 2. Create instant preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [index]: previewUrl }));
      
      toast.success(`Media #${index + 1} selected`);
    }
  };

  const toggleSegmentSelection = (navId) => {
    setFormData(prev => {
      const exists = prev.segments.includes(navId);
      return {
        ...prev,
        segments: exists 
          ? prev.segments.filter(id => id !== navId)
          : [...prev.segments, navId]
      };
    });
  };

  const handleEditClick = (cat) => {
    setFormData({
      id: cat._id,
      name: cat.name,
      navrootid: cat.navrootid?._id || cat.navrootid, // Handle if populated or not
      type: cat.type || 'slider',
      order: cat.order || 0,
      mediaCount: cat.media ? cat.media.length : 1,
      segments: cat.segments ? cat.segments.map(s => s._id || s) : []
    });
    
    // Setup slots based on existing media
    const count = cat.media ? cat.media.length : 1;
    setGeneratedSlots(Array.from({ length: count }, (_, i) => ({ id: i })));
    
    // Note: We can't easily preview existing server images in this specific local preview logic 
    // without more complex logic, so we start fresh for uploads or would need to map server URLs to previews.
    // For simplicity in this fix, we reset file inputs.
    setFiles({});
    setPreviews({}); 
    
    setView('edit');
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`${serverurl}/category/toggle-status/${id}`);
      toast.success("Status updated!");
      fetchData(); // Refresh list
    } catch (err) {
      toast.error("Toggle failed");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(`${serverurl}/category/delete/${id}`);
      toast.success("Category deleted");
      fetchData();
    } catch(err) {
      toast.error("Delete failed");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedName = String(formData.name || "").trim();
    const cleanedNavRootId = String(formData.navrootid || "").trim();

    if (!cleanedName || !cleanedNavRootId) {
      return toast.error("Name and Menu Location are required!");
    }

    const normalizedSegments = Array.isArray(formData.segments)
      ? formData.segments.map((seg) => String(seg).trim()).filter(Boolean)
      : [];

    const hasMedia = Object.keys(files).length > 0;
    let payload = null;

    if (hasMedia) {
      const formPayload = new FormData();
      formPayload.append("name", cleanedName);
      formPayload.append("navrootid", cleanedNavRootId);
      formPayload.append("type", formData.type || "slider");
      formPayload.append("order", String(Number(formData.order) || 0));

      Object.keys(files).forEach((key) => {
        formPayload.append("media", files[key]);
      });

      normalizedSegments.forEach((seg) => {
        formPayload.append("segments", seg);
      });

      payload = formPayload;
    } else {
      payload = {
        name: cleanedName,
        navrootid: cleanedNavRootId,
        type: formData.type || "slider",
        order: Number(formData.order) || 0,
        segments: normalizedSegments,
      };
    }

    try {
      setSubmitting(true);
      const apibase = serverurl.replace(/\/+$/, "");
      const url = view === 'edit' 
        ? `${apibase}/category/update/${formData.id}`
        : `${apibase}/category/create`;
        
      const method = view === 'edit' ? axios.put : axios.post;
      
      await method(url, payload);

      toast.success(view === 'edit' ? "Category Updated!" : "New Category Created!");
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setView('list');
    setFiles({});
    setPreviews({});
    setFormData({ name: '', navrootid: '', type: 'slider', order: 0, mediaCount: 1, segments: [] });
  };

  // --- Render Helpers ---
  // Recursive function to render dropdown options with indentation
  const renderNavOptions = (nodes, depth = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node._id}>
        <option value={node._id}>
          {'\u00A0'.repeat(depth * 4)} {depth > 0 ? '└─ ' : ''} {node.name}
        </option>
        {node.children && node.children.length > 0 && renderNavOptions(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  // Recursive segment selector
  const renderSegmentSelector = (nodes, depth = 0) => {
    return nodes.map(node => (
      <div key={node._id} className="mb-1">
        <div 
          onClick={() => toggleSegmentSelection(node._id)}
          className={`
            cursor-pointer p-3 rounded-lg flex items-center justify-between transition-all duration-200 select-none
            ${formData.segments.includes(node._id) 
              ? 'bg-violet-600/20 border-l-4 border-violet-500' 
              : 'bg-slate-800/30 hover:bg-slate-800/60 border-l-4 border-transparent'}
          `}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <div className="flex items-center gap-3">
            {formData.segments.includes(node._id) 
              ? <CheckCircle size={16} className="text-violet-400"/> 
              : <div className="w-4 h-4 rounded-full border border-slate-600"/>
            }
            <span className={`text-sm ${formData.segments.includes(node._id) ? 'text-white font-medium' : 'text-slate-400'}`}>
              {node.name}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-600">{node.slug}</span>
        </div>
        {node.children && renderSegmentSelector(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.textMain} font-sans selection:bg-violet-500 selection:text-white pb-20`}>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e1b2e', color: '#fff', border: '1px solid #4c1d95' } }} />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6"
        >
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${THEME.accent} shadow-lg shadow-violet-900/20`}>
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400"> Category Builder</span>
              </h1>
              <p className={THEME.textMuted}>Manage your visual categories & collections</p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {view === 'list' ? (
              <button 
                onClick={() => setView('create')}
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold bg-white text-violet-950 hover:bg-violet-50 transition-colors shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2`}
              >
                <FaPlus /> Create New
              </button>
            ) : (
              <button 
                onClick={resetForm}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes /> Cancel
              </button>
            )}
          </div>
        </motion.div>

        {/* MAIN CONTENT AREA */}
        <AnimatePresence mode='wait'>
          
          {/* VIEW: LIST OF CATEGORIES */}
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {[
                  { key: 'all', label: `All (${totalCount})` },
                  { key: 'active', label: `Active (${activeCount})` },
                  { key: 'inactive', label: `Inactive (${inactiveCount})` },
                ].map((filter) => {
                  const isCurrent = statusFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      onClick={() => setStatusFilter(filter.key)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && <div className="col-span-full text-center py-20 text-slate-500 flex flex-col items-center"><Loader2 className="animate-spin mb-4"/> Loading System...</div>}
                
                {!loading && visibleCategories.map((cat, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={cat._id}
                    className={`group relative ${THEME.card} border ${THEME.border} rounded-3xl p-6 hover:border-violet-500/30 transition-all duration-300 flex flex-col h-full`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400">
                        <ListTree size={20} />
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${cat.isactive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {cat.isactive ? 'LIVE' : 'HIDDEN'}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">{cat.slug}</p>

                    <div className="space-y-2 mb-6 flex-grow">
                      <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 p-2 rounded">
                        <FaSitemap className="text-violet-500/70" size={12}/>
                        <span className="truncate">{cat.navrootid?.name || 'Unassigned Root'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                          <Tags size={12}/> {cat.segments?.length || 0} Filters
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                          <ImagePlus size={12}/> {cat.media?.length || 0} Media
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-auto">
                      <button onClick={() => handleToggleStatus(cat._id)} className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex justify-center">
                        {cat.isactive ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button onClick={() => handleEditClick(cat)} className="py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 flex justify-center">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(cat._id)} className="py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 flex justify-center">
                        <FaTrash />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {!loading && visibleCategories.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-400">
                    No categories found for this filter.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* VIEW: CREATE / EDIT FORM */}
          {(view === 'create' || view === 'edit') && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className={`${THEME.card} border ${THEME.border} rounded-[2rem] p-6 md:p-10 shadow-2xl backdrop-blur-xl`}
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Category Title</label>
                    <input 
                      type="text" name="name" 
                      value={formData.name} onChange={handleInputChange}
                      placeholder="e.g. Eid Collection 2026"
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Menu Location (Parent)</label>
                    <select 
                      name="navrootid" 
                      value={formData.navrootid} onChange={handleInputChange}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
                    >
                      <option value="">-- Select Parent Menu --</option>
                      {renderNavOptions(navTree)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Sort Order</label>
                    <input 
                      type="number" name="order" 
                      value={formData.order} onChange={handleInputChange}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-800 w-full" />

                {/* 2. Complex Builders */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* Filter/Segment Selector */}
                  <div className="xl:col-span-1 flex flex-col h-[500px]">
                     <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                          <Tags className="text-fuchsia-400"/> Filter Tags
                        </h3>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Multi-Select</span>
                     </div>
                     <div className="flex-1 bg-slate-950/30 rounded-2xl border border-slate-800 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-violet-900 scrollbar-track-transparent">
                        {renderSegmentSelector(navTree)}
                     </div>
                  </div>

                  {/* Media Uploader */}
                  <div className="xl:col-span-2 flex flex-col h-[500px]">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                          <ImagePlus className="text-cyan-400"/> Media Gallery
                        </h3>
                        <div className="flex items-center gap-3 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                          <span className="text-xs text-slate-400 uppercase">Total Slots:</span>
                          <input 
                            type="number" min="1" max="50" 
                            value={formData.mediaCount} onChange={handleMediaCountChange}
                            className="w-12 bg-transparent text-white font-bold text-center outline-none"
                          />
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-950/30 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {generatedSlots.map((slot) => (
                          <div key={slot.id} className="aspect-[3/4] relative group">
                            <input 
                              type="file" 
                              accept="image/*,video/*"
                              onChange={(e) => handleFileChange(e, slot.id)}
                              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                            />
                            
                            {/* Visual State */}
                            <div className={`
                              absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-2 text-center overflow-hidden
                              ${previews[slot.id] ? 'border-violet-500 bg-slate-900' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-500'}
                            `}>
                              {previews[slot.id] ? (
                                <>
                                  <img src={previews[slot.id]} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                  <div className="relative z-10 bg-black/60 p-2 rounded-full backdrop-blur-md">
                                    <CheckCircle className="text-green-400 w-6 h-6" />
                                  </div>
                                  <p className="relative z-10 text-[10px] text-white mt-2 font-mono truncate w-full px-2">
                                    {files[slot.id]?.name}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <FaCloudUploadAlt className="text-slate-500 w-8 h-8 mb-2 group-hover:text-white transition-colors"/>
                                  <span className="text-xs text-slate-500 font-bold group-hover:text-slate-300">Slot {slot.id + 1}</span>
                                  <span className="text-[10px] text-slate-600">Click to upload</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="pt-6 flex justify-end">
                   <button 
                      type="submit" 
                      disabled={submitting}
                      className={`
                        relative overflow-hidden group px-12 py-4 rounded-xl font-bold text-lg text-white shadow-2xl
                        bg-gradient-to-r ${THEME.accent} hover:${THEME.accentHover}
                        disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]
                      `}
                   >
                      <div className="relative z-10 flex items-center gap-3">
                        {submitting ? <Loader2 className="animate-spin"/> : <FaSave />}
                        {submitting ? 'Processing...' : (view === 'edit' ? 'Update Category' : 'Launch Category')}
                      </div>
                      {/* Shine Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                   </button>
                </div>

              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminCategoryBuilder
