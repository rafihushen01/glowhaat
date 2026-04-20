"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { BadgeCheck, Eye, EyeOff, Loader2, Lock, Mail, Phone, ShieldCheck, Sparkles, User, VenusAndMars } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { serverurl } from "../utils/constants/serverurl";
import { useActiveLogo } from "../hooks/useActiveLogo";
import { setUserData } from "../reduxcomponents/UserSlice";
import { signInWithGoogleAndGetIdToken } from "../UserAuthenticationComponents/fireabase";

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

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    if (userData) router.replace("/");
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

  const getApiError = (error, fallbackMessage) => error?.response?.data?.message || fallbackMessage;

  const validateSignupFields = () => {
    const name = formData.fullname.trim();
    const email = formData.email.trim().toLowerCase();
    const mobile = formData.mobile.trim();

    if (!name || name.length < 3) return t("errors.nameMin");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t("errors.invalidEmail");
    if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      return t("errors.passwordRules");
    }
    if (mobile && !/^\+?\d{8,15}$/.test(mobile)) return t("errors.mobileRange");
    if (!["Male", "Female", "Other"].includes(formData.gender)) return t("errors.chooseGender");
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

  const handleGoogleSignup = async () => {
    const mobile = formData.mobile.trim();
    if (!mobile || !/^\+?\d{8,15}$/.test(mobile)) {
      toast.error(t("errors.googleMobile"));
      return;
    }

    setGoogleLoading(true);
    try {
      const { idToken, profile } = await signInWithGoogleAndGetIdToken();
      const { data } = await axios.post(
        `${serverurl}/auth/google/signup`,
        {
          idToken,
          mobile,
          fullname: formData.fullname.trim() || profile.fullname || "",
          gender: formData.gender || "Male",
        },
        { withCredentials: true, timeout: 15000 }
      );

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
  };

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_16%_20%,#f6d8be_0%,#f7efe3_32%,#f6f4ee_62%,#edf6f1_100%)]"
      style={{ fontFamily: "\"Manrope\", \"Segoe UI\", sans-serif" }}
    >
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
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-28 w-[min(92%,1000px)] rounded-b-[3rem] bg-gradient-to-r from-[#184237]/85 via-[#2d6a58]/80 to-[#195b47]/85 blur-2xl"
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
                <img src={logoUrl} alt="Glow Haat" width={130} height={42} className="h-auto w-[130px] object-contain" loading="eager" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f52]">{t("hero.tag")}</p>
                <h1
                  className="text-3xl leading-tight text-[#201810] md:text-4xl"
                  style={{ fontFamily: "\"Cormorant Garamond\", \"Times New Roman\", serif" }}
                >
                  {t("hero.title")}
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-[15px] leading-relaxed text-[#4d3e33] md:text-base">{t("hero.desc")}</p>

            <div className="mt-8 grid gap-3 text-sm">
              {[t("hero.p1"), t("hero.p2"), t("hero.p3")].map((point) => (
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
                <span className="font-semibold">{t("hero.securityTitle")}</span>
              </div>
              {t("hero.securityText")}
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
                <p className="text-xs uppercase tracking-[0.2em] text-[#56796a]">{t("createAccount")}</p>
                <h2 className="mt-1 text-2xl text-[#0f2f24]" style={{ fontFamily: "\"Cormorant Garamond\", serif" }}>
                  {t("title")}
                </h2>
              </div>
              <div className="rounded-full border border-[#d7e8e0] bg-[#f3f9f6] p-2">
                <Sparkles className="h-5 w-5 text-[#2f6c58]" />
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <FieldLabel label={t("fields.fullName")} icon={<User className="h-4 w-4" />} />
              <input
                type="text"
                value={formData.fullname}
                onChange={(event) => setFormData((prev) => ({ ...prev, fullname: event.target.value }))}
                placeholder={t("placeholders.fullName")}
                autoComplete="name"
                className={fieldInputClass}
              />

              <FieldLabel label={t("fields.email")} icon={<Mail className="h-4 w-4" />} />
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t("placeholders.email")}
                autoComplete="email"
                className={fieldInputClass}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel label={t("fields.mobile")} icon={<Phone className="h-4 w-4" />} />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(event) => setFormData((prev) => ({ ...prev, mobile: normalizeMobile(event.target.value) }))}
                    placeholder={t("placeholders.mobile")}
                    autoComplete="tel"
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <FieldLabel label={t("fields.gender")} icon={<VenusAndMars className="h-4 w-4" />} />
                  <select
                    value={formData.gender}
                    onChange={(event) => setFormData((prev) => ({ ...prev, gender: event.target.value }))}
                    className={fieldInputClass}
                  >
                    <option value="">{t("gender.select")}</option>
                    <option value="Male">{t("gender.male")}</option>
                    <option value="Female">{t("gender.female")}</option>
                    <option value="Other">{t("gender.other")}</option>
                  </select>
                </div>
              </div>

              <FieldLabel label={t("fields.password")} icon={<Lock className="h-4 w-4" />} />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder={t("placeholders.password")}
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
                  {t("passwordStrength")}: <span className="font-semibold">{passwordStrength.label}</span>
                </p>
                <p className="text-[11px] text-[#628273]">{t("passwordHint")}</p>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-[#d9e6df] bg-[#f8fcfa] px-3 py-2 text-xs text-[#3b5a4e]">
                <input
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(event) => setAgreedToPolicy(event.target.checked)}
                  className="mt-0.5 accent-[#1d4f3f]"
                />
                <span>{t("agreePolicy")}</span>
              </label>

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1f5c49] via-[#1f6d56] to-[#174737] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("createAccount")}
              </motion.button>

              <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6e867b]">
                <span className="h-px flex-1 bg-[#d8e6df]" />
                Or
                <span className="h-px flex-1 bg-[#d8e6df]" />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfded7] bg-white px-4 py-3 text-sm font-semibold text-[#174737] transition hover:bg-[#f5faf8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FcGoogle className="h-5 w-5" />
                    {t("googleSignup")}
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-[#526d61]">
              {t("alreadyHave")}{" "}
              <Link href="/signin" className="font-semibold text-[#1f5c49] underline underline-offset-4">
                {t("signin")}
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

