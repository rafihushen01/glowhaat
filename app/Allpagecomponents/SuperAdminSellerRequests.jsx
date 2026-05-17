"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  ShieldCheck, Search, Filter, Store, Mail, Phone, Calendar, MapPin, 
  User, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Eye, RefreshCw,
  Loader2, AlertCircle
} from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";

const inputClass = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-800 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10";

const normalizeAssetUrl = (value = "") => {
  const src = String(value).trim();
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${serverurl}${src}`;
  return `${serverurl}/${src}`;
};

const SuperAdminSellerRequests = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [rejectText, setRejectText] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());
      const { data } = await axios.get(`${serverurl}/seller/admin/requests?${params.toString()}`, {
        withCredentials: true,
        timeout: 12000,
      });
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const takeDecision = async (id, decision) => {
    if (decision === "Rejected" && !rejectText[id]?.trim()) {
      setFeedback({ type: "error", message: "Reject reason is required for rejection." });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    setProcessingId(id);
    setFeedback(null);

    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/admin/requests/${id}/decision`,
        { decision, rejectreason: rejectText[id] || "" },
        { withCredentials: true, timeout: 12000 }
      );
      
      setFeedback({ 
        type: "success", 
        message: data?.message || `Request successfully ${decision.toLowerCase()}!` 
      });
      
      // Clean up reject reason text
      setRejectText(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      setTimeout(() => setFeedback(null), 5000);
      fetchRequests();
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Could not update request.";
      setFeedback({ type: "error", message: errMsg });
      setTimeout(() => setFeedback(null), 6000);
    } finally {
      setProcessingId(null);
    }
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
      <SuperAdminNav />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Jumbotron */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-50/50 blur-3xl"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/10">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">Merchant Onboarding Center</h1>
                <p className="mt-1 text-sm text-zinc-500">Review business credentials, NIDs, and verify incoming merchant requests.</p>
              </div>
            </div>
            <button 
              onClick={fetchRequests}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 shadow-sm transition-all duration-300 animate-fadeIn ${
            feedback.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
              : "bg-red-50 border-red-200 text-red-950"
          }`}>
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {feedback.type === "success" ? "System Event Logged" : "Process Interrupted"}
              </p>
              <p className="mt-0.5 text-xs font-semibold">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        <div className="mb-6 grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs md:grid-cols-[1.5fr_1fr_auto]">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input 
              className={`${inputClass} pl-10`}
              placeholder="Search by name, email, store or type..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            />
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Filter className="h-4 w-4" />
            </span>
            <select 
              className={`${inputClass} pl-10`}
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending Approvals</option>
              <option value="Approved">Approved Merchants</option>
              <option value="Rejected">Rejected Application Logs</option>
            </select>
          </div>
          <button 
            onClick={fetchRequests} 
            disabled={loading}
            className="rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shrink-0 shadow-sm"
          >
            Apply Filters
          </button>
        </div>

        {/* Requests Loading Screen */}
        {loading && requests.length === 0 && (
          <div className="py-20 text-center rounded-2xl border border-zinc-200 bg-white">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-800" />
            <p className="mt-4 text-xs font-bold text-zinc-450 uppercase tracking-widest">Querying applicant registry...</p>
          </div>
        )}

        {/* Requests Render Board */}
        <div className="space-y-6">
          {requests.map((req) => (
            <article 
              key={req._id} 
              className={`overflow-hidden rounded-2xl border bg-white shadow-xs transition-all ${
                req.status === "Pending" 
                  ? "border-amber-250 ring-2 ring-amber-500/5" 
                  : req.status === "Approved" 
                  ? "border-emerald-200" 
                  : "border-zinc-200"
              }`}
            >
              {/* Request Ribbon Header */}
              <div className={`px-5 py-3 border-b flex justify-between items-center ${
                req.status === "Pending" 
                  ? "bg-amber-50/50 border-amber-100" 
                  : req.status === "Approved" 
                  ? "bg-emerald-50/20 border-emerald-100" 
                  : "bg-zinc-50 border-zinc-100"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                    req.status === "Pending" 
                      ? "bg-amber-50 text-amber-850 border-amber-200" 
                      : req.status === "Approved" 
                      ? "bg-emerald-50 text-emerald-850 border-emerald-200" 
                      : "bg-red-50 text-red-850 border-red-200"
                  }`}>
                    {req.status}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    ID: {req._id}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-zinc-400">
                  Applied: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                
                {/* Main Identity Box */}
                <div className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-zinc-100">
                  <div className="space-y-1">
                    <h2 className="text-lg font-extrabold tracking-tight text-zinc-850">{req.fullname}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-zinc-500">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-zinc-400" /> {req.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-zinc-400" /> {req.mobile}</span>
                      {req.whatsapp && (
                        <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          WhatsApp: {req.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs lg:text-right">
                    <div className="bg-zinc-50 border border-zinc-150 p-2.5 rounded-xl text-left shadow-2xs">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400">Business Model</span>
                      <span className="font-extrabold text-zinc-800">{req.businessname || "N/A"} ({req.storetype || "N/A"})</span>
                      <span className="block text-[10px] text-zinc-500 mt-0.5">{req.businessmodel || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Logistics & Personal Metadata */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-650">
                  <div className="space-y-2">
                    <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">Registry Credentials</h3>
                    <p><span className="font-semibold text-zinc-400">Biz Gmail:</span> {req.businessgmail || "N/A"}</p>
                    <p><span className="font-semibold text-zinc-400">Seller Login:</span> {req.sellerloginemail || req.email || "N/A"}</p>
                    <p><span className="font-semibold text-zinc-400">Contact:</span> {req.businessphone || "N/A"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">Personal Meta</h3>
                    <p><span className="font-semibold text-zinc-400">Date of Birth:</span> {req.dateofbirth ? new Date(req.dateofbirth).toLocaleDateString() : "N/A"}</p>
                    <p>
                      <span className="font-semibold text-zinc-400">Categories: </span>
                      {Array.isArray(req.preferredcategories) && req.preferredcategories.length 
                        ? req.preferredcategories.join(", ") 
                        : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px]">Logistics Pickup Hub</h3>
                    <p className="flex items-center gap-1 font-semibold text-zinc-800">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      {req?.pickup?.district || ""}, {req?.pickup?.city || ""}, {req?.pickup?.area || ""}
                    </p>
                    <p className="text-[10px] text-zinc-450">{req?.pickup?.addressline || ""}</p>
                    <p><span className="font-semibold text-zinc-400">Courier Phone:</span> {req?.pickup?.deliverymanphone || "N/A"}</p>
                  </div>
                </div>

                {/* Document Gallery Attachments */}
                <div className="mt-6">
                  <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[10px] mb-3">Verification Files & Documents</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                    {Object.entries(req.files || {}).map(([key, value]) => {
                      const src = normalizeAssetUrl(value);
                      if (!src) return null;
                      return (
                        <a 
                          key={key} 
                          href={src} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="group relative block overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-center transition-all hover:border-emerald-600 hover:shadow-xs"
                        >
                          <span className="block truncate text-[9px] font-extrabold uppercase tracking-wide text-zinc-500 group-hover:text-emerald-950">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <div className="relative mt-1.5 aspect-video w-full overflow-hidden rounded-lg bg-zinc-200">
                            <img src={src} alt={key} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-zinc-900/40 opacity-0 flex items-center justify-center transition-opacity group-hover:opacity-100">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Reject Reason Logger */}
                {req.status === "Rejected" && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-950 flex gap-3 items-start">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold uppercase tracking-wider">Application Rejected</p>
                      <p className="mt-1 font-semibold">{req.rejectreason || "No reason provided."}</p>
                    </div>
                  </div>
                )}

                {/* Operations Action Bar */}
                {req.status === "Pending" ? (
                  <div className="mt-6 border-t border-zinc-150 pt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-lg">
                      <input
                        className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs outline-none transition-all focus:border-red-400"
                        placeholder="Must enter rejection reason if rejecting..."
                        value={rejectText[req._id] || ""}
                        onChange={(e) => setRejectText((prev) => ({ ...prev, [req._id]: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <button
                        type="button"
                        disabled={processingId !== null}
                        onClick={() => takeDecision(req._id, "Rejected")}
                        className="rounded-xl border border-red-250 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {processingId === req._id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={processingId !== null}
                        onClick={() => takeDecision(req._id, "Approved")}
                        className="rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        {processingId === req._id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Approve Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-zinc-100 pt-4 flex items-center justify-between text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                    <span>Decision finalized</span>
                    <span className="flex items-center gap-1 text-emerald-800">
                      Archive Closed <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                  </div>
                )}

              </div>
            </article>
          ))}

          {!loading && requests.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center shadow-xs">
              <Store className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="mt-3 text-xs font-bold text-zinc-450 uppercase tracking-widest">No matching applications in queue</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminSellerRequests;
