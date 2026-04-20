"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Upload, Sun, Moon,
  Package, Layers, Truck, Save, X, Edit, 
  Image as ImageIcon, Zap, DollarSign, Percent, 
  Check, ArrowRight, Calculator
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import CategorySelector from "./adminutils/AdminItemCategory";
import { serverurl } from "../utils/constants/serverurl";
// ================= CONFIG =================
const SERVER_URL = serverurl;

// ================= ANIMATIONS =================
const containerVars = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};

// ================= HELPER FUNCTIONS =================
const calculateFinalPrice = (base, discount) => {
  const p = parseFloat(base) || 0;
  const d = parseFloat(discount) || 0;
  if (p <= 0) return 0;
  const final = p - (p * (d / 100));
  return final.toFixed(2); // Returns string with 2 decimals
};

// ================= MAIN COMPONENT =================
const AdminItemManagements = () => {
  const [darkMode, setDarkMode] = useState(true);

  // ===== FORM STATE =====
  const initialForm = {
    name: "", description: "", highlight: "", aboutitems: "", brand: "", type: "fashion",
  
 categoryids: [], categorytree: [], categorypath: "",

    flashsale: false, eidsale: false, coustomsale: false, isreturnable: true,
    warrantynotavalible: false, isperishable: false, isactive: true, iskhanproduct: true,
    expirydate: "", warranty: "", warrantyperiod: "",
    deliveryschema: { name: "Standard Delivery", deliverytime: "3-5 Days", deliverycharge: 60, isfreeshipping: false },
    whiteimage: null, hoverimage: null, gallery: [],
    variants: [], 
  };

  const [formData, setFormData] = useState(initialForm);
  const [previews, setPreviews] = useState({ whiteimage: "", hoverimage: "", gallery: [], variantImages: {} });

  // ================= HANDLERS =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      deliveryschema: { ...prev.deliveryschema, [name]: type === "checkbox" ? checked : value }
    }));
  };

  const handleMainMedia = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
      setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const handleGallery = (e) => {
    const files = Array.fro(e.target.files);
    if (files.length) {
      setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ...files] }));
      const newUrls = files.map(f => URL.createObjectURL(f));
      setPreviews(prev => ({ ...prev, gallery: [...prev.gallery, ...newUrls] }));
    }
  };

  // ===== VARIANT LOGIC =====
  const createVariantGroups = (count) => {
    const num = parseInt(count);
    if (!num || num < 1) return;
    const newVars = Array(num).fill(null).map(() => ({
      name: "", varianttype: "Color", colorHex: "#3B82F6", images: [], imageSlots: 4, options: []
    }));
    setFormData(prev => ({ ...prev, variants: [...prev.variants, ...newVars] }));
  };

  const setVariantImageSlots = (vIndex, count) => {
    const newVars = [...formData.variants];
    newVars[vIndex].imageSlots = parseInt(count) || 1;
    setFormData(prev => ({ ...prev, variants: newVars }));
  };

  const handleVariantImageUpload = (e, vIndex, slotIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    const newVars = [...formData.variants];
    if (!newVars[vIndex].images) newVars[vIndex].images = [];
    newVars[vIndex].images[slotIndex] = file; 
    setFormData(prev => ({ ...prev, variants: newVars }));

    const newPrev = { ...previews };
    if (!newPrev.variantImages[vIndex]) newPrev.variantImages[vIndex] = [];
    newPrev.variantImages[vIndex][slotIndex] = URL.createObjectURL(file);
    setPreviews(newPrev);
  };

  const addOption = (vIndex) => {
    const newVars = [...formData.variants];
    newVars[vIndex].options.push({
      name: "", baseprice: "", discountpercentage: "", stock: 100, skucode: "",
      weight: "", expirydate: "", discountstartdatae: "", discountenddate: ""
    });
    setFormData(prev => ({ ...prev, variants: newVars }));
  };

  const removeVariant = (index) => {
    const newVars = [...formData.variants];
    newVars.splice(index, 1);
    setFormData(prev => ({ ...prev, variants: newVars }));
  };

  // ===== SUBMIT LOGIC =====
 const appendFormData = (formData, fd) => {
  Object.keys(formData).forEach(key => {
    if (["variants", "gallery", "whiteimage", "hoverimage", "deliveryschema", "categoryids", "categorytree", "categorypath"].includes(key)) return;

    const val = formData[key];

    if (val !== undefined && val !== null) {
      fd.append(key, val);
    }
  });

  const categoryids = Array.isArray(formData.categoryids) ? formData.categoryids : [];
  const categorytree = Array.isArray(formData.categorytree) ? formData.categorytree : [];
  const categorypath =
    typeof formData.categorypath === "string"
      ? formData.categorypath
      : categorytree.join(" > ");

  fd.append("categoryids", JSON.stringify(categoryids));
  fd.append("categorytree", JSON.stringify(categorytree));
  fd.append("categorypath", categorypath);

};


  const handleSubmit = async () => {
    const toastId = toast.loading("Uploading Item...");
    try {
      if (!Array.isArray(formData.categoryids) || formData.categoryids.length === 0) {
        toast.error("Please select a category path before publishing.", { id: toastId });
        return;
      }

      const data = new FormData();
      // const catArray = formData.categoryPathInput.split(">").map(s => s.trim()).filter(s => s);
      // data.append("categorynames", JSON.stringify(catArray));
      
      appendFormData(formData, data);
      data.append("deliveryschema", JSON.stringify(formData.deliveryschema));
      
      if (formData.whiteimage) data.append("whiteimage", formData.whiteimage);
      if (formData.hoverimage) data.append("hoverimage", formData.hoverimage);
      formData.gallery.forEach(f => data.append("gallery", f));

      const variantsJSON = formData.variants.map(v => ({ ...v, images: v.images.map(() => "") }));
      data.append("variants", JSON.stringify(variantsJSON));

      formData.variants.forEach((v, vIndex) => {
        v.images.forEach((img, slotIndex) => {
          if (img) data.append(`variantmedia_${vIndex}_${slotIndex}`, img);
        });
      });

      const res = await axios.post(`${SERVER_URL}/item/create`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success("Item Published!", { id: toastId });
        setFormData(initialForm);
        setPreviews({ whiteimage: "", hoverimage: "", gallery: [], variantImages: {} });
      } else {
        toast.error(res.data.message || "Failed.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload Failed.", { id: toastId });
    }
  };

  // ================= STYLES =================
  const theme = {
    bg: darkMode ? "bg-[#050b14]" : "bg-slate-50",
    text: darkMode ? "text-blue-50" : "text-slate-900",
    card: darkMode ? "bg-[#0f1623]/90 border-blue-900/30" : "bg-white border-blue-200 shadow-xl shadow-blue-500/5",
    input: darkMode ? "bg-[#0a0f1c] border-blue-900/50 text-white placeholder-slate-600 focus:bg-[#111928]" : "bg-slate-50 border-blue-200 text-slate-900 placeholder-slate-400 focus:bg-white",
    label: darkMode ? "text-blue-400" : "text-blue-600",
    subText: darkMode ? "text-slate-400" : "text-slate-500",
    divider: darkMode ? "border-slate-800" : "border-slate-200",
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${theme.bg} ${theme.text}`}>
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      
      {/* NAVBAR */}
      <nav className={`fixed w-full z-50 backdrop-blur-xl border-b transition-all duration-300 ${darkMode ? "bg-[#050b14]/80 border-blue-900/30" : "bg-white/90 border-blue-200"} px-4 md:px-8 py-3 flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-400 p-2 rounded-xl shadow-lg shadow-blue-500/30">
            <Layers className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent leading-none">
              Glow Haat
            </h1>
            <span className="text-[10px] font-mono text-blue-500 block tracking-widest opacity-90">ADMIN PANEL</span>
          </div>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full border transition ${darkMode ? "bg-slate-800 border-slate-700" : "bg-blue-100 border-blue-200"}`}>
          {darkMode ? <Sun className="text-yellow-400 w-5 h-5 animate-spin-slow" /> : <Moon className="text-blue-600 w-5 h-5" />}
        </button>
      </nav>

      {/* CONTENT */}
      <main className="pt-24 pb-32 max-w-7xl mx-auto px-4 md:px-8">
        <motion.div variants={containerVars} initial="hidden" animate="visible" className="space-y-6">
          
          {/* 1. CORE INFO */}
          <SectionContainer title="Core Identity" icon={<Package />} subtitle="Product Details & Description" theme={theme}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Product Name" name="name" val={formData.name} onChange={handleChange} theme={theme} />
              <Input label="Brand" name="brand" val={formData.brand} onChange={handleChange} theme={theme} />
              
             
              <div>

      <CategorySelector
  onSelect={(cat) => {
    setFormData(prev => ({
      ...prev,
      categoryids: Array.isArray(cat.ids) ? cat.ids : [],
      categorytree: Array.isArray(cat.names) ? cat.names : [],
      categorypath: Array.isArray(cat.names) ? cat.names.join(" > ") : ""
    }));
  }}
/>


              </div>

              <TextArea label="Description" name="description" val={formData.description} onChange={handleChange} theme={theme} rows={4} />
              <TextArea label="Highlights" name="highlight" val={formData.highlight} onChange={handleChange} theme={theme} placeholder="â€¢ Feature 1&#10;â€¢ Feature 2" rows={4} />
              <div className="col-span-1 md:col-span-2">
                 <TextArea label="Product Story (About)" name="aboutitems" val={formData.aboutitems} onChange={handleChange} theme={theme} rows={3} />
              </div>
            </div>

            {/* SMOOTH TOGGLES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
                <Toggle label="Flash Sale" name="flashsale" checked={formData.flashsale} onChange={handleChange} activeColor="bg-red-500" theme={theme} />
                <Toggle label="Eid Sale" name="eidsale" checked={formData.eidsale} onChange={handleChange} activeColor="bg-green-500" theme={theme} />
                <Toggle label="Custom Sale" name="coustomsale" checked={formData.coustomsale} onChange={handleChange} activeColor="bg-purple-500" theme={theme} />
                <Toggle label="Khan Own Product" name="iskhanproduct" checked={formData.iskhanproduct} onChange={handleChange} activeColor="bg-emerald-500" theme={theme} />
                <Toggle label="Perishable (Food)" name="isperishable" checked={formData.isperishable} onChange={handleChange} activeColor="bg-orange-500" theme={theme} />
                <Toggle label="Returnable" name="isreturnable" checked={formData.isreturnable} onChange={handleChange} activeColor="bg-blue-500" theme={theme} />
                <Toggle label="No Warranty" name="warrantynotavalible" checked={formData.warrantynotavalible} onChange={handleChange} activeColor="bg-gray-500" theme={theme} />
            </div>
          </SectionContainer>

          {/* 2. MEDIA */}
          <SectionContainer title="Visual Assets" icon={<ImageIcon />} subtitle="High Quality Imagery" theme={theme}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <ImageUploader label="White BG (Main)" field="whiteimage" preview={previews.whiteimage} onChange={handleMainMedia} theme={theme} darkMode={darkMode} />
                 <ImageUploader label="Hover Action" field="hoverimage" preview={previews.hoverimage} onChange={handleMainMedia} theme={theme} darkMode={darkMode} />
                 
                 <div className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center min-h-[200px] transition-all group overflow-hidden ${darkMode ? "border-blue-900/50 bg-[#0f1623] hover:border-blue-500" : "border-blue-300 bg-blue-50 hover:border-blue-500"}`}>
                    <input type="file" multiple onChange={handleGallery} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                    <div className="grid grid-cols-3 gap-1 absolute inset-0 p-2 z-10 opacity-30">
                        {previews.gallery.slice(0,9).map((src,i) => <img key={i} src={src} className="w-full h-full object-cover rounded-md" />)}
                    </div>
                    <div className={`z-30 text-center backdrop-blur-md p-4 rounded-xl border shadow-xl ${darkMode ? "bg-black/60 border-white/10" : "bg-white/80 border-blue-100"}`}>
                        <Upload className={`mx-auto mb-2 ${darkMode ? "text-white" : "text-blue-600"}`} />
                        <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>Upload Gallery</span>
                        <span className="text-blue-400 text-[10px] block mt-1">{previews.gallery.length} Selected</span>
                    </div>
                 </div>
            </div>
          </SectionContainer>

          {/* 3. LOGISTICS */}
          <SectionContainer title="Logistics" icon={<Truck />} subtitle="Shipping & Warranty" theme={theme}>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Input label="Delivery Name" name="name" val={formData.deliveryschema.name} onChange={handleDeliveryChange} theme={theme} />
                <Input label="Delivery Duration" name="deliverytime" val={formData.deliveryschema.deliverytime} onChange={handleDeliveryChange} theme={theme} />
                <Input label="Delivery Charge ($)" name="deliverycharge" type="number" val={formData.deliveryschema.deliverycharge} onChange={handleDeliveryChange} theme={theme} />
                <div className="flex items-end h-full pb-1">
                   <Toggle label="Free Shipping" name="isfreeshipping" checked={formData.deliveryschema.isfreeshipping} onChange={handleDeliveryChange} activeColor="bg-green-500" theme={theme} fullWidth />
                </div>
                <Input label="Warranty Policy" name="warranty" val={formData.warranty} onChange={handleChange} theme={theme} />
                <Input label="Period" name="warrantyperiod" val={formData.warrantyperiod} onChange={handleChange} theme={theme} />
                <Input label="Expiry Date" name="expirydate" type="date" val={formData.expirydate} onChange={handleChange} theme={theme} />
             </div>
          </SectionContainer>

          {/* 4. VARIANT ENGINE */}
          <motion.div variants={itemVars} className="rounded-3xl p-[2px] bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-500">
             <div className={`p-5 md:p-8 rounded-[22px] ${theme.bg}`}>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                   <div className="flex items-center gap-3">
                      <Zap className="text-yellow-400 fill-yellow-400" />
                      <div>
                         <h2 className={`text-xl font-bold ${theme.text}`}>Variant Engine</h2>
                         <p className={`text-xs ${theme.subText}`}>Real-time Pricing & Inventory</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <input type="number" id="group-count" placeholder="Qty" className={`w-20 text-center rounded-lg border outline-none font-bold ${theme.input}`} />
                      <button onClick={() => createVariantGroups(document.getElementById('group-count').value)} className="bg-blue-600 px-6 py-2 rounded-lg text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/30">GENERATE</button>
                   </div>
                </div>

                <div className="space-y-6">
                   <AnimatePresence>
                   {formData.variants.map((variant, vIndex) => (
                      <motion.div key={vIndex} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`p-4 md:p-6 rounded-2xl border relative overflow-hidden ${theme.card}`}>
                         
                         {/* Variant Header */}
                         <div className="flex flex-col lg:flex-row gap-4 mb-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                               <Input compact label="Variant Name" val={variant.name} onChange={(e) => { const arr = [...formData.variants]; arr[vIndex].name = e.target.value; setFormData({...formData, variants: arr}); }} theme={theme} placeholder="e.g. Blue" />
                               <Input compact label="Type" val={variant.varianttype} onChange={(e) => { const arr = [...formData.variants]; arr[vIndex].varianttype = e.target.value; setFormData({...formData, variants: arr}); }} theme={theme} placeholder="Color" />
                               
                               <div className="col-span-1">
                                  <Label text="Color Hex" theme={theme} />
                                  <div className={`flex items-center gap-2 h-[42px] rounded-xl px-2 border ${theme.divider}`}>
                                     <input type="color" value={variant.colorHex} onChange={(e) => { const arr = [...formData.variants]; arr[vIndex].colorHex = e.target.value; setFormData({...formData, variants: arr}); }} className="h-6 w-6 rounded bg-transparent border-none cursor-pointer" />
                                     <span className={`text-[10px] font-mono ${theme.subText}`}>{variant.colorHex}</span>
                                  </div>
                               </div>
                               <Input compact type="number" label="Image Slots" val={variant.imageSlots} onChange={(e) => setVariantImageSlots(vIndex, e.target.value)} theme={theme} />
                            </div>
                            <button onClick={() => removeVariant(vIndex)} className="self-end lg:self-center p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"><Trash2 size={18} /></button>
                         </div>

                         {/* Image Slots */}
                         <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            <div className="flex gap-2 min-w-max">
                               {Array.from({ length: variant.imageSlots || 4 }).map((_, slotIdx) => (
                                  <div key={slotIdx} className={`w-16 h-16 md:w-20 md:h-20 relative rounded-lg border-2 border-dashed flex-shrink-0 flex items-center justify-center overflow-hidden transition-colors ${darkMode ? "border-slate-700 bg-slate-800 hover:border-blue-500" : "border-blue-200 bg-white hover:border-blue-500"}`}>
                                     {previews.variantImages[vIndex]?.[slotIdx] ? (
                                        <img src={previews.variantImages[vIndex][slotIdx]} className="w-full h-full object-cover" />
                                     ) : <span className="text-[10px] text-slate-400">{slotIdx+1}</span>}
                                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleVariantImageUpload(e, vIndex, slotIdx)} />
                                  </div>
                               ))}
                            </div>
                         </div>

                         {/* === OPTIONS: MOBILE CARD VIEW (With Calculator) === */}
                         <div className="md:hidden space-y-4">
                            {variant.options.map((opt, oIndex) => {
                                const finalPrice = calculateFinalPrice(opt.baseprice, opt.discountpercentage);
                                return (
                                    <div key={oIndex} className={`p-4 rounded-xl border space-y-3 relative ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-100 border-blue-200"}`}>
                                        <button onClick={() => {const arr = [...formData.variants]; arr[vIndex].options.splice(oIndex, 1); setFormData({...formData, variants: arr});}} className="absolute top-2 right-2 text-red-400 p-2"><X size={16}/></button>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2"><Input compact label="Option Name" placeholder="Size (S/M/L)" val={opt.name} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].name = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} /></div>
                                            <Input compact type="number" label="Base Price" placeholder="0.00" val={opt.baseprice} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].baseprice = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} />
                                            <Input compact type="number" label="Discount %" placeholder="0" val={opt.discountpercentage} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].discountpercentage = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} />
                                        </div>
                                        
                                        {/* Mobile Calculator Display */}
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30">
                                            <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase">
                                                <Calculator size={14} /> Final Price
                                            </div>
                                            <div className="text-lg font-black text-blue-500">${finalPrice}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input compact type="number" label="Stock" val={opt.stock} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].stock = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} />
                                            <Input compact label="SKU" val={opt.skucode} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].skucode = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} />
                                        </div>
                                    </div>
                                )
                            })}
                         </div>

                         {/* === OPTIONS: DESKTOP TABLE VIEW (With Calculator) === */}
                         <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50">
                            <table className="w-full text-left">
                               <thead className={`${darkMode ? "bg-slate-900/50 text-slate-400" : "bg-blue-50 text-slate-600"} text-xs uppercase`}>
                                  <tr>
                                     <th className="p-3">Option</th>
                                     <th className="p-3">Base Price</th>
                                     <th className="p-3">Discount %</th>
                                     <th className="p-3 text-blue-500">Final Price</th>
                                     <th className="p-3">Stock</th>
                                     <th className="p-3">SKU</th>
                                     <th className="p-3"></th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {variant.options.map((opt, oIndex) => (
                                     <tr key={oIndex} className={`border-t ${theme.divider}`}>
                                        <td className="p-2 w-32"><Input compact val={opt.name} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].name = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} /></td>
                                        <td className="p-2 w-28"><Input compact type="number" val={opt.baseprice} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].baseprice = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} /></td>
                                        <td className="p-2 w-24"><Input compact type="number" val={opt.discountpercentage} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].discountpercentage = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} /></td>
                                        
                                        {/* Desktop Realtime Calculator */}
                                        <td className="p-2">
                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-center">
                                                <span className="text-sm font-bold text-blue-500 block">${calculateFinalPrice(opt.baseprice, opt.discountpercentage)}</span>
                                            </div>
                                        </td>

                                        <td className="p-2 w-24"><Input compact type="number" val={opt.stock} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].stock = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} /></td>
                                        <td className="p-2 w-32"><Input compact val={opt.skucode} onChange={(e) => {const arr = [...formData.variants]; arr[vIndex].options[oIndex].skucode = e.target.value; setFormData({...formData, variants: arr});}} theme={theme} /></td>
                                        <td className="p-2 text-center"><button onClick={() => {const arr = [...formData.variants]; arr[vIndex].options.splice(oIndex, 1); setFormData({...formData, variants: arr});}} className="text-red-400 hover:text-red-500 p-2"><X size={16} /></button></td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                         
                         <button onClick={() => addOption(vIndex)} className="w-full py-3 mt-4 rounded-xl border border-dashed border-blue-500/30 text-blue-500 text-xs font-bold hover:bg-blue-500/10 transition">+ ADD OPTION</button>
                      </motion.div>
                   ))}
                   </AnimatePresence>
                </div>
             </div>
          </motion.div>

        </motion.div>
      </main>

      {/* FOOTER */}
      <div className={`fixed bottom-0 left-0 w-full z-40 p-4 border-t backdrop-blur-xl ${darkMode ? "bg-[#050b14]/90 border-blue-900/50" : "bg-white/90 border-blue-200"}`}>
         <div className="max-w-7xl mx-auto flex justify-end">
            <button onClick={handleSubmit} className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 md:py-4 px-10 rounded-xl shadow-lg shadow-blue-600/30 active:scale-95 transition-transform flex items-center justify-center gap-2">
               <Save size={20} />
               <span>PUBLISH ITEM</span>
            </button>
         </div>
      </div>

    </div>
  );
};

