"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Clock3, PackageCheck, Truck } from "lucide-react";
import { serverurl } from "../utils/constants/serverurl";
import { getRequestConfig } from "../utils/requestConfig";

const statusFlow = ["placed", "processing", "shipped", "delivered"];

const formatMoney = (value) => `à§³${Number(value || 0).toLocaleString()}`;
const formatDate = (value) => new Date(value).toLocaleString();

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/order/my`, getRequestConfig());
        if (data?.success) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (error) {
        setMessage(error?.response?.data?.message || "Could not load your orders right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Loading Orders</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0f2f24]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700">Glow Haat Orders</p>
            <h1 className="mt-2 text-4xl font-semibold">My Orders & Tracking</h1>
            <p className="mt-2 text-sm text-[#4f6f63]">Track every order from placed to delivered or returned.</p>
          </div>
          <Link
            href="/"
            className="h-11 px-5 rounded-full border border-emerald-200 text-xs uppercase tracking-[0.16em] inline-flex items-center text-emerald-800"
          >
            Continue Shopping
          </Link>
        </header>

        {message ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {orders.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-emerald-200 bg-white p-10 text-center">
            <PackageCheck className="mx-auto h-8 w-8 text-emerald-700" />
            <h2 className="mt-3 text-2xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-sm text-[#4f6f63]">Place your first order to start tracking here.</p>
          </section>
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-emerald-200 bg-white p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Order Number</p>
                    <h2 className="text-xl font-semibold text-emerald-900">{order.ordernumber}</h2>
                    <p className="mt-1 text-xs text-[#4f6f63]">Placed: {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Total</p>
                    <p className="text-2xl font-semibold">{formatMoney(order.grandtotal)}</p>
                    <p className="mt-1 text-xs capitalize text-[#4f6f63]">Status: {order.status}</p>
                  </div>
                </div>

                <OrderTracker status={order.status} />

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <div key={`${order._id}-${idx}`} className="flex items-center gap-3 rounded-xl border border-emerald-100 p-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        className="h-14 w-14 rounded-lg object-cover border border-emerald-100"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-emerald-900">{item.name}</p>
                        <p className="text-xs text-[#4f6f63]">
                          {item.variantname || "Default"} / {item.optionname || "Option"} x {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
                  <p className="font-semibold text-emerald-900">Delivery Address</p>
                  <p className="mt-1 text-[#4f6f63]">
                    {order.shippingaddress?.addressline}, {order.shippingaddress?.area}, {order.shippingaddress?.city}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderTracker = ({ status }) => {
  const isTerminalNegative = status === "canceled" || status === "returned";
  const currentIndex = isTerminalNegative ? -1 : statusFlow.indexOf(status);
  return (
    <div className="mt-5 rounded-xl border border-emerald-100 p-4">
      <div className="grid grid-cols-4 gap-2">
        {statusFlow.map((step, idx) => {
          const active = idx <= currentIndex;
          return (
            <div key={step} className="text-center">
              <div className={`mx-auto h-8 w-8 rounded-full flex items-center justify-center ${active ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                {idx === 0 ? <Clock3 className="h-4 w-4" /> : idx === 2 ? <Truck className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
              </div>
              <p className={`mt-2 text-[11px] uppercase tracking-[0.13em] ${active ? "text-emerald-800 font-semibold" : "text-[#709186]"}`}>{step}</p>
            </div>
          );
        })}
      </div>
      {status === "canceled" ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-600">This order was canceled</p>
      ) : null}
      {status === "returned" ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">This order was returned</p>
      ) : null}
    </div>
  );
};

export default MyOrdersPage;

