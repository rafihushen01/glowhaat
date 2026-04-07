"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BarChart3, Download, RotateCcw, Share2 } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";

const inputClass =
  "w-full rounded-xl border border-[#d5e3dc] bg-white px-3 py-2 text-sm text-[#17372b] outline-none transition placeholder:text-[#789486] focus:border-[#1f5c49] focus:ring-2 focus:ring-[#9ec7b4]/40";

const SuperAdminShares = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [filters, setFilters] = useState({
    q: "",
    platform: "",
    product: "",
    category: "",
    mobile: "",
    datefrom: "",
    dateto: "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [summary, setSummary] = useState({
    overview: { totalshares: 0, totalopens: 0 },
    platforms: [],
    topproducts: [],
    topsharers: [],
  });
  const [options, setOptions] = useState({ platforms: [], categories: [], products: [] });
  const [exporting, setExporting] = useState(false);
  const [datePreset, setDatePreset] = useState("");

  const toDateInputValue = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const applyDatePreset = (preset) => {
    const now = new Date();
    const today = toDateInputValue(now);

    if (preset === "today") {
      setPage(1);
      setDatePreset("today");
      setFilters((prev) => ({ ...prev, datefrom: today, dateto: today }));
      return;
    }

    if (preset === "last7") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setPage(1);
      setDatePreset("last7");
      setFilters((prev) => ({ ...prev, datefrom: toDateInputValue(start), dateto: today }));
      return;
    }

    if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setPage(1);
      setDatePreset("month");
      setFilters((prev) => ({ ...prev, datefrom: toDateInputValue(start), dateto: today }));
      return;
    }

    setPage(1);
    setDatePreset("all");
    setFilters((prev) => ({ ...prev, datefrom: "", dateto: "" }));
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    Object.entries(filters).forEach(([key, value]) => {
      const clean = String(value || "").trim();
      if (clean) params.set(key, clean);
    });
    return params.toString();
  }, [filters, page]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${serverurl}/item/share/admin/analytics?${query}`, {
          withCredentials: true,
          timeout: 15000,
        });

        if (data?.success) {
          setRows(Array.isArray(data.rows) ? data.rows : []);
          setPages(Number(data.pages || 1));
          setCount(Number(data.count || 0));
          setSummary(data.summary || {});
          setOptions(data.filters || { platforms: [], categories: [], products: [] });
        }
      } catch (_error) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSuperAdmin, query]);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-[#1f5c49]">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  const handleReset = () => {
    setPage(1);
    setDatePreset("");
    setFilters({
      q: "",
      platform: "",
      product: "",
      category: "",
      mobile: "",
      datefrom: "",
      dateto: "",
      sort: "newest",
    });
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`${serverurl}/item/share/admin/analytics/export?${query}`, {
        withCredentials: true,
        responseType: "blob",
        timeout: 30000,
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute("download", `khancosmetics-share-analytics-${stamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (_error) {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <SuperAdminNav />

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-[#dce8e2] bg-[#f5fbf8] p-6">
          <div className="flex items-center gap-2 text-[#1f5c49]">
            <BarChart3 className="h-5 w-5" />
            <h1 className="text-2xl font-semibold">Product Share Analytics</h1>
          </div>
          <p className="mt-2 text-sm text-[#4b6b61]">
            Most shared products, who shared, and which platform performs most.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Shares" value={summary?.overview?.totalshares || 0} />
          <StatCard title="Total Opens" value={summary?.overview?.totalopens || 0} />
          <StatCard title="Filtered Records" value={count} />
        </div>

        <div className="rounded-2xl border border-[#dce8e2] bg-white p-5">
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-[#dce8e2] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] transition hover:bg-[#f4faf7]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl border border-[#c8dfd4] bg-[#f3fbf7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] transition hover:bg-[#eaf8f1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { key: "today", label: "Today" },
              { key: "last7", label: "Last 7 Days" },
              { key: "month", label: "This Month" },
              { key: "all", label: "All Time" },
            ].map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyDatePreset(preset.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  datePreset === preset.key
                    ? "border-[#1f5c49] bg-[#e9f6f0] text-[#1f5c49]"
                    : "border-[#dce8e2] bg-white text-[#4b6b61] hover:bg-[#f4faf7]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={filters.q}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, q: e.target.value }));
              }}
              placeholder="Search product/user/email"
              className={inputClass}
            />
            <select
              value={filters.platform}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, platform: e.target.value }));
              }}
              className={inputClass}
            >
              <option value="">All Platforms</option>
              {(options.platforms || []).map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <select
              value={filters.product}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, product: e.target.value }));
              }}
              className={inputClass}
            >
              <option value="">All Products</option>
              {(options.products || []).map((entry) => (
                <option key={entry.productid || entry.productslug} value={entry.productid || entry.productslug}>
                  {entry.productname}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, category: e.target.value }));
              }}
              className={inputClass}
            >
              <option value="">All Categories</option>
              {(options.categories || []).map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <input
              value={filters.mobile}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, mobile: e.target.value }));
              }}
              placeholder="User number (mobile)"
              className={inputClass}
            />
            <input
              type="date"
              value={filters.datefrom}
              onChange={(e) => {
                setPage(1);
                setDatePreset("custom");
                setFilters((prev) => ({ ...prev, datefrom: e.target.value }));
              }}
              className={inputClass}
            />
            <input
              type="date"
              value={filters.dateto}
              onChange={(e) => {
                setPage(1);
                setDatePreset("custom");
                setFilters((prev) => ({ ...prev, dateto: e.target.value }));
              }}
              className={inputClass}
            />
            <select
              value={filters.sort}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, sort: e.target.value }));
              }}
              className={inputClass}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_opened">Most Opened</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TopCard
            title="Top Platforms"
            list={(summary?.platforms || []).map((entry) => ({
              label: entry._id,
              info: `Shares ${entry.shares || 0} | Opens ${entry.opens || 0}`,
            }))}
          />
          <TopCard
            title="Top Products"
            list={(summary?.topproducts || []).map((entry) => ({
              label: entry?._id?.productname || "-",
              info: `Shares ${entry.shares || 0} | Opens ${entry.opens || 0}`,
            }))}
          />
          <TopCard
            title="Top Sharers"
            list={(summary?.topsharers || []).map((entry) => ({
              label: entry?._id?.name || entry?._id?.email || "Unknown",
              info: `Shares ${entry.shares || 0} | Opens ${entry.opens || 0}`,
            }))}
          />
        </div>

        <div className="rounded-2xl border border-[#dce8e2] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-[#1f5c49]">
            <Share2 className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Share Log</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#5a746b]">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5efe9] text-[#4b6b61]">
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Platform</th>
                    <th className="px-3 py-3">Shared By</th>
                    <th className="px-3 py-3">Mobile</th>
                    <th className="px-3 py-3">Opens</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._id} className="border-b border-[#eef4f0] text-[#17372b]">
                      <td className="px-3 py-3">{row.productname || "-"}</td>
                      <td className="px-3 py-3 uppercase">{row.platform || "-"}</td>
                      <td className="px-3 py-3">{row.sharedbyname || "Guest/Unknown"}</td>
                      <td className="px-3 py-3">{row.sharedbymobile || "-"}</td>
                      <td className="px-3 py-3">{Number(row.opencount || 0)}</td>
                      <td className="px-3 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-[#4b6b61]">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-[#dce8e2] px-3 py-1 font-semibold uppercase tracking-[0.12em] disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-[#dce8e2] px-3 py-1 font-semibold uppercase tracking-[0.12em] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="rounded-2xl border border-[#dce8e2] bg-white p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4b6b61]">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-[#17372b]">{Number(value || 0).toLocaleString()}</p>
  </div>
);

const TopCard = ({ title, list = [] }) => (
  <div className="rounded-2xl border border-[#dce8e2] bg-white p-5">
    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1f5c49]">{title}</h3>
    <div className="mt-3 space-y-2">
      {list.length ? (
        list.map((entry, idx) => (
          <div key={`${entry.label}-${idx}`} className="rounded-xl border border-[#eef4f0] p-3">
            <p className="text-sm font-medium text-[#17372b]">{entry.label}</p>
            <p className="text-xs text-[#5a746b]">{entry.info}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-[#5a746b]">No data found.</p>
      )}
    </div>
  </div>
);

export default SuperAdminShares;
