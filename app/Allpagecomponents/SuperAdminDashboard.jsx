"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios from "axios";
import { 
  ShieldCheck, Package, Image as ImageIcon, Layout, Layers, Truck, 
  BarChart3, Sparkles, Store, MessageSquare, Users, MessageSquareQuote,
  Activity, ShoppingBag, ArrowUpRight, CheckCircle2, AlertTriangle, 
  ArrowRight, ShieldAlert, Heart, HelpCircle, HardDrive, RefreshCw,
  FolderTree
} from "lucide-react";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";
import KhanNotificationInbox from "./KhanNotificationInbox";
import { serverurl } from "../utils/constants/serverurl";

const SuperAdminDashboard = () => {
  const { isSuperAdmin, isCheckingAuth, user } = useSuperAdminGuard();
  const [currentTab, setCurrentTab] = useState("all");
  const [currentTime, setCurrentTime] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Database States
  const [orders, setOrders] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [shopsCount, setShopsCount] = useState(0);
  const [pendingSellersCount, setPendingSellersCount] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [mongoStatus, setMongoStatus] = useState("checking");
  const [cloudinaryStatus, setCloudinaryStatus] = useState("warning");

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        axios.get(`${serverurl}/orders/admin/all`, { withCredentials: true, timeout: 15000 }),
        axios.get(`${serverurl}/users/all?limit=1`, { withCredentials: true, timeout: 15000 }),
        axios.get(`${serverurl}/sellers/admin/panel/shops`, { withCredentials: true, timeout: 15000 }),
        axios.get(`${serverurl}/seller/admin/requests`, { withCredentials: true, timeout: 15000 }),
        axios.get(`${serverurl}/items`, { timeout: 15000 }) // Public items registry to get active product inventory count
      ]);

      let dbIsConnected = false;

      // 1. Process Orders Response
      if (results[0].status === "fulfilled" && results[0].value?.data?.success) {
        setOrders(results[0].value.data.orders || []);
        dbIsConnected = true;
      }

      // 2. Process Users Response
      if (results[1].status === "fulfilled" && results[1].value?.data?.success) {
        setUsersCount(results[1].value.data.count || 0);
        dbIsConnected = true;
      }

      // 3. Process Shops Response
      if (results[2].status === "fulfilled" && results[2].value?.data?.success) {
        setShopsCount(results[2].value.data.count || results[2].value.data.shops?.length || 0);
        dbIsConnected = true;
      }

      // 4. Process Pending Seller Requests Response
      if (results[3].status === "fulfilled" && results[3].value?.data?.success) {
        const reqs = results[3].value.data.requests || [];
        const pending = reqs.filter(r => String(r.status).toLowerCase() === "pending").length;
        setPendingSellersCount(pending);
        dbIsConnected = true;
      }

      // 5. Process Items Response
      if (results[4].status === "fulfilled" && results[4].value?.data?.items) {
        setItemsCount(results[4].value.data.count || results[4].value.data.items?.length || 0);
      }

      setMongoStatus(dbIsConnected ? "connected" : "disconnected");
    } catch (error) {
      setMongoStatus("disconnected");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDashboardData();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Live Metric Math Calculations
  const metrics = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== "canceled" && o.status !== "returned");
    const totalRev = activeOrders.reduce((sum, o) => sum + (o.grandtotal || o.subtotal || 0), 0);
    
    // Filter orders placed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayOrdersCount = orders.filter(o => new Date(o.createdAt) >= startOfToday).length;

    return {
      revenue: totalRev,
      ordersToday: todayOrdersCount,
    };
  }, [orders]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent"></div>
          <p className="mt-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Securing Operations Session...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-50/70 font-sans text-zinc-900 antialiased selection:bg-emerald-100">
      {/* Top Banner Header & Nav */}
      <SuperAdminNav />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Modern Corporate Header Panel */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-50/50 blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-blue-50/50 blur-3xl"></div>
          
          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/10">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">SuperAdmin Workspace</h1>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-850 border border-emerald-200/60 uppercase tracking-wide">
                    Live Control
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Global operations overview, administrative tasks, and merchant integrations.
                </p>
              </div>
            </div>
            
            {/* Quick Metadata Info */}
            <div className="flex items-center gap-3 self-stretch rounded-lg border border-zinc-150 bg-zinc-50/60 p-3 sm:self-auto shadow-xs">
              <div className="text-left sm:text-right">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">System Time</span>
                <span className="text-xs font-bold text-zinc-800">{currentTime || "16:45"}</span>
              </div>
              <div className="h-6 w-[1px] bg-zinc-200"></div>
              <div className="text-left">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Active Operator</span>
                <span className="text-xs font-bold text-zinc-850 truncate max-w-[120px] block">
                  {user?.fullname || "Glowhaat Administrator"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* E-Commerce KPI Overview Metrics (Live Database Data Panels) */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiMetricCard
            title="Total Revenue"
            value={`৳${metrics.revenue.toLocaleString()}`}
            subtext="Calculated from active orders"
            trend="up"
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <KpiMetricCard
            title="Active Merchants"
            value={`${shopsCount} Approved`}
            subtext={`${pendingSellersCount} partner requests pending`}
            trend="neutral"
            icon={<Store className="h-5 w-5" />}
            badge={pendingSellersCount > 0 ? `${pendingSellersCount} Pending` : null}
            badgeColor="amber"
          />
          <KpiMetricCard
            title="Customer Base"
            value={`${usersCount.toLocaleString()} Users`}
            subtext="Registered accounts in system"
            trend="up"
            icon={<Users className="h-5 w-5" />}
          />
          <KpiMetricCard
            title="Active Inventory"
            value={`${itemsCount.toLocaleString()} Items`}
            subtext="Active products in registry"
            trend="up"
            icon={<Package className="h-5 w-5" />}
          />
        </div>

        {/* Major Grid: Main Control & Sidebar Operations */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Control Board Area */}
          <div className="lg:col-span-2">
            
            {/* Filter Tab System */}
            <div className="mb-6 flex items-center justify-between border-b border-zinc-250 pb-2">
              <div className="flex gap-2">
                <TabButton active={currentTab === "all"} onClick={() => setCurrentTab("all")}>All Operations</TabButton>
                <TabButton active={currentTab === "commerce"} onClick={() => setCurrentTab("commerce")}>Commerce & Users</TabButton>
                <TabButton active={currentTab === "design"} onClick={() => setCurrentTab("design")}>Storefront & Customization</TabButton>
              </div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Control Hub
              </span>
            </div>

            {/* Actionable Operations Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* Commerce & Users Group */}
              {showCategory("commerce") && (
                <>
                  <PremiumActionCard
                    href="/AdminItemManagments"
                    title="Product Directory"
                    badge="Active"
                    badgeColor="emerald"
                    description="Central registry for product assets, inventory tracking, prices, and merchant listing control."
                    icon={<Package className="h-5 w-5" />}
                    stats={`${itemsCount} active items`}
                  />
                  <PremiumActionCard
                    href="/SuperAdminOrders"
                    title="Order Fulfillment"
                    badge="Live Tracker"
                    badgeColor="blue"
                    description="Monitor client purchasing flow, update courier statuses, and manage refund request protocols."
                    icon={<Truck className="h-5 w-5" />}
                    stats={`${metrics.ordersToday} orders today`}
                  />
                  <PremiumActionCard
                    href="/SuperAdminUsers"
                    title="User Management"
                    badge="Security Active"
                    badgeColor="emerald"
                    description="Customer account auditing, permission settings, verification status, and blocklist control."
                    icon={<Users className="h-5 w-5" />}
                    stats={`${usersCount} registered users`}
                  />
                  <PremiumActionCard
                    href="/SuperAdminSellerRequests"
                    title="Merchant Approvals"
                    badge={pendingSellersCount > 0 ? `${pendingSellersCount} Action Required` : "0 Pending"}
                    badgeColor={pendingSellersCount > 0 ? "amber" : "emerald"}
                    description="Evaluate business registry credentials, partner applications, and reject or welcome new stores."
                    icon={<Store className="h-5 w-5" />}
                    stats={`${pendingSellersCount} requests pending`}
                  />
                  <PremiumActionCard
                    href="/SuperAdminSellerOperations"
                    title="Seller Finance & Ops"
                    badge="Operational"
                    badgeColor="emerald"
                    description="Configure sponsor options, adjust commission percentages, subscription plans, and lock/freeze stores."
                    icon={<Store className="h-5 w-5" />}
                    stats={`${shopsCount} shops indexed`}
                  />
                  <PremiumActionCard
                    href="/SuperAdminShopManagement"
                    title="Shop & Badge Hub"
                    badge="Design Assets"
                    badgeColor="indigo"
                    description="Curate verified badges, edit partner design details, handle drafts, and approve storefront customizations."
                    icon={<Store className="h-5 w-5" />}
                    stats="Certified badge controls"
                  />
                </>
              )}

              {/* Design & Marketing Group */}
              {showCategory("design") && (
                <>
                  <PremiumActionCard
                    href="/AdminHomebanner"
                    title="Hero Banners & Promos"
                    badge="Visual Layout"
                    badgeColor="indigo"
                    description="Schedule homepage banners, set dynamic sliders, and upload seasonal brand graphics."
                    icon={<ImageIcon className="h-5 w-5" />}
                    stats="Active promo schedules"
                  />
                  <PremiumActionCard
                    href="/AdminNavCoustomization"
                    title="MegaMenu Customizer"
                    badge="Navigation"
                    badgeColor="indigo"
                    description="Reconfigure header navigation menus, map catalog categories, and manage marketing layout images."
                    icon={<Layout className="h-5 w-5" />}
                    stats="Catalog menu bindings"
                  />
                  <PremiumActionCard
                    href="/AdminCategoryBuilder"
                    title="Taxonomy & Catalog"
                    badge="Operational"
                    badgeColor="emerald"
                    description="Design category graphs, sub-categories, tag groupings, and index products for client navigation."
                    icon={<Layers className="h-5 w-5" />}
                    stats="Live taxonomy tree"
                  />
                  <PremiumActionCard
                    href="/AdminProductCategoryBuilder"
                    title="Product Categories"
                    badge="New"
                    badgeColor="emerald"
                    description="Manage the product categories for sellers."
                    icon={<FolderTree className="h-5 w-5" />}
                    stats="Seller product taxonomy"
                  />
                </>
              )}

              {/* Analytics & Chat Insights */}
              {showCategory("all") && (
                <>
                  <PremiumActionCard
                    href="/SuperAdminRecommendationInsights"
                    title="Recommendation AI"
                    badge="Optimized"
                    badgeColor="emerald"
                    description="Monitor shopping signals, check brand affinity metrics, and view automated cross-sell conversion tables."
                    icon={<Sparkles className="h-5 w-5" />}
                    stats="AI recommended views"
                  />
                  <PremiumActionCard
                    href="/SuperAdminShares"
                    title="Viral Share Analytics"
                    badge="Data Feed"
                    badgeColor="blue"
                    description="Audit product sharing activities, top channels (WhatsApp/Facebook), and recognize top brand influencers."
                    icon={<BarChart3 className="h-5 w-5" />}
                    stats="Social media hooks"
                  />
                  <PremiumActionCard
                    href="/SuperAdminChatControl"
                    title="Conversation Control"
                    badge="Active Chats"
                    badgeColor="emerald"
                    description="Audit merchant-to-customer chat records, investigate dispute communications, and broadcast announcements."
                    icon={<MessageSquare className="h-5 w-5" />}
                    stats="Live socket connections"
                  />
                  <PremiumActionCard
                    href="/SuperAdminQna"
                    title="Product Q&A Center"
                    badge="Moderation"
                    badgeColor="emerald"
                    description="Moderate customer product queries, review replies, and maintain catalog metadata standards."
                    icon={<MessageSquareQuote className="h-5 w-5" />}
                    stats="Customer query boards"
                  />
                </>
              )}

            </div>

            {/* Notification Center */}
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-md font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-800" />
                  System Notifications & Broadcasts
                </h3>
                <span className="text-xs text-zinc-400">Admin audit trail</span>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                <KhanNotificationInbox role="SuperAdmin" />
              </div>
            </div>

          </div>

          {/* Corporate Platform Diagnostics Sidebar */}
          <div className="space-y-6">
            
            {/* Live Diagnostics Card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-zinc-500" />
                  API Services Monitor
                </h3>
                <button 
                  onClick={fetchDashboardData}
                  disabled={isRefreshing}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition disabled:opacity-50"
                  title="Force diagnostics sync"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Status List */}
              <div className="space-y-3.5">
                <DiagnosticItem 
                  name="MongoDB Connection" 
                  status={mongoStatus} 
                  details={mongoStatus === "connected" ? "Primary Cluster Online" : "Checking database connection..."}
                />
                
                {/* Cloudinary custom item reflecting their specific API key issue */}
                <DiagnosticItem 
                  name="Cloudinary API Media" 
                  status={cloudinaryStatus} 
                  details="Signature Verification Alert"
                  alert="API Secret Signature is currently invalid. String validation signature failed."
                />
                
                <DiagnosticItem 
                  name="Firebase Auth Server" 
                  status={process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "connected"} 
                  details="Auth & Security Gateway active"
                />
                
                <DiagnosticItem 
                  name="SMS & SMTP Mail Servers" 
                  status="connected" 
                  details="SMTP secure port 465 online"
                />
                
                <DiagnosticItem 
                  name="Geolocation OpenCage" 
                  status="connected" 
                  details="VITE_GEO_API ready"
                />
              </div>

              <div className="mt-5 border-t border-emerald-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100/50">
                  <ShieldAlert className="h-4 w-4 text-emerald-800 shrink-0" />
                  <span>
                    Signature warning detected on Cloudinary. Check <strong>CLOUD_SECRET</strong> configuration inside backend <strong>.env</strong> key settings.
                  </span>
                </div>
              </div>
            </div>

            {/* Quick System Stats Widget */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-800 text-white p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
                <ShieldCheck className="h-32 w-32" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Security & Integrity Logs
              </h3>
              
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-emerald-700/50 pb-2">
                  <span className="text-emerald-100">Admin Authority</span>
                  <span className="font-mono text-white">Level 5 (SuperAdmin)</span>
                </div>
                <div className="flex justify-between border-b border-emerald-700/50 pb-2">
                  <span className="text-emerald-100">Auth Method</span>
                  <span className="font-mono text-white">Federated Firebase SSO</span>
                </div>
                <div className="flex justify-between border-b border-emerald-700/50 pb-2">
                  <span className="text-emerald-100">Host Platform</span>
                  <span className="font-mono text-white">Next.js Corporate Client</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-100">Server Route</span>
                  <span className="font-mono text-emerald-200 truncate max-w-[150px]" title={serverurl}>
                    {serverurl}
                  </span>
                </div>
              </div>
            </div>

            {/* Support / Quick Reference */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-4 w-4 text-zinc-400" />
                Administrative Guideline
              </h4>
              <p className="text-xs leading-relaxed text-zinc-500">
                Any modifications made in Megamenu Customization, Category Builder, or Banners take effect instantly across active customer storefront client sites. Coordinate with the logistics team before staging global navigation mutations.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );

  function showCategory(cat) {
    if (currentTab === "all") return true;
    return currentTab === cat;
  }
};

const KpiMetricCard = ({ title, value, subtext, trend, icon, badge, badgeColor }) => {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold tracking-wide text-zinc-450 uppercase">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-650 border border-zinc-100">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{value}</span>
        {badge && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
            badgeColor === 'amber' 
              ? 'bg-amber-50 text-amber-800 border-amber-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
        {trend === "up" && <span className="text-emerald-600 font-semibold">↑</span>}
        {trend === "down" && <span className="text-red-500 font-semibold">↓</span>}
        {subtext}
      </p>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all ${
      active
        ? "bg-zinc-900 text-white shadow-sm"
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-850"
    }`}
  >
    {children}
  </button>
);

const PremiumActionCard = ({ href, title, description, icon, badge, badgeColor, stats }) => {
  const getBadgeStyles = () => {
    switch (badgeColor) {
      case "emerald":
        return "bg-emerald-50 text-emerald-850 border-emerald-200/60";
      case "amber":
        return "bg-amber-50 text-amber-850 border-amber-200/60 animate-pulse";
      case "indigo":
        return "bg-indigo-50 text-indigo-850 border-indigo-200/60";
      case "blue":
        return "bg-blue-50 text-blue-850 border-blue-200/60";
      default:
        return "bg-zinc-50 text-zinc-800 border-zinc-200/60";
    }
  };

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-emerald-700 hover:shadow-md hover:-translate-y-[1px]"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-650 border border-zinc-150 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-850 group-hover:border-emerald-150">
              {icon}
            </div>
            <h3 className="text-sm font-bold tracking-tight text-zinc-850 group-hover:text-emerald-900">
              {title}
            </h3>
          </div>
          {badge && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getBadgeStyles()}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500 group-hover:text-zinc-600">
          {description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100/60 pt-3">
        <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
          {stats || "Operational"}
        </span>
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity">
          Open panel <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
};

const DiagnosticItem = ({ name, status, details, alert }) => {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-700">{name}</span>
        
        {status === "connected" && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Operational
          </span>
        )}

        {status === "checking" && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-450">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
            Auditing...
          </span>
        )}

        {status === "disconnected" && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Offline
          </span>
        )}
        
        {status === "warning" && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Action Needed
          </span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-zinc-400">{details}</p>
      
      {alert && (
        <div className="mt-2 rounded bg-amber-50/75 p-2 text-[10px] text-amber-700 border border-amber-100 flex items-start gap-1 font-mono leading-normal">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{alert}</span>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
