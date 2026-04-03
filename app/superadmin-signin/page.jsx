"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import khancosmeticslogo from "../../public/khancosmeticslogo.png";
import { setUserData } from "../reduxcomponents/UserSlice";

const inputClass =
  "w-full rounded-xl border border-[#d5e3dc] bg-[#fbfdfc] px-3 py-2.5 text-sm text-[#17372b] outline-none transition placeholder:text-[#789486] focus:border-[#1f5c49] focus:ring-2 focus:ring-[#9ec7b4]/40";

const SuperAdminSigninPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [step, setStep] = useState("credentials");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const sanitizedEmail = useMemo(
    () => credentials.email.trim().toLowerCase(),
    [credentials.email]
  );

  const getApiError = (error, fallback) => error?.response?.data?.message || fallback;

  const validateCredentials = () => {
    if (!sanitizedEmail) return "Email is required.";
    if (!credentials.password) return "Password is required.";
    return "";
  };

  const requestOtp = async (event) => {
    event.preventDefault();
    const validationError = validateCredentials();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/superadmin/signinotp`,
        { email: sanitizedEmail, password: credentials.password },
        { withCredentials: true, timeout: 12000 }
      );

      if (!data?.success) {
        toast.error(data?.message || "Could not send OTP.");
        return;
      }

      toast.success("OTP sent to SuperAdmin email.");
      setStep("verify");
      setOtp("");
      setOtpCountdown(60);
    } catch (error) {
      toast.error(getApiError(error, "OTP request failed."));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("Enter your 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/superadmin/verifyotp`,
        { email: sanitizedEmail, otp: otp.trim() },
        { withCredentials: true, timeout: 12000 }
      );

      if (!data?.success) {
        toast.error(data?.message || "OTP verification failed.");
        return;
      }

      dispatch(setUserData(data.user));
      toast.success("SuperAdmin verified.");
      router.push("/SuperAdmin");
    } catch (error) {
      toast.error(getApiError(error, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />

      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-3xl border border-[#d6e3dc] bg-white p-8 shadow-[0_20px_60px_rgba(36,74,63,0.12)]">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl border border-[#ead8c0] bg-white/80 p-3 shadow-sm">
              <Image src={khancosmeticslogo} alt="KhanCosmetics" width={120} height={36} priority />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#56796a]">SuperAdmin Access</p>
              <h1 className="text-2xl text-[#0f2f24]">Secure OTP Login</h1>
            </div>
          </div>

          {step === "credentials" ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4d6d60]">
                SuperAdmin Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789486]" />
                <input
                  type="email"
                  className={`${inputClass} pl-9`}
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="superadmin@khancosmetics.com"
                />
              </div>

              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4d6d60]">
                SuperAdmin Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789486]" />
                <input
                  type="password"
                  className={`${inputClass} pl-9`}
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter superadmin password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5c49] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send OTP <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="rounded-xl border border-[#d8e8e0] bg-[#f4faf7] p-3 text-sm text-[#2f5648]">
                OTP sent to <span className="font-semibold">{sanitizedEmail}</span>
              </div>

              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4d6d60]">
                One-Time Password
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789486]" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`${inputClass} pl-9 text-center tracking-[0.3em]`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5c49] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminSigninPage;

