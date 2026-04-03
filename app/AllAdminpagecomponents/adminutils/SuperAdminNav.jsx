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
  Truck,
  Users,
} from "lucide-react";
import { serverurl } from "../../utils/constants/serverurl";
import { clearUserData } from "../../reduxcomponents/UserSlice";

const SuperAdminNav = () => {
  const router = useRouter();
  const dispatch = useDispatch();

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

  return (
    <div className="sticky top-0 z-40 border-b border-[#dce8e2] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
        <div className="flex items-center gap-2 text-[#1f5c49]">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em]">SuperAdmin</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <NavLink href="/SuperAdminUsers" icon={<Users className="h-4 w-4" />}>
            Users
          </NavLink>
          <NavLink href="/SuperAdminOrders" icon={<Truck className="h-4 w-4" />}>
            Orders
          </NavLink>
          <NavLink href="/SuperAdminQna" icon={<MessageSquareQuote className="h-4 w-4" />}>
            Product Q&A
          </NavLink>
          <NavLink href="/AdminItemManagments" icon={<Package className="h-4 w-4" />}>
            Item Management
          </NavLink>
          <NavLink href="/AdminHomebanner" icon={<ImageIcon className="h-4 w-4" />}>
            Home Banners
          </NavLink>
          <NavLink href="/AdminNavCoustomization" icon={<Layout className="h-4 w-4" />}>
            Nav Customization
          </NavLink>
          <NavLink href="/AdminCategoryBuilder" icon={<Layers className="h-4 w-4" />}>
            Category Builder
          </NavLink>
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
