"use client";

import "leaflet/dist/leaflet.css";
import React, {useEffect, useMemo, useState} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {useRouter} from "next/navigation";
import axios from "axios";
import {useDispatch, useSelector} from "react-redux";
import {useLocale, useTranslations} from "next-intl";
import {Banknote, Building2, CreditCard, MapPin, Navigation, Smartphone} from "lucide-react";
import useGetMyLocation from "../hooks/useGetMyLocation";
import {serverurl} from "../utils/constants/serverurl";
import {clearCart, setCartItems} from "../reduxcomponents/CartSlice";
import {getRequestConfig} from "../utils/requestConfig";
import {
  calculateDeliveryCharge,
  getAreasByDistrictAndCity,
  getCitiesByDistrict,
  getDistrictOptions,
} from "../utils/constants/bdDeliveryZones";

const LocationPickerMap = dynamic(() => import("../components/LocationPickerMap"), {
  ssr: false,
});

const formatPrice = (value, locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const withCurrentOption = (options, currentValue) => {
  const current = String(currentValue || "").trim();
  if (!current) return options;
  const hasCurrent = options.some((entry) => String(entry).toLowerCase() === current.toLowerCase());
  return hasCurrent ? options : [current, ...options];
};

const CheckoutPage = () => {
  const t = useTranslations("CheckoutPage");
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.userData);
  const user = userData?.user || userData?.data || userData || null;

  const paymentMethods = [
    {id: "cod", label: t("payment.cod"), icon: <Banknote className="h-4 w-4" />},
    {id: "bkash", label: t("payment.bkash"), icon: <Smartphone className="h-4 w-4" />},
    {id: "nagad", label: t("payment.nagad"), icon: <CreditCard className="h-4 w-4" />},
    {id: "bank", label: t("payment.bank"), icon: <Building2 className="h-4 w-4" />},
    {id: "stripe", label: "Stripe Card (Test)", icon: <CreditCard className="h-4 w-4" />},
  ];

  const [cartLoading, setCartLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [manualQuery, setManualQuery] = useState("");
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [hasFreeDelivery, setHasFreeDelivery] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [cartItems, setLocalCartItems] = useState([]);
  const [stripeForm, setStripeForm] = useState({
    cardNumber: "4242 4242 4242 4242",
    cardExpiry: "12/28",
    cardCvc: "123",
  });

  const [form, setForm] = useState({
    fullname: user?.fullname || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
    district: user?.District || "",
    city: user?.city || "",
    upzilla: user?.upzilla || "",
    area: "",
    addressline: user?.fulladdress || "",
    landmark: "",
    notes: "",
    paymentreference: "",
    paymentnote: "",
  });

  const {
    location,
    loadingCurrent,
    searching,
    error: locationError,
    results,
    getMyLocation,
    searchManualLocation,
    pickLocation,
    setLocation,
  } = useGetMyLocation();

  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const cityOptions = useMemo(
    () => withCurrentOption(getCitiesByDistrict(form.district), form.city),
    [form.city, form.district]
  );
  const areaOptions = useMemo(
    () => withCurrentOption(getAreasByDistrictAndCity(form.district, form.city), form.area),
    [form.area, form.city, form.district]
  );

  const grandTotal = useMemo(() => subtotal + deliveryTotal, [subtotal, deliveryTotal]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Stripe) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const {data} = await axios.get(`${serverurl}/cart/my`, getRequestConfig());
        if (data?.success) {
          const items = Array.isArray(data.items) ? data.items : [];
          const freeDelivery = Boolean(data.hasfreedelivery);
          setLocalCartItems(items);
          setHasFreeDelivery(freeDelivery);
          setSubtotal(Number(data.subtotal || 0));
          setDeliveryTotal(
            calculateDeliveryCharge({
              district: form.district || data.district || "",
              hasFreeDelivery: freeDelivery,
            })
          );
          dispatch(setCartItems(items));
        }
      } catch (error) {
        setStatusMessage(error?.response?.data?.message || t("errors.loadCheckout"));
      } finally {
        setCartLoading(false);
      }
    };

    fetchCart();
  }, [dispatch, t]);

  useEffect(() => {
    setDeliveryTotal(calculateDeliveryCharge({district: form.district, hasFreeDelivery}));
  }, [form.district, hasFreeDelivery]);

  useEffect(() => {
    if (!location) return;
    setForm((prev) => ({
      ...prev,
      district: prev.district || location.district || "",
      city: prev.city || location.city || "",
      area: prev.area || location.area || "",
    }));
  }, [location]);

  const handleSearchManual = async () => {
    await searchManualLocation(manualQuery);
  };

  const handlePickFromMap = ({lat, lng}) => {
    setLocation((prev) => ({
      ...(prev || {}),
      lat,
      lng,
      formatted: prev?.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: prev?.city || "",
      district: prev?.district || "",
      area: prev?.area || "",
      country: prev?.country || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setSubmitting(true);
    try {
      let finalForm = { ...form };
      if (paymentMethod === "stripe") {
        if (!stripeForm.cardNumber || !stripeForm.cardExpiry || !stripeForm.cardCvc) {
          setStatusMessage("Please fill in all standard fields for the Stripe Card Payment.");
          setSubmitting(false);
          return;
        }
        finalForm.paymentreference = "tok_stripe_test_" + Math.random().toString(36).substring(2, 10).toUpperCase();
        finalForm.paymentnote = `Stripe Test Purchase. Card Number: **** **** **** ${stripeForm.cardNumber.slice(-4)}`;
      }

      const payload = {
        ...finalForm,
        paymentmethod: paymentMethod,
        locationtext: location?.formatted || "",
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
      };
      const {data} = await axios.post(`${serverurl}/order/place`, payload, getRequestConfig());
      if (data?.success) {
        dispatch(clearCart());
        setStatusMessage(t("success.orderPlaced"));
        router.push("/my-orders");
      }
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || t("errors.placeOrder"));
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">{t("preparing")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0f2f24]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(5,150,105,0.12),_transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-emerald-700">{t("header.label")}</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold">{t("header.title")}</h1>
            <p className="mt-2 text-sm text-[#4f6f63]">{t("header.subtitle")}</p>
          </div>
          <Link
            href="/cart"
            className="h-11 px-5 rounded-full border border-emerald-200 text-xs uppercase tracking-[0.18em] text-emerald-800 inline-flex items-center"
          >
            {t("backToCart")}
          </Link>
        </header>

        {statusMessage ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </div>
        ) : null}

        {cartItems.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-emerald-200 bg-white p-10 text-center">
            <h2 className="text-2xl font-semibold">{t("empty.title")}</h2>
            <p className="mt-2 text-sm text-[#4f6f63]">{t("empty.text")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section className="xl:col-span-2 space-y-6">
              <article className="rounded-2xl border border-emerald-200 bg-white p-5 md:p-6">
                <h2 className="text-xl font-semibold">{t("sections.basicInfo")}</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t("fields.fullName")} value={form.fullname} onChange={(v) => setForm((p) => ({...p, fullname: v}))} required />
                  <Input label={t("fields.mobile")} value={form.mobile} onChange={(v) => setForm((p) => ({...p, mobile: v}))} required />
                  <Input label={t("fields.emailOptional")} value={form.email} onChange={(v) => setForm((p) => ({...p, email: v}))} />
                  <SelectInput
                    label={t("fields.district")}
                    value={form.district}
                    options={districtOptions}
                    onChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        district: v,
                        city: "",
                        area: "",
                        upzilla: "",
                      }))
                    }
                    required
                  />
                  <SelectInput
                    label={t("fields.city")}
                    value={form.city}
                    options={cityOptions}
                    onChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        city: v,
                        upzilla: v,
                        area: "",
                      }))
                    }
                    required
                  />
                  <Input label={t("fields.upzilla")} value={form.upzilla} onChange={(v) => setForm((p) => ({...p, upzilla: v}))} />
                  <SelectInput
                    label={t("fields.area")}
                    value={form.area}
                    options={areaOptions}
                    onChange={(v) => setForm((p) => ({...p, area: v}))}
                  />
                  <Input label={t("fields.landmark")} value={form.landmark} onChange={(v) => setForm((p) => ({...p, landmark: v}))} />
                </div>
                <label className="mt-4 block text-sm text-emerald-900">
                  {t("fields.fullAddress")}
                  <textarea
                    required
                    value={form.addressline}
                    onChange={(e) => setForm((p) => ({...p, addressline: e.target.value}))}
                    className="mt-2 min-h-[100px] w-full rounded-xl border border-emerald-200 px-3 py-2 outline-none focus:border-emerald-500"
                    placeholder={t("placeholders.fullAddress")}
                  />
                </label>
                <label className="mt-4 block text-sm text-emerald-900">
                  {t("fields.orderNotes")}
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({...p, notes: e.target.value}))}
                    className="mt-2 min-h-[80px] w-full rounded-xl border border-emerald-200 px-3 py-2 outline-none focus:border-emerald-500"
                    placeholder={t("placeholders.orderNotes")}
                  />
                </label>
              </article>

              <article className="rounded-2xl border border-emerald-200 bg-white p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{t("sections.location")}</h2>
                  <button
                    type="button"
                    onClick={getMyLocation}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-emerald-800"
                  >
                    <Navigation className="h-4 w-4" />
                    {loadingCurrent ? t("location.locating") : t("location.useMyLocation")}
                  </button>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-3">
                  <input
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder={t("location.searchPlaceholder")}
                    className="h-11 flex-1 rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSearchManual}
                    className="h-11 rounded-xl border border-emerald-700 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 hover:bg-emerald-50"
                  >
                    {searching ? t("location.searching") : t("location.search")}
                  </button>
                </div>

                {locationError ? <p className="mt-3 text-sm text-red-600">{locationError}</p> : null}

                {results.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {results.map((result, idx) => (
                      <button
                        key={`${result.lat}-${result.lng}-${idx}`}
                        type="button"
                        onClick={() => pickLocation(result)}
                        className="text-left rounded-xl border border-emerald-200 px-3 py-2 hover:bg-emerald-50"
                      >
                        <p className="text-sm font-medium text-emerald-900">{result.formatted}</p>
                        <p className="text-xs text-[#4f6f63]">
                          {result.city || t("location.unknownCity")} {result.district ? `| ${result.district}` : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {location ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">{t("location.selected")}</p>
                    <p className="mt-1 text-sm text-emerald-900">{location.formatted}</p>
                    <p className="text-xs text-[#4f6f63]">
                      {t("location.lat")}: {Number(location.lat).toFixed(6)}, {t("location.lng")}: {Number(location.lng).toFixed(6)}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <LocationPickerMap lat={location?.lat} lng={location?.lng} onPick={handlePickFromMap} />
                  <p className="mt-2 flex items-center gap-2 text-xs text-[#4f6f63]">
                    <MapPin className="h-3.5 w-3.5" />
                    {t("location.mapHint")}
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-emerald-200 bg-white p-5 md:p-6">
                <h2 className="text-xl font-semibold">{t("sections.paymentMethod")}</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        paymentMethod === method.id
                          ? "border-emerald-700 bg-emerald-50"
                          : "border-emerald-200 bg-white hover:bg-emerald-50/40"
                      }`}
                    >
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
                        {method.icon}
                        {method.label}
                      </p>
                    </button>
                  ))}
                </div>

                 {paymentMethod === "stripe" ? (
                  <div className="mt-4 rounded-xl border border-emerald-250 bg-emerald-50/15 p-5 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-emerald-700" />
                      Stripe Test Payment Panel
                    </p>
                    <p className="text-xs text-[#4f6f63]">
                      Enter the standard Stripe test card number below. This order will be processed inside the Stripe Test Sandbox.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="block text-[10px] font-bold uppercase text-zinc-500">
                        Card Number
                        <input
                          className="mt-1.5 h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold tracking-widest outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                          value={stripeForm.cardNumber}
                          maxLength={19}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\s?/g, '').replace(/\D/g, '');
                            if (val.length > 0) {
                              val = val.match(new RegExp('.{1,4}', 'g')).join(' ');
                            }
                            setStripeForm((prev) => ({ ...prev, cardNumber: val }));
                          }}
                        />
                      </label>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500">
                        Expiry Date
                        <input
                          className="mt-1.5 h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold tracking-wider outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={stripeForm.cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) {
                              val = val.slice(0, 2) + '/' + val.slice(2, 4);
                            }
                            setStripeForm((prev) => ({ ...prev, cardExpiry: val }));
                          }}
                        />
                      </label>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500">
                        CVC
                        <input
                          className="mt-1.5 h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold tracking-wider outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                          placeholder="123"
                          maxLength={4}
                          value={stripeForm.cardCvc}
                          onChange={(e) => {
                            setStripeForm((prev) => ({ ...prev, cardCvc: e.target.value.replace(/\D/g, '') }));
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : paymentMethod !== "cod" ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t("fields.paymentRef")}
                      value={form.paymentreference}
                      onChange={(v) => setForm((p) => ({...p, paymentreference: v}))}
                      required
                    />
                    <Input
                      label={t("fields.paymentNote")}
                      value={form.paymentnote}
                      onChange={(v) => setForm((p) => ({...p, paymentnote: v}))}
                      placeholder={t("placeholders.paymentNote")}
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    {t("payment.codHint")}
                  </div>
                )}
              </article>
            </section>

            <aside className="rounded-2xl border border-emerald-200 bg-white p-5 md:p-6 h-fit sticky top-6">
              <h2 className="text-2xl font-semibold">{t("summary.title")}</h2>
              <div className="mt-5 space-y-3 text-sm">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-start gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="h-14 w-14 rounded-lg object-cover border border-emerald-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-emerald-900">{item.name}</p>
                      <p className="text-xs text-[#4f6f63]">
                        {item.variantname || t("summary.defaultVariant")} / {item.optionname || t("summary.defaultOption")} x {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.totalprice, locale)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 border-t border-emerald-100 pt-4 text-sm">
                <div className="flex justify-between text-[#4f6f63]">
                  <span>{t("summary.subtotal")}</span>
                  <span>{formatPrice(subtotal, locale)}</span>
                </div>
                <div className="flex justify-between text-[#4f6f63]">
                  <span>{t("summary.delivery")}</span>
                  <span>{formatPrice(deliveryTotal, locale)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-emerald-900 pt-1">
                  <span>{t("summary.total")}</span>
                  <span>{formatPrice(grandTotal, locale)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 h-12 w-full rounded-xl bg-emerald-700 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-emerald-800 disabled:opacity-70"
              >
                {submitting ? t("summary.placing") : t("summary.complete")}
              </button>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
};

const Input = ({label, value, onChange, required = false, placeholder = ""}) => (
  <label className="text-sm text-emerald-900">
    {label}
    <input
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 h-11 w-full rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500"
    />
  </label>
);

const SelectInput = ({label, value, onChange, options = [], required = false}) => (
  <label className="text-sm text-emerald-900">
    {label}
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 h-11 w-full rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500 bg-white"
    >
      <option value="">{`Select ${label}`}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

export default CheckoutPage;
