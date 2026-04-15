"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { AlertTriangle, Archive, ArchiveRestore, Ban, BellOff, Flag, Forward, ImagePlus, MessageCircle, Pin, PinOff, Reply, Search, Send, Smile, Trash2, Video } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😅", "😊", "😍", "😘", "😎", "🤩", "🤔", "😴",
  "😡", "😭", "🥳", "😇", "🤗", "👍", "👏", "🙏", "💪", "👀", "🔥", "💯",
  "💚", "💬", "✅", "🎉", "🌟", "✨", "🛍️", "📦", "🚚", "📍", "❤️", "💔",
];

const DEFAULT_AVATAR = "/khancoslogo.png";
const createGuestSessionId = () => `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getSocketOrigin = () => {
  try {
    return new URL(serverurl).origin;
  } catch {
    return serverurl || "";
  }
};

const normalizeAvatar = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_AVATAR;
  if (raw === DEFAULT_AVATAR) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${serverurl}${raw}`;
  return raw;
};

const formatSeenAt = (value) => {
  if (!value) return "Offline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Offline";
  return `Last seen ${date.toLocaleString()}`;
};

const KhanChatHub = ({ initialShop = null, initialProduct = null, embedded = false }) => {
  const { userData } = useSelector((state) => state.user || {});
  const user = userData?.user || userData?.data || userData || null;
  const role = String(user?.role || "Guest");
  const isSeller = role === "Seller";

  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const [guestSessionId, setGuestSessionId] = useState("");
  const [guestName, setGuestName] = useState("Guest");
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [activeThread, setActiveThread] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportFiles, setReportFiles] = useState([]);
  const [reporting, setReporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingFrom, setForwardingFrom] = useState(null);
  const [counterpartTyping, setCounterpartTyping] = useState(false);

  const actorType = isSeller || user?._id ? "user" : "guest";
  const actorId = actorType === "guest" ? guestSessionId : String(user?._id || "");
  const roomId = activeThreadId ? `chat:${activeThreadId}` : "";
  const activeMessages = useMemo(() => activeThread?.messages || [], [activeThread]);
  const threadBlocked = Boolean(activeThread?.blockedbybuyer || activeThread?.blockedbyseller);

  const sortedThreads = useMemo(() => {
    const list = Array.isArray(threads) ? [...threads] : [];
    list.sort((a, b) => {
      const aPinned = Boolean(a?.pinned);
      const bPinned = Boolean(b?.pinned);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      const aPinAt = a?.pinnedat ? new Date(a.pinnedat).getTime() : 0;
      const bPinAt = b?.pinnedat ? new Date(b.pinnedat).getTime() : 0;
      if (aPinned && bPinned && aPinAt !== bPinAt) return bPinAt - aPinAt;

      const aTime = a?.lastmessagedat ? new Date(a.lastmessagedat).getTime() : 0;
      const bTime = b?.lastmessagedat ? new Date(b.lastmessagedat).getTime() : 0;
      return bTime - aTime;
    });
    return list;
  }, [threads]);

  const withGuestHeaders = (extra = {}) => {
    if (actorType !== "guest") return getRequestConfig(extra);
    return getRequestConfig({
      ...extra,
      headers: {
        ...(extra?.headers || {}),
        "x-guest-session": guestSessionId,
        "x-guest-name": guestName,
      },
    });
  };

  const resolveIsOwnMessage = (message) => {
    if (!message) return false;
    if (actorType === "guest") return message.senderkind === "guest" && message.senderguestsessionid === guestSessionId;
    return String(message.senderid || "") === String(user?._id || "");
  };

  const loadThreads = async () => {
    try {
      setLoadingThreads(true);
      setStatus("");
      const params = actorType === "guest" ? { guestsessionid: guestSessionId } : {};
      if (searchQuery) params.q = searchQuery;
      params.archived = showArchived ? "true" : "false";
      const { data } = await axios.get(`${serverurl}/seller/chat/threads`, withGuestHeaders({ params, timeout: 45000 }));
      if (!data?.success) throw new Error(data?.message || "Failed to load chats.");
      setThreads(data.threads || []);
      return data.threads || [];
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to load chats.");
      return [];
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadThread = async (threadId) => {
    if (!threadId) return;
    try {
      setLoadingThread(true);
      const params = actorType === "guest" ? { guestsessionid: guestSessionId } : {};
      const { data } = await axios.get(`${serverurl}/seller/chat/threads/${threadId}`, withGuestHeaders({ params, timeout: 45000 }));
      if (!data?.success || !data?.thread) throw new Error(data?.message || "Failed to load chat thread.");
      setActiveThread(data.thread);

      await axios.patch(
        `${serverurl}/seller/chat/threads/${threadId}/read`,
        { guestsessionid: actorType === "guest" ? guestSessionId : "" },
        withGuestHeaders({ timeout: 45000 })
      );
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to load this conversation.");
    } finally {
      setLoadingThread(false);
    }
  };

  const startInitialThread = async () => {
    if (!initialShop?.slug && !initialShop?._id) return null;
    try {
      const payload = {
        shopslug: initialShop?.slug || "",
        shopid: initialShop?._id || "",
        productid: initialProduct?._id || "",
        guestsessionid: actorType === "guest" ? guestSessionId : "",
        guestname: actorType === "guest" ? guestName : "",
      };
      const { data } = await axios.post(`${serverurl}/seller/chat/start`, payload, withGuestHeaders({ timeout: 45000 }));
      if (!data?.success || !data?.thread?._id) throw new Error(data?.message || "Failed to open chat.");
      return String(data.thread._id);
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Unable to start seller chat.");
      return null;
    }
  };

  const connectSocket = () => {
    const origin = getSocketOrigin();
    if (!origin) return;
    if (!socketRef.current) socketRef.current = io(origin, { transports: ["websocket", "polling"], withCredentials: true });

    const socket = socketRef.current;
    socket.off("chat_message");
    socket.off("chat_message_deleted");
    socket.off("chat_block_update");
    socket.off("chat_pin_update");
    socket.off("chat_presence_update");
    socket.off("chat_mute_update");
    socket.off("chat_archive_update");
    socket.off("chat_typing");

    socket.on("chat_message", (payload) => {
      if (!payload?.threadid) return;
      if (payload.threadid === activeThreadId) loadThread(activeThreadId);
      loadThreads();
    });
    socket.on("chat_message_deleted", (payload) => {
      if (!payload?.threadid || payload.threadid !== activeThreadId) return;
      loadThread(activeThreadId);
    });
    socket.on("chat_block_update", (payload) => {
      if (!payload?.threadid) return;
      if (payload.threadid === activeThreadId) loadThread(activeThreadId);
      loadThreads();
    });
    socket.on("chat_pin_update", () => {
      loadThreads();
      if (activeThreadId) loadThread(activeThreadId);
    });
    socket.on("chat_mute_update", () => {
      loadThreads();
      if (activeThreadId) loadThread(activeThreadId);
    });
    socket.on("chat_archive_update", () => {
      loadThreads();
      if (activeThreadId) loadThread(activeThreadId);
    });
    socket.on("chat_typing", (payload) => {
      if (!payload?.threadid || payload.threadid !== activeThreadId) return;
      if (String(payload?.actorid || "") === String(actorId || "")) return;
      setCounterpartTyping(Boolean(payload?.typing));
    });
    socket.on("chat_presence_update", (payload) => {
      const changedActor = String(payload?.actorid || "");
      if (!changedActor) return;

      setThreads((prev) =>
        (prev || []).map((thread) => {
          const counterpartId = String(thread?.counterpart?._id || "");
          if (counterpartId && counterpartId === changedActor) {
            return { ...thread, counterpartonline: Boolean(payload?.online), counterpartlastseenat: payload?.lastseenat || null };
          }
          const counterpartGuestSession = String(thread?.counterpart?.sessionid || "");
          if (counterpartGuestSession && counterpartGuestSession === changedActor) {
            return { ...thread, counterpartonline: Boolean(payload?.online), counterpartlastseenat: payload?.lastseenat || null };
          }
          return thread;
        })
      );

      setActiveThread((prev) => {
        if (!prev) return prev;
        const sellerId = String(prev?.sellerid?._id || prev?.sellerid || "");
        const buyerId = String(prev?.buyerid?._id || prev?.buyerid || "");
        const guestId = String(prev?.guestsessionid || "");
        if ([sellerId, buyerId, guestId].includes(changedActor)) {
          return { ...prev, counterpartonline: Boolean(payload?.online), counterpartlastseenat: payload?.lastseenat || null };
        }
        return prev;
      });
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("khc_guest_chat_session");
    const next = existing || createGuestSessionId();
    window.localStorage.setItem("khc_guest_chat_session", next);
    setGuestSessionId(next);
    setGuestName(window.localStorage.getItem("khc_guest_chat_name") || "Guest");
  }, []);

  useEffect(() => {
    if (actorType === "guest" && !guestSessionId) return;
    connectSocket();
    const bootstrap = async () => {
      const loaded = await loadThreads();
      const started = await startInitialThread();
      const selected = started || loaded?.[0]?._id || "";
      if (selected) setActiveThreadId(selected);
    };
    bootstrap();
  }, [actorType, guestSessionId, initialShop?._id, initialShop?.slug, initialProduct?._id]);

  useEffect(() => {
    if (actorType === "guest" && !guestSessionId) return;
    loadThreads();
  }, [searchQuery, showArchived]);

  useEffect(() => {
    if (!activeThreadId) return;
    loadThread(activeThreadId);
  }, [activeThreadId]);

  useEffect(() => {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit("join_room", roomId);
  }, [roomId]);

  useEffect(() => {
    if (!socketRef.current || !actorId) return;
    const ping = () => {
      socketRef.current?.emit("presence_ping", { actortype: actorType, actorid: actorId, threadid: activeThreadId || "" });
    };
    ping();
    const timer = setInterval(ping, 15000);
    return () => clearInterval(timer);
  }, [actorType, actorId, activeThreadId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages.length]);

  useEffect(() => {
    if (!socketRef.current || !activeThreadId) return;
    const timer = setTimeout(() => {
      socketRef.current?.emit("chat_typing", { threadid: activeThreadId, actorid: actorId, actortype: actorType, typing: Boolean(draft.trim()) });
    }, 180);
    return () => clearTimeout(timer);
  }, [draft, actorId, actorType, activeThreadId]);

  const handleSend = async () => {
    if (!activeThreadId || sending) return;
    const text = String(draft || "").trim();
    if (!text && (!files || files.length === 0)) return;

    try {
      setSending(true);
      setStatus("");
      const fd = new FormData();
      if (text) fd.append("text", text);
      if (replyingTo?._id) fd.append("replytoid", String(replyingTo._id));
      if (forwardingFrom?._id) fd.append("forwardmessageid", String(forwardingFrom._id));
      if (actorType === "guest") {
        fd.append("guestsessionid", guestSessionId);
        fd.append("guestname", guestName);
      }
      (files || []).forEach((file) => fd.append("files", file));

      const { data } = await axios.post(
        `${serverurl}/seller/chat/threads/${activeThreadId}/messages`,
        fd,
        withGuestHeaders({ headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to send message.");

      setDraft("");
      setFiles([]);
      setShowEmoji(false);
      setReplyingTo(null);
      setForwardingFrom(null);
      if (socketRef.current) {
        socketRef.current.emit("send_message", { roomid: `chat:${activeThreadId}`, threadid: activeThreadId });
      }
      await loadThread(activeThreadId);
      await loadThreads();
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const body = actorType === "guest" ? { guestsessionid: guestSessionId } : {};
      const { data } = await axios.delete(
        `${serverurl}/seller/chat/threads/${activeThreadId}/messages/${messageId}`,
        withGuestHeaders({ data: body, timeout: 45000 })
      );
      if (!data?.success) throw new Error(data?.message || "Delete failed.");
      await loadThread(activeThreadId);
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to delete message.");
    }
  };

  const handleToggleBlock = async (nextBlocked) => {
    if (!activeThreadId) return;
    try {
      const payload = { block: nextBlocked, reason: nextBlocked ? "Blocked from KhanChat" : "", guestsessionid: actorType === "guest" ? guestSessionId : "" };
      const { data } = await axios.patch(`${serverurl}/seller/chat/threads/${activeThreadId}/block`, payload, withGuestHeaders({ timeout: 45000 }));
      if (!data?.success) throw new Error(data?.message || "Failed to update block state.");
      await loadThread(activeThreadId);
      await loadThreads();
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to update block state.");
    }
  };

  const handleTogglePin = async (nextPin) => {
    if (!activeThreadId) return;
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/chat/threads/${activeThreadId}/pin`,
        { pin: nextPin, guestsessionid: actorType === "guest" ? guestSessionId : "" },
        withGuestHeaders({ timeout: 45000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to pin chat.");
      await loadThread(activeThreadId);
      await loadThreads();
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to pin conversation.");
    }
  };

  const handleToggleMute = async (nextMute) => {
    if (!activeThreadId) return;
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/chat/threads/${activeThreadId}/mute`,
        { mute: nextMute, guestsessionid: actorType === "guest" ? guestSessionId : "" },
        withGuestHeaders({ timeout: 45000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to mute chat.");
      await loadThread(activeThreadId);
      await loadThreads();
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to update mute.");
    }
  };

  const handleToggleArchive = async (nextArchive) => {
    if (!activeThreadId) return;
    try {
      const { data } = await axios.patch(
        `${serverurl}/seller/chat/threads/${activeThreadId}/archive`,
        { archive: nextArchive, guestsessionid: actorType === "guest" ? guestSessionId : "" },
        withGuestHeaders({ timeout: 45000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to archive chat.");
      if (nextArchive) {
        setActiveThreadId("");
        setActiveThread(null);
      }
      await loadThreads();
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to archive conversation.");
    }
  };

  const handleSubmitReport = async () => {
    if (!activeThreadId || !reportReason || reporting) return;
    try {
      setReporting(true);
      const fd = new FormData();
      fd.append("threadid", activeThreadId);
      fd.append("reason", reportReason);
      fd.append("details", reportDetails);
      if (actorType === "guest") {
        fd.append("guestsessionid", guestSessionId);
        fd.append("guestname", guestName);
      }
      (reportFiles || []).forEach((file) => fd.append("evidence", file));

      const { data } = await axios.post(
        `${serverurl}/seller/chat/reports`,
        fd,
        withGuestHeaders({ headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })
      );
      if (!data?.success) throw new Error(data?.message || "Failed to submit report.");
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
      setReportFiles([]);
      setStatus("Report submitted successfully. Superadmin will investigate.");
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  const saveGuestName = (value) => {
    const name = String(value || "").trim() || "Guest";
    setGuestName(name);
    if (typeof window !== "undefined") window.localStorage.setItem("khc_guest_chat_name", name);
  };

  return (
    <div className={`grid min-h-[70vh] grid-cols-1 gap-4 md:grid-cols-[340px_1fr] ${embedded ? "" : "mx-auto max-w-7xl p-4"}`}>
      <aside className="rounded-2xl border border-emerald-200 bg-white">
        <div className="border-b border-emerald-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">KhanChat</p>
          <h2 className="mt-1 text-lg font-semibold text-emerald-950">{isSeller ? "Seller Chat Hub" : "Customer Messenger"}</h2>
          {actorType === "guest" ? (
            <input
              value={guestName}
              onChange={(e) => saveGuestName(e.target.value)}
              className="mt-3 h-10 w-full rounded-xl border border-emerald-200 px-3 text-sm text-emerald-900 outline-none focus:border-emerald-500"
              placeholder="Your name (guest)"
            />
          ) : null}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2">
            <Search className="h-4 w-4 text-emerald-700" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chat history..." className="w-full bg-transparent text-sm text-emerald-900 outline-none" />
          </div>
          <button type="button" onClick={() => setShowArchived((prev) => !prev)} className="mt-2 rounded-lg border border-emerald-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800">
            {showArchived ? "Show Active" : "Show Archived"}
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto">
          {loadingThreads ? <p className="px-4 py-4 text-sm text-emerald-700">Loading chats...</p> : null}
          {!loadingThreads && sortedThreads.length === 0 ? <p className="px-4 py-5 text-sm text-emerald-700">No chat found yet.</p> : null}
          {sortedThreads.map((thread) => {
            const active = String(thread._id) === String(activeThreadId);
            return (
              <button
                key={thread._id}
                type="button"
                onClick={() => setActiveThreadId(thread._id)}
                className={`w-full border-b border-emerald-100 px-4 py-3 text-left ${active ? "bg-emerald-50" : "bg-white hover:bg-emerald-50/40"}`}
              >
                <div className="flex items-start gap-3">
                  <img src={normalizeAvatar(thread?.counterpart?.usersavatar || thread?.shop?.profileimage || "")} alt="avatar" className="h-10 w-10 rounded-full border border-emerald-200 object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-emerald-900">{thread?.counterpart?.fullname || thread?.shop?.shopname || "Chat"}</p>
                      {thread?.pinned ? <Pin className="h-3.5 w-3.5 text-emerald-700" /> : null}
                    </div>
                    <p className="line-clamp-1 text-xs text-emerald-700">{thread.lastmessage || "No message"}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600">{thread?.counterpartonline ? "Online" : formatSeenAt(thread?.counterpartlastseenat)}</span>
                      {Number(thread?.unread || 0) > 0 ? <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">{thread.unread}</span> : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-emerald-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 px-4 py-3">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold text-emerald-950">{activeThread?.shopid?.shopname || activeThread?.counterpart?.fullname || "Select a chat"}</p>
            <p className="text-xs text-emerald-700">
              {activeThread?.counterpartonline
                ? "Online now"
                : activeThread?.counterpartlastseenat
                  ? formatSeenAt(activeThread?.counterpartlastseenat)
                  : activeThread?.productid?.name || (threadBlocked ? "This conversation is blocked" : "Real-time KhanChat")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeThreadId ? (
              <button type="button" onClick={() => handleTogglePin(!Boolean(activeThread?.pinned))} className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                {activeThread?.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                {activeThread?.pinned ? "Unpin" : "Pin"}
              </button>
            ) : null}

            {activeThreadId ? (
              <button type="button" onClick={() => handleToggleMute(!Boolean(activeThread?.muted))} className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                <BellOff className="h-3.5 w-3.5" />
                {activeThread?.muted ? "Unmute" : "Mute"}
              </button>
            ) : null}

            {activeThreadId ? (
              <button type="button" onClick={() => handleToggleArchive(!Boolean(activeThread?.archived))} className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                {activeThread?.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {activeThread?.archived ? "Restore" : "Archive"}
              </button>
            ) : null}

            {activeThreadId ? (
              <button type="button" onClick={() => handleToggleBlock(!threadBlocked)} className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                <Ban className="h-3.5 w-3.5" />
                {threadBlocked ? "Unblock" : "Block"}
              </button>
            ) : null}

            {!isSeller && activeThreadId ? (
              <button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1 rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
                <Flag className="h-3.5 w-3.5" />
                Report Seller
              </button>
            ) : null}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f8fffb_0%,#ffffff_100%)] px-4 py-4">
          {loadingThread ? <p className="text-sm text-emerald-700">Loading conversation...</p> : null}
          {!loadingThread && activeMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-6 text-center text-sm text-emerald-700">
              <MessageCircle className="mx-auto mb-2 h-5 w-5" />
              Start messaging now.
            </div>
          ) : null}
          {counterpartTyping ? <p className="text-xs text-emerald-700">Typing...</p> : null}

          {activeMessages.map((message) => {
            const own = resolveIsOwnMessage(message);
            return (
              <div key={message._id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                {!own ? (
                  <img src={normalizeAvatar(activeThread?.counterpart?.usersavatar || activeThread?.shopid?.profileimage || "")} alt="avatar" className="mr-2 mt-6 h-8 w-8 rounded-full border border-emerald-200 object-cover" />
                ) : null}
                <div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${own ? "bg-emerald-700 text-white" : "border border-emerald-200 bg-white text-emerald-900"}`}>
                  {message.replypreview ? <p className={`mb-1 rounded-md px-2 py-1 text-xs ${own ? "bg-white/20" : "bg-emerald-50 text-emerald-800"}`}>Reply: {message.replypreview}</p> : null}
                  {message.forwardedpreview ? <p className={`mb-1 rounded-md px-2 py-1 text-xs ${own ? "bg-white/20" : "bg-emerald-50 text-emerald-800"}`}>Forwarded: {message.forwardedpreview}</p> : null}
                  <p className="text-[11px] uppercase tracking-[0.1em] opacity-80">
                    {message.senderrole} {message.senderkind === "guest" ? `(${message.senderguestname || "Guest"})` : ""}
                  </p>
                  <p className="whitespace-pre-wrap">{message.text}</p>

                  {Array.isArray(message.media) && message.media.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {message.media.map((media, idx) => (
                        <div key={`${message._id}-media-${idx}`} className="overflow-hidden rounded-xl border border-emerald-200 bg-white/80 p-1">
                          {media.type === "video" ? <video controls src={media.url} className="max-h-56 w-full rounded object-cover" /> : <img src={media.url} alt={media.name || "media"} className="max-h-56 w-full rounded object-cover" />}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] opacity-80">
                    <span>{message.createdat ? new Date(message.createdat).toLocaleString() : ""}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setReplyingTo(message)} className="inline-flex items-center gap-1"><Reply className="h-3 w-3" /> Reply</button>
                      <button type="button" onClick={() => setForwardingFrom(message)} className="inline-flex items-center gap-1"><Forward className="h-3 w-3" /> Forward</button>
                      {own && !message.isdeleted ? (
                        <button type="button" onClick={() => handleDeleteMessage(message._id)} className="inline-flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      ) : null}
                      {own ? (
                        <span className="text-[10px]">{message.senderrole === "Seller" ? (message.readbybuyer ? "Seen" : "Sent") : (message.readbyseller ? "Seen" : "Sent")}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {status ? (
          <div className="mx-4 mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <div className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {status}
            </div>
          </div>
        ) : null}

        <div className="border-t border-emerald-100 px-4 py-3">
          {replyingTo ? (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <span>Replying: {String(replyingTo?.text || "").slice(0, 120)}</span>
              <button type="button" onClick={() => setReplyingTo(null)} className="underline">Clear</button>
            </div>
          ) : null}
          {forwardingFrom ? (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <span>Forwarding: {String(forwardingFrom?.text || "").slice(0, 120)}</span>
              <button type="button" onClick={() => setForwardingFrom(null)} className="underline">Clear</button>
            </div>
          ) : null}
          {showEmoji ? (
            <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2">
              {EMOJIS.map((emoji, idx) => (
                <button key={`${emoji}-${idx}`} type="button" onClick={() => setDraft((prev) => `${prev}${emoji}`)} className="rounded-lg bg-white px-2 py-1 text-lg">
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-end gap-2">
            <button type="button" onClick={() => setShowEmoji((prev) => !prev)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300 text-emerald-700">
              <Smile className="h-4 w-4" />
            </button>

            <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-emerald-300 text-emerald-700">
              <ImagePlus className="h-4 w-4" />
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </label>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={2000}
              disabled={!activeThreadId || threadBlocked}
              className="min-h-[44px] flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-50"
              placeholder={threadBlocked ? "Conversation is blocked" : "Type your message..."}
            />

            <button type="button" onClick={handleSend} disabled={!activeThreadId || sending || threadBlocked} className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-4 text-white disabled:opacity-60">
              <Send className="h-4 w-4" /> Send
            </button>
          </div>

          {files.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
              <span className="font-semibold">Attachments:</span>
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`} className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5">
                  {file.type.startsWith("video/") ? <Video className="mr-1 inline h-3 w-3" /> : <ImagePlus className="mr-1 inline h-3 w-3" />}
                  {file.name}
                </span>
              ))}
              <button type="button" onClick={() => setFiles([])} className="underline">Clear</button>
            </div>
          ) : null}
        </div>
      </section>

      {reportOpen ? (
        <div className="fixed inset-0 z-[130]">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setReportOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-emerald-950">Report Seller</h3>
            <p className="mt-1 text-sm text-emerald-700">Report abusive behavior. Superadmin will investigate this evidence.</p>
            <label className="mt-3 block text-sm font-medium text-emerald-800">Reason</label>
            <input value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500" placeholder="Abusive language / scam / harassment" />
            <label className="mt-3 block text-sm font-medium text-emerald-800">Details</label>
            <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Write full details" />
            <label className="mt-3 block text-sm font-medium text-emerald-800">Evidence (image/video)</label>
            <input type="file" accept="image/*,video/*" multiple className="mt-2 block w-full text-xs" onChange={(e) => setReportFiles(Array.from(e.target.files || []))} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReportOpen(false)} className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800">Cancel</button>
              <button type="button" onClick={handleSubmitReport} disabled={reporting || !reportReason} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Submit Report</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default KhanChatHub;
