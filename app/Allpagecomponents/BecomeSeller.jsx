"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import { getAreasByDistrictAndCity, getCitiesByDistrict, getDistrictOptions } from "../utils/constants/bdDeliveryZones";

const IMAGE_FIELDS = [
  { key: "storeprofileimage", label: "Store Profile", required: true, width: 800, height: 800 },
  { key: "storebannerimage", label: "Store Banner", required: true, width: 1600, height: 900 },
  { key: "physicalstoreimage", label: "Physical Store Image", required: false, width: 1280, height: 720 },
  { key: "niddocfront", label: "NID Front", required: true, width: 1200, height: 760 },
  { key: "niddocback", label: "NID Back", required: true, width: 1200, height: 760 },
  { key: "dateofbirthproof", label: "Date of Birth Proof", required: false, width: 1200, height: 760 },
];

const STORE_MODELS = ["Physical Store", "Facebook", "Instagram", "Website", "Mixed"];
const DEFAULT_CATEGORIES = ["Makeup", "Skin", "Undergarments", "Hair Care", "Body Care"];
const LS_KEY = "kc_seller_status_email";

const inputClass = "mt-1 h-11 w-full rounded-xl border border-emerald-200 px-3 text-sm outline-none focus:border-emerald-500";
const textClass = "mt-1 min-h-[86px] w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-500";

const trim = (v = "") => String(v).trim();

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUrlToImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const optimizeImage = async (file, width, height) => {
  const dataUrl = await fileToDataUrl(file);
  const image = await dataUrlToImage(dataUrl);
  const srcAspect = image.width / image.height;
  const targetAspect = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;
  if (srcAspect > targetAspect) {
    sw = image.height * targetAspect;
    sx = (image.width - sw) / 2;
  } else if (srcAspect < targetAspect) {
    sh = image.width / targetAspect;
    sy = (image.height - sh) / 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((out) => (out ? resolve(out) : reject(new Error("Image optimize failed"))), "image/jpeg", 0.88)
  );
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
};

