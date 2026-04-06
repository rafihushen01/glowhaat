"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { serverurl } from "../utils/constants/serverurl";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";

const inputClass = "h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500";

const normalizeAssetUrl = (value = "") => {
  const src = String(value).trim();
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${serverurl}${src}`;
  return `${serverurl}/${src}`;
};

const SuperAdminSellerRequests = () => {
  const router = useRouter();
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;

  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [rejectText, setRejectText] = useState({});

  useEffect(() => {
    if (!user || user?.role !== "SuperAdmin") router.replace("/superadmin-signin");
  }, [router, user]);

  const fetchRequests = async () => {
    setLoading(true);
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
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takeDecision = async (id, decision) => {
    try {
      await axios.patch(
        `${serverurl}/seller/admin/requests/${id}/decision`,
        { decision, rejectreason: rejectText[id] || "" },
        { withCredentials: true, timeout: 12000 }
      );
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Could not update request.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SuperAdminNav />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-2xl font-semibold text-emerald-950">Seller Request Management</h1>
          <p className="mt-2 text-sm text-emerald-800">Review and approve/reject incoming seller applications.</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_0.8fr_auto]">
          <input className={inputClass} placeholder="Search by name, email, business, store type" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={fetchRequests} className="rounded-xl bg-emerald-700 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Filter
          </button>
        </div>

        {loading ? <div className="mt-5 text-sm text-emerald-800">Loading requests...</div> : null}

        <div className="mt-5 space-y-4">
          {requests.map((req) => (
            <article key={req._id} className="rounded-2xl border border-emerald-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">{req.status}</p>
                  <h2 className="mt-1 text-lg font-semibold text-emerald-950">{req.fullname}</h2>
                  <p className="text-sm text-emerald-800">
                    {req.email} | {req.mobile}
                  </p>
                </div>
                <div className="text-right text-xs text-emerald-700">
                  <p>Business: {req.businessname || "N/A"}</p>
                  <p>Store Type: {req.storetype || "N/A"}</p>
                  <p>Model: {req.businessmodel || "N/A"}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-emerald-900 md:grid-cols-2">
                <p><span className="font-semibold">Business Gmail:</span> {req.businessgmail || "N/A"}</p>
                <p><span className="font-semibold">Business Phone:</span> {req.businessphone || "N/A"}</p>
                <p><span className="font-semibold">WhatsApp:</span> {req.whatsapp || "N/A"}</p>
                <p><span className="font-semibold">DOB:</span> {req.dateofbirth ? new Date(req.dateofbirth).toLocaleDateString() : "N/A"}</p>
                <p><span className="font-semibold">Pickup:</span> {req?.pickup?.district || ""} / {req?.pickup?.city || ""} / {req?.pickup?.area || ""}</p>
                <p><span className="font-semibold">Deliveryman:</span> {req?.pickup?.deliverymanphone || "N/A"}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {Object.entries(req.files || {}).map(([key, value]) => {
                  const src = normalizeAssetUrl(value);
                  if (!src) return null;
                  return (
                    <a key={key} href={src} target="_blank" rel="noreferrer" className="block rounded-xl border border-emerald-200 bg-emerald-50 p-2">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700">{key}</p>
                      <img src={src} alt={key} className="mt-2 h-28 w-full rounded-lg object-cover" />
                    </a>
                  );
                })}
              </div>

              {req.status === "Rejected" ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <p className="font-semibold">Reject Reason</p>
                  <p className="mt-1">{req.rejectreason || "No reason provided."}</p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => takeDecision(req._id, "Approved")}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                >
                  Approve
                </button>
                <input
                  className="h-10 min-w-[260px] flex-1 rounded-xl border border-red-200 px-3 text-sm text-red-900 outline-none focus:border-red-400"
                  placeholder="Reject reason (required for reject)"
                  value={rejectText[req._id] || ""}
                  onChange={(e) => setRejectText((prev) => ({ ...prev, [req._id]: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => takeDecision(req._id, "Rejected")}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}

          {!loading && requests.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-sm text-emerald-800">No seller requests found.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSellerRequests;
