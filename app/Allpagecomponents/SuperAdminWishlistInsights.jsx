"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { BarChart3, Heart, ShoppingBag, TrendingUp } from "lucide-react";
import SuperAdminNav from "../AllAdminpagecomponents/adminutils/SuperAdminNav";
import { serverurl } from "../utils/constants/serverurl";

const numberFmt = (value) => Number(value || 0).toLocaleString();

const SuperAdminWishlistInsights = () => {
  const router = useRouter();
  const { userData } = useSelector((state) => state.user);
  const user = userData?.user || userData?.data || userData || null;

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!user || user?.role !== "SuperAdmin") {
      router.replace("/superadmin-signin");
      return;
    }

    const fetchInsights = async () => {
      try {
        const { data } = await axios.get(`${serverurl}/wishlist/admin/insights`, {
          withCredentials: true,
        });
        if (data?.success) {
          setSummary(data.summary || null);
          setProducts(Array.isArray(data.topproducts) ? data.topproducts : []);
        }
      } catch (error) {
        setMessage(error?.response?.data?.message || "Could not load wishlist insights.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [router, user]);

  const topFive = useMemo(() => products.slice(0, 5), [products]);

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <SuperAdminNav />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-[#dce8e2] bg-[#f5fbf8] p-6">
          <div className="flex items-center gap-3 text-[#1f5c49]">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Wishlist Conversion Insights</h1>
          </div>
          <p className="mt-2 text-sm text-[#4b6b61]">
            Track what customers love most and which wishlisted products convert into delivered purchases.
          </p>
        </div>

        {message ? (
          <div className="mb-6 rounded-xl border border-[#dce8e2] bg-[#f4faf7] px-4 py-3 text-sm text-[#1f5c49]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#dce8e2] bg-white p-8 text-center text-sm uppercase tracking-[0.16em] text-[#1f5c49]">
            Loading Insights
          </div>
        ) : null}

        {!loading && summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Heart className="h-4 w-4" />} title="Wishlist Entries" value={numberFmt(summary.totalwishlistentries)} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} title="Unique Wishlisters" value={numberFmt(summary.totaluniquewishlisters)} />
            <StatCard icon={<ShoppingBag className="h-4 w-4" />} title="Converted Users" value={numberFmt(summary.totalconvertedwishlists)} />
            <StatCard icon={<BarChart3 className="h-4 w-4" />} title="Overall Conversion" value={`${Number(summary.overallconversionrate || 0).toFixed(2)}%`} />
          </div>
        ) : null}

        {!loading && products.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#dce8e2] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f5fbf8] text-[#1f5c49]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-left font-semibold">Wishlists</th>
                    <th className="px-4 py-3 text-left font-semibold">Unique Users</th>
                    <th className="px-4 py-3 text-left font-semibold">Delivered Orders</th>
                    <th className="px-4 py-3 text-left font-semibold">Converted Users</th>
                    <th className="px-4 py-3 text-left font-semibold">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((row) => (
                    <tr key={String(row.productid)} className="border-t border-[#eef4f1]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.image ? (
                            <img src={row.image} alt={row.name} className="h-10 w-10 rounded-lg border border-[#e4efe9] object-cover" loading="lazy" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-[#eef8f3]" />
                          )}
                          <div>
                            <p className="font-semibold text-[#1f5c49]">{row.name}</p>
                            <p className="text-xs text-[#648578]">{row.brand || "KhanCosmetics"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.wishlistcount)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.uniquewishlistusers)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.deliveredorders)}</td>
                      <td className="px-4 py-3 text-[#2f4d42]">{numberFmt(row.convertedwishlistusers)}</td>
                      <td className="px-4 py-3 text-[#1f5c49] font-semibold">{Number(row.conversionrate || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {!loading && topFive.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[#dce8e2] bg-[#f9fdfb] p-5">
            <h2 className="text-lg font-semibold text-[#1f5c49]">Top 5 Products To Prioritize</h2>
            <p className="mt-1 text-sm text-[#5a746b]">
              These products are getting the highest wishlist attention and are strong candidates for promotions.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {topFive.map((row, index) => (
                <Link
                  key={`${row.productid}-top`}
                  href={row.slug ? `/product/${row.slug}` : "#"}
                  className="rounded-xl border border-[#dce8e2] bg-white px-3 py-2 text-sm text-[#1f5c49] hover:border-[#1f5c49]"
                >
                  #{index + 1} {row.name} ({numberFmt(row.wishlistcount)} wishlists)
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

export default SuperAdminWishlistInsights;
