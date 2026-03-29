import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  FiSearch, 
  FiChevronRight, 
  FiCheck, 
  FiFolder, 
  FiArrowLeft,
  FiLayers 
} from "react-icons/fi";
import { serverurl } from "@/app/utils/constants/serverurl";


// Make sure to pass your server URL or import it
 // Replace with your actual API URL

const CategorySelector = ({ onSelect, onClose }) => {
  // --- STATE ---
  const [history, setHistory] = useState([]); // Tracks the path: [{id, name, depth}, ...]
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFinal, setSelectedFinal] = useState(null);

  // --- FETCH DATA ---
  const fetchCategories = async (depth, parentId = null) => {
    setLoading(true);
    try {
      // Matches your backend controller: req.query.depth, req.query.parentid
      const params = { depth };
      if (parentId) params.parentid = parentId;

      const res = await axios.get(`${serverurl}/nav/getcategorybydepth`, { params });
      
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  // --- INITIAL LOAD & DEPTH CHANGE ---
  useEffect(() => {
    // Current depth is history length. 
    // If history is empty, depth 0. If [Root], depth 1.
    const currentDepth = history.length;
    const parentId = currentDepth > 0 ? history[currentDepth - 1]._id : null;
    
    fetchCategories(currentDepth, parentId);
    setSearchTerm(""); // Reset search on level change
  }, [history]);

  // --- HANDLERS ---
  const handleNextLevel = (category) => {
    // Push clicked category to history to drill down
    setHistory([...history, category]);
  };

  const handleBack = () => {
    // Remove last item from history to go up
    if (history.length > 0) {
      setHistory(history.slice(0, -1));
    }
  };

  const handleBreadcrumbClick = (index) => {
    // Jump back to specific level
    setHistory(history.slice(0, index + 1));
  };

  const handleSelectCategory = () => {
    // User confirms current path as the final selection
    if (history.length === 0) return;
    
    // We pass the array of IDs (and names for UI) to the parent
    const selectionData = {
      ids: history.map(cat => cat._id),
      names: history.map(cat => cat.name),
      lastNode: history[history.length - 1]
    };

    setSelectedFinal(selectionData);
    onSelect(selectionData); // Triggers parent function
    if(onClose) onClose();
  };

  // --- FILTERING ---
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20"
    >
      {/* === HEADER === */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-blue-100 font-bold flex items-center gap-2">
          <FiLayers className="text-blue-400" /> Category Wizard
        </h3>
        
        {/* Current Path Display */}
        <div className="text-xs text-slate-400 font-mono">
          Depth: {history.length}
        </div>
      </div>

      {/* === BREADCRUMBS === */}
      <div className="bg-slate-800/50 p-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-blue-600">
        <button 
          onClick={() => setHistory([])}
          className={`text-xs px-2 py-1 rounded hover:bg-slate-700 transition ${history.length === 0 ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          Root
        </button>
        {history.map((cat, idx) => (
          <React.Fragment key={cat._id}>
            <FiChevronRight className="text-slate-600 min-w-[12px]" />
            <button 
              onClick={() => handleBreadcrumbClick(idx)}
              className="text-xs text-blue-300 px-2 py-1 rounded hover:bg-slate-700 hover:text-white transition flex items-center gap-1"
            >
              {cat.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* === SEARCH & ACTIONS === */}
      <div className="p-4 flex gap-3 border-b border-slate-800">
        {history.length > 0 && (
          <button 
            onClick={handleBack}
            className="p-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
          >
            <FiArrowLeft />
          </button>
        )}
        
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* SELECT CURRENT LEVEL BUTTON */}
        {history.length > 0 && (
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={handleSelectCategory}
             className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-green-900/30"
           >
             <FiCheck /> Select "{history[history.length-1].name}"
           </motion.button>
        )}
      </div>

      {/* === CATEGORY LIST === */}
      <div className="h-[300px] overflow-y-auto p-4 bg-slate-950 relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs">Fetching Data...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <FiFolder className="text-4xl mb-2 opacity-50" />
            <p>No categories found here.</p>
            {history.length > 0 && <p className="text-xs mt-2 text-slate-500">Click "Select" above to choose the parent.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredCategories.map((cat, i) => (
                <motion.div
                  key={cat._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleNextLevel(cat)}
                  className="group cursor-pointer bg-slate-900 border border-slate-800 hover:border-blue-500 hover:bg-slate-800 p-3 rounded-xl flex items-center justify-between transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {cat.images && cat.images[0] ? (
                      <img src={cat.images[0].image} alt="" className="w-8 h-8 rounded object-cover border border-slate-700" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-blue-900/30 group-hover:text-blue-400">
                        <FiFolder />
                      </div>
                    )}
                    <div>
                      <h4 className="text-slate-200 text-sm font-medium group-hover:text-white">{cat.name}</h4>
                      {cat.count !== undefined && <span className="text-[10px] text-slate-500">{cat.count} items</span>}
                    </div>
                  </div>
                  <FiChevronRight className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Footer Hint */}
      <div className="bg-slate-900 p-2 text-center border-t border-slate-800">
        <p className="text-[10px] text-slate-500">
          Navigate to the deepest category, then click the Green Select button.
        </p>
      </div>
    </motion.div>
  );
};

export default CategorySelector;