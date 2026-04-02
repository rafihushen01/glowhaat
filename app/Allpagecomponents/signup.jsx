"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowRight,
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { serverurl } from "../utils/constants/serverurl";
import khancosmeticslogo from "../../public/khancosmeticslogo.png";
import { setUserData } from "../reduxcomponents/UserSlice";

const panelMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stepMotion = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.22 } },
};

const initialForm = {
  fullname: "",
  email: "",
  password: "",
  mobile: "",
  gender: "",
  role: "User",
};

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "Needs work", width: "35%", color: "bg-rose-500" };
  if (score <= 3) return { label: "Good", width: "65%", color: "bg-amber-500" };
  return { label: "Strong", width: "100%", color: "bg-emerald-500" };
};

const normalizeMobile = (value) => value.replace(/[^\d+]/g, "").slice(0, 15);

const Signup = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [step, setStep] = useState("details");
  const [formData, setFormData] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    if (userData) {
      router.replace("/");
    }
  }, [userData, router]);

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

    if (!name || name.length < 3) {
      return "Please enter your full name (min 3 characters).";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      return "Password must be at least 8 characters and include letters and numbers.";
    }

    if (mobile && !/^\+?\d{8,15}$/.test(mobile)) {
      return "Mobile number must be 8 to 15 digits.";
    }

    if (!["Male", "Female", "Other"].includes(formData.gender)) {
      return "Please choose your gender.";
    }

    if (!agreedToPolicy) {
      return "Please accept the privacy policy to continue.";
    }

    return "";
  };

  const requestSignupOtp = async (event) => {
    event.preventDefault();
    const errorMessage = validateSignupFields();
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    setLoading(true);
    try {
      const payload = buildSignupPayload();
      const { data } = await axios.post(`${serverurl}/auth/signupotp`, payload, {
        withCredentials: true,
      });

      if (!data?.success) {
        toast.error(data?.message || "Unable to send OTP.");
        return;
      }

      toast.success(data.message || "OTP sent to your email.");
      setStep("verify");
      setOtpCountdown(60);
      setOtp("");
      setFormData((prev) => ({
        ...prev,
        fullname: payload.fullname,
        email: payload.email,
        mobile: payload.mobile || "",
      }));
    } catch (error) {
      toast.error(getApiError(error, "Could not connect to signup service."));
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("Enter your 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/verifysignupotp`,
        {
          email: formData.email.trim().toLowerCase(),
          otp: otp.trim(),
        },
        { withCredentials: true }
      );

      if (!data?.success) {
        toast.error(data?.message || "OTP verification failed.");
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

      if (authuser) {
        dispatch(setUserData(authuser));
      }

      toast.success("Account created successfully.");
      setTimeout(() => router.push("/"), 900);
    } catch (error) {
      toast.error(getApiError(error, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpCountdown > 0 || resending || loading) return;
    setResending(true);
    try {
      const payload = buildSignupPayload();
      const { data } = await axios.post(`${serverurl}/auth/signupotp`, payload, {
        withCredentials: true,
      });

      if (!data?.success) {
        toast.error(data?.message || "Unable to resend OTP.");
        return;
      }

      toast.success("A new OTP has been sent.");
      setOtpCountdown(60);
    } catch (error) {
      toast.error(getApiError(error, "Resend failed. Please try again."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f5ef]" style={{ fontFamily: "\"Manrope\", \"Segoe UI\", sans-serif" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
          },
        }}
      />

      <main className="relative overflow-hidden px-4 pb-16 pt-28 md:px-8">
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-[#f6cfb0]/35 blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#d8e8df]/55 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            variants={panelMotion}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-3xl border border-[#e6d9c8] bg-[linear-gradient(145deg,#fffdf9_0%,#fff5ea_48%,#f8f1e9_100%)] p-7 shadow-[0_20px_60px_rgba(108,91,72,0.14)] md:p-10"
          >
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-2xl border border-[#ead8c0] bg-white/80 p-3 shadow-sm">
                <Image src={khancosmeticslogo} alt="KhanCosmetics" width={130} height={42} priority />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f52]">Premium Beauty Club</p>
                <h1
                  className="text-3xl leading-tight text-[#201810] md:text-4xl"
                  style={{ fontFamily: "\"Cormorant Garamond\", \"Times New Roman\", serif" }}
                >
                  Join KhanCosmetics
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-[15px] leading-relaxed text-[#4d3e33] md:text-base">
              Build your beauty profile, unlock early product drops, and get a secure OTP verified account
              designed for fast checkout and trusted order tracking.
            </p>

            <div className="mt-8 grid gap-3 text-sm">
              {[
                "OTP based signup with encrypted password storage",
                "Instant account verification and protected session cookie",
                "Brand-first experience crafted for KhanCosmetics customers",
              ].map((point) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3 rounded-xl border border-[#eadccf] bg-white/80 px-4 py-3"
                >
                  <BadgeCheck className="h-4 w-4 text-[#4d7d6a]" />
                  <span className="text-[#3f3228]">{point}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-[#eadccf] bg-white/70 p-4 text-sm text-[#4b3d31]">
              <div className="mb-2 flex items-center gap-2 text-[#2f6c58]">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-semibold">Security promise</span>
              </div>
              We never expose your password in plain text and every signup must pass OTP verification before
              account activation.
            </div>
          </motion.section>

          <motion.section
            variants={panelMotion}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-[#d6e3dc] bg-white/92 p-6 shadow-[0_18px_60px_rgba(36,74,63,0.18)] backdrop-blur-md md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#56796a]">Create account</p>
                <h2 className="mt-1 text-2xl text-[#0f2f24]" style={{ fontFamily: "\"Cormorant Garamond\", serif" }}>
                  Secure Signup
                </h2>
              </div>
              <div className="rounded-full border border-[#d7e8e0] bg-[#f3f9f6] p-2">
                <Sparkles className="h-5 w-5 text-[#2f6c58]" />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#eef5f2] p-1 text-xs font-semibold tracking-wide text-[#56796a]">
              <button
                type="button"
                onClick={() => setStep("details")}
                className={`rounded-lg px-3 py-2 transition ${step === "details" ? "bg-white text-[#1d4f3f] shadow-sm" : ""}`}
              >
                1. Details
              </button>
              <button
                type="button"
                onClick={() => setStep("verify")}
                disabled={!formData.email}
                className={`rounded-lg px-3 py-2 transition ${
                  step === "verify" ? "bg-white text-[#1d4f3f] shadow-sm" : "disabled:cursor-not-allowed disabled:opacity-50"
                }`}
              >
                2. Verify OTP
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === "details" ? (
                <motion.form
                  key="details-step"
                  variants={stepMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={requestSignupOtp}
                  className="space-y-4"
                >
                  <FieldLabel label="Full Name" icon={<User className="h-4 w-4" />} />
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullname: event.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={fieldInputClass}
                  />

                  <FieldLabel label="Email Address" icon={<Mail className="h-4 w-4" />} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={fieldInputClass}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel label="Mobile " icon={<Phone className="h-4 w-4" />} />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            mobile: normalizeMobile(event.target.value),
                          }))
                        }
                        placeholder="+8801XXXXXXXXX"
                        autoComplete="tel"
                        className={fieldInputClass}
                      />
                    </div>
                    <div>
                      <FieldLabel label="Gender" icon={<VenusAndMars className="h-4 w-4" />} />
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
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <FieldLabel label="Password" icon={<Lock className="h-4 w-4" />} />
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
                      placeholder="Create a secure password"
                      autoComplete="new-password"
                      className={`${fieldInputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#56796a] transition hover:text-[#1d4f3f]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-[#e6efe9]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <p className="text-xs text-[#496457]">
                      Password strength: <span className="font-semibold">{passwordStrength.label}</span>
                    </p>
                  </div>

                  <label className="flex items-start gap-2 rounded-lg border border-[#d9e6df] bg-[#f8fcfa] px-3 py-2 text-xs text-[#3b5a4e]">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(event) => setAgreedToPolicy(event.target.checked)}
                      className="mt-0.5 accent-[#1d4f3f]"
                    />
                    <span>
                      I agree to KhanCosmetics privacy and account security policy.
                    </span>
                  </label>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5c49] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send OTP <ArrowRight className="h-4 w-4" /></>}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="verify-step"
                  variants={stepMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={verifySignupOtp}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-[#d8e8e0] bg-[#f4faf7] p-3 text-sm text-[#2f5648]">
                    OTP sent to <span className="font-semibold">{formData.email || "your email"}</span>
                  </div>

                  <FieldLabel label="One-Time Password" icon={<ShieldCheck className="h-4 w-4" />} />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    autoComplete="one-time-code"
                    className={`${fieldInputClass} text-center text-lg tracking-[0.35em]`}
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5c49] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and Create Account"}
                  </motion.button>

                  <div className="flex items-center justify-between gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="font-semibold text-[#3e6658] transition hover:text-[#1f5c49]"
                    >
                      Edit details
                    </button>

                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={otpCountdown > 0 || resending}
                      className="font-semibold text-[#3e6658] transition hover:text-[#1f5c49] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resending ? "Resending..." : otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-sm text-[#526d61]">
              Already have an account?{" "}
              <Link href="/signin" className="font-semibold text-[#1f5c49] underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

const fieldInputClass =
  "w-full rounded-xl border border-[#d5e3dc] bg-[#fbfdfc] px-3 py-2.5 text-sm text-[#17372b] outline-none transition placeholder:text-[#789486] focus:border-[#1f5c49] focus:ring-2 focus:ring-[#9ec7b4]/40";

const FieldLabel = ({ label, icon }) => (
  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4d6d60]">
    {icon}
    {label}
  </label>
);

export default Signup;
