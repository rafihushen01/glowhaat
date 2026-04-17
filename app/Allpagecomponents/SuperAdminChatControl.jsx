"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, MessageSquare, Send, Trash2, PencilLine, Bell, RefreshCw } from "lucide-react";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";
import { serverurl } from "../utils/constants/serverurl";

const inputCls =
  "h-10 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm text-emerald-950 outline-none focus:border-emerald-500";

const SuperAdminChatControl = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [threadDetail, setThreadDetail] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [status, setStatus] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    buyername: "",
    sellername: "",
    conversationid: "",
  });

  const [sendForm, setSendForm] = useState({
    text: "",
    senderrole: "Seller",
  });
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [sending, setSending] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [recipientSearch, setRecipientSearch] = useState({ q: "", role: "" });
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    message: "",
    type: "Info",
    channel: "notice",
    targetkind: "all",
  });
  const [sendingNotice, setSendingNotice] = useState(false);

  const selectedRecipient = useMemo(
    () => recipients.find((entry) => String(entry._id) === String(selectedRecipientId)) || null,
    [recipients, selectedRecipientId]
  );

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      setStatus("");
      const { data } = await axios.get(`${serverurl}/seller/admin/panel/chat/threads`, {
        withCredentials: true,
        timeout: 30000,
        params: filters,
      });
      if (!data?.success) throw new Error(data?.message || "Failed to load conversations.");
      setThreads(Array.isArray(data.rows) ? data.rows : []);
      if (selectedThreadId && !data.rows?.some((row) => String(row._id) === String(selectedThreadId))) {
        setSelectedThreadId("");
        setThreadDetail(null);
      }
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to load conversations.");
    } finally {
      setLoadingThreads(false);
    }
  }, [filters, selectedThreadId]);

  const loadThreadDetail = useCallback(async (threadId) => {
    if (!threadId) return;
    try {
      setLoadingThread(true);
      const { data } = await axios.get(`${serverurl}/seller/admin/panel/chat/threads/${threadId}`, {
        withCredentials: true,
        timeout: 30000,
      });
      if (!data?.success || !data?.thread) throw new Error(data?.message || "Conversation not found.");
      setThreadDetail(data.thread);
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to load conversation detail.");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const loadRecipients = useCallback(async () => {
    try {
      const { data } = await axios.get(`${serverurl}/khannotification/admin/recipients`, {
        withCredentials: true,
        timeout: 25000,
        params: { q: recipientSearch.q, role: recipientSearch.role, limit: 30 },
      });
      if (!data?.success) return;
      setRecipients(Array.isArray(data.rows) ? data.rows : []);
    } catch (_error) {
      // silent
    }
  }, [recipientSearch.q, recipientSearch.role]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadThreads();
  }, [isSuperAdmin, loadThreads]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedThreadId) return;
    loadThreadDetail(selectedThreadId);
  }, [isSuperAdmin, selectedThreadId, loadThreadDetail]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadRecipients();
  }, [isSuperAdmin, loadRecipients]);

  const handleSendThreadMessage = async () => {
    if (!selectedThreadId || !sendForm.text.trim()) return;
    try {
      setSending(true);
      setStatus("");
      const { data } = await axios.post(
        `${serverurl}/seller/admin/panel/chat/threads/${selectedThreadId}/messages`,
        {
          text: sendForm.text,
          senderrole: sendForm.senderrole,
        },
        { withCredentials: true, timeout: 30000 }
      );
      if (!data?.success) throw new Error(data?.message || "Failed to send message.");
      setSendForm((prev) => ({ ...prev, text: "" }));
      await loadThreadDetail(selectedThreadId);
      await loadThreads();
      setStatus("Message sent successfully.");
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveMessageEdit = async () => {
    if (!selectedThreadId || !editingMessageId || !editingText.trim()) return;
    try {
      setSavingEdit(true);
      const { data } = await axios.patch(
        `${serverurl}/seller/admin/panel/chat/threads/${selectedThreadId}/messages/${editingMessageId}`,
        { text: editingText },
        { withCredentials: true, timeout: 30000 }
      );
      if (!data?.success) throw new Error(data?.message || "Failed to edit message.");
      setEditingMessageId("");
      setEditingText("");
      await loadThreadDetail(selectedThreadId);
      await loadThreads();
      setStatus("Message edited successfully.");
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to edit message.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedThreadId || !messageId) return;
    const ok = window.confirm("Delete this message from conversation?");
    if (!ok) return;
    try {
      const { data } = await axios.delete(
        `${serverurl}/seller/admin/panel/chat/threads/${selectedThreadId}/messages/${messageId}`,
        { withCredentials: true, timeout: 30000 }
      );
      if (!data?.success) throw new Error(data?.message || "Failed to delete message.");
      await loadThreadDetail(selectedThreadId);
      await loadThreads();
      setStatus("Message deleted successfully.");
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to delete message.");
    }
  };

  const handleSendDirectNotice = async () => {
    if (!selectedRecipientId || !noticeForm.title.trim() || !noticeForm.message.trim()) return;
    try {
      setSendingNotice(true);
      const { data } = await axios.post(
        `${serverurl}/khannotification/admin/send`,
        {
          targetid: selectedRecipientId,
          title: noticeForm.title,
          message: noticeForm.message,
          type: noticeForm.type,
          channel: noticeForm.channel,
        },
        { withCredentials: true, timeout: 30000 }
      );
      if (!data?.success) throw new Error(data?.message || "Failed to send notice.");
      setStatus("Notice sent successfully.");
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to send notice.");
    } finally {
      setSendingNotice(false);
    }
  };

  const handleBroadcastNotice = async () => {
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) return;
    try {
      setSendingNotice(true);
      const { data } = await axios.post(
        `${serverurl}/khannotification/admin/send`,
        {
          targetkind: noticeForm.targetkind,
          title: noticeForm.title,
          message: noticeForm.message,
          type: noticeForm.type,
          channel: noticeForm.channel,
        },
        { withCredentials: true, timeout: 45000 }
      );
      if (!data?.success) throw new Error(data?.message || "Failed to broadcast notice.");
      setStatus(`Broadcast complete. Sent to ${Number(data?.sent || 0)} recipients.`);
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to broadcast notice.");
    } finally {
      setSendingNotice(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-emerald-800">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_28%,#f3fff9_100%)]">
      <SuperAdminNav />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">SuperAdmin Messaging Control</p>
              <h1 className="mt-1 text-2xl font-semibold text-emerald-950">Conversation Control Center</h1>
              <p className="mt-1 text-sm text-emerald-800">View, search, edit, delete, and send messages across all buyer-seller conversations.</p>
            </div>
            <button onClick={loadThreads} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {status ? <div className="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800">{status}</div> : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[370px_1fr]">
          <aside className="rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Advanced Search</p>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600" />
                <input className={`${inputCls} pl-9`} placeholder="Search all (user/seller/shop/id)" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} />
              </div>
              <input className={inputCls} placeholder="Buyer/User Name" value={filters.buyername} onChange={(e) => setFilters((prev) => ({ ...prev, buyername: e.target.value }))} />
              <input className={inputCls} placeholder="Seller Name" value={filters.sellername} onChange={(e) => setFilters((prev) => ({ ...prev, sellername: e.target.value }))} />
              <input className={inputCls} placeholder="Conversation ID" value={filters.conversationid} onChange={(e) => setFilters((prev) => ({ ...prev, conversationid: e.target.value }))} />
              <button onClick={loadThreads} className="h-10 w-full rounded-xl bg-emerald-700 text-xs font-semibold uppercase tracking-[0.12em] text-white">Search Conversations</button>
            </div>

            <div className="mt-5 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {loadingThreads ? <p className="text-sm text-emerald-700">Loading conversations...</p> : null}
              {!loadingThreads && threads.length === 0 ? <p className="text-sm text-emerald-700">No conversations found.</p> : null}
              {threads.map((thread) => (
                <button
                  key={thread._id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread._id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    String(selectedThreadId) === String(thread._id) ? "border-emerald-500 bg-emerald-50" : "border-emerald-100 bg-white"
                  }`}
                >
                  <p className="line-clamp-1 text-sm font-semibold text-emerald-950">
                    {thread?.buyer?.fullname || "Buyer"} ↔ {thread?.seller?.fullname || "Seller"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-emerald-700">Shop: {thread?.shop?.shopname || "N/A"}</p>
                  <p className="line-clamp-1 text-[11px] text-emerald-700">ID: {thread._id}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-emerald-800">{thread?.lastmessage || "No message yet"}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Conversation Detail</p>
              {!selectedThreadId ? (
                <p className="mt-3 text-sm text-emerald-700">Select any conversation to view full chat history.</p>
              ) : loadingThread ? (
                <p className="mt-3 text-sm text-emerald-700">Loading full conversation...</p>
              ) : threadDetail ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <p><b>Conversation ID:</b> {threadDetail._id}</p>
                    <p><b>Buyer:</b> {threadDetail?.buyer?.fullname || "Guest"}</p>
                    <p><b>Seller:</b> {threadDetail?.seller?.fullname || "Seller"}</p>
                    <p><b>Shop:</b> {threadDetail?.shop?.shopname || "N/A"}</p>
                  </div>

                  <div className="max-h-[54vh] space-y-2 overflow-y-auto pr-1">
                    {(threadDetail.messages || []).map((message) => (
                      <div key={message._id} className="rounded-xl border border-emerald-100 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                              {message.senderrole} {message.senderguestname ? `(${message.senderguestname})` : ""}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-950">{message.text || "[Deleted]"}</p>
                            <p className="mt-1 text-[11px] text-emerald-700">{message.createdat ? new Date(message.createdat).toLocaleString() : ""}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => { setEditingMessageId(message._id); setEditingText(message.text || ""); }} className="rounded-lg border border-emerald-300 p-1.5 text-emerald-700"><PencilLine className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => handleDeleteMessage(message._id)} className="rounded-lg border border-rose-300 p-1.5 text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        {editingMessageId === message._id ? (
                          <div className="mt-2 space-y-2">
                            <textarea className="min-h-[80px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                            <div className="flex gap-2">
                              <button disabled={savingEdit} onClick={handleSaveMessageEdit} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Save Edit</button>
                              <button onClick={() => { setEditingMessageId(""); setEditingText(""); }} className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">Cancel</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Send Message To This Conversation</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-[140px_1fr_auto]">
                      <select className={inputCls} value={sendForm.senderrole} onChange={(e) => setSendForm((prev) => ({ ...prev, senderrole: e.target.value }))}>
                        <option value="Seller">As Seller Side</option>
                        <option value="Buyer">As Buyer Side</option>
                      </select>
                      <input className={inputCls} placeholder="Type admin message..." value={sendForm.text} onChange={(e) => setSendForm((prev) => ({ ...prev, text: e.target.value }))} />
                      <button disabled={sending} onClick={handleSendThreadMessage} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white"><Send className="h-3.5 w-3.5" /> Send</button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-rose-600">Conversation detail unavailable.</p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Direct Message & Notice Control</p>
              <div className="mt-3 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Find User or Seller</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_160px_auto]">
                    <input className={inputCls} placeholder="Search by name/email/userid" value={recipientSearch.q} onChange={(e) => setRecipientSearch((prev) => ({ ...prev, q: e.target.value }))} />
                    <select className={inputCls} value={recipientSearch.role} onChange={(e) => setRecipientSearch((prev) => ({ ...prev, role: e.target.value }))}>
                      <option value="">All Roles</option>
                      <option value="User">User</option>
                      <option value="Seller">Seller</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                    <button onClick={loadRecipients} className="h-10 rounded-xl border border-emerald-300 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">Search</button>
                  </div>
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
                    {recipients.map((recipient) => (
                      <button key={recipient._id} type="button" onClick={() => setSelectedRecipientId(recipient._id)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${String(selectedRecipientId) === String(recipient._id) ? "border-emerald-500 bg-white" : "border-emerald-100 bg-white/80"}`}>
                        <p className="font-semibold text-emerald-950">{recipient.fullname || "Unnamed"} ({recipient.role})</p>
                        <p className="text-emerald-700">{recipient.email || "No email"}</p>
                        <p className="text-emerald-700">ID: {recipient._id}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Send Notice</p>
                  <div className="mt-2 space-y-2">
                    <input className={inputCls} placeholder="Notice title" value={noticeForm.title} onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))} />
                    <textarea className="min-h-[90px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-950 outline-none focus:border-emerald-500" placeholder="Notice message..." value={noticeForm.message} onChange={(e) => setNoticeForm((prev) => ({ ...prev, message: e.target.value }))} />
                    <div className="grid gap-2 md:grid-cols-3">
                      <select className={inputCls} value={noticeForm.type} onChange={(e) => setNoticeForm((prev) => ({ ...prev, type: e.target.value }))}>
                        <option value="Info">Info</option>
                        <option value="Success">Success</option>
                        <option value="Warning">Warning</option>
                        <option value="Danger">Danger</option>
                      </select>
                      <input className={inputCls} placeholder="Channel" value={noticeForm.channel} onChange={(e) => setNoticeForm((prev) => ({ ...prev, channel: e.target.value }))} />
                      <select className={inputCls} value={noticeForm.targetkind} onChange={(e) => setNoticeForm((prev) => ({ ...prev, targetkind: e.target.value }))}>
                        <option value="all">Broadcast All</option>
                        <option value="user">All Users</option>
                        <option value="seller">All Sellers</option>
                        <option value="superadmin">All SuperAdmins</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={sendingNotice || !selectedRecipient} onClick={handleSendDirectNotice} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60">
                        <MessageSquare className="h-3.5 w-3.5" /> Send To Selected
                      </button>
                      <button disabled={sendingNotice} onClick={handleBroadcastNotice} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 disabled:opacity-60">
                        <Bell className="h-3.5 w-3.5" /> Broadcast
                      </button>
                    </div>
                    {selectedRecipient ? (
                      <p className="text-xs text-emerald-700">Selected recipient: <b>{selectedRecipient.fullname || "Unnamed"} ({selectedRecipient.role})</b></p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminChatControl;