// ================= UI HELPERS =================

const SectionContainer = ({ title, icon, subtitle, children, theme }) => (
  <motion.div variants={itemVars} className={`p-5 md:p-8 rounded-3xl border backdrop-blur-sm ${theme.card}`}>
    <div className={`flex items-start gap-4 mb-6 border-b border-dashed ${theme.divider} pb-4`}>
      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">{icon}</div>
      <div>
        <h2 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400`}>{title}</h2>
        <p className={`text-sm ${theme.subText}`}>{subtitle}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

const Label = ({ text, theme }) => (
    <label className={`text-xs font-bold mb-1.5 block uppercase tracking-wider ${theme.label}`}>{text}</label>
);

const Input = ({ label, name, val, onChange, theme, type = "text", placeholder, compact = false }) => (
  <div className="w-full">
    {label && <Label text={label} theme={theme} />}
    <input type={type} name={name} value={val} onChange={onChange} placeholder={placeholder}
      className={`w-full rounded-xl outline-none transition-all duration-300 font-medium ${compact ? "p-2 text-sm h-[42px]" : "p-3 md:p-4 text-sm"} ${theme.input}`} />
  </div>
);

const TextArea = ({ label, name, val, onChange, theme, placeholder, rows = 4 }) => (
  <div className="w-full">
    {label && <Label text={label} theme={theme} />}
    <textarea name={name} value={val} onChange={onChange} placeholder={placeholder} rows={rows}
      className={`w-full p-3 md:p-4 rounded-xl outline-none transition-all duration-300 font-medium text-sm resize-none ${theme.input}`} />
  </div>
);

// === FIXED TOGGLE COMPONENT (No more crash!) ===
const Toggle = ({ label, name, checked, onChange, activeColor, theme, fullWidth }) => (
  <label className={`relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group select-none
    ${checked ? `${darkMode(theme) ? "bg-slate-800/50" : "bg-blue-50"} border-blue-500/50` : `border-transparent hover:${darkMode(theme) ? "bg-slate-800/30" : "bg-blue-50"}`} 
    ${fullWidth ? "w-full" : ""}`}>
    
    <span className={`text-xs font-bold transition-colors ${checked ? (darkMode(theme) ? "text-white" : "text-blue-900") : theme.subText}`}>{label}</span>
    
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
    
    <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${checked ? activeColor : "bg-slate-300 dark:bg-slate-700"}`}>
        <motion.div 
            layout 
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
    </div>
  </label>
);

// Helper to check dark mode within toggle for styling
const darkMode = (theme) => theme.bg.includes("050b14");

const ImageUploader = ({ label, field, preview, onChange, theme, darkMode }) => (
  <div className="w-full">
      <Label text={label} theme={theme} />
      <div className={`relative w-full aspect-square md:aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden group transition-all 
        ${darkMode ? "border-slate-700 bg-[#0f1623] hover:border-blue-500" : "border-blue-200 bg-white hover:border-blue-400"}`}>
          
          {preview ? (
              <>
                <img src={preview} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-full"><Edit className="text-white" /></div>
                </div>
              </>
          ) : (
              <div className="text-center p-4">
                  <div className={`p-3 rounded-full inline-block mb-3 transition transform group-hover:scale-110 ${darkMode ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Upload size={20} />
                  </div>
                  <p className={`text-xs ${theme.subText}`}>Click to Upload</p>
              </div>
          )}
          <input type="file" onChange={(e) => onChange(e, field)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
      </div>
  </div>
);

export default AdminItemManagements;

