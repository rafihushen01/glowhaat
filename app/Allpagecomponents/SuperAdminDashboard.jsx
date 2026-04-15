 "use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Package, Image as ImageIcon, Layout, Layers, Truck, BarChart3, Sparkles, Store } from "lucide-react";
import { Users } from "lucide-react";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";
import KhanNotificationInbox from "./KhanNotificationInbox";

const SuperAdminDashboard = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-[#1f5c49]">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <SuperAdminNav />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-[#dce8e2] bg-[#f5fbf8] p-6">
          <div className="flex items-center gap-3 text-[#1f5c49]">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">SuperAdmin Control Center</h1>
          </div>
          <p className="mt-2 text-sm text-[#4b6b61]">
            Full access to KhanCosmetics admin operations, products, banners, and navigation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            href="/AdminItemManagments"
            title="Item Management"
            description="Manage all products, pricing, and inventory."
            icon={<Package className="h-5 w-5" />}
          />
          <DashboardCard
            href="/AdminHomebanner"
            title="Home Banners"
            description="Update hero banners and promotions."
            icon={<ImageIcon className="h-5 w-5" />}
          />
          <DashboardCard
            href="/AdminNavCoustomization"
            title="Navigation Builder"
            description="Edit mega menu, nav images, and categories."
            icon={<Layout className="h-5 w-5" />}
          />
          <DashboardCard
            href="/AdminCategoryBuilder"
            title="Category Builder"
            description="Organize full category structure."
            icon={<Layers className="h-5 w-5" />}
          />
          <DashboardCard
            href="/SuperAdminUsers"
            title="Users"
            description="Search, filter, edit, and remove users."
            icon={<Users className="h-5 w-5" />}
          />
          <DashboardCard
            href="/SuperAdminOrders"
            title="Orders"
            description="Track all customer orders and update status."
            icon={<Truck className="h-5 w-5" />}
          />
          <DashboardCard
            href="/SuperAdminShares"
            title="Share Analytics"
            description="See most-shared products, top platforms, and top sharers."
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <DashboardCard
            href="/SuperAdminRecommendationInsights"
            title="Recommendation AI"
            description="Monitor behavior signals, affinity patterns, and recommendation opportunity."
            icon={<Sparkles className="h-5 w-5" />}
          />
          <DashboardCard
            href="/SuperAdminSellerRequests"
            title="Seller Requests"
            description="Verify seller credentials, approve partnerships, or reject with reason."
            icon={<Store className="h-5 w-5" />}
          />
          <DashboardCard
            href="/SuperAdminSellerOperations"
            title="Seller Operations"
            description="Control sponsorship, commission, shop health/freeze, and subscriptions."
            icon={<Store className="h-5 w-5" />}
          />
        </div>
        <div className="mt-8">
          <KhanNotificationInbox role="SuperAdmin" />
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ href, title, description, icon }) => (
  <Link
    href={href}
    className="group rounded-2xl border border-[#dce8e2] bg-white p-5 shadow-sm transition hover:border-[#1f5c49] hover:shadow-md"
  >
    <div className="flex items-center gap-3 text-[#1f5c49]">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    <p className="mt-2 text-sm text-[#5a746b]">{description}</p>
  </Link>
);

export default SuperAdminDashboard
