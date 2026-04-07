"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  BarChart3,
  MousePointerClick,
  ShoppingBag,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import { serverurl } from "../utils/constants/serverurl";
import useSuperAdminGuard from "../hooks/useSuperAdminGuard";

const numberFmt = (value) => Number(value || 0).toLocaleString();

const SuperAdminRecommendationInsights = () => {
  const { isSuperAdmin, isCheckingAuth } = useSuperAdminGuard();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchInsights = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/recommendation/admin/insights`, {
          withCredentials: true,
        });

        if (data?.success) {
          setSummary(data.summary || null);
          setProducts(Array.isArray(data.topproducts) ? data.topproducts : []);
          setCategories(Array.isArray(data.topcategories) ? data.topcategories : []);
          setBrands(Array.isArray(data.topbrands) ? data.topbrands : []);
        }
      } catch (error) {
        setMessage(error?.response?.data?.message || "Could not load recommendation insights.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [isSuperAdmin]);

  const topFiveProducts = useMemo(() => products.slice(0, 5), [products]);
  const topEightCategories = useMemo(() => categories.slice(0, 8), [categories]);
  const topEightBrands = useMemo(() => brands.slice(0, 8), [brands]);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white px-4 py-10 text-sm text-[#1f5c49]">Checking SuperAdmin session...</div>;
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <SuperAdminNav />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-[#dce8e2] bg-[#f5fbf8] p-6">
          <div className="flex items-center gap-3 text-[#1f5c49]">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Recommendation Intelligence</h1>
          </div>
          <p className="mt-2 text-sm text-[#4b6b61]">
            Live behavioral intelligence from clicks, wishlist, dwell time, cart actions, and delivered orders.
          </p>
        </div>

        {message ? (
          <div className="mb-6 rounded-xl border border-[#dce8e2] bg-[#f4faf7] px-4 py-3 text-sm text-[#1f5c49]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#dce8e2] bg-white p-8 text-center text-sm uppercase tracking-[0.16em] text-[#1f5c49]">
            Loading Recommendation Insights
          </div>
        ) : null}

        {!loading && summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              title="Total Signal Score"
              value={numberFmt(summary.totalsignalscore)}
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              title="Unique Actors"
              value={numberFmt(summary.uniqueactors)}
            />
            <StatCard
              icon={<MousePointerClick className="h-4 w-4" />}
              title="Clicks Tracked"
              value={numberFmt(summary.totalclicks)}
            />
            <StatCard
              icon={<ShoppingBag className="h-4 w-4" />}
              title="Behavior Orders"
              value={numberFmt(summary.totalorders)}
            />
            <StatCard
              icon={<Timer className="h-4 w-4" />}
              title="Avg Dwell / Actor"
              value={`${Number(summary.avgdwellsecondsperactor || 0).toFixed(2)}s`}
            />
            <StatCard
              icon={<BarChart3 className="h-4 w-4" />}
              title="Tracked Products"
              value={numberFmt(summary.uniqueproducts)}
            />
            <StatCard
              icon={<ShoppingBag className="h-4 w-4" />}
              title="Cart Adds"
              value={numberFmt(summary.totalcartadds)}
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              title="Wishlist Adds"
              value={numberFmt(summary.totalwishlistadds)}
            />
          </div>
        ) : null}

        {!loading && products.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#dce8e2] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f5fbf8] text-[#1f5c49]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-left font-semibold">Signal</th>
                    <th className="px-4 py-3 text-left font-semibold">Actors</th>
                    <th className="px-4 py-3 text-left font-semibold">Clicks</th>
                    <th className="px-4 py-3 text-left font-semibold">Behavior Orders</th>
                    <th className="px-4 py-3 text-left font-semibold">Delivered Orders</th>
                    <th className="px-4 py-3 text-left font-semibold">Click→Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Opportunity</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((row) => (
                    <tr key={String(row.productid)} className="border-t border-[#eef4f1]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.image ? (
                            <img
                              src={row.image}
                              alt={row.name}
                              className="h-10 w-10 rounded-lg border border-[#e4efe9] object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-[#eef8f3]" />
                          )}
                          <div>
                            <p className="font-semibold text-[#1f5c49]">{row.name}</p>
                            <p className="text-xs text-[#648578]">
                              {row.brand || "KhanCosmetics"} | {Number(row.star || 0).toFixed(1)}★
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#1f5c49] font-semibold">{numberFmt(row.signalscore)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.uniqueactors)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.clicks)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.behaviororders)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.deliveredorders)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{Number(row.clicktoorderrate || 0).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-[#1f5c49] font-semibold">{numberFmt(row.opportunityscore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {!loading && topEightCategories.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[#dce8e2] bg-[#f9fdfb] p-5">
            <h2 className="text-lg font-semibold text-[#1f5c49]">Top Category Affinity</h2>
            <p className="mt-1 text-sm text-[#5a746b]">Where user interest is strongest right now.</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {topEightCategories.map((row, idx) => (
                <div
                  key={`${row.category}-${idx}`}
                  className="rounded-xl border border-[#dce8e2] bg-white px-3 py-2 text-sm text-[#1f5c49]"
                >
                  {row.category} | Signal {numberFmt(row.signalscore)} | Orders {numberFmt(row.orders)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && topEightBrands.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[#dce8e2] bg-[#f9fdfb] p-5">
            <h2 className="text-lg font-semibold text-[#1f5c49]">Top Brand Affinity</h2>
            <p className="mt-1 text-sm text-[#5a746b]">Brands users currently engage with the most.</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {topEightBrands.map((row, idx) => (
                <div
                  key={`${row.brand}-${idx}`}
                  className="rounded-xl border border-[#dce8e2] bg-white px-3 py-2 text-sm text-[#1f5c49]"
                >
                  {row.brand || "unknown"} | Signal {numberFmt(row.signalscore)} | Orders{" "}
                  {numberFmt(row.orders)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && topFiveProducts.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[#dce8e2] bg-[#f9fdfb] p-5">
            <h2 className="text-lg font-semibold text-[#1f5c49]">Top 5 Products To Boost</h2>
            <p className="mt-1 text-sm text-[#5a746b]">
              High opportunity products for homepage slots, bundles, or flash campaigns.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {topFiveProducts.map((row, index) => (
                <Link
                  key={`${row.productid}-top`}
                  href={row.slug ? `/product/${row.slug}` : "#"}
                  className="rounded-xl border border-[#dce8e2] bg-white px-3 py-2 text-sm text-[#1f5c49] hover:border-[#1f5c49]"
                >
                  #{index + 1} {row.name} (Opportunity {numberFmt(row.opportunityscore)})
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }) => (
  <div className="rounded-2xl border border-[#dce8e2] bg-white p-5">
    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#5d7c71]">
      {icon}
      {title}
    </div>
    <p className="mt-2 text-3xl font-semibold text-[#1f5c49]">{value}</p>
  </div>
);

export default SuperAdminRecommendationInsights;
