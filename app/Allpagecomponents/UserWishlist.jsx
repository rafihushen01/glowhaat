"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import UserNav from "./UserNav";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";
import { trackRecommendationEvent } from "../utils/recommendation";
import { addToCart } from "../reduxcomponents/CartSlice";

const formatMoney = (value) => `৳${Number(value || 0).toLocaleString()}`;

const UserWishlist = () => {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeProductId, setActiveProductId] = useState("");

  const totalWishlist = useMemo(() => Number(items.length || 0), [items]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/wishlist/my`, getRequestConfig());
        if (data?.success) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        setStatusMessage(error?.response?.data?.message || "Could not load wishlist right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemove = async (productid) => {
    if (!productid || activeProductId) return;
    try {
      setActiveProductId(productid);
      setStatusMessage("");
      const { data } = await axios.delete(`${serverurl}/wishlist/remove/${productid}`, {
        ...getRequestConfig(),
      });
      if (!data?.success) {
        setStatusMessage(data?.message || "Could not remove wishlist item.");
        return;
      }
      setItems((prev) => prev.filter((entry) => String(entry.productid) !== String(productid)));
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Could not remove wishlist item.");
    } finally {
      setActiveProductId("");
    }
  };

  const handleAddToCart = async (entry) => {
    const slug = entry?.slug;
    if (!slug || activeProductId) return;

    try {
      setActiveProductId(String(entry.productid));
      setStatusMessage("");
      const { data } = await axios.post(
        `${serverurl}/cart/add`,
        { slug, variantindex: 0, optionindex: 0, quantity: 1 },
        getRequestConfig()
      );

      if (!data?.success) {
        setStatusMessage(data?.message || "Could not add product to cart.");
        return;
      }
      if (data.item) {
        dispatch(addToCart(data.item));
      }
      setStatusMessage("Product added to cart.");
      trackRecommendationEvent({
        eventtype: "add_to_cart",
        slug,
        quantity: 1,
      });
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Could not add product to cart.");
    } finally {
      setActiveProductId("");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <UserNav />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-40">
        <header className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-700">Glow Haat Wishlist</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-900">My Wishlist</h1>
          <p className="mt-2 text-sm text-[#4f6f63]">
            Save favorite products and launch high-performing products with real customer intent data.
          </p>
          <p className="mt-3 inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
            {totalWishlist} Products Saved
          </p>
        </header>

        {statusMessage ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {statusMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-10 text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">Loading Wishlist</p>
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-10 text-center">
            <Heart className="mx-auto h-8 w-8 text-emerald-700" />
            <h2 className="mt-3 text-2xl font-semibold text-emerald-900">No products in wishlist yet</h2>
            <p className="mt-2 text-sm text-[#4f6f63]">Tap Wishlist on products you love, then manage them here.</p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full border border-emerald-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800"
            >
              Explore Products
            </Link>
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((entry) => (
              <article key={entry._id} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                <Link
                  href={`/product/${entry.slug}`}
                  className="block overflow-hidden rounded-xl border border-emerald-100"
                  onClick={() =>
                    trackRecommendationEvent({
                      eventtype: "product_click",
                      slug: entry.slug,
                    })
                  }
                >
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name}
                      className="h-52 w-full object-cover transition duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-52 w-full bg-emerald-50" />
                  )}
                </Link>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">{entry.brand || "Glow Haat"}</p>
                  <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-emerald-900">{entry.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xl font-semibold text-emerald-900">{formatMoney(entry.currentprice)}</span>
                    {Number(entry.baseprice || 0) > Number(entry.currentprice || 0) ? (
                      <span className="text-sm text-[#789588] line-through">{formatMoney(entry.baseprice)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(entry)}
                    disabled={activeProductId === String(entry.productid)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-emerald-800 disabled:opacity-70"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add To Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(String(entry.productid))}
                    disabled={activeProductId === String(entry.productid)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-700 hover:bg-red-100 disabled:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserWishlist;

