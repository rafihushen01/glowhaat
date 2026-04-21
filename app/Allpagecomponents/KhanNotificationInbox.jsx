"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bell, CheckCheck, Search } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import { getSharedSocket } from "../utils/socketClient";

const resolveKindFromRole = (role = "") => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "seller") return "seller";
  if (normalized === "superadmin") return "superadmin";
  return "user";
};

const styleByType = (type = "") => {
  if (type === "Danger") return "border-rose-300 bg-rose-50";
  if (type === "Warning") return "border-amber-300 bg-amber-50";
  if (type === "Success") return "border-emerald-300 bg-emerald-50";
  return "border-emerald-200 bg-white";
};

const KhanNotificationInbox = ({ role = "User", compact = false }) => {
  const socketRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const kind = useMemo(() => resolveKindFromRole(role), [role]);

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${serverurl}/khannotification/my`, getRequestConfig({ params: { q, limit: compact ? 8 : 60 }, timeout: 20000 }));
      if (!data?.success) return;
      setRows(data.rows || []);
      setUnread(Number(data.unread || 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [q, compact]);

  useEffect(() => {
    if (!socketRef.current) socketRef.current = getSharedSocket();
    const socket = socketRef.current;
    if (!socket) return;

    const join = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/auth/me`, getRequestConfig({ timeout: 15000 }));
        const user = data?.user || data?.data || null;
        const userid = user?._id || user?.id || "";
        if (!userid) return;
        socket.emit("notification_room_join", { kind, id: String(userid) });
      } catch {
        // silent
      }
    };

    const onKhanNotification = (payload) => {
      setRows((prev) => [payload, ...(prev || [])].slice(0, compact ? 20 : 200));
      setUnread((prev) => prev + 1);
    };

    join();
    socket.off("khan_notification", onKhanNotification);
    socket.on("khan_notification", onKhanNotification);

    return () => {
      socket.off("khan_notification", onKhanNotification);
    };
  }, [kind, compact]);

  const markRead = async (id) => {
    try {
      const { data } = await axios.patch(`${serverurl}/khannotification/my/${id}/read`, {}, getRequestConfig({ timeout: 15000 }));
      if (!data?.success) return;
      setRows((prev) => (prev || []).map((row) => (String(row._id) === String(id) ? { ...row, isread: true, readat: new Date().toISOString() } : row)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      const { data } = await axios.patch(`${serverurl}/khannotification/my/read-all`, {}, getRequestConfig({ timeout: 15000 }));
      if (!data?.success) return;
      setRows((prev) => (prev || []).map((row) => ({ ...row, isread: true })));
      setUnread(0);
    } catch {
      // silent
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-emerald-900">
          <Bell className="h-4 w-4" />
          <p className="text-sm font-semibold">GlowHaat Notification Inbox</p>
          {unread > 0 ? <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] text-white">{unread}</span> : null}
        </div>
        <button type="button" onClick={markAllRead} className="rounded-lg border border-emerald-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
          Mark All Read
        </button>
      </div>

      {!compact ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2">
          <Search className="h-4 w-4 text-emerald-700" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications..." className="w-full bg-transparent text-sm text-emerald-900 outline-none" />
        </div>
      ) : null}

      <div className={`mt-3 space-y-2 ${compact ? "max-h-[280px]" : "max-h-[420px]"} overflow-y-auto pr-1`}>
        {loading ? <p className="text-sm text-emerald-700">Loading notifications...</p> : null}
        {!loading && rows.length === 0 ? <p className="text-sm text-emerald-700">No notifications yet.</p> : null}
        {rows.map((row) => (
          <div key={row._id} className={`rounded-xl border p-3 ${styleByType(row.type)} ${row.isread ? "opacity-85" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  {row.title} {!row.isread ? <span className="ml-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] text-white">New</span> : null}
                </p>
                <p className="mt-1 text-xs text-emerald-800">{row.message}</p>
                <p className="mt-1 text-[11px] text-emerald-700">{row.channel || "general"} | {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</p>
              </div>
              {!row.isread ? (
                <button type="button" onClick={() => markRead(row._id)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
                  <CheckCheck className="h-3 w-3" /> Read
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default KhanNotificationInbox;
