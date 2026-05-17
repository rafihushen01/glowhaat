"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  VenusAndMars,
  Key,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { serverurl } from "../utils/constants/serverurl";
import { useActiveLogo } from "../hooks/useActiveLogo";
import { setUserData } from "../reduxcomponents/UserSlice";

const panelMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const initialForm = {
  fullname: "",
  email: "",
  password: "",
  mobile: "",
  gender: "",
  role: "User",
};

const imageUrl = "/doc-1.jpg";

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2)
    return { label: "Needs work", width: "35%", color: "bg-rose-500" };
  if (score <= 3) return { label: "Good", width: "65%", color: "bg-amber-500" };
  return { label: "Strong", width: "100%", color: "bg-emerald-500" };
};

const normalizeMobile = (value) => value.replace(/[^\d+]/g, "").slice(0, 15);

const fieldInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-850 outline-none transition placeholder:text-zinc-400 focus:border-emerald-650 focus:ring-2 focus:ring-emerald-500/10";

const Signup = () => {
  const t = useTranslations("SignupPage");
  const router = useRouter();
  const dispatch = useDispatch();
  const { logoUrl } = useActiveLogo();
  const { userData } = useSelector((state) => state.user);

  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (userData) router.replace("/");
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

  const buildSignupPayload = () => {
    const payload = {
      fullname: formData.fullname.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      mobile: formData.mobile.trim(),
      gender: formData.gender,
      role: "User",
    };
    if (!payload.mobile) delete payload.mobile;
    return payload;
  };

  const getApiError = (error, fallbackMessage) =>
    error?.response?.data?.message || fallbackMessage;

  const validateSignupFields = () => {
    const name = formData.fullname.trim();
    const email = formData.email.trim().toLowerCase();
    const mobile = formData.mobile.trim();

    if (!name || name.length < 3) return t("errors.nameMin");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return t("errors.invalidEmail");
    if (
      formData.password.length < 8 ||
      !/[A-Za-z]/.test(formData.password) ||
      !/\d/.test(formData.password)
    ) {
      return t("errors.passwordRules");
    }
    if (mobile && !/^\+?\d{8,15}$/.test(mobile)) return t("errors.mobileRange");
    if (!["Male", "Female", "Other"].includes(formData.gender))
      return t("errors.chooseGender");
    if (!agreedToPolicy) return t("errors.acceptPolicy");
    return "";
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    const errorMessage = validateSignupFields();
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    setLoading(true);
    try {
      const payload = buildSignupPayload();
      const { data } = await axios.post(`${serverurl}/auth/signup`, payload, {
        withCredentials: true,
      });

      if (data?.otpRequired) {
        setOtpEmail(data.email || formData.email.trim().toLowerCase());
        setOtpSent(true);
        toast.success(data?.message || "Verification code dispatched.");
        return;
      }

      if (!data?.success) {
        toast.error(data?.message || t("errors.signupService"));
        return;
      }

      let authuser = data?.user || null;
      if (!authuser) {
        const meRes = await axios.get(`${serverurl}/auth/me`, {
          withCredentials: true,
          timeout: 12000,
        });
        authuser = meRes?.data?.user || null;
      }

      if (authuser) dispatch(setUserData(authuser));

      toast.success(data?.message || t("success.accountCreated"));
      setTimeout(() => router.push("/"), 900);
    } catch (error) {
      toast.error(getApiError(error, t("errors.signupService")));
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
        `${serverurl}/auth/verifysignupotp`,
        {
          email: otpEmail,
          otp: otp.trim(),
        },
        { withCredentials: true, timeout: 30000 }
      );

      if (!data?.success) {
        toast.error(data?.message || "Verification code is invalid or expired.");
        return;
      }

      if (data?.user) dispatch(setUserData(data.user));

      toast.success("Account created and verified successfully!");
      setTimeout(() => router.push("/"), 900);
    } catch (error) {
      toast.error(getApiError(error, "Verification failed. Please retry."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const mobile = formData.mobile.trim();
    if (!mobile || !/^\+?\d{8,15}$/.test(mobile)) {
      toast.error(t("errors.googleMobile"));
      return;
    }

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
                `${serverurl}/auth/google/signup`,
                {
                  accessToken: tokenResponse.access_token,
                  mobile,
                  fullname: formData.fullname.trim() || "",
                  gender: formData.gender || "Other",
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
                toast.error(data?.message || t("errors.googleSignup"));
                return;
              }

              if (data?.user) dispatch(setUserData(data.user));

              toast.success(data?.message || t("success.googleSignup"));
              setTimeout(() => router.push("/"), 700);
            } catch (error) {
              toast.error(getApiError(error, t("errors.googleSignup")));
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
      style={{ fontFamily: '"Manrope", "Segoe UI", sans-serif' }}
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
          className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-50/30 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr] rounded-3xl overflow-hidden shadow-xl border border-zinc-150">
          
          {/* Left Column: Brand Showcase */}
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

          {/* Right Column: Form Canvas */}
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
                  <h2 className="text-xl font-black text-zinc-900 mt-3">Confirm Verification Code</h2>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                    A 6-digit security code has been dispatched to <span className="font-bold text-zinc-800">{otpEmail}</span>. Enter the code below to finalize your signup registration.
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Complete Signup"}
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
              <form onSubmit={handleSignup} className="space-y-4 max-w-sm mx-auto w-full">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-800 mb-1">
                    <Key className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Registration Portal</span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                    Create your account
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Register below to start verifying your store and accessing dashboard tools.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <FieldLabel
                      label={t("fields.fullName")}
                      icon={<User className="h-3.5 w-3.5" />}
                    />
                    <input
                      type="text"
                      value={formData.fullname}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullname: event.target.value,
                        }))
                      }
                      placeholder={t("placeholders.fullName")}
                      autoComplete="name"
                      className={fieldInputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <FieldLabel
                      label={t("fields.email")}
                      icon={<Mail className="h-3.5 w-3.5" />}
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder={t("placeholders.email")}
                      autoComplete="email"
                      className={fieldInputClass}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel
                        label={t("fields.mobile")}
                        icon={<Phone className="h-3.5 w-3.5" />}
                      />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            mobile: normalizeMobile(event.target.value),
                          }))
                        }
                        placeholder={t("placeholders.mobile")}
                        autoComplete="tel"
                        className={fieldInputClass}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel
                        label={t("fields.gender")}
                        icon={<VenusAndMars className="h-3.5 w-3.5" />}
                      />
                      <select
                        value={formData.gender}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            gender: event.target.value,
                          }))
                        }
                        className={fieldInputClass}
                      >
                        <option value="">{t("gender.select")}</option>
                        <option value="Male">{t("gender.male")}</option>
                        <option value="Female">{t("gender.female")}</option>
                        <option value="Other">{t("gender.other")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <FieldLabel
                      label={t("fields.password")}
                      icon={<Lock className="h-3.5 w-3.5" />}
                    />
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        placeholder={t("placeholders.password")}
                        autoComplete="new-password"
                        className={`${fieldInputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>{t("passwordStrength")}</span>
                      <span className="font-bold text-zinc-600">{passwordStrength.label}</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 rounded-xl border border-zinc-150 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(event) => setAgreedToPolicy(event.target.checked)}
                      className="mt-0.5 accent-emerald-800"
                    />
                    <span>{t("agreePolicy")}</span>
                  </label>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-750 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("createAccount")
                  )}
                </motion.button>

                <div className="flex items-center gap-3 py-1 text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                  <span className="h-px flex-1 bg-zinc-100" />
                  Or continue with
                  <span className="h-px flex-1 bg-zinc-100" />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading || loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  ) : (
                    <>
                      <FcGoogle className="h-4.5 w-4.5" />
                      {t("googleSignup")}
                    </>
                  )}
                </motion.button>

                <p className="pt-2 text-center text-xs font-bold text-zinc-500">
                  {t("alreadyHave")}{" "}
                  <Link
                    href="/signin"
                    className="text-emerald-800 hover:text-emerald-700 underline underline-offset-4"
                  >
                    {t("signin")}
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

const FieldLabel = ({ label, icon }) => (
  <label className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">
    {icon}
    {label}
  </label>
);

export default Signup;
