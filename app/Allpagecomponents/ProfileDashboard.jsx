"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import {
  BadgeCheck,
  Gift,
  MapPin,
  MessageSquareText,
  Package,
  UploadCloud,
  UserCircle2,
} from "lucide-react";
import UserNav from "./UserNav";
import KhanChatHub from "./KhanChatHub";
import KhanNotificationInbox from "./KhanNotificationInbox";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import { setUserData } from "../reduxcomponents/UserSlice";

const guestAvatarKey = "khc_guest_avatar";

const ProfileDashboard = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user || {});
  const storedUser = userData?.user || userData?.data || userData || null;
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  const isAuthenticated = Boolean(
    storedUser?._id || storedUser?.id || storedUser?.email,
  );
  const role = String(storedUser?.role || "Guest");
  const [profile, setProfile] = useState({
    fullname: storedUser?.fullname || "Guest User",
    email: storedUser?.email || "",
    mobile: storedUser?.mobile || "",
    district: storedUser?.district || storedUser?.District || "",
    city: storedUser?.city || "",
    upzilla: storedUser?.upzilla || "",
    fulladdress: storedUser?.fulladdress || "",
    avatar: storedUser?.avatar || storedUser?.usersavatar || "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated) return;
    const guestAvatar = window.localStorage.getItem(guestAvatarKey) || "";
    if (guestAvatar) {
      setProfile((prev) => ({ ...prev, avatar: guestAvatar }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let canceled = false;

    const bootstrap = async () => {
      if (!isAuthenticated) return;
      try {
        const { data } = await axios.get(
          `${serverurl}/auth/me`,
          getRequestConfig({ timeout: 18000 }),
        );
        if (canceled || !data?.user) return;
        const remoteUser = data.user;
        const next = {
          fullname: remoteUser.fullname || "User",
          email: remoteUser.email || "",
          mobile: remoteUser.mobile || "",
          district: remoteUser.district || remoteUser.District || "",
          city: remoteUser.city || "",
          upzilla: remoteUser.upzilla || "",
          fulladdress: remoteUser.fulladdress || "",
          avatar: remoteUser.avatar || remoteUser.usersavatar || "",
        };
        setProfile(next);
        dispatch(setUserData({ user: remoteUser }));
      } catch {
        // silent fallback to redux data
      }
    };

    bootstrap();
    return () => {
      canceled = true;
    };
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    let canceled = false;
    const loadOrders = async () => {
      if (!isAuthenticated) return;
      try {
        setOrdersLoading(true);
        const { data } = await axios.get(
          `${serverurl}/order/my`,
          getRequestConfig({ timeout: 22000 }),
        );
        if (canceled || !data?.success) return;
        setOrders(Array.isArray(data.orders) ? data.orders.slice(0, 8) : []);
      } catch {
        if (!canceled) setOrders([]);
      } finally {
        if (!canceled) setOrdersLoading(false);
      }
    };

    if (activeTab === "orders") loadOrders();
    return () => {
      canceled = true;
    };
  }, [activeTab, isAuthenticated]);

  const badgeLabel = isAuthenticated ? "Verified" : "Guest";
  const profileInitial = (profile.fullname?.trim()?.[0] || "G").toUpperCase();

  const joinedDays = useMemo(() => {
    if (!storedUser?.createdAt) return 0;
    const created = new Date(storedUser.createdAt).getTime();
    if (Number.isNaN(created)) return 0;
    return Math.max(
      0,
      Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000)),
    );
  }, [storedUser?.createdAt]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatar: localPreview }));

    if (!isAuthenticated) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = String(reader.result || "");
          if (!base64) return;
          window.localStorage.setItem(guestAvatarKey, base64);
          setProfile((prev) => ({ ...prev, avatar: base64 }));
          setStatus("Guest avatar saved in this browser.");
        } catch {
          setStatus("Could not save guest avatar.");
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setSaving(true);
      setStatus("");
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await axios.patch(
        `${serverurl}/auth/profile`,
        fd,
        getRequestConfig({
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        }),
      );
      if (!data?.success)
        throw new Error(data?.message || "Failed to update avatar.");
      const updated = data.user || {};
      setProfile((prev) => ({
        ...prev,
        avatar: updated.avatar || prev.avatar,
      }));
      dispatch(setUserData({ user: { ...(storedUser || {}), ...updated } }));
      setStatus("Avatar updated successfully.");
    } catch (error) {
      setStatus(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload avatar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    if (!isAuthenticated) {
      setStatus("Sign in to save address details.");
      return;
    }
    try {
      setSaving(true);
      setStatus("");
      const payload = {
        fullname: profile.fullname,
        mobile: profile.mobile,
        district: profile.district,
        city: profile.city,
        upzilla: profile.upzilla,
        fulladdress: profile.fulladdress,
      };
      const { data } = await axios.patch(
        `${serverurl}/auth/profile`,
        payload,
        getRequestConfig({ timeout: 25000 }),
      );
      if (!data?.success)
        throw new Error(data?.message || "Could not save profile.");
      const updated = data.user || {};
      setProfile((prev) => ({
        ...prev,
        fullname: updated.fullname || prev.fullname,
        mobile: updated.mobile || prev.mobile,
        district: updated.district || prev.district,
        city: updated.city || prev.city,
        upzilla: updated.upzilla || prev.upzilla,
        fulladdress: updated.fulladdress || prev.fulladdress,
        avatar: updated.avatar || prev.avatar,
      }));
      dispatch(setUserData({ user: { ...(storedUser || {}), ...updated } }));
      setStatus("Profile saved successfully.");
    } catch (error) {
      setStatus(
        error?.response?.data?.message ||
          error?.message ||
          "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4fff9_0%,#ffffff_24%,#f7fffb_100%)]">
      <UserNav />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-32 lg:pt-42.5">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gray-200 bg-gray-200 p-4">
              <div className="flex items-center gap-3">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.fullname}
                    className="h-16 w-16 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-xl font-bold text-white">
                    {profileInitial}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    {profile.fullname || "Guest User"}
                  </p>
                  <p className="text-xs text-gray-700">
                    {profile.email || "guest@glowhaat.local"}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-700">
                    <BadgeCheck className="h-3 w-3" />
                    {badgeLabel}
                  </span>
                </div>
              </div>
              {joinedDays > 0 ? (
                <p className="mt-3 text-xs text-gray-700">
                  Joined Glow Haat {joinedDays} days ago
                </p>
              ) : null}
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-800">
                <UploadCloud className="h-4 w-4" />
                {saving ? "Uploading..." : "Upload Avatar"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <div className="mt-4 space-y-2">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: <UserCircle2 className="h-4 w-4" />,
                },
                {
                  id: "vouchers",
                  label: "Voucher Center",
                  icon: <Gift className="h-4 w-4" />,
                },
                {
                  id: "address",
                  label: "Address Book",
                  icon: <MapPin className="h-4 w-4" />,
                },
                {
                  id: "orders",
                  label: "My Orders",
                  icon: <Package className="h-4 w-4" />,
                },
                {
                  id: "khanchat",
                  label: "KhanChat",
                  icon: <MessageSquareText className="h-4 w-4" />,
                },
                {
                  id: "notifications",
                  label: "Notifications",
                  icon: <BadgeCheck className="h-4 w-4" />,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                    activeTab === item.id
                      ? "border-gray-500 bg-gray-50 text-gray-900"
                      : "border-gray-100 bg-white text-gray-800"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            {status ? (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800">
                {status}
              </div>
            ) : null}

            {activeTab === "overview" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
                  Profile Dashboard
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-gray-950">
                  Welcome to your dashboard
                </h1>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  
                   <button
                    type="button"
                    onClick={() => setActiveTab("vouchers")}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left"
                  >
                    <Gift className="h-6 w-6 text-gray-900" />
                    <p className="text-sm mt-3 font-semibold text-gray-900">
                      Voucher Center
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      Check available vouchers and offers.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("address")}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left"
                  >
                    <MapPin className="h-6 w-6 text-gray-900" />
                    <p className="text-sm mt-3 font-semibold text-gray-900">
                      Address Book
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      Manage delivery address for Steadfast.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left"
                  >
                    <Package className="h-6 w-6 text-gray-900" />
                    <p className="text-sm mt-3 font-semibold text-gray-900">
                      My Orders
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      Track all your purchase history.
                    </p>
                  </button>
                   <button
                    type="button"
                    onClick={() => setActiveTab("khanchat")}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left"
                  >
                    <MessageSquareText className="h-6 w-6 text-gray-900" />
                    <p className="text-sm mt-3 font-semibold text-gray-900">
                      KhanChat
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      Track all your purchase history.
                    </p>
                  </button>
                  {/* <ActionCard title="Address Book" subtitle="Manage delivery address for Steadfast." href="#" onClick={() => setActiveTab("address")} /> */}
                  {/* <ActionCard
                    title="My Orders"
                    subtitle="Track all your purchase history."
                    href="/my-orders"
                  /> */}
                  {/* <ActionCard
                    title="KhanChat"
                    subtitle="Chat with sellers from one place."
                    href="#"
                    onClick={() => setActiveTab("khanchat")}
                  /> */}
                </div>
              </div>
            ) : null}

            {activeTab === "vouchers" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
                  Voucher Center
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  Glow Haat vouchers
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <VoucherCard
                    title="Spend à§³5000 Get à§³300"
                    code="KHAN300"
                    minText="Minimum purchase à§³5000"
                  />
                  <VoucherCard
                    title="Store voucher available"
                    code="STOREDEAL"
                    minText="Use in selected seller stores"
                  />
                </div>
                <p className="mt-4 text-xs text-gray-700">
                  Apply voucher during checkout. SuperAdmin and sellers can
                  issue live coupons.
                </p>
              </div>
            ) : null}

            {activeTab === "address" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
                  Address Book
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  Steadfast delivery area details
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field
                    label="Full Name"
                    value={profile.fullname}
                    onChange={(value) =>
                      setProfile((prev) => ({ ...prev, fullname: value }))
                    }
                  />
                  <Field
                    label="Mobile"
                    value={profile.mobile}
                    onChange={(value) =>
                      setProfile((prev) => ({ ...prev, mobile: value }))
                    }
                  />
                  <Field
                    label="District"
                    value={profile.district}
                    onChange={(value) =>
                      setProfile((prev) => ({ ...prev, district: value }))
                    }
                  />
                  <Field
                    label="City"
                    value={profile.city}
                    onChange={(value) =>
                      setProfile((prev) => ({ ...prev, city: value }))
                    }
                  />
                  <Field
                    label="Upzilla"
                    value={profile.upzilla}
                    onChange={(value) =>
                      setProfile((prev) => ({ ...prev, upzilla: value }))
                    }
                  />
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-700">
                      Full Address
                    </label>
                    <textarea
                      value={profile.fulladdress}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          fulladdress: e.target.value,
                        }))
                      }
                      className="mt-1 min-h-22 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={saving}
                  className="mt-4 rounded-xl bg-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            ) : null}

            {activeTab === "orders" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
                  My Orders
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-950">
                  Latest orders overview
                </h2>
                {!isAuthenticated ? (
                  <p className="mt-4 text-sm text-gray-700">
                    Sign in to view your full order history.
                  </p>
                ) : ordersLoading ? (
                  <p className="mt-4 text-sm text-gray-700">
                    Loading orders...
                  </p>
                ) : orders.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-700">
                    No orders found yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {orders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {order.ordernumber}
                        </p>
                        <p className="text-xs text-gray-700">
                          Status: {order.status} | Total: à§³
                          {Number(order.grandtotal || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  href="/my-orders"
                  className="mt-4 inline-flex rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-800"
                >
                  Open Full Orders
                </Link>
              </div>
            ) : null}

            {activeTab === "khanchat" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-2 md:p-3">
                <KhanChatHub embedded />
              </div>
            ) : null}

            {activeTab === "notifications" ? (
              <KhanNotificationInbox role={role} />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

const Field = ({ label, value, onChange }) => (
  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-700">
    {label}
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-500"
    />
  </label>
);

const ActionCard = ({ title, subtitle, href, onClick, Icon = null }) => {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left"
      >
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-700">{subtitle}</p>
      </button>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left"
    >
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-700">{subtitle}</p>
    </Link>
  );
};

const VoucherCard = ({ title, code, minText }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-900">{title}</p>
    <p className="mt-2 inline-flex rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-800">
      {code}
    </p>
    <p className="mt-2 text-xs text-gray-700">{minText}</p>
  </div>
);

export default ProfileDashboard;
