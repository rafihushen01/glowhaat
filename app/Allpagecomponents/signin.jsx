"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { BadgeCheck, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, Key } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { serverurl } from "../utils/constants/serverurl";
import { useActiveLogo } from "../hooks/useActiveLogo";
import { setUserData } from "../reduxcomponents/UserSlice";

const panelMotion = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-805 outline-none transition placeholder:text-zinc-400 focus:border-emerald-650 focus:ring-2 focus:ring-emerald-500/10";

const Signin = () => {
  const t = useTranslations("SigninPage");
  const router = useRouter();
  const dispatch = useDispatch();
  const { logoUrl } = useActiveLogo();
  const { userData } = useSelector((state) => state.user);

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  useEffect(() => {
    if (userData) {
      router.replace("/");
    }
  }, [userData, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  const getApiError = (error, fallback) => error?.response?.data?.message || fallback;

  const validateCredentials = () => {
    const email = credentials.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t("errors.invalidEmail");
    }
    if (!credentials.password || credentials.password.length < 6) {
      return t("errors.shortPassword");
    }
    return "";
  };

  const imageUrl = "/doc-1.jpg";

  const handleSignin = async (event) => {
    event.preventDefault();
    const validationError = validateCredentials();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/signin`,
        {
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (data?.otpRequired) {
        setOtpEmail(data.email || credentials.email.trim().toLowerCase());
        setOtpSent(true);
        toast.success(data?.message || "Verification code sent.");
        return;
      }

      if (!data?.success) {
        toast.error(data?.message || t("errors.signinRequest"));
        return;
      }

      let authuser = data?.user || null;
      if (!authuser) {
        const meRes = await axios.get(`${serverurl}/auth/me`, {
          withCredentials: true,
          timeout: 30000,
        });
        authuser = meRes?.data?.user || null;
      }

      if (authuser) dispatch(setUserData(authuser));

      toast.success(data?.message || t("success.signin"));
      setTimeout(() => {
        if (authuser?.role === "SuperAdmin") router.push("/SuperAdmin");
        else if (authuser?.role === "Seller") router.push("/seller-dashboard");
        else router.push("/");
      }, 750);
    } catch (error) {
      toast.error(getApiError(error, t("errors.signinRequest")));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/verifysigninotp`,
        {
          email: otpEmail,
          otp: otp.trim(),
        },
        { withCredentials: true, timeout: 30000 }
      );

      if (!data?.success) {
        toast.error(data?.message || "Invalid verification code.");
        return;
      }

      if (data?.user) dispatch(setUserData(data.user));

      toast.success(data?.message || "Identity verified successfully.");
      setTimeout(() => {
        if (data?.user?.role === "SuperAdmin") router.push("/SuperAdmin");
        else if (data?.user?.role === "Seller") router.push("/seller-dashboard");
        else router.push("/");
      }, 750);
    } catch (error) {
      toast.error(getApiError(error, "Verification failed. Please retry."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "790149938468-legacy.apps.googleusercontent.com";
    if (typeof window !== "undefined" && window.google) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile",
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              setGoogleLoading(true);
              const { data } = await axios.post(
                `${serverurl}/auth/google/signin`,
                {
                  accessToken: tokenResponse.access_token,
                },
                { withCredentials: true, timeout: 15000 }
              );

              if (data?.otpRequired) {
                setOtpEmail(data.email);
                setOtpSent(true);
                toast.success(data?.message || "Verification code sent to your Google email.");
                return;
              }

              if (!data?.success) {
                toast.error(data?.message || t("errors.googleSignin"));
                return;
              }

              if (data?.user) dispatch(setUserData(data.user));

              toast.success(data?.message || t("success.googleSignin"));
              setTimeout(() => {
                if (data?.user?.role === "SuperAdmin") router.push("/SuperAdmin");
                else if (data?.user?.role === "Seller") router.push("/seller-dashboard");
                else router.push("/");
              }, 700);
            } catch (error) {
              toast.error(getApiError(error, t("errors.googleSignin")));
            } finally {
              setGoogleLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } else {
      toast.error("Google Authentication is loading. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-zinc-50/50"
      style={{ fontFamily: "\"Manrope\", \"Segoe UI\", sans-serif" }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#18181b",
            border: "1px solid #e4e4e7",
            fontWeight: "600",
            fontSize: "13px"
          },
        }}
      />

      <main className="relative overflow-hidden px-4 pb-16 pt-28 md:px-8">
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute -left-20 top-16 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12 }}
          className="pointer-events-none absolute -right-16 bottom-0 h-88 w-88 rounded-full bg-emerald-50/30 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr] gap-0 rounded-3xl overflow-hidden shadow-xl border border-zinc-150">
          
          {/* Brand Left Section */}
          <motion.section
            variants={panelMotion}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden bg-emerald-800 text-white min-h-[400px] flex flex-col justify-between p-12"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#047857_1px,transparent_1px),linear-gradient(to_bottom,#047857_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center justify-center p-2.5 rounded-xl bg-white shadow-sm shrink-0">
                <img src={logoUrl} className="h-8 w-auto object-contain max-w-[145px]" alt="Glow Haat Logo" />
              </div>
              <div>
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-emerald-250 leading-none">
                  Operations Console
                </span>
                <span className="text-xs font-bold tracking-tight text-white mt-1 block">
                  Glow Haat Portal
                </span>
              </div>
            </div>

            <div className="relative z-10 my-auto py-10 max-w-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[9px] font-bold uppercase tracking-wider text-emerald-100 mb-6 border border-white/5">
                <Sparkles className="h-3 w-3" /> Secure Verification
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white mb-4">
                Curating premium beauty marketplaces.
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed font-medium">
                Log in to synchronize your storefront collections, fulfill beauty care product requests, and coordinate logistics in one professional workspace.
              </p>
            </div>

            <div className="relative z-10 text-[9px] text-emerald-200/50 uppercase tracking-widest font-bold">
              Glow Haat © 2026
            </div>
          </motion.section>

          {/* Form Right Section */}
          <motion.section
            variants={panelMotion}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="bg-white p-8 md:p-12 flex flex-col justify-center border-l border-zinc-100"
          >
            {otpSent ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5 max-w-sm mx-auto w-full">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 border border-emerald-100">
                    <BadgeCheck className="h-3.5 w-3.5" /> Identity Challenge
                  </span>
                  <h2 className="text-xl font-black text-zinc-900 mt-3">Enter Verification Code</h2>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    We have dispatched a 6-digit security code to <span className="font-bold text-zinc-800">{otpEmail}</span>. Enter it below to authorize this session.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">
                    6-Digit Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full text-center text-lg tracking-[0.4em] font-extrabold rounded-xl border border-zinc-200 bg-white px-3 py-3 text-zinc-805 placeholder:text-zinc-300 outline-none transition focus:border-emerald-650 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-750 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs font-bold text-zinc-400 hover:text-zinc-700 transition mt-2 underline underline-offset-4"
                >
                  Go Back to Credentials
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignin} className="space-y-5 max-w-sm mx-auto w-full">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 mb-1.5">
                    <Key className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Portal Entrance</span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                    Welcome back
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    Provide your credentials below to establish control session.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">
                      {t("fields.email")}
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={credentials.email}
                        onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder={t("placeholders.email")}
                        autoComplete="email"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">
                      {t("fields.password")}
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder={t("placeholders.password")}
                        autoComplete="current-password"
                        className={`${inputClass} pl-10 pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
                        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-750 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </motion.button>

                <div className="flex items-center gap-3 py-1 text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                  <span className="h-px flex-1 bg-zinc-100" />
                  Or continue with
                  <span className="h-px flex-1 bg-zinc-100" />
                </div>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={handleGoogleSignin}
                  disabled={googleLoading || loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  ) : (
                    <>
                      <FcGoogle className="h-4.5 w-4.5" />
                      Sign In with Google
                    </>
                  )}
                </motion.button>

                <p className="pt-2 text-center text-xs font-bold text-zinc-500">
                  {t("newToBrand")}{" "}
                  <Link href="/signup" className="text-emerald-800 hover:text-emerald-700 underline underline-offset-4">
                    {t("createAccount")}
                  </Link>
                </p>
              </form>
            )}
          </motion.section>

        </div>
      </main>
    </div>
  );
};

export default Signin;
