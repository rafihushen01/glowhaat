"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
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

const SOCIAL_CHANNELS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "website", label: "Website" },
];

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

  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

const BecomeSeller = () => {
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;

  const districtOptions = useMemo(() => getDistrictOptions(), []);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [status, setStatus] = useState(null);
  const [statusMeta, setStatusMeta] = useState({
    totalAttempts: 0,
    consecutiveRejections: 0,
    hasPending: false,
    isBlocked: false,
    canApply: true,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showSellerPassword, setShowSellerPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const [stepOne, setStepOne] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    whatsapp: "",
    sellerpassword: "",
    confirmpassword: "",
  });

  const [form, setForm] = useState({
    dateofbirth: "",
    storetype: DEFAULT_CATEGORIES[0],
    preferredcategories: [DEFAULT_CATEGORIES[0]],
    businessname: "",
    businessgmail: user?.email || "",
    businessphone: "",
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

  const [socialChannels, setSocialChannels] = useState([]);

  const cityOptions = useMemo(() => getCitiesByDistrict(form.pickupdistrict), [form.pickupdistrict]);
  const areaOptions = useMemo(
    () => getAreasByDistrictAndCity(form.pickupdistrict, form.pickupcity),
    [form.pickupdistrict, form.pickupcity]
  );

  const physicalStoreNameExists = Boolean(trim(form.physicalstorename));

  const fetchStatus = async (emailArg = "") => {
    setLoadingStatus(true);
    try {
      const fallback = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) || "" : "";
      const email = trim(emailArg || stepOne.email || user?.email || fallback);
      const query = email ? `?email=${encodeURIComponent(email)}` : "";
      const { data } = await axios.get(`${serverurl}/seller/status${query}`, getRequestConfig({ timeout: 12000 }));
      setStatus(data?.success && data?.hasrequest ? data.request : null);
      setStatusMeta(data?.meta || { totalAttempts: 0, consecutiveRejections: 0, hasPending: false, isBlocked: false, canApply: true });
    } catch {
      setStatus(null);
      setStatusMeta({ totalAttempts: 0, consecutiveRejections: 0, hasPending: false, isBlocked: false, canApply: true });
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

  const toggleSocialChannel = (channelKey) => {
    setSocialChannels((prev) => {
      const exists = prev.includes(channelKey);
      if (exists) return prev.filter((k) => k !== channelKey);
      return [...prev, channelKey];
    });
  };

  const getBusinessModel = () => {
    const hasPhysical = physicalStoreNameExists;
    const hasFacebook = socialChannels.includes("facebook");
    const hasInstagram = socialChannels.includes("instagram");
    const hasWebsite = socialChannels.includes("website");
    const picked = [hasPhysical, hasFacebook, hasInstagram, hasWebsite].filter(Boolean).length;

    if (picked > 1) return "Mixed";
    if (hasPhysical) return "Physical Store";
    if (hasFacebook) return "Facebook";
    if (hasInstagram) return "Instagram";
    if (hasWebsite) return "Website";
    return "Physical Store";
  };

  const getStepToken = async () => {
    const payload = {
      fullname: trim(stepOne.fullname),
      email: trim(stepOne.email),
      mobile: trim(stepOne.mobile),
      whatsapp: trim(stepOne.whatsapp),
      sellerpassword: trim(stepOne.sellerpassword),
      confirmpassword: trim(stepOne.confirmpassword),
    };
    const { data } = await axios.post(`${serverurl}/seller/start`, payload, getRequestConfig({ timeout: 12000 }));
    if (!data?.success || !data?.token) {
      throw new Error(data?.message || "Seller request start failed.");
    }
    return { token: data.token, email: payload.email };
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

    const missing = IMAGE_FIELDS.find((x) => x.required && !files[x.key]);
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }

    if (!form.preferredcategories.length) {
      setError("Select at least one category.");
      return;
    }

    if (physicalStoreNameExists && (!trim(form.physicalstoredistrict) || !trim(form.physicalstorecity))) {
      setError("If physical store name is given, physical store district and city are required.");
      return;
    }

    if (socialChannels.includes("facebook") && (!trim(form.facebookpagename) || !trim(form.facebookpagelink))) {
      setError("Facebook page name and page link are required.");
      return;
    }

    if (socialChannels.includes("instagram") && (!trim(form.instagramidname) || !trim(form.instagramlink))) {
      setError("Instagram ID name and link are required.");
      return;
    }

    if (socialChannels.includes("website") && !trim(form.websiteurl)) {
      setError("Website link is required.");
      return;
    }

    try {
      setSubmitting(true);
      if (trim(stepOne.sellerpassword) !== trim(stepOne.confirmpassword)) {
        setError("Seller password and confirm password do not match.");
        return;
      }

      const stepStart = await getStepToken();
      const payload = new FormData();
      payload.append("stepToken", stepStart.token);
      payload.append("sellerloginemail", trim(stepOne.email));
      payload.append("businessmodel", getBusinessModel());

      Object.entries(form).forEach(([k, v]) => {
        payload.append(k, k === "preferredcategories" ? v.join(",") : v || "");
      });

      Object.entries(files).forEach(([k, v]) => {
        if (v) payload.append(k, v);
      });

      const { data } = await axios.post(`${serverurl}/seller/submit`, payload, getRequestConfig({ timeout: 30000 }));
      if (data?.success) {
        if (typeof window !== "undefined") localStorage.setItem(LS_KEY, trim(stepStart.email));
        setNotice("Seller request submitted. Please wait for verification.");
        await fetchStatus(stepStart.email);
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
    if (statusMeta?.hasPending || statusMeta?.isBlocked) return;
    setStatus(null);
    setError("");
    setNotice("");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Glow Haat Partner Program</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Become A Seller</h1>
          <p className="mt-2 text-sm text-emerald-800">
            Professional seller onboarding with review by authority, protected account creation, and secure email-password login.
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
              {status.status === "Pending" && "Your request is under review. You cannot submit another request until authority responds."}
              {status.status === "Approved" && "Congratulations. Your seller account is approved. Use your seller Gmail + password to sign in."}
              {status.status === "Rejected" && "Your request was rejected. You can apply again only if you are not blocked by rejection policy."}
            </p>

            <div className="mt-3 text-xs text-emerald-700">
              Attempts: {statusMeta?.totalAttempts || 0} / 5 | Consecutive Rejections: {statusMeta?.consecutiveRejections || 0} / 4
            </div>

            {statusMeta?.isBlocked ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                Dear applicant, our authority rejected your seller requests repeatedly. Your seller request access is permanently blocked.
              </div>
            ) : null}

            {status.status === "Rejected" ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <p className="font-semibold">Reject Reason</p>
                <p className="mt-1">{status.rejectreason || "Not provided by authority."}</p>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForNewApply}
                disabled={Boolean(statusMeta?.hasPending || statusMeta?.isBlocked)}
                className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start New Request
              </button>
              <Link href="/signin" className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                Sign In
              </Link>
            </div>
          </div>
        ) : statusMeta?.isBlocked ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
            Dear applicant, our authority rejected your seller requests repeatedly. Your seller request access is permanently blocked.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.8fr]">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Seller Account</p>
              <h2 className="mt-2 text-xl font-semibold text-emerald-950">Personal Information</h2>

              <label className="mt-4 block text-sm">Real Name<input className={inputClass} value={stepOne.fullname} onChange={(e) => onStepOne("fullname", e.target.value)} /></label>
              <label className="mt-3 block text-sm">Seller Gmail<input className={inputClass} value={stepOne.email} onChange={(e) => onStepOne("email", e.target.value)} /></label>
              <label className="mt-3 block text-sm">Business Mobile<input className={inputClass} value={stepOne.mobile} onChange={(e) => onStepOne("mobile", e.target.value)} /></label>
              <label className="mt-3 block text-sm">WhatsApp (optional)<input className={inputClass} value={stepOne.whatsapp} onChange={(e) => onStepOne("whatsapp", e.target.value)} /></label>
              <label className="mt-3 block text-sm">
                Seller Password
                <span className="relative block">
                  <input
                    type={showSellerPassword ? "text" : "password"}
                    className={`${inputClass} pr-10`}
                    value={stepOne.sellerpassword}
                    onChange={(e) => onStepOne("sellerpassword", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSellerPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700"
                    aria-label={showSellerPassword ? "Hide password" : "Show password"}
                  >
                    {showSellerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              <label className="mt-3 block text-sm">
                Confirm Password
                <span className="relative block">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${inputClass} pr-10`}
                    value={stepOne.confirmpassword}
                    onChange={(e) => onStepOne("confirmpassword", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>

              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Submit once from the button below. No OTP or email verification step is required.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Business Setup</p>
              <h2 className="mt-2 text-xl font-semibold text-emerald-950">Business Information</h2>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">Date of Birth<input type="date" className={inputClass} value={form.dateofbirth} onChange={(e) => onForm("dateofbirth", e.target.value)} /></label>
                <label className="text-sm">Main Store Type<select className={inputClass} value={form.storetype} onChange={(e) => onForm("storetype", e.target.value)}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                <label className="text-sm">Business Name<input className={inputClass} value={form.businessname} onChange={(e) => onForm("businessname", e.target.value)} /></label>
                <label className="text-sm">Business Gmail<input className={inputClass} value={form.businessgmail} onChange={(e) => onForm("businessgmail", e.target.value)} /></label>
                <label className="text-sm">Business Phone<input className={inputClass} value={form.businessphone} onChange={(e) => onForm("businessphone", e.target.value)} /></label>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Preferred Categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const active = form.preferredcategories.includes(cat);
                    return (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800"}`}>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                <p className="text-sm font-semibold text-emerald-900">Physical Store (Optional)</p>
                <label className="mt-3 block text-sm">Physical Store Name<input className={inputClass} value={form.physicalstorename} onChange={(e) => onForm("physicalstorename", e.target.value)} /></label>

                {physicalStoreNameExists ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-sm">Physical Store District<input className={inputClass} value={form.physicalstoredistrict} onChange={(e) => onForm("physicalstoredistrict", e.target.value)} /></label>
                    <label className="text-sm">Physical Store City<input className={inputClass} value={form.physicalstorecity} onChange={(e) => onForm("physicalstorecity", e.target.value)} /></label>
                  </div>
                ) : null}

                <label className="mt-3 block text-sm">Physical Store Address<textarea className={textClass} value={form.physicalstoreaddress} onChange={(e) => onForm("physicalstoreaddress", e.target.value)} /></label>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-900">Digital Presence</p>
                <p className="mt-1 text-xs text-emerald-700">Select only the channels you have. Fields appear only for selected channels.</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SOCIAL_CHANNELS.map((item) => {
                    const active = socialChannels.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                       
                        onClick={() => toggleSocialChannel(item.key)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-300 bg-white text-emerald-800"}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {socialChannels.includes("facebook") ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-sm">Facebook Page Name<input className={inputClass} value={form.facebookpagename} onChange={(e) => onForm("facebookpagename", e.target.value)} /></label>
                    <label className="text-sm">Facebook Page Link<input className={inputClass} value={form.facebookpagelink} onChange={(e) => onForm("facebookpagelink", e.target.value)} /></label>
                  </div>
                ) : null}

                {socialChannels.includes("instagram") ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-sm">Instagram ID Name<input className={inputClass} value={form.instagramidname} onChange={(e) => onForm("instagramidname", e.target.value)} /></label>
                    <label className="text-sm">Instagram Link<input className={inputClass} value={form.instagramlink} onChange={(e) => onForm("instagramlink", e.target.value)} /></label>
                  </div>
                ) : null}

                {socialChannels.includes("website") ? (
                  <label className="mt-3 block text-sm">Website Link<input className={inputClass} value={form.websiteurl} onChange={(e) => onForm("websiteurl", e.target.value)} /></label>
                ) : null}
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-900">Pickup Location (Steadfast)</p>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm">District<select className={inputClass} value={form.pickupdistrict} onChange={(e) => setForm((p) => ({ ...p, pickupdistrict: e.target.value, pickupcity: "", pickuparea: "" }))}><option value="">Select</option>{districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
                  <label className="text-sm">City<select className={inputClass} value={form.pickupcity} onChange={(e) => setForm((p) => ({ ...p, pickupcity: e.target.value, pickuparea: "" }))}><option value="">Select</option>{cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
                  <label className="text-sm">Area<select className={inputClass} value={form.pickuparea} onChange={(e) => onForm("pickuparea", e.target.value)}><option value="">Select</option>{areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
                  <label className="text-sm">Deliveryman Phone<input className={inputClass} value={form.deliverymanphone} onChange={(e) => onForm("deliverymanphone", e.target.value)} /></label>
                </div>
                <label className="mt-3 block text-sm">Pickup Address<textarea className={textClass} value={form.pickupaddressline} onChange={(e) => onForm("pickupaddressline", e.target.value)} /></label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {IMAGE_FIELDS.map((field) => (
                  <label key={field.key} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    {field.label} {field.required ? "*" : "(optional)"}
                    <input type="file" accept="image/*" onChange={(e) => onImageChange(field.key, e.target.files?.[0])} className="mt-2 w-full text-xs" />
                    {previews[field.key] ? <img src={previews[field.key]} alt={field.label} className="mt-2 h-36 w-full rounded-lg object-cover" /> : null}
                  </label>
                ))}
              </div>

              <button type="button" disabled={submitting} onClick={submit} className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60">
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


