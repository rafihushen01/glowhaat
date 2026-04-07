"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const SellerDashboard = () => {
  const router = useRouter();
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;
  const role = String(user?.role || "");

  useEffect(() => {
    if (!user) return;
    if (role === "SuperAdmin") router.replace("/SuperAdmin");
    else if (role !== "Seller") router.replace("/");
  }, [role, router, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white px-4 py-10 text-sm text-emerald-800">
        Please sign in first to continue.
      </div>
    );
  }

  if (role !== "Seller") return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">KhanCosmetics Seller Panel</p>
          <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Welcome, {user?.fullname || "Seller"}</h1>
          <p className="mt-2 text-sm text-emerald-800">
            Your seller account is active. This dashboard is ready for your seller operations.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Go Home
            </Link>
            <Link href="/become-seller" className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              View Seller Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
