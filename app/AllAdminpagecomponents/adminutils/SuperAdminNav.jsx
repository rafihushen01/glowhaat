"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
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
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Settings,
  Bell,
  FolderTree
} from "lucide-react";
import { serverurl } from "../../utils/constants/serverurl";
import { clearUserData } from "../../reduxcomponents/UserSlice";

const SuperAdminNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  
  const [isOpen, setIsOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;

  // Prevent scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  const tools = useMemo(
    () => [
      { href: "/SuperAdmin", label: "Control Center", icon: <Layout className="h-4 w-4" />, category: "Core" },
      { href: "/AdminItemManagments", label: "Item Management", icon: <Package className="h-4 w-4" />, category: "Catalog" },
      { href: "/AdminCategoryBuilder", label: "Category & Campaign", icon: <Layers className="h-4 w-4" />, category: "Catalog" },
      { href: "/AdminProductCategoryBuilder", label: "Product Categories", icon: <FolderTree className="h-4 w-4" />, category: "Catalog" },
      { href: "/AdminNavCoustomization", label: "Nav Customization", icon: <Layout className="h-4 w-4" />, category: "Design" },
      { href: "/AdminHomebanner", label: "Home Banners", icon: <ImageIcon className="h-4 w-4" />, category: "Design" },
      { href: "/SuperAdminUsers", label: "User Accounts", icon: <Users className="h-4 w-4" />, category: "Commerce" },
      { href: "/SuperAdminOrders", label: "Customer Orders", icon: <Truck className="h-4 w-4" />, category: "Commerce" },
      { href: "/SuperAdminSellerRequests", label: "Seller Requests", icon: <Store className="h-4 w-4" />, category: "Partners" },
      { href: "/SuperAdminSellerOperations", label: "Seller Ops & Finance", icon: <Store className="h-4 w-4" />, category: "Partners" },
      { href: "/SuperAdminShopManagement", label: "Shop & Badge Hub", icon: <Store className="h-4 w-4" />, category: "Partners" },
      { href: "/SuperAdminRecommendationInsights", label: "Recommendation AI", icon: <Sparkles className="h-4 w-4" />, category: "Insights" },
      { href: "/SuperAdminShares", label: "Share Analytics", icon: <BarChart3 className="h-4 w-4" />, category: "Insights" },
      { href: "/SuperAdminChatControl", label: "Conversation Control", icon: <MessageSquareQuote className="h-4 w-4" />, category: "Insights" },
      { href: "/SuperAdminQna", label: "Product Q&A", icon: <MessageSquareQuote className="h-4 w-4" />, category: "Insights" },
    ],
    []
  );

  const filteredTools = useMemo(() => {
    const q = String(toolSearch || "").trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((entry) => entry.label.toLowerCase().includes(q));
  }, [toolSearch, tools]);

  const openToolBySearch = () => {
    const q = String(toolSearch || "").trim().toLowerCase();
    if (!q) return;
    const matched = tools.find((entry) => entry.label.toLowerCase() === q) || filteredTools[0];
    if (!matched) return;
    setToolSearch("");
    router.push(matched.href);
  };

  return (
    <>
      {/* 1. Persistent Top Utility Header Bar (Emerald & White Theme) */}
      <header className="sticky top-0 z-40 h-16 w-full border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur transition-all">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left section: Hamburger Toggle + Brand logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 text-emerald-800 hover:bg-emerald-50/60 hover:text-emerald-900 transition-all focus:outline-none"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <Link href="/SuperAdmin" className="flex items-center gap-2 group">
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-700 text-white transition-all group-hover:scale-105 shadow-sm">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-[0.2em] text-zinc-900">
                Glow Haat <span className="text-emerald-700 font-extrabold">Console</span>
              </span>
            </Link>
          </div>

          {/* Middle section: Unified Tool Search */}
          <div className="relative mx-4 flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-emerald-700/60" />
            <input
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") openToolBySearch();
              }}
              placeholder="Search console directory..."
              className="h-10 w-full rounded-xl border border-emerald-100 bg-emerald-50/20 pl-9 pr-4 text-xs font-medium text-zinc-800 outline-none placeholder:text-emerald-700/40 transition focus:border-emerald-700 focus:bg-white"
            />
            {toolSearch.trim() ? (
              <div className="absolute left-0 right-0 top-11 z-50 max-h-64 overflow-y-auto rounded-xl border border-emerald-100 bg-white p-1 shadow-xl">
                {filteredTools.length ? (
                  filteredTools.slice(0, 10).map((entry) => (
                    <button
                      key={entry.href}
                      type="button"
                      onClick={() => {
                        setToolSearch("");
                        router.push(entry.href);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold tracking-wide text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 transition"
                    >
                      <span className="flex items-center gap-2 text-emerald-800">
                        {entry.icon}
                        <span className="text-zinc-700">{entry.label}</span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-750 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                        {entry.category}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-zinc-450 italic">No tools matching query.</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Right section: Profile Metadata & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 rounded-full border border-emerald-100 bg-emerald-50/40 p-1.5 pr-3.5">
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white uppercase shadow-sm">
                {user?.fullname ? user.fullname.charAt(0) : "A"}
              </div>
              <div className="text-left leading-none">
                <span className="block text-[10px] font-bold text-zinc-800 max-w-[100px] truncate">
                  {user?.fullname || "Operator"}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5 block">
                  SuperAdmin
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-150 bg-red-50/50 px-3.5 py-2 text-xs font-bold text-red-800 transition hover:bg-red-50 hover:text-red-950 focus:outline-none"
              title="Terminate Secure Session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Slide-out Sidenav Drawer (Emerald & White Theme) */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Soft Backdrop Overlay */}
        <div 
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-zinc-900/25 backdrop-blur-xs transition-opacity"
        />

        {/* The Sidenav Shell */}
        <aside 
          className={`absolute bottom-0 top-0 left-0 flex w-72 flex-col bg-white text-zinc-800 shadow-2xl transition-transform duration-300 ease-out border-r border-emerald-100 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidenav Header */}
          <div className="flex h-16 items-center justify-between border-b border-emerald-100 px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div className="text-left leading-none">
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-zinc-900">
                  Glow Haat
                </span>
                <span className="text-[9px] font-bold tracking-wider text-emerald-700 uppercase">
                  SuperAdmin Suite
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-100 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 transition"
              title="Collapse Menu"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Sidenav Grouped Navigation Area */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-emerald-100">
            
            {/* Group: Core Operations */}
            <div className="space-y-1">
              <span className="block px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700/60 mb-2">
                Operations
              </span>
              <SidenavLink 
                href="/SuperAdmin" 
                active={pathname === "/SuperAdmin"} 
                icon={<Layout className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Control Center
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminUsers" 
                active={pathname === "/SuperAdminUsers"} 
                icon={<Users className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                User Registry
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminOrders" 
                active={pathname === "/SuperAdminOrders"} 
                icon={<Truck className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Fulfillment Logs
              </SidenavLink>
            </div>

            {/* Group: Storefront Catalog */}
            <div className="space-y-1">
              <span className="block px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700/60 mb-2">
                Catalog & Design
              </span>
              <SidenavLink 
                href="/AdminItemManagments" 
                active={pathname === "/AdminItemManagments"} 
                icon={<Package className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Item Directory
              </SidenavLink>
              <SidenavLink 
                href="/AdminCategoryBuilder" 
                active={pathname === "/AdminCategoryBuilder"} 
                icon={<Layers className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Category Builder
              </SidenavLink>
              <SidenavLink 
                href="/AdminNavCoustomization" 
                active={pathname === "/AdminNavCoustomization"} 
                icon={<Layout className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Nav Customizer
              </SidenavLink>
              <SidenavLink 
                href="/AdminHomebanner" 
                active={pathname === "/AdminHomebanner"} 
                icon={<ImageIcon className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Promotional Banners
              </SidenavLink>
            </div>

            {/* Group: Merchants & Partners */}
            <div className="space-y-1">
              <span className="block px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700/60 mb-2">
                Merchant Operations
              </span>
              <SidenavLink 
                href="/SuperAdminSellerRequests" 
                active={pathname === "/SuperAdminSellerRequests"} 
                icon={<Store className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Seller Requests
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminSellerOperations" 
                active={pathname === "/SuperAdminSellerOperations"} 
                icon={<Store className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Seller Finance
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminShopManagement" 
                active={pathname === "/SuperAdminShopManagement"} 
                icon={<Store className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Shop + Badge Hub
              </SidenavLink>
            </div>

            {/* Group: Data Insights */}
            <div className="space-y-1">
              <span className="block px-3 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700/60 mb-2">
                Insights & Chat
              </span>
              <SidenavLink 
                href="/SuperAdminRecommendationInsights" 
                active={pathname === "/SuperAdminRecommendationInsights"} 
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Recommendation AI
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminShares" 
                active={pathname === "/SuperAdminShares"} 
                icon={<BarChart3 className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Viral Analytics
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminChatControl" 
                active={pathname === "/SuperAdminChatControl"} 
                icon={<MessageSquareQuote className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Chat Control
              </SidenavLink>
              <SidenavLink 
                href="/SuperAdminQna" 
                active={pathname === "/SuperAdminQna"} 
                icon={<MessageSquareQuote className="h-4 w-4" />}
                onClick={() => setIsOpen(false)}
              >
                Product Q&A Center
              </SidenavLink>
            </div>

          </nav>

          {/* Sidenav Footer operator details */}
          <div className="border-t border-emerald-100 bg-emerald-50/20 p-4">
            <div className="flex items-center gap-2 rounded-xl bg-white p-3 border border-emerald-100/60 shadow-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white uppercase shadow-sm">
                {user?.fullname ? user.fullname.charAt(0) : "A"}
              </div>
              <div className="text-left leading-none truncate flex-1">
                <span className="block text-[10px] font-bold text-zinc-800 truncate">
                  {user?.fullname || "Operator"}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5 block">
                  Active Session
                </span>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </>
  );
};

const SidenavLink = ({ href, active, icon, children, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${
      active
        ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-750 shadow-xs"
        : "text-zinc-655 hover:bg-emerald-50/40 hover:text-emerald-850"
    }`}
  >
    <span className={`${active ? "text-emerald-800" : "text-emerald-700/60"}`}>{icon}</span>
    <span className="truncate flex-1">{children}</span>
    <ChevronRight className={`h-3 w-3 transition-opacity ${active ? "opacity-40" : "opacity-0 group-hover:opacity-30"}`} />
  </Link>
);

export default SuperAdminNav;