const BecomeSeller = () => {
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;
  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [step, setStep] = useState(1);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepToken, setStepToken] = useState("");
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const [stepOne, setStepOne] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    whatsapp: "",
    otp: "",
  });

  const [form, setForm] = useState({
    dateofbirth: "",
    storetype: DEFAULT_CATEGORIES[0],
    preferredcategories: [DEFAULT_CATEGORIES[0]],
    businessname: "",
    businessgmail: user?.email || "",
    businessphone: "",
    businessmodel: "Physical Store",
    physicalstorename: "",
    physicalstoreaddress: "",
    physicalstoredistrict: "",
    physicalstorecity: "",
    facebookpagename: "",
    facebookpagelink: "",
    instagramidname: "",
    instagramlink: "",
    websiteurl: "",
    pickupdistrict: "",
    pickupcity: "",
    pickuparea: "",
    pickupaddressline: "",
    deliverymanphone: "",
  });

  const cityOptions = useMemo(() => getCitiesByDistrict(form.pickupdistrict), [form.pickupdistrict]);
  const areaOptions = useMemo(() => getAreasByDistrictAndCity(form.pickupdistrict, form.pickupcity), [form.pickupdistrict, form.pickupcity]);

  const fetchStatus = async (emailArg = "") => {
    setLoadingStatus(true);
    try {
      const fallback = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) || "" : "";
      const email = trim(emailArg || stepOne.email || user?.email || fallback);
      const query = email ? `?email=${encodeURIComponent(email)}` : "";
      const { data } = await axios.get(`${serverurl}/seller/status${query}`, getRequestConfig({ timeout: 12000 }));
      setStatus(data?.success && data?.hasrequest ? data.request : null);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    axios
      .get(`${serverurl}/nav/nav`, { timeout: 12000 })
      .then((res) => {
        const roots = Array.isArray(res?.data?.data) ? res.data.data.map((x) => trim(x?.name)).filter(Boolean) : [];
        if (roots.length) {
          setCategories(roots);
          setForm((prev) => ({ ...prev, storetype: roots[0], preferredcategories: [roots[0]] }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStepOne = (key, value) => setStepOne((prev) => ({ ...prev, [key]: value }));
  const onForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleCategory = (cat) => {
    setForm((prev) => {
      const exists = prev.preferredcategories.includes(cat);
      const out = exists ? prev.preferredcategories.filter((x) => x !== cat) : [...prev.preferredcategories, cat];
      return { ...prev, preferredcategories: out };
    });
  };

  const requestOtp = async () => {
    setError("");
    setNotice("");
    const payload = {
      fullname: trim(stepOne.fullname),
      email: trim(stepOne.email),
      mobile: trim(stepOne.mobile),
      whatsapp: trim(stepOne.whatsapp),
    };
    if (!payload.fullname || !payload.email || !payload.mobile) {
      setError("Full name, email and mobile are required.");
      return;
    }
    try {
      setSendingOtp(true);
      const { data } = await axios.post(`${serverurl}/seller/request-otp`, payload, getRequestConfig({ timeout: 12000 }));
      if (data?.success) setNotice("OTP sent to your email.");
      else setError(data?.message || "OTP send failed.");
    } catch (err) {
      setError(err?.response?.data?.message || "OTP send failed.");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setNotice("");
    try {
      setVerifyingOtp(true);
      const payload = {
        fullname: trim(stepOne.fullname),
        email: trim(stepOne.email),
        mobile: trim(stepOne.mobile),
        whatsapp: trim(stepOne.whatsapp),
        otp: trim(stepOne.otp),
      };
      const { data } = await axios.post(`${serverurl}/seller/verify-otp`, payload, getRequestConfig({ timeout: 12000 }));
      if (data?.success && data?.token) {
        setStepToken(data.token);
        setStep(2);
        setNotice("OTP verified. Complete step 2.");
        if (typeof window !== "undefined") localStorage.setItem(LS_KEY, payload.email);
      } else {
        setError(data?.message || "OTP verification failed.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onImageChange = async (key, file) => {
    if (!file) return;
    const cfg = IMAGE_FIELDS.find((x) => x.key === key);
    try {
      const optimized = await optimizeImage(file, cfg.width, cfg.height);
      const nextPreview = URL.createObjectURL(optimized);
      setFiles((prev) => ({ ...prev, [key]: optimized }));
      setPreviews((prev) => {
        const old = prev[key];
        if (old) URL.revokeObjectURL(old);
        return { ...prev, [key]: nextPreview };
      });
      setNotice(`${cfg.label} optimized for responsive ratio.`);
    } catch {
      setError(`Could not optimize ${cfg.label}.`);
    }
  };

  const submit = async () => {
    setError("");
    setNotice("");
    if (!stepToken) {
      setError("OTP verification missing.");
      return;
    }
    const missing = IMAGE_FIELDS.find((x) => x.required && !files[x.key]);
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    if (!form.preferredcategories.length) {
      setError("Select at least one category.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("stepToken", stepToken);
      Object.entries(form).forEach(([k, v]) => {
        payload.append(k, k === "preferredcategories" ? v.join(",") : v || "");
      });
      Object.entries(files).forEach(([k, v]) => {
        if (v) payload.append(k, v);
      });

      const { data } = await axios.post(`${serverurl}/seller/submit`, payload, getRequestConfig({ timeout: 30000 }));
      if (data?.success) {
        if (typeof window !== "undefined") localStorage.setItem(LS_KEY, trim(stepOne.email));
        setNotice("Seller request submitted. Please wait for verification.");
        await fetchStatus(stepOne.email);
      } else {
        setError(data?.message || "Submission failed.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForNewApply = () => {
    setStatus(null);
    setStep(1);
    setStepToken("");
    setError("");
    setNotice("");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">KhanCosmetics Partner Program</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Become A Seller</h1>
          <p className="mt-2 text-sm text-emerald-800">
            Join as a verified seller. Choose your core store type and sell under it, plus additional categories added by superadmin.
          </p>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {notice ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}

        {loadingStatus ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6 text-sm text-emerald-800">Checking your seller status...</div>
        ) : status ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Seller Status</p>
            <h2 className="mt-2 text-2xl font-semibold text-emerald-950">{status.status}</h2>
            <p className="mt-2 text-sm text-emerald-800">
              {status.status === "Pending" && "KhanCosmetics authority is reviewing your credentials."}
              {status.status === "Approved" && "Congratulations, your seller profile is approved and verified."}
              {status.status === "Rejected" && "Your request was rejected. You can apply again after fixing details."}
            </p>
            {status.status === "Rejected" ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="font-semibold">Reject Reason</p>
                <p className="mt-1">{status.rejectreason || "Not provided by admin."}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForNewApply}
                className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800"
              >
                Start New Request
              </button>
              <Link href="/signin" className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.8fr]">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Step 1</p>
              <h2 className="mt-2 text-xl font-semibold text-emerald-950">Personal Verification</h2>
              <label className="mt-4 block text-sm">Real Name<input className={inputClass} value={stepOne.fullname} onChange={(e) => onStepOne("fullname", e.target.value)} /></label>
              <label className="mt-3 block text-sm">Gmail<input className={inputClass} value={stepOne.email} onChange={(e) => onStepOne("email", e.target.value)} /></label>
              <label className="mt-3 block text-sm">Business Mobile<input className={inputClass} value={stepOne.mobile} onChange={(e) => onStepOne("mobile", e.target.value)} /></label>
              <label className="mt-3 block text-sm">WhatsApp (optional)<input className={inputClass} value={stepOne.whatsapp} onChange={(e) => onStepOne("whatsapp", e.target.value)} /></label>
              <button type="button" onClick={requestOtp} disabled={sendingOtp} className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                {sendingOtp ? "Sending..." : "Send OTP"}
              </button>
              <label className="mt-3 block text-sm">OTP<input className={inputClass} value={stepOne.otp} onChange={(e) => onStepOne("otp", e.target.value)} /></label>
              <button type="button" onClick={verifyOtp} disabled={verifyingOtp} className="mt-4 w-full rounded-xl border border-emerald-700 bg-emerald-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Step 2</p>
                  <h2 className="mt-2 text-xl font-semibold text-emerald-950">Business Information</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${step === 2 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {step === 2 ? "Unlocked" : "Locked"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">Date of Birth<input type="date" className={inputClass} disabled={step !== 2} value={form.dateofbirth} onChange={(e) => onForm("dateofbirth", e.target.value)} /></label>
                <label className="text-sm">Main Store Type<select className={inputClass} disabled={step !== 2} value={form.storetype} onChange={(e) => onForm("storetype", e.target.value)}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                <label className="text-sm">Business Name<input className={inputClass} disabled={step !== 2} value={form.businessname} onChange={(e) => onForm("businessname", e.target.value)} /></label>
                <label className="text-sm">Business Gmail<input className={inputClass} disabled={step !== 2} value={form.businessgmail} onChange={(e) => onForm("businessgmail", e.target.value)} /></label>
                <label className="text-sm">Business Phone<input className={inputClass} disabled={step !== 2} value={form.businessphone} onChange={(e) => onForm("businessphone", e.target.value)} /></label>
                <label className="text-sm">Business Model<select className={inputClass} disabled={step !== 2} value={form.businessmodel} onChange={(e) => onForm("businessmodel", e.target.value)}>{STORE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Preferred Categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const active = form.preferredcategories.includes(cat);
                    return (
                      <button key={cat} type="button" disabled={step !== 2} onClick={() => toggleCategory(cat)} className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800"}`}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">Physical Store Name<input className={inputClass} disabled={step !== 2} value={form.physicalstorename} onChange={(e) => onForm("physicalstorename", e.target.value)} /></label>
                <label className="text-sm">Physical Store District<input className={inputClass} disabled={step !== 2} value={form.physicalstoredistrict} onChange={(e) => onForm("physicalstoredistrict", e.target.value)} /></label>
                <label className="text-sm">Physical Store City<input className={inputClass} disabled={step !== 2} value={form.physicalstorecity} onChange={(e) => onForm("physicalstorecity", e.target.value)} /></label>
                <label className="text-sm">Facebook Page Name<input className={inputClass} disabled={step !== 2} value={form.facebookpagename} onChange={(e) => onForm("facebookpagename", e.target.value)} /></label>
                <label className="text-sm">Facebook Link<input className={inputClass} disabled={step !== 2} value={form.facebookpagelink} onChange={(e) => onForm("facebookpagelink", e.target.value)} /></label>
                <label className="text-sm">Instagram ID<input className={inputClass} disabled={step !== 2} value={form.instagramidname} onChange={(e) => onForm("instagramidname", e.target.value)} /></label>
                <label className="text-sm">Instagram Link<input className={inputClass} disabled={step !== 2} value={form.instagramlink} onChange={(e) => onForm("instagramlink", e.target.value)} /></label>
                <label className="text-sm">Website Link<input className={inputClass} disabled={step !== 2} value={form.websiteurl} onChange={(e) => onForm("websiteurl", e.target.value)} /></label>
              </div>
              <label className="mt-3 block text-sm">Physical Store Address<textarea className={textClass} disabled={step !== 2} value={form.physicalstoreaddress} onChange={(e) => onForm("physicalstoreaddress", e.target.value)} /></label>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-900">Pickup Location (Steadfast)</p>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm">District<select className={inputClass} disabled={step !== 2} value={form.pickupdistrict} onChange={(e) => setForm((p) => ({ ...p, pickupdistrict: e.target.value, pickupcity: "", pickuparea: "" }))}><option value="">Select</option>{districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
                  <label className="text-sm">City<select className={inputClass} disabled={step !== 2} value={form.pickupcity} onChange={(e) => setForm((p) => ({ ...p, pickupcity: e.target.value, pickuparea: "" }))}><option value="">Select</option>{cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                  <label className="text-sm">Area<select className={inputClass} disabled={step !== 2} value={form.pickuparea} onChange={(e) => onForm("pickuparea", e.target.value)}><option value="">Select</option>{areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
                  <label className="text-sm">Deliveryman Phone<input className={inputClass} disabled={step !== 2} value={form.deliverymanphone} onChange={(e) => onForm("deliverymanphone", e.target.value)} /></label>
                </div>
                <label className="mt-3 block text-sm">Pickup Address<textarea className={textClass} disabled={step !== 2} value={form.pickupaddressline} onChange={(e) => onForm("pickupaddressline", e.target.value)} /></label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {IMAGE_FIELDS.map((field) => (
                  <label key={field.key} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    {field.label} {field.required ? "*" : "(optional)"}
                    <input type="file" accept="image/*" disabled={step !== 2} onChange={(e) => onImageChange(field.key, e.target.files?.[0])} className="mt-2 w-full text-xs" />
                    {previews[field.key] ? <img src={previews[field.key]} alt={field.label} className="mt-2 h-36 w-full rounded-lg object-cover" /> : null}
                  </label>
                ))}
              </div>

              <button type="button" disabled={step !== 2 || submitting} onClick={submit} className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60">
                {submitting ? "Submitting..." : "Submit Seller Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BecomeSeller;
