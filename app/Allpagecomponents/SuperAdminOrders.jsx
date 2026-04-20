"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import { serverurl } from "../utils/constants/serverurl";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";

const statusList = ["placed", "processing", "shipped", "delivered", "returned", "canceled"];
const formatMoney = (value) => `à§³${Number(value || 0).toLocaleString()}`;

const SuperAdminOrders = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${serverurl}/order/admin/all`, {
        params: { status: statusFilter || undefined, q: query || undefined },
        withCredentials: true,
      });
      if (data?.success) {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not fetch orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, statusFilter]);

  const summary = useMemo(() => {
    const counts = { placed: 0, processing: 0, shipped: 0, delivered: 0, returned: 0, canceled: 0 };
    orders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      }
    });
    return counts;
  }, [orders]);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-[#1f5c49]">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  const handleUpdateStatus = async (id, status) => {
    setMessage("");
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(
        `${serverurl}/order/admin/status/${id}`,
        { status },
        { withCredentials: true }
      );
      if (data?.success) {
        setOrders((prev) =>
          prev.map((order) => (order._id === id ? { ...order, status: data.order?.status || status } : order))
        );
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || "Could not update status.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f2f24]">
      <SuperAdminNav />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700">Glow Haat SuperAdmin</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-900">Order Management Panel</h1>
          <p className="mt-2 text-sm text-[#4f6f63]">
            Track all orders and control the full delivery lifecycle from one place.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          {statusList.map((status) => (
            <div key={status} className="rounded-xl border border-emerald-200 bg-white p-3 text-center">
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">{status}</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900">{summary[status] || 0}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order no, name, mobile, city"
            className="h-11 flex-1 rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border border-emerald-200 px-3 outline-none focus:border-emerald-500"
          >
            <option value="">All Status</option>
            {statusList.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchOrders}
            className="h-11 rounded-xl bg-emerald-700 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-emerald-800"
          >
            Search
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 text-sm uppercase tracking-[0.2em] text-emerald-700">Loading Orders...</div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-8 text-center text-sm text-[#4f6f63]">
            No orders found for this filter.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-emerald-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Order</p>
                    <h2 className="text-xl font-semibold text-emerald-900">{order.ordernumber}</h2>
                    <p className="mt-1 text-xs text-[#4f6f63]">
                      {order.customer?.fullname} | {order.customer?.mobile} | {order.shippingaddress?.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Grand Total</p>
                    <p className="text-2xl font-semibold">{formatMoney(order.grandtotal)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-100 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Delivery Address</p>
                    <p className="mt-2 text-sm text-[#4f6f63]">
                      {order.shippingaddress?.addressline}, {order.shippingaddress?.area}, {order.shippingaddress?.city}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Payment</p>
                    <p className="mt-2 text-sm capitalize text-[#4f6f63]">
                      {order.payment?.method} {order.payment?.reference ? `| Ref: ${order.payment.reference}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-700">Status</p>
                  {statusList.map((status) => (
                    <button
                      key={`${order._id}-${status}`}
                      type="button"
                      disabled={updatingId === order._id}
                      onClick={() => handleUpdateStatus(order._id, status)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] border ${
                        order.status === status
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminOrders;

