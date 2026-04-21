"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import axios from "axios";
import {
  Layout,
  Package,
  Image as ImageIcon,
  Layers,
  LogOut,
  MessageSquareQuote,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Truck,
  Users,
  Store,
  Search,
} from "lucide-react";
import { serverurl } from "../../utils/constants/serverurl";
import { clearUserData } from "../../reduxcomponents/UserSlice";

const SuperAdminNav = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [toolSearch, setToolSearch] = React.useState("");

  const handleLogout = async () => {
    try {
      await axios.post(
        `${serverurl}/auth/logout`,
        {},
        { withCredentials: true, timeout: 12000 }
      );
    } catch (error) {
      // ignore logout errors
    } finally {
      dispatch(clearUserData());
      router.push("/signin");
    }
  };

  const tools = React.useMemo(
    () => [
      { href: "/SuperAdminUsers", label: "Users", icon: <Users className="h-4 w-4" /> },
      { href: "/SuperAdminOrders", label: "Orders", icon: <Truck className="h-4 w-4" /> },
      { href: "/SuperAdminQna", label: "Product Q&A", icon: <MessageSquareQuote className="h-4 w-4" /> },
      { href: "/SuperAdminShares", label: "Share Analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { href: "/SuperAdminRecommendationInsights", label: "Recommendation AI", icon: <Sparkles className="h-4 w-4" /> },
      { href: "/SuperAdminSellerRequests", label: "Seller Requests", icon: <Store className="h-4 w-4" /> },
      { href: "/SuperAdminSellerOperations", label: "Seller Ops", icon: <Store className="h-4 w-4" /> },
      { href: "/SuperAdminShopManagement", label: "Shop + Badge Hub", icon: <Store className="h-4 w-4" /> },
      { href: "/SuperAdminChatControl", label: "Conversation Control", icon: <MessageSquareQuote className="h-4 w-4" /> },
      { href: "/AdminItemManagments", label: "Item Management", icon: <Package className="h-4 w-4" /> },
      { href: "/AdminHomebanner", label: "Home Banners", icon: <ImageIcon className="h-4 w-4" /> },
      { href: "/AdminNavCoustomization", label: "Nav Customization", icon: <Layout className="h-4 w-4" /> },
      { href: "/AdminCategoryBuilder", label: "Category & Campaign", icon: <Layers className="h-4 w-4" /> },
    ],
    []
  );

  const filteredTools = React.useMemo(() => {
    const q = String(toolSearch || "").trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((entry) => entry.label.toLowerCase().includes(q));
  }, [toolSearch, tools]);

  const openToolBySearch = () => {
    const q = String(toolSearch || "").trim().toLowerCase();
    if (!q) return;
    const matched = tools.find((entry) => entry.label.toLowerCase() === q) || filteredTools[0];
    if (!matched) return;
    router.push(matched.href);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-[#dce8e2] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
        <div className="flex items-center gap-2 text-[#1f5c49]">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em]">SuperAdmin</span>
        </div>
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5e7f72]" />
          <input
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openToolBySearch();
            }}
            placeholder="Search admin tools..."
            className="h-10 w-full rounded-xl border border-[#dce8e2] bg-white pl-9 pr-3 text-sm text-[#1f5c49] outline-none focus:border-[#1f5c49]"
          />
          {toolSearch.trim() ? (
            <div className="absolute left-0 right-0 top-11 z-50 max-h-56 overflow-y-auto rounded-xl border border-[#dce8e2] bg-white p-1 shadow-xl">
              {filteredTools.length ? (
                filteredTools.slice(0, 10).map((entry) => (
                  <button
                    key={entry.href}
                    type="button"
                    onClick={() => {
                      setToolSearch("");
                      router.push(entry.href);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#1f5c49] hover:bg-[#f4faf7]"
                  >
                    {entry.icon}
                    {entry.label}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-[#4f665d]">No tools found.</p>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {tools.map((entry) => (
            <NavLink key={entry.href} href={entry.href} icon={entry.icon}>
              {entry.label}
            </NavLink>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#f1d7d7] bg-[#fff5f5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b42318] transition hover:bg-[#ffe9e9]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

const NavLink = ({ href, icon, children }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-2 rounded-full border border-[#dce8e2] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1f5c49] transition hover:border-[#1f5c49] hover:bg-[#f4faf7]"
  >
    {icon}
    {children}
  </Link>
);

export default SuperAdminNav;
