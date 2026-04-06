"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import axios from "axios";
import {useDispatch, useSelector} from "react-redux";
import {useLocale, useTranslations} from "next-intl";
import {Minus, Plus, ShoppingBag, Trash2} from "lucide-react";
import {serverurl} from "../utils/constants/serverurl";
import {
  clearCart,
  removeFromCart,
  setCartItems,
  updateCartItem,
} from "../reduxcomponents/CartSlice";
import {getRequestConfig} from "../utils/requestConfig";
import {calculateDeliveryCharge} from "../utils/constants/bdDeliveryZones";

const formatPrice = (value, locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function CartPage() {
  const t = useTranslations("CartPage");
  const locale = useLocale();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const subtotalFromStore = useSelector((state) => state.cart.subtotal);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [deliveryTotal, setDeliveryTotal] = useState(0);

  const shipping = deliveryTotal;
  const grandTotal = subtotalFromStore + shipping;

  const fetchCart = async () => {
    try {
      setLoading(true);
      const {data} = await axios.get(`${serverurl}/cart/my`, getRequestConfig());
      if (data?.success) {
        dispatch(setCartItems(data.items || []));
        setDeliveryTotal(
          calculateDeliveryCharge({
            district: data.district || "",
            hasFreeDelivery: Boolean(data.hasfreedelivery),
          })
        );
      }
    } catch (error) {
      setStatus(error?.response?.data?.message || t("errors.loadCart"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeQuantity = async (item, nextQty) => {
    const quantity = Math.max(1, Number(nextQty) || 1);
    try {
      const {data} = await axios.patch(
        `${serverurl}/cart/quantity/${item._id}`,
        {quantity},
        getRequestConfig()
      );
      if (data?.success && data?.item) {
        dispatch(updateCartItem(data.item));
      }
    } catch (error) {
      setStatus(error?.response?.data?.message || t("errors.updateQty"));
    }
  };

  const handleRemove = async (id) => {
    try {
      const {data} = await axios.delete(`${serverurl}/cart/remove/${id}`, {
        ...getRequestConfig(),
      });
      if (data?.success) {
        dispatch(removeFromCart(id));
      }
    } catch (error) {
      setStatus(error?.response?.data?.message || t("errors.removeItem"));
    }
  };

  const handleClearCart = async () => {
    try {
      const {data} = await axios.delete(`${serverurl}/cart/clear`, {
        ...getRequestConfig(),
      });
      if (data?.success) {
        dispatch(clearCart());
      }
    } catch (error) {
      setStatus(error?.response?.data?.message || t("errors.clearCart"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#0b2e25] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-[0.32em] uppercase text-emerald-600">{t("brand")}</p>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold" style={{fontFamily: '"Cormorant Garamond", "Times New Roman", serif'}}>
            {t("preparing")}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0b2e25]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(5,150,105,0.12),_transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-emerald-600">{t("bagLabel")}</p>
            <h1
              className="text-4xl md:text-6xl leading-tight"
              style={{fontFamily: '"Cormorant Garamond", "Times New Roman", serif'}}
            >
              {t("title")}
            </h1>
            <p className="mt-3 text-[#4b6b61] text-sm md:text-base">{t("subtitle")}</p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-emerald-100 bg-white/90 px-4 py-2 shadow-sm">
              <img src="/khancosmeticslogo.png" alt={t("brand")} className="h-8 w-8 object-contain" />
              <div className="text-left">
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-600">{t("signature")}</p>
                <p className="text-sm text-emerald-900">{t("signatureText")}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="h-11 px-5 border border-emerald-200 hover:border-emerald-500 text-sm uppercase tracking-[0.14em] flex items-center text-emerald-700"
            >
              {t("continueShopping")}
            </Link>
            {cartItems.length > 0 ? (
              <button
                onClick={handleClearCart}
                className="h-11 px-5 bg-emerald-700 hover:bg-emerald-800 text-sm uppercase tracking-[0.14em] flex items-center text-white"
              >
                {t("clearCart")}
              </button>
            ) : null}
          </div>
        </header>

        {status ? <p className="mt-6 text-sm text-emerald-700">{status}</p> : null}

        {cartItems.length === 0 ? (
          <section className="mt-10 border border-emerald-100 bg-white/90 p-10 text-center shadow-sm">
            <ShoppingBag className="mx-auto text-emerald-600" size={34} />
            <h2
              className="mt-4 text-3xl"
              style={{fontFamily: '"Cormorant Garamond", "Times New Roman", serif'}}
            >
              {t("emptyTitle")}
            </h2>
            <p className="mt-2 text-[#4b6b61]">{t("emptyText")}</p>
          </section>
        ) : (
          <div className="mt-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
            <section className="xl:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <article
                  key={item._id}
                  className="border border-emerald-100 bg-white/95 p-4 md:p-5 flex flex-col md:flex-row gap-5 shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full md:w-40 h-44 md:h-40 object-cover border border-emerald-100"
                  />

                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-600">
                      {item.brand || t("brand")}
                    </p>
                    <h3
                      className="mt-2 text-2xl leading-tight"
                      style={{fontFamily: '"Cormorant Garamond", "Times New Roman", serif'}}
                    >
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#4b6b61]">
                      {t("shadeLabel")}: {item.variantname || t("standard")} | {t("sizeLabel")}: {item.optionname || t("defaultOption")}
                    </p>
                    {(item?.productsnapshot?.description ||
                      item?.productsnapshot?.highlight ||
                      item?.productsnapshot?.aboutitems) && (
                      <div className="mt-3 text-sm text-[#3f5f55] space-y-2">
                        {item?.productsnapshot?.description ? (
                          <p className="line-clamp-2">{item.productsnapshot.description}</p>
                        ) : null}
                        {item?.productsnapshot?.highlight ? (
                          <p className="line-clamp-2">
                            <span className="font-semibold text-emerald-700">{t("keyLabel")}:</span>{" "}
                            {item.productsnapshot.highlight}
                          </p>
                        ) : null}
                        {item?.productsnapshot?.aboutitems ? (
                          <p className="line-clamp-2">{item.productsnapshot.aboutitems}</p>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div className="h-11 border border-emerald-200 flex items-center overflow-hidden">
                        <button
                          onClick={() => handleChangeQuantity(item, item.quantity - 1)}
                          className="h-full w-10 hover:bg-emerald-50 flex items-center justify-center"
                          aria-label={t("decreaseQty")}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="h-full w-12 flex items-center justify-center text-sm border-x border-emerald-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleChangeQuantity(item, item.quantity + 1)}
                          className="h-full w-10 hover:bg-emerald-50 flex items-center justify-center"
                          aria-label={t("increaseQty")}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item._id)}
                        className="h-11 px-4 border border-emerald-200 hover:border-emerald-400 text-emerald-700 text-xs uppercase tracking-[0.15em] flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        {t("remove")}
                      </button>
                    </div>
                  </div>

                  <div className="md:text-right">
                    <p className="text-xs text-emerald-600 uppercase tracking-[0.16em]">{t("unitPrice")}</p>
                    <p className="text-xl mt-1">{formatPrice(item.unitprice, locale)}</p>
                    <p className="text-xs text-emerald-600 uppercase tracking-[0.16em] mt-4">{t("lineTotal")}</p>
                    <p className="text-2xl mt-1 font-semibold">{formatPrice(item.totalprice, locale)}</p>
                  </div>
                </article>
              ))}
            </section>

            <aside className="border border-emerald-100 bg-white/95 p-6 h-fit sticky top-6 shadow-sm">
              <h2
                className="text-3xl"
                style={{fontFamily: '"Cormorant Garamond", "Times New Roman", serif'}}
              >
                {t("orderSummary")}
              </h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-[#4b6b61]">
                  <span>{t("subtotal")}</span>
                  <span>{formatPrice(subtotalFromStore, locale)}</span>
                </div>
                <div className="flex justify-between text-[#4b6b61]">
                  <span>{t("delivery")}</span>
                  <span>{formatPrice(shipping, locale)}</span>
                </div>
                <div className="h-px bg-emerald-100 my-2" />
                <div className="flex justify-between text-lg font-semibold text-emerald-900">
                  <span>{t("total")}</span>
                  <span>{formatPrice(grandTotal, locale)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 h-12 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold uppercase tracking-[0.18em] text-xs inline-flex items-center justify-center"
              >
                {t("proceedCheckout")}
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
