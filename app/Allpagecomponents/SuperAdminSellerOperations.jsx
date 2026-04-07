"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";

const TABS = ["Sponsorships", "Commissions", "Shops", "Subscriptions"];

const tabBtn = (active) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
    active
      ? "border-[#1f5c49] bg-[#1f5c49] text-white"
      : "border-[#dce8e2] bg-white text-[#1f5c49]"
  }`;

const card = "rounded-2xl border border-[#dce8e2] bg-white p-4";
const input = "mt-1 h-10 w-full rounded-xl border border-[#dce8e2] px-3 text-sm outline-none focus:border-[#1f5c49]";

const SuperAdminSellerOperations = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [activeTab, setActiveTab] = useState("Sponsorships");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [sponsorships, setSponsorships] = useState([]);
  const [commissionConfig, setCommissionConfig] = useState(null);
  const [commissionPayments, setCommissionPayments] = useState([]);
  const [shops, setShops] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [preview, setPreview] = useState({ open: false, src: "", title: "" });

  const [globalPercent, setGlobalPercent] = useState(5);
  const [sellerOverride, setSellerOverride] = useState({ sellerid: "", percentage: 5, note: "" });

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [sponsorRes, configRes, paymentRes, shopRes, subRes] = await Promise.all([
        axios.get(`${serverurl}/seller/admin/panel/sponsorships`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/admin/panel/commission-config`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/admin/panel/commission-payments`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/admin/panel/shops`, getRequestConfig({ timeout: 20000 })),
        axios.get(`${serverurl}/seller/admin/panel/subscriptions`, getRequestConfig({ timeout: 20000 })),
      ]);

      setSponsorships(sponsorRes.data?.requests || []);
      setCommissionConfig(configRes.data?.config || null);
      setCommissionPayments(paymentRes.data?.payments || []);
      setShops(shopRes.data?.shops || []);
      setSubscriptions(subRes.data?.subscriptions || []);
      setGlobalPercent(Number(configRes.data?.config?.globalpercentage || 5));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load seller operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) loadAll();
  }, [isSuperAdmin]);

  const decideSponsorship = async (id, decision) => {
    const rejectreason = decision === "Rejected" ? prompt("Reject reason", "Invalid payment proof") || "Invalid payment proof" : "";
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/sponsorships/${id}/decision`, { decision, rejectreason }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Action failed");
      setNotice(`Sponsorship ${decision.toLowerCase()}.`);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update sponsorship.");
    }
  };

  const saveGlobalPercent = async () => {
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/commission-config/global`, { percentage: Number(globalPercent) }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Update failed");
      setNotice("Global commission updated.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update global commission.");
    }
  };

  const saveSellerOverride = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/commission-config/seller/${sellerOverride.sellerid}`, { percentage: Number(sellerOverride.percentage), note: sellerOverride.note }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Override failed");
      setNotice("Seller commission override updated.");
      setSellerOverride({ sellerid: "", percentage: 5, note: "" });
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to set seller override.");
    }
  };

  const decideCommission = async (id, decision) => {
    const rejectreason = decision === "Rejected" ? prompt("Reject reason", "Invalid payment proof") || "Invalid payment proof" : "";
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/commission-payments/${id}/decision`, { decision, rejectreason }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Action failed");
      setNotice(`Commission payment ${decision.toLowerCase()}.`);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update payment.");
    }
  };

  const updateShopHealth = async (shopid) => {
    const value = Number(prompt("Health reduce amount", "10") || 10);
    const reason = prompt("Reason", "Policy violation") || "Policy violation";
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/shops/${shopid}/health`, { mode: "sub", value, reason }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Update failed");
      setNotice("Shop health updated.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update shop health.");
    }
  };

  const toggleFreeze = async (shopid, freeze) => {
    const reason = prompt(freeze ? "Freeze reason" : "Unfreeze note", freeze ? "Commission due" : "Payment verified") || "Manual update";
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/shops/${shopid}/freeze`, { freeze, reason }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Update failed");
      setNotice(freeze ? "Shop frozen." : "Shop unfrozen.");
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update shop freeze.");
    }
  };

  const decideSubscription = async (id, decision) => {
    const rejectreason = decision === "Rejected" ? prompt("Reject reason", "Invalid payment proof") || "Invalid payment proof" : "";
    try {
      const { data } = await axios.patch(`${serverurl}/seller/admin/panel/subscriptions/${id}/decision`, { decision, rejectreason }, getRequestConfig({ timeout: 20000 }));
      if (!data?.success) throw new Error(data?.message || "Action failed");
      setNotice(`Subscription ${decision.toLowerCase()}.`);
      await loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update subscription.");
    }
  };

  const openPreview = (src, title) => {
    if (!src) return;
    setPreview({ open: true, src, title });
  };

  const closePreview = () => setPreview({ open: false, src: "", title: "" });

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-[#1f5c49]">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <SuperAdminNav />
      <div className="mx-auto mt-6 max-w-7xl">
        <div className="rounded-2xl border border-[#dce8e2] bg-[#f5fbf8] p-6">
          <h1 className="text-2xl font-semibold text-[#1f5c49]">Seller Operations Control</h1>
          <p className="mt-2 text-sm text-[#4b6b61]">Manage sponsorship verification, commission rules, shop health/freeze, and subscription verification.</p>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {notice ? <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabBtn(activeTab === tab)}>{tab}</button>)}
          <button type="button" onClick={loadAll} className="rounded-full border border-[#dce8e2] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49]">Refresh</button>
        </div>

        {loading ? <p className="mt-6 text-sm text-[#1f5c49]">Loading seller operation data...</p> : null}

        {!loading && activeTab === "Sponsorships" ? (
          <div className="mt-6 grid gap-3">
            {sponsorships.length === 0 ? <div className={card}>No sponsorship requests.</div> : sponsorships.map((r) => (
              <div key={r._id} className={card}>
                <p className="text-sm font-semibold text-[#1f5c49]">{r.itemid?.name || "Item"} - {r.status}</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Seller: {r.sellerid?.fullname || "N/A"} ({r.sellerid?.email || "N/A"})</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Shop: {r.shopid?.shopname || "N/A"} | Amount: Tk {r.amount} | Days: {r.sponsoreddays}</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Sender: {r.senderbkashnumber} | Tx: {r.transactionid}</p>
                {r.paymentss ? (
                  <button
                    type="button"
                    onClick={() => openPreview(r.paymentss, `Sponsorship Proof - ${r.itemid?.name || "Item"}`)}
                    className="mt-2 rounded-xl border border-[#dce8e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]"
                  >
                    View Proof
                  </button>
                ) : null}
                {r.status === "Pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => decideSponsorship(r._id, "Verified")} className="rounded-xl bg-[#1f5c49] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white">Verify</button>
                    <button type="button" onClick={() => decideSponsorship(r._id, "Rejected")} className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-700">Reject</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {!loading && activeTab === "Commissions" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className={card}>
              <h2 className="text-lg font-semibold text-[#1f5c49]">Commission Config</h2>
              <label className="mt-3 block text-sm">Global Percent
                <input type="number" min={0} max={100} className={input} value={globalPercent} onChange={(e) => setGlobalPercent(e.target.value)} />
              </label>
              <button type="button" onClick={saveGlobalPercent} className="mt-3 rounded-xl bg-[#1f5c49] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white">Save Global</button>

              <form className="mt-5 border-t border-[#e6efea] pt-4" onSubmit={saveSellerOverride}>
                <p className="text-sm font-semibold text-[#1f5c49]">Set Seller Override</p>
                <label className="mt-2 block text-sm">Seller User ID<input className={input} value={sellerOverride.sellerid} onChange={(e) => setSellerOverride((p) => ({ ...p, sellerid: e.target.value }))} required /></label>
                <label className="mt-2 block text-sm">Percent<input type="number" min={0} max={100} className={input} value={sellerOverride.percentage} onChange={(e) => setSellerOverride((p) => ({ ...p, percentage: e.target.value }))} required /></label>
                <label className="mt-2 block text-sm">Note<input className={input} value={sellerOverride.note} onChange={(e) => setSellerOverride((p) => ({ ...p, note: e.target.value }))} /></label>
                <button className="mt-3 rounded-xl border border-[#dce8e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]">Save Override</button>
              </form>
            </div>

            <div className={card}>
              <h2 className="text-lg font-semibold text-[#1f5c49]">Commission Payments</h2>
              <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {commissionPayments.length === 0 ? <p className="text-sm text-[#4b6b61]">No commission payments.</p> : commissionPayments.map((p) => (
                  <div key={p._id} className="rounded-xl border border-[#e6efea] bg-[#f5fbf8] p-3">
                    <p className="text-sm font-semibold text-[#1f5c49]">{p.sellerid?.fullname || "Seller"} - {p.status}</p>
                    <p className="mt-1 text-xs text-[#4b6b61]">Amount: Tk {Number(p.commissionamount || 0).toFixed(2)} | Rate: {p.percentage}%</p>
                    <p className="mt-1 text-xs text-[#4b6b61]">Sender: {p.senderbkashnumber || "N/A"} | Tx: {p.transactionid || "N/A"}</p>
                    {p.paymentss ? (
                      <button
                        type="button"
                        onClick={() => openPreview(p.paymentss, `Commission Proof - ${p.sellerid?.fullname || "Seller"}`)}
                        className="mt-2 rounded-xl border border-[#dce8e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]"
                      >
                        View Proof
                      </button>
                    ) : null}
                    {p.status === "Submitted" || p.status === "Pending" || p.status === "Overdue" ? (
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => decideCommission(p._id, "Verified")} className="rounded-xl bg-[#1f5c49] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white">Verify</button>
                        <button type="button" onClick={() => decideCommission(p._id, "Rejected")} className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-700">Reject</button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {!loading && activeTab === "Shops" ? (
          <div className="mt-6 grid gap-3">
            {shops.length === 0 ? <div className={card}>No shops found.</div> : shops.map((s) => (
              <div key={s._id} className={card}>
                <p className="text-sm font-semibold text-[#1f5c49]">{s.shopname} ({s.sellerid?.fullname || "Seller"})</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Health: {s.healthscore}/100 | {s.healthisfrozen ? "Frozen" : "Active"}</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Email: {s.contactemail || s.sellerid?.email || "N/A"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateShopHealth(s._id)} className="rounded-xl border border-[#dce8e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]">Reduce Health</button>
                  {s.healthisfrozen ? (
                    <button type="button" onClick={() => toggleFreeze(s._id, false)} className="rounded-xl bg-[#1f5c49] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white">Unfreeze</button>
                  ) : (
                    <button type="button" onClick={() => toggleFreeze(s._id, true)} className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-700">Freeze</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && activeTab === "Subscriptions" ? (
          <div className="mt-6 grid gap-3">
            {subscriptions.length === 0 ? <div className={card}>No subscriptions.</div> : subscriptions.map((s) => (
              <div key={s._id} className={card}>
                <p className="text-sm font-semibold text-[#1f5c49]">{s.planname} - {s.status}</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Seller: {s.sellerid?.fullname || "Seller"} | Amount: Tk {s.amount} | Save: Tk {s.savingscredit}</p>
                <p className="mt-1 text-xs text-[#4b6b61]">Sender: {s.senderbkashnumber} | Tx: {s.transactionid}</p>
                {s.paymentss ? (
                  <button
                    type="button"
                    onClick={() => openPreview(s.paymentss, `Subscription Proof - ${s.sellerid?.fullname || "Seller"}`)}
                    className="mt-2 rounded-xl border border-[#dce8e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]"
                  >
                    View Proof
                  </button>
                ) : null}
                {s.status === "Pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => decideSubscription(s._id, "Verified")} className="rounded-xl bg-[#1f5c49] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white">Verify</button>
                    <button type="button" onClick={() => decideSubscription(s._id, "Rejected")} className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-red-700">Reject</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {preview.open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1f5c49]">{preview.title}</h3>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-xl border border-[#dce8e2] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f5c49]"
              >
                Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-[#e6efea] bg-[#f5fbf8] p-2">
              <img src={preview.src} alt={preview.title} className="mx-auto h-auto max-w-full rounded-lg object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SuperAdminSellerOperations;
