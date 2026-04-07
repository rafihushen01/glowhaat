"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const normalizeUser = (userData) => userData?.user || userData?.data || userData || null;

const useSuperAdminGuard = () => {
  const router = useRouter();
  const { userData, loading } = useSelector((state) => state.user);
  const user = normalizeUser(userData);
  const isSuperAdmin = String(user?.role || "").toLowerCase() === "superadmin";

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/superadmin-signin");
    }
  }, [isSuperAdmin, loading, router]);

  return {
    user,
    isSuperAdmin,
    isCheckingAuth: loading,
  };
};

export default useSuperAdminGuard;
