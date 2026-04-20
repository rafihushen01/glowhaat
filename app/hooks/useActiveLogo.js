"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { serverurl } from "../utils/constants/serverurl";
import {
  ACTIVE_LOGO_EVENT,
  ACTIVE_LOGO_STORAGE_KEY,
  normalizeLogoUrl,
  readCachedActiveLogo,
  writeCachedActiveLogo,
} from "../utils/logoManager";

const DEFAULT_FALLBACK_LOGO = "/khancosmeticslogo.png";

export const useActiveLogo = (fallbackLogo = DEFAULT_FALLBACK_LOGO) => {
  const [rawLogoUrl, setRawLogoUrl] = useState(() => readCachedActiveLogo());
  const [loading, setLoading] = useState(true);

  const applyLogo = useCallback((value) => {
    const next = String(value || "").trim();
    setRawLogoUrl(next);
    writeCachedActiveLogo(next);
  }, []);

  const refreshLogo = useCallback(async () => {
    try {
      const { data } = await axios.get(`${serverurl}/nav/logo/active`, { timeout: 15000 });
      const activeLogo = String(data?.logo?.logo || "").trim();
      applyLogo(activeLogo);
    } catch (error) {
      if (!readCachedActiveLogo()) {
        applyLogo("");
      }
    } finally {
      setLoading(false);
    }
  }, [applyLogo]);

  useEffect(() => {
    refreshLogo();
  }, [refreshLogo]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== ACTIVE_LOGO_STORAGE_KEY) return;
      applyLogo(event.newValue || "");
    };

    const handleCustomUpdate = (event) => {
      applyLogo(event?.detail?.logoUrl || "");
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ACTIVE_LOGO_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ACTIVE_LOGO_EVENT, handleCustomUpdate);
    };
  }, [applyLogo]);

  const logoUrl = useMemo(() => {
    const normalized = normalizeLogoUrl(rawLogoUrl);
    return normalized || fallbackLogo;
  }, [fallbackLogo, rawLogoUrl]);

  return {
    logoUrl,
    hasActiveLogo: Boolean(rawLogoUrl),
    loading,
    refreshLogo,
  };
};
