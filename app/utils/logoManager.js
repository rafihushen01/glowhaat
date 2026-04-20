import { serverurl } from "./constants/serverurl";

export const ACTIVE_LOGO_STORAGE_KEY = "glowhaat_active_logo_url";
export const ACTIVE_LOGO_EVENT = "glowhaat-active-logo-updated";

export const normalizeLogoUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/")) return `${serverurl}${raw}`;
  return `${serverurl}/${raw}`;
};

export const readCachedActiveLogo = () => {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem(ACTIVE_LOGO_STORAGE_KEY) || "").trim();
};

export const writeCachedActiveLogo = (logoUrl) => {
  if (typeof window === "undefined") return;
  const next = String(logoUrl || "").trim();
  if (!next) {
    window.localStorage.removeItem(ACTIVE_LOGO_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ACTIVE_LOGO_STORAGE_KEY, next);
};

export const broadcastActiveLogoUpdate = (logoUrl) => {
  if (typeof window === "undefined") return;
  const detail = { logoUrl: String(logoUrl || "").trim() };
  window.dispatchEvent(new CustomEvent(ACTIVE_LOGO_EVENT, { detail }));
};
