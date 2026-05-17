"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Edit3,
  FolderTree,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";

const API_URL = `${serverurl}/productcategory`;

const AdminProductCategoryBuilder = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    parent: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/all`);
      setCategories(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCategories();
    }
  }, [isSuperAdmin]);

  const resetForm = () => {
    setEditId("");
    setForm({
      name: "",
      parent: "",
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        await axios.put(`${API_URL}/update/${editId}`, {
          name,
          parent: form.parent || null,
        });
        toast.success("Category updated successfully");
      } else {
        await axios.post(`${API_URL}/create`, {
          name,
          parent: form.parent || null,
        });
        toast.success("Category created successfully");
      }
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save category");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (category) => {
    setEditId(category._id);
    setForm({
      name: category.name,
      parent: category.parent?._id || category.parent || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this category?");
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/delete/${id}`);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to delete category");
    }
  };

  // Helper to build a tree structure for display
  const buildTree = (list) => {
    const map = {};
    const roots = [];
    
    list.forEach(item => {
      map[item._id] = { ...item, children: [] };
    });
    
    list.forEach(item => {
      const parentId = item.parent?._id || item.parent;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[item._id]);
      } else {
        roots.push(map[item._id]);
      }
    });
    
    return roots;
  };

  const categoryTree = buildTree(categories);

  const renderTreeNodes = (nodes, depth = 0) => {
    return nodes.map((node) => (
      <div key={node._id} className="border-b border-zinc-100 last:border-0">
        <div 
          className="flex items-center justify-between py-3 px-4 hover:bg-zinc-50/50 transition-colors"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 ? (
              <ChevronDown className="h-4 w-4 text-emerald-700" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            )}
            <div>
              <span className="font-semibold text-zinc-800">{node.name}</span>
              <span className="ml-2 text-xs text-zinc-400 font-mono">{node.slug}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(node)}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
              title="Edit"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(node._id)}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {node.children.length > 0 && renderTreeNodes(node.children, depth + 1)}
      </div>
    ));
  };

  const renderOptions = (nodes, depth = 0) => {
    return nodes.flatMap((node) => [
      <option key={node._id} value={node._id} disabled={node._id === editId}>
        {`${"  ".repeat(depth)}${depth ? "└ " : ""}${node.name}`}
      </option>,
      ...(node.children.length ? renderOptions(node.children, depth + 1) : []),
    ]);
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent"></div>
          <p className="mt-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-50/70 font-sans text-zinc-900 antialiased selection:bg-emerald-100 pb-16">
      <Toaster position="top-center" />
      <SuperAdminNav />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-50/50 blur-3xl"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/10">
                <FolderTree className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">Product Category Builder</h1>
                <p className="mt-1 text-sm text-zinc-500">Manage the product taxonomy for sellers.</p>
              </div>
            </div>
            <button 
              onClick={fetchCategories}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-zinc-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Form */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">
                {editId ? "Edit Category" : "Create Category"}
              </h2>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="Ex: Electronics, Skincare..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={form.parent}
                    onChange={(e) => setForm({ ...form, parent: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="">None (Root Category)</option>
                    {renderOptions(categoryTree)}
                  </select>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : editId ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editId ? "Update" : "Create"}
                  </button>
                  
                  {editId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          
          {/* List */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h2 className="text-lg font-bold text-zinc-900">Category Hierarchy</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Drag and drop sorting is not supported yet.</p>
              </div>
              
              {loading && categories.length === 0 ? (
                <div className="py-12 text-center">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-800" />
                  <p className="mt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading taxonomy...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="py-12 text-center">
                  <FolderTree className="mx-auto h-8 w-8 text-zinc-300" />
                  <p className="mt-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">No categories created yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {renderTreeNodes(categoryTree)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProductCategoryBuilder;
