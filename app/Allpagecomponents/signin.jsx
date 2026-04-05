"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {useTranslations} from "next-intl";
import { serverurl } from "../utils/constants/serverurl";
import khancosmeticslogo from "../../public/khancosmeticslogo.png";
import { setUserData } from "../reduxcomponents/UserSlice";
import { signInWithGoogleAndGetIdToken } from "../UserAuthenticationComponents/fireabase";

const panelMotion = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stepMotion = {
  initial: { opacity: 0, y: 16, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -12, scale: 0.985, transition: { duration: 0.2 } },
};

const inputClass =
  "w-full rounded-xl border border-[#d5e3dc] bg-[#fbfdfc] px-3 py-2.5 text-sm text-[#17372b] outline-none transition placeholder:text-[#789486] focus:border-[#1f5c49] focus:ring-2 focus:ring-[#9ec7b4]/40";

const Signin = () => {
  const t = useTranslations("SigninPage");
  const router = useRouter();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [step, setStep] = useState("credentials");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [googleMobile, setGoogleMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const sanitizedEmail = useMemo(
    () => credentials.email.trim().toLowerCase(),
    [credentials.email]
  );

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

  const getApiError = (error, fallback) => error?.response?.data?.message || fallback;

  const validateCredentials = () => {
    if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return t("errors.invalidEmail");
    }

    if (!credentials.password || credentials.password.length < 6) {
      return t("errors.shortPassword");
    }

    return "";
  };

  const requestSigninOtp = async (event) => {
    event.preventDefault();
    const validationError = validateCredentials();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/signinotp`,
        {
          email: sanitizedEmail,
          password: credentials.password,
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Channel": "khancosmetics-web-signin",
          },
        }
      );

      if (!data?.message) {
        toast.error(t("errors.sendOtp"));
        return;
      }

      toast.success(data.message || t("success.otpSent"));
      setStep("verify");
      setOtp("");
      setOtpCountdown(60);
    } catch (error) {
      toast.error(getApiError(error, t("errors.signinRequest")));
    } finally {
      setLoading(false);
    }
  };

  const verifySigninOtp = async (event) => {
    event.preventDefault();

    if (!sanitizedEmail) {
      toast.error(t("errors.emailMissing"));
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error(t("errors.enterOtp"));
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/verifysigninotp`,
        {
          email: sanitizedEmail,
          otp: otp.trim(),
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            "X-Remember-Device": rememberDevice ? "true" : "false",
          },
        }
      );

      if (!data?.success) {
        toast.error(data?.message || t("errors.otpVerify"));
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

      if (authuser) {
        dispatch(setUserData(authuser));
      }

      toast.success(data?.message || t("success.signin"));
      setTimeout(() => {
        if (authuser?.role === "SuperAdmin") {
          router.push("/SuperAdmin");
        } else {
          router.push("/");
        }
      }, 750);
    } catch (error) {
      toast.error(getApiError(error, t("errors.otpVerify")));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (loading || resending || otpCountdown > 0) return;

    const validationError = validateCredentials();
    if (validationError) {
      toast.error(t("errors.validCredentialsForResend"));
      return;
    }

    setResending(true);
    try {
      const { data } = await axios.post(
        `${serverurl}/auth/signinotp`,
        {
          email: sanitizedEmail,
          password: credentials.password,
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(data?.message || t("success.otpResent"));
      setOtpCountdown(60);
    } catch (error) {
      toast.error(getApiError(error, t("errors.resendOtp")));
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignin = async () => {
    const mobile = googleMobile.trim();
    if (!mobile || !/^\+?\d{8,15}$/.test(mobile)) {
      toast.error(t("errors.invalidMobileForGoogle"));
      return;
    }

    setGoogleLoading(true);
    try {
      const { idToken } = await signInWithGoogleAndGetIdToken();
      const { data } = await axios.post(
        `${serverurl}/auth/google/signin`,
        {
          idToken,
          mobile,
        },
        { withCredentials: true, timeout: 15000 }
      );

      if (!data?.success) {
        toast.error(data?.message || t("errors.googleSignin"));
        return;
      }

      if (data?.user) {
        dispatch(setUserData(data.user));
      }

      toast.success(data?.message || t("success.googleSignin"));
      setTimeout(() => {
        if (data?.user?.role === "SuperAdmin") {
          router.push("/SuperAdmin");
        } else {
          router.push("/");
        }
      }, 700);
    } catch (error) {
      toast.error(getApiError(error, t("errors.googleSignin")));
    } finally {
      setGoogleLoading(false);
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
          className="pointer-events-none absolute -left-20 top-16 h-80 w-80 rounded-full bg-[#e8c9aa]/35 blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12 }}
          className="pointer-events-none absolute -right-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-[#d9ede3]/60 blur-3xl"
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
                <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f52]">{t("hero.tag")}</p>
                <h1
                  className="text-3xl leading-tight text-[#201810] md:text-4xl"
                  style={{ fontFamily: "\"Cormorant Garamond\", \"Times New Roman\", serif" }}
                >
                  {t("hero.title")}
                </h1>
              </div>
            </div>

            <p className="max-w-xl text-[15px] leading-relaxed text-[#4d3e33] md:text-base">
              {t("hero.desc")}
            </p>

            <div className="mt-8 grid gap-3 text-sm">
              {[
                t("hero.p1"),
                t("hero.p2"),
                t("hero.p3"),
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
                <p className="text-xs uppercase tracking-[0.2em] text-[#56796a]">{t("accountAccess")}</p>
                <h2 className="mt-1 text-2xl text-[#0f2f24]" style={{ fontFamily: "\"Cormorant Garamond\", serif" }}>
                  {t("title")}
                </h2>
              </div>
              <div className="rounded-full border border-[#d7e8e0] bg-[#f3f9f6] p-2">
                <Sparkles className="h-5 w-5 text-[#2f6c58]" />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#eef5f2] p-1 text-xs font-semibold tracking-wide text-[#56796a]">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className={`rounded-lg px-3 py-2 transition ${
                  step === "credentials" ? "bg-white text-[#1d4f3f] shadow-sm" : ""
                }`}
              >
                {t("steps.credentials")}
              </button>
              <button
                type="button"
                disabled={!sanitizedEmail}
                onClick={() => setStep("verify")}
                className={`rounded-lg px-3 py-2 transition ${
                  step === "verify"
                    ? "bg-white text-[#1d4f3f] shadow-sm"
                    : "disabled:cursor-not-allowed disabled:opacity-50"
                }`}
              >
                {t("steps.verify")}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === "credentials" ? (
                <motion.form
                  key="credentials-step"
                  variants={stepMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={requestSigninOtp}
                  className="space-y-4"
                >
                  <FieldLabel label={t("fields.email")} icon={<Mail className="h-4 w-4" />} />
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(event) =>
                      setCredentials((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder={t("placeholders.email")}
                    autoComplete="email"
                    className={inputClass}
                  />

                  <FieldLabel label={t("fields.password")} icon={<Lock className="h-4 w-4" />} />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(event) =>
                        setCredentials((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder={t("placeholders.password")}
                      autoComplete="current-password"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#56796a] transition hover:text-[#1d4f3f]"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <label className="flex items-start gap-2 rounded-lg border border-[#d9e6df] bg-[#f8fcfa] px-3 py-2 text-xs text-[#3b5a4e]">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(event) => setRememberDevice(event.target.checked)}
                      className="mt-0.5 accent-[#1d4f3f]"
                    />
                    <span>{t("rememberDevice")}</span>
                  </label>

                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5c49] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {t("continueOtp")} <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6e867b]">
                    <span className="h-px flex-1 bg-[#d8e6df]" />
                    Or
                    <span className="h-px flex-1 bg-[#d8e6df]" />
                  </div>

                  <FieldLabel label={t("fields.googleMobile")} icon={<Phone className="h-4 w-4" />} />
                  <input
                    type="tel"
                    value={googleMobile}
                    onChange={(event) => setGoogleMobile(event.target.value.replace(/[^\d+]/g, "").slice(0, 15))}
                    placeholder={t("placeholders.mobile")}
                    autoComplete="tel"
                    className={inputClass}
                  />

                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleGoogleSignin}
                    disabled={googleLoading || loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#cfded7] bg-white px-4 py-3 text-sm font-semibold text-[#174737] transition hover:bg-[#f5faf8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FcGoogle className="h-5 w-5" />
                        {t("googleSignin")}
                      </>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="verify-step"
                  variants={stepMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={verifySigninOtp}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-[#d8e8e0] bg-[#f4faf7] p-3 text-sm text-[#2f5648]">
                    {t("otpSentTo")} <span className="font-semibold">{sanitizedEmail || t("yourEmail")}</span>
                  </div>

                  <FieldLabel label={t("fields.otp")} icon={<ShieldCheck className="h-4 w-4" />} />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t("placeholders.otp")}
                    autoComplete="one-time-code"
                    className={`${inputClass} text-center text-lg tracking-[0.35em]`}
                  />

                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5c49] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174737] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("verifyAndSignin")}
                  </motion.button>

                  <div className="flex items-center justify-between gap-4 text-xs">
                    <button
                      type="button"
                      onClick={() => setStep("credentials")}
                      className="font-semibold text-[#3e6658] transition hover:text-[#1f5c49]"
                    >
                      {t("editCredentials")}
                    </button>

                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={otpCountdown > 0 || resending}
                      className="font-semibold text-[#3e6658] transition hover:text-[#1f5c49] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resending ? t("resending") : otpCountdown > 0 ? t("resendIn", {seconds: otpCountdown}) : t("resendOtp")}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-sm text-[#526d61]">
              {t("newToBrand")}{" "}
              <Link href="/signup" className="font-semibold text-[#1f5c49] underline underline-offset-4">
                {t("createAccount")}
              </Link>
            </p>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

const FieldLabel = ({ label, icon }) => (
  <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4d6d60]">
    {icon}
    {label}
  </label>
);

export default Signin;
