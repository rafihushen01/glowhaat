"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverurl } from "../utils/constants/serverurl";

const SellerCategorySelector = ({ onSelect }) => {
  const [history, setHistory] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const currentDepth = history.length;
  const parentId = currentDepth > 0 ? history[currentDepth - 1]._id : null;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${serverurl}/productcategory/all`, {
        withCredentials: true,
        timeout: 20000,
      });
      setAllCategories(Array.isArray(data?.data) ? data.data : []);
    } catch (_error) {
      setAllCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categories = allCategories.filter((c) => {
    const matchesDepth = c.level === currentDepth;
    const matchesParent = currentDepth === 0 ? !c.parent : c.parent?._id === parentId;
    return matchesDepth && matchesParent;
  });

  const filtered = categories.filter((c) =>
    String(c?.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectCurrent = () => {
    if (!history.length) return;
    onSelect({
      ids: history.map((x) => x._id),
      names: history.map((x) => x.name),
      path: history.map((x) => x.name).join(" > "),
    });
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Category Wizard</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={() => setHistory([])} className="rounded-full border border-emerald-300 px-3 py-1 text-emerald-800">
          Root
        </button>
        {history.map((h, idx) => (
          <button
            type="button"
            key={h._id}
            onClick={() => setHistory(history.slice(0, idx + 1))}
            className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-800"
          >
            {h.name}
          </button>
        ))}
      </div>

      <input
        className="mt-3 h-10 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500"
        placeholder="Search category"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-emerald-100 p-2">
        {loading ? (
          <p className="p-2 text-sm text-emerald-700">Loading categories...</p>
        ) : filtered.length === 0 ? (
          <p className="p-2 text-sm text-emerald-700">No categories here.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setHistory([...history, c])}
                className="flex w-full items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-left text-sm text-emerald-900 hover:border-emerald-300"
              >
                <span>{c.name}</span>
                <span className="text-xs text-emerald-700">Next</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-emerald-700">Go deep and select the last category.</p>
        <button
          type="button"
          onClick={selectCurrent}
          disabled={!history.length}
          className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white disabled:opacity-50"
        >
          Select
        </button>
      </div>
    </div>
  );
};

export default SellerCategorySelector;
