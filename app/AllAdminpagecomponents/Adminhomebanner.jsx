"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Trash2,
  Edit3,
  Plus,
  Save,
  Moon,
  Sun,
  Image as ImageIcon,
  Link as LinkIcon,
  Hash,
  Loader2,
  X,
  Eye
} from "lucide-react";
import { frontendurl} from "../page";
import { serverurl } from "../utils/constants/serverurl";

// Import your server URL


const AdminHomeBanner = () => {
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [editMode, setEditMode] = useState(null); // stores the ID of banner being edited

  // Form State
  const [form, setForm] = useState({
    navigationlink: `${frontendurl}/b`,
    bannernumber: "",
    sectionkey: "home",
    image: null, // Stores the actual file object
  });
  
  // Image Preview State (for showing the image before upload)
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = `${serverurl}/homebanner`;

  // ===============================
  // FETCH BANNERS
  // ===============================
  const fetchBanners = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/gethomebanners?section=all`);
      if (data.success) {
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // ===============================
  // HANDLERS
  // ===============================
  
  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setPreview(URL.createObjectURL(file)); // Create local preview URL
    }
  };

  // Handle Edit Click
  const handleEditClick = (banner) => {
    setEditMode(banner._id);
    setForm({
      navigationlink: banner.navigationlink,
      bannernumber: banner.bannernumber,
      sectionkey: banner.sectionkey || "home",
      image: null, // Reset file input
    });
    setPreview(banner.image); // Show existing Cloudinary URL as preview
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle Cancel/Reset
  const resetForm = () => {
    setEditMode(null);
    setForm({ navigationlink: "", bannernumber: "", sectionkey: "home", image: null });
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Submit (Create or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editMode && !form.image) return toast.error("Please upload an image!");
    if (!form.bannernumber) return toast.error("Banner Number is required!");

    setSubmitting(true);
    const formData = new FormData();
    formData.append("navigationlink", form.navigationlink);
    formData.append("bannernumber", form.bannernumber);
    formData.append("sectionkey", form.sectionkey || "home");
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      if (editMode) {
        // EDIT MODE
        const { data } = await axios.put(`${API_URL}/edit/${editMode}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.success) {
          toast.success("Banner Updated Successfully!");
          fetchBanners();
          resetForm();
        }
      } else {
        // CREATE MODE
        const { data } = await axios.post(`${API_URL}/create`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.success) {
          toast.success("Banner Created Successfully!");
          setBanners([...banners, data.banner]); // Optimistic update or refetch
          fetchBanners(); // Refetch to be safe with sorting
          resetForm();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const { data } = await axios.delete(`${API_URL}/delete/${id}`);
      if (data.success) {
        toast.success("Banner Deleted");
        setBanners(banners.filter((b) => b._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // ===============================
  // UI RENDER
  // ===============================
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-blue-500">
        <Loader2 className="w-12 h-12 animate-spin" />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- HEADER --- */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center transition-colors ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg shadow-lg shadow-blue-500/30">
            <ImageIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Hero Banners
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">Manage your website homepage sliders</p>
          </div>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-full transition-all active:scale-95 ${
            darkMode ? "bg-slate-800 hover:bg-slate-700 text-yellow-400" : "bg-white shadow-md hover:bg-gray-100 text-slate-600"
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-10">

        {/* --- SECTION 1: EDITOR CARD --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 border shadow-2xl overflow-hidden relative ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"}`}
        >
           {/* Background Gradient Blob */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

           <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left: Image Uploader */}
              <div className="w-full md:w-1/2 space-y-4">
                 <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Banner Image</label>
                 
                 <div 
                   onClick={() => fileInputRef.current.click()}
                   className={`relative group w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                     ${darkMode ? "border-slate-700 hover:border-blue-500 hover:bg-slate-800" : "border-gray-300 hover:border-blue-500 hover:bg-gray-50"}
                   `}
                 >
                    {preview ? (
                      <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Edit3 className="text-white w-8 h-8" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                        <p className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Click to Upload</p>
                        <p className="text-xs text-gray-500 mt-1">1920x1080 Recommended</p>
                      </div>
                    )}
                 </div>
                 <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
              </div>

              {/* Right: Input Fields */}
              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
                 <div>
                    <h2 className={`text-xl font-bold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {editMode ? "Edit Banner Details" : "Add New Banner"}
                    </h2>
                    <p className="text-sm text-gray-500">Configure where this banner links to and its order.</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Link Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 ml-1">Destination URL</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="/shop/category/new-arrivals"
                          value={form.navigationlink}
                          onChange={(e) => setForm({...form, navigationlink: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all ${
                            darkMode ? "bg-slate-950 border-slate-700 focus:border-blue-500 text-white" : "bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Order Number Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 ml-1">Display Order (Number)</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          placeholder="e.g. 1"
                          value={form.bannernumber}
                          onChange={(e) => setForm({...form, bannernumber: e.target.value})}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all ${
                            darkMode ? "bg-slate-950 border-slate-700 focus:border-blue-500 text-white" : "bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 ml-1">CMS Section</label>
                      <select
                        value={form.sectionkey}
                        onChange={(e) => setForm({ ...form, sectionkey: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl outline-none border transition-all ${
                          darkMode ? "bg-slate-950 border-slate-700 focus:border-blue-500 text-white" : "bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900"
                        }`}
                      >
                        <option value="home">Home Hero</option>
                        <option value="bestselling">Best Selling Section</option>
                        <option value="fivestar">5-Star Section</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                       <button
                         type="submit"
                         disabled={submitting}
                         className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                       >
                         {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : editMode ? <><Save className="w-5 h-5"/> Update Banner</> : <><Plus className="w-5 h-5"/> Create Banner</>}
                       </button>
                       
                       {editMode && (
                         <button
                           type="button"
                           onClick={resetForm}
                           className={`px-5 py-3 rounded-xl font-medium transition-colors ${darkMode ? "bg-slate-800 text-gray-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"}`}
                         >
                           Cancel
                         </button>
                       )}
                    </div>

                 </form>
              </div>
           </div>
        </motion.div>

        {/* --- SECTION 2: ACTIVE BANNERS LIST --- */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Eye className="text-blue-500" />
            <h2 className={`text-xl font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Active Banners ({banners.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {banners.map((banner) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  key={banner._id}
                  className={`group relative rounded-2xl overflow-hidden border shadow-lg transition-all ${
                    darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                  }`}
                >
                  {/* Banner Image */}
                  <div className="aspect-video relative overflow-hidden">
                    <img src={banner.image} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    
                    {/* Badge Number */}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                      #{banner.bannernumber}
                    </div>
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 uppercase tracking-[0.1em]">
                      {banner.sectionkey || "home"}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                       <button 
                         onClick={() => handleEditClick(banner)}
                         className="p-3 bg-white/10 hover:bg-blue-500 text-white rounded-full backdrop-blur-md transition-all transform hover:scale-110"
                         title="Edit"
                       >
                         <Edit3 className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => handleDelete(banner._id)}
                         className="p-3 bg-white/10 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all transform hover:scale-110"
                         title="Delete"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Redirects To</p>
                      <p className={`text-sm truncate font-medium ${darkMode ? "text-gray-300" : "text-gray-800"}`}>
                        {banner.navigationlink || "No Link Set"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {banners.length === 0 && !loading && (
               <div className="col-span-full py-20 text-center text-gray-500 opacity-50">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                  <p>No banners active. Add one above!</p>
               </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default AdminHomeBanner;
