"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { 
  Eye, EyeOff, Loader2, Lock, Mail, Server, Key, ChevronRight, 
  Sparkles, CheckCircle2, TrendingUp, Users, ShoppingBag
} from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { useActiveLogo } from "../hooks/useActiveLogo";
import { setUserData } from "../reduxcomponents/UserSlice";

const API_TIMEOUT_MS = 20000;

const SuperAdminSigninPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { userData, loading: userLoading } = useSelector((state) => state.user);
  const { logoUrl } = useActiveLogo();
  
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const currentUser = userData?.user || userData?.data || userData || null;
  const isSuperAdmin = String(currentUser?.role || "").toLowerCase() === "superadmin";

  // Redirect instantly if already logged in as superadmin
  useEffect(() => {
    if (!userLoading && isSuperAdmin) {
      router.replace("/SuperAdmin");
    }
  }, [isSuperAdmin, router, userLoading]);

  const sanitizedEmail = useMemo(
    () => credentials.email.trim().toLowerCase(),
    [credentials.email]
  );
  
  const sanitizedPassword = useMemo(
    () => credentials.password.trim(),
    [credentials.password]
  );

  if (!userLoading && isSuperAdmin) return null;

  const getApiError = (error, fallback) => {
    if (error?.code === "ECONNABORTED") {
      return "The connection timed out. Please check your network and retry.";
    }
    const message = error?.response?.data?.message;
    const detail = error?.response?.data?.detail;
    if (message && detail) return `${message}: ${detail}`;
    return message || error?.message || fallback;
  };

  const validateCredentials = () => {
    if (!sanitizedEmail) return "Administrative email is required.";
    if (!sanitizedPassword) return "Password is required.";
    return "";
  };

  const submitSignin = async (event) => {
    event.preventDefault();
    const validationError = validateCredentials();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/superadmin/signin`,
        { email: sanitizedEmail, password: sanitizedPassword },
        { withCredentials: true, timeout: API_TIMEOUT_MS }
      );

      if (!data?.success) {
        toast.error(data?.message || "Invalid administrative credentials.");
        return;
      }

      dispatch(setUserData(data.user));
      toast.success("Identity verified. Welcome back.");
      router.push("/SuperAdmin");
    } catch (error) {
      toast.error(getApiError(error, "Authentication failure."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans text-zinc-900 antialiased selection:bg-emerald-100 flex flex-col md:grid md:grid-cols-[1fr_1.1fr]">
      <Toaster position="top-right" />

      {/* Left Column: Premium Editorial Showcase (Emerald Theme - Human & Clean) */}
      <div className="relative hidden md:flex flex-col justify-between p-12 lg:p-16 bg-emerald-800 text-white overflow-hidden">
        
        {/* Soft, organic background blur spots */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-emerald-700/30 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/30 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center justify-center p-2.5 rounded-xl bg-white shadow-sm shrink-0">
            <img src={logoUrl} alt="Glow Haat Logo" className="h-9 w-auto object-contain max-w-[140px]" />
          </div>
          <div>
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-emerald-200/90 leading-none">
              Administrative Control
            </span>
            <span className="text-xs font-bold tracking-tight text-white mt-1 block">
              Glow Haat Hub
            </span>
          </div>
        </div>

        {/* Middle Column: Editorial Messaging & Organic Metrics */}
        <div className="relative z-10 my-auto max-w-md py-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[9px] font-bold uppercase tracking-wider text-emerald-100 mb-6 border border-white/5">
            <Sparkles className="h-3 w-3" /> Dedicated Operations Console
          </span>
          
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-[1.15] mb-4">
            Empowering Premium Beauty Commerce.
          </h2>
          <p className="text-sm text-emerald-100/80 leading-relaxed mb-10 font-medium">
            Manage your global cosmetics marketplace, verify seller requests, curate home banners, and coordinate customer orders from an intuitive, unified control panel.
          </p>

          {/* Minimalist Overview Badges (Less AI, More Organic Business Stats) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <Users className="h-5 w-5 text-emerald-200 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] font-bold text-emerald-250 uppercase tracking-wider">Merchant Network</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">Verified Hubs</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-start gap-3">
              <ShoppingBag className="h-5 w-5 text-emerald-200 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] font-bold text-emerald-250 uppercase tracking-wider">Curated Catalog</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">Active Items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright details */}
        <div className="relative z-10 text-[10px] text-emerald-200/60 flex items-center gap-4 font-bold uppercase tracking-wider">
          <span>Glow Haat © 2026</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Secure Verification
          </span>
        </div>

      </div>

      {/* Right Column: Secure Form Panel (Clean & Professional White Theme) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white">
        <div className="mx-auto w-full max-w-sm">
          
          {/* Logo container for mobile view */}
          <div className="md:hidden flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 shadow-2xs shrink-0">
              <img src={logoUrl} alt="Glow Haat Logo" className="h-8 w-auto object-contain max-w-[120px]" />
            </div>
            <div>
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-emerald-800 leading-none">
                Admin Console
              </span>
              <span className="text-sm font-black tracking-tight text-zinc-900 mt-0.5 block">
                Glow Haat Control Panel
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-emerald-805 mb-1.5">
              <Key className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Identity Verification</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              Please sign in with your administrative account to access the control panel.
            </p>
          </div>

          {/* Secure Form */}
          <form onSubmit={submitSignin} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">
                SuperAdmin Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors" />
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="superadmin@glowhaat.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-3 text-xs font-semibold text-zinc-805 placeholder:text-zinc-400 outline-none transition focus:border-emerald-650 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 py-3 text-xs font-semibold text-zinc-805 placeholder:text-zinc-400 outline-none transition focus:border-emerald-650 focus:ring-2 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-800 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-750 disabled:opacity-50 shadow-sm shadow-emerald-950/20 active:translate-y-[1px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  Confirm Identity & Log In
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Navigation to User & Merchant Sign-In */}
            <div className="pt-4 text-center border-t border-zinc-100 mt-4">
              <span className="text-[11px] font-semibold text-zinc-400">Not an administrator? </span>
              <Link
                href="/signin"
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-700 underline underline-offset-4 transition-colors"
              >
                Go to Merchant & Customer Portal
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminSigninPage;
